
# Checkout Manual Payment — Bengali Content (bKash / Nagad / Rocket / Upay)

আগের Step 2 redesign-এর ধারাবাহিকতায় Manual ট্যাবের পুরো বাংলা content এবং brand-color layout fix করব।

## Layout (প্রতিটা method-এ একই গঠন)

```text
┌───────────────────────────────────┐  brand color box
│      ট্রানজেকশন আইডি দিন           │  (centered heading)
│  ┌─────────────────────────────┐  │
│  │ ট্রানজেকশন আইডি লিখুন         │  │  ← input
│  └─────────────────────────────┘  │
│                                   │
│  • [App] অ্যাপ খুলুন অথবা *XXX#   │
│  • "Send Money" সিলেক্ট করুন       │
│  • Receiver নম্বর দিন:             │
│      [admin number]  [কপি]        │
│  • পরিমাণ দিন: [order total]      │
│  • Reference এ আপনার নাম লিখুন    │
│  • PIN দিয়ে confirm করুন           │
│  • Confirmation SMS পেলে          │
│    ট্রানজেকশন আইডি উপরের বক্সে দিন │
│    এবং "যাচাই করুন" বাটনে চাপুন    │
└───────────────────────────────────┘
        [   যাচাই করুন   ]
```

## প্রতিটা method-এর variant

| Method | Step ১ লাইন | Box color | Button color |
|--------|------------|-----------|--------------|
| bKash  | "bKash অ্যাপ খুলুন অথবা *247# ডায়াল করুন"   | গোলাপি (pink-600)   | pink |
| Nagad  | "Nagad অ্যাপ খুলুন অথবা *167# ডায়াল করুন"   | কমলা (orange-500)   | orange |
| Rocket | "Rocket অ্যাপ খুলুন অথবা *322# ডায়াল করুন"  | বেগুনি (purple-600) | purple |
| Upay   | "Upay অ্যাপ খুলুন"                          | হলুদ (yellow-400, কালো text) | yellow |

বাকি ৬টা step হুবহু একই।

## ডায়নামিক ডাটা
- `[admin number]` → `payment_methods.account_number` থেকে; পাশে **কপি** বাটন (`navigator.clipboard.writeText` + toast "নম্বর কপি হয়েছে")।
- `[order total]` → checkout-এর computed `total` (subtotal − discount), `formatBDT()` দিয়ে।
- `[App]` ও `*XXX#` → method-name lookup map থেকে।

## Admin-edit hook
- Admin যদি `payment_methods.instructions` field-এ কিছু লেখে তাহলে সেটাই দেখানো হবে (custom override)।
- খালি/null হলে এই default Bengali content auto-render হবে।

## যাচাই করুন বাটন behavior
- Brand color match (pink/orange/purple/yellow)
- Click → existing `submit()` কল; `trxId` খালি হলে red toast "⚠️ ট্রানজেকশন আইডি দিন!" + input red-border।

## Technical Section

**Files টাচ হবে**
- `src/routes/_authenticated/checkout.tsx` — Step 2 JSX (manual section block) re-write। আগের planned method-picker card + Automatic/Manual tab structure-এর ভেতরে এই content বসবে।

**নতুন helper (same file)**
- `METHOD_THEME` constant — method name (lowercase) → `{ app, ussd, boxClass, btnClass, textOnBox }` ম্যাপিং।
- `DEFAULT_STEPS(method, adminNumber, amount)` — returns array of Bengali step strings।

**যা পরিবর্তন হবে না**
- Step 1 (তথ্য) UI
- Sidebar order summary + coupon
- `submit()` logic, order insert, success dialog
- Admin payment settings (আলাদা plan-এ approve হলে চলবে)
- DB schema

Approve করলে শুধু `checkout.tsx`-এর Step 2 manual block আপডেট করব — এক ফাইলেই সম্পূর্ণ change।
