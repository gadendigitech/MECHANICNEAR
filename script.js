// --- All imports MUST be at the top ---
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail, // Added for forgot password
  onAuthStateChanged // Good to have for general auth state management if needed elsewhere
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


import {
  getFirestore,
  setDoc,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCjEsVeN8Zh2ZnFA81BapPhiaP3_JyVx4w",
  authDomain: "mechanicapp-7b957.firebaseapp.com",
  projectId: "mechanicapp-7b957",
  storageBucket: "mechanicapp-7b957.appspot.com",
  messagingSenderId: "74138780229",
  appId: "1:74138780229:web:2379e632079ada6b56992c",
  measurementId: "G-CYK1XC1LCW" // Assuming you use analytics
};


// --- Initialize Firebase - IMPORTANT: Only initialize if not already initialized ---
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);


// --- Element References (Consolidated) ---
// Welcome Page elements
const driverBtn = document.getElementById("driver-btn");
const mechanicBtn = document.getElementById("mechanic-btn");

// Signup Page elements
const signupForm = document.getElementById("signupForm");
const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("signupEmail");
const signupPhone = document.getElementById("signupPhone");
const signupSkills = document.getElementById("signupSkills"); // This might be for mechanic only? Adjust if needed
const signupPassword = document.getElementById("signupPassword");
const signupConfirmPassword = document.getElementById("signupConfirmPassword");

// Login Page elements
const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const togglePasswordBtn = document.getElementById("togglePassword");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");


// --- Welcome Page Logic (Choose role) ---
if (driverBtn && mechanicBtn) { // Check if these elements exist (i.e., we are on welcome page)
  driverBtn.onclick = () => {
    window.location.href = "signup.html?role=driver";
  };
  mechanicBtn.onclick = () => {
    window.location.href = "signup.html?role=mechanic";
  };
}


// --- Auth Page Logic (Signup/Login) ---
// --- Role from URL query (for signup) ---
const params = new URLSearchParams(window.location.search);
const role = params.get("role");


// --- Sign Up Logic ---
if (signupForm) { // Check if signupForm exists (i.e., we are on signup page)
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const phone = signupPhone.value.trim();
    const skills = signupSkills ? signupSkills.value.trim() : ""; // Skills only if element exists
    const password = signupPassword.value;
    const confirmPassword = signupConfirmPassword.value;

    if (!name || !email || !phone || !password || !confirmPassword) {
      alert("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      signupPassword.focus();
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      // Disable submit button during processing
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Determine collection based on role
      const collectionName = role === "mechanic" ? "Mechanics" : "Drivers";

      const userData = {
        name,
        email,
        phone,
        role,
        createdAt: new Date()
      };

      // Add skills only if it's a mechanic signup and skills element exists
      if (role === "mechanic" && signupSkills) {
        userData.skills = skills;
      }

      await setDoc(doc(db, collectionName, uid), userData);

      alert("Signup successful!");
      // Redirect based on role
      if (role === "mechanic") {
        window.location.href = "mechprof.html"; // Redirect to mechanic profile setup
      } else {
        window.location.href = "driverprof.html"; // Redirect to driver profile setup
      }
    } catch (error) {
      console.error("Signup error:", error);
      // More user-friendly error messages
      if (error.code === "auth/email-already-in-use") {
        alert("This email address is already registered.");
      } else if (error.code === "auth/invalid-email") {
        alert("Please enter a valid email address.");
      } else {
        alert("Signup failed: " + error.message);
      }
    } finally {
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = false; // Re-enable button
    }
  });
}


// --- Login Logic ---
if (loginForm) { // Check if loginForm exists (i.e., we are on login page)
  // Password toggle
  if (togglePasswordBtn && loginPassword) { // Ensure elements exist
    togglePasswordBtn.addEventListener("click", () => {
      if (loginPassword.type === "password") {
        loginPassword.type = "text";
        togglePasswordBtn.textContent = "Hide";
      } else {
        loginPassword.type = "password";
        togglePasswordBtn.textContent = "Show";
      }
    });
  }

  // Forgot password
  if (forgotPasswordLink && loginEmail) { // Ensure elements exist
    forgotPasswordLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = loginEmail.value.trim();
      if (!email) {
        alert("Please enter your email in the email field first to reset password.");
        loginEmail.focus();
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent! Check your inbox (and spam folder).");
      } catch (error) {
        console.error("Error sending reset email:", error);
        alert("Failed to send password reset email: " + error.message);
      }
    });
  }


  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value; // No trim for password as Firebase handles it

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }
    if (password.length < 6) { // Firebase requires min 6 chars for new passwords
      alert("Password must be at least 6 characters.");
      loginPassword.focus();
      return;
    }

    try {
      // Disable submit button during processing
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Determine user role and redirect
      let redirectUrl = "";
      let profileFound = false;

      // Check if user is in Drivers collection
      const driverRef = doc(db, "Drivers", uid);
      const driverSnap = await getDoc(driverRef);

      if (driverSnap.exists()) {
        alert("Logged in as Driver");
        redirectUrl = "driverprof.html";
        profileFound = true;
      } else {
        // Check if user is in Mechanics collection
        const mechanicRef = doc(db, "Mechanics", uid);
        const mechanicSnap = await getDoc(mechanicRef);

        if (mechanicSnap.exists()) {
          alert("Logged in as Mechanic");
          redirectUrl = "mechprof.html";
          profileFound = true;
        }
      }

      if (profileFound) {
        window.location.href = redirectUrl;
      } else {
        alert("Account exists but no profile found. Please complete your profile setup.");
        // Consider redirecting to a profile creation page or a page to choose role
        // For now, no redirect, user stays on login page to get the message
      }
    } catch (error) {
      console.error("Login error:", error);
      // More specific error messages for login
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        alert("Invalid email or password."); // Generic message for security
      } else if (error.code === "auth/invalid-email") {
        alert("Please enter a valid email address.");
      } else {
        alert("Login failed: " + error.message);
      }
    } finally {
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = false; // Re-enable button
    }
  });
}
