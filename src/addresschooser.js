/**
 *  == base ==
 *  The main section
**/

/** section: base
 * Mapeed
 **/

// Namespace
if (typeof Mapeed == 'undefined') {
  Mapeed = {};
}

/**
 * Mapeed.AddressChooser
**/
Mapeed.AddressChooser = {};

// Default options for AddressChooser Widget
Mapeed.AddressChooser.DefaultOptions = { map:             'map',
                                         street:          'street',
                                         zip:             'zip',
                                         city:            'city',
                                         state:           'state',
                                         country:         'country',
                                         lat:             'lat',
                                         lng:             'lng',
                                         icon:             null,
                                         auto:             true,
                                         delay:            300,
                                         showAddressOnMap: true,
                                         markerDraggable:  true,
                                         mapProxy:         Mapeed.Proxy.GoogleMap,
                                         onInitialized:    function() {} };



Mapeed.AddressChooser.AddressKeys  = ['street', 'city', 'state', 'country', 'zip'],
Mapeed.AddressChooser.AllKeys      = Mapeed.AddressChooser.AddressKeys.concat('lat', 'lng');
                                      
/** section: base
 * class Mapeed.AddressChooser.Widget
 *
 * Class to handle AddressChooser behavior
 **/
 
/** section: base
*  new Mapeed.AddressChooser.Widget([options])
**/
Mapeed.AddressChooser.Widget = function(options) {
  // Internal: Gets event to listen for an element. INPUT and SELECT are allowed
  function eventForElement(element) {
    return element.tagName == 'INPUT' ? 'keyup' : 'change';
  }
  
  function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  }
  
  // Internal: init callback when map is ready
  function init() {
    var options  = this.options,
        allKeys  = Mapeed.AddressChooser.AllKeys;
    
    // Get html elements for read/write values
    for (var i = allKeys.length-1; i>=0; --i){
      var k = allKeys[i];
      this[k] =  document.getElementById(options[k]);
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
    this.options.onInitialized(this);
  }
  
   
  // Apply default options
  this.options = extend({}, Mapeed.AddressChooser.DefaultOptions);
  extend(this.options, options);

  this.placemarks = [];
    
  // Initialize proxy with init callback
  this.element  = document.getElementById(this.options.map);
  this.mapProxy = new this.options.mapProxy(this.element, init, this);
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
  
  /** section: base
   *  Mapeed.AddressChooser.Widget#updateMap([event = null, delay = 300]) -> undefined
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
      // Fires addresschooser:suggests:started
      this.mapProxy.trigger(this.element, 'addresschooser:suggests:started');
      // Ask map proxy for getting placemarks
      this.mapProxy.getPlacemarks(this.getCurrentAddress(), _placemarksReceived, this);
    }
  }
  
  /** section: base
   *  Mapeed.AddressChooser.Widget#initMap([showAddress = false, zoom = 5]) -> undefined
   *  - showAddress (Boolean): if true display address in info window
   *  - zoom (Integer): map zoom (default 5)
   *  
   *  Initiliaze map with current form values. Use lat/lng values if defined, else get current address else c
   *  center on user location
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
  
  /** section: base
   *  Mapeed.AddressChooser.Widget#showPlacemark(index) -> undefined
   *  - index (Integer): index of suggested placemark, must be valid
   *  
   *  Displays suggested placemark on the map.
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
      
  /** section: base
   *  Mapeed.AddressChooser.Widget#getCurrentAddress() -> String
   *  
   *  Returns current address by getting input field values
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

  /** section: base
   *  Mapeed.AddressChooser.Widget#getMapProxy() -> Mapeed.Proxy
   *  
   *  Returns current map proxy
   **/
  function getMapProxy() {
    return this.mapProxy;
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
    // Fires addresschooser:suggests:found
    this.mapProxy.trigger(this.element, 'addresschooser:suggests:found', placemarks);
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
  
  /** section: base
   *  Mapeed.AddressChooser.Widget#getCity(placemark) -> String
   *  - placemark (Object): Placemark object depending on mapping system.
   *  
   *  Returns city name of a placemark if exists otherwise returns empty string
   **/
  

  /** section: base
   *  Mapeed.AddressChooser.Widget#getCountry(placemark) -> String
   *  
   *  Returns coutnry name of a placemark if exists otherwise returns empty string
   **/

  /** section: base
   *  Mapeed.AddressChooser.Widget#getZIP(placemark) -> String
   *  
   *  Returns zip code (postal code) of a placemark if exists otherwise returns empty string
   **/
   
   /** section: base
    *  Mapeed.AddressChooser.Widget#getStreet(placemark) -> String
    *  
    *  Returns street name of a placemark if exists otherwise returns empty string
    **/
   
   /** section: base
    *  Mapeed.AddressChooser.Widget#getAddress(placemark) -> String
    *  
    *  Returns full address of a placemark if exists otherwise returns empty string
    **/

   /** section: base
    *  Mapeed.AddressChooser.Widget#getMap() -> Map object depending on mapping system
    *  
    *  Returns map object used by mapping system
    **/
  
   /** section: base
    *  Mapeed.AddressChooser.Widget#setIcon(icon) -> undefined
    *  - icon (Object): icon object depending on mapping system
    *  
    *  Sets marker icon to overide default icon (depending on mapping system)
    **/
  
   /** section: base
    *  Mapeed.AddressChooser.Widget#getMap() -> Map object depending on mapping system
    *  
    *  Returns map object used by mapping system
    **/
 
   function addEventListener(eventName, callback) {
     return this.mapProxy.addEventListener(this.element, 'addresschooser:' + eventName, this, callback)
   }    
  
  // Publish public API
  return {
    initMap:                initMap,
    updateMap:              updateMap,
    showPlacemark:          showPlacemark,
                           
    setIcon:                _delegateToMapProxy('setIcon'),
    
    centerOnClientLocation: _delegateToMapProxy('centerOnClientLocation'),

    // Getters
    getMapProxy:            getMapProxy,
    getCurrentAddress:      getCurrentAddress,
    getMap:                 _delegateToMapProxy('getMap'),
    getCity:                _delegateToMapProxy('getCity'),
    getCountry:             _delegateToMapProxy('getCountry'),
    getZIP:                 _delegateToMapProxy('getZIP'),
    getStreet:              _delegateToMapProxy('getStreet'),
    getAddress:             _delegateToMapProxy('getAddress'),
    
    // Events
    addEventListener:       addEventListener,
    removeEventListener:    _delegateToMapProxy('removeEventListener'),
  }
})();