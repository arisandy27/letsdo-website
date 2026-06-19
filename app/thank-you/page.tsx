import Header from "@/components/letsdo/homepage/Header";
import FooterSection from "@/components/letsdo/homepage/FooterSection";
import { Check } from "lucide-react";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="mx-auto max-w-4xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm lg:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700">
              <Check className="h-8 w-8" />
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Thank you.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Your submission has been received. We will review it and get back to you
              using the contact details you provided.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5"
              >
                Back to Home
              </a>

              <a
                href="/solutions"
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                View Solutions
              </a>
            </div>

            <p className="mt-6 text-xs leading-6 text-slate-500">
              If your request is urgent, you can also contact
              <span className="font-medium text-slate-700"> anytools@letsdo.id</span>.
            </p>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
