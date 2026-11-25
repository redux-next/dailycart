import "server-only";

import { NextResponse } from "next/server";

import { adminAuth } from "./firebase-admin";

export async function requireAdmin(request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      response: NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  try {
    const token = authorization.slice(7).trim();
    const decodedToken = await adminAuth.verifyIdToken(token, true);

    if (decodedToken.admin !== true) {
      return {
        response: NextResponse.json(
          { success: false, message: "Admin access required." },
          { status: 403 }
        ),
      };
    }

    return { decodedToken };
  } catch {
    return {
      response: NextResponse.json(
        { success: false, message: "Your session has expired. Please sign in again." },
        { status: 401 }
      ),
    };
  }
}

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (
    !cloudName ||
    !/^[a-zA-Z0-9_-]+$/.test(cloudName) ||
    !apiKey ||
    !apiSecret
  ) {
    throw new Error("Cloudinary server configuration is incomplete.");
  }

  return { cloudName, apiKey, apiSecret };
}
