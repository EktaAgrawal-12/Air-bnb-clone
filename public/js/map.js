if (listing.geometry && listing.geometry.coordinates 
    && listing.geometry.coordinates[0] !== 0) {
  
  const coords = listing.geometry.coordinates; 

  const map = L.map('map').setView([coords[1], coords[0]], 9);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  L.marker([coords[1], coords[0]])
    .addTo(map)
    .bindPopup(`<h4>${listing.location}</h4><p>Exact location will be provided after booking</p>`)
    .openPopup();

} else {
  // No coordinates — show a message instead
  document.getElementById('map').innerHTML = 
    '<p class="text-muted p-3">Map not available for this listing</p>';
}