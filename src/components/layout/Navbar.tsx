import { Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, X, ShoppingCart, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { siteSettingsQuery } from "@/lib/site-settings";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const { isAuthenticated, signOut } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const { data: settings } = useQuery(siteSettingsQuery);
  const logoUrl = settings?.site_logo_url;
  const siteName = settings?.site_name;

  const navItems: { to: string; label: string }[] = [
    { to: "/", label: t("nav_home") },
    { to: "/shop", label: t("nav_shop") },
    { to: "/blog", label: t("nav_blog") },
    { to: "/about", label: t("nav_about") },
    { to: "/developer", label: t("nav_developer") },
  ];

  return (
    <header className="sticky top-0 z-50 glass border-b border-glass-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName || "Logo"} className="h-9 w-auto max-w-[140px] object-contain" />
          ) : (
            <div className="relative h-9 w-9 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
              <span className="text-primary-foreground font-display font-bold text-sm">D</span>
            </div>
          )}
        </Link>

        {/* Nav links — visible on mobile too (horizontal scroll) */}
        <nav className="flex items-center gap-4 sm:gap-6 overflow-x-auto flex-1 justify-center px-2 no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-xs sm:text-sm font-medium text-foreground/80 hover:text-foreground transition-colors whitespace-nowrap"
              activeProps={{ className: "text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="hidden lg:flex items-center gap-2">

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 glass hover:bg-accent transition"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link to="/cart" className="relative rounded-lg p-2 glass hover:bg-accent transition" aria-label="Cart">
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-brand px-1 text-[10px] font-bold text-primary-foreground">{count}</span>
            )}
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="rounded-lg p-2 glass hover:bg-accent transition" aria-label="Dashboard">
                <User className="h-4 w-4" />
              </Link>
              <button onClick={signOut} className="rounded-lg p-2 glass hover:bg-accent transition" aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-gradient-brand px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow hover:scale-105 transition"
            >
              {t("nav_login")}
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden rounded-lg p-2 glass"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden glass border-t border-glass-border">
          <div className="space-y-1 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setLang(lang === "bn" ? "en" : "bn")}
                className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold glass"
              >
                {lang === "bn" ? "English" : "বাংলা"}
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold glass flex items-center justify-center gap-2"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
            {isAuthenticated ? (
              <button
                onClick={() => { signOut(); setOpen(false); }}
                className="block w-full rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                {t("nav_logout")}
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="block w-full text-center rounded-lg bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                {t("nav_login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
