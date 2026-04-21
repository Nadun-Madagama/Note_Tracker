import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDBgSoO2BpzCK0joS4ugTR2kPg1DGzs-dU",
    authDomain: "notetracker-bb998.firebaseapp.com",
    projectId: "notetracker-bb998",
    storageBucket: "notetracker-bb998.firebasestorage.app",
    messagingSenderId: "434997554860",
    appId: "1:434997554860:web:57c300275c93f6af43b909",
    measurementId: "G-DHD4FYBPB8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.cloudSaveState = async function(state) {
    try {
        await setDoc(doc(db, "trackerData", "defaultUser"), state);
        console.log("State synced to cloud.");
    } catch (e) {
        console.error("Error saving to cloud: ", e);
    }
};

window.cloudLoadState = async function() {
    try {
        const docSnap = await getDoc(doc(db, "trackerData", "defaultUser"));
        if (docSnap.exists()) {
            console.log("State loaded from cloud.");
            return docSnap.data();
        } else {
            console.log("No cloud data found.");
            return null;
        }
    } catch (e) {
        console.error("Error loading from cloud: ", e);
        return null;
    }
};
