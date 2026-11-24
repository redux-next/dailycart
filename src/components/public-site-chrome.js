"use client";

import { useState } from "react";
import Link from "next/link";

export function PublicHeader({ active = "" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { href: "/", label: "Home" },
    { href: "/#categories", label: "Categories" },
    { href: "/contact", label: "Support" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-green-100/80 bg-white/95 shadow-sm shadow-green-950/[0.03] backdrop-blur">
      <div className="relative mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:min-h-[72px] sm:px-6">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-gray-900 transition-colors hover:text-green-800"
          aria-label="DailyCart home"
        >
          DailyCart<span className="text-green-600">.</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Public navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                active === link.href
                  ? "text-green-700"
                  : "text-gray-600 hover:text-green-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/login"
          className="hidden min-h-10 rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-800 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 sm:inline-flex"
        >
          Sign in
        </Link>
        <button
          type="button"
          className="min-h-11 min-w-11 rounded-xl border border-gray-200 text-xl font-bold text-gray-700 sm:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "×" : "☰"}
        </button>
        {menuOpen && (
          <nav
            className="absolute left-4 right-4 top-[calc(100%+8px)] z-50 grid gap-1 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl sm:hidden"
            aria-label="Mobile public navigation"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="min-h-11 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-1 min-h-11 rounded-xl bg-green-600 px-4 py-3 text-center text-sm font-bold text-white"
            >
              Sign in
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

export function PublicFooter() {
  const supportEmail =
    process.env.NEXT_PUBLIC_DAILYCART_SUPPORT_EMAIL?.trim() || "";
  const supportPhone =
    process.env.NEXT_PUBLIC_DAILYCART_SUPPORT_PHONE?.trim() || "";
  const instagramUrl =
    process.env.NEXT_PUBLIC_DAILYCART_INSTAGRAM_URL?.trim() || "";
  const facebookUrl =
    process.env.NEXT_PUBLIC_DAILYCART_FACEBOOK_URL?.trim() || "";

  return (
    <footer className="mt-8 border-t border-gray-100 bg-white sm:mt-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-9 sm:px-6 sm:py-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="col-span-2 lg:col-span-1">
          <p className="text-xl font-extrabold tracking-tight text-gray-900">
            DailyCart<span className="text-green-600">.</span>
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
            Groceries and everyday essentials for Chabua Town and nearby areas within the verified 10 km service area.
          </p>
        </div>
        <nav className="grid content-start gap-3 text-sm" aria-label="Company">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Company</p>
          <Link className="flex min-h-11 items-center font-semibold text-gray-700 hover:text-green-700 sm:min-h-0" href="/about">
            About Us
          </Link>
          <Link className="flex min-h-11 items-center font-semibold text-gray-700 hover:text-green-700 sm:min-h-0" href="/contact">
            Contact Us
          </Link>
        </nav>
        <nav className="grid content-start gap-3 text-sm" aria-label="Customer support">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Support</p>
          <Link className="flex min-h-11 items-center font-semibold text-gray-700 hover:text-green-700 sm:min-h-0" href="/help">
            Help &amp; Support
          </Link>
          <Link className="flex min-h-11 items-center font-semibold text-gray-700 hover:text-green-700 sm:min-h-0" href="/faqs">
            FAQs
          </Link>
          <Link className="flex min-h-11 items-center font-semibold text-gray-700 hover:text-green-700 sm:min-h-0" href="/return-refund-policy">
            Return &amp; Refund
          </Link>
          <Link className="flex min-h-11 items-center font-semibold text-gray-700 hover:text-green-700 sm:min-h-0" href="/shipping-delivery-policy">
            Shipping &amp; Delivery
          </Link>
        </nav>
        <nav className="grid content-start gap-3 text-sm" aria-label="Legal">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Legal</p>
          <Link className="flex min-h-11 items-center font-semibold text-gray-700 hover:text-green-700 sm:min-h-0" href="/privacy-policy">
            Privacy Policy
          </Link>
          <Link className="flex min-h-11 items-center font-semibold text-gray-700 hover:text-green-700 sm:min-h-0" href="/terms-and-conditions">
            Terms &amp; Conditions
          </Link>
          <Link className="flex min-h-11 items-center font-semibold text-gray-700 hover:text-green-700 sm:min-h-0" href="/delete-account">
            Account Deletion
          </Link>
        </nav>
        <nav className="grid content-start gap-3 text-sm" aria-label="Account and contact">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Account</p>
          <Link className="flex min-h-11 items-center font-semibold text-gray-700 hover:text-green-700 sm:min-h-0" href="/profile">
            My Account
          </Link>
          <Link className="flex min-h-11 items-center font-semibold text-gray-700 hover:text-green-700 sm:min-h-0" href="/orders">
            My Orders
          </Link>
          {supportEmail && (
            <a className="break-all font-semibold text-gray-700 hover:text-green-700" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          )}
          {supportPhone && (
            <a className="font-semibold text-gray-700 hover:text-green-700" href={`tel:${supportPhone}`}>
              {supportPhone}
            </a>
          )}
          {(instagramUrl || facebookUrl) && (
            <div className="flex gap-3">
              {instagramUrl && <a className="font-semibold text-gray-700 hover:text-green-700" href={instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>}
              {facebookUrl && <a className="font-semibold text-gray-700 hover:text-green-700" href={facebookUrl} target="_blank" rel="noopener noreferrer">Facebook</a>}
            </div>
          )}
        </nav>
      </div>
      <div className="border-t border-gray-100 bg-gray-50/70 py-5 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} DailyCart. All rights reserved.
      </div>
    </footer>
  );
}
