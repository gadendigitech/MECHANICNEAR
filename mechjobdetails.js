// Initialize Firebase (using compat version)
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
  
  // Map variables
  let map;
  let mechanicMarker = null;
  let driverMarker = null;
  let watchId = null;
  
  // Global initMap function
  window.initMap = function() {
    console.log("Google Maps API loaded successfully");
    
    // Create map with fallback center
    map = new google.maps.Map(document.getElementById("map"), {
      center: { lat: -1.2921, lng: 36.8219 },
      zoom: 12
    });
    
    // Test marker to verify map works
    new google.maps.Marker({
      position: { lat: -1.2921, lng: 36.8219 },
      map: map,
      title: "Test Marker - You should see this!"
    });
    
    // Now that map is ready, check auth state
    checkAuthState();
  };
  
  function checkAuthState() {
    auth.onAuthStateChanged(function(user) {
      if (!user) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
      }
      loadJobDetails(user);
    });
  }
  
  function loadJobDetails(user) {
    const mechRef = db.collection("mechanics").doc(user.uid);
    
    mechRef.get().then(function(mechDoc) {
      if (!mechDoc.exists) {
        throw new Error("Mechanic profile not found");
      }
  
      const request = mechDoc.data().currentRequest;
      if (!request || request.status !== "pending") {
        alert("No active job requests found");
        window.location.href = "mechanic-dashboard.html";
        return;
      }
  
      const driverRef = db.collection("drivers").doc(request.driverId);
      driverRef.get().then(function(driverDoc) {
        if (!driverDoc.exists) {
          throw new Error("Driver profile not found");
        }
  
        const driverData = driverDoc.data();
        updateUI(driverData);
        updateMapWithDriverLocation(driverData.location);
        setupLocationTracking(mechRef);
        setupButtonHandlers(mechRef, driverRef);
      }).catch(handleError);
    }).catch(handleError);
  }
  
  function updateUI(driverData) {
    document.getElementById("driverName").textContent = driverData.name || "Unknown";
    document.getElementById("vehicle").textContent = driverData.vehicle || "N/A";
    document.getElementById("issue").textContent = driverData.issue || "N/A";
  }
  
  function updateMapWithDriverLocation(location) {
    if (!map) {
      console.error("Map not initialized yet");
      return;
    }
  
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.warn("Invalid location, using default");
      location = { lat: -1.2921, lng: 36.8219 };
    }
  
    map.setCenter(location);
    map.setZoom(14);
  
    if (driverMarker) {
      driverMarker.setPosition(location);
    } else {
      driverMarker = new google.maps.Marker({
        position: location,
        map: map,
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        title: "Driver Location"
      });
    }
  }
  
  function setupLocationTracking(mechRef) {
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        function(pos) {
          const currentPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
  
          if (mechanicMarker) {
            mechanicMarker.setPosition(currentPos);
          } else {
            mechanicMarker = new google.maps.Marker({
              position: currentPos,
              map: map,
              icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
              title: "Your Location"
            });
          }
  
          mechRef.update({ location: currentPos });
        },
        function(error) {
          console.error("Geolocation error:", error);
          alert("Location access required. Please enable location services.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }
  
  function setupButtonHandlers(mechRef, driverRef) {
    document.getElementById("enrouteBtn").addEventListener("click", function() {
      mechRef.update({
        "currentRequest.status": "enroute",
        "currentRequest.updatedAt": firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        alert("Status updated to En Route");
      }).catch(function(error) {
        console.error("Update error:", error);
        alert("Failed to update status");
      });
    });
  
    document.getElementById("completeBtn").addEventListener("click", function() {
      mechRef.update({
        currentRequest: null,
        isAvailable: true
      }).then(function() {
        window.location.href = "mechanic-dashboard.html";
      }).catch(function(error) {
        console.error("Completion error:", error);
        alert("Failed to complete job");
      });
    });
  }
  
  function handleError(error) {
    console.error("Error:", error);
    alert(error.message);
    window.location.href = "mechanic-dashboard.html";
  }
  
  // Clean up on page unload
  window.addEventListener('beforeunload', function() {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  });