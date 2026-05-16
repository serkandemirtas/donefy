import { useState, useEffect } from "react";
import { api } from "../services/api.js";

const MODELS = {
  anthropic: [
    { value:"claude-opus-4-6",           label:"Claude Opus 4.6 — Most powerful" },
    { value:"claude-sonnet-4-6",         label:"Claude Sonnet 4.6 — Balanced" },
    { value:"claude-haiku-4-5-20251001", label:"Claude Haiku 4.5 — Fastest" },
  ],
  openai: [
    { value:"gpt-4o",        label:"GPT-4o — Most powerful" },
    { value:"gpt-4o-mini",   label:"GPT-4o Mini — Fast & cheap" },
    { value:"gpt-4-turbo",   label:"GPT-4 Turbo" },
    { value:"gpt-3.5-turbo", label:"GPT-3.5 Turbo" },
  ],
  gemini: [
    { value:"gemini-1.5-pro",   label:"Gemini 1.5 Pro" },
    { value:"gemini-1.5-flash", label:"Gemini 1.5 Flash — Fast" },
    { value:"gemini-1.0-pro",   label:"Gemini 1.0 Pro" },
  ],
};

const PROVIDERS = {
  anthropic: { name:"Anthropic Claude", icon:"◆", color:"#7c6ef7", link:"console.anthropic.com", kf:"anthropic_api_key", mf:"anthropic_model" },
  openai:    { name:"OpenAI GPT",       icon:"⬡", color:"#10a37f", link:"platform.openai.com/api-keys", kf:"openai_api_key", mf:"openai_model" },
  gemini:    { name:"Google Gemini",    icon:"✦", color:"#4285f4", link:"aistudio.google.com/app/apikey", kf:"gemini_api_key", mf:"gemini_model" },
};

const THEMES = [
  { value:"dark",   icon:"🌙" },
  { value:"light",  icon:"☀️" },
  { value:"system", icon:"💻" },
];

