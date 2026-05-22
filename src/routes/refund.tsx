import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/storefront/LegalPage";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "রিফান্ড পলিসি — DDS-Digital" },
      { name: "description", content: "DDS-Digital এর রিফান্ড ও রিপ্লেসমেন্ট নীতিমালা।" },
      { property: "og:url", content: "/refund" },
    ],
    links: [{ rel: "canonical", href: "/refund" }],
  }),
  component: () => (
    <LegalPage title="রিফান্ড পলিসি">
      <LegalSection heading="১. ডিজিটাল প্রোডাক্ট ডেলিভারি">
        ডেলিভারি সফল হওয়ার পর সাধারণত রিফান্ড দেওয়া হয় না, কারণ ডিজিটাল প্রোডাক্ট ফেরত নেওয়া সম্ভব নয়।
      </LegalSection>
      <LegalSection heading="২. কখন রিফান্ড পাবেন">
        - পেমেন্ট সফল হওয়ার পরও যদি প্রোডাক্ট ডেলিভারি না হয়<br />
        - প্রোডাক্ট সম্পূর্ণ ত্রুটিপূর্ণ এবং রিপ্লেসমেন্ট সম্ভব না হলে<br />
        - ভুল প্রোডাক্ট পাঠানো হলে এবং সঠিকটি দিতে না পারলে
      </LegalSection>
      <LegalSection heading="৩. রিফান্ড প্রসেসিং">
        অনুমোদনের ৩-৭ কর্মদিবসের মধ্যে রিফান্ড সম্পন্ন হবে।
      </LegalSection>
      <LegalSection heading="৪. রিপ্লেসমেন্ট">
        অ্যাকাউন্ট সংক্রান্ত সমস্যায় সাধারণত রিফান্ডের পরিবর্তে নতুন অ্যাকাউন্ট দেওয়া হবে।
      </LegalSection>
    </LegalPage>
  ),
});
