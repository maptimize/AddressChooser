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
  $('street').focus();
}

function onSuggestsSearch(widget) {
  // Enable submit button
  $('submit').disabled = true;
  // Remove spinner
  $('big_spinner').style.display = 'block';
}

function onSuggestsFound(widget, placemarks) {
  // Disable submit button
  $('submit').disabled = !placemarks || placemarks.length == 0;
  // Remove spinner
  $('big_spinner').style.display = 'none';
}

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
