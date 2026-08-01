/* =========================
FILE: firebase/firestore.js
========================= */
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { app } from "./auth.js";

export const db = getFirestore(app);
