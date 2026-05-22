import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/storefront/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "প্রাইভেসি পলিসি — DDS-Digital" },
      { name: "description", content: "DDS-Digital এর প্রাইভেসি পলিসি ও ডেটা সুরক্ষা নীতিমালা।" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: () => (
    <LegalPage title="প্রাইভেসি পলিসি" subtitle="সর্বশেষ আপডেট: ২০২৬">
      <LegalSection heading="১. আমরা কী তথ্য সংগ্রহ করি">
        অ্যাকাউন্ট তৈরি, অর্ডার এবং সাপোর্টের জন্য আপনার নাম, ইমেইল, ফোন নম্বর ও পেমেন্ট সংক্রান্ত তথ্য সংগ্রহ করি।
      </LegalSection>
      <LegalSection heading="২. তথ্য ব্যবহার">
        আপনার তথ্য শুধুমাত্র অর্ডার প্রসেসিং, ডেলিভারি, কাস্টমার সাপোর্ট ও সাইট উন্নয়নের জন্য ব্যবহৃত হয়। তৃতীয় পক্ষের কাছে বিক্রি করা হয় না।
      </LegalSection>
      <LegalSection heading="৩. কুকি (Cookies)">
        সাইটের কার্যকারিতা ও ইউজার এক্সপেরিয়েন্স উন্নয়নের জন্য আমরা কুকি ব্যবহার করি।
      </LegalSection>
      <LegalSection heading="৪. সুরক্ষা">
        সব পেমেন্ট SSL এনক্রিপশনের মাধ্যমে সুরক্ষিত। পাসওয়ার্ড হ্যাশ আকারে সংরক্ষিত হয়।
      </LegalSection>
      <LegalSection heading="৫. যোগাযোগ">
        যেকোনো প্রশ্নের জন্য contact@dds-digital.com এ যোগাযোগ করুন।
      </LegalSection>
    </LegalPage>
  ),
});
