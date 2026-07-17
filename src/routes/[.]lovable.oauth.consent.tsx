import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuthDetails = {
  client?: { name?: string; client_id?: string; redirect_uri?: string } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
  scope?: string | null;
  requested_scopes?: string[] | null;
};

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthDetails | null; error: { message: string } | null }>;
};

function oauth(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) {
      throw redirect({ to: "/login", search: { next } as never });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate } as never);
    return data;
  },
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold mb-2">Authorization error</h1>
        <p className="text-sm text-white/70">{String((error as Error)?.message ?? error)}</p>
      </div>
    </main>
  ),
});

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "External app";
  const redirectUri = details?.client?.redirect_uri;
  const scopes = details?.requested_scopes ?? (details?.scope ? details.scope.split(/\s+/) : []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold mb-2">Connect {clientName} to DDS Digital</h1>
        <p className="text-sm text-white/70 mb-6">
          {clientName} will be able to call this app's enabled tools while you are signed in.
        </p>

        {redirectUri && (
          <p className="text-xs text-white/50 mb-4 break-all">
            Redirects to: <span className="text-white/70">{redirectUri}</span>
          </p>
        )}

        {scopes.length > 0 && (
          <ul className="mb-6 space-y-1 text-sm text-white/80">
            {scopes.map((s: string) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        )}

        <p className="text-xs text-white/50 mb-6">
          This does not bypass this app's permissions or backend policies.
        </p>

        {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-lg disabled:opacity-60"
          >
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
          >
            Deny
          </button>
        </div>
      </div>
    </main>
  );
}
