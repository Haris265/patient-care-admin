"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Lock, User } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { homePathForRole, login } from "@/lib/api";

export type LoginPortal = "superadmin" | "clinic" | "admin";

const PORTAL_COPY: Record<
  LoginPortal,
  { chip: string; subtitle: string; formTitle: string; formHint: string; footer: string }
> = {
  superadmin: {
    chip: "Superadmin Portal",
    subtitle: "Platform billing, clinics, and subscriptions",
    formTitle: "Welcome back",
    formHint: "Sign in as superadmin",
    footer: "Secured · Audited · Superadmin only",
  },
  clinic: {
    chip: "Clinic Portal",
    subtitle: "Doctors, appointments, packages, and ledger",
    formTitle: "Welcome back",
    formHint: "Sign in as clinic admin",
    footer: "Secured · Audited · Clinic admin only",
  },
  admin: {
    chip: "Admin Portal",
    subtitle: "Clinic operations — doctors, patients, and appointments",
    formTitle: "Welcome back",
    formHint: "Sign in as admin",
    footer: "Secured · Audited · Admin only",
  },
};

const EXPECTED_ROLE: Record<LoginPortal, string> = {
  superadmin: "superadmin",
  clinic: "clinic_admin",
  admin: "admin",
};

const particles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  style: {
    width: `${4 + (i % 5) * 3}px`,
    height: `${4 + (i % 5) * 3}px`,
    left: `${8 + ((i * 7.5) % 85)}%`,
    bottom: `${5 + ((i * 11) % 40)}%`,
    background:
      i % 3 === 0
        ? "rgba(45,212,191,0.65)"
        : i % 3 === 1
          ? "rgba(61,154,130,0.55)"
          : "rgba(106,187,165,0.45)",
    animationDuration: `${4 + ((i * 1.3) % 5)}s`,
    animationDelay: `${(i * 0.6) % 4}s`,
  } as React.CSSProperties,
}));

export function LoginForm({ portal }: { portal: LoginPortal }) {
  const router = useRouter();
  const copy = PORTAL_COPY[portal];
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(username, password, EXPECTED_ROLE[portal]);
      router.replace(homePathForRole(data.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="premium-page-bg relative flex h-screen overflow-hidden">
      <div className="mesh-grid-bg pointer-events-none absolute inset-0" />

      <div
        className="premium-card relative m-4 hidden h-[calc(100%-2rem)] w-[52%] flex-col overflow-hidden rounded-3xl lg:flex"
        style={{ background: "var(--login-panel-bg)" }}
      >
        <div className="animate-rotate-ring pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-400/15" />
        <div className="animate-rotate-ring-rev pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-accent-400/15" />
        <div
          className="glow-pulse pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(20,93,79,0.45), transparent 70%)" }}
        />
        <div
          className="glow-pulse pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(45,212,191,0.22), transparent 70%)",
            animationDelay: "1.8s",
          }}
        />

        {particles.map((p) => (
          <div key={p.id} className="particle" style={p.style} />
        ))}

        <div className="animate-slide-in-left relative z-10 shrink-0 p-8">
          <div className="premium-chip mb-4 inline-flex items-center gap-2 rounded-full border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-brand-100">
            {copy.chip}
          </div>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-6">
          <BrandLogo
            priority
            width={360}
            height={134}
            className="h-auto w-[320px] object-contain"
          />
        </div>

        <div className="animate-slide-in-left stagger-3 relative z-10 shrink-0 p-8">
          <div className="mb-3 h-px bg-gradient-to-r from-brand-400/70 via-accent-400/50 to-transparent" />
          <p className="max-w-sm text-sm leading-relaxed text-slate-300">{copy.subtitle}</p>
        </div>
      </div>

      <div className="relative flex h-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(20,93,79,1) 1px, transparent 1px), linear-gradient(90deg, rgba(20,93,79,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="glow-pulse pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(20,93,79,0.14), transparent 70%)" }}
        />

        <div className="mb-6 flex lg:hidden">
          <BrandLogo
            priority
            width={240}
            height={90}
            className="h-auto w-[210px] object-contain"
          />
        </div>

        <div className="premium-card premium-card-glow shine-border animate-slide-in-right relative z-10 w-full max-w-[400px] rounded-3xl p-8">
          <div className="mb-7 animate-fade-in-up">
            <div
              className="premium-chip mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white"
              style={{
                background: "linear-gradient(145deg, #3d9a82 0%, #145D4F 100%)",
                boxShadow: "0 8px 20px -4px rgba(20,93,79,0.65)",
              }}
            >
              <Lock size={22} />
            </div>
            <h2 className="text-2xl font-bold text-[var(--premium-text)]">{copy.formTitle}</h2>
            <p className="mt-1 text-sm text-[var(--premium-muted-text)]">{copy.formHint}</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="animate-fade-in-up stagger-1">
              <label className="mb-1.5 block text-xs font-medium text-[var(--premium-label)]">
                Username
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--premium-label)]"
                />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocused("user")}
                  onBlur={() => setFocused(null)}
                  required
                  autoComplete="username"
                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                  style={{
                    background: "var(--premium-field-bg)",
                    color: "var(--premium-field-text)",
                    borderColor:
                      focused === "user" ? "rgba(20,93,79,0.75)" : "var(--premium-border)",
                    boxShadow:
                      focused === "user"
                        ? "0 0 0 3px rgba(20,93,79,0.18), inset 0 1px 2px rgba(0,0,0,0.06)"
                        : "inset 0 1px 2px rgba(0,0,0,0.06)",
                  }}
                />
              </div>
            </div>

            <div className="animate-fade-in-up stagger-2">
              <label className="mb-1.5 block text-xs font-medium text-[var(--premium-label)]">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--premium-label)]"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("pass")}
                  onBlur={() => setFocused(null)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                  style={{
                    background: "var(--premium-field-bg)",
                    color: "var(--premium-field-text)",
                    borderColor:
                      focused === "pass" ? "rgba(20,93,79,0.75)" : "var(--premium-border)",
                    boxShadow:
                      focused === "pass"
                        ? "0 0 0 3px rgba(20,93,79,0.18), inset 0 1px 2px rgba(0,0,0,0.06)"
                        : "inset 0 1px 2px rgba(0,0,0,0.06)",
                  }}
                />
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <div className="animate-fade-in-up stagger-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="press-btn shine-hover relative w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60"
                style={{
                  background: "linear-gradient(145deg, #3d9a82 0%, #145D4F 55%, #0b322b 100%)",
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,0.14) inset, 0 8px 24px -6px rgba(20,93,79,0.55)",
                }}
              >
                <span className="relative">{loading ? "Signing in…" : "Sign in"}</span>
              </button>
            </div>
          </form>

          <div className="mt-6 flex animate-fade-in-up stagger-4 items-center gap-3">
            <div className="h-px flex-1 bg-[var(--premium-divider)]" />
            <div className="flex items-center gap-1.5 text-xs text-[var(--premium-muted-text)]">
              <Activity size={12} className="text-accent-500" />
              {copy.footer}
            </div>
            <div className="h-px flex-1 bg-[var(--premium-divider)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
