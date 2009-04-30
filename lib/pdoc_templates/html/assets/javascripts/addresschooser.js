
// Namespace
if (typeof Maptimize == 'undefined') {
  Maptimize = {};
}
Maptimize.Proxy = {};

/**
 * Maptimize.Proxy
**/

/** section: base
 *  class Maptimize.Proxy.GoogleMap
 *
 * Proxy class to handle Google Map API. As any map proxy for AddressChooser, it must implement public methods (some methods can be empty
 * but has to be implemented)
 *  All public methods are described on this page.
 *  
 **/

 /** section: base
  *  new Maptimize.Proxy.GoogleMap(element, callback, context)
  *  - element (Element): element used to create GMap2 object.
  *  - callback (Function): callback called when map is ready.
  *  - context (Object): calling context.
  *  
  *  Creates a new Maptimize.Proxy.GoogleMap object used by Maptimize.AddressChooser.Widget. 
  *  Calls _callback_ on _context_ when map is initiliazed and ready to use.
  *  By default map displays the entire world but this can be changed when callback is called.
  *  
  *  Google Map script must be included before this script.
  **/
  
Maptimize.Proxy.GoogleMap = function(element, callback, context) {
  var self = this;
  
  function createMap() {
    self.map = new GMap2(element);
    self.map.setCenter(new GLatLng(47, 1), 1);
    
    self.geocoder = new GClientGeocoder;
    callback.call(context, self.map);
  }
 
  // Google Map is not loaded
  if (typeof GMap2 == 'undefined') {
    if (typeof google == 'undefined') {
      throw 'Not Google Map object found, check if you have include Google Map javascript'
    }
    else {
      google.load('maps', 2);
      google.setOnLoadCallback(createMap);
    }
  }
  else {
    // Defer createMap to be executed after constructor call
    setTimeout(createMap, 10);
  }
};

