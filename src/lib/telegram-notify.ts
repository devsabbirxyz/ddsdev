import { sendTelegramNotification } from "@/lib/telegram.functions";

function siteOrigin(): string | undefined {
  if (typeof window !== "undefined") return window.location.origin;
  return undefined;
}

function fire(payload: Parameters<typeof sendTelegramNotification>[0]["data"]["payload"]) {
  try {
    void sendTelegramNotification({
      data: { payload, origin: siteOrigin() },
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export const notify = {
  newOrder(o: { name: string; phone: string; product: string; amount: number }) {
    fire({ template: "new_order", ...o });
  },
  newSignup(o: { email: string; name: string }) {
    fire({ template: "new_signup", ...o });
  },
  newTicket(o: { name: string; subject: string; message: string }) {
    fire({ template: "new_ticket", ...o });
  },
  passwordReset(o: { email: string }) {
    fire({ template: "password_reset", ...o });
  },
  paymentSubmit(o: { name: string; amount: number; method: string; trxId: string }) {
    fire({ template: "payment_submit", ...o });
  },
};
