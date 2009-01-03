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
