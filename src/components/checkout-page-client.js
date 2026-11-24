
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../lib/firebase";
import { useAuth } from "./auth-provider";
import { useCart } from "./cart-provider";
import { useCatalog } from "../hooks/use-catalog";
import LoadingImage from "./loading-image";

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getCheckoutAttempt(uid, cart, paymentMethod) {
  const storageKey = `dailycart-checkout:${uid}`;
  const payload = JSON.stringify({
    cart: Object.entries(cart).sort(([left], [right]) =>
      left.localeCompare(right)
    ),
    paymentMethod,
  });
  const storedAttempt = window.sessionStorage.getItem(storageKey);

  if (storedAttempt) {
    try {
      const attempt = JSON.parse(storedAttempt);

      if (
        attempt.payload === payload &&
        typeof attempt.key === "string" &&
        /^[A-Za-z0-9_-]{16,128}$/.test(attempt.key)
      ) {
        return { key: attempt.key, storageKey };
      }
    } catch (error) {
      console.error("Unable to read the saved checkout attempt:", error);
    }
  }

  if (!window.crypto?.randomUUID) {
    throw new Error(
      "Secure checkout is unavailable in this browser. Please update your browser and retry."
    );
  }

  const key = window.crypto.randomUUID();
  window.sessionStorage.setItem(
    storageKey,
    JSON.stringify({ key, payload })
  );

  return { key, storageKey };
}

