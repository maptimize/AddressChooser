
// Namespace
if (typeof Mapeed == 'undefined') {
  Mapeed = {};
}
Mapeed.Proxy = {};

// Proxy object to google map
Mapeed.Proxy.GoogleMap = function(element, callback, context) {
  var self = this;
  
  function createMap() {
    self.map = new GMap2(element);
    self.map.setCenter(new GLatLng(47, 1), 1);
    
    self.geocoder = new GClientGeocoder;
    callback.call(context, self.map);
  }
 
  // Google map is not loaded
  if (typeof GMap2 == 'undefined') {
    if (typeof google == 'undefined') {
      throw 'Not google map object found, check if you have include google map javascript'
    }
    else {
      google.load('maps', 2);
      google.setOnLoadCallback(createMap);
    }
  }
  else {
    createMap();
  }
};

Mapeed.Proxy.GoogleMap.prototype = (function() {
  // Add event listender on DOM element
  function addEventListener(source, event, object, method) {
    return GEvent.bindDom(source, event, object, method);
  }
  
  // Remove event listender on DOM element
  function removeEventListener(handle) {
    return GEvent.removeListener(handle);
  }
 
  // Look for placemarks for a specific address, return result by calling callback
  function getPlacemarks(address, callback, context) {
    this.geocoder.getLocations(address.join(', '), 
                               function(response){_onGeocodingCompleted(response, callback, context)});
  }
    
  function showPlacemark(placemark, showAddress) {
    var latLng = new GLatLng(placemark.lat, placemark.lng)
        zoom   = 17;
    if (placemark.accuracy < 7) zoom = 10;
    if (placemark.accuracy < 5) zoom = 5;
    this.map.setCenter(latLng, zoom);
    
    if (this.gmarker) {
      this.gmarker.setLatLng(latLng);
    }
    else {
      this.gmarker = new GMarker(latLng);
      this.map.addOverlay(this.gmarker);
    }
    
    if (showAddress)
      this.gmarker.openInfoWindowHtml(placemark.address.split(',').join('<br/>'));
  }
  
  function _onGeocodingCompleted(response, callback, context) {
    // Placemark found
    if (response.Status.code == 200) {
      var placemarks = [];
      for (var i=0; i < response.Placemark.length; i++) {
        var p = response.Placemark[i];
        placemarks.push({lat: p.Point.coordinates[1], lng: p.Point.coordinates[0], 
                         address: p.address, accuracy: p.AddressDetails.Accuracy});
      }
      callback.call(context, placemarks);
    }
    // Placemark not found
    else {
      callback.call(context, false);
    }
  }
  
  return {
    addEventListener:    addEventListener,
    removeEventListener: removeEventListener,
    getPlacemarks:       getPlacemarks,
    showPlacemark:       showPlacemark
  }
})();
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
                                      lat:             'lat',
                                      lng:             'lng',
                                      auto:             false,
                                      delay:            1000,
                                      showAddressOnMap: true,
                                      mapProxy:         Mapeed.Proxy.GoogleMap}

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

  // Initialize proxy with init callback
  this.mapProxy = new this.options.mapProxy($element(this.options.map), this.initialize, this);
};


// Instance methods
Mapeed.AddressForm.Widget.prototype = (function() {
  var $element = Mapeed.AddressForm.$element,
      addressKeys  = ['street', 'city', 'state', 'country'],
      locationKeys = ['lat', 'lng'];
      allKeys      = ['lat', 'lng', 'street', 'city', 'state', 'country'],
  
  
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
      return element.options[element.selectedIndex].getAttribute('name');
    }
  }

  // Initialize Widget
  function initialize() {
    var options  = this.options;
    
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
      var callback = function() {this.updateMap(this.options.delay)};
      for (var i = addressKeys.length-1; i>=0; --i) {
        var k = addressKeys[i];
        if (this[k]) this.mapProxy.addEventListener(this[k], eventForElement(this[k]), this, callback);
      }
    }
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

  function getMapProxy() {
    return this.mapProxy;
  }
  
  // Callback when placemarks are found
  function _placemarksReceived(placemarks) {
    if (placemarks) {
      this.mapProxy.showPlacemark(placemarks[0], this.options.showAddressOnMap);
      this.lat.value = placemarks[0].lat;
      this.lng.value = placemarks[0].lng;
    }
  }

  return {
    initialize:         initialize,
    updateMap:          updateMap,
    getAddress:         getAddress,
    getMapProxy:        getMapProxy
    
  }
})();