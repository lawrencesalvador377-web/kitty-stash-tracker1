import React, { useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

const grit = `
@import url('https://fonts.googleapis.com/css2?family=Special+Elite&display=swap');
.ks{background:#0b0b09 !important;color:#cfcfc2;font-family:'Special Elite','Courier New',monospace}
.ks::after{content:"";position:fixed;inset:0;pointer-events:none;box-shadow:inset 0 0 140px rgba(0,0,0,.85)}
.card{background:#151510;border:1px solid #3a3a30;border-radius:2px;box-shadow:none}
.title,.ks h1,.ks h2{text-transform:uppercase;letter-spacing:.06em}
.sub{color:#8d8d7d}
.input{background:#0f0f0c;color:#cfcfc2;border:1px solid #444;border-radius:2px}
.btn{background:#8f1d14;color:#f1e9d8;border:1px solid #c0392b;border-radius:2px;box-shadow:none}
.btn.alt{background:#2a3a1f;color:#b7d68a;border-color:#4d6b2f}
.btn.ghost{background:transparent;color:#cfcfc2;border-color:#555}
.track{background:#1d1d17;border-color:#444}
.fill{background:#c0392b}
.ks a{color:#c0392b}
.ks div[style*="aspect-ratio"]{border-color:#2f2f27 !important}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}
.stat{background:#1d1d17;border:1px solid #33332a;padding:12px}
.stat b{display:block;font-size:20px}
.stat span{font-size:12px;color:#8d8d7d}
.bar{background:#1d1d17;border:1px solid #33332a;margin:4px 0 14px}
`;

const fmt = (v) => "₱" + Math.round(v || 0).toLocaleString("en-PH");

export default function Survival({ db, stashId, savings }) {
  const [s, setS] = useState({});
  const [target, setTarget] = useState("5000");
  useEffect(
    () =>
      onSnapshot(doc(db, "stashes", stashId), (d) => {
        const v = (d.data() || {}).survival || {};
        setS(v);
        setTarget(String(v.target || 5000));
      }),
    [db, stashId]
  );
  const save = (patch) => updateDoc(doc(db, "stashes", stashId), { survival: { ...s, ...patch } });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const left = days - now.getDate() + 1;
  const goal = s.target || 5000;
  const got = savings.filter((x) => x.timestamp >= monthStart).reduce((t, x) => t + (x.amount || 0), 0);
  const hp = Math.min(Math.round((got / goal) * 100), 100);
  const need = Math.max(goal - got, 0) / left;
  const state = hp >= 100 ? "Thriving" : hp >= 60 ? "Stable" : hp >= 25 ? "Wounded" : "Critical";
  const color = hp >= 60 ? "#5d9b3a" : hp >= 25 ? "#d68910" : "#c0392b";

  return (
    <>
      {s.on && <style>{grit}</style>}
      <div className="card">
        <h2 style={{ margin: 0 }}>Survival mode</h2>
        <p className="sub">A hardcore month: hit your target before the month runs out. Shared by both of you.</p>
        <button className="btn" onClick={() => save({ on: !s.on })}>{s.on ? "Hardcore: ON" : "Hardcore: OFF"}</button>
        {s.on && (
          <>
            <div className="stats">
              <div className="stat"><b>{left}</b><span>days left</span></div>
              <div className="stat"><b>{fmt(need)}</b><span>needed per day</span></div>
              <div className="stat"><b>{state}</b><span>condition</span></div>
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Health</span>
              <strong>{hp}%</strong>
            </div>
            <div className="bar" style={{ height: 14 }}>
              <div style={{ width: `${hp}%`, height: "100%", background: color }} />
            </div>
            <div className="row">
              <input className="input" style={{ margin: 0 }} type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} />
              <button className="btn alt" onClick={() => save({ target: parseFloat(target) || 5000 })}>Set target</button>
            </div>
            <p className="sub">Target {fmt(goal)}. Saved this month: {fmt(got)}.</p>
          </>
        )}
      </div>
    </>
  );
}