Maptimize.Proxy.GoogleMap.prototype = (function() {
  /** 
   *  Maptimize.Proxy.GoogleMap#addEventListener(source, event, object, method) -> GEventListener
   *  - source (Object): source object.
   *  - event (String): event name.
   *  - object (Object): object used for calling method.
   *  - method (Function): function called when event is fired.
   *  
   *  Registers an invocation of the method on the given object as the event handler 
   *  for a custom event on the source object. 
   *  Returns a handle that can be used to eventually deregister the handler.
   **/
  function addEventListener(source, event, object, method) {
    return GEvent.bindDom(source, event, object, method);
  }
  
  /** 
   *  Maptimize.Proxy.GoogleMap#removeEventListener(handle) -> undefined
   *  - handle (Object): handle get by addEventListener.
   *  
   *  Removes a handler that was installed by addEventListener.
   **/
  function removeEventListener(handle) {
    GEvent.removeListener(handle);
  }
 
 
  /** 
   *  Maptimize.Proxy.GoogleMap#trigger(source, event [, args]) -> undefined
   *  - source (Object): source object
   *  - event (String): event name
   *  
   *  Fires a custom event on the source object. 
   *  All remaining optional arguments after event are passed in turn as arguments to the event handler functions.
   **/
  function trigger() {
    GEvent.trigger.apply(this, arguments);
  }
  
  /**  
   *  Maptimize.Proxy.GoogleMap#getPlacemarks(address, callback, context) -> null
   *  - address (String): address to search
   *  - callback (Function): callback called when search is done. Callback will receive a placemarks array as first argument
   *  - context (Object): calling context
   *  
   *  Looks for placemarks for a specific address, results are retreived through a callback: function(placemarks) called
   *  after receiving Google Map response.
   **/
  function getPlacemarks(address, callback, context) {
    this.geocoder.getLocations(address.join(', '), 
                               function(response){ _onGeocodingCompleted(response, callback, context)});
  }
   
  /** 
   *  Maptimize.Proxy.GoogleMap#getMap() -> GMap2
   *  
   *  Returns Google Map object
   **/
  function getMap() {
    return this.map;
  } 
  
  /** 
   *  Maptimize.Proxy.GoogleMap#getAddress(placemark) -> String
   *  - placemark (Object): object representing Google Map placemark (get by calling getPlacemarks)
   *  
   *  Returns full address of a placemark.
   **/
  function getAddress(placemark) {
    return placemark.address;
  }
   
  /** 
   *  Maptimize.Proxy.GoogleMap#getCity(placemark) -> String
   *  - placemark (Object): object representing Google Map placemark (get by calling getPlacemarks)
   *  
   *  Returns city name of a placemark. Returns an empty string if not found.
   **/
  function getCity(placemark) {
    return _getPlacemarkAttribute(placemark, 'LocalityName');
  }

  /** 
   *  Maptimize.Proxy.GoogleMap#getCountry(placemark) -> String
   *  - placemark (Object): object representing Google Map placemark (get by calling getPlacemarks)
   *  
   *  Returns country name of a placemark. Returns an empty string if not found.
   **/
  function getCountry(placemark) {
    return _getPlacemarkAttribute(placemark, 'CountryName');
  }
    
  /** 
   *  Maptimize.Proxy.GoogleMap#getZIP(placemark) -> String
   *  - placemark (Object): object representing Google Map placemark (get by calling getPlacemarks)
   *  
   *  Returns ZIP (postal code) name of a placemark. Returns an empty string if not found.
   **/
  function getZIP(placemark) {
    return _getPlacemarkAttribute(placemark, 'PostalCodeName');
  }
  
  /** 
   *  Maptimize.Proxy.GoogleMap#getStreet(placemark) -> String
   *  - placemark (Object): object representing Google Map placemark (get by calling getPlacemarks)
   *  
   *  Returns street (address without zip, city, country) of a placemark. Returns an empty string if not found.
   **/
  function getStreet(placemark) {
    return _getPlacemarkAttribute(placemark, 'ThoroughfareName');
  }
 
  /** 
   *  Maptimize.Proxy.GoogleMap#getLat(placemark) -> Number
   *  - placemark (Object): object representing Google Map placemark (get by calling getPlacemarks)
   *  
   *  Returns latitude of a placemark.
   **/
  function getLat(placemark) {
    return placemark.Point.coordinates[1];
  }
   
  /** 
   *  Maptimize.Proxy.GoogleMap#getLng(placemark) -> Number
   *  - placemark (Object): object representing Google Map placemark (get by calling getPlacemarks)
   *  
   *  Returns longitude of a placemark.
   **/
  function getLng(placemark) {
    return placemark.Point.coordinates[0];
  }
   
  /** 
   *  Maptimize.Proxy.GoogleMap#setIcon(icon) -> undefined
   *  - icon (GIcon): marker icon
   *  
   *  Sets icon for marker displayed on the map. Must be called before displaying any marker on the map.
   **/
  function setIcon(icon) {
    this.icon = icon;
  }
  
  /** 
   *  Maptimize.Proxy.GoogleMap#showPlacemark(tagName[, showAddress = null, callback = null, context = null ]) -> undefined
   *  - placemark (Object): object representing Google Map placemark (get by calling getPlacemarks).
   *  - showAddress (Boolean): if true, displays address on the map inside an info window.
   *  - callback (Function): callback called when marker has been dragged. Callback will received lat and lng as arguments.
   *  - context (Object): calling context for callback
   *  
   *  Displays placemark on the map.
   **/
  function showPlacemark(placemark, showAddress, callback, context) {
    var accuracy = placemark.AddressDetails.Accuracy,
        address  = showAddress ? placemark.address.split(',').join('<br/>') : false,
        zoom = 1;
    if      (accuracy >= 9)  zoom = 17;
    else if (accuracy >= 6 ) zoom = 14;
    else if (accuracy >= 4)  zoom = 12;
    else if (accuracy >  1)  zoom = 6;
    else                     zoom = 3;

    this.showMarker(placemark.Point.coordinates[1], placemark.Point.coordinates[0], zoom, address, callback, context)
  }
  
  /** 
   *  Maptimize.Proxy.GoogleMap#showMarker(lat, lng, zoom[, address = null, callback = null, context = null]) -> undefined
   *  - lat (Float): marker's latitude.
   *  - lng (Float): marker's longitude.
   *  - zoom (Integer): map zoom.
   *  - address (String): address to display inside info window.
   *  - callback (Function): callback called when marker has benn drgged. Callback will received lat and lng as arguments.
   *  - context (Object): calling context for callback.
   *  
   *  Displays placemark on the map and centers map on marker location.
   *  If an address is specified, marker will show this address in an info window
   **/
  function showMarker(lat, lng, zoom, address, callback, context) {
    var latLng = new GLatLng(lat, lng);
    this.map.setCenter(latLng, zoom);
    
    if (this.marker) {
      this.marker.setLatLng(latLng);
      this.marker.show();
    }
    else {
      this.marker = new GMarker(latLng, {draggable: true, icon: this.icon});
      GEvent.bind(this.marker, 'dragstart', this, _startMarkerDrag);
      GEvent.bind(this.marker, 'dragend', this, _endMarkerDrag);
      this.map.addOverlay(this.marker);
    }

    this.draggableCallback = callback;
    this.draggableContext  = context;
    if (this.draggableCallback) {
      this.marker.enableDragging();
    }
    else {
      this.marker.disableDragging();
    }
    if (address)
      this.marker.openInfoWindowHtml(address);
  }
  
  /** 
   *  Maptimize.Proxy.GoogleMap#hidePlacemark() -> undefined
   *  
   *  Hides placemark from the map, close info window if needed
   **/
  function hidePlacemark() {
    if (this.marker) {
      this.marker.closeInfoWindow();
      this.marker.hide();
    }
  }
  
  /** 
   *  Maptimize.Proxy.GoogleMap#centerOnClientLocation([zoom]) -> undefined
   *  - zoom (Integer): map zoom, default 8
   *  
   *  Center map on user location (based on its IP) if available
   **/
  function centerOnClientLocation(zoom) {
    var clientLocation = google && google.loader ? google.loader.ClientLocation : null;
    if (clientLocation) {
      this.map.setCenter(new GLatLng(clientLocation.latitude, clientLocation.longitude), zoom || 8);
    }
  }
  
  // Intern callback when geocoding has been done (should have placemarks)
  function _onGeocodingCompleted(response, callback, context) {
    // Placemark(s) found
    if (response.Status.code == 200) {
      callback.call(context, response.Placemark);
    }
    // Placemark not found
    else {
      callback.call(context, false);
    }
  }
  
  // Intern callback when marker dragging starts (close info window)
  function _startMarkerDrag() {
    this.marker.closeInfoWindow();
  }
  
  // Intern callback when marker dragging ends.
  function _endMarkerDrag(latLng) {
    this.draggableCallback.call(this.draggableContext,latLng.lat(), latLng.lng());
  }

  // Parses placemark object as Google do not provide any API for that.
  // Information is inside placemark subfield but depends on accuracy, so we need to parse all the tree 
  // to find information
  // Returns null if not found
  function _getPlacemarkAttribute(placemark, field) {
    for (f in placemark) {
      if (f == field) {
        return placemark[f];
      }
      else {
        if (typeof placemark[f] == 'object') {
          return _getPlacemarkAttribute(placemark[f], field);
        }
      }
    }
    return '';
  }  
  
  // Publish public API
  return {                
    addEventListener:       addEventListener,
    removeEventListener:    removeEventListener,
    trigger:                trigger,
    getMap:                 getMap,
    
    centerOnClientLocation: centerOnClientLocation,
    
    setIcon:                setIcon,
    getPlacemarks:          getPlacemarks,
    showPlacemark:          showPlacemark,
    showMarker:             showMarker,
    hidePlacemark:          hidePlacemark,
                            
    getLat:                 getLat,
    getLng:                 getLng,
                            
    getAddress:             getAddress,
    getCity:                getCity,
    getCountry:             getCountry,
    getZIP:                 getZIP,
    getStreet:              getStreet
  }
})();
/**
 *  == base ==
 *  The main section
**/

