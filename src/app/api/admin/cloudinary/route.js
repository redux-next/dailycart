import { NextResponse } from "next/server";

import { getCloudinaryConfig, requireAdmin } from "../../../../lib/admin-api";

const PAGE_SIZE = 30;

export async function GET(request) {
  const authentication = await requireAdmin(request);
  if (authentication.response) return authentication.response;

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim();
  const cursor = searchParams.get("next_cursor") || "";

  if (search.length > 100 || !/^[\p{L}\p{N}_/ -]*$/u.test(search)) {
    return NextResponse.json(
      { success: false, message: "Use letters, numbers, spaces, /, _ or - to search." },
      { status: 400 }
    );
  }

  if (cursor.length > 2048 || /[\u0000-\u001f]/.test(cursor)) {
    return NextResponse.json(
      { success: false, message: "Invalid image-library page cursor." },
      { status: 400 }
    );
  }

  try {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const searchTerms = search.split(/\s+/).filter(Boolean);
    const expression = searchTerms.length
      ? `resource_type:image AND ${searchTerms
          .map((term) => `(public_id:*${term}* OR filename:*${term}*)`)
          .join(" AND ")}`
      : "resource_type:image";
    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expression,
          max_results: PAGE_SIZE,
          ...(cursor ? { next_cursor: cursor } : {}),
          sort_by: [{ created_at: "desc" }],
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!cloudinaryResponse.ok) {
      console.error("Cloudinary image search failed:", cloudinaryResponse.status);
      return NextResponse.json(
        { success: false, message: "Unable to load Cloudinary images. Please retry." },
        { status: 502 }
      );
    }

    const result = await cloudinaryResponse.json();
    const assets = (result.resources || [])
      .filter(
        (asset) =>
          asset.resource_type === "image" &&
          asset.secure_url?.startsWith(`https://res.cloudinary.com/${cloudName}/`)
      )
      .map((asset) => ({
        publicId: asset.public_id,
        url: asset.secure_url,
        filename: asset.filename || asset.public_id?.split("/").at(-1) || "Image",
        width: asset.width,
        height: asset.height,
        bytes: asset.bytes,
      }));

    return NextResponse.json({
      success: true,
      assets,
      nextCursor: result.next_cursor || null,
    });
  } catch (error) {
    console.error("Cloudinary image search error:", error);
    return NextResponse.json(
      { success: false, message: "Cloudinary image library is unavailable. Please retry." },
      { status: 503 }
    );
  }
}
