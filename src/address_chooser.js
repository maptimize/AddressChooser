/**
 *  == base ==
 *  The main section
**/

/** section: base
 * Base
 **/

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



Mapeed.AddressChooser.AddressKeys  = ['street', 'city', 'state', 'country', 'zip'],
Mapeed.AddressChooser.AllKeys      = Mapeed.AddressChooser.AddressKeys.concat('lat', 'lng');
                                      
/** section: base
 * class Mapeed.AddressChooser.Widget
 *
 * Class to handle AddressChooser behavior
 **/
 
/** section: base
*  new FX.Mapeed.AddressChooser.Widget([options])
**/
Mapeed.AddressChooser.Widget = function(options) {
  // Internal: Gets event to listen for an element. INPUT and SELECT are allowed
  function eventForElement(element) {
    return element.tagName == 'INPUT' ? 'keyup' : 'change';
  }
  
  // Internal: init callback when map is ready
  function init() {
    var options  = this.options,
        allKeys  = Mapeed.AddressChooser.AllKeys;
    
    // Get html elements for read/write values
    for (var i = allKeys.length-1; i>=0; --i){
      var k = allKeys[i];
      this[k] =  $element(options[k]);
    }
    
    // Check lat/lng required fields
    if (!this.lat || !this.lng) {
      throw 'lat and lng are required fields'
    }
    
    // Connect event listener for auto mode
    if (options.auto) {
      var callback    = function(event) {this.updateMap(event, this.options.delay)},
          addressKeys = Mapeed.AddressChooser.AddressKeys;
      for (var i = addressKeys.length-1; i>=0; --i) {
        var k = addressKeys[i];
        if (this[k]) this.mapProxy.addEventListener(this[k], eventForElement(this[k]), this, callback);
      }
    }
    this.callbacks.onInitialized(this);
  }
  

  var $element = Mapeed.AddressChooser.$element,
      $extend  = Mapeed.AddressChooser.$extend;
   
  // Apply default options
  this.options = $extend({}, Mapeed.AddressChooser.DefaultOptions);
  $extend(this.options, options);

  // Set empty callbacks
  this.callbacks = {
    onSuggestsSearch: function(){},
    onSuggestsFound:  function(){},
    onInitialized:    function(){}
  };
  this.placemarks = [];
    
  // Initialize proxy with init callback
  this.mapProxy = new this.options.mapProxy($element(this.options.map), init, this);
};


// Instance methods
Mapeed.AddressChooser.Widget.prototype = (function() {  
  // Internal: Gets value of an element. INPUT and SELECT are allowed
  function valueForElement(element) {
    if (element.tagName == 'INPUT') {
      return element.value;
    } 
    else {
      return element.options[element.selectedIndex].value;
    }
  }
  
  /** 
   *  Mapeed.AddressChooser.Widget#updateMap([event = null, delay = 300]) -> null
   *  - event (Event): Key event if called by keyup event
   *  - delay (Integer): Delay in ms to update map (default 300)
   *  
   *  Removes a handler that was installed using addEventListener
   **/
  function updateMap(event, delay) {    
    // Called by keyup event
    if (event) {
      // Do not handle keys like arrows, escape... just accept delete/backspace
      var key = event.keyCode;
      if (event.charCode || (key >0 && key < 47 && key != 8 && key != 46)) return;
    }
    // Needs to wait before updating the map
    if (delay) {
      var self = this;
      // Clear existing timer
      if (this.timeout) clearTimeout(this.timeout);
      
      // Starts a new timer
      this.timeout = setTimeout(function() {self.updateMap()}, delay || 300);
    }
    else {
      // Call onSuggestsSearch callback
      this.callbacks.onSuggestsSearch(this);
      // Ask map proxy for getting placemarks
      this.mapProxy.getPlacemarks(this.getCurrentAddress(), _placemarksReceived, this);
    }
  }
  
  /** 
   *  Mapeed.AddressChooser.Widget#initMap([showAddress = false, zoom = 5]) -> null
   *  - showAddress (Boolean): 
   *  - zoom (Integer): map zoom (default 5)
   *  
   *  TODO
   **/
  function initMap(showAddress, zoom) {
    if (this.lat.value && this.lng.value) {
      this.mapProxy.showMarker(this.lat.value, this.lng.value, zoom || 5, 
                               showAddress ? this.getCurrentAddress().join('<br/>') : false , _markerDragEnd, this)
    }
    else {
      var address = this.getCurrentAddress();
      if (address.length == 0) {
        this.centerOnClientLocation();
      } else {
        this.updateMap();
      }
    }
  }
  
  /** 
   *  Mapeed.AddressChooser.Widget#showPlacemark(index) -> null
   *  - index (Integer): 
   *  
   *  TODO
   **/
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
      
  /** 
   *  Mapeed.AddressChooser.Widget#getCurrentAddress() -> String
   *  - index (Integer): 
   *  
   *  Returns current address by getting input fields values
   **/
  function getCurrentAddress() {
    var address     = [], 
        addressKeys = Mapeed.AddressChooser.AddressKeys;

    for (var i = addressKeys.length-1; i>=0; --i) {
      var k = addressKeys[i];
      if (this[k]) {
        var value = valueForElement(this[k]);
        // Strip string
        value = value.replace(/^\s+/, '').replace(/\s+$/, '');
        if (value.length > 0) address.unshift(value);
      }
    }
    return address;
  }

  /** 
   *  Mapeed.AddressChooser.Widget#getMapProxy() -> Mapeed.Proxy
   *  
   *  Returns current map proxy
   **/
  function getMapProxy() {
    return this.mapProxy;
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
  
  // Internal: Callback when placemarks are found
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
  
  // Internal: Delegates method to map proxy
  function _delegateToMapProxy(method) {
    return function() {
      var args = arguments;
      return this.mapProxy[method].apply(this.mapProxy, arguments)
    }
  }
  
  // Internal: markerDragEnd callback. Called by map proxy when marker has been moved, update hidden lat/lng fields
  function _markerDragEnd(lat, lng) {
    this.lat.value = lat;
    this.lng.value = lng;
  }
  
  // Publish public API
  return {
    initMap:                initMap,
    updateMap:              updateMap,
    showPlacemark:          showPlacemark,
                           
    onInitialized:          onInitialized,
    onSuggestsSearch:       onSuggestsSearch,
    onSuggestsFound:        onSuggestsFound,
                           
    getMapProxy:            getMapProxy,
    getCurrentAddress:      getCurrentAddress,
    getMap:                 _delegateToMapProxy('getMap'),
    getCity:                _delegateToMapProxy('getCity'),
    getCountry:             _delegateToMapProxy('getCountry'),
    getZIP:                 _delegateToMapProxy('getZIP'),
    getStreet:              _delegateToMapProxy('getStreet'),
    getAddress:             _delegateToMapProxy('getAddress'),
    
    centerOnClientLocation: _delegateToMapProxy('centerOnClientLocation')
  }
})();