/**
 * App.jsx
 * -------
 * Root component of DONEFY. Handles:
 *   - App shell layout (titlebar, sidebar, main area)
 *   - View routing (tasks / calendar / settings)
 *   - Theme application (dark / light / system)
 *   - Toast notifications including undo-delete toasts
 *   - SSE (Server-Sent Events) for live reminder notifications
 *   - Language switching (EN / TR)
 */

import { useState, useCallback, useEffect } from "react";
import TaskCard      from "./components/TaskCard.jsx";
import AddTask       from "./components/AddTask.jsx";
import AICapture     from "./components/AICapture.jsx";
import AIPanel       from "./components/AIPanel.jsx";
import CalendarView  from "./components/CalendarView.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import { useTasks }  from "./hooks/useTasks.js";
import { useLang  }  from "./hooks/useLang.js";
import { api }       from "./services/api.js";

// ── Toast system ───────────────────────────────────────────────────────────────
// Each toast has: id, msg, type ("success" | "error" | "info"), and
// an optional onUndo callback that renders an "Undo" button inside the toast.
let _tid = 0;

function useToasts() {
  const [toasts, setToasts] = useState([]);

  /**
   * push(msg, type, onUndo?)
   * Shows a toast. If onUndo is provided, an "Undo" button appears.
   * Toasts auto-dismiss after 5 seconds.
   */
  const push = useCallback((msg, type = "info", onUndo = null) => {
    const id = ++_tid;
    setToasts(t => [...t, { id, msg, type, onUndo }]);
    // Auto-dismiss after 5s (matches undo window in useTasks)
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000);
  }, []);

  // Remove a toast by id (called when Undo button is clicked)
  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  return { toasts, push, dismiss };
}

// ── Theme helpers ──────────────────────────────────────────────────────────────
/**
 * applyTheme(theme)
 * Sets data-theme attribute on <html> element.
 * "system" resolves to dark or light based on OS preference.
 */
function applyTheme(theme) {
  const resolved = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;
  document.documentElement.setAttribute("data-theme", resolved);
}

// ── Date grouping ──────────────────────────────────────────────────────────────
/**
 * groupByDate(tasks, view, searchTerm)
 * Filters and groups tasks into date-labeled sections.
 * Returns: [{ label: { text, type }, tasks: [] }, ...]
 */
function groupByDate(tasks, view, searchTerm) {
  const today = new Date().toISOString().slice(0, 10);

  const filtered = tasks
    .filter(t => {
      if (view === "today")     return t.due_date === today;
      if (view === "upcoming")  return t.due_date && t.due_date > today && !t.done;
      if (view === "completed") return t.done;
      return true; // "tasks" = show all
    })
    .filter(t => !searchTerm || t.text.toLowerCase().includes(searchTerm.toLowerCase()));

  // Completed view: no grouping needed
  if (view === "completed") return [{ label: null, tasks: filtered }];

  // Group by due_date
  const groups = {};
  const noDate = [];

  filtered.forEach(t => {
    if (!t.due_date) { noDate.push(t); return; }
    if (!groups[t.due_date]) groups[t.due_date] = [];
    groups[t.due_date].push(t);
  });

  // Build sorted result with human-readable labels
  const result = Object.keys(groups).sort().map(date => {
    const d    = new Date(date + "T00:00:00");
    const dT   = new Date(today + "T00:00:00");
    const diff = Math.round((d - dT) / (1000 * 60 * 60 * 24));
    let label;
    if (diff < 0)       label = { text: date,       type: "overdue"  };
    else if (diff === 0) label = { text: "today",    type: "today"    };
    else if (diff === 1) label = { text: "tomorrow", type: "normal"   };
    else                 label = { text: date,       type: "normal"   };
    return { label, tasks: groups[date] };
  });

  if (noDate.length) result.push({ label: { text: "no date", type: "normal" }, tasks: noDate });
  return result;
}

const PRI = { high: 0, medium: 1, low: 2 };

