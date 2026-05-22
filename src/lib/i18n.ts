// Lightweight i18n — Bangla default, English toggle. No external dep.
import { createContext, useContext } from "react";

export type Lang = "bn" | "en";

export const translations = {
  bn: {
    site_name: "DDS-Digital",
    tagline: "বাংলাদেশের #১ ডিজিটাল প্রোডাক্ট সেলিং সিস্টেম",
    tagline_full: "Bangladesh's Number 1 Digital Product Selling System",
    brand_sub: "Dev Sabbir Soft",
    nav_home: "হোম",
    nav_shop: "শপ",
    nav_products: "প্রোডাক্ট",
    nav_blog: "ব্লগ",
    nav_about: "আমাদের সম্পর্কে",
    nav_developer: "ডেভেলপার",
    nav_login: "লগইন",
    nav_register: "রেজিস্টার",
    nav_logout: "লগআউট",
    nav_dashboard: "ড্যাশবোর্ড",
    become_seller: "সেলার হোন",
    become_affiliate: "অ্যাফিলিয়েট হোন",
    shop_now: "এখনই কিনুন",
    coming_soon: "শীঘ্রই আসছে",
    welcome_back: "আবার স্বাগতম",
    create_account: "অ্যাকাউন্ট তৈরি করুন",
    email: "ইমেইল",
    password: "পাসওয়ার্ড",
    full_name: "পূর্ণ নাম",
    phone: "ফোন নম্বর",
    forgot_password: "পাসওয়ার্ড ভুলে গেছেন?",
    no_account: "অ্যাকাউন্ট নেই?",
    have_account: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
    sign_in: "সাইন ইন",
    sign_up: "সাইন আপ",
    reset_password: "পাসওয়ার্ড রিসেট",
    send_reset_link: "রিসেট লিংক পাঠান",
    back_to_login: "লগইনে ফিরে যান",
    loading: "লোড হচ্ছে...",
    instant_delivery: "ইনস্ট্যান্ট অটো ডেলিভারি",
    secure_payment: "সুরক্ষিত পেমেন্ট",
    support_247: "২৪/৭ সাপোর্ট",
    hero_badge: "🔥 বাংলাদেশের #১ ডিজিটাল মার্কেটপ্লেস",
    explore_products: "প্রোডাক্ট দেখুন",
    foot_account: "আমার অ্যাকাউন্ট",
    foot_useful: "প্রয়োজনীয় লিংক",
    foot_we_accept: "আমরা গ্রহণ করি",
    rights: "সর্বস্বত্ব সংরক্ষিত",
  },
  en: {
    site_name: "DDS-Digital",
    tagline: "Bangladesh's Number 1 Digital Product Selling System",
    tagline_full: "Bangladesh's Number 1 Digital Product Selling System",
    brand_sub: "Dev Sabbir Soft",
    nav_home: "Home",
    nav_shop: "Shop",
    nav_products: "Products",
    nav_blog: "Blog",
    nav_about: "About",
    nav_developer: "Developer",
    nav_login: "Login",
    nav_register: "Register",
    nav_logout: "Logout",
    nav_dashboard: "Dashboard",
    become_seller: "Become a Seller",
    become_affiliate: "Become an Affiliate",
    shop_now: "Shop Now",
    coming_soon: "Coming Soon",
    welcome_back: "Welcome Back",
    create_account: "Create Account",
    email: "Email",
    password: "Password",
    full_name: "Full Name",
    phone: "Phone",
    forgot_password: "Forgot password?",
    no_account: "No account?",
    have_account: "Already have an account?",
    sign_in: "Sign In",
    sign_up: "Sign Up",
    reset_password: "Reset Password",
    send_reset_link: "Send reset link",
    back_to_login: "Back to login",
    loading: "Loading...",
    instant_delivery: "Instant Auto Delivery",
    secure_payment: "Secure Payment",
    support_247: "24/7 Support",
    hero_badge: "🔥 Bangladesh's #1 Digital Marketplace",
    explore_products: "Explore Products",
    foot_account: "My Account",
    foot_useful: "Useful Links",
    foot_we_accept: "We Accept",
    rights: "All rights reserved",
  },
} as const;

export type TKey = keyof typeof translations.bn;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TKey) => string;
}

export const I18nContext = createContext<I18nCtx>({
  lang: "bn",
  setLang: () => {},
  t: (k) => translations.bn[k] ?? String(k),
});

export const useI18n = () => useContext(I18nContext);
