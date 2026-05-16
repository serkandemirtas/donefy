import { useState, useRef } from "react";
import { api } from "../services/api.js";

const PRI_LABEL = { en: { high:"High", medium:"Medium", low:"Low" },
                    tr: { high:"Yüksek", medium:"Orta", low:"Düşük" } };

export default function TaskCard({ task, onToggle, onDelete, onUpdate, onToast, lang }) {
  const [editing,  setEditing]  = useState(false);
  const [editVal,  setEditVal]  = useState(task.text);
  const [showImg,  setShowImg]  = useState(false);
  const [uploading,setUploading]= useState(false);
  const fileRef = useRef(null);

  function saveEdit() {
    if (editVal.trim()) onUpdate(task.id, { text: editVal.trim() });
    setEditing(false);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const { image_path } = await api.uploadImage(file);
      onUpdate(task.id, { image_path });
      setShowImg(false);
    } catch (err) { onToast?.(err.message, "error"); }
    finally { setUploading(false); }
  }

  const pLabel = (PRI_LABEL[lang] || PRI_LABEL.en)[task.priority] || task.priority;

  return (
    <div className={`task-card ${task.done ? "done" : ""} priority-${task.priority}`}>
      <div className={`checkbox ${task.done ? "checked" : ""}`} onClick={() => onToggle(task.id)} />

      <div className="task-body">
        {editing ? (
          <input autoFocus className="task-edit-input" value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter") saveEdit(); if (e.key==="Escape") setEditing(false); }}
            onBlur={saveEdit} />
        ) : (
          <div className={`task-text ${task.done ? "done-text" : ""}`}
            onDoubleClick={() => !task.done && setEditing(true)}
            title="Double-click to edit">
            {task.text}
          </div>
        )}

        {task.notes && <div className="task-notes">💡 {task.notes}</div>}

        <div className="task-meta">
          <span className="meta-chip">{pLabel}</span>
          {task.due_date && <span className="meta-chip due">📅 {task.due_date}</span>}
          {task.reminder_time && <span className="meta-chip reminder-chip">⏰ {task.reminder_time.replace("T"," ")}</span>}
          {task.image_path && (
            <span className="meta-chip has-photo"
              onClick={() => window.open(api.imageUrl(task.image_path),"_blank")}>
              📎 {lang==="tr" ? "Fotoğraf" : "Photo"}
            </span>
          )}
        </div>

        {task.image_path && (
          <img src={api.imageUrl(task.image_path)} alt="attachment" className="task-img"
            onClick={() => window.open(api.imageUrl(task.image_path),"_blank")} />
        )}

        {showImg && (
          <div style={{ marginTop:10 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
            <button className="btn btn-ghost" style={{ fontSize:12 }}
              onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "⏳ Uploading..." : "📎 Choose photo"}
            </button>
          </div>
        )}
      </div>

      <div className="task-actions">
        {!task.done && <button className="btn-icon" title="Edit" onClick={() => setEditing(true)}>✎</button>}
        <button className="btn-icon" title="Attach photo"
          onClick={() => setShowImg(x=>!x)}
          style={task.image_path ? { color:"var(--accent)" } : {}}>
          📎
        </button>
        <button className="btn-icon" style={{ color:"var(--red)" }} title="Delete"
          onClick={() => onDelete(task.id)}>✕</button>
      </div>
    </div>
  );
}
