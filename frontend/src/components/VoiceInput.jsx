import { useState, useRef, useEffect } from "react";

const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

export default function VoiceInput({ onResult, onError, lang = "en" }) {
  const [listening, setListening] = useState(false);
  const [interim,   setInterim]   = useState("");
  const ref = useRef(null);

  useEffect(() => () => ref.current?.stop(), []);

  function toggle() {
    if (!SR) { onError?.("Speech recognition not supported. Use Chrome or Edge."); return; }
    if (listening) { ref.current?.stop(); return; }

    const r = new SR();
    ref.current = r;
    r.lang            = lang === "tr" ? "tr-TR" : "en-US";
    r.continuous      = true;
    r.interimResults  = true;
    r.onstart  = () => { setListening(true); setInterim(""); };
    r.onend    = () => { setListening(false); setInterim(""); };
    r.onerror  = (e) => {
      setListening(false);
      const m = { "not-allowed":"Mic permission denied.","no-speech":"No speech detected." };
      onError?.(m[e.error] || `Error: ${e.error}`);
    };
    r.onresult = (e) => {
      let fin = "", part = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin  += e.results[i][0].transcript;
        else                       part += e.results[i][0].transcript;
      }
      setInterim(part);
      if (fin) onResult?.(fin.trim());
    };
    r.start();
  }

  if (!SR) return <button className="btn-icon" disabled title="Not supported">🎤</button>;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <button className={`btn-icon ${listening ? "recording" : ""}`} onClick={toggle}
        title={listening ? "Stop recording" : "Speak"}>
        {listening ? "⏹" : "🎤"}
      </button>
      {interim && (
        <span style={{ fontSize:12, color:"var(--muted)", fontStyle:"italic",
                       maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {interim}
        </span>
      )}
    </div>
  );
}
