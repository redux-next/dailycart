"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "../../components/auth-provider";
import DeleteAccountButton from "../../components/delete-account-button";
import { db } from "../../lib/firebase";

function ProfileDetail({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-4 last:border-b-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="break-words text-sm font-medium text-gray-800">
        {value || <span className="font-normal text-gray-400">Not added yet</span>}
      </dd>
    </div>
  );
}

export default function ProfilePageClient() {
  const router = useRouter();
  const { user, loading, logout, isAdmin, isDeliveryBoy } = useAuth();
  const [profile, setProfile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let active = true;

    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    async function fetchProfile() {
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));

        if (active) {
          setProfile(snapshot.exists() ? snapshot.data() : null);
          setError("");
        }
      } catch (loadError) {
        console.error("Profile loading error:", loadError);

        if (active) {
          setError("We couldn't load your profile. Please try again.");
        }
      } finally {
        if (active) setPageLoading(false);
      }
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, [loading, reloadVersion, router, user]);

  function retryProfileLoad() {
    setPageLoading(true);
    setReloadVersion((version) => version + 1);
  }

  async function handleSignOut() {
    try {
      await logout();
      router.replace("/login");
    } catch (signOutError) {
      console.error("Sign-out failed:", signOutError);
      setError("We couldn't sign you out. Please try again.");
    }
  }

  if (loading || pageLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f7faf7]">
        <div
          className="h-9 w-9 animate-spin rounded-full border-4 border-green-200 border-t-green-600"
          role="status"
          aria-label="Loading profile"
        />
      </main>
    );
  }

  const name = profile?.name || user?.displayName || "DailyCart customer";
  const email = profile?.email || user?.email || "";
  const photoURL = profile?.photoURL || user?.photoURL;
  const hasSavedAddress = Boolean(profile?.address || profile?.pincode);
  const firstName =
    name === "DailyCart customer" ? "" : name.trim().split(/\s+/)[0];

  return (
    <main className="min-h-screen bg-[#f6f8f4] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-7 sm:mb-9">
          <p className="text-sm font-bold text-green-700">DAILYCART ACCOUNT</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Welcome back{firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Your profile, delivery address, and orders at a glance.
          </p>
        </header>

        {error && (
          <div
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={retryProfileLoad}
              className="font-bold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        <Link href="/#categories" className="profile-shop-banner">
          <span>
            <strong>Need a grocery top-up?</strong>
            <small>Browse fresh picks for your everyday table.</small>
          </span>
          <span>Shop now <span aria-hidden="true">→</span></span>
        </Link>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md shadow-green-900/5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                {photoURL ? (
                  <Image
                    src={photoURL}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-green-50"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-green-100 text-xl font-extrabold text-green-800 ring-4 ring-green-50"
                    aria-hidden="true"
                  >
                    {name.trim().charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-gray-900">
                    {name}
                  </h2>
                  <p className="mt-1 break-all text-sm text-gray-500">
                    {email || "Email not added"}
                  </p>
                </div>
              </div>

              <Link
                href="/complete-profile"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              >
                Edit profile
              </Link>
            </div>

            <dl className="mt-7 grid gap-x-8 sm:grid-cols-2">
              <ProfileDetail
                label="Phone number"
                value={profile?.phoneNumber}
              />
              <ProfileDetail label="Email address" value={email} />
            </dl>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md shadow-green-900/5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Delivery address
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Your saved address for grocery deliveries.
                </p>
              </div>
              <Link
                href="/complete-profile"
                className="min-h-11 rounded-xl border border-green-200 px-4 py-2 text-sm font-bold text-green-800 transition hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              >
                Update address
              </Link>
            </div>

            {hasSavedAddress ? (
              <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
                <ProfileDetail label="Address" value={profile?.address} />
                <ProfileDetail label="Pincode" value={profile?.pincode} />
              </dl>
            ) : (
              <p className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-900">
                No delivery address saved yet. Add one to make checkout quicker.
              </p>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md shadow-green-900/5">
            <Link
              href="/orders"
              className="flex min-h-16 items-center justify-between gap-4 bg-green-50/70 px-5 py-4 text-sm font-bold text-gray-800 transition hover:bg-green-100 sm:px-7"
            >
              <span>My Orders</span>
              <span aria-hidden="true" className="text-lg text-green-700">
                &rarr;
              </span>
            </Link>
            <div className="border-t border-gray-100 px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={handleSignOut}
                className="min-h-11 text-sm font-semibold text-gray-600 transition hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </section>

          {!isAdmin && !isDeliveryBoy && (
            <div className="rounded-2xl border border-red-100 bg-white p-5 sm:p-7">
              <h2 className="text-sm font-bold text-gray-900">
                Delete account
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Permanently remove your account and saved DailyCart data.
              </p>
              <DeleteAccountButton className="mt-4 min-h-11 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
