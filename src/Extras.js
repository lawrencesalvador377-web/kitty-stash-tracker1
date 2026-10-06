import React, { useState, useEffect, useRef } from "react";
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { Calendar, Mail, Landmark, Trash2 } from "lucide-react";

// Fill these in from emailjs.com to turn emails on. Leave blank and emails are skipped.
const EMAILJS = {
  service: "service_m4s2v9h",
  template: "template_0poudt2",
  key: "2Okhunx5Pk61ccrUC",
};

const sendEmail = async (to, subject, message) => {
  if (!EMAILJS.service || !to) return false;
  try {
    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS.service,
        template_id: EMAILJS.template,
        user_id: EMAILJS.key,
        template_params: { to_email: to, subject, message },
      }),
    });
    return r.ok;
  } catch (e) {
    return false;
  }
};

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const parse = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const occursOn = (s, day) => {
  const start = parse(s.start);
  if (day < start) return false;
  const diff = Math.round((day - start) / 86400000);
  if (s.freq === "once") return diff === 0;
  if (s.freq === "weekly") return diff % 7 === 0;
  if (s.freq === "biweekly") return diff % 14 === 0;
  return day.getDate() === start.getDate();
};
const gcal = (s) => {
  const a = parse(s.start);
  const b = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1);
  const f = (d) => ymd(d).replace(/-/g, "");
  const rule = {
    weekly: "FREQ=WEEKLY",
    biweekly: "FREQ=WEEKLY;INTERVAL=2",
    monthly: "FREQ=MONTHLY",
  }[s.freq];
  return (
    "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" +
    encodeURIComponent(`Save ₱${s.amount} - Kitty Stash`) +
    "&details=" +
    encodeURIComponent(s.note || "Time to add to the stash!") +
    `&dates=${f(a)}/${f(b)}` +
    (rule ? "&recur=" + encodeURIComponent("RRULE:" + rule) : "")
  );
};