// ── Root component ─────────────────────────────────────────────────────────────
export default function App() {
  const { toasts, push: toast, dismiss } = useToasts();

  // Task CRUD — now includes undoDelete
  const {
    tasks, loading,
    addTask, toggleDone, updateTask,
    deleteTask, undoDelete,
    deleteDone, addMany,
  } = useTasks(toast);

  // View / UI state
  const [view,       setView]      = useState("tasks");
  const [search,     setSearch]    = useState("");
  const [sortBy,     setSortBy]    = useState("date");
  const [aiOpen,     setAiOpen]    = useState(false);
  const [showCapture,setCapture]   = useState(false);
  const [tab,        setTab]       = useState("tasks"); // "tasks" | "settings"

  // Language + translations
  const { lang, setLang, t } = useLang("en");

  // ── Load theme + language from settings on startup ─────────────────────────
  useEffect(() => {
    api.getSettings()
      .then(s => {
        applyTheme(s.theme || "dark");
        if (s.language) setLang(s.language);
      })
      .catch(() => applyTheme("dark"));

    // Re-apply theme when OS dark-mode preference changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      api.getSettings().then(s => { if (s.theme === "system") applyTheme("system"); });
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── SSE: receive reminder notifications from backend ──────────────────────
  useEffect(() => {
    const es = new EventSource("http://localhost:5000/api/notifications/stream");
    es.onmessage = (e) => {
      try {
        const p = JSON.parse(e.data);
        toast(`${p.title}: ${p.body}`, "info");
      } catch {}
    };
    return () => es.close();
  }, []);

  // ── Computed values ────────────────────────────────────────────────────────
  const today     = new Date().toISOString().slice(0, 10);
  const doneCount = tasks.filter(t => t.done).length;
  const total     = tasks.length;
  const progress  = total ? Math.round((doneCount / total) * 100) : 0;

  const counts = {
    tasks:     tasks.length,
    today:     tasks.filter(t => t.due_date === today).length,
    upcoming:  tasks.filter(t => t.due_date && t.due_date > today && !t.done).length,
    completed: doneCount,
  };

  // Sort tasks then group by date
  let display = [...tasks];
  if (sortBy === "priority") display.sort((a, b) => PRI[a.priority] - PRI[b.priority]);
  else if (sortBy === "alpha") display.sort((a, b) => a.text.localeCompare(b.text));
  const groups = view !== "calendar" ? groupByDate(display, view, search) : [];

  // ── Delete with undo toast ─────────────────────────────────────────────────
  /**
   * handleDelete(id)
   * Deletes a task and shows a toast with an Undo button.
   * If user clicks Undo within 5 seconds, the task is restored.
   */
  async function handleDelete(id) {
    const deleted = await deleteTask(id);
    if (!deleted) return;

    // Show undo toast — passing onUndo callback
    const toastId = ++_tid;
    toast(
      lang === "tr" ? "Görev silindi" : "Task deleted",
      "info",
      // This function is called when user clicks "Undo"
      async () => {
        await undoDelete(deleted.id);
        dismiss(toastId);
      }
    );
  }

  // ── AI Capture confirm ─────────────────────────────────────────────────────
  async function handleCapture(items) {
    const n = await addMany(items);
    setCapture(false);
    toast(`${n} ${t("tasksAdded")}`, "success");
  }

  // ── Theme / language change handlers ──────────────────────────────────────
  function handleThemeChange(theme) { applyTheme(theme); }

  function handleLangChange(l) {
    setLang(l);
    api.saveSettings({ language: l }).catch(() => {});
  }

  // ── Sidebar items ──────────────────────────────────────────────────────────
  const SIDEBAR = [
    { id: "tasks",     icon: "☰",  label: t("tasks"),    count: counts.tasks     },
    { id: "today",     icon: "📅", label: t("today"),    count: counts.today     },
    { id: "upcoming",  icon: "🗓", label: t("upcoming"), count: counts.upcoming  },
    { id: "calendar",  icon: "📆", label: t("calendar"), count: 0                },
    { id: "completed", icon: "✓",  label: t("completed"),count: counts.completed },
  ];

  return (
    <div className="app">

      {/* ── Title bar ────────────────────────────────────────────────────────
           No traffic-light dots. Shows DONEFY logo + name + lang switcher.
           -webkit-app-region:drag makes it draggable as a native window bar. */}
      <div className="titlebar">
        {/* Logo — served from frontend/public/logo.png via /logo.png */}
        <img src="/logo.png" className="tb-logo" alt="DONEFY logo" />
        <div>
          <div className="tb-name">DONEFY</div>
          <div className="tb-sub">{t("appSub")}</div>
        </div>
        <div className="tb-spacer" />

        {/* Language toggle: EN / TR */}
        <div className="tb-lang">
          <button className={`lang-btn ${lang === "en" ? "active" : ""}`}
            onClick={() => handleLangChange("en")}>EN</button>
          <button className={`lang-btn ${lang === "tr" ? "active" : ""}`}
            onClick={() => handleLangChange("tr")}>TR</button>
        </div>
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────────────────
           Navigation links for views + AI tools + Settings. */}
      <div className="sidebar">
        <div className="sb-section">
          <div className="sb-label">{t("tasks")}</div>
          {SIDEBAR.map(item => (
            <button key={item.id}
              className={`sb-item ${view === item.id && tab === "tasks" ? "active" : ""}`}
              onClick={() => { setView(item.id); setTab("tasks"); setCapture(false); }}>
              <span>{item.icon}</span>
              {item.label}
              {item.count > 0 && <span className="badge">{item.count}</span>}
            </button>
          ))}
        </div>

        <div className="separator" />

        <div className="sb-section">
          <div className="sb-label">AI</div>
          {/* AI Capture: voice/text → structured task list */}
          <button className={`sb-item ${showCapture && tab === "tasks" ? "active" : ""}`}
            onClick={() => { setCapture(x => !x); setTab("tasks"); }}>
            <span>🎤</span>{t("aiCapture")}
          </button>
          {/* AI Chat assistant panel */}
          <button className={`sb-item ${aiOpen ? "active" : ""}`}
            onClick={() => setAiOpen(x => !x)}>
            <span>✦</span>{t("aiAssistant")}
          </button>
        </div>

        <div className="sb-bottom">
          <div className="separator" />
          <button className={`sb-item ${tab === "settings" ? "active" : ""}`}
            onClick={() => { setTab("settings"); setCapture(false); }}>
            <span>⚙</span>{t("settings")}
          </button>
        </div>
      </div>

      {/* ── Main content area ────────────────────────────────────────────────── */}
      <div className="main" style={{ position: "relative" }}>

        {/* Settings tab */}
        {tab === "settings" ? (
          <>
            <div className="toolbar">
              <span className="toolbar-title">⚙ {t("settings")}</span>
            </div>
            <SettingsPanel onToast={toast} onThemeChange={handleThemeChange}
              lang={lang} t={t} />
          </>
        ) : (
          <>
            {/* Toolbar: title + search + sort + delete-completed */}
            <div className="toolbar">
              <span className="toolbar-title">
                {SIDEBAR.find(s => s.id === view)?.icon}{" "}
                {SIDEBAR.find(s => s.id === view)?.label}
              </span>

              {view !== "calendar" && (
                <div className="search-wrap">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input className="search-input" placeholder={t("search")}
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              )}

              {view !== "calendar" && (
                <select className="select" value={sortBy}
                  onChange={e => setSortBy(e.target.value)}>
                  <option value="date">{t("sortDate")}</option>
                  <option value="priority">{t("sortPriority")}</option>
                  <option value="alpha">{t("sortAlpha")}</option>
                </select>
              )}

              {doneCount > 0 && view !== "calendar" && (
                <button className="btn btn-danger" onClick={async () => {
                  const n = await deleteDone();
                  toast(`${n} ${t("tasksAdded")}`, "info");
                }}>
                  {t("deleteCompleted")} ({doneCount})
                </button>
              )}
            </div>

            {/* Progress bar: shows completion percentage */}
            {view !== "calendar" && (
              <div className="progress-wrap">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="progress-label">{doneCount}/{total} {t("progress")}</div>
              </div>
            )}

            {/* AI Capture panel — toggled from sidebar */}
            {showCapture && view !== "calendar" && (
              <AICapture onConfirm={handleCapture} onClose={() => setCapture(false)}
                onToast={toast} lang={lang} t={t} />
            )}

            {/* Calendar view or task list view */}
            {view === "calendar" ? (
              <CalendarView tasks={tasks} t={t} />
            ) : (
              <>
                {/* Add task form (always visible) */}
                <AddTask onAdd={addTask} onToast={toast} lang={lang} t={t} />

                {loading ? (
                  <div className="task-list">
                    <p style={{ color: "var(--muted)", textAlign: "center", marginTop: 40 }}>
                      Loading…
                    </p>
                  </div>
                ) : groups.every(g => g.tasks.length === 0) ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    <p>{t("noTasks")}</p>
                  </div>
                ) : (
                  <div className="task-list">
                    {/* Render date-grouped task sections */}
                    {groups.map((group, gi) => (
                      <div key={gi}>
                        {/* Date section header */}
                        {group.label && (
                          <div className={`date-group-header ${
                            group.label.type === "today"   ? "today-header"   :
                            group.label.type === "overdue" ? "overdue-header" : ""
                          }`}>
                            {group.label.type === "overdue" ? "⚠ " : ""}
                            {group.label.text === "today"    ? `📅 ${t("today")}` :
                             group.label.text === "tomorrow" ? `📅 Tomorrow`      :
                             group.label.text === "no date"  ? `— ${t("tasks")}`  :
                             `📅 ${group.label.text}`}
                          </div>
                        )}
                        {/* Task cards — pass handleDelete (not deleteTask) for undo support */}
                        {group.tasks.map(task => (
                          <TaskCard key={task.id} task={task}
                            onToggle={toggleDone}
                            onDelete={handleDelete}
                            onUpdate={updateTask}
                            onToast={toast}
                            lang={lang} />
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Sliding AI assistant panel */}
        <AIPanel open={aiOpen} onClose={() => setAiOpen(false)}
          onAddMany={addMany} onToast={toast} lang={lang} t={t} />
      </div>

      {/* ── Toast notifications ──────────────────────────────────────────────────
           Rendered at bottom-right. If toast has onUndo, shows an Undo button. */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span className="toast-msg">{toast.msg}</span>
            {/* Show Undo button only for delete toasts */}
            {toast.onUndo && (
              <button className="toast-undo" onClick={toast.onUndo}>
                {lang === "tr" ? "Geri Al" : "Undo"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
