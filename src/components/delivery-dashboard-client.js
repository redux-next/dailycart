
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "../lib/firebase";

const DELIVERY_STEPS = [
  {
    status: "confirmed",
    label: "Confirm order",
    description: "Accept the assigned order.",
  },
  {
    status: "preparing",
    label: "Start preparing",
    description: "The order is being prepared.",
  },
  {
    status: "ready_for_pickup",
    label: "Ready for pickup",
    description: "The order is ready to leave.",
  },
  {
    status: "out_for_delivery",
    label: "Start delivery",
    description: "You are on your way to the customer.",
  },
  {
    status: "delivered",
    label: "Mark as delivered",
    description: "Confirm successful delivery.",
  },
];

function normalizeStatus(status) {
  const value = String(status || "placed")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (["pending", "order_placed"].includes(value)) return "placed";

  return value;
}

function formatStatus(status) {
  return normalizeStatus(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getNextDeliveryStep(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "placed") return DELIVERY_STEPS[0];

  const currentIndex = DELIVERY_STEPS.findIndex(
    (step) => step.status === normalized
  );

  if (currentIndex === -1) return null;

  return DELIVERY_STEPS[currentIndex + 1] || null;
}

function formatAddress(address) {
  if (!address) return "No delivery address available";

  if (typeof address === "string") return address;

  return [
    address.address,
    address.pincode,
    address.city,
    address.state,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function normalizePaymentMethod(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
}

function getPaymentMethod(order) {
  return (
    order?.paymentMethod ||
    order?.payment_method ||
    order?.paymentMode ||
    order?.payment_mode ||
    order?.payment?.method ||
    order?.payment?.paymentMethod ||
    order?.paymentDetails?.method ||
    order?.paymentDetails?.paymentMethod ||
    order?.paymentInfo?.method ||
    ""
  );
}

function isCodOrder(order) {
  const method = normalizePaymentMethod(getPaymentMethod(order));

  return [
    "cod",
    "cash",
    "cash on delivery",
    "cashondelivery",
    "cash delivery",
  ].includes(method);
}

function getPaymentStatus(order) {
  return normalizePaymentMethod(
    order?.paymentStatus ||
      order?.payment_status ||
      order?.payment?.status ||
      order?.paymentDetails?.status ||
      order?.paymentInfo?.status ||
      ""
  );
}

function isPaymentPaid(order) {
  return [
    "paid",
    "completed",
    "success",
    "successful",
  ].includes(getPaymentStatus(order));
}

function formatPaymentMethod(method) {
  const normalized = normalizePaymentMethod(method);

  if (normalized === "cash") return "Cash";
  if (normalized === "upi") return "UPI";

  return "Not collected";
}

function formatCollectedDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getOrderTotal(order) {
  const candidates = [
    order?.pricing?.total,
    order?.totalAmount,
    order?.total,
    order?.grandTotal,
    order?.amount,
    order?.pricing?.grandTotal,
  ];

  const value = candidates.find(
    (candidate) =>
      candidate !== undefined &&
      candidate !== null &&
      candidate !== ""
  );

  return Number(value || 0);
}

export default function DeliveryDashboardClient() {
  const [user, setUser] = useState(null);
  const [accessState, setAccessState] = useState("checking");

  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [sharing, setSharing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [lastLocation, setLastLocation] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [collectingPayment, setCollectingPayment] = useState(false);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const sendingRef = useRef(false);
  const selectedOrderRef = useRef("");

  const selectedOrder = orders.find(
    (order) => order.id === selectedOrderId
  );

  useEffect(() => {
    selectedOrderRef.current = selectedOrderId;
  }, [selectedOrderId]);

  const getToken = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error("Please sign in again.");
    }

    return auth.currentUser.getIdToken();
  }, []);

  const loadOrders = useCallback(async () => {
    if (!auth.currentUser) return;

    setLoadingOrders(true);
    setError("");

    try {
      const token = await getToken();

      const response = await fetch("/api/delivery/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load orders.");
      }

      const loadedOrders = (result.orders || []).map((order) => ({
        ...order,
        id: order.id,
      }));

      setOrders(loadedOrders);

      setSelectedOrderId((current) => {
        if (loadedOrders.some((order) => order.id === current)) {
          return current;
        }

        return loadedOrders[0]?.id || "";
      });
    } catch (err) {
      setError(err.message || "Unable to load assigned orders.");
    } finally {
      setLoadingOrders(false);
    }
  }, [getToken]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setOrders([]);
      setSelectedOrderId("");

      if (!currentUser) {
        setAccessState("signed-out");
        return;
      }

      setAccessState("checking");

      try {
        const tokenResult = await currentUser.getIdTokenResult(true);

        if (tokenResult.claims.deliveryBoy !== true) {
          setAccessState("denied");
          return;
        }

        setAccessState("allowed");
      } catch {
        setAccessState("denied");
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (accessState === "allowed" && user) {
      const timerId = window.setTimeout(() => {
        loadOrders();
      }, 0);

      return () => window.clearTimeout(timerId);
    }
  }, [accessState, user, loadOrders]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  async function postLocation(position, isActive) {
    const token = await getToken();

    const response = await fetch("/api/delivery/location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId: selectedOrderRef.current,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        isActive,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Location update failed.");
    }

    return result;
  }

  function handleGpsError(gpsError) {
    const messages = {
      1: "Location permission denied. Allow location access in your browser.",
      2: "Your current location is unavailable. Check your GPS.",
      3: "Location request timed out. Try again.",
    };

    setGpsStatus(
      messages[gpsError.code] || "Unable to access your location."
    );

    setError(messages[gpsError.code] || "GPS error.");
  }

  function startSharing() {
    if (!selectedOrderId) {
      setError("Select an assigned order first.");
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    if (!window.isSecureContext) {
      setError("GPS requires HTTPS or localhost.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setGpsStatus("Requesting GPS permission...");

    lastPositionRef.current = null;
    lastSentAtRef.current = 0;
    sendingRef.current = false;

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        lastPositionRef.current = position;

        setLastLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setGpsStatus("GPS location received");

        if (
          sendingRef.current ||
          Date.now() - lastSentAtRef.current < 5000
        ) {
          return;
        }

        sendingRef.current = true;

        try {
          await postLocation(position, true);

          lastSentAtRef.current = Date.now();
          setSharing(true);
          setGpsStatus("Sharing live location");
          setError("");
        } catch (err) {
          setError(err.message || "Unable to share location.");

          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }

          setSharing(false);
          setGpsStatus("Location sharing failed");
        } finally {
          sendingRef.current = false;
        }
      },
      handleGpsError,
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 20000,
      }
    );
  }

  async function stopSharing() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setSharing(false);
    setGpsStatus("Stopping location sharing");

    const position = lastPositionRef.current;

    if (!position) {
      setGpsStatus("Location sharing stopped");
      return true;
    }

    try {
      await postLocation(position, false);
      setGpsStatus("Location sharing stopped");
      setError("");
      return true;
    } catch (err) {
      setGpsStatus("Could not confirm sharing stopped");
      setError(err.message || "Unable to stop location sharing.");
      return false;
    }
  }

  async function handleUpdateProgress() {
    if (!selectedOrder || updatingProgress) {
      setError("Select an order first.");
      return;
    }

    const nextStep = getNextDeliveryStep(selectedOrder.orderStatus);

    if (!nextStep) {
      setError("This order has no further delivery progress step.");
      return;
    }

    const confirmed = window.confirm(
      `Update order #${selectedOrder.id.slice(0, 10)} to "${formatStatus(nextStep.status)}"?`
    );

    if (!confirmed) return;

    setUpdatingProgress(true);
    setError("");
    setSuccessMessage("");

    try {
      if (nextStep.status === "delivered" && sharing) {
        const stopped = await stopSharing();

        if (!stopped) {
          throw new Error(
            "Could not confirm GPS sharing stopped. Please try again before completing delivery."
          );
        }
      }

      const token = await getToken();

      const response = await fetch("/api/delivery/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "update_status",
          orderId: selectedOrder.id,
          status: nextStep.status,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to update delivery progress."
        );
      }

      if (nextStep.status === "delivered") {
        setOrders((currentOrders) =>
          currentOrders.filter(
            (order) => order.id !== selectedOrder.id
          )
        );

        setSelectedOrderId((currentId) => {
          if (currentId !== selectedOrder.id) return currentId;

          return (
            orders.find((order) => order.id !== selectedOrder.id)?.id ||
            ""
          );
        });

        setSuccessMessage(
          `Order #${selectedOrder.id.slice(0, 10)} has been marked as delivered successfully.`
        );
      } else {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === selectedOrder.id
              ? {
                  ...order,
                  orderStatus: nextStep.status,
                }
              : order
          )
        );

        setSuccessMessage(
          `Order #${selectedOrder.id.slice(0, 10)} updated to "${formatStatus(nextStep.status)}". The customer's tracking page will update automatically.`
        );
      }
    } catch (err) {
      setError(err.message || "Unable to update delivery progress.");
    } finally {
      setUpdatingProgress(false);
    }
  }

  async function handleCollectPayment() {
    if (!selectedOrder || collectingPayment) {
      setError("Select an order first.");
      return;
    }

    if (!isCodOrder(selectedOrder)) {
      setError(
        `This order is not detected as COD. Detected payment method: "${String(getPaymentMethod(selectedOrder) || "missing")}".`
      );
      return;
    }

    if (isPaymentPaid(selectedOrder)) {
      setError("This order has already been marked as paid.");
      return;
    }

    const amount = getOrderTotal(selectedOrder);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("The order has an invalid payment amount. Contact the admin.");
      return;
    }

    const confirmed = window.confirm(
      `Confirm that you have actually received ${formatPrice(amount)} from the customer through ${formatPaymentMethod(paymentMethod)}?`
    );

    if (!confirmed) return;

    setCollectingPayment(true);
    setError("");
    setSuccessMessage("");

    try {
      const token = await getToken();

      const response = await fetch("/api/delivery/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          method: paymentMethod,
          confirmedReceived: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to record payment.");
      }

      const collectedAt =
        result.order?.paymentCollection?.collectedAt ||
        new Date().toISOString();

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === selectedOrder.id
            ? {
                ...order,
                paymentStatus: "paid",
                paymentCollection: {
                  method: paymentMethod,
                  collectedBy: user?.uid || "",
                  collectedAt,
                },
              }
            : order
        )
      );

      setSuccessMessage(
        `${formatPrice(amount)} ${formatPaymentMethod(paymentMethod)} payment successfully recorded for order #${selectedOrder.id.slice(0, 10)}.`
      );
    } catch (err) {
      setError(err.message || "Unable to collect payment.");
    } finally {
      setCollectingPayment(false);
    }
  }

  async function handleLogout() {
    const confirmed = window.confirm(
      "Are you sure you want to log out of DailyCart Delivery?"
    );

    if (!confirmed) return;

    setLoggingOut(true);
    setError("");

    try {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (lastPositionRef.current && selectedOrderRef.current) {
        try {
          await postLocation(lastPositionRef.current, false);
        } catch (locationError) {
          console.error(
            "Unable to stop GPS before logout:",
            locationError
          );
        }
      }

      setSharing(false);
      await signOut(auth);
    } catch (err) {
      setError(err.message || "Unable to log out.");
      setLoggingOut(false);
    }
  }

  if (accessState === "checking") {
    return (
      <main className="min-h-screen bg-[#f7f8f5] flex items-center justify-center p-6">
        <p className="text-sm text-gray-500">
          Checking delivery access...
        </p>
      </main>
    );
  }

  if (accessState === "signed-out") {
    return (
      <main className="min-h-screen bg-[#f7f8f5] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl">
            🚚
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            DailyCart Delivery
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Please sign in with your delivery personnel account to
            access your dashboard.
          </p>

          <a
            href="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
          >
            Go to login
          </a>
        </div>
      </main>
    );
  }

  if (accessState === "denied") {
    return (
      <main className="min-h-screen bg-[#f7f8f5] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Access denied
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            This account does not have delivery personnel permissions.
          </p>

          <button
            onClick={() => signOut(auth)}
            className="mt-6 w-full rounded-xl bg-gray-900 px-5 py-3 font-bold text-white hover:bg-black"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  const selectedIsCod = selectedOrder
    ? isCodOrder(selectedOrder)
    : false;

  const selectedIsPaid = selectedOrder
    ? isPaymentPaid(selectedOrder)
    : false;

  const nextDeliveryStep = selectedOrder
    ? getNextDeliveryStep(selectedOrder.orderStatus)
    : null;

  const currentStatus = selectedOrder
    ? normalizeStatus(selectedOrder.orderStatus)
    : "";

  const selectedAmount = selectedOrder
    ? getOrderTotal(selectedOrder)
    : 0;

  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-green-700">
              DailyCart DELIVERY
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Delivery Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Welcome, {user?.displayName || user?.email || "Delivery partner"}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadOrders}
              disabled={loadingOrders || loggingOut}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loadingOrders ? "Refreshing..." : "Refresh orders"}
            </button>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {loggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {successMessage}
          </div>
        )}

        {/* ASSIGNED ORDERS */}
        <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900">
              Assigned orders
            </h2>

            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
              {orders.length} active
            </span>
          </div>

          {loadingOrders ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Loading assigned orders...
            </p>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-semibold text-gray-800">
                No assigned orders
              </p>

              <p className="mt-2 text-sm text-gray-500">
                New orders will appear here after an admin assigns them to you.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {orders.map((order) => {
                const paid = isPaymentPaid(order);

                return (
                  <button
                    key={order.id}
                    onClick={() => {
                      if (!sharing && !updatingProgress && !collectingPayment) {
                        setSelectedOrderId(order.id);
                        setError("");
                        setSuccessMessage("");
                      }
                    }}
                    disabled={
                      (sharing && selectedOrderId !== order.id) ||
                      updatingProgress ||
                      collectingPayment
                    }
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedOrderId === order.id
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 bg-white hover:border-green-300"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-gray-900">
                        Order #{order.id.slice(0, 10)}
                      </span>

                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                        {formatStatus(order.orderStatus)}
                      </span>
                    </div>

<div className="mt-2">
  <p className="text-sm font-semibold text-gray-800">
    {order.customer?.name || "Customer"}
  </p>

  {order.customer?.phone ? (
    <a
      href={`tel:${order.customer.phone}`}
      onClick={(event) => event.stopPropagation()}
      className="mt-2 inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 text-sm font-semibold text-green-800 hover:bg-green-200"
    >
      📞 Call Customer: {order.customer.phone}
    </a>
  ) : (
    <p className="mt-2 text-xs text-red-500">
      Customer phone number unavailable
    </p>
  )}
</div>

                    <p className="mt-1 text-sm text-gray-500">
                      {formatAddress(order.deliveryAddress)}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          paid
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {paid ? "Payment collected" : "Payment pending"}
                      </span>

                      <span className="text-xs text-gray-400">
                        {order.items?.length || 0} item(s)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {selectedOrder && (
          <>
            {/* DELIVERY PROGRESS */}
            <section className="mt-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-green-700">
                    ORDER #{selectedOrder.id.slice(0, 10)}
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-gray-900">
                    Delivery progress
                  </h2>
                </div>

                <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                  {formatStatus(selectedOrder.orderStatus)}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { status: "placed", label: "Order placed" },
                  ...DELIVERY_STEPS,
                ].map((step, index, allSteps) => {
                  const stepIndex = allSteps.findIndex(
                    (item) => item.status === step.status
                  );

                  const activeIndex = allSteps.findIndex(
                    (item) => item.status === currentStatus
                  );

                  const completed =
                    activeIndex >= 0 && stepIndex <= activeIndex;

                  return (
                    <div key={step.status} className="flex items-start gap-3">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          completed
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {completed ? "✓" : index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            completed ? "text-green-800" : "text-gray-500"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {nextDeliveryStep ? (
                <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                    Next action
                  </p>

                  <h3 className="mt-1 text-base font-bold text-gray-900">
                    {nextDeliveryStep.label}
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    {nextDeliveryStep.description}
                  </p>

                  <button
                    type="button"
                    onClick={handleUpdateProgress}
                    disabled={updatingProgress || loadingOrders || collectingPayment}
                    className="mt-4 w-full rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingProgress
                      ? "Updating order..."
                      : nextDeliveryStep.label}
                  </button>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="font-bold text-green-800">
                    Delivery completed
                  </p>

                  <p className="mt-1 text-sm text-green-700">
                    This order has reached its final delivery stage.
                  </p>
                </div>
              )}
            </section>

            {/* COD PAYMENT COLLECTION */}
            <section className="mt-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm font-semibold text-green-700">
                ORDER PAYMENT
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-900">
                Payment collection
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Order #{selectedOrder.id.slice(0, 10)}
              </p>

              <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  Detected payment method
                </p>

                <p className="mt-1 text-base font-bold text-gray-900">
                  {String(getPaymentMethod(selectedOrder) || "Not found")}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Payment status: {getPaymentStatus(selectedOrder) || "pending"}
                </p>
              </div>

              {selectedIsCod && (
                <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Amount to collect
                  </p>

                  <p className="mt-1 text-3xl font-extrabold text-gray-900">
                    {formatPrice(selectedAmount)}
                  </p>
                </div>
              )}

              {!selectedIsCod ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-900">
                    COD not detected
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    The order&apos;s payment method is not recognized as Cash on
                    Delivery. Check the detected payment method above.
                  </p>
                </div>
              ) : selectedIsPaid ? (
                <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="font-bold text-green-800">
                    ✓ COD payment successfully collected
                  </p>

                  <p className="mt-2 text-sm text-green-700">
                    {formatPaymentMethod(
                      selectedOrder.paymentCollection?.method
                    )}{" "}
                    payment received.
                  </p>

                  {selectedOrder.paymentCollection?.collectedAt && (
                    <p className="mt-2 text-xs text-green-700">
                      Recorded:{" "}
                      {formatCollectedDate(
                        selectedOrder.paymentCollection.collectedAt
                      )}
                    </p>
                  )}

                  <p className="mt-3 text-xl font-extrabold text-green-800">
                    {formatPrice(selectedAmount)}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="font-semibold text-amber-900">
                      Payment is pending
                    </p>

                    <p className="mt-1 text-sm text-amber-800">
                      Collect {formatPrice(selectedAmount)} from the customer.
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="mb-3 text-sm font-semibold text-gray-800">
                      Select payment received
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cash")}
                        disabled={collectingPayment}
                        className={`rounded-2xl border p-4 text-left transition disabled:opacity-50 ${
                          paymentMethod === "cash"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <span className="text-2xl">💵</span>

                        <span className="mt-2 block font-bold text-gray-900">
                          Cash
                        </span>

                        <span className="mt-1 block text-xs text-gray-500">
                          Cash received
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("upi")}
                        disabled={collectingPayment}
                        className={`rounded-2xl border p-4 text-left transition disabled:opacity-50 ${
                          paymentMethod === "upi"
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <span className="text-2xl">📱</span>

                        <span className="mt-2 block font-bold text-gray-900">
                          UPI
                        </span>

                        <span className="mt-1 block text-xs text-gray-500">
                          UPI payment received
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCollectPayment}
                    disabled={
                      collectingPayment ||
                      updatingProgress ||
                      !Number.isFinite(selectedAmount) ||
                      selectedAmount <= 0
                    }
                    className="mt-5 w-full rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {collectingPayment
                      ? "Recording payment..."
                      : `Confirm ${formatPaymentMethod(paymentMethod)} received`}
                  </button>

                  <p className="mt-3 text-xs leading-5 text-gray-400">
                    Only confirm after physically receiving cash or verifying
                    that the UPI payment has reached the intended recipient.
                    This records the collection; it does not initiate a UPI
                    transaction.
                  </p>
                </>
              )}
            </section>
          </>
        )}

        {/* LIVE LOCATION SHARING */}
        <section className="mt-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-gray-900">
            Live location sharing
          </h2>

          {selectedOrder ? (
            <p className="mt-2 text-sm text-gray-500">
              Selected order: #{selectedOrder.id.slice(0, 10)}
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              Select an assigned order to start.
            </p>
          )}

          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
            <span
              className={`h-3 w-3 rounded-full ${
                sharing ? "animate-pulse bg-green-500" : "bg-gray-300"
              }`}
            />

            <div>
              <p className="text-sm font-semibold text-gray-800">
                {gpsStatus === "idle" ? "Not sharing" : gpsStatus}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {sharing
                  ? "Your location is being sent to the customer tracking map."
                  : "Your location is not currently being shared."}
              </p>
            </div>
          </div>

          {lastLocation && (
            <div className="mt-4 rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Latest GPS coordinates
              </p>

              <p className="mt-2 text-sm text-gray-700">
                Latitude: {lastLocation.latitude.toFixed(6)}
              </p>

              <p className="mt-1 text-sm text-gray-700">
                Longitude: {lastLocation.longitude.toFixed(6)}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Accuracy: approximately {Math.round(lastLocation.accuracy)} metres
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {!sharing ? (
              <button
                onClick={startSharing}
                disabled={!selectedOrderId || !selectedOrder}
                className="flex-1 rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start sharing location
              </button>
            ) : (
              <button
                onClick={stopSharing}
                className="flex-1 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-red-700"
              >
                Stop sharing location
              </button>
            )}
          </div>

          <p className="mt-4 text-xs leading-5 text-gray-400">
            Keep this page open while delivering. Location access must be
            allowed in your browser. GPS sharing requires HTTPS or localhost.
          </p>
        </section>
      </div>
    </main>
  );
}
