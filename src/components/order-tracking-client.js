
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "../lib/firebase";
import { useAuth } from "./auth-provider";

const LiveDeliveryMap = dynamic(
  () => import("./live-delivery-map"),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 h-[300px] sm:h-[380px] rounded-2xl bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-500">
          Loading delivery map...
        </p>
      </div>
    ),
  }
);

const STEPS = [
  {
    id: "placed",
    label: "Order placed",
    description: "We've received your order.",
  },
  {
    id: "confirmed",
    label: "Confirmed",
    description: "Your order has been confirmed.",
  },
  {
    id: "preparing",
    label: "Preparing",
    description: "Your groceries are being prepared.",
  },
  {
    id: "ready_for_pickup",
    label: "Ready",
    description: "Your order is packed and ready for pickup.",
  },
  {
    id: "out_for_delivery",
    label: "On the way",
    description: "Your order is on its way to you.",
  },
  {
    id: "delivered",
    label: "Delivered",
    description: "Your order has been delivered.",
  },
];

function normalizeStatus(status) {
  const value = String(status || "placed")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (value === "order_placed" || value === "pending") {
    return "placed";
  }

  return value;
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(timestamp) {
  if (!timestamp) return "Date unavailable";

  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPaymentMethod(method) {
  const value = String(method || "cod").toLowerCase();

  if (value === "cod" || value === "cash on delivery") {
    return "Cash on Delivery";
  }

  return value.toUpperCase();
}

function formatPaymentStatus(status) {
  const value = String(status || "pending").toLowerCase();

  if (["paid", "completed", "success", "successful"].includes(value)) {
    return "Paid";
  }

  return "Payment pending";
}

export default function OrderTrackingClient({ orderId }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!orderId) {
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "orders", orderId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setOrder(null);
          setError("We couldn't find this order.");
          setLoading(false);
          return;
        }

        const data = snapshot.data();

        if (data.userId !== user.uid) {
          setOrder(null);
          setError("You don't have permission to view this order.");
          setLoading(false);
          return;
        }

        setOrder({
          id: snapshot.id,
          ...data,
        });

        setError("");
        setLoading(false);
      },
      (err) => {
        console.error("Order tracking error:", err);

        setError(
          "Unable to load tracking information. Please try again."
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, orderId, router]);

  const trackingError = !orderId
    ? "Invalid order ID."
    : error;

  if (authLoading || (loading && orderId)) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="text-sm text-gray-500 mt-4">
            Loading order tracking...
          </p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (trackingError || !order) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center border border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">
            Unable to track order
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            {trackingError || "Order not found."}
          </p>

          <Link
            href="/orders"
            className="inline-block mt-5 bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-3 text-sm font-bold transition"
          >
            Back to My Orders
          </Link>
        </div>
      </main>
    );
  }

  const currentStatus = normalizeStatus(order.orderStatus);

  const currentIndex = STEPS.findIndex(
    (step) => step.id === currentStatus
  );

  const cancelled = currentStatus === "cancelled";
  const delivered = currentStatus === "delivered";

  const progressIndex = currentIndex === -1 ? 0 : currentIndex;

  const currentStep = STEPS[progressIndex];

  const items = Array.isArray(order.items) ? order.items : [];

  const address = order.deliveryAddress || {};
  const pricing = order.pricing || {};

  // The delivery API stores payment information at the top level.
  const paymentMethod =
    order.paymentMethod || order.payment?.method || "cod";

  const paymentStatus =
    order.paymentStatus || order.payment?.status || "pending";

  const isPaid = ["paid", "completed", "success", "successful"].includes(
    String(paymentStatus).toLowerCase()
  );

  return (
    <main className="min-h-screen bg-[#f7f8f5]">
      <div className="max-w-3xl mx-auto px-3 py-5 sm:px-5 sm:py-10">
        <Link
          href="/orders"
          className="text-xs sm:text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to My Orders
        </Link>

        <div className="mt-5 sm:mt-7">
          <p className="text-xs font-bold tracking-wider text-green-700">
            DailyCart
          </p>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
            Track your order
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mt-2 break-all">
            Order ID: {order.orderId || order.id}
          </p>
        </div>

        {/* Current status */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mt-5">
          {cancelled ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="font-bold text-red-700">
                Order cancelled
              </p>

              <p className="text-xs sm:text-sm text-red-600 mt-1">
                This order has been cancelled.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500">
                    CURRENT STATUS
                  </p>

                  <h2 className="text-lg sm:text-xl font-extrabold text-green-700 mt-1">
                    {currentStep.label}
                  </h2>
                </div>

                <span className="text-3xl">
                  {delivered ? "✅" : "📦"}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                {currentStep.description}
              </p>

              <div className="w-full h-2 bg-gray-100 rounded-full mt-5 overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      ((progressIndex + 1) / STEPS.length) * 100
                    }%`,
                  }}
                />
              </div>
            </>
          )}
        </section>

        {/* Live delivery map */}
        {!cancelled && !delivered && (
          <LiveDeliveryMap
            orderId={order.id}
            addressLocation={address.location}
          />
        )}

        {/* Delivered message */}
        {delivered && (
          <section className="bg-green-50 border border-green-100 rounded-2xl p-5 mt-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>

              <div>
                <h2 className="font-bold text-green-800">
                  Your order has been delivered!
                </h2>

                <p className="text-xs text-green-700 mt-1">
                  Thank you for shopping with DailyCart.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Single-card order progress */}
        {!cancelled && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mt-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-base">
                Order progress
              </h2>

              <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2.5 py-1.5 rounded-full">
                {progressIndex + 1} OF {STEPS.length}
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-[8%] right-[8%] top-[13px] h-[3px] bg-gray-100 rounded-full" />

              <div
                className="absolute left-[8%] top-[13px] h-[3px] bg-green-600 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    (progressIndex / (STEPS.length - 1)) * 84
                  }%`,
                }}
              />

              <div className="relative grid grid-cols-6">
                {STEPS.map((step, index) => {
                  const completed = index <= progressIndex;
                  const active = index === progressIndex;

                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center min-w-0"
                    >
                      <div
                        className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold border-[3px] border-white shadow-sm z-10 ${
                          completed
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {completed ? "✓" : index + 1}
                      </div>

                      <p
                        className={`mt-3 text-[8px] sm:text-xs text-center leading-tight font-bold break-words ${
                          active
                            ? "text-green-700"
                            : completed
                              ? "text-gray-700"
                              : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>

                      {active && (
                        <span className="mt-1 text-[8px] sm:text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                          NOW
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 bg-gray-50 rounded-xl px-3 py-3">
              <p className="text-xs font-bold text-gray-800">
                {currentStep.label}
              </p>

              <p className="text-[11px] text-gray-500 mt-1">
                {currentStep.description}
              </p>
            </div>
          </section>
        )}

        {/* Order information */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 mt-4">
          <h2 className="font-bold text-gray-900 text-base sm:text-lg">
            Order details
          </h2>

          <p className="text-xs text-gray-500 mt-2">
            Placed on {formatDate(order.createdAt)}
          </p>

          <div className="border-t border-gray-100 my-4" />

          <h3 className="text-sm font-bold text-gray-800 mb-3">
            Items ({items.length})
          </h3>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="flex justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-800">
                    {item.name || "Product"}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>

                <p className="font-semibold text-gray-900 shrink-0">
                  {formatPrice(
                    item.lineTotal ??
                      Number(item.price || 0) *
                        Number(item.quantity || 0)
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 my-4" />

          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              Total payable
            </span>

            <span className="font-extrabold text-gray-900">
              {formatPrice(pricing.total)}
            </span>
          </div>

          {/* Delivery address */}
          <div className="bg-gray-50 rounded-xl p-3 mt-4">
            <p className="text-xs font-bold text-gray-500 uppercase">
              Delivery address
            </p>

            <p className="text-sm text-gray-700 mt-2 leading-5">
              {address.address || "Address unavailable"}
              {address.pincode ? `, ${address.pincode}` : ""}
            </p>
          </div>

          {/* Payment information */}
          <div
            className={`rounded-xl p-3 mt-3 ${
              isPaid
                ? "bg-green-50"
                : "bg-amber-50"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                isPaid ? "text-green-800" : "text-amber-800"
              }`}
            >
              Payment: {formatPaymentMethod(paymentMethod)}
            </p>

            <p
              className={`text-xs mt-1 ${
                isPaid ? "text-green-700" : "text-amber-700"
              }`}
            >
              {formatPaymentStatus(paymentStatus)}
            </p>

            {order.paymentCollection?.method && (
              <p className="text-xs text-green-700 mt-1">
                Collected through{" "}
                {String(order.paymentCollection.method).toUpperCase()}
              </p>
            )}
          </div>
        </section>

        <p className="text-center text-[11px] sm:text-xs text-gray-400 mt-5">
          Order status and payment updates appear automatically.
        </p>
      </div>
    </main>
  );
}
