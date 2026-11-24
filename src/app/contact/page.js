import ContactClient from "./contact-client";
import { PublicFooter, PublicHeader } from "../../components/public-site-chrome";
import { businessContact } from "../../lib/business-contact";

export const metadata = {
  title: "Contact & Support",
  description: "Contact DailyCart for help with orders, delivery, payments, accounts, refunds, and technical issues.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <PublicHeader active="/contact" />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Support</p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Contact DailyCart</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">Get help with orders, delivery, payments, refunds, account access, tracking, or application issues.</p>
        </header>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-bold text-gray-900">Support topics</h2>
            <ul className="grid gap-3 text-sm text-gray-600">
              {["Orders and order status", "Delivery and live tracking", "COD payment collection", "Refund or damaged-item questions", "Account and profile issues", "Technical problems"].map((item) => (
                <li key={item} className="rounded-xl bg-green-50 px-4 py-3 font-semibold text-green-900">{item}</li>
              ))}
            </ul>
            {(businessContact.email || businessContact.phone) && (
              <div className="border-t border-gray-100 pt-4 text-sm">
                {businessContact.email && (
                  <p><span className="text-gray-500">Email:</span> <a className="font-bold text-green-700" href={`mailto:${businessContact.email}`}>{businessContact.email}</a></p>
                )}
                {businessContact.phone && (
                  <p className="mt-2"><span className="text-gray-500">Phone:</span> <a className="font-bold text-green-700" href={`tel:${businessContact.phone}`}>{businessContact.phone}</a></p>
                )}
                {businessContact.address && (
                  <p className="mt-2"><span className="text-gray-500">Address:</span> {businessContact.address}</p>
                )}
                {businessContact.hours && (
                  <p className="mt-2"><span className="text-gray-500">Support hours:</span> {businessContact.hours}</p>
                )}
              </div>
            )}
          </aside>
          <ContactClient />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
