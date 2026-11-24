
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import { useAuth } from "./auth-provider";

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatDate(timestamp) {
  if (!timestamp) return "Date unavailable";

  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeStatus(status) {
  const value = String(status || "placed")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (["pending", "order_placed"].includes(value)) {
    return "placed";
  }

  return value;
}

function getStatus(status) {
  const statuses = {
    placed: {
      label: "Order placed",
      color: "bg-blue-100 text-blue-700",
    },
    confirmed: {
      label: "Confirmed",
      color: "bg-indigo-100 text-indigo-700",
    },
    preparing: {
      label: "Preparing",
      color: "bg-amber-100 text-amber-700",
    },
    ready_for_pickup: {
      label: "Ready for pickup",
      color: "bg-cyan-100 text-cyan-700",
    },
    out_for_delivery: {
      label: "Out for delivery",
      color: "bg-purple-100 text-purple-700",
    },
    delivered: {
      label: "Delivered",
      color: "bg-green-100 text-green-700",
    },
    cancelled: {
      label: "Cancelled",
      color: "bg-red-100 text-red-700",
    },
  };

  return statuses[normalizeStatus(status)] || {
    label: status || "Processing",
    color: "bg-gray-100 text-gray-700",
  };
}

function formatPaymentMethod(method) {
  const value = String(method || "cod")
    .trim()
    .toLowerCase();

  if (["cod", "cash", "cash on delivery"].includes(value)) {
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

export default function MyOrdersClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const loadedOrders = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        loadedOrders.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });

        setOrders(loadedOrders);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Orders loading error:", err);
        setError("Unable to load your orders. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4">
            Loading your orders...
          </p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#f6f8f4]">
      <div className="max-w-5xl mx-auto px-3 py-5 sm:px-4 sm:py-12">

        {/* Page heading */}
        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-8">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-green-700">
              DailyCart
            </p>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 sm:mt-2">
              My Orders
            </h1>

            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              View and track your grocery orders.
            </p>
          </div>

          <Link
            href="/"
            className="shrink-0 min-h-11 inline-flex items-center justify-center rounded-xl bg-white border border-gray-200 px-3 py-2 text-xs sm:px-4 sm:text-sm font-semibold text-gray-700 transition hover:border-green-200 hover:bg-green-50"
          >
            Continue shopping
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 sm:p-4 mb-5 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-6 shadow-sm sm:p-10 text-center">
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-5">
              🛍️
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              No orders yet
            </h2>

            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Your placed orders will appear here.
            </p>

            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center mt-4 sm:mt-6 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl transition"
            >
              Start shopping
            </Link>
          </div>
        )}

        {/* Order cards */}
        <div className="space-y-3 sm:space-y-5">
          {orders.map((order) => {
            const currentStatus = normalizeStatus(order.orderStatus);
            const status = getStatus(currentStatus);

            const items = Array.isArray(order.items)
              ? order.items
              : [];

            const address = order.deliveryAddress || {};
            const pricing = order.pricing || {};
            const payment = order.payment || {};

            const paymentMethod =
              order.paymentMethod || payment.method || "cod";

            const paymentStatus =
              order.paymentStatus || payment.status || "pending";

            const delivered = currentStatus === "delivered";
            const cancelled = currentStatus === "cancelled";

            return (
              <article
                key={order.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md sm:rounded-3xl"
              >
                <div className="p-3 sm:p-6">

                  {/* Order header */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] sm:text-xs text-gray-500">
                        ORDER ID
                      </p>

                      <p className="text-xs sm:text-base font-bold text-gray-900 mt-1 break-all">
                        {order.orderId || order.id}
                      </p>

                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold ${status.color}`}
                      >
                        {status.label}
                      </span>

                      <p className="text-base sm:text-lg font-extrabold text-gray-900 mt-2">
                        {formatPrice(pricing.total)}
                      </p>
                    </div>
                  </div>

                  {/* Delivery completion notice */}
                  {delivered && (
                    <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-3">
                      <p className="text-sm font-bold text-green-800">
                        ✓ Order successfully delivered
                      </p>

                      <p className="text-xs text-green-700 mt-1">
                        Thank you for shopping with DailyCart!
                      </p>
                    </div>
                  )}

                  {cancelled && (
                    <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-3">
                      <p className="text-sm font-bold text-red-700">
                        This order was cancelled.
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-100 my-3 sm:my-5" />

                  {/* Ordered items */}
                  <h3 className="text-xs sm:text-base font-bold text-gray-900 mb-2 sm:mb-3">
                    Items ordered ({items.length})
                  </h3>

                  <div className="space-y-2 sm:space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex justify-between items-center gap-2 text-xs sm:text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">
                            {item.name || "Product"}
                          </p>

                          <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5">
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

                  <div className="border-t border-gray-100 my-3 sm:my-5" />

                  {/* Payment and address */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Payment
                      </p>

                      <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-1.5 sm:mt-2">
                        {formatPaymentMethod(paymentMethod)}
                      </p>

                      <p
                        className={`text-[10px] sm:text-xs mt-1 ${
                          ["paid", "completed", "success", "successful"].includes(
                            String(paymentStatus).toLowerCase()
                          )
                            ? "text-green-700"
                            : "text-amber-700"
                        }`}
                      >
                        Status: {formatPaymentStatus(paymentStatus)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Delivery address
                      </p>

                      <p className="text-xs sm:text-sm text-gray-700 mt-1.5 sm:mt-2 leading-5 sm:leading-6 break-words">
                        {address.address || "Address unavailable"}
                        {address.pincode
                          ? `, ${address.pincode}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {/* Bill summary */}
                  <div className="bg-[#f7faf6] border border-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 mt-4 sm:mt-5">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">
                        Subtotal
                      </span>

                      <span className="font-medium">
                        {formatPrice(pricing.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs sm:text-sm mt-1.5 sm:mt-2">
                      <span className="text-gray-500">
                        Delivery fee
                      </span>

                      <span className="font-medium">
                        {formatPrice(pricing.deliveryFee)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs sm:text-sm mt-1.5 sm:mt-2">
                      <span className="text-gray-500">
                        Handling fee
                      </span>

                      <span className="font-medium">
                        {formatPrice(pricing.handlingFee)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2 font-bold text-gray-900 border-t border-gray-200 pt-2 sm:pt-3 mt-2 sm:mt-3">
                      <span className="text-xs sm:text-sm">
                        Total payable
                      </span>

                      <span className="text-sm sm:text-base">
                        {formatPrice(pricing.total)}
                      </span>
                    </div>
                  </div>

                  {/* Track order */}
                  <Link
                    href={`/track-order/${encodeURIComponent(order.id)}`}
                    className={`flex min-h-12 items-center justify-center w-full mt-4 text-xs sm:text-sm font-bold rounded-xl py-3 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${
                      delivered
                        ? "bg-green-50 hover:bg-green-100 text-green-800 border border-green-200"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {delivered
                      ? "View Delivered Order"
                      : cancelled
                        ? "View Order Details"
                        : "Track Order →"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
