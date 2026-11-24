import { PublicFooter, PublicHeader } from "../../components/public-site-chrome";

export const metadata = {
  title: "Terms & Conditions",
  description: "Terms governing use of DailyCart grocery shopping and delivery services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Legal</p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Terms &amp; Conditions</h1>
          <p className="mt-3 text-sm text-gray-500">Effective 24 November 2026 · Last updated 24 November 2026</p>
        </header>
        <article className="mt-8 space-y-7 rounded-3xl border border-gray-100 bg-white p-5 text-sm leading-7 text-gray-700 shadow-sm sm:p-8">
          {[
            ["1. Introduction", "These Terms govern use of the DailyCart website, applications, accounts, product catalogue, cart, checkout, order tracking, and delivery services."],
            ["2. Acceptance", "By using DailyCart, creating an account, or placing an order, you agree to these Terms and the Privacy Policy."],
            ["3. Eligibility", "You must be able to place a lawful order and provide accurate delivery information. Account eligibility may vary for staff and delivery personnel."],
            ["4. User accounts", "Keep account credentials secure and provide accurate profile information. An account is not transferable, and you are responsible for activity performed through your authenticated account."],
            ["5. Account security", "Do not share credentials or attempt to bypass authentication or authorization controls. Notify support promptly if you believe your account is compromised."],
            ["6. Products and availability", "Products, stock, availability, categories, and descriptions may change. An item may become unavailable or change quantity after it is added to a cart."],
            ["7. Pricing", "Prices are displayed in Indian Rupees. Applicable delivery fees and handling charges are shown before order confirmation. Displayed totals do not add any undeclared charge."],
            ["8. Orders", "An order is subject to server validation, stock checks, profile validation, service-area verification, and successful creation. Placing an order does not by itself guarantee fulfillment if validation fails."],
            ["9. Payment methods", "Cash on Delivery is the currently supported customer payment method. UPI checkout is not activated until payment integration is available. COD may be unavailable for orders at or below ₹100."],
            ["10. Delivery", "DailyCart currently applies a service-area limit of 10 km from Chabua Town. Live tracking is available only when a delivery person starts GPS sharing and is subject to device permissions, network coverage, and location accuracy."],
            ["11. Delivery charges", "Current checkout rules show a ₹19 delivery fee below ₹299 and no delivery fee for a subtotal of ₹299 or more. A ₹4 handling fee applies when a cart has items, subject to the order creation rules shown at checkout."],
            ["12. Cancellation", "Cancellation availability depends on the order status and current implementation. Contact support or use the order workflow when cancellation is offered. No cancellation guarantee is promised outside the application."],
            ["13. Refunds and returns", "Refund or return eligibility depends on the actual payment, order, and product circumstances. No invented refund window or automatic refund guarantee applies. Any refund must follow applicable law and verified DailyCart processing."],
            ["14. Damaged, missing, or incorrect products", "Report damaged, missing, or incorrect items promptly through support and provide the order ID and relevant details. Review is subject to verification of the order and product condition."],
            ["15. Promotions", "Promotions or discounts are valid only when published and technically applied. DailyCart may correct obvious pricing or promotional errors or withdraw an unauthorized promotion."],
            ["16. User responsibilities", "Provide accurate address, PIN code, phone number, and location information; receive the order promptly; and make lawful use of the service."],
            ["17. Prohibited activities", "Do not use bots or deceptive methods, interfere with systems, manipulate inventory or checkout, submit false orders or payment confirmations, access another user's data, or violate security or applicable law."],
            ["18. Intellectual property", "DailyCart branding, software, text, and design remain owned by their respective owners. You may not reproduce or commercially misuse protected assets without permission."],
            ["19. Third-party services", "Firebase, Google Sign-In, OpenStreetMap/Nominatim, map providers, hosting, and network providers may be used. Their services are subject to separate terms."],
            ["20. Limitation of liability", "To the fullest extent permitted by law, liability is limited to actual direct loss caused by a breach of these Terms. DailyCart is not responsible for third-party network, mapping, GPS, browser, or provider failures beyond applicable law."],
            ["21. Indemnification", "Where permitted by law, a user who knowingly misuses the service may be responsible for resulting direct losses or claims caused by that misuse."],
            ["22. Privacy", "Personal information use is described in the Privacy Policy and account deletion workflow."],
            ["23. Suspension and termination", "Access may be suspended or terminated for security risks, fraud, legal requirements, prohibited conduct, or staff-role changes, subject to applicable law."],
            ["24. Changes", "We may update these Terms as the service changes. Continued use after an effective revision indicates acceptance where permitted by law."],
            ["25. Governing law", "The governing law and court jurisdiction have not yet been confirmed as a final business configuration. They should be completed with qualified legal advice before public publication."],
            ["26. Contact", "Use the Contact &amp; Support page for account, order, delivery, payment, or technical questions. Verified business email or phone details are not displayed until configured."],
          ].map(([title, text]) => (
            <section key={title}>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <p className="mt-1">{text}</p>
            </section>
          ))}
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
