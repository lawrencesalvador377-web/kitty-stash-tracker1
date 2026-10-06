import React, { useState, useEffect } from "react";
import { doc, collection, onSnapshot, setDoc, deleteDoc, updateDoc, increment } from "firebase/firestore";

const fmt = (v) => "₱" + Number(v || 0).toLocaleString("en-PH");
const ymd = (d) => d.toLocaleDateString("en-CA");
const useList = (db, stashId, name) => {
  const [list, setList] = useState([]);
  useEffect(
    () => onSnapshot(collection(db, "stashes", stashId, name), (s) => setList(s.docs.map((d) => ({ id: d.id, ...d.data() })))),
    [db, stashId, name]
  );
  return list;
};

function Growth({ savings }) {
  const pts = [...savings].sort((a, b) => a.timestamp - b.timestamp);
  let run = 0;
  const data = pts.map((s) => ({ t: s.timestamp, v: (run += s.amount || 0) }));
  if (data.length < 2)
    return (
      <div className="card">
        <h2 style={{ margin: 0 }}>Growth</h2>
        <p className="sub">Add two or more savings to see your line.</p>
      </div>
    );
  const W = 560, H = 180, P = 8;
  const t0 = data[0].t, t1 = data[data.length - 1].t;
  const max = data[data.length - 1].v || 1;
  const x = (t) => P + ((t - t0) / (t1 - t0 || 1)) * (W - 2 * P);
  const y = (v) => H - P - (v / max) * (H - 2 * P);
  const d = data.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  return (
    <div className="card">
      <h2 style={{ margin: 0 }}>Growth</h2>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", marginTop: 10 }} role="img" aria-label="Savings over time">
        <path d={d} fill="none" stroke="var(--accent,#ff8a3d)" strokeWidth="3" strokeLinejoin="round" />
        {data.map((p, i) => (
          <circle key={i} cx={x(p.t)} cy={y(p.v)} r="4" fill="var(--accent,#ff8a3d)"><title>{fmt(p.v)}</title></circle>
        ))}
      </svg>
      <p className="sub">Biggest single deposit: {fmt(Math.max(...savings.map((s) => s.amount || 0)))}</p>
    </div>
  );
}

