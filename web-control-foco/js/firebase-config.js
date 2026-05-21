const firebaseConfig = {
  apiKey:            "AIzaSyD5AXm__Be0WD0PFJWPGh-I3xqyH8LC4x8",
  authDomain:        "on-off-see.firebaseapp.com",
  databaseURL:       "https://on-off-see-default-rtdb.firebaseio.com",
  projectId:         "on-off-see",
  storageBucket:     "on-off-see.firebasestorage.app",
  messagingSenderId: "17907985222",
  appId:             "1:17907985222:web:e685ea747068d8c4cc9347"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.database();
