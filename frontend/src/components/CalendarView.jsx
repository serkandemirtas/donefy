import { useState } from "react";

export default function CalendarView({ tasks, t }) {
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const today  = now.toISOString().slice(0,10);
  const months = t("months");
  const wdays  = t("weekdays");

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month+1, 0);
  let startDow   = (firstDay.getDay()+6)%7;
  const cells    = [];
  for (let i=0; i<startDow; i++)
    cells.push({ date:new Date(year,month,1-startDow+i), current:false });
  for (let d=1; d<=lastDay.getDate(); d++)
    cells.push({ date:new Date(year,month,d), current:true });
  while (cells.length%7!==0)
    cells.push({ date:new Date(year,month+1,cells.length-lastDay.getDate()-startDow+1), current:false });

  const byDate = {};
  tasks.forEach(t => { if (t.due_date) { (byDate[t.due_date]||(byDate[t.due_date]=[])).push(t); } });

  function fmt(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function prev() { if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); }
  function next() { if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); }

  const thisMonthKey = `${year}-${String(month+1).padStart(2,"0")}`;
  const thisMonthCount = Object.keys(byDate).filter(d=>d.startsWith(thisMonthKey)).length;

  return (
    <div className="calendar-wrap">
      <div className="cal-header">
        <button className="btn-icon" onClick={prev}>‹</button>
        <span className="cal-title">{months[month]} {year}</span>
        <button className="btn-icon" onClick={next}>›</button>
      </div>

      <div className="cal-grid">
        {wdays.map(d => <div key={d} className="cal-day-label">{d}</div>)}
        {cells.map((cell,i) => {
          const key   = fmt(cell.date);
          const dtasks= byDate[key]||[];
          const prev3 = dtasks.slice(0,3);
          const extra = dtasks.length-prev3.length;
          return (
            <div key={i} className={["cal-cell",
              !cell.current?"other-month":"",
              key===today?"today":"",
              dtasks.length?"has-tasks":""].filter(Boolean).join(" ")}>
              <div className="cal-date">{cell.date.getDate()}</div>
              {prev3.map(t=>(
                <div key={t.id} className={`cal-task-dot priority-${t.priority}`} title={t.text}>
                  {t.done?"✓ ":""}{t.text}
                </div>
              ))}
              {extra>0 && <div className="cal-more">+{extra}</div>}
            </div>
          );
        })}
      </div>

      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--muted)",padding:"8px 0" }}>
        <span>📅 {thisMonthCount} {t("tasksThisMonth")}</span>
        <span>✓ {tasks.filter(t=>t.done).length}/{tasks.length}</span>
      </div>
    </div>
  );
}
