
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../lib/firebase";
import { useAuth } from "../../components/auth-provider";
import DeleteAccountButton from "../../components/delete-account-button";

export default function CompleteProfilePage() {
  const router = useRouter();
  const {
    user,
    loading,
    logout,
    isAdmin,
    isDeliveryBoy,
  } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");

  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (loading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));

        if (!active) return;

        if (snapshot.exists()) {
          const data = snapshot.data();

          setName(data.name || user.displayName || "");
          setPhone(data.phoneNumber || "");
          setAddress(data.address || "");
          setPincode(data.pincode || "");
          setLocation(data.location || null);

          if (data.profileCompleted === true) {
            setIsEditing(true);
          }
        } else {
          setName(user.displayName || "");
        }
      } catch (err) {
        console.error("Profile loading error:", err);

        if (active) {
          setError("Unable to load your profile. Please try again.");
        }
      } finally {
        if (active) setPageLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user, loading, router]);

  function detectLocation() {
    setError("");
    setLocationMessage("");

    if (!navigator.geolocation) {
      setLocationMessage(
        "GPS is not supported by this browser. Please enter your address manually."
      );
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        const detectedLocation = {
          latitude,
          longitude,
          accuracy,
          source: "gps",
        };

        setLocation(detectedLocation);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`
          );

          if (!response.ok) {
            throw new Error("Address lookup failed");
          }

          const data = await response.json();

          if (data?.display_name) {
            setAddress(data.display_name);

            const detectedPincode = data.address?.postcode;

            if (detectedPincode) {
              setPincode(
                detectedPincode.replace(/\D/g, "").slice(0, 6)
              );
            }

            setLocationMessage(
              "Location detected! Please check and edit your address if needed."
            );
          } else {
            setLocationMessage(
              "GPS detected successfully, but the address could not be found. Please enter it manually."
            );
          }
        } catch (err) {
          console.error("Reverse geocoding error:", err);

          setLocationMessage(
            "GPS coordinates saved. We couldn't convert them into an address, so please enter it manually."
          );
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.error(
  "GPS_ERROR_DETAILS:",
  JSON.stringify({
    code: err.code,
    message: err.message,
    PERMISSION_DENIED: err.PERMISSION_DENIED,
    POSITION_UNAVAILABLE: err.POSITION_UNAVAILABLE,
    TIMEOUT: err.TIMEOUT,
    userAgent: navigator.userAgent,
    isAndroidApp: navigator.userAgent.includes("QuickBiteAndroidApp"),
  })
);
        let message =
          "Unable to detect your location. Please enter your address manually.";

        if (err.code === 1) {
          message =
            "Location permission denied. Allow location access in your browser settings and try again.";
        } else if (err.code === 2) {
          message =
            "Your location is currently unavailable. Please try again.";
        } else if (err.code === 3) {
          message =
            "Location request timed out. Please try again.";
        }

        setLocationMessage(message);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanAddress = address.trim();
    const cleanPincode = pincode.trim();

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (cleanAddress.length < 10) {
      setError("Please enter your complete delivery address.");
      return;
    }

    if (!/^\d{6}$/.test(cleanPincode)) {
      setError("Enter a valid 6-digit PIN code.");
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    try {
      setSaving(true);

      const profileRef = doc(db, "users", user.uid);
      const existingProfile = await getDoc(profileRef);

      const profileData = {
        uid: user.uid,
        name: cleanName,
        email: user.email || "",
        photoURL: user.photoURL || "",
        phoneNumber: cleanPhone,
        address: cleanAddress,
        pincode: cleanPincode,
        location: location || null,
        profileCompleted: true,
        updatedAt: serverTimestamp(),
      };

      if (!existingProfile.exists()) {
        profileData.createdAt = serverTimestamp();
      }

      await setDoc(profileRef, profileData, { merge: true });

      router.replace("/");
    } catch (err) {
      console.error("Profile save error:", err);

      setError(
        "Unable to save your details. Please check your Firestore rules and internet connection."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || pageLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7faf7]">
        <div className="h-9 w-9 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-7">
          <div className="flex justify-center items-center gap-2 mb-5">
            <div className="h-11 w-11 rounded-2xl bg-green-600 text-white flex items-center justify-center text-2xl">
              🛍️
            </div>

            <span className="text-2xl font-extrabold text-gray-900">
              Daily<span className="text-green-600">Cart</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Update your profile" : "Complete your profile"}
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            {isEditing
              ? "Update your contact and delivery details."
              : "Add your contact and delivery details to start shopping."}
          </p>
        </div>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-green-900/5 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt="Your Google profile"
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                {(user?.displayName || "U").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {user?.displayName || "DailyCart customer"}
              </p>

              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100 mb-6" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone number
              </label>

              <div className="flex">
                <span className="rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  +91
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  placeholder="10-digit mobile number"
                  autoComplete="tel-national"
                  required
                  className="min-w-0 flex-1 rounded-r-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <p className="text-xs text-gray-400 mt-2">
                No OTP required. Used for delivery contact.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery address
              </label>

              <button
                type="button"
                onClick={detectLocation}
                disabled={locating}
                className="w-full mb-3 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locating ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-green-300 border-t-green-700 animate-spin" />
                    Detecting your location...
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    Use my current location
                  </>
                )}
              </button>

              {locationMessage && (
                <div className="mb-3 rounded-xl bg-green-50 border border-green-100 px-3 py-2 text-xs text-green-800">
                  {locationMessage}
                </div>
              )}

              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House number, street, area, landmark, city and state"
                rows={3}
                autoComplete="street-address"
                required
                className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />

              {location && (
                <p className="mt-2 text-xs text-green-700">
                  GPS coordinates captured:{" "}
                  {location.latitude.toFixed(5)},{" "}
                  {location.longitude.toFixed(5)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                PIN code
              </label>

              <input
                type="text"
                inputMode="numeric"
                value={pincode}
                onChange={(e) =>
                  setPincode(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                placeholder="6-digit PIN code"
                autoComplete="postal-code"
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || locating}
              className="w-full rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving your details..."
                : isEditing
                  ? "Save changes"
                  : "Save and continue"}
            </button>
          </form>

          {isEditing && (
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="w-full mt-3 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
            className="w-full mt-4 text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            Sign out
          </button>

          {!isAdmin && !isDeliveryBoy && (
            <DeleteAccountButton className="w-full mt-3 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60" />
          )}
        </section>
      </div>
    </main>
  );
}
