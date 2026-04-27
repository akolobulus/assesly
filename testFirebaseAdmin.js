
import admin from "firebase-admin";
import fs from "fs";
// ✅ Make sure you have your service account JSON
// Replace with the actual path to your downloaded key
const serviceAccount = JSON.parse(
  fs.readFileSync("./vet-it-technology-adminkeys.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function testFirebase() {
  try {
    // 🔹 Write a test doc
    await db.collection("testCollection").doc("testDoc").set({
      message: "Hello from Firebase Admin SDK",
      timestamp: new Date(),
    });

    // 🔹 Read it back
    const snap = await db.collection("testCollection").doc("testDoc").get();
    console.log("✅ Firestore connected! Doc data:", snap.data());
  } catch (err) {
    console.error("❌ Firebase Admin test failed:", err);
  }
}

testFirebase();
