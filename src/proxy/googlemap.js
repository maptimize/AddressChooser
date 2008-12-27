/**
 *  == proxy ==
 *  The proxy section
**/

// Namespace
if (typeof Mapeed == 'undefined') {
  Mapeed = {};
}
Mapeed.Proxy = {};

/** section: proxy
 *  class Mapeed.Proxy.GoogleMap
 *
 * Proxy class to handle Google Map API
 *  
 **/

 /** section: proxy
  *  new Mapeed.Proxy.GoogleMap(element, callback, context)
  *  - element (Element): element used to create GMap2 object
  *  - callback (Function): callback called when map is ready
  *  - context (Object): calling context
  *  
  *  Creates a new Mapeed.Proxy.GoogleMap object used by Mapeed.AddressChooser.Plugin. 
  *  Calls calling on context when map is initiliazed and ready to use
  *  By default map displays the world but it can be changed when callback is called
  **/
  
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
  /** 
   *  Mapeed.Proxy.GoogleMap#addEventListener(source, event, object, method) -> GEventListener
   *  - source (Object): source object
   *  - event (String): event name
   *  - object (Object): object used for calling method
   *  - method (Function): function called when event is fire
   *  
   *  Registers an invocation of the method on the given object as the event handler 
   *  for a custom event on the source object. 
   *  Returns a handle that can be used to eventually deregister the handler
   **/
  function addEventListener(source, event, object, method) {
    return GEvent.bindDom(source, event, object, method);
  }
  
  /** 
   *  Mapeed.Proxy.GoogleMap#removeEventListener(handle) -> null
   *  - handle (Object): handle returns by addEventListener
   *  
   *  Removes a handler that was installed using addEventListener
   **/
  function removeEventListener(handle) {
    GEvent.removeListener(handle);
  }
 
  /** 
   *  Mapeed.Proxy.GoogleMap#getPlacemarks(address, callback, context) -> null
   *  - address (String): address to search
   *  - callback (Function): callback called when search is done. Callback will received a placemarks array as first argument
   *  - context (Object): calling context
   *  
   *  Looks for placemarks for a specific address, results are retreived through a callback: function(placemarks)
   **/
  function getPlacemarks(address, callback, context) {
    this.geocoder.getLocations(address.join(', '), 
                               function(response){ _onGeocodingCompleted(response, callback, context)});
  }
   
  /** 
   *  Mapeed.Proxy.GoogleMap#getMap() -> GMap2
   *  
   *  Returns google map object
   **/
  function getMap() {
    return this.map;
  } 
  
  /** 
   *  Mapeed.Proxy.GoogleMap#getMap(placemark) -> String
   *  - placemark (Object): object representing google map placemark (get by calling getPlacemarks)
   *  
   *  Returns full address of a placemark
   **/
  function getAddress(placemark) {
    return placemark.address;
  }
   
  /** 
   *  Mapeed.Proxy.GoogleMap#getCity(placemark) -> String
   *  - placemark (Object): object representing google map placemark (get by calling getPlacemarks)
   *  
   *  Returns city name of a placemark. Returns an empty string if not found
   **/
  function getCity(placemark) {
    return _getPlacemarkAttribute(placemark, 'LocalityName');
  }

  /** 
   *  Mapeed.Proxy.GoogleMap#getCountry(placemark) -> String
   *  - placemark (Object): object representing google map placemark (get by calling getPlacemarks)
   *  
   *  Returns country name of a placemark. Returns an empty string if not found
   **/
  function getCountry(placemark) {
    return _getPlacemarkAttribute(placemark, 'CountryName');
  }
    
  /** 
   *  Mapeed.Proxy.GoogleMap#getZIP(placemark) -> String
   *  - placemark (Object): object representing google map placemark (get by calling getPlacemarks)
   *  
   *  Returns ZIP (postal code) name of a placemark. Returns an empty string if not found
   **/
  function getZIP(placemark) {
    return _getPlacemarkAttribute(placemark, 'PostalCodeName');
  }
  
  /** 
   *  Mapeed.Proxy.GoogleMap#getStreet(placemark) -> String
   *  - placemark (Object): object representing google map placemark (get by calling getPlacemarks)
   *  
   *  Returns street (address without zip, city, country)  of a placemark. Returns an empty string if not found
   **/
  function getStreet(placemark) {
    return _getPlacemarkAttribute(placemark, 'ThoroughfareName');
  }
 
  /** 
   *  Mapeed.Proxy.GoogleMap#getZIP(placemark) -> Number
   *  - placemark (Object): object representing google map placemark (get by calling getPlacemarks)
   *  
   *  Returns latitude a placemark.
   **/
  function getLat(placemark) {
    return placemark.Point.coordinates[1];
  }
   
  /** 
   *  Mapeed.Proxy.GoogleMap#getZIP(placemark) -> Number
   *  - placemark (Object): object representing google map placemark (get by calling getPlacemarks)
   *  
   *  Returns longitude a placemark.
   **/
  function getLng(placemark) {
    return placemark.Point.coordinates[0];
  }
   
  /** 
   *  Mapeed.Proxy.GoogleMap#showPlacemark(tagName[, showAddress = null, draggableCallback = null, draggableContext = null ]) -> undefined
   *  - placemark (Object): object representing google map placemark (get by calling getPlacemarks)
   *  - showAddress (Boolean): display address on the map (inside an info window)
   *  - draggableCallback (Function): callback called when marker has benn drgged. Callback will received lat and lng as arguments
   *  - draggableContext (Object): calling context for draggableCallback
   *  
   *  Displays placemark on the map.
   **/
  function showPlacemark(placemark, showAddress, draggableCallback, draggableContext) {
    var accuracy = placemark.AddressDetails.Accuracy,
        address  = showAddress ? placemark.address.split(',').join('<br/>') : false,
        zoom = 1;
    if      (accuracy >= 9)  zoom = 17;
    else if (accuracy >= 6 ) zoom = 14;
    else if (accuracy >= 4)  zoom = 12;
    else if (accuracy >  1)  zoom = 6;
    else                     zoom = 3;

    this.showMarker(placemark.Point.coordinates[1], placemark.Point.coordinates[0], zoom, address, draggableCallback, draggableContext)
  }
  
  /** 
   *  Mapeed.Proxy.GoogleMap#showPlacemark(lat, lng, zoom[, address = null, draggableCallback = null, draggableContext = null]) -> undefined
   *  - lat (Float): marker's latitude
   *  - lng (Float): marker's longitude
   *  - zoom (Integer): map zoom
   *  - address (String): address to display inside info window
   *  - draggableCallback (Function): callback called when marker has benn drgged. Callback will received lat and lng as arguments
   *  - draggableContext (Object): calling context for draggableCallback
   *  
   *  Displays placemark on the map, center map on marker location.
   *  If an address is specified, marker will show this address in an info window
   **/
  function showMarker(lat, lng, zoom, address, draggableCallback, draggableContext) {
    var latLng = new GLatLng(lat, lng);
    this.map.setCenter(latLng, zoom);
    
    if (this.marker) {
      this.marker.setLatLng(latLng);
      this.marker.show();
    }
    else {
      this.marker = new GMarker(latLng, {draggable: true});
      GEvent.bind(this.marker, 'dragstart', this, _startMarkerDrag);
      GEvent.bind(this.marker, 'dragend', this, _endMarkerDrag);
      this.map.addOverlay(this.marker);
    }

    this.draggableCallback = draggableCallback;
    this.draggableContext  = draggableContext;
    if (draggableCallback) {
      this.marker.enableDragging();
    }
    else {
      this.marker.disableDragging();
    }
    if (address)
      this.marker.openInfoWindowHtml(address);
  }
  
  /** 
   *  Mapeed.Proxy.GoogleMap#hidePlacemark() -> undefined
   *  
   *  Hides placemark fro the map, close info window if need be
   **/
  function hidePlacemark() {
    if (this.marker) {
      this.marker.closeInfoWindow();
      this.marker.hide();
    }
  }
  
  /** 
   *  Mapeed.Proxy.GoogleMap#centerOnClientLocation([zoom]) -> undefined
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
  
  // Intern callback when marker dragging ends, 
  function _endMarkerDrag(latLng) {
    this.draggableCallback.call(this.draggableContext,latLng.lat(), latLng.lng());
  }

  // Parses placemark object as Google do not provide any API for that.
  // Information is inside placemark subfield but depends on accuracy, so we need to parse all tree 
  // to get information
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
    getMap:                 getMap,
    
    centerOnClientLocation: centerOnClientLocation,
    
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