import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "../../../lib/firebase-admin";

function errorResponse(message, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

function normalizeText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Please enter a valid support request.");
  }

  if (normalizeText(body?.website, 200)) {
    return NextResponse.json({ success: true, message: "Your request has been received." });
  }

  const name = normalizeText(body?.name, 80);
  const email = normalizeText(body?.email, 160).toLowerCase();
  const phone = normalizeText(body?.phone, 30);
  const orderId = normalizeText(body?.orderId, 128);
  const subject = normalizeText(body?.subject, 160);
  const message = normalizeText(body?.message, 3000);

  if (name.length < 2) return errorResponse("Please enter your name.");
  if (!isEmail(email)) return errorResponse("Please enter a valid email address.");
  if (phone && !/^[+\d][\d\s()-]{6,29}$/.test(phone)) {
    return errorResponse("Please enter a valid phone number.");
  }
  if (subject.length < 3) return errorResponse("Please enter a subject.");
  if (message.length < 10) return errorResponse("Please add more details to your message.");

  const forwardedFor = request.headers.get("x-forwarded-for");
  const sourceIp =
    forwardedFor?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const ipKey = Buffer.from(sourceIp).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 128);
  const windowStart = Date.now() - 10 * 60 * 1000;
  const rateLimitRef = adminDb.collection("supportRateLimits").doc(ipKey);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(rateLimitRef);
      const data = snapshot.exists ? snapshot.data() : {};
      const timestamps = Array.isArray(data.timestamps)
        ? data.timestamps.filter((timestamp) =>
            typeof timestamp === "number" && timestamp >= windowStart
          )
        : [];

      if (timestamps.length >= 5) {
        throw new Error("SUPPORT_RATE_LIMITED");
      }

      timestamps.push(Date.now());
      transaction.set(
        rateLimitRef,
        {
          timestamps,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch (error) {
    if (error.message === "SUPPORT_RATE_LIMITED") {
      return errorResponse("Too many support requests. Please try again later.", 429);
    }

    console.error("Support rate limit error:", error);
    return errorResponse("Unable to submit your request right now.", 500);
  }

  try {
    const requestRef = await adminDb.collection("supportRequests").add({
      name,
      email,
      phone,
      orderId,
      subject,
      message,
      status: "open",
      source: "public-contact-form",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Your support request was submitted successfully.",
        requestId: requestRef.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Support request storage error:", error);
    return errorResponse("Unable to submit your request right now.", 500);
  }
}
