import { useState } from "react";
import VoiceInput from "./VoiceInput.jsx";
import { api }    from "../services/api.js";

const PC = { high:"var(--red)", medium:"var(--yellow)", low:"var(--green)" };

export default function AICapture({ onConfirm, onClose, onToast, lang, t }) {
  const [step,    setStep]    = useState("input");
  const [rough,   setRough]   = useState("");
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(false);

  async function analyse() {
    if (!rough.trim()) return onToast(lang==="tr"?"Lütfen bir şeyler yazın.":"Please type or speak first.","error");
    setLoading(true);
    try {
      const { tasks: ai } = await api.aiRoughToTasks(rough, lang);
      setTasks(ai.map((t,i) => ({...t, _id:i})));
      setStep("review");
    } catch(e) { onToast(e.message,"error"); }
    finally { setLoading(false); }
  }

  function upd(id, f, v) { setTasks(ts => ts.map(t => t._id===id ? {...t,[f]:v} : t)); }

  async function confirm() {
    if (!tasks.length) return;
    await onConfirm(tasks);
    setRough(""); setTasks([]); setStep("input");
  }

  return (
    <div className="ai-capture">
      <div className="ai-capture-header">
        <div>
          <div className="ai-capture-title">✦ {t("aiCaptureTitle")}</div>
          <div className="ai-capture-sub">
            {step==="input" ? t("aiCaptureSub") : `${tasks.length} ${t("aiCaptureReview")}`}
          </div>
        </div>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      {step==="input" && (
        <div className="ai-capture-body">
          <div style={{ display:"flex",alignItems:"flex-start",gap:10 }}>
            <VoiceInput onResult={v => setRough(p => p?`${p} ${v}`:v)}
                        onError={m => onToast(m,"error")} lang={lang} />
            <textarea className="ai-textarea" placeholder={t("speakOrType")}
              value={rough} onChange={e => setRough(e.target.value)}
              onKeyDown={e => e.ctrlKey&&e.key==="Enter"&&analyse()} />
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button className="btn btn-primary" style={{ flex:1,justifyContent:"center" }}
              onClick={analyse} disabled={loading||!rough.trim()}>
              {loading ? t("analysingAI") : `✦ ${t("sendToAI")}`}
            </button>
            {rough && <button className="btn btn-ghost" onClick={() => setRough("")}>{t("clearText")}</button>}
          </div>
          <div className="ai-hint">{t("voiceHint")}</div>
        </div>
      )}

      {step==="review" && (
        <div className="ai-capture-body">
          <div className="review-list">
            {tasks.map(task => (
              <div key={task._id} className={`review-card priority-${task.priority}`}>
                <input className="review-text-input" value={task.text}
                  onChange={e => upd(task._id,"text",e.target.value)} />
                {task.notes && <div className="review-notes">💡 {task.notes}</div>}
                <div className="review-row">
                  <select className="select" style={{ fontSize:12,padding:"4px 8px" }}
                    value={task.priority} onChange={e => upd(task._id,"priority",e.target.value)}>
                    <option value="high">{t("high")}</option>
                    <option value="medium">{t("medium")}</option>
                    <option value="low">{t("low")}</option>
                  </select>
                  <input type="date" className="input" style={{ fontSize:12,padding:"4px 8px" }}
                    value={task.due_date||""} onChange={e => upd(task._id,"due_date",e.target.value||null)} />
                  <button style={{ marginLeft:"auto",background:"transparent",border:"none",
                                   color:"var(--red)",cursor:"pointer",fontSize:16 }}
                    onClick={() => setTasks(ts=>ts.filter(t=>t._id!==task._id))}>✕</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button className="btn btn-ghost" onClick={() => setStep("input")} style={{ flex:1,justifyContent:"center" }}>
              {t("backBtn")}
            </button>
            <button className="btn btn-primary" onClick={confirm}
              disabled={!tasks.length} style={{ flex:2,justifyContent:"center" }}>
              ✓ {t("addAllBtn")} ({tasks.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
