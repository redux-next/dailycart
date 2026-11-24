import { PublicFooter, PublicHeader } from "../../components/public-site-chrome";

export const metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about DailyCart accounts, orders, COD, delivery, tracking, cancellations, and refunds.",
  alternates: { canonical: "/faqs" },
};

export default function FaqsPage() {
  const faqs = [
    ["How do I create an account?", "Use Google Sign-In or email/password registration, then complete the profile with name, phone number, address, PIN code, and GPS location where required."],
    ["How do I place an order?", "Add catalogue items to your basket, open checkout, verify delivery details, select the available payment method, and place the order."],
    ["Which payment methods are available?", "Cash on Delivery is currently supported. UPI is not activated in checkout until payment integration is enabled."],
    ["When is Cash on Delivery available?", "The current checkout rule allows COD only for orders above ₹100."],
    ["How are delivery charges calculated?", "The current rule has ₹19 delivery below ₹299, free delivery at ₹299 or more, and a ₹4 handling fee for item-bearing carts."],
    ["Can I track my order?", "Open My Orders and select an eligible order. Status updates appear automatically. Live GPS is available only while an assigned delivery partner shares location."],
    ["Can I cancel an order?", "Cancellation options depend on order status and the application workflow. Contact support with the order ID for any existing cancellation or status request."],
    ["How do refunds work?", "Refund or return approval depends on the verified product and order circumstances. No automatic refund or fixed timetable is promised. Review the Return & Refund Policy."],
    ["What should I do for damaged or missing products?", "Contact support promptly with the order ID, product information, and photos or evidence where available."],
    ["How can I contact support?", "Use the Contact & Support page to submit an order or account-related request."],
  ];

  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Support</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Frequently asked questions</h1>
        <div className="mt-8 grid gap-3">
          {faqs.map(([question, answer]) => (
            <details key={question} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer font-bold text-gray-900">{question}</summary>
              <p className="mt-3 text-sm leading-6 text-gray-600">{answer}</p>
            </details>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
