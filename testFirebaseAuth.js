import fs from "fs";
import admin from "firebase-admin";

// ✅ Load your service account key
const serviceAccount = JSON.parse(
  fs.readFileSync("./vet-it-technology-adminkeys.json", "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function testAuth() {
  try {
    // 🔹 Create a test user (only once)
    const user = await admin.auth().createUser({
      email: "testuser@example.com",
      password: "TestPassword123!",
    });
    console.log("✅ User created:", user.uid);

    // 🔹 Fetch the same user
    const fetched = await admin.auth().getUser(user.uid);
    console.log("✅ User fetched:", fetched.email);

    // 🔹 Delete user after test
    await admin.auth().deleteUser(user.uid);
    console.log("🗑️ Test user deleted successfully");
  } catch (err) {
    console.error("❌ Auth test failed:", err);
  }
}

testAuth();
