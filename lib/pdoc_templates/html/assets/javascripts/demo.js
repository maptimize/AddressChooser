var widget = new Mapeed.AddressChooser.Widget()
  .onInitialized(onInitialized)
  .onSuggestsSearch(onSuggestsSearch)
  .onSuggestsFound(onSuggestsFound);

// If you want to customized your map, add code in onInitialized callback
function onInitialized(widget) {
  // Add small map control (zoom and pan)
  widget.getMap().addControl(new GSmallMapControl());  
  // If input fields have values, this will display current position on the map otherwise center map on user location
  widget.initMap(true);
}

function onSuggestsSearch(widget) {
  // Enable submit button
  document.getElementById('submit').disabled = true;
  // Remove spinner
  document.getElementById('big_spinner').style.display = 'block';
}

function onSuggestsFound(widget, placemarks) {
  // Disable submit button
  document.getElementById('submit').disabled = !placemarks || placemarks.length == 0;
  // Remove spinner
  document.getElementById('big_spinner').style.display = 'none';
}

function displayAddress() {
  var text = 'Address:',
      lat = document.getElementById('lat'),
      lng = document.getElementById('lng');
  
  if (lat.value) {
    text += widget.getCurrentAddress();
    text += '\n'
    text += 'latitude: ' + document.getElementById('lat').value;
    text += '\n'
    text += 'longitude: ' + document.getElementById('lng').value;
  }
  else {
    text += 'No location found'
  }
  alert(text);
}