export default function CheckoutPageClient() {
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const {
    cart,
    clearCart,
    isLoaded: cartLoaded,
  } = useCart();

  const {
    products = [],
    loading: catalogLoading,
    error: catalogError,
  } = useCatalog();

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Load customer profile.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);
      setProfileError("");

      try {
        const profileRef = doc(db, "users", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (cancelled) return;

        if (!profileSnap.exists()) {
          router.replace("/complete-profile");
          return;
        }

        const data = profileSnap.data();

        if (!data.profileCompleted) {
          router.replace("/complete-profile");
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error("Checkout profile error:", error);

        if (!cancelled) {
          setProfileError(
            "Unable to load your delivery details. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  // Prepare cart products using the Firestore catalogue.
  const cartItems = useMemo(() => {
    if (!cart || !products.length) return [];

    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = products.find(
          (item) => String(item.id) === String(productId)
        );

        if (!product) return null;

        return {
          ...product,
          quantity: Number(quantity),
        };
      })
      .filter(
        (item) =>
          item &&
          Number.isSafeInteger(item.quantity) &&
          item.quantity > 0
      );
  }, [cart, products]);

  // Identify products that no longer exist.
  const missingItems = useMemo(() => {
    if (!cart || catalogLoading || catalogError) return [];

    return Object.keys(cart).filter(
      (productId) =>
        !products.some(
          (product) => String(product.id) === String(productId)
        )
    );
  }, [cart, products, catalogLoading, catalogError]);

  // Calculate bill.
  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * item.quantity,
        0
      ),
    [cartItems]
  );

  const deliveryFee = subtotal >= 299 || subtotal === 0 ? 0 : 19;
  const handlingFee = itemCount > 0 ? 4 : 0;
  const total = subtotal + deliveryFee + handlingFee;

  // COD is allowed only when total is strictly above ₹100.
  const codAvailable = total > 100;
  const effectivePaymentMethod =
    codAvailable && paymentMethod === "cod" ? "cod" : "upi";

  const isLoading =
    authLoading ||
    !cartLoaded ||
    catalogLoading ||
    profileLoading;

  const canCheckout =
    !isLoading &&
    !catalogError &&
    !profileError &&
    Boolean(profile) &&
    itemCount > 0 &&
    cartItems.length > 0 &&
    missingItems.length === 0;

  // Place an authenticated order.
  async function handlePlaceOrder() {
    setOrderError("");

    if (placingOrder) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (effectivePaymentMethod !== "cod") {
      setOrderError(
        "UPI payments are not activated yet. Please select Cash on Delivery."
      );
      return;
    }

    if (!canCheckout) {
      setOrderError(
        "Please check your cart and delivery details before placing your order."
      );
      return;
    }

    if (!codAvailable) {
      setOrderError(
        "Cash on Delivery is available only for orders above ₹100."
      );
      return;
    }

    try {
      setPlacingOrder(true);

      const checkoutAttempt = getCheckoutAttempt(
        user.uid,
        cart,
        effectivePaymentMethod
      );
      const idToken = await user.getIdToken();

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "Idempotency-Key": checkoutAttempt.key,
        },
        body: JSON.stringify({
          cart,
          paymentMethod: effectivePaymentMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.order?.orderId) {
        throw new Error(
          result.message || "Unable to place your order."
        );
      }

      try {
        window.sessionStorage.removeItem(checkoutAttempt.storageKey);
      } catch (error) {
        console.error("Unable to clear the completed checkout attempt:", error);
      }

      clearCart();

      router.push(
        `/order-success?orderId=${encodeURIComponent(
          result.order.orderId
        )}`
      );
    } catch (error) {
      console.error("Order placement error:", error);

      setOrderError(
        error.message || "Something went wrong. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  }

  // Loading screen.
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] flex items-center justify-center p-4 sm:p-6">
        <div className="text-center">
          <div className="w-9 h-9 sm:w-10 sm:h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-xs sm:text-sm font-medium text-gray-600">
            Preparing your checkout...
          </p>
        </div>
      </main>
    );
  }

  // Error screen.
  if (profileError || catalogError) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] p-4 sm:p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 max-w-md w-full text-center">
          <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⚠️</div>

          <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">
            {profileError ||
              "Unable to load products. Please try again."}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3 text-sm"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  // Empty cart screen.
  if (itemCount === 0) {
    return (
      <main className="min-h-screen bg-[#f7f8f5] flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 max-w-md w-full text-center">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🛒</div>

          <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">
            Add some products before proceeding to checkout.
          </p>

          <Link
            href="/"
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3 text-sm"
          >
            Explore products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] pb-8 sm:pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="text-xl sm:text-2xl">🛍️</span>

            <span className="text-lg sm:text-xl font-extrabold text-green-700">
              DailyCart
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-sm font-semibold text-gray-500 whitespace-nowrap">
            <span className="text-green-600">Cart</span>
            <span>—</span>
            <span className="text-green-600">Checkout</span>
            <span>—</span>
            <span>Confirmation</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {/* Page heading */}
        <div className="mb-5 sm:mb-7">
          <Link
            href="/cart"
            className="text-xs sm:text-sm text-green-700 font-semibold hover:underline"
          >
            ← Back to cart
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-3 sm:mt-4">
            Checkout
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Confirm your delivery details and payment method.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 sm:gap-6 items-start">

          {/* Left section */}
          <div className="space-y-3 sm:space-y-5">

            {/* Delivery address */}
            <section className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-700">
                    Step 1
                  </p>

                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                    Delivery address
                  </h2>
                </div>

                <Link
                  href="/complete-profile"
                  className="text-xs sm:text-sm font-semibold text-green-700 hover:underline shrink-0"
                >
                  Edit details
                </Link>
              </div>

              <div className="flex gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-green-50 flex items-center justify-center text-lg sm:text-xl">
                  📍
                </div>

                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-bold text-gray-900">
                    {profile?.name || "Customer"}
                  </p>

                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-5 sm:leading-6 break-words">
                    {profile?.address || "No address saved"}
                  </p>

                  {profile?.pincode && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      PIN: {profile.pincode}
                    </p>
                  )}

                  {profile?.phoneNumber && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      +91 {profile.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              {profile?.location?.latitude &&
                profile?.location?.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${profile.location.latitude},${profile.location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-green-700 mt-3 sm:mt-4 hover:underline"
                  >
                    View saved map location ↗
                  </a>
                )}
            </section>

            {/* Payment method */}
            <section className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <div className="mb-4 sm:mb-5">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-700">
                  Step 2
                </p>

                <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                  Payment method
                </h2>

                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Choose how you want to pay.
                </p>
              </div>

              <div className="space-y-2.5 sm:space-y-3">

                {/* UPI */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("upi");
                    setOrderError("");
                  }}
                  className={`w-full text-left rounded-xl border-2 p-3 sm:p-4 transition ${
                    effectivePaymentMethod === "upi"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center text-xl sm:text-2xl shrink-0">
                      📱
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-bold text-gray-900">
                        UPI
                      </p>

                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                        Pay using a UPI app
                      </p>
                    </div>

                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        effectivePaymentMethod === "upi"
                          ? "border-green-600"
                          : "border-gray-300"
                      }`}
                    >
                      {effectivePaymentMethod === "upi" && (
                        <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                      )}
                    </span>
                  </div>
                </button>

                {/* COD */}
                <button
                  type="button"
                  disabled={!codAvailable}
                  onClick={() => {
                    setPaymentMethod("cod");
                    setOrderError("");
                  }}
                  className={`w-full text-left rounded-xl border-2 p-3 sm:p-4 transition ${
                    !codAvailable
                      ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                      : effectivePaymentMethod === "cod"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white flex items-center justify-center text-xl sm:text-2xl shrink-0">
                      💵
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-bold text-gray-900">
                        Cash on Delivery
                      </p>

                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                        {codAvailable
                          ? "Pay when your order arrives"
                          : "Available only for orders above ₹100"}
                      </p>
                    </div>

                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        effectivePaymentMethod === "cod"
                          ? "border-green-600"
                          : "border-gray-300"
                      }`}
                    >
                      {effectivePaymentMethod === "cod" && (
                        <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                      )}
                    </span>
                  </div>
                </button>
              </div>

              {effectivePaymentMethod === "upi" && (
                <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                  UPI payment will be activated after payment gateway integration.
                </p>
              )}

              {effectivePaymentMethod === "cod" && (
                <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                  You will pay in cash when your order is delivered.
                  COD availability is also verified by the server.
                </p>
              )}
            </section>

            {/* Items */}
            <section className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div>
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-green-700">
                    Step 3
                  </p>

                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                    Your items
                  </h2>
                </div>

                <Link
                  href="/cart"
                  className="text-xs sm:text-sm font-semibold text-green-700 hover:underline"
                >
                  Edit cart
                </Link>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 sm:gap-3"
                  >
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl bg-gray-50 overflow-hidden shrink-0">
                      {item.image ? (
                        <LoadingImage
                          src={item.image}
                          alt={item.name}
                          sizes="64px"
                          objectFit="contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl">
                          🛒
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2">
                        {item.name}
                      </p>

                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="font-bold text-xs sm:text-sm text-gray-900 shrink-0">
                      {formatPrice(
                        Number(item.price || 0) * item.quantity
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {missingItems.length > 0 && (
                <div className="mt-4 rounded-xl bg-red-50 text-red-700 text-xs sm:text-sm p-3">
                  Some products in your cart are no longer available.
                  Please return to your cart and remove them.
                </div>
              )}
            </section>
          </div>

          {/* Right section */}
          <aside className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-5">
              Bill details
            </h2>

            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
              <div className="flex justify-between gap-3 text-gray-600">
                <span>Items ({itemCount})</span>

                <span className="font-semibold text-gray-900">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-gray-600">
                <span>Delivery fee</span>

                <span className="font-semibold text-gray-900">
                  {deliveryFee === 0 ? (
                    <span className="text-green-700">FREE</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-3 text-gray-600">
                <span>Handling fee</span>

                <span className="font-semibold text-gray-900">
                  {formatPrice(handlingFee)}
                </span>
              </div>

              {subtotal > 0 && subtotal < 299 && (
                <div className="rounded-xl bg-green-50 p-3 text-[10px] sm:text-xs text-green-800">
                  Add {formatPrice(299 - subtotal)} more to get free delivery.
                </div>
              )}

              <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center">
                <span className="font-bold text-gray-900">
                  To pay
                </span>

                <span className="text-lg sm:text-xl font-extrabold text-gray-900">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Payment summary */}
            <div className="mt-4 sm:mt-6 rounded-xl bg-gray-50 p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-gray-500">
                Selected payment method
              </p>

              <p className="text-sm font-bold text-gray-900 mt-1">
                {effectivePaymentMethod === "upi"
                  ? "UPI"
                  : "Cash on Delivery"}
              </p>
            </div>

            {/* Order error */}
            {orderError && (
              <div
                role="alert"
                className="mt-3 sm:mt-4 rounded-xl bg-red-50 border border-red-100 p-3 text-xs sm:text-sm text-red-700"
              >
                {orderError}
              </div>
            )}

            {/* Place order */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={
                !canCheckout ||
                effectivePaymentMethod !== "cod" ||
                placingOrder
              }
              className={`w-full mt-4 sm:mt-5 rounded-xl font-bold py-3.5 text-sm transition ${
                canCheckout &&
                effectivePaymentMethod === "cod" &&
                !placingOrder
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {placingOrder
                ? "Placing your order..."
                : effectivePaymentMethod !== "cod"
                ? "Select Cash on Delivery"
                : "Place order"}
            </button>

            <p className="text-[10px] sm:text-[11px] text-center text-gray-400 mt-3 leading-5">
              Your order will be confirmed after successful server verification.
            </p>

            <div className="flex items-center justify-center gap-2 mt-4 sm:mt-5 text-[10px] sm:text-xs text-gray-500">
              <span>🔒</span>
              <span>Secure checkout</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