export default function SettingsPanel({ onToast, onThemeChange, lang, t }) {
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo,  setTestTo]  = useState("");

  useEffect(() => {
    api.getSettings().then(setForm).catch(() => onToast("Failed to load settings","error"));
  }, []);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  async function save() {
    setSaving(true);
    try {
      const upd = await api.saveSettings(form);
      setForm(upd);
      onThemeChange?.(form.theme);
      onToast(t("saved"),"success");
    } catch(e) { onToast(e.message,"error"); }
    finally { setSaving(false); }
  }

  async function sendTest() {
    if (!testTo.trim()) return onToast("Enter recipient email","error");
    setTesting(true);
    try { const r = await api.testEmail(testTo.trim()); onToast(r.message,"success"); }
    catch(e) { onToast(e.message,"error"); }
    finally { setTesting(false); }
  }

  if (!form) return <div className="settings"><p style={{color:"var(--muted)"}}>Loading…</p></div>;

  const ap   = form.ai_provider || "anthropic";
  const prov = PROVIDERS[ap];

  return (
    <div className="settings">

      {/* Theme */}
      <div className="settings-section">
        <h3>{t("theme")}</h3>
        <div className="theme-options">
          {THEMES.map(th => (
            <button key={th.value} className={`theme-opt ${form.theme===th.value?"active":""}`}
              onClick={() => { set("theme",th.value); onThemeChange?.(th.value); }}>
              <span className="theme-opt-icon">{th.icon}</span>
              <span className="theme-opt-label">{t(th.value)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="settings-section">
        <h3>{t("language")}</h3>
        <div style={{ display:"flex", gap:10 }}>
          {["en","tr"].map(l => (
            <button key={l} className={`provider-tab ${form.language===l?"active":""}`}
              style={form.language===l?{borderColor:"var(--accent)",color:"var(--accent)",background:"var(--accent-bg)"}:{}}
              onClick={() => set("language",l)}>
              {l==="en" ? "🇬🇧 English" : "🇹🇷 Türkçe"}
            </button>
          ))}
        </div>
      </div>

      {/* AI Provider */}
      <div className="settings-section">
        <h3>{t("aiProvider")}</h3>
        <div>
          <div className="field" style={{ marginBottom:10 }}>
            <label>{t("activeProvider")}</label>
          </div>
          <div className="provider-tabs">
            {Object.entries(PROVIDERS).map(([k,p]) => (
              <button key={k} className={`provider-tab ${ap===k?"active":""}`}
                style={ap===k?{borderColor:p.color,color:p.color,background:`${p.color}18`}:{}}
                onClick={() => set("ai_provider",k)}>
                {p.icon} {p.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background:"var(--surf2)",borderRadius:10,padding:16,border:"1px solid var(--border)",
                      display:"flex",flexDirection:"column",gap:12 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,fontWeight:600 }}>
            <span style={{ fontSize:18 }}>{prov.icon}</span>{prov.name}
          </div>
          <div className="field">
            <label>{t("apiKey")}</label>
            <input type="password" className="input" placeholder="Click to enter..."
              value={form[prov.kf]||""}
              onChange={e => set(prov.kf, e.target.value)} />
            <span className="field-hint">
              Get key at <a href={`https://${prov.link}`} target="_blank" rel="noreferrer"
                style={{ color:"var(--accent)" }}>{prov.link}</a>
            </span>
          </div>
          <div className="field">
            <label>{t("model")}</label>
            <select className="select" value={form[prov.mf]||MODELS[ap][0].value}
              onChange={e => set(prov.mf,e.target.value)}>
              {MODELS[ap].map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <details>
          <summary style={{ fontSize:12,color:"var(--muted)",cursor:"pointer",userSelect:"none" }}>
            {t("otherKeys")}
          </summary>
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginTop:12 }}>
            {Object.entries(PROVIDERS).filter(([k])=>k!==ap).map(([k,p]) => (
              <div key={k} className="field">
                <label>{p.icon} {p.name} — {t("apiKey")}</label>
                <input type="password" className="input" placeholder="Click to enter..."
                  value={form[p.kf]||""} onChange={e=>set(p.kf,e.target.value)} />
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* Email */}
      <div className="settings-section">
        <h3>📧 {t("emailNotif")}</h3>
        <div className="field-row">
          <div className="field" style={{ flex:2 }}>
            <label>{t("smtpServer")}</label>
            <input className="input" placeholder="smtp.gmail.com"
              value={form.mail_host||""} onChange={e=>set("mail_host",e.target.value)} />
          </div>
          <div className="field" style={{ flex:1 }}>
            <label>{t("port")}</label>
            <input type="number" className="input" value={form.mail_port||587}
              onChange={e=>set("mail_port",parseInt(e.target.value))} />
          </div>
        </div>
        <div className="field">
          <label>{t("emailAddress")}</label>
          <input type="email" className="input" value={form.mail_user||""}
            onChange={e=>set("mail_user",e.target.value)} />
        </div>
        <div className="field">
          <label>{t("password")}</label>
          <input type="password" className="input" value={form.mail_password||""}
            onChange={e=>set("mail_password",e.target.value)} />
          <span className="field-hint">Gmail: myaccount.google.com → Security → App Passwords</span>
        </div>
        <div className="field-row" style={{ alignItems:"flex-end" }}>
          <div className="field" style={{ flex:1 }}>
            <label>{t("testEmail")}</label>
            <input type="email" className="input" placeholder="Recipient" value={testTo}
              onChange={e=>setTestTo(e.target.value)} />
          </div>
          <button className="btn btn-ghost" onClick={sendTest} disabled={testing}>
            {testing ? t("sending") : t("sendTest")}
          </button>
        </div>
      </div>

      {/* Scheduler */}
      <div className="settings-section">
        <h3>⏰ Scheduler</h3>
        <div className="field">
          <label>{t("schedulerInterval")}</label>
          <input type="number" className="input" min={10} max={3600}
            value={form.scheduler_interval||60}
            onChange={e=>set("scheduler_interval",parseInt(e.target.value))} />
        </div>
      </div>

      <div style={{ paddingBottom:20 }}>
        <button className="btn btn-primary" onClick={save} disabled={saving}
          style={{ width:"100%",justifyContent:"center",fontSize:14,padding:"10px" }}>
          {saving ? t("saving") : `💾 ${t("saveSettings")}`}
        </button>
      </div>
    </div>
  );
}
