const firebaseConfig = {
  apiKey: "AIzaSyAHGLNVtubgL4LYZuZL3I4QwqUR6NBNFqQ",
  authDomain: "si-deska-wps.firebaseapp.com",
  databaseURL: "https://si-deska-wps-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "si-deska-wps",
  storageBucket: "si-deska-wps.firebasestorage.app",
  messagingSenderId: "595163960871",
  appId: "1:595163960871:web:40a884615f28556ed6e002"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();
