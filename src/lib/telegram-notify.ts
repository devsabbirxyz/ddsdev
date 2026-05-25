import { sendTelegramNotification } from "@/lib/telegram.functions";

function fmtTime() {
  return new Date().toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" });
}

function siteUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

function fire(message: string) {
  const full = `${message}\n\n🔗 Admin Panel দেখুন: ${siteUrl()}/admin`;
  // fire-and-forget; never block UX
  try {
    void sendTelegramNotification({ data: { message: full } }).catch(() => {});
  } catch {
    // ignore
  }
}

export const notify = {
  newOrder(o: { name: string; phone: string; product: string; amount: number }) {
    fire(
      `🛒 <b>নতুন অর্ডার!</b>\n👤 নাম: ${o.name}\n📱 ফোন: ${o.phone}\n🛍️ পণ্য: ${o.product}\n💰 টাকা: ${o.amount} টাকা\n🕐 সময়: ${fmtTime()}`,
    );
  },
  newSignup(o: { email: string; name: string }) {
    fire(
      `👤 <b>নতুন কাস্টমার রেজিস্ট্রেশন!</b>\n📧 ইমেইল: ${o.email}\n👤 নাম: ${o.name}\n🕐 সময়: ${fmtTime()}`,
    );
  },
  newTicket(o: { name: string; subject: string; message: string }) {
    fire(
      `🎫 <b>নতুন সাপোর্ট টিকিট!</b>\n👤 নাম: ${o.name}\n📝 বিষয়: ${o.subject}\n💬 বার্তা: ${o.message}\n🕐 সময়: ${fmtTime()}`,
    );
  },
  passwordReset(o: { email: string }) {
    fire(
      `🔑 <b>পাসওয়ার্ড রিসেট রিকোয়েস্ট!</b>\n📧 ইমেইল: ${o.email}\n🕐 সময়: ${fmtTime()}`,
    );
  },
  paymentSubmit(o: { name: string; amount: number; method: string; trxId: string }) {
    fire(
      `💳 <b>নতুন পেমেন্ট সাবমিট!</b>\n👤 নাম: ${o.name}\n💰 পরিমাণ: ${o.amount} টাকা\n🏦 মেথড: ${o.method}\n🔢 TrxID: ${o.trxId}\n🕐 সময়: ${fmtTime()}`,
    );
  },
};
