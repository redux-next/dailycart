"use client";

import Link from "next/link";

import { useAuth } from "../../components/auth-provider";
import DeleteAccountButton from "../../components/delete-account-button";

export default function DeleteAccountPageClient() {
  const { user, loading, isAdmin, isDeliveryBoy } = useAuth();

  if (loading) {
    return (
      <p className="mt-4 text-sm text-gray-500" role="status">
        Checking account status...
      </p>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-green-600 text-sm font-bold text-white hover:bg-green-700"
      >
        Sign in to continue
      </Link>
    );
  }

  if (isAdmin || isDeliveryBoy) {
    return (
      <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        Staff and delivery accounts cannot be deleted through this customer workflow.
      </p>
    );
  }

  return (
    <DeleteAccountButton className="mt-4 min-h-11 w-full rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60" />
  );
}
