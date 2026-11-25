import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { getCloudinaryConfig, requireAdmin } from "../../../../../lib/admin-api";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif";

export async function POST(request) {
  const authentication = await requireAdmin(request);
  if (authentication.response) return authentication.response;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_FILE_SIZE + 100_000) {
    return NextResponse.json(
      { success: false, message: "Image must be 8 MB or smaller." },
      { status: 413 }
    );
  }

  let file;
  try {
    const formData = await request.formData();
    file = formData.get("file");
  } catch {
    return NextResponse.json(
      { success: false, message: "Choose an image file to upload." },
      { status: 400 }
    );
  }

  if (
    !file ||
    typeof file.arrayBuffer !== "function" ||
    !ALLOWED_TYPES.has(file.type) ||
    file.size <= 0 ||
    file.size > MAX_FILE_SIZE
  ) {
    return NextResponse.json(
      { success: false, message: "Choose a JPG, PNG, WebP or AVIF image up to 8 MB." },
      { status: 400 }
    );
  }

  try {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedParameters = {
      allowed_formats: ALLOWED_FORMATS,
      folder: "dailycart/products",
      timestamp,
    };
    const signatureSource = Object.entries(signedParameters)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    const signature = createHash("sha1")
      .update(`${signatureSource}${apiSecret}`)
      .digest("hex");

    const uploadForm = new FormData();
    uploadForm.set("file", file, file.name || "product-image");
    uploadForm.set("api_key", apiKey);
    uploadForm.set("timestamp", timestamp);
    uploadForm.set("folder", signedParameters.folder);
    uploadForm.set("allowed_formats", signedParameters.allowed_formats);
    uploadForm.set("signature", signature);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadForm,
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!cloudinaryResponse.ok) {
      console.error("Cloudinary image upload failed:", cloudinaryResponse.status);
      return NextResponse.json(
        { success: false, message: "Cloudinary could not upload this image. Please retry." },
        { status: 502 }
      );
    }

    const asset = await cloudinaryResponse.json();
    if (
      typeof asset.public_id !== "string" ||
      typeof asset.secure_url !== "string" ||
      !asset.secure_url.startsWith(`https://res.cloudinary.com/${cloudName}/`)
    ) {
      console.error("Cloudinary returned an invalid image asset.");
      return NextResponse.json(
        { success: false, message: "Cloudinary returned an invalid image. Please retry." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      asset: {
        publicId: asset.public_id,
        url: asset.secure_url,
        filename: file.name || asset.public_id.split("/").at(-1),
        width: asset.width,
        height: asset.height,
      },
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { success: false, message: "Image upload is unavailable. Please retry." },
      { status: 503 }
    );
  }
}