/** section: base
 * Maptimize
 **/

// Namespace
if (typeof Maptimize == 'undefined') {
  Maptimize = {};
}

/**
 * Maptimize.AddressChooser
**/
Maptimize.AddressChooser = {};

// Default options for AddressChooser Widget
Maptimize.AddressChooser.DefaultOptions = { map:             'map',
                                         lat:             'lat',
                                         lng:             'lng',
                                         street:          'street',
                                         zip:             'zip',
                                         city:            'city',
                                         state:           'state',
                                         country:         'country',
                                         spinner:          false,
                                         icon:             null,
                                         auto:             true,
                                         delay:            300,
                                         showAddressOnMap: true,
                                         markerDraggable:  true,
                                         mapProxy:         Maptimize.Proxy.GoogleMap,
                                         onInitialized:    function() {} };

// Internal options keys for input field
Maptimize.AddressChooser.AddressKeys  = ['street', 'city', 'state', 'country', 'zip'],
                                      
/** section: base
 * class Maptimize.AddressChooser.Widget
 *
 * Class to add "AddressChooser" behavior to a form. HTML markup must be present in DOM (nothing is generated by this object).
 * Supported input fields are: input[type=text], select and textarea
 *  
 * It creates a Map object depending on mapping system on *map* DOM element. When map is ready *onInitialized* id called. In this callback map
 * can be customized.
 *  
 * There are also 2 events fired by this object:
 *
 *  **suggests:started**: When a request is send to mapping system to get placemarks suggests from current address.
 *  **suggests:found**: When a response is received by mapping system.
 *  
 *  Default options are (required fields are in bold):
 *  <table class='options'>
 *    <tr>
 *      <th>Name</th>
 *      <th>Default value</th>
 *      <th>Description</th>
 *    </tr>
 *    <tr>
 *      <td>**map**</td>
 *      <td>map</td>
 *      <td>DOM id of map element</td>
 *    </tr>
 *    <tr>
 *      <td>**lat**</td>
 *      <td>lat</td>
 *      <td>DOM id of lat field (required)</td>
 *    </tr>
 *    <tr>
 *      <td>**lng**</td>
 *      <td>lng</td>
 *      <td>DOM id of lng field (required)</td>
 *    </tr>
 *    <tr>
 *      <td>street</td>
 *      <td>street</td>
 *      <td>DOM id of street field,can be use as unique address field</td>
 *    </tr>
 *    <tr>
 *      <td>city</td>
 *      <td>city</td>
 *      <td>DOM id of city field</td>
 *    </tr>
 *    <tr>
 *      <td>zip</td>
 *      <td>zip</td>
 *      <td>DOM id of zip field</td>
 *    </tr>
 *    <tr>
 *      <td>state</td>
 *      <td>state</td>
 *      <td>DOM id of state field</td>
 *    </tr>
 *    <tr>
 *      <td>country</td>
 *      <td>country</td>
 *      <td>DOM id of country field</td>
 *    </tr>
 *    <tr>
 *      <td>spinner</td>
 *      <td>false</td>
 *      <td>DOM id of a spinner element shown when a suggest search starts and hidden when a response is received</td>
 *    </tr>
 *    <tr>
 *      <td>icon</td>
 *      <td>null</td>
 *      <td>Icon object (depending on map system) to override default icon</td>
 *    </tr>
 *    <tr>
 *      <td>auto</td>
 *      <td>true</td>
 *      <td>Update map while typing</td>
 *    </tr>
 *    <tr>
 *      <td>delay</td>
 *      <td>300</td>
 *      <td>Delay in milliseconds before after typing address before searching for placemarks</td>
 *    </tr>
 *    <tr>
 *      <td>showAddressOnMap</td>
 *      <td>true</td>
 *      <td>Display current selected address in info window</td>
 *    </tr>
 *    <tr>
 *      <td>markerDraggable</td>
 *      <td>true</td>
 *      <td>Make marker on map draggable to move its position if mapping system has this feature</td>
 *    </tr>
 *    <tr>
 *      <td>mapProxy</td>
 *      <td>Maptimize.Proxy.GoogleMap</td>
 *      <td>Map proxy object. This allows to change mapping system. see Map.Proxy.GoogleMap to get information on how to create your own proxy.</td>
 *    </tr>
 *    <tr>
 *      <td>onInitialized</td>
 *      <td>empty function</td>
 *      <td>Callback called when the widget is ready (when map is ready to use).</td>
 *    </tr>
 *  </table>  
 *  
 **/
 
