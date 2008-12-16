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
  *  Creates a new Mapeed.Proxy.GoogleMap object used by Mapeed.AddressChooser.Plugin
  **/
  
Mapeed.Proxy.GoogleMap = function(element, callback, context) {
  var self = this;
  
  function createMap() {
    self.map = new GMap2(element);
    self.map.setCenter(new GLatLng(47, 1), 1);
    
    self.geocoder = new GClientGeocoder;
    callback.call(context, self.map);
    
    self.clientLocation = google && google.loader ? google.loader.ClientLocation : null;
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
   *  Mapeed.Proxy.GoogleMap#showPlacemark(placemark, showAddress, draggable) -> null
   *  - placemark (Object): object representing google map placemark (get by calling getPlacemarks)
   *  - showAddress (Boolean): display address on the map (inside an info window)
   *  - draggable (Boolean): make the marker draggable to adjust position on the map.
   *  
   *  Displays placemark of the map.
   **/
  function showPlacemark(placemark, showAddress, draggable) {
    var latLng   = new GLatLng(placemark.Point.coordinates[1], placemark.Point.coordinates[0])
        accuracy = placemark.AddressDetails.Accuracy,
        zoom = 1;
    if      (accuracy >= 9)  zoom = 17;
    else if (accuracy >= 6 ) zoom = 14;
    else if (accuracy >= 4)  zoom = 12;
    else if (accuracy >  1)  zoom = 6;
    else                     zoom = 3;
    this.map.setCenter(latLng, zoom);
    
    if (this.gmarker) {
      this.gmarker.setLatLng(latLng);
    }
    else {
      this.gmarker = new GMarker(latLng, {draggable: true});
      GEvent.bind(this.gmarker, 'dragstart', this, _startMarkerDrag);
      GEvent.bind(this.gmarker, 'dragend', this, _endMarkerDrag);
      this.map.addOverlay(this.gmarker);
    }
    
    if (draggable) {
      this.gmarker.enableDragging();
    }
    else {
      this.gmarker.disableDragging();
    }
      
    if (showAddress)
      this.gmarker.openInfoWindowHtml(placemark.address.split(',').join('<br/>'));
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
    this.gmarker.closeInfoWindow();
  }
  
  // Intern callback when marker dragging ends, 
  function _endMarkerDrag(latLng) {
    // TODO: notify latLng
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
    addEventListener:      addEventListener,
    removeEventListener:   removeEventListener,
    getMap:                getMap,
    getPlacemarks:         getPlacemarks,
    showPlacemark:         showPlacemark,

    getLat:                getLat,
    getLng:                getLng,
                          
    getAddress:            getAddress,
    getCity:               getCity,
    getCountry:            getCountry,
    getZIP:                getZIP,
    getStreet:             getStreet
  }
})();