// Namespace
if (typeof Mapeed == 'undefined') {
  Mapeed = {};
}
Mapeed.AddressChooser = {};

// Utility function to get DOM element 
Mapeed.AddressChooser.$element = function $element(element) {
  return document.getElementById(element);
}

// Utility function to copy property from source to destination object
Mapeed.AddressChooser.$extend = function(destination, source) {
  for (var property in source)
    destination[property] = source[property];
  return destination;
}

// Default options for AddressChooser Widget
Mapeed.AddressChooser.DefaultOptions = { map:             'map',
                                         street:          'street',
                                         zip:             'zip',
                                         city:            'city',
                                         state:           'state',
                                         country:         'country',
                                         lat:             'lat',
                                         lng:             'lng',
                                         auto:             true,
                                         delay:            300,
                                         showAddressOnMap: true,
                                         markerDraggable:  true,
                                         mapProxy:         Mapeed.Proxy.GoogleMap };
                                      
// Constructor
Mapeed.AddressChooser.Widget = function(options) {
  var $element = Mapeed.AddressChooser.$element,
      $extend  = Mapeed.AddressChooser.$extend;
   
  this.options = $extend({}, Mapeed.AddressChooser.DefaultOptions);
  $extend(this.options, options);

  this.callbacks = {
    onSuggestsSearch: function(){},
    onSuggestsFound:  function(){},
    onInitialized:    function(){}
  };
  this.placemarks = [];
    
  // Initialize proxy with init callback
  this.mapProxy = new this.options.mapProxy($element(this.options.map), this.initialize, this);
};


// Instance methods
Mapeed.AddressChooser.Widget.prototype = (function() {
  var $element = Mapeed.AddressChooser.$element,
      addressIDs  = ['street', 'city', 'state', 'country', 'zip'],
      locationIDs = ['lat', 'lng'];
      allIDs      = ['lat', 'lng', 'street', 'city', 'state', 'country', 'zip'];
  
  
  // Get event to listen for an element. INPUT and SELECT are allowed
  function eventForElement(element) {
    return element.tagName == 'INPUT' ? 'keypress' : 'change';
  }
  
  // Get value of an element. INPUT and SELECT are allowed
  function valueForElement(element) {
    if (element.tagName == 'INPUT') {
      return element.value;
    } 
    else {
      return element.options[element.selectedIndex].value;
    }
  }
  
  function createLink(text) {
    var a = document.createElement('a');
    a.href = '#';
    a.innerHTML = text;
    return a;
  }

  // Initialize Widget
  function initialize() {
    var options  = this.options;
    
    // Get html elements for read/write values
    for (var i = allIDs.length-1; i>=0; --i){
      var k = allIDs[i];
      this[k] =  $element(options[k]);
    }
    
    // Check lat/lng required fields
    if (!this.lat || !this.lng) {
      throw 'lat and lng are required fields'
    }
    
    // Connect event listener for auto mode
    if (options.auto) {
      var callback = function(event) {this.updateMap(event, this.options.delay)};
      for (var i = addressIDs.length-1; i>=0; --i) {
        var k = addressIDs[i];
        if (this[k]) this.mapProxy.addEventListener(this[k], eventForElement(this[k]), this, callback);
      }
    }
    this.callbacks.onInitialized(this);
  }
  
  // Update map with current address
  function updateMap(event, delay) {
    if (event) {
      // Do not handle keys like arrows, escape... just accept delete/backspace
      var key = event.keyCode;
      if (key >0 && key != 8 && key != 46) return;
    }
    if (delay) {
      var self = this;
      if (this.timeout) clearTimeout(this.timeout);
      
      this.timeout = setTimeout(function() {self.updateMap()}, delay);
    }
    else {
      this.callbacks.onSuggestsSearch(this);
      this.mapProxy.getPlacemarks(this.getCurrentAddress(), _placemarksReceived, this);
    }
  }
  
  function showPlacemark(index) {
    if (this.placemarks && index< this.placemarks.length) {
      var placemark = this.placemarks[index];
      if (this.options.markerDraggable) {
        this.mapProxy.showPlacemark(placemark, this.options.showAddressOnMap, _markerDragEnd, this);
      }
      else {
        this.mapProxy.showPlacemark(placemark, this.options.showAddressOnMap);
      }
      this.lat.value = this.mapProxy.getLat(placemark);
      this.lng.value = this.mapProxy.getLng(placemark);
    }
  }
      
  // Returns current address fields
  function getCurrentAddress() {
    var address = [];

    for (var i = addressIDs.length-1; i>=0; --i) {
      var k = addressIDs[i];
      if (this[k]) {
        var value = valueForElement(this[k]);
        // Strip string
        value = value.replace(/^\s+/, '').replace(/\s+$/, '');
        if (value.length > 0) address.unshift(value);
      }
    }
    return address;
  }

  function getMapProxy() {
    return this.mapProxy;
  }
  
  function getMap() {
    return this.mapProxy.getMap();
  }
  
  function onSuggestsFound(callback) {
    this.callbacks.onSuggestsFound = callback;
    return this;
  }
  
  function onSuggestsSearch(callback) {
    this.callbacks.onSuggestsSearch = callback;
    return this;
  }
  
  function onInitialized(callback) {
    this.callbacks.onInitialized = callback;
    return this;
  }
  
  // Callback when placemarks are found
  function _placemarksReceived(placemarks) {
    this.placemarks = placemarks;
    if (placemarks) {
      this.showPlacemark(0);      
    }
    else {
      this.lat.value = '';
      this.lng.value = '';
      
      this.mapProxy.hidePlacemark();
    }
    this.callbacks.onSuggestsFound(this, placemarks);
  }
  
  function _delegateToMapProxy(method) {
    return function(placemark) {return this.mapProxy[method](placemark)}
  }
  
  function _markerDragEnd(lat, lng) {
    this.lat.value = lat;
    this.lng.value = lng;
  }
  
  return {
    initialize:         initialize,
    updateMap:          updateMap,
    showPlacemark:      showPlacemark,
    
    onInitialized:      onInitialized,
    onSuggestsSearch:   onSuggestsSearch,
    onSuggestsFound:    onSuggestsFound,
                       
    getMap:             getMap,
    getMapProxy:        getMapProxy,
    getCurrentAddress:  getCurrentAddress,
    getCity:            _delegateToMapProxy('getCity'),
    getCountry:         _delegateToMapProxy('getCountry'),
    getZIP:             _delegateToMapProxy('getZIP'),
    getStreet:          _delegateToMapProxy('getStreet'),
    getAddress:         _delegateToMapProxy('getAddress')
  }
})();