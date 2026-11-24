import { PublicFooter, PublicHeader } from "../../components/public-site-chrome";

export const metadata = {
  title: "Shipping & Delivery Policy",
  description: "Delivery area, charges, COD eligibility, failed delivery, and order tracking for DailyCart.",
  alternates: { canonical: "/shipping-delivery-policy" },
};

export default function ShippingDeliveryPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Delivery information</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Shipping &amp; Delivery Policy</h1>
        <article className="mt-8 space-y-7 rounded-3xl border border-gray-100 bg-white p-5 text-sm leading-7 text-gray-700 shadow-sm sm:p-8">
          <section>
            <h2 className="text-lg font-bold text-gray-900">Service area</h2>
            <p className="mt-2">DailyCart currently limits orders to locations within 10 km of Chabua Town. The checkout server verifies the saved GPS location before order creation.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900">Delivery and handling charges</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Delivery fee: ₹19 for subtotals below ₹299.</li>
              <li>Free delivery: for subtotals of ₹299 or more.</li>
              <li>Handling fee: ₹4 when the cart contains items.</li>
              <li>Free or discounted delivery promotions are applied only when implemented in the checkout rules.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900">Payment and COD</h2>
            <p className="mt-2">Cash on Delivery is supported only for orders above ₹100. UPI checkout is not currently activated.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900">Delivery time</h2>
            <p className="mt-2">A fixed or guaranteed delivery-time window is not configured in the application. Live conditions, order preparation, availability, traffic, weather, and device network may affect delivery.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900">Order tracking</h2>
            <p className="mt-2">Signed-in customers can open My Orders and track eligible orders. Status changes appear automatically. Live location appears only after an authorized delivery partner starts GPS sharing and can be interrupted by permissions or network availability.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900">Failed or delayed delivery</h2>
            <p className="mt-2">The delivery partner or support team may need to verify the address or contact the customer. If a delivery cannot be completed, contact support with the order ID. The operator will determine the next step based on order status and delivery circumstances.</p>
          </section>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
