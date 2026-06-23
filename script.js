// Global variables
let map;
let userMarker;
let pharmacyMarkers = [];
let userLocation = null;

// Sample pharmacy data
const pharmacyDatabase = [
    { name: "City Pharmacy", lat: 28.6139, lng: 77.2090, address: "123 Main St", phone: "+91-9876543210", rating: 4.5, reviews: 128, type: "general" },
    { name: "24/7 Emergency Pharmacy", lat: 28.6155, lng: 77.2100, address: "456 Park Ave", phone: "+91-9876543211", rating: 4.8, reviews: 245, type: "emergency" },
    { name: "Health Care Plus", lat: 28.6120, lng: 77.2070, address: "789 Health Rd", phone: "+91-9876543212", rating: 4.3, reviews: 89, type: "general" },
    { name: "Wellness Pharmacy", lat: 28.6160, lng: 77.2110, address: "321 Wellness St", phone: "+91-9876543213", rating: 4.6, reviews: 156, type: "general" },
    { name: "Emergency Care Pharmacy", lat: 28.6100, lng: 77.2080, address: "654 Care Ln", phone: "+91-9876543214", rating: 4.7, reviews: 203, type: "emergency" },
    { name: "MediCare Pharma", lat: 28.6180, lng: 77.2120, address: "987 Medical Ave", phone: "+91-9876543215", rating: 4.4, reviews: 112, type: "general" }
];

// Initialize map on page load
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupEventListeners();
});

// Initialize Leaflet map
function initMap() {
    map = L.map('map').setView([28.6139, 77.2090], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('deliveryForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleDeliverySubmit();
    });

    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleContactSubmit();
    });
}

// Get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                map.setView([userLocation.lat, userLocation.lng], 15);
                
                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
                    radius: 10,
                    fillColor: "#0066cc",
                    color: "#ffffff",
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map).bindPopup("Your Location");
                
                displayNearbyPharmacies();
            },
            function(error) {
                alert('Error getting location. Please enable location services.');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Start finding pharmacies
function startFinding() {
    document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
    getCurrentLocation();
}

// Calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Display nearby pharmacies
function displayNearbyPharmacies() {
    clearMarkers();
    
    if (!userLocation) {
        alert('Location not available');
        return;
    }

    const pharmaciesWithDistance = pharmacyDatabase.map(pharmacy => ({
        ...pharmacy,
        distance: calculateDistance(userLocation.lat, userLocation.lng, pharmacy.lat, pharmacy.lng)
    })).sort((a, b) => a.distance - b.distance);

    const pharmacyListDiv = document.getElementById('pharmacyList');
    pharmacyListDiv.innerHTML = '';

    pharmaciesWithDistance.forEach(pharmacy => {
        const marker = L.marker([pharmacy.lat, pharmacy.lng], {
            icon: L.icon({
                iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%230066cc"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        }).addTo(map).bindPopup(`<strong>${pharmacy.name}</strong><br>${pharmacy.address}<br>Distance: ${pharmacy.distance.toFixed(1)} km`);
        
        pharmacyMarkers.push(marker);

        const pharmacyCard = document.createElement('div');
        pharmacyCard.className = 'pharmacy-card';
        pharmacyCard.innerHTML = `
            <div class="pharmacy-name">${pharmacy.name}</div>
            <div class="pharmacy-address">📍 ${pharmacy.address}</div>
            <div class="pharmacy-distance">📏 ${pharmacy.distance.toFixed(1)} km away</div>
            <div class="pharmacy-rating">⭐ ${pharmacy.rating} (${pharmacy.reviews} reviews)</div>
            <div class="pharmacy-phone">📞 ${pharmacy.phone}</div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-small btn-primary" onclick="callPharmacy('${pharmacy.phone}')" style="flex: 1;">Call</button>
                <button class="btn btn-small btn-secondary" onclick="selectPharmacy(${pharmacy.lat}, ${pharmacy.lng})" style="flex: 1;">View</button>
            </div>
        `;
        pharmacyListDiv.appendChild(pharmacyCard);
    });
}

// Find emergency pharmacies
function findEmergencyPharmacies() {
    if (!userLocation) {
        alert('Please enable location first');
        getCurrentLocation();
        return;
    }

    clearMarkers();
    
    const emergencyPharmacies = pharmacyDatabase.filter(p => p.type === 'emergency').map(pharmacy => ({
        ...pharmacy,
        distance: calculateDistance(userLocation.lat, userLocation.lng, pharmacy.lat, pharmacy.lng)
    })).sort((a, b) => a.distance - b.distance);

    const pharmacyListDiv = document.getElementById('pharmacyList');
    pharmacyListDiv.innerHTML = '';

    if (emergencyPharmacies.length === 0) {
        pharmacyListDiv.innerHTML = '<p class="placeholder-text">No emergency pharmacies found nearby</p>';
        return;
    }

    emergencyPharmacies.forEach(pharmacy => {
        const marker = L.marker([pharmacy.lat, pharmacy.lng], {
            icon: L.icon({
                iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        }).addTo(map).bindPopup(`<strong>🚨 ${pharmacy.name}</strong><br>${pharmacy.address}<br>Distance: ${pharmacy.distance.toFixed(1)} km<br>📞 ${pharmacy.phone}`);
        
        pharmacyMarkers.push(marker);

        const pharmacyCard = document.createElement('div');
        pharmacyCard.className = 'pharmacy-card';
        pharmacyCard.innerHTML = `
            <div class="pharmacy-name">🚨 ${pharmacy.name}</div>
            <div class="pharmacy-address">📍 ${pharmacy.address}</div>
            <div class="pharmacy-distance">📏 ${pharmacy.distance.toFixed(1)} km away</div>
            <div class="pharmacy-rating">⭐ ${pharmacy.rating} (${pharmacy.reviews} reviews)</div>
            <div class="pharmacy-phone">📞 ${pharmacy.phone}</div>
            <div style="margin-top: 1rem;">
                <button class="btn btn-danger" onclick="callPharmacy('${pharmacy.phone}')" style="width: 100%;">🚨 Call Emergency</button>
            </div>
        `;
        pharmacyListDiv.appendChild(pharmacyCard);
    });
}

// Select pharmacy
function selectPharmacy(lat, lng) {
    map.setView([lat, lng], 16);
}

// Call pharmacy
function callPharmacy(phone) {
    window.location.href = `tel:${phone}`;
}

// Clear markers
function clearMarkers() {
    pharmacyMarkers.forEach(marker => map.removeLayer(marker));
    pharmacyMarkers = [];
}

// Handle delivery form
function handleDeliverySubmit() {
    const form = document.getElementById('deliveryForm');
    const messageDiv = document.getElementById('deliveryMessage');
    messageDiv.className = 'message success';
    messageDiv.textContent = '✓ Delivery request submitted successfully! We will contact you soon.';
    form.reset();
    
    setTimeout(() => {
        messageDiv.className = 'message';
        messageDiv.textContent = '';
    }, 5000);
}

// Handle contact form
function handleContactSubmit() {
    const form = document.getElementById('contactForm');
    const messageDiv = document.getElementById('contactMessage');
    messageDiv.className = 'message success';
    messageDiv.textContent = '✓ Message sent successfully! We will get back to you soon.';
    form.reset();
    
    setTimeout(() => {
        messageDiv.className = 'message';
        messageDiv.textContent = '';
    }, 5000);
}