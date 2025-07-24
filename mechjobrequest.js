// Initialize Firebase
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
  
  const db = firebase.firestore();
  const auth = firebase.auth();
  
  // Global variables
  let map = null;
  let mechanicMarker = null;
  let driverMarker = null;
  let mechanicUid = null;
  let currentDriverId = null;
  let watchId = null;
  
  // Initialize map when Google Maps API is ready
  window.initMap = function() {
    console.log("Google Maps API loaded successfully");
    
    // Create basic map first
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: -1.2921, lng: 36.8219 }, // Default Nairobi coordinates
      zoom: 12
    });
    
    // Add test marker to verify map is working
    new google.maps.Marker({
      position: { lat: -1.2921, lng: 36.8219 },
      map: map,
      title: "Test Marker - You should see this!"
    });
    
    // Now check auth state
    checkAuthState();
  };
  
  function checkAuthState() {
    auth.onAuthStateChanged(function(user) {
      if (!user) {
        alert("Please log in first.");
        window.location.href = "login.html";
        return;
      }
  
      mechanicUid = user.uid;
      startLocationTracking();
      listenForJobRequests();
    });
  }
  
  function startLocationTracking() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
  
    watchId = navigator.geolocation.watchPosition(
      function(position) {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
  
        updateMechanicPosition(location);
        
        // Update Firestore with mechanic's location
        db.collection("mechanics").doc(mechanicUid).update({
          location: location,
          isAvailable: true
        }).catch(function(error) {
          console.error("Error updating location:", error);
        });
      },
      function(error) {
        console.error("Geolocation error:", error);
        alert("Error getting location: " + error.message);
      },
      { enableHighAccuracy: true }
    );
  }
  
  function updateMechanicPosition(location) {
    if (!map) {
      // Initialize map if not already done
      map = new google.maps.Map(document.getElementById("map"), {
        center: location,
        zoom: 14
      });
    }
  
    if (!mechanicMarker) {
      mechanicMarker = new google.maps.Marker({
        position: location,
        map: map,
        title: "You (Mechanic)",
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      });
    } else {
      mechanicMarker.setPosition(location);
    }
  
    // Center map on mechanic's position
    map.setCenter(location);
  }
  
  function listenForJobRequests() {
    db.collection("mechanics").doc(mechanicUid).onSnapshot(
      function(docSnap) {
        const data = docSnap.data();
        if (data.currentRequest && data.currentRequest.status === "pending") {
          currentDriverId = data.currentRequest.driverId;
          showJobDetails(currentDriverId);
        }
      },
      function(error) {
        console.error("Error listening for jobs:", error);
      }
    );
  }
  
  function showJobDetails(driverId) {
    db.collection("drivers").doc(driverId).get().then(function(driverDoc) {
      if (!driverDoc.exists) {
        throw new Error("Driver profile not found");
      }
  
      const driverData = driverDoc.data();
      
      // Update job details UI
      document.getElementById("jobDetails").innerHTML = `
        <strong>Driver:</strong> ${driverData.name || "Unknown"}<br>
        <strong>Location:</strong> Lat: ${driverData.location.lat.toFixed(4)}, Lng: ${driverData.location.lng.toFixed(4)}
      `;
  
      // Update or create driver marker
      if (!driverMarker) {
        driverMarker = new google.maps.Marker({
          position: driverData.location,
          map: map,
          title: "Driver Location",
          icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
        });
      } else {
        driverMarker.setPosition(driverData.location);
      }
  
      // Center map between mechanic and driver
      if (mechanicMarker && driverMarker) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(mechanicMarker.getPosition());
        bounds.extend(driverMarker.getPosition());
        map.fitBounds(bounds);
      }
  
      // Setup button handlers
      setupResponseButtons(driverId);
    }).catch(function(error) {
      console.error("Error showing job details:", error);
    });
  }
  
  function setupResponseButtons(driverId) {
    var acceptBtn = document.getElementById("acceptBtn");
    var denyBtn = document.getElementById("denyBtn");
  
    // Clear previous listeners
    acceptBtn.onclick = null;
    denyBtn.onclick = null;
  
    acceptBtn.onclick = function() {
      handleJobResponse("accepted", driverId);
    };
  
    denyBtn.onclick = function() {
      if (confirm("Are you sure you want to deny this job?")) {
        handleJobResponse("denied", driverId);
      }
    };
  }
  
  function handleJobResponse(response, driverId) {
    var acceptBtn = document.getElementById("acceptBtn");
    var denyBtn = document.getElementById("denyBtn");
  
    // Disable buttons during processing
    acceptBtn.disabled = true;
    denyBtn.disabled = true;
  
    var batch = db.batch();
    var mechRef = db.collection("mechanics").doc(mechanicUid);
    var driverRef = db.collection("drivers").doc(driverId);
  
    batch.update(mechRef, {
      "currentRequest.status": response,
      isAvailable: response === "accepted" ? false : true
    });
  
    batch.update(driverRef, {
      mechanicResponse: response
    });
  
    batch.commit().then(function() {
      alert("Job " + response.toUpperCase());
      document.getElementById("jobDetails").innerHTML = "No job yet...";
      if (driverMarker) {
        driverMarker.setMap(null);
        driverMarker = null;
      }
    }).catch(function(error) {
      console.error("Error updating job response:", error);
      alert("Failed to process response");
    }).finally(function() {
      acceptBtn.disabled = false;
      denyBtn.disabled = false;
    });
  }
  
  // Clean up on page unload
  window.addEventListener('beforeunload', function() {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  });