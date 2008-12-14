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


 /** 
  *  new Mapeed.Proxy.GoogleMap(element, callback, context)
  *  - element (Element): element used to create GMap2 object
  *  - callback (Function): callback called when map is ready
  *  - context (Object): context for calling callback
  *  
  *  Creates a new Mapeed.Proxy.GoogleMap used by Mapeed.Address.Plugin
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
   
   // Return map (GMap2) object
  function getMap() {
    return this.map;
  } 
  
  // Returns address of a placemark
  function getAddress(placemark) {
    return placemark.address;
  }
   
  // Returns city of a placemark
  function getCity(placemark) {
    return _getPlacemarkAttribute(placemark, 'LocalityName');
  }

  // Returns country of a placemark
  function getCountry(placemark) {
    return _getPlacemarkAttribute(placemark, 'CountryName');
  }
    
  // Returns ZIP (postal code) of a placemark
  function getZIP(placemark) {
    return _getPlacemarkAttribute(placemark, 'PostalCodeName');
  }
  
  // Returns street (address without zip, city, country) of a placemark
  function getStreet(placemark) {
    return _getPlacemarkAttribute(placemark, 'ThoroughfareName');
  }
 
  // Returns latitude of a placemark
  function getLat(placemark) {
    return placemark.Point.coordinates[1];
  }
   
  // Returns longitude of a placemark
  function getLng(placemark) {
    return placemark.Point.coordinates[0];
  }
   
  // Displays placemark of the map
  // -showPlacemark (Boolean): display address on the map
  // -draggable (Boolean): make the marker draggable to adjust position on the map
  function showPlacemark(placemark, showAddress, draggable) {
    var latLng   = new GLatLng(placemark.Point.coordinates[1], placemark.Point.coordinates[0])
        accuracy = placemark.AddressDetails.Accuracy,
        zoom     = 8;
    if (accuracy >= 9)       zoom = 17;
    else if (accuracy >= 6 ) zoom = 14;
    else if (accuracy >= 4)  zoom = 12;
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