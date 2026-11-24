import Link from "next/link";

import { PublicFooter, PublicHeader } from "../../components/public-site-chrome";

export const metadata = {
  title: "Help & Support",
  description: "DailyCart help for accounts, orders, checkout, delivery, tracking, and payment.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  const topics = [
    ["Account and profile", "/profile", "Update sign-in, profile, phone number, address, PIN code, and GPS information."],
    ["My orders", "/orders", "Review existing orders and open tracking for eligible orders."],
    ["Cart and checkout", "/cart", "Review basket items, quantities, delivery fee, handling fee, and COD eligibility."],
    ["FAQs", "/faqs", "Find answers to frequently asked account, payment, delivery, and refund questions."],
  ];

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Help centre</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">How can we help?</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">Use these pages to find account, shopping, order, and delivery information.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {topics.map(([title, href, description]) => (
            <Link key={href} href={href} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md">
              <h2 className="font-bold text-gray-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
            </Link>
          ))}
        </div>
        <section className="mt-6 rounded-2xl bg-green-800 p-5 text-white sm:p-6">
          <h2 className="text-lg font-bold">Need order-specific help?</h2>
          <p className="mt-2 text-sm leading-6 text-green-100">Include the order ID, relevant product, and issue details. Do not include passwords or payment credentials.</p>
          <Link href="/contact" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-sm font-bold text-green-800">
            Contact Support
          </Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
