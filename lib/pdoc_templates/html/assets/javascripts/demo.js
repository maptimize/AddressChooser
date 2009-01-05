// Create Mapeed.AddressChooser
var widget = new Mapeed.AddressChooser.Widget(
  { onInitialized: function(widget) {
      // Add small map control (zoom and pan)
      widget.getMap().addControl(new GSmallMapControl());  
     
      // Center map on selected address or on user location
      widget.initMap();
     
      // Focus street field
      document.getElementById('street').focus();
    }, 
    spinner: 'big_spinner'});

function displayAddress() {
  var text = 'Address:',
      lat = $('lat'),
      lng = $('lng');
  
  if (lat.value) {
    text += widget.getCurrentAddress();
    text += '\n'
    text += 'latitude: ' + $('lat').value;
    text += '\n'
    text += 'longitude: ' + $('lng').value;
  }
  else {
    text += 'No location found'
  }
  alert(text);
}
