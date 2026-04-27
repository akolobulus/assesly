
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminApp } from "@/lib/firebaseAdmin";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const bucket = getStorage(adminApp()).bucket();
    const uniqueFileName = `opportunity-images/${Date.now()}-${uuidv4()}-${file.name}`;
    const bucketFile = bucket.file(uniqueFileName);

    await bucketFile.save(buffer, {
      metadata: { contentType: file.type },
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;

    return NextResponse.json({ publicUrl });

  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: 'Failed to upload file', details: error.message }, { status: 500 });
  }
}
