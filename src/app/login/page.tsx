"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { IconEye, IconEyeOff, IconLock } from "@tabler/icons-react";
import { adminLogin } from "@/lib/services/adminAuthService";
import { adminLoginSchema } from "@/lib/validations/admin-login";
import { twMerge } from "tailwind-merge";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = adminLoginSchema.safeParse({
      email: email.trim(),
      password,
    });

    if (!result.success) {
      const flattened = result.error.flatten();
      const next: Record<string, string> = {};
      for (const [key, messages] of Object.entries(flattened.fieldErrors)) {
        const msg = Array.isArray(messages) ? messages[0] : messages;
        if (typeof msg === "string") next[key] = msg;
      }
      setFieldErrors(next);
      return;
    }

    setLoading(true);
    try {
      await adminLogin(result.data);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const inputBase = twMerge(
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all duration-200",
    "placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#5A2A13]/5 focus:border-[#5A2A13]",
    "disabled:pointer-events-none disabled:opacity-50"
  );
  const labelBase =
    "mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1";
  const errorText =
    "mt-2 text-xs font-bold text-rose-500 animate-in fade-in duration-200";

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-slate-50 px-6">
      <div className="relative z-10 w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-700">
        <div className="overflow-hidden rounded-[2.5rem] bg-white p-1.5 shadow-[0_48px_80px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-200/50">
          <div className="rounded-[2.2rem] bg-white px-8 py-10 sm:px-10">

            {/* Inner Logo & Single Small Headline */}
            <div className="mb-10 flex flex-col items-center">
              <div className="mb-5 w-28 p-1">
                <Image
                  src="/logo.png"
                  alt="Vrindavan Logo"
                  width={112}
                  height={36}
                  className="w-full h-auto object-contain transition-all duration-300 hover:scale-105"
                  priority
                />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Vrindavan Adminn
              </h1>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Manage your administrative workspace
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="space-y-5">
                <div className="group/field">
                  <label htmlFor="email" className={labelBase}>
                    {t("auth.email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={twMerge(
                      inputBase,
                      fieldErrors.email && "border-rose-300 bg-rose-50/10 focus:ring-rose-200 focus:border-rose-500"
                    )}
                    placeholder={t("auth.emailPlaceholder")}
                  />
                  {fieldErrors.email && (
                    <p className={errorText}>{fieldErrors.email}</p>
                  )}
                </div>

                <div className="group/field">
                  <label htmlFor="password" className={labelBase}>
                    {t("auth.password")}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className={twMerge(
                        inputBase,
                        "pr-12",
                        fieldErrors.password && "border-rose-300 bg-rose-50/10 focus:ring-rose-200 focus:border-rose-500"
                      )}
                      placeholder={t("auth.passwordPlaceholder")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <IconEyeOff className="h-5 w-5" stroke={2} aria-hidden />
                      ) : (
                        <IconEye className="h-5 w-5" stroke={2} aria-hidden />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className={errorText}>{fieldErrors.password}</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 animate-in fade-in zoom-in-95 duration-200">
                  <IconLock className="h-4 w-4 text-rose-500" stroke={2} />
                  <p className="text-[11px] font-bold text-rose-600 leading-tight">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={twMerge(
                  "relative w-full overflow-hidden rounded-2xl bg-[#5A2A13] px-6 py-4 font-bold text-white shadow-xl shadow-[#5A2A13]/20 transition-all duration-300 hover:brightness-110 active:scale-[0.98]",
                  "disabled:pointer-events-none disabled:opacity-60"
                )}
              >
                <span className={twMerge("flex items-center justify-center gap-3", loading && "opacity-0")}>
                  {t("auth.signIn")}
                </span>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
