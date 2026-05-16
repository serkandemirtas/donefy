import { useState } from "react";
import { api } from "../services/api.js";

export default function AIPanel({ open, onClose, onAddMany, onToast, lang, t }) {
  const [history, setHistory] = useState([{ role:"ai", text: lang==="tr"
    ? "👋 Merhaba! Görevlerinizle ilgili yardımcı olabilirim."
    : "👋 Hi! I can help with your tasks." }]);
  const [input,   setInput]   = useState("");
  const [goal,    setGoal]    = useState("");
  const [loading, setLoading] = useState(false);

  function add(role, text) { setHistory(h=>[...h,{role,text}]); }

  async function sendChat() {
    const msg = input.trim(); if (!msg||loading) return;
    setInput(""); add("user", msg); setLoading(true);
    try { const {reply} = await api.aiChat(msg, lang); add("ai", reply); }
    catch(e) { add("system", `⚠ ${e.message}`); }
    finally { setLoading(false); }
  }

  async function suggest() {
    const g = goal.trim(); if (!g||loading) return;
    setLoading(true);
    try {
      const {tasks} = await api.aiSuggest(g, lang);
      add("ai", `"${g}" → ${tasks.length} tasks:\n${tasks.map((t,i)=>`${i+1}. ${t}`).join("\n")}`);
      await onAddMany(tasks);
      setGoal("");
      onToast(`${tasks.length} ${t("tasksAdded")}`, "success");
    } catch(e) { add("system",`⚠ ${e.message}`); }
    finally { setLoading(false); }
  }

  async function prioritise() {
    setLoading(true);
    try { const {recommendation} = await api.aiPrioritise(lang); add("ai", recommendation); }
    catch(e) { add("system",`⚠ ${e.message}`); }
    finally { setLoading(false); }
  }

  return (
    <div className={`ai-panel ${open?"open":""}`}>
      <div className="ai-panel-header">
        <span className="ai-panel-title">✦ {t("aiAssistant")}</span>
        <button className="btn-icon" onClick={onClose}>✕</button>
      </div>

      <div className="ai-goal-area">
        <span className="ai-goal-label">{t("goalPlaceholder")}</span>
        <input className="ai-goal-input" placeholder={t("goalPlaceholder")}
          value={goal} onChange={e=>setGoal(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&suggest()} />
        <div className="ai-btn-row">
          <button className="btn btn-primary" style={{ flex:1,fontSize:12,justifyContent:"center" }}
            onClick={suggest} disabled={loading||!goal.trim()}>
            {t("suggestTasks")}
          </button>
          <button className="btn btn-ghost" style={{ flex:1,fontSize:12,justifyContent:"center" }}
            onClick={prioritise} disabled={loading}>
            {t("prioritise")}
          </button>
        </div>
      </div>

      <div className="ai-chat-box">
        {history.map((m,i) => (
          <div key={i} className={`ai-msg ai-msg-${m.role}`}>{m.text}</div>
        ))}
        {loading && (
          <div className="ai-msg ai-msg-ai ai-typing">
            <span/><span/><span/>
          </div>
        )}
      </div>

      <div className="ai-input-row">
        <input className="ai-input" placeholder={t("chatPlaceholder")}
          value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()} />
        <button className="btn btn-primary" onClick={sendChat}
          disabled={loading||!input.trim()} style={{ padding:"7px 12px" }}>↑</button>
      </div>
    </div>
  );
}
