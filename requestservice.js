// Load MarkerClusterer library dynamically
// Make sure to include markerclusterer script in your HTML:
// <script src="https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js"></script>

// Load Google Maps API dynamically with callback
function loadGoogleMaps() {
  return new Promise((resolve) => {
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded");
      resolve();
      return;
    }

    const script = document.createElement('script');
    // Note: no &callback=initMap here since we'll call initMap manually
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyA7j-bZi8IP5ZFFmbKZ2VKo6lg-HAtECrE`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// Global variables
let map;
let driverMarker;
let selectedMechanicId = null;
let driverLocation = null;
let mechanicMarkers = [];
let markerCluster = null; // MarkerClusterer instance

// Initialize Firebase app synchronously
function initializeFirebase() {
  if (!firebase.apps.length) {
    const firebaseConfig = {
      apiKey: "AIzaSyCjEsVeN8Zh2ZnFA81BapPhiaP3_JyVx4w",
      authDomain: "mechanicapp-7b957.firebaseapp.com",
      projectId: "mechanicapp-7b957",
      storageBucket: "mechanicapp-7b957.appspot.com",
      messagingSenderId: "74138780229",
      appId: "1:74138780229:web:2379e632079ada6b56992c"
    };
    firebase.initializeApp(firebaseConfig);
  }
}

// Initialize the map AFTER Google Maps and Firebase are ready
function initMap() {
  console.log("Initializing map");

  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -1.2921, lng: 36.8219 }, // Default Nairobi coordinates
    zoom: 12
  });

  // Optional test marker (can remove later)
  new google.maps.Marker({
    position: { lat: -1.2921, lng: 36.8219 },
    map: map,
    title: "Test Marker - You should see this!"
  });
}

// Firebase auth state check and driver location initialization
function checkAuthStateAndInit() {
  firebase.auth().onAuthStateChanged(function(user) {
    if (!user) {
      alert("Please log in first.");
      window.location.href = "login.html";
      return;
    }
    initializeDriverLocation(user);
  });
}

// Initialize/update driver location on map and Firestore
function initializeDriverLocation(user) {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async function(position) {
      driverLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      updateMapWithDriverLocation(driverLocation);

      const driverRef = firebase.firestore().collection("drivers").doc(user.uid);
      try {
        const driverDoc = await driverRef.get();

        if (!driverDoc.exists) {
          await driverRef.set({
            location: driverLocation,
            status: "waiting",
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            name: user.displayName || "Driver",
            email: user.email || ""
          });
        } else {
          await driverRef.update({
            location: driverLocation,
            status: "waiting"
          });
        }

        showAvailableMechanics();
        setupSubmitButton(user);
      } catch (error) {
        console.error("Error updating driver location:", error);
        alert("Failed to save your location. Please try again.");
      }
    },
    function(error) {
      console.error("Geolocation error:", error);
      alert("Error getting your location: " + error.message);
    },
    { enableHighAccuracy: true }
  );
}

function updateMapWithDriverLocation(location) {
  if (!map) {
    console.error("Map not initialized");
    return;
  }

  map.setCenter(location);
  map.setZoom(14);

  if (!driverMarker) {
    driverMarker = new google.maps.Marker({
      position: location,
      map: map,
      title: "Your Location",
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    });
  } else {
    driverMarker.setPosition(location);
  }
}

// Show available mechanics with marker clustering
function showAvailableMechanics() {
  if (markerCluster) {
    markerCluster.clearMarkers();
    markerCluster = null;
  }
  mechanicMarkers.forEach(marker => marker.setMap(null));
  mechanicMarkers = [];

  firebase.firestore().collection("mechanics")
    .where("isAvailable", "==", true)
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        const mechanic = doc.data();
        if (!mechanic.location) return;

        const marker = new google.maps.Marker({
          position: mechanic.location,
          map: map,
          title: mechanic.name || "Available Mechanic",
          icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
        });

        marker.addListener("click", () => {
          mechanicMarkers.forEach(m => m.setIcon("http://maps.google.com/mapfiles/ms/icons/green-dot.png"));

          marker.setIcon("http://maps.google.com/mapfiles/ms/icons/yellow-dot.png");
          selectedMechanicId = doc.id;

          const infoWindow = new google.maps.InfoWindow({
            content:
              `<strong>${mechanic.name || "Mechanic"}</strong><br>` +
              `Specialization: ${mechanic.specialization || "N/A"}<br>` +
              `Distance: ${calculateDistance(driverLocation, mechanic.location).toFixed(1)} km`
          });
          infoWindow.open(map, marker);
        });

        mechanicMarkers.push(marker);
      });

      if (mechanicMarkers.length > 0) {
        // eslint-disable-next-line no-undef
        markerCluster = new markerClusterer.MarkerClusterer({ map, markers: mechanicMarkers });
      }
    })
    .catch(error => {
      console.error("Error getting mechanics:", error);
    });
}

function calculateDistance(loc1, loc2) {
  const R = 6371; // Earth radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) *
    Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function setupSubmitButton(user) {
  const submitBtn = document.getElementById("submit-request");
  const requestForm = document.getElementById("service-request-form");

  if (!submitBtn || !requestForm) {
    console.error("Submit button or form not found");
    return;
  }

  requestForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const issue = document.getElementById("issue").value.trim();
    const vehicle = document.getElementById("vehicle").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!issue || !vehicle || !description) {
      alert("Please fill in all fields");
      return;
    }

    if (!selectedMechanicId) {
      alert("Please select a mechanic from the map");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting Request...";

    firebase.firestore().collection("serviceRequests").add({
      driverId: user.uid,
      mechanicId: selectedMechanicId,
      issue,
      vehicle,
      description,
      location: driverLocation,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(docRef => {
      return firebase.firestore().collection("mechanics").doc(selectedMechanicId).update({
        currentRequest: {
          requestId: docRef.id,
          driverId: user.uid,
          driverLocation,
          status: "pending"
        },
        isAvailable: false
      });
    })
    .then(() => {
      alert("Service request submitted successfully! See the map for available mechanics.");
      showAvailableMechanics();
    })
    .catch(error => {
      console.error("Error submitting request:", error);
      alert("Failed to submit request. Please try again.");
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Request";
    });
  });
}

// Kickoff function to initialize your application correctly
async function initializeApp() {
  try {
    await loadGoogleMaps();
    initializeFirebase();

    initMap();

    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => window.history.back());
    }

    checkAuthStateAndInit();
  } catch (error) {
    console.error("Initialization error:", error);
    alert("Failed to initialize application");
  }
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
