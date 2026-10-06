import React from "react";

export default function Insights({ savings, goal }) {
  const total = savings.reduce((t, s) => t + (s.amount || 0), 0);
  const by = {};
  savings.forEach((s) => {
    const name = (s.addedBy || "?").split("@")[0];
    by[name] = (by[name] || 0) + (s.amount || 0);
  });
  const people = Object.entries(by).sort((a, b) => b[1] - a[1]);
  const first = savings.length ? Math.min(...savings.map((s) => s.timestamp)) : Date.now();
  const weeks = Math.max((Date.now() - first) / 6048e5, 1);
  const pace = total / weeks;
  const left = Math.max(goal - total, 0);
  const eta = pace > 0 && left > 0 ? Math.ceil(left / pace) : null;
  const pct = goal ? (total / goal) * 100 : 0;
  const fmt = (v) => "₱" + Math.round(v).toLocaleString("en-PH");

  return (
    <div className="card">
      <h2 style={{ margin: 0 }}>The numbers</h2>
      <div className="stats">
        <div className="stat"><b>{fmt(pace)}</b><span>per week</span></div>
        <div className="stat"><b>{eta ? eta + " wk" : left === 0 ? "Done" : "-"}</b><span>to goal at this pace</span></div>
        <div className="stat"><b>{savings.length}</b><span>deposits</span></div>
      </div>
      {people.map(([name, v]) => (
        <div key={name}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span>{name}</span>
            <strong>{fmt(v)}</strong>
          </div>
          <div className="bar"><div style={{ width: `${total ? (v / total) * 100 : 0}%` }} /></div>
        </div>
      ))}
      <div style={{ marginTop: 6 }}>
        {[25, 50, 75, 100].map((p) => (
          <span key={p} className={"badge" + (pct >= p ? " on" : "")}>{p}%</span>
        ))}
      </div>
    </div>
  );
}
