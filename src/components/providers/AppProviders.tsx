import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nContext, translations, type Lang, type TKey } from "@/lib/i18n";
import { ThemeContext, type Theme } from "@/lib/theme";
import { AuthContext, type AuthUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: ReactNode }) {
  // ---- Theme (dark default) ----
  const [theme, setThemeState] = useState<Theme>("dark");
  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("dds-theme")) as Theme | null;
    const next: Theme = stored === "light" ? "light" : "dark";
    setThemeState(next);
  }, []);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (typeof window !== "undefined") localStorage.setItem("dds-theme", t);
  }, []);

  // ---- Language (Bangla only — English version removed) ----
  const lang: Lang = "bn";
  const setLang = useCallback((_l: Lang) => {
    // English is disabled site-wide; language is locked to Bangla.
  }, []);
  const t = useCallback((k: TKey) => translations.bn[k] ?? String(k), []);


  // ---- Auth ----
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set listener FIRST, then fetch session (avoids race)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email ?? "" } : null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const themeValue = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  const i18nValue = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  const authValue = useMemo(() => ({ user, loading, signOut, isAuthenticated: !!user }), [user, loading, signOut]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <I18nContext.Provider value={i18nValue}>
        <AuthContext.Provider value={authValue}>
          <CartProvider>
            <WishlistProvider>{children}</WishlistProvider>
          </CartProvider>
        </AuthContext.Provider>
      </I18nContext.Provider>
    </ThemeContext.Provider>
  );
}
