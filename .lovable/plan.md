## লক্ষ্য

User signup করার সময় email এ confirmation **link** এর বদলে **6-digit OTP code** যাবে। User সেই code একটা verify page এ enter করে account activate করবে।

## পরিবর্তন

### 1. Supabase Auth template
- Supabase এর "Confirm signup" email template এ `{{ .ConfirmationURL }}` এর বদলে `{{ .Token }}` ব্যবহার করতে হবে — যাতে email এ 6-digit code পাঠায়।
- এটা Lovable Cloud → Users → Auth Settings → Email Templates থেকে manual এ change করতে হবে (Lovable এর default template এই এক click setup নেই)। আমি exact steps দিয়ে দিব।

### 2. Signup flow (frontend)
- বর্তমান signup page এ `supabase.auth.signUp()` call করার পর success হলে user কে নতুন `/verify-otp` page এ redirect করব, email টা query param/state এ পাঠিয়ে।

### 3. নতুন page: `/verify-otp`
- একটা 6-digit OTP input (shadcn `InputOTP` component)
- "Verify" button → `supabase.auth.verifyOtp({ email, token, type: 'signup' })` call করবে
- Success হলে user logged-in হয়ে home এ redirect হবে
- "Resend code" button → `supabase.auth.resend({ type: 'signup', email })`
- Error handling (wrong code, expired code)

### 4. Route file
- `src/routes/verify-otp.tsx` (public route, SSR safe)

## যা পরিবর্তন হবে না
- Password reset, magic link, login flow — অপরিবর্তিত
- Database schema, RLS — অপরিবর্তিত
- Google sign-in — অপরিবর্তিত

## Files
- **New:** `src/routes/verify-otp.tsx`
- **Edit:** existing signup component (register page) — signup success এর পর redirect logic
- **Manual (user):** Cloud → Users → Auth → Email Templates → Confirm signup template এ `{{ .Token }}` বসাবেন (আমি exact template দিয়ে দিব)