/** section: base
*  new Maptimize.AddressChooser.Widget([options])
*  - options (Hash): override default options.
*  
*  Creates a new Maptimize.AddressChooser widget to add map based behavior to a regular address form.
*  
**/
Maptimize.AddressChooser.Widget = function(options) {
  // Internal: Gets event to listen for an element. INPUT, TEXTAREA, and SELECT are allowed
  function eventForElement(element) {
    return element.tagName == 'INPUT' || element.tagName == 'TEXTAREA' ? 'keyup' : 'change';
  }
  
  function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
  }
  
  function updateMap(event, delay) {
    // Do not handle keys like arrows, escape... just accept delete/backspace
    if (event) {
      var key = event.keyCode;
      if (event.charCode || (key >0 && key < 47 && key != 8 && key != 46)) return;
    }

    // Needs to wait before updating the map
    if (delay) {
      var self = this;
      // Clear existing timer
      if (this.timeout) clearTimeout(this.timeout);

      // Starts a new timer
      this.timeout = setTimeout(function() {updateMap.call(self)}, delay);
    }
    else {
      this.updateMap();
    }
  }
  
  // Internal: init callback when map is ready
  function init() {
    var options  = this.options,
        allKeys  = Maptimize.AddressChooser.AddressKeys.concat('lat', 'lng', 'spinner');
    
    // Get html elements for read/write values
    for (var i = allKeys.length-1; i>=0; --i){
      var k = allKeys[i];
      this[k] =  document.getElementById(options[k]);
    }
    
    // Check lat/lng required fields
    var map = document.getElementById(this.options.map);
    if (!this.lat || !this.lng || !map) {
      throw 'lat/lng/map are required options and valid DOM elements.'
    }
    
    // Connect event listener for auto mode
    if (options.auto) {
      var callback    = function(event) {updateMap.call(this, event, this.options.delay)},
          addressKeys = Maptimize.AddressChooser.AddressKeys;
      for (var i = addressKeys.length-1; i>=0; --i) {
        var k = addressKeys[i];
        if (this[k]) this.mapProxy.addEventListener(this[k], eventForElement(this[k]), this, callback);
      }
    }
    this.options.onInitialized(this);
  }
  
   
  // Apply default options
  this.options = extend({}, Maptimize.AddressChooser.DefaultOptions);
  extend(this.options, options);

  this.placemarks = [];
    
  // Initialize proxy with init callback
  this.element  = document.getElementById(this.options.map);
  this.mapProxy = new this.options.mapProxy(this.element, init, this);
};


