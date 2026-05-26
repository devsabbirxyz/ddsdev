import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { faqsQuery } from "@/lib/storefront";

const FAQ_FALLBACK = [
  { id: "f1", question: "প্রোডাক্ট কেনার পর কীভাবে ডেলিভারি পাবো?", answer: "পেমেন্ট অ্যাপ্রুভ হওয়ার সাথে সাথে অটো ডেলিভারি হবে এবং আপনার ইমেইল ও ড্যাশবোর্ডে পাঠানো হবে।" },
  { id: "f2", question: "কী কী পেমেন্ট মেথড আছে?", answer: "বিকাশ, নগদ, রকেট, উপায়, ব্যাংক ট্রান্সফার এবং SSLCommerz এর মাধ্যমে কার্ড পেমেন্ট সাপোর্ট করি।" },
  { id: "f3", question: "রিফান্ড পলিসি কী?", answer: "ডিজিটাল প্রোডাক্টের ক্ষেত্রে নির্দিষ্ট শর্তে রিফান্ড দেওয়া হয়। বিস্তারিত রিফান্ড পেজে দেখুন।" },
  { id: "f4", question: "সাপোর্ট কীভাবে পাবো?", answer: "২৪/৭ লাইভ চ্যাট, ইমেইল এবং সাপোর্ট টিকিটের মাধ্যমে আমরা সাহায্য করি।" },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "প্রশ্নোত্তর (FAQ) — DDS-Digital" },
      { name: "description", content: "DDS-Digital সম্পর্কে প্রায়শই জিজ্ঞাসিত প্রশ্নের উত্তর — ডেলিভারি, পেমেন্ট, রিফান্ড ও সাপোর্ট সম্পর্কিত সকল তথ্য।" },
      { property: "og:title", content: "FAQ — DDS-Digital" },
      { property: "og:description", content: "DDS-Digital সম্পর্কে প্রায়শই জিজ্ঞাসিত প্রশ্নের উত্তর — ডেলিভারি, পেমেন্ট, রিফান্ড ও সাপোর্ট সম্পর্কিত সকল তথ্য।" },
      { property: "og:url", content: "/faq" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ_FALLBACK.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }),
    }],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { data: faqs = [], isLoading } = useQuery(faqsQuery());
  const [open, setOpen] = useState<string | null>(null);

  const fallback = [
    { id: "f1", question: "প্রোডাক্ট কেনার পর কীভাবে ডেলিভারি পাবো?", answer: "পেমেন্ট অ্যাপ্রুভ হওয়ার সাথে সাথে অটো ডেলিভারি হবে এবং আপনার ইমেইল ও ড্যাশবোর্ডে পাঠানো হবে।" },
    { id: "f2", question: "কী কী পেমেন্ট মেথড আছে?", answer: "বিকাশ, নগদ, রকেট, উপায়, ব্যাংক ট্রান্সফার এবং SSLCommerz এর মাধ্যমে কার্ড পেমেন্ট সাপোর্ট করি।" },
    { id: "f3", question: "রিফান্ড পলিসি কী?", answer: "ডিজিটাল প্রোডাক্টের ক্ষেত্রে নির্দিষ্ট শর্তে রিফান্ড দেওয়া হয়। বিস্তারিত রিফান্ড পেজে দেখুন।" },
    { id: "f4", question: "সাপোর্ট কীভাবে পাবো?", answer: "২৪/৭ লাইভ চ্যাট, ইমেইল এবং সাপোর্ট টিকিটের মাধ্যমে আমরা সাহায্য করি।" },
  ];

  const items = faqs.length > 0
    ? faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))
    : fallback;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow mb-4">
          <HelpCircle className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display font-bold text-4xl">প্রশ্নোত্তর</h1>
        <p className="mt-2 text-muted-foreground">আপনার সব প্রশ্নের উত্তর এক জায়গায়।</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-card rounded-2xl h-16 animate-pulse" />)
        ) : (
          items.map((f: any) => {
            const isOpen = open === f.id;
            return (
              <div key={f.id} className="glass-card rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : f.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="font-semibold text-sm sm:text-base">{f.question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap border-t border-glass-border pt-4">
                    {f.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