function Buckets({ db, stashId }) {
  const list = useList(db, stashId, "buckets");
  const [f, setF] = useState({ name: "", target: "" });
  const [amt, setAmt] = useState({});
  const ref = (id) => doc(db, "stashes", stashId, "buckets", id);
  const add = async () => {
    if (!f.name || !f.target) return;
    await setDoc(doc(collection(db, "stashes", stashId, "buckets")), { name: f.name, target: parseFloat(f.target), saved: 0 });
    setF({ name: "", target: "" });
  };
  const put = async (b) => {
    const v = parseFloat(amt[b.id]);
    if (v > 0) await updateDoc(ref(b.id), { saved: increment(v) });
    setAmt({ ...amt, [b.id]: "" });
  };
  return (
    <div className="card">
      <h2 style={{ margin: 0 }}>Wishlist buckets</h2>
      <p className="sub">Set money aside for something specific. This doesn't change your total.</p>
      <input className="input" placeholder="What for? (coffee gear, movie tickets...)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className="input" type="number" min="1" placeholder="Target (PHP)" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} />
      <button className="btn" style={{ marginTop: 12 }} onClick={add}>Add bucket</button>
      {list.map((b) => (
        <div className="item" key={b.id} style={{ display: "block" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{b.name}</strong>
            <span>{fmt(b.saved)} / {fmt(b.target)}</span>
          </div>
          <div className="bar"><div style={{ width: `${Math.min((b.saved / b.target) * 100, 100)}%` }} /></div>
          <div className="row">
            <input className="input" style={{ margin: 0 }} type="number" min="0" placeholder="Amount" value={amt[b.id] || ""} onChange={(e) => setAmt({ ...amt, [b.id]: e.target.value })} />
            <button className="btn alt" onClick={() => put(b)}>Add</button>
            <button className="btn ghost" onClick={() => deleteDoc(ref(b.id))} aria-label="Delete bucket">x</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Vaults({ db, stashId, user }) {
  const list = useList(db, stashId, "vaults");
  const [f, setF] = useState({ amount: "", date: "", letter: "" });
  const today = ymd(new Date());
  const ref = (id) => doc(db, "stashes", stashId, "vaults", id);
  const seal = async () => {
    if (!f.amount || !f.date || f.date <= today) return;
    await setDoc(doc(collection(db, "stashes", stashId, "vaults")), {
      amount: parseFloat(f.amount), unlock: f.date, letter: f.letter, from: user.email, opened: false,
    });
    setF({ amount: "", date: "", letter: "" });
  };
  const open = async (v) => {
    await setDoc(doc(collection(db, "stashes", stashId, "savings")), {
      amount: v.amount, note: "Unlocked vault", imageUrl: null, timestamp: Date.now(), addedBy: v.from,
    });
    await updateDoc(ref(v.id), { opened: true });
  };
  return (
    <div className="card">
      <h2 style={{ margin: 0 }}>Time-locked vaults</h2>
      <p className="sub">Seal a deposit and a letter. They stay hidden on screen until the date.</p>
      <input className="input" type="number" min="1" placeholder="Amount (PHP)" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
      <input className="input" type="date" min={today} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
      <textarea className="input" rows="3" placeholder="Letter or recommendation (optional)" value={f.letter} onChange={(e) => setF({ ...f, letter: e.target.value })} />
      <button className="btn" style={{ marginTop: 12 }} onClick={seal}>Seal it</button>
      {list.map((v) => (
        <div className="item" key={v.id} style={{ display: "block" }}>
          {v.unlock > today ? (
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span>Sealed envelope from {v.from.split("@")[0]}. Opens {v.unlock}.</span>
              <button className="btn ghost" onClick={() => deleteDoc(ref(v.id))}>Cancel</button>
            </div>
          ) : v.opened ? (
            <span className="sub">Opened: {fmt(v.amount)} from {v.from.split("@")[0]}</span>
          ) : (
            <>
              <strong>{fmt(v.amount)} unlocked!</strong>
              {v.letter && <p style={{ whiteSpace: "pre-wrap" }}>{v.letter}</p>}
              <button className="btn alt" onClick={() => open(v)}>Add to the stash</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Ambience({ db, stashId }) {
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState("");
  useEffect(() => onSnapshot(doc(db, "stashes", stashId), (s) => setSaved((s.data() || {}).playlist || "")), [db, stashId]);
  const embed = (u) => {
    let m = u.match(/open\.spotify\.com\/(playlist|album|track)\/([A-Za-z0-9]+)/);
    if (m) return `https://open.spotify.com/embed/${m[1]}/${m[2]}`;
    m = u.match(/[?&]list=([\w-]+)/);
    return m ? `https://www.youtube.com/embed/videoseries?list=${m[1]}` : "";
  };
  const src = embed(saved);
  return (
    <div className="card">
      <h2 style={{ margin: 0 }}>Our playlist</h2>
      <p className="sub">Paste a Spotify or YouTube playlist link. Press play once, since browsers block autoplay.</p>
      <input className="input" placeholder="Playlist link" value={url} onChange={(e) => setUrl(e.target.value)} />
      <button className="btn alt" style={{ marginTop: 12 }} onClick={() => updateDoc(doc(db, "stashes", stashId), { playlist: url })}>Save</button>
      {src && (
        <iframe title="Playlist" src={src} width="100%" height={src.includes("spotify") ? 152 : 220}
          allow="encrypted-media" style={{ border: 0, borderRadius: 12, marginTop: 12 }} />
      )}
    </div>
  );
}

export default function Quests({ db, stashId, user, savings }) {
  return (
    <>
      <Growth savings={savings} />
      <Buckets db={db} stashId={stashId} />
      <Vaults db={db} stashId={stashId} user={user} />
      <Ambience db={db} stashId={stashId} />
    </>
  );
}
