import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/storefront/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "টার্মস ও কন্ডিশনস — DDS-Digital" },
      { name: "description", content: "DDS-Digital ব্যবহারের শর্তাবলী — অ্যাকাউন্ট, পেমেন্ট, প্রোডাক্ট ডেলিভারি, রিফান্ড ও ব্যবহারকারীর দায়িত্ব সম্পর্কে বিস্তারিত নির্দেশনা।" },
      { property: "og:title", content: "টার্মস ও কন্ডিশনস — DDS-Digital" },
      { property: "og:description", content: "DDS-Digital ব্যবহারের শর্তাবলী — অ্যাকাউন্ট, পেমেন্ট, ডেলিভারি ও রিফান্ড সম্পর্কে জানুন।" },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: () => (
    <LegalPage title="টার্মস ও কন্ডিশনস">
      <LegalSection heading="১. সাধারণ শর্তাবলী">
        DDS-Digital ব্যবহার করে আপনি এই শর্তাবলী মেনে নিচ্ছেন। শর্ত মানতে না পারলে সাইট ব্যবহার থেকে বিরত থাকুন।
      </LegalSection>
      <LegalSection heading="২. অ্যাকাউন্ট">
        সঠিক ও আপডেটেড তথ্য দিয়ে অ্যাকাউন্ট খুলতে হবে। পাসওয়ার্ড সুরক্ষার দায়িত্ব ব্যবহারকারীর।
      </LegalSection>
      <LegalSection heading="৩. প্রোডাক্ট ও পেমেন্ট">
        সব দাম BDT (৳) তে। অর্ডার নিশ্চিত হওয়ার আগে পেমেন্ট সম্পন্ন করতে হবে।
      </LegalSection>
      <LegalSection heading="৪. বিধিনিষেধ">
        আমাদের অ্যাকাউন্ট/সাবস্ক্রিপশন পুনঃবিক্রয় বা অপব্যবহার নিষিদ্ধ।
      </LegalSection>
      <LegalSection heading="৫. পরিবর্তন">
        আমরা যেকোনো সময় শর্ত পরিবর্তন করার অধিকার সংরক্ষণ করি। পরিবর্তন সাইটে প্রকাশের পরই কার্যকর হবে।
      </LegalSection>
    </LegalPage>
  ),
});
