import { PublicFooter, PublicHeader } from "../../components/public-site-chrome";

export const metadata = {
  title: "Terms & Conditions",
  description: "Terms governing DailyCart accounts, orders, payments, delivery, and service use.",
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Terms &amp; Conditions</h1>
        <p className="mt-3 text-sm text-gray-500">Effective 24 November 2026 · Last updated 24 November 2026</p>
        <article className="mt-8 space-y-7 rounded-3xl border border-gray-100 bg-white p-5 text-sm leading-7 text-gray-700 shadow-sm sm:p-8">
          {[
            ["Eligibility and accounts", "You must provide accurate account and delivery information and keep authentication credentials secure."],
            ["Products and availability", "Products, stock, categories, descriptions, and prices may change. Availability is confirmed during checkout and order creation."],
            ["Pricing and payment", "Prices are shown in Indian Rupees. Cash on Delivery is currently the supported customer payment method. COD is not available for orders at or below ₹100 under the current checkout rule."],
            ["Orders and confirmation", "An order requires profile validation, product and stock validation, service-area verification, and successful server processing. Duplicate submissions are protected by checkout idempotency."],
            ["Cancellation", "Cancellation depends on order status and the implemented order workflow. No cancellation guarantee is promised beyond the options presented in the application."],
            ["Delivery", "DailyCart applies a 10 km service-area limit from Chabua Town. Accurate GPS location, address, PIN code, and phone information are required."],
            ["Delivery charges", "The current website rules show a ₹19 delivery fee below ₹299 and free delivery at a subtotal of ₹299 or more. A ₹4 handling fee applies to an item-bearing cart at checkout."],
            ["Damaged, missing, or incorrect products", "Report issues through the support workflow with the order ID and available evidence. Resolution depends on verification and applicable policy."],
            ["Refunds and returns", "No automatic refund or return window is promised. Eligible remedies, approval, destination, and processing timelines must be confirmed by the verified operator policy."],
            ["User responsibilities", "Use accurate information, receive deliveries lawfully, protect credentials, and do not manipulate inventory, checkout, location, payment, or order records."],
            ["Limitation of liability", "Use is subject to applicable law. DailyCart is not responsible for browser, device, network, Firebase, mapping, or GPS-provider failures outside circumstances required by law."],
            ["Privacy", "Use of personal information is described in the Privacy Policy."],
            ["Changes", "These terms may be updated when the service or legal requirements change. The effective date identifies the current version."],
            ["Governing law", "The governing jurisdiction is not yet confirmed in the application. Qualified legal review is required before publication."],
            ["Contact", "Use the Contact & Support page for account, order, delivery, and policy questions."],
          ].map(([title, text]) => (
            <section key={title}>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="mt-2">{text}</p>
            </section>
          ))}
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
