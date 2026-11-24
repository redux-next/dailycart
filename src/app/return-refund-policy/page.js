import { PublicFooter, PublicHeader } from "../../components/public-site-chrome";

export const metadata = {
  title: "Return & Refund Policy",
  description: "DailyCart policy for damaged, missing, expired, or incorrect products.",
  alternates: { canonical: "/return-refund-policy" },
};

export default function ReturnRefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f7faf7]">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Customer policy</p>
        <h1 className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">Return &amp; Refund Policy</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">This page describes the available support process without inventing refund guarantees or unconfirmed deadlines.</p>
        <article className="mt-8 space-y-7 rounded-3xl border border-gray-100 bg-white p-5 text-sm leading-7 text-gray-700 shadow-sm sm:p-8">
          <section>
            <h2 className="text-lg font-bold text-gray-900">Possible return and refund scenarios</h2>
            <p className="mt-2">A request may be considered for damaged, missing, expired, incorrect, or materially different products. Availability and eligibility must be verified against the delivered order and applicable law.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900">Report an issue promptly</h2>
            <p className="mt-2">Provide the order ID, product details, issue description, and relevant photographs or other evidence through <a className="font-bold text-green-700 underline" href="/contact">Contact Support</a>. Keep the product and packaging where safe and reasonable until the request is reviewed.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900">Reporting deadline</h2>
            <p className="mt-2">A final reporting deadline has not been configured. Promptly reporting the issue is recommended because evidence and product condition may be difficult to verify later.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900">Approval and review</h2>
            <p className="mt-2">No refund or replacement is automatic. The operator may verify order records, product condition, delivery status, payment records, and supporting evidence before approval.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900">Refund destination and timing</h2>
            <p className="mt-2">Approved refund destination and processing time are not yet configured. Because UPI checkout is not currently activated and COD is supported, any eligible refund will follow the verified business method and applicable law rather than an invented timetable.</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900">Owner confirmation required</h2>
            <p className="mt-2">Before publication, DailyCart must confirm the reporting window, evidence requirements, approval authority, refund channels, processing time, and return logistics.</p>
          </section>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
