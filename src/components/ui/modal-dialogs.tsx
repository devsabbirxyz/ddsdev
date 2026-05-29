import { useEffect, useState } from "react";
import { Trash2, CheckCircle2 } from "lucide-react";

// ---------------- Imperative API ----------------
type ConfirmOpts = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};
type SuccessOpts = {
  title?: string;
  description?: string;
  buttonText?: string;
  autoCloseMs?: number;
};

type Listener = (state: ModalState) => void;
type ModalState =
  | { kind: "none" }
  | { kind: "confirm"; opts: Required<ConfirmOpts>; resolve: (v: boolean) => void }
  | { kind: "success"; opts: Required<SuccessOpts>; resolve: () => void };

let current: ModalState = { kind: "none" };
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l(current));

export function confirmDialog(opts: ConfirmOpts = {}): Promise<boolean> {
  return new Promise((resolve) => {
    current = {
      kind: "confirm",
      resolve,
      opts: {
        title: opts.title ?? "আপনি কি নিশ্চিত?",
        description:
          opts.description ??
          "এই প্রোডাক্টটি স্থায়ীভাবে মুছে যাবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
        confirmText: opts.confirmText ?? "হ্যাঁ, মুছে দিন",
        cancelText: opts.cancelText ?? "বাতিল করুন",
      },
    };
    emit();
  });
}

export function successDialog(opts: SuccessOpts = {}): Promise<void> {
  return new Promise((resolve) => {
    current = {
      kind: "success",
      resolve,
      opts: {
        title: opts.title ?? "প্রোডাক্ট যোগ সফল হয়েছে!",
        description:
          opts.description ??
          "আপনার প্রোডাক্টটি সফলভাবে যোগ করা হয়েছে এবং এখন Shop-এ দেখা যাচ্ছে।",
        buttonText: opts.buttonText ?? "ঠিক আছে",
        autoCloseMs: opts.autoCloseMs ?? 3000,
      },
    };
    emit();
  });
}

function close() {
  current = { kind: "none" };
  emit();
}

// ---------------- Host ----------------
export function ModalDialogHost() {
  const [state, setState] = useState<ModalState>(current);
  useEffect(() => {
    const l: Listener = (s) => setState(s);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  // Esc to close
  useEffect(() => {
    if (state.kind === "none") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind]);

  // Success auto-close
  useEffect(() => {
    if (state.kind !== "success") return;
    const ms = state.opts.autoCloseMs;
    if (!ms || ms <= 0) return;
    const t = setTimeout(() => {
      if (current.kind === "success") {
        const r = current.resolve;
        close();
        r();
      }
    }, ms);
    return () => clearTimeout(t);
  }, [state]);

  if (state.kind === "none") return null;

  function onCancel() {
    if (current.kind === "confirm") {
      const r = current.resolve;
      close();
      r(false);
    } else if (current.kind === "success") {
      const r = current.resolve;
      close();
      r();
    }
  }
  function onConfirm() {
    if (current.kind === "confirm") {
      const r = current.resolve;
      close();
      r(true);
    } else if (current.kind === "success") {
      onCancel();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-scale-in w-full max-w-[420px] rounded-2xl p-8 text-center shadow-2xl"
        style={{
          background: "rgba(13,13,26,0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
        }}
      >
        {state.kind === "confirm" ? (
          <>
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-500/15">
              <Trash2 className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">{state.opts.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{state.opts.description}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={onCancel}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
              >
                {state.opts.cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
                style={{ background: "#EF4444" }}
              >
                {state.opts.confirmText}
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15"
              style={{ animation: "scale-in 0.4s ease-out" }}
            >
              <CheckCircle2 className="h-9 w-9 text-emerald-400" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">{state.opts.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{state.opts.description}</p>
            <button
              onClick={onConfirm}
              className="mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
              style={{ background: "#FF6B35" }}
            >
              {state.opts.buttonText}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
