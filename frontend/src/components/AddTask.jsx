import { useState } from "react";
import VoiceInput from "./VoiceInput.jsx";

export default function AddTask({ onAdd, onToast, lang, t }) {
  const [text,     setText]     = useState("");
  const [priority, setPriority] = useState("medium");
  const [due,      setDue]      = useState("");
  const [expanded, setExpanded] = useState(false);
  const [reminder, setReminder] = useState("");
  const [email,    setEmail]    = useState("");

  function submit() {
    if (!text.trim()) return;
    onAdd({ text:text.trim(), priority, due_date:due||null, reminder_time:reminder||null, reminder_email:email||null });
    setText(""); setDue(""); setReminder(""); setEmail("");
  }

  return (
    <div className="add-panel">
      <div className="add-row">
        <VoiceInput onResult={v => setText(p => p ? `${p} ${v}` : v)}
                    onError={m => onToast?.(m,"error")} lang={lang} />
        <input className="input input-main" placeholder={t("addTask")}
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key==="Enter" && submit()} />
        <select className="select" value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="high">{t("high")}</option>
          <option value="medium">{t("medium")}</option>
          <option value="low">{t("low")}</option>
        </select>
        <input type="date" className="input" value={due} onChange={e => setDue(e.target.value)}
          style={{ width:140 }} />
        <button className="btn-icon" onClick={() => setExpanded(x=>!x)} title="More options">
          {expanded ? "▲" : "▼"}
        </button>
        <button className="btn btn-primary" onClick={submit}>{t("addBtn")}</button>
      </div>
      {expanded && (
        <div className="add-row">
          <label style={{ display:"flex",flexDirection:"column",gap:4,flex:1 }}>
            <span style={{ fontSize:11,color:"var(--muted)" }}>{t("reminder")}</span>
            <input type="datetime-local" className="input" value={reminder} onChange={e=>setReminder(e.target.value)} />
          </label>
          <label style={{ display:"flex",flexDirection:"column",gap:4,flex:1 }}>
            <span style={{ fontSize:11,color:"var(--muted)" }}>{t("reminderEmail")}</span>
            <input type="email" className="input" placeholder="you@email.com"
              value={email} onChange={e=>setEmail(e.target.value)} />
          </label>
        </div>
      )}
    </div>
  );
}