export default function Extras({ db, stashId, user, savings }) {
  const [stash, setStash] = useState({});
  const [schedules, setSchedules] = useState([]);
  const [month, setMonth] = useState(new Date());
  const [form, setForm] = useState({
    amount: "",
    note: "",
    start: ymd(new Date()),
    freq: "monthly",
  });
  const [bank, setBank] = useState({ name: "", last4: "" });
  const [emailTo, setEmailTo] = useState("");
  const [msg, setMsg] = useState("");
  const seen = useRef(new Set());

  useEffect(() => {
    const u1 = onSnapshot(doc(db, "stashes", stashId), (s) => {
      const d = s.data() || {};
      setStash(d);
      setBank({ name: d.accountName || "", last4: d.accountLast4 || "" });
      setEmailTo(d.notifyEmail || "");
    });
    const u2 = onSnapshot(
      collection(db, "stashes", stashId, "schedules"),
      (s) => setSchedules(s.docs.map((x) => ({ id: x.id, ...x.data() })))
    );
    return () => {
      u1();
      u2();
    };
  }, [db, stashId]);

  // Email the notify address when I add a saving
  const total = savings.reduce((t, s) => t + (s.amount || 0), 0);
  useEffect(() => {
    savings.forEach((s) => {
      if (seen.current.has(s.id)) return;
      seen.current.add(s.id);
      if (
        s.addedBy === user.email &&
        Date.now() - s.timestamp < 15000 &&
        stash.notifyEmail
      ) {
        sendEmail(
          stash.notifyEmail,
          "New saving added to your Kitty Stash",
          `${s.addedBy} saved ₱${s.amount}${
            s.note ? " for " + s.note : ""
          }. Total so far: ₱${total}.`
        );
      }
    });
  }, [savings, stash.notifyEmail, user.email, total]);

  const saveBank = () =>
    updateDoc(doc(db, "stashes", stashId), {
      accountName: bank.name,
      accountLast4: bank.last4.replace(/\D/g, "").slice(0, 4),
    });
  const saveEmail = () =>
    updateDoc(doc(db, "stashes", stashId), { notifyEmail: emailTo });
  const testEmail = async () => {
    const ok = await sendEmail(
      emailTo,
      "Kitty Stash test",
      "Email is working!"
    );
    setMsg(
      ok
        ? "Test email sent."
        : "Could not send. Check the EMAILJS keys in Extras.js."
    );
  };
  const addSchedule = async () => {
    if (!form.amount || !form.start) return;
    await setDoc(doc(collection(db, "stashes", stashId, "schedules")), {
      ...form,
      amount: parseFloat(form.amount),
      createdBy: user.email,
    });
    setForm({ ...form, amount: "", note: "" });
  };

  const y = month.getFullYear();
  const m = month.getMonth();
  const lead = new Date(y, m, 1).getDay();
  const count = new Date(y, m + 1, 0).getDate();
  const cells = [
    ...Array(lead).fill(null),
    ...Array.from({ length: count }, (_, i) => new Date(y, m, i + 1)),
  ];
  const savedDays = new Set(savings.map((s) => ymd(new Date(s.timestamp))));
  const today = ymd(new Date());
  const dot = (c) => ({
    width: 8,
    height: 8,
    borderRadius: 99,
    background: c,
    display: "inline-block",
    marginRight: 2,
  });

  return (
    <>
      <div className="card">
        <Landmark size={26} />
        <h2 style={{ margin: "4px 0 0" }}>Where we keep it</h2>
        <p className="sub">
          Last 4 digits only. Don't enter a full account number.
        </p>
        <input
          className="input"
          placeholder="Bank or e-wallet name"
          value={bank.name}
          onChange={(e) => setBank({ ...bank, name: e.target.value })}
        />
        <input
          className="input"
          placeholder="Account no. (last 4 digits)"
          maxLength={4}
          inputMode="numeric"
          value={bank.last4}
          onChange={(e) => setBank({ ...bank, last4: e.target.value })}
        />
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn alt" onClick={saveBank}>
            Save
          </button>
          {stash.accountName && (
            <span>
              {stash.accountName} •••• {stash.accountLast4 || "----"}
            </span>
          )}
        </div>
      </div>

      <div className="card">
        <Mail size={26} />
        <h2 style={{ margin: "4px 0 0" }}>Email updates</h2>
        <p className="sub">
          When you add a saving, this address gets an email.
        </p>
        <input
          className="input"
          type="email"
          placeholder="Partner's email"
          value={emailTo}
          onChange={(e) => setEmailTo(e.target.value)}
        />
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn alt" onClick={saveEmail}>
            Save
          </button>
          <button className="btn ghost" onClick={testEmail}>
            Send test
          </button>
        </div>
        {msg && <p className="sub">{msg}</p>}
      </div>

      <div className="card">
        <Calendar size={26} />
        <div
          className="row"
          style={{ justifyContent: "space-between", margin: "4px 0 10px" }}
        >
          <button
            className="btn ghost"
            onClick={() => setMonth(new Date(y, m - 1, 1))}
            aria-label="Previous month"
          >
            ‹
          </button>
          <h2 style={{ margin: 0 }}>
            {month.toLocaleString("en-PH", { month: "long", year: "numeric" })}
          </h2>
          <button
            className="btn ghost"
            onClick={() => setMonth(new Date(y, m + 1, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 4,
            textAlign: "center",
          }}
        >
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <strong key={i}>{d}</strong>
          ))}
          {cells.map((d, i) =>
            d ? (
              <div
                key={i}
                style={{
                  aspectRatio: "1",
                  border: `2px solid ${
                    ymd(d) === today ? "#3b2f4a" : "#e6dcf0"
                  }`,
                  borderRadius: 10,
                  fontSize: 13,
                  padding: 3,
                }}
              >
                {d.getDate()}
                <div>
                  {savedDays.has(ymd(d)) && <span style={dot("#4caf7d")} />}
                  {schedules.some((s) => occursOn(s, d)) && (
                    <span style={dot("#f0b429")} />
                  )}
                </div>
              </div>
            ) : (
              <div key={i} />
            )
          )}
        </div>
        <p className="sub">
          <span style={dot("#4caf7d")} /> saved &nbsp;{" "}
          <span style={dot("#f0b429")} /> planned deposit
        </p>

        <h3 style={{ margin: "14px 0 0" }}>Schedule a deposit</h3>
        <input
          className="input"
          type="number"
          min="0"
          placeholder="Amount (PHP)"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <input
          className="input"
          placeholder="Note (optional)"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
        <input
          className="input"
          type="date"
          value={form.start}
          onChange={(e) => setForm({ ...form, start: e.target.value })}
        />
        <select
          className="input"
          value={form.freq}
          onChange={(e) => setForm({ ...form, freq: e.target.value })}
        >
          <option value="once">Once</option>
          <option value="weekly">Every week</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="monthly">Every month</option>
        </select>
        <button className="btn" style={{ marginTop: 12 }} onClick={addSchedule}>
          Add to schedule
        </button>

        {schedules.map((s) => (
          <div className="item" key={s.id}>
            <div style={{ flex: 1 }}>
              <strong>₱{s.amount}</strong>{" "}
              {s.freq === "once" ? "on" : s.freq + " from"} {s.start}
              <div className="sub" style={{ margin: 0 }}>
                {s.note}
              </div>
              <a href={gcal(s)} target="_blank" rel="noreferrer">
                Add to Google Calendar
              </a>
            </div>
            <button
              className="btn ghost"
              style={{ padding: "6px 10px" }}
              onClick={() =>
                deleteDoc(doc(db, "stashes", stashId, "schedules", s.id))
              }
              aria-label="Delete schedule"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
