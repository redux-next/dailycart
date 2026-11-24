import Link from "next/link";

import DeleteAccountPageClient from "./delete-account-client";
import { PublicFooter, PublicHeader } from "../../components/public-site-chrome";

export const metadata = {
  title: "Delete Account",
  description: "How to permanently delete a DailyCart account and request deletion assistance.",
  alternates: { canonical: "/delete-account" },
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Account privacy</p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Delete your DailyCart account</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            This page explains the deletion process and allows a signed-in account owner to delete their own account.
          </p>
        </header>

        <div className="mt-8 grid gap-5 md:grid-cols-[1fr_300px]">
          <article className="space-y-6 rounded-3xl border border-gray-100 bg-white p-5 text-sm leading-7 text-gray-700 shadow-sm sm:p-8">
            <section>
              <h2 className="text-lg font-bold text-gray-900">How to delete</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5">
                <li>Sign in to the DailyCart account you want to delete.</li>
                <li>Use the Delete account action below while signed in.</li>
                <li>Confirm the permanent deletion warning.</li>
                <li>You will be signed out after successful server-side deletion.</li>
              </ol>
            </section>
            <section>
              <h2 className="text-lg font-bold text-gray-900">What is deleted</h2>
              <p className="mt-2">The existing deletion workflow removes the authenticated customer profile, Firebase Authentication account, saved account cart, and order documents belonging to that user.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-gray-900">What may be retained</h2>
              <p className="mt-2">Transaction, legal, fraud, dispute, accounting, or compliance records may need to be retained where required, even when the customer profile is removed. The exact retention period depends on applicable law and the operational record requirement.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-gray-900">Processing time</h2>
              <p className="mt-2">The current implementation performs deletion immediately and reports success only after the server finishes processing. If deletion is interrupted or fails, no success confirmation is shown and you should retry or contact support.</p>
            </section>
            <section>
              <h2 className="text-lg font-bold text-gray-900">Consequences</h2>
              <p className="mt-2">Deletion is permanent. You will lose access to the profile, saved account cart, order history, and account sign-in. This cannot be undone.</p>
            </section>
          </article>

          <aside className="h-fit rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">Delete account</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">Available only after sign-in. Staff accounts must use an authorized account-management process.</p>
            <DeleteAccountPageClient />
            <Link href="/contact" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">
              Contact support
            </Link>
          </aside>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
