import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { adminDb } from "../../../../lib/firebase-admin";
import { validateAdminProduct } from "../../../../lib/admin-product-validation";
import { getCloudinaryConfig, requireAdmin } from "../../../../lib/admin-api";

function responseError(message, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function GET(request) {
  const authentication = await requireAdmin(request);
  if (authentication.response) return authentication.response;

  try {
    const [snapshot, categorySnapshot] = await Promise.all([
      adminDb.collection("products").get(),
      adminDb.collection("categories").get(),
    ]);
    const products = snapshot.docs
      .map((item) => item.data())
      .sort((left, right) => Number(left.id) - Number(right.id));
    const categories = categorySnapshot.docs
      .map((item) => ({
        id: item.id,
        name: item.data().name,
      }))
      .filter((category) => typeof category.name === "string" && category.name);

    return NextResponse.json({ success: true, products, categories });
  } catch (error) {
    console.error("Admin product list failed:", error);
    return responseError("Unable to load products. Please retry.", 500);
  }
}

export async function POST(request) {
  const authentication = await requireAdmin(request);
  if (authentication.response) return authentication.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return responseError("Invalid product details.");
  }

  try {
    const { cloudName } = getCloudinaryConfig();
    const validated = validateAdminProduct(body, null, cloudName);
    if (validated.error) return responseError(validated.error);
    const categorySnapshot = await adminDb
      .collection("categories")
      .where("name", "==", validated.product.category)
      .limit(1)
      .get();
    if (categorySnapshot.empty) {
      return responseError("Choose a category already in the DailyCart catalogue.");
    }

    const collection = adminDb.collection("products");
    const counterRef = adminDb.collection("settings").doc("productCounter");
    const productId = await adminDb.runTransaction(async (transaction) => {
      const counterSnapshot = await transaction.get(counterRef);
      let nextId = counterSnapshot.exists
        ? Number(counterSnapshot.data().nextId)
        : 0;
      let productRef = Number.isSafeInteger(nextId) && nextId > 0
        ? collection.doc(`product-${nextId}`)
        : null;
      let productSnapshot = productRef
        ? await transaction.get(productRef)
        : null;

      if (!productRef || productSnapshot.exists) {
        const productsSnapshot = await transaction.get(collection);
        const highestId = productsSnapshot.docs.reduce(
          (highest, item) => Math.max(highest, Number(item.data().id) || 0),
          0
        );
        nextId = highestId + 1;
        productRef = collection.doc(`product-${nextId}`);
      }

      transaction.create(productRef, {
        id: nextId,
        ...validated.product,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.set(counterRef, { nextId: nextId + 1 }, { merge: true });

      return nextId;
    });

    if (productId == null) {
      return responseError("Unable to allocate a new product ID. Please retry.", 409);
    }

    return NextResponse.json(
      { success: true, productId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin product creation failed:", error);
    return responseError("Unable to create the product. Please retry.", 500);
  }
}
