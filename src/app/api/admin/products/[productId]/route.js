import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { adminDb } from "../../../../../lib/firebase-admin";
import { validateAdminProduct } from "../../../../../lib/admin-product-validation";
import { getCloudinaryConfig, requireAdmin } from "../../../../../lib/admin-api";

function responseError(message, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function PATCH(request, { params }) {
  const authentication = await requireAdmin(request);
  if (authentication.response) return authentication.response;

  const { productId } = await params;
  if (!/^[1-9]\d{0,8}$/.test(productId)) {
    return responseError("Invalid product ID.", 400);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return responseError("Invalid product details.");
  }

  try {
    const { cloudName } = getCloudinaryConfig();
    const reference = adminDb.collection("products").doc(`product-${productId}`);
    const snapshot = await reference.get();

    if (!snapshot.exists) {
      return responseError("Product not found.", 404);
    }

    const existing = snapshot.data();
    const validated = validateAdminProduct(body, existing, cloudName);
    if (validated.error) return responseError(validated.error);
    if (validated.product.category !== existing.category) {
      const categorySnapshot = await adminDb
        .collection("categories")
        .where("name", "==", validated.product.category)
        .limit(1)
        .get();
      if (categorySnapshot.empty) {
        return responseError("Choose a category already in the DailyCart catalogue.");
      }
    }

    await reference.set(
      {
        ...validated.product,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin product update failed:", error);
    return responseError("Unable to update the product. Please retry.", 500);
  }
}
