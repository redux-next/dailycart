import { PublicFooter, PublicHeader } from "../../components/public-site-chrome";

export const metadata = {
  title: "About Us",
  description: "Learn about DailyCart grocery and everyday essentials shopping and delivery.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">About DailyCart</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Local groceries, made simpler</h1>
        <article className="mt-8 rounded-3xl border border-gray-100 bg-white p-5 text-sm leading-7 text-gray-700 shadow-sm sm:p-8">
          <p>DailyCart is an online grocery and everyday essentials delivery platform designed for customers in Chabua Town and nearby locations within the verified 10 km service area.</p>
          <p className="mt-4">Customers can browse the catalogue, add items to a basket, save delivery details, place supported orders, and follow order progress. Delivery personnel use an authorized dashboard to update assigned orders and share GPS location when they begin a delivery.</p>
          <h2 className="mt-7 text-xl font-bold text-gray-900">What we provide</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Grocery and everyday-essential browsing.</li>
            <li>Guest and signed-in basket management.</li>
            <li>Profile and GPS-based delivery information.</li>
            <li>Cash on Delivery when the order eligibility rules allow it.</li>
            <li>Order progress and live delivery tracking when available.</li>
          </ul>
          <p className="mt-6">For current service questions or assistance, visit <a className="font-bold text-green-700 underline" href="/contact">Contact &amp; Support</a>.</p>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
