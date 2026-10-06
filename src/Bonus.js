import React, { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

const fmt = (v) => "₱" + Math.round(v || 0).toLocaleString("en-PH");
const ITEMS = ["floor rug", "desk", "computer", "coffee station", "cat", "lamp", "plant", "window", "poster"];

function Safehouse({ total }) {
  const n = Math.min(Math.floor(total / 5000), ITEMS.length);
  const next = ITEMS[n];
  return (
    <div className="card">
      <h2 style={{ margin: 0 }}>Our safehouse</h2>
      <svg viewBox="0 0 300 160" style={{ width: "100%", borderRadius: 12, marginTop: 10 }} role="img" aria-label={`Room with ${n} items`}>
        <rect width="300" height="110" fill="#cfc3e4" />
        <rect y="110" width="300" height="50" fill="#8a6a4f" />
        {n >= 1 && <ellipse cx="150" cy="138" rx="60" ry="12" fill="#c0392b" />}
        {n >= 2 && (<g fill="#5b4636"><rect x="200" y="85" width="80" height="8" /><rect x="205" y="93" width="6" height="40" /><rect x="269" y="93" width="6" height="40" /></g>)}
        {n >= 3 && (<g><rect x="225" y="55" width="30" height="24" rx="2" fill="#222" /><rect x="228" y="58" width="24" height="18" fill="#6ecbff" /><rect x="238" y="79" width="4" height="6" fill="#222" /></g>)}
        {n >= 4 && (<g><rect x="15" y="100" width="45" height="5" fill="#5b4636" /><rect x="22" y="78" width="16" height="22" fill="#444" /><rect x="42" y="90" width="8" height="10" fill="#fff" /></g>)}
        {n >= 5 && (<g fill="#ff8a3d"><ellipse cx="150" cy="128" rx="16" ry="10" /><circle cx="168" cy="122" r="8" /><polygon points="162,116 164,107 168,115" /><polygon points="170,115 174,107 176,116" /><path d="M134 130 q-14 -4 -10 -16" stroke="#ff8a3d" strokeWidth="4" fill="none" /></g>)}
        {n >= 6 && (<g><rect x="180" y="70" width="3" height="40" fill="#333" /><polygon points="172,70 191,70 184,56 179,56" fill="#ffe29a" /></g>)}
        {n >= 7 && (<g><rect x="95" y="98" width="14" height="12" fill="#a0522d" /><circle cx="102" cy="90" r="9" fill="#4caf7d" /></g>)}
        {n >= 8 && (<g><rect x="100" y="20" width="60" height="50" fill="#1b2a4a" stroke="#fff" strokeWidth="3" /><circle cx="115" cy="35" r="2" fill="#fff" /><circle cx="140" cy="48" r="2" fill="#fff" /></g>)}
        {n >= 9 && <rect x="30" y="25" width="30" height="40" fill="#ffb8c6" />}
      </svg>
      <p className="sub">{next ? `Next up: ${next} at ${fmt((n + 1) * 5000)}` : "Fully furnished!"}</p>
    </div>
  );
}

function Buffer({ db, stashId, total }) {
  const [buf, setBuf] = useState(1000);
  const [input, setInput] = useState("1000");
  useEffect(
    () =>
      onSnapshot(doc(db, "stashes", stashId), (d) => {
        const b = (d.data() || {}).buffer;
        if (b) { setBuf(b); setInput(String(b)); }
      }),
    [db, stashId]
  );
  const filled = Math.min(total, buf);
  return (
    <div className="card">
      <h2 style={{ margin: 0 }}>Emergency buffer</h2>
      <p className="sub">{fmt(filled)} of {fmt(buf)} is kept for emergencies. {fmt(Math.max(total - buf, 0))} counts toward the goal.</p>
      <div className="bar"><div style={{ width: `${(filled / buf) * 100}%` }} /></div>
      <div className="row">
        <input className="input" style={{ margin: 0 }} type="number" min="1" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn alt" onClick={() => updateDoc(doc(db, "stashes", stashId), { buffer: parseFloat(input) || 1000 })}>Set buffer</button>
      </div>
    </div>
  );
}

function Export({ savings }) {
  const download = () => {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Date", "Who", "Amount", "Note"],
      ...[...savings].sort((a, b) => a.timestamp - b.timestamp).map((s) => [
        new Date(s.timestamp).toLocaleDateString("en-CA"), s.addedBy, s.amount, s.note,
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.map(q).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kitty-stash.csv";
    a.click();
  };
  return (
    <div className="card">
      <h2 style={{ margin: 0 }}>Export</h2>
      <p className="sub">Download every saving as a spreadsheet file that opens in Excel or Google Sheets.</p>
      <button className="btn alt" onClick={download}>Download CSV</button>
    </div>
  );
}

export default function Bonus({ db, stashId, savings }) {
  const total = savings.reduce((t, s) => t + (s.amount || 0), 0);
  return (
    <>
      <Safehouse total={total} />
      <Buffer db={db} stashId={stashId} total={total} />
      <Export savings={savings} />
    </>
  );
}
