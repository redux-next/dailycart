import { PublicFooter, PublicHeader } from "../../components/public-site-chrome";

export const metadata = {
  title: "Privacy Policy",
  description: "How DailyCart collects, uses, protects, and manages personal and location data.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  const updated = "24 November 2026";

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Legal</p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-gray-500">Effective date: {updated} · Last updated: {updated}</p>
        </header>

        <article className="mt-8 space-y-8 rounded-3xl border border-gray-100 bg-white p-5 text-sm leading-7 text-gray-700 shadow-sm sm:p-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900">1. Introduction</h2>
            <p className="mt-2">DailyCart provides grocery and everyday-essential shopping and delivery for users in Chabua Town and nearby areas within the verified service area. This policy explains the personal information handled by the application and website.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">2. Information we collect</h2>
            <p className="mt-2">We collect account and profile information, order information, cart information, location information, and limited technical data needed to operate the service.</p>
            <h3 className="mt-4 font-bold text-gray-900">Personal information</h3>
            <p>Name, email address, phone number, delivery address, PIN code, Google or email account information, and profile completion status may be collected.</p>
            <h3 className="mt-4 font-bold text-gray-900">Location information</h3>
            <p>Location is used when you choose “Use my current location” or provide a GPS location for delivery. The browser or Android device requests permission before collection. Location may be converted into an address through OpenStreetMap/Nominatim reverse geocoding. You can disable location access in browser or device settings. Live delivery locations are shared only as part of the delivery workflow and are displayed to the relevant customer and delivery personnel.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">3. Order and payment information</h2>
            <p className="mt-2">We process products, quantities, cart contents, pricing, delivery address, order status, payment method, payment status, delivery instructions, and order history. Cash on Delivery is currently implemented. UPI is not activated in the customer checkout unless explicitly enabled by a future product update. DailyCart does not claim to collect card numbers or sensitive payment credentials.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">4. Authentication</h2>
            <p className="mt-2">Firebase Authentication supports Google Sign-In and email/password authentication. Firebase issues and manages authentication sessions and account identifiers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">5. Device, logs, cookies, and local storage</h2>
            <p className="mt-2">Firebase, hosting, delivery, and application services may process IP addresses, request logs, device or browser information, diagnostic data, and timestamps. The support form retains submitted name, email, optional phone number, optional order ID, subject, and message, and a temporary IP-based rate-limit record helps prevent spam. The application uses local storage for guest cart persistence and session storage for checkout attempt protection. Authentication sessions are managed by Firebase. Some cookies or browser storage may be used by Firebase, hosting, or service infrastructure.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">6. How we use information</h2>
            <p className="mt-2">Information is used to authenticate accounts, complete profiles, save carts, create and track orders, calculate pricing, arrange delivery, communicate order and payment status, prevent fraud or duplicate orders, provide support, maintain the service, and meet legal obligations.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">7. How information is shared</h2>
            <p className="mt-2">Information may be available to Firebase/Google infrastructure used to operate authentication, database, storage, and hosting. Relevant customer name, phone number, and delivery address may be provided to assigned delivery personnel for order fulfillment. Service providers and hosting infrastructure may process information on our behalf. Information may be disclosed to legal or regulatory authorities where required by applicable law.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">8. Retention and security</h2>
            <p className="mt-2">Information is retained while needed to operate the account and service. Profile and cart data may be removed through account deletion. Order records and payment records may need to be retained for legal, accounting, dispute, fraud-prevention, or customer-support obligations. We use authentication, server-side authorization, Firebase security rules, and access controls, but no internet service can guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">9. Your choices and rights</h2>
            <p className="mt-2">You may update profile and delivery information, manage location permissions, sign out, and request account deletion. Account deletion is initiated through the deletion workflow. Depending on applicable law, you may request access, correction, or deletion of personal information, subject to valid retention requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">10. Account deletion</h2>
            <p className="mt-2">See <a className="font-bold text-green-700 underline" href="/delete-account">Account Deletion</a> for instructions, consequences, and processing behavior.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">11. Children&apos;s privacy</h2>
            <p className="mt-2">DailyCart is not directed to children under 13. We do not knowingly create accounts or collect personal information from children under 13. A parent or guardian who believes a child&apos;s information was provided should use the account deletion or support workflow.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">12. Third-party services</h2>
            <p className="mt-2">Third-party services currently used or integrated include Firebase Authentication, Cloud Firestore, Firebase Hosting or infrastructure, Google Sign-In, OpenStreetMap/Nominatim reverse geocoding, and map or tile providers for location tracking. Their own terms and privacy notices apply where relevant.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">13. International processing</h2>
            <p className="mt-2">Firebase and supporting infrastructure may process or store data in locations selected by the providers. This policy does not claim any specific physical processing region.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">14. Changes</h2>
            <p className="mt-2">We may update this policy when application behavior or legal requirements change. The effective date and last-updated date at the top will identify revisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">15. Contact</h2>
            <p className="mt-2">For privacy questions or account-data requests, use the <a className="font-bold text-green-700 underline" href="/contact">Contact &amp; Support</a> page. A verified support email or phone number is displayed there only when configured by the application operator.</p>
          </section>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
