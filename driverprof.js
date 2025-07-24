// Import only once at the top:
import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjEsVeN8Zh2ZnFA81BapPhiaP3_JyVx4w",
  authDomain: "mechanicapp-7b957.firebaseapp.com",
  projectId: "mechanicapp-7b957",
  storageBucket: "mechanicapp-7b957.appspot.com",
  messagingSenderId: "74138780229",
  appId: "1:74138780229:web:2379e632079ada6b56992c"
};

// Initialize Firebase app only if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Get auth and firestore instances
const auth = getAuth(app);
const db = getFirestore(app);


// Main app start function - renamed to avoid conflict with initializeApp()
function startApp() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("Please log in to access this page.");
      window.location.href = "login.html";
      return;
    }

    setupAvatarUpload();
    setupFormSubmission(user);
  });
}

// Setup avatar upload function (unchanged)
function setupAvatarUpload() {
  const avatarInput = document.getElementById("avatarInput");
  const avatarImg = document.getElementById("driverAvatar");

  if (!avatarInput || !avatarImg) {
    console.error("Avatar elements not found");
    return;
  }

  avatarInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        avatarImg.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

// Setup form submission function (unchanged except minor cleanup)
function setupFormSubmission(user) {
  const form = document.getElementById("driverSignupForm");
  if (!form) {
    console.error("Driver form not found");
    return;
  }

  form.addEventListener("submit", async function(e) {
    e.preventDefault();
    console.log("Submit event fired"); 

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (!validateForm()) {
        alert("Please fill all required fields correctly");
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      const avatarImg = document.getElementById("driverAvatar");
      const formData = {
        avatar: avatarImg?.src || "",
        name: document.getElementById("fullName").value,
        phone: document.getElementById("phone").value,
        email: document.getElementById("email").value,
        vehicle: {
          make: document.getElementById("vehicleMake").value,
          model: document.getElementById("vehicleModel").value,
          year: document.getElementById("vehicleYear").value,
          plateNumber: document.getElementById("plateNumber").value
        },
        createdAt: new Date()
      };

      await setDoc(doc(db, "Drivers", user.uid), formData);
      alert("Driver profile saved successfully!");
      window.location.href = "requestservice.html";
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile: " + error.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// Form validation (unchanged)
function validateForm() {
  const requiredFields = [
    "fullName", "phone", "email", 
    "vehicleMake", "vehicleModel", "vehicleYear", "plateNumber"
  ];

  let isValid = true;

  requiredFields.forEach(id => {
    const field = document.getElementById(id);
    if (!field.value.trim()) {
      field.style.borderColor = "red";
      isValid = false;
    } else {
      field.style.borderColor = "";
    }
  });

  const email = document.getElementById("email").value;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById("email").style.borderColor = "red";
    isValid = false;
  }

  return isValid;
}

// Start the app after DOM is ready
document.addEventListener("DOMContentLoaded", startApp);
