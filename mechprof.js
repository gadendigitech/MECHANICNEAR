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

// Declare the startApp function *before* adding event listener
function startApp() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      alert("Please log in first");
      window.location.href = "login.html";
      return;
    }

    setupFormNavigation();
    setupAvatarUpload();
    setupFormSubmission(user);
  });
}



function setupFormNavigation() {
  let currentStep = 0;
  const steps = document.querySelectorAll(".form-step");
  const progressSteps = document.querySelectorAll(".progress-step");

  function showStep(index) {
    steps.forEach((step, i) => {
      step.classList.toggle("active", i === index);
    });
    progressSteps.forEach((step, i) => {
      step.classList.toggle("active", i <= index);
    });
  }

  document.querySelectorAll(".next-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (validateCurrentStep(currentStep)) {
        currentStep++;
        showStep(currentStep);
      }
    });
  });

  document.querySelectorAll(".back-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });
  });

  showStep(currentStep);
}

function validateCurrentStep(stepIndex) {
  const currentStep = document.querySelectorAll(".form-step")[stepIndex];
  let isValid = true;

  currentStep.querySelectorAll("[required]").forEach((input) => {
    if (!input.value.trim()) {
      input.style.borderColor = "red";
      isValid = false;
    } else {
      input.style.borderColor = "";
    }
  });

  if (stepIndex === 2) {
    const servicesSelected = document.querySelectorAll('input[name="services"]:checked').length > 0;
    if (!servicesSelected) {
      alert("Please select at least one service");
      isValid = false;
    }
  }

  if (!isValid) alert("Please complete all required fields");

  return isValid;
}

function setupAvatarUpload() {
  const avatarInput = document.getElementById("avatarInput");
  const avatarImg = document.getElementById("profileAvatar");
  if (avatarInput && avatarImg) {
    avatarInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          avatarImg.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function setupFormSubmission(user) {
  const form = document.getElementById("mechanicSignupForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      if (!validateCurrentStep(3)) {
        if (submitBtn) submitBtn.disabled = false; // Re-enable
        return;
      }

      const avatarImg = document.getElementById("profileAvatar");
      const data = {
        avatar: avatarImg?.src || "",
        name: document.getElementById("fullName").value.trim(),
        specialization: document.getElementById("specialization").value,
        experience: parseInt(document.getElementById("experience").value) || 0,
        bio: document.getElementById("bio").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),
        location: document.getElementById("location").value.trim(),
        radius: parseInt(document.getElementById("radius").value) || 10,
        services: getSelectedServices(),
        otherServices: document.getElementById("otherServices").value.trim(),
        hourlyRate: parseInt(document.getElementById("hourlyRate").value) || 0,
        calloutFee: parseInt(document.getElementById("calloutFee").value) || 0,
        availability: getSchedule(),
        availableNow: document.getElementById("availableNow").checked,
        createdAt: new Date(),
      };

      await setDoc(doc(db, "Mechanics", user.uid), data);
      alert("Mechanic profile saved successfully!");
      window.location.href = "mechanic-dashboard.html";
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile: " + error.message);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function getSelectedServices() {
  return Array.from(document.querySelectorAll('input[name="services"]:checked')).map(el => el.value);
}

function getSchedule() {
  const schedule = {};
  document.querySelectorAll(".day-row:not(:last-child)").forEach((row) => {
    const day = row.querySelector("span").textContent.toLowerCase();
    const [open, close] = row.querySelectorAll('input[type="time"]');
    schedule[day] = { open: open.value, close: close.value };
  });
  schedule.sunday = document.getElementById("sundayClosed").checked ? "closed" : "open";
  return schedule;
}
document.addEventListener("DOMContentLoaded", startApp);