// Instance methods
Maptimize.AddressChooser.Widget.prototype = (function() {  
  // Internal: Gets value of an element. INPUT, TEXTAREA, and SELECT are allowed
  function valueForElement(element) {
    if (element.tagName == 'INPUT' || element.tagName == 'TEXTAREA') {
      return element.value;
    } 
    else {
      return element.options[element.selectedIndex].value;
    }
  }
  
  /** section: base
   *  Maptimize.AddressChooser.Widget#updateMap() -> undefined
   *  
   *  fires addresschooser:suggests:started, addresschooser:suggests:found
   *  
   *  Removes a handler that was installed using addEventListener
   **/
  function updateMap(event, delay) {    
    if (this.spinner) this.spinner.style.display = 'block';
    
    // Fires addresschooser:suggests:started
    this.mapProxy.trigger(this.element, 'addresschooser:suggests:started');
    // Ask map proxy for getting placemarks
    this.mapProxy.getPlacemarks(this.getCurrentAddress(), _placemarksReceived, this);
  }
  
  /** section: base
   *  Maptimize.AddressChooser.Widget#initMap([showAddress = false, zoom = 5]) -> undefined
   *  - zoom (Integer): map zoom (default 5)
   *  
   *  Initiliazes map with current form values. Use lat/lng values if defined, else get current address from input fields.
   *  If address is empty then center map on user location.
   **/
  function initMap(zoom) {
    if (this.lat.value && this.lng.value) {
      this.mapProxy.showMarker(this.lat.value, this.lng.value, zoom || 5, 
                               this.options.showAddressOnMap ? this.getCurrentAddress().join('<br/>') : false , _markerDragEnd, this)
    }
    else {
      var address = this.getCurrentAddress();
      if (address.length == 0) {
        this.centerOnClientLocation(zoom || 5);
      } else {
        this.updateMap();
      }
    }
  }
  
  /** section: base
   *  Maptimize.AddressChooser.Widget#showPlacemark(index) -> undefined
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
   *  Maptimize.AddressChooser.Widget#getCurrentAddress() -> String
   *  
   *  Returns current address from input field values
   **/
  function getCurrentAddress() {
    var address     = [], 
        addressKeys = Maptimize.AddressChooser.AddressKeys;

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
   *  Maptimize.AddressChooser.Widget#getMapProxy() -> Maptimize.Proxy
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
    if (this.spinner) this.spinner.style.display = 'none';
    
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
   *  Maptimize.AddressChooser.Widget#getCity(placemark) -> String
   *  - placemark (Object): Placemark object depending on mapping system.
   *  
   *  Returns city name of a placemark if exists else returns empty string
   **/
  

  /** section: base
   *  Maptimize.AddressChooser.Widget#getCountry(placemark) -> String
   *  
   *  Returns country name of a placemark if exists else returns empty string
   **/

  /** section: base
   *  Maptimize.AddressChooser.Widget#getZIP(placemark) -> String
   *  
   *  Returns zip code (postal code) of a placemark if exists else returns empty string
   **/
   
   /** section: base
    *  Maptimize.AddressChooser.Widget#getStreet(placemark) -> String
    *  
    *  Returns street name of a placemark if exists else returns empty string
    **/
   
   /** section: base
    *  Maptimize.AddressChooser.Widget#getAddress(placemark) -> String
    *  
    *  Returns full address of a placemark if exists else returns empty string
    **/

   /** section: base
    *  Maptimize.AddressChooser.Widget#getMap() -> Map object depending on mapping system
    *  
    *  Returns map object used by mapping system
    **/
  
   /** section: base
    *  Maptimize.AddressChooser.Widget#setIcon(icon) -> undefined
    *  - icon (Object): icon object depending on mapping system
    *  
    *  Sets marker icon to override default icon (depending on mapping system)
    **/
  
   /** section: base
    *  Maptimize.AddressChooser.Widget#getMap() -> Map object depending on mapping system
    *  
    *  Returns map object used by mapping system
    **/
 
    /** section: base
     *  Maptimize.AddressChooser.Widget#addEventListener() -> Event Listener depending on mapping system.
     *  
     *  Returns a handle that can be used to eventually deregister the handler.
     **/
   function addEventListener(eventName, callback) {
     return this.mapProxy.addEventListener(this.element, 'addresschooser:' + eventName, this, callback)
   }    
  
   /** section: base
     *  Maptimize.AddressChooser.Widget#removeEventListener(handle) -> undefined
     *  - handle (Object): handle returns by addEventListener.
     *  
     *  Removes an handler that has been created by addEventListener.
     **/
  
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
    removeEventListener:    _delegateToMapProxy('removeEventListener')
  }
})();

// Backward compatibility
Mapeed = Maptimize;