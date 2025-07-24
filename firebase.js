
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyCjEsVeN8Zh2ZnFA81BapPhiaP3_JyVx4w",
    authDomain: "mechanicapp-7b957.firebaseapp.com",
    projectId: "mechanicapp-7b957",
    storageBucket: "mechanicapp-7b957.firebasestorage.app",
    messagingSenderId: "74138780229",
    appId: "1:74138780229:web:2379e632079ada6b56992c",
    measurementId: "G-CYK1XC1LCW"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
