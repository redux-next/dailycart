"use client";

import { useState } from "react";

export default function ContactClient() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setSuccess("");
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          orderId: form.get("orderId"),
          subject: form.get("subject"),
          message: form.get("message"),
          website: form.get("website"),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to submit your request.");
      }

      event.currentTarget.reset();
      setSuccess(result.message);
    } catch (submitError) {
      setError(submitError.message || "Unable to submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100";

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-bold text-gray-900">Send a support request</h2>
      <p className="mt-2 text-sm text-gray-500">Required fields are marked with an asterisk.</p>

      <div className="absolute -left-[10000px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex="-1" autoComplete="off" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-semibold text-gray-700">Name *</label>
          <input id="name" name="name" type="text" required minLength="2" maxLength="80" autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-semibold text-gray-700">Email *</label>
          <input id="email" name="email" type="email" required maxLength="160" autoComplete="email" className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone number</label>
          <input id="phone" name="phone" type="tel" maxLength="30" autoComplete="tel" className={inputClass} />
        </div>
        <div>
          <label htmlFor="orderId" className="text-sm font-semibold text-gray-700">Order ID</label>
          <input id="orderId" name="orderId" type="text" maxLength="128" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="subject" className="text-sm font-semibold text-gray-700">Subject *</label>
          <input id="subject" name="subject" type="text" required minLength="3" maxLength="160" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="text-sm font-semibold text-gray-700">Message *</label>
          <textarea id="message" name="message" required minLength="10" maxLength="3000" rows="6" className={`${inputClass} resize-y`} />
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">{success}</p>}

      <button type="submit" disabled={submitting} className="mt-5 min-h-12 w-full rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? "Submitting..." : "Submit support request"}
      </button>
      <p className="mt-4 text-xs leading-5 text-gray-400">
        Submitted information is stored for support handling and may be used to respond to your request. Do not include passwords or payment credentials.
      </p>
    </form>
  );
}
