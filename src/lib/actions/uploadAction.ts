"use server";

import { adminApp } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";

export async function uploadImageAction(formData: FormData): Promise<string> {
  try {
    const file = formData.get("file") as Blob; // Node/Server File
    if (!file) throw new Error("No file provided");

    // Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Storage bucket
    const bucket = getStorage(adminApp).bucket();

    // Unique filename
    const uniqueFileName = `opportunity-images/${Date.now()}-${uuidv4()}-${file.name}`;
    const bucketFile = bucket.file(uniqueFileName);

    // Upload file
    await bucketFile.save(buffer, {
      metadata: { contentType: file.type },
    });

    // Generate signed URL valid for 1 year
    const [url] = await bucketFile.getSignedUrl({
      action: "read",
      expires: "03-01-2030", // or any far future date
    });

    return url;
  } catch (err: any) {
    console.error("Upload error:", err);
    throw new Error("Failed to upload image");
  }
}
