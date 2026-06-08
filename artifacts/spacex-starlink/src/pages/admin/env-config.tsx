import React, { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminToken } from "@/lib/auth";
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

const FIELDS = [
  {
    key: "PAYSTACK_SECRET_KEY",
    label: "Paystack Secret Key",
    placeholder: "sk_live_... or sk_test_...",
    hint: "dashboard.paystack.com → Settings → API Keys & Webhooks → Secret Key",
    provider: "Paystack",
    isLink: false,
  },
  {
    key: "PAYSTACK_WEBHOOK_SECRET",
    label: "Paystack Webhook Secret",
    placeholder: "Your Paystack webhook signing secret",
    hint: "dashboard.paystack.com → Settings → API Keys & Webhooks → Webhook URL secret",
    provider: "Paystack",
    isLink: false,
  },
  {
    key: "DATABASE_URL",
    label: "Database URL",
    placeholder: "postgresql://user:pass@host:5432/dbname",
    hint: "Your PostgreSQL connection string",
    provider: "Database",
    isLink: false,
  },
  {
    key: "RESEND_API_KEY",
    label: "Resend API Key",
    placeholder: "re_...",
    hint: "resend.com → API Keys → Create API Key",
    provider: "Resend (Email)",
    isLink: false,
  },
  {
    key: "SESSION_SECRET",
    label: "Session Secret",
    placeholder: "Any long random string (32+ chars)",
    hint: "Used to sign JWTs — generate any long random string",
    provider: "Auth",
    isLink: false,
  },
  {
    key: "ADMIN_PASSWORD",
    label: "Admin Password",
    placeholder: "admin123",
    hint: "Password to log into /admin — change from default",
    provider: "Auth",
    isLink: false,
  },
];


export default function EnvConfig() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [existing, setExisting] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<{ created?: string[]; error?: string } | null>(null);

  React.useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/admin/get-env`, {
      headers: { Authorization: `Bearer ${getAdminToken()}` },
    })
      .then((r) => r.json())
      .then((data) => { if (data.settings) setExisting(data.settings); })
      .catch(() => {});
  }, []);

  const handleChange = (key: string, val: string) => {
    setValues((v) => ({ ...v, [key]: val }));
  };

  const toggleShow = (key: string) => {
    setShow((s) => ({ ...s, [key]: !s[key] }));
  };

  const handleSave = async () => {
    const filled = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v.trim().length > 0)
    );
    if (Object.keys(filled).length === 0) return;

    setStatus("loading");
    setResult(null);

    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/admin/set-env`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({ vars: filled }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setStatus("error");
        setResult({ error: data.error || `Error ${res.status}` });
      } else {
        setStatus("success");
        setResult({ created: data.created || [] });
        setValues({});
      }
    } catch (e: unknown) {
      setStatus("error");
      setResult({ error: e instanceof Error ? e.message : "Network error" });
    }
  };

  const filledCount = Object.values(values).filter((v) => v.trim()).length;

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-white flex items-center gap-3">
          <KeyRound className="w-7 h-7 text-primary" />
          Environment Config
        </h1>
        <p className="text-muted-foreground mt-2">
          Add your API keys here. Each key is saved securely to the database and applied immediately — no redeploy needed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 max-w-2xl">
        {FIELDS.map((field) => (
          <Card key={field.key} className={`bg-card border-border ${existing[field.key] ? "border-emerald-700/40" : ""}`}>
            <CardHeader className="pb-2 pt-4 px-5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-sm font-bold text-white">{field.label}</CardTitle>
                <div className="flex items-center gap-2">
                  {existing[field.key] && (
                    <span className="text-[10px] text-emerald-400 border border-emerald-700/50 rounded px-2 py-0.5 uppercase tracking-widest font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Set
                    </span>
                  )}
                  <span className="text-[10px] text-primary border border-primary/30 rounded px-2 py-0.5 uppercase tracking-widest font-bold">
                    {field.provider}
                  </span>
                </div>
              </div>
              <CardDescription className="text-xs text-gray-500 mt-0.5">{field.hint}</CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <div className="relative">
                <Input
                  type={show[field.key] ? "text" : "password"}
                  placeholder={field.placeholder}
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="pr-10 bg-background border-border text-white placeholder:text-gray-700 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => toggleShow(field.key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {show[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Status feedback */}
        {status === "success" && result?.created && (
          <div className="flex items-start gap-3 bg-emerald-950/40 border border-emerald-700/40 rounded-lg p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-400">Saved!</p>
              <p className="text-xs text-emerald-600 mt-1">
                {result.created.join(", ")} — settings are now active immediately.
              </p>
            </div>
          </div>
        )}

        {status === "error" && result?.error && (
          <div className="flex items-start gap-3 bg-red-950/40 border border-red-700/40 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400">Failed to save</p>
              <p className="text-xs text-red-600 mt-1">{result.error}</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={filledCount === 0 || status === "loading"}
          className="w-full h-12 text-sm font-black uppercase tracking-widest bg-primary text-black hover:bg-primary/90 disabled:opacity-40"
        >
          {status === "loading" ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving settings...</>
          ) : (
            `Save ${filledCount > 0 ? filledCount : ""} Setting${filledCount !== 1 ? "s" : ""}`
          )}
        </Button>

        <p className="text-xs text-gray-700 text-center">
          Only fill in the settings you want to update. Empty fields are ignored.
          Changes are applied immediately to the running server.
        </p>
      </div>
    </AdminLayout>
  );
}
