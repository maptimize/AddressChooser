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