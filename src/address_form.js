// Namespace
if (typeof Mapeed == 'undefined') {
  Mapeed = {};
}
Mapeed.AddressForm = {};

// Utility function to get DOM element 
Mapeed.AddressForm.$element = function $element(element) {
  if (element instanceof Element) {
    return element;
  }
  else {
    return document.getElementById(element);
  }
}


// Default options for AddressForm Widget
Mapeed.AddressForm.DefaultOptions = { map:             'map',
                                      street:          'street',
                                      city:            'city',
                                      state:           'state',
                                      country:         'country',
                                      suggests:        'suggests',
                                      lat:             'lat',
                                      lng:             'lng',
                                      auto:             true,
                                      delay:            1000,
                                      showAddressOnMap: true,
                                      markerDraggable:  false,
                                      mapProxy:         Mapeed.Proxy.GoogleMap };

// Constructor
Mapeed.AddressForm.Widget = function(options) {
  var $element = Mapeed.AddressForm.$element;
 
  // Merge default options
  function $extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  }
  
  this.options = $extend({}, Mapeed.AddressForm.DefaultOptions);
  $extend(this.options, options);

  this.callbacks = {
    onSuggestChanged:  function(){},
    onInitialized:     function(){}
  };
    

  // Initialize proxy with init callback
  this.mapProxy = new this.options.mapProxy($element(this.options.map), this.initialize, this);
};


// Instance methods
Mapeed.AddressForm.Widget.prototype = (function() {
  var $element = Mapeed.AddressForm.$element,
      addressIDs  = ['street', 'city', 'state', 'country'],
      locationIDs = ['lat', 'lng'];
      allIDs      = ['lat', 'lng', 'street', 'city', 'state', 'country', 'suggests'];
  
  
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
      var callback = function() {this.updateMap(this.options.delay)};
      for (var i = addressIDs.length-1; i>=0; --i) {
        var k = addressIDs[i];
        if (this[k]) this.mapProxy.addEventListener(this[k], eventForElement(this[k]), this, callback);
      }
    }
    this.callbacks.onInitialized(this);
  }
  
  // Update map with current address
  function updateMap(delay) {
    if (delay) {
      var self = this;
      if (this.timeout) clearTimeout(this.timeout);
      
      this.timeout = setTimeout(function() {self.updateMap()}, delay);
    }
    else
      this.mapProxy.getPlacemarks(this.getAddress(), _placemarksReceived, this);
  }
      
  // Returns current address fields
  function getAddress() {
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
  
  function onSuggestChanged(callback) {
    this.callbacks.onSuggestChanged = callback;
    return this;
  }
  
  function onInitialized(callback) {
    this.callbacks.onInitialized = callback;
    return this;
  }
  
  // Callback when placemarks are found
  function _placemarksReceived(placemarks) {
    if (placemarks) {
      if (placemarks.length > 1 && this.suggests) {
        this.suggests.innerHTML = '';
        for (var i = 0; i < placemarks.length; i++) {
          var p   = placemarks[i],
             link = createLink(this.mapProxy.getAddress(p));
             
          link.p = p;
          this.suggests.appendChild(link);
          this.mapProxy.addEventListener(link, 'click', this, _selectPlacemark);
        }
        this.callbacks.onSuggestChanged(this, placemarks.length);
      }
      this.mapProxy.showPlacemark(placemarks[0], this.options.showAddressOnMap);
      this.lat.value = this.mapProxy.getLat(placemarks[0]);
      this.lng.value = this.mapProxy.getLng(placemarks[0]);
    }
  }
  
  function _selectPlacemark(event) {
    this.mapProxy.showPlacemark(event.target.p, this.options.showAddressOnMap);
  }

  return {
    initialize:         initialize,
    updateMap:          updateMap,
    getAddress:         getAddress,
    getMap:             getMap,
    getMapProxy:        getMapProxy,
    onInitialized:      onInitialized,
    onSuggestChanged:   onSuggestChanged
  }
})();