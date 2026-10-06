import React, { useState, useEffect, useRef } from "react";
import Bonus from "./Bonus";
import Survival from "./Survival";
import Quests from "./Quests";
import Extras from "./Extras";
import themeCss, { baseCss } from "./theme";
import Insights from "./Insights";
import {
  Cat,
  PawPrint,
  Upload,
  Image as ImageIcon,
  Plus,
  X,
  Trash2,
  Edit3,
  Check,
  LogOut,
  Users,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

// Your exact Firebase keys
const firebaseConfig = {
  apiKey: "AIzaSyD0_IzVI8Pc0Clc3ZSaVWdmP-3VjQCDrMo",
  authDomain: "purrfect-savings.firebaseapp.com",
  projectId: "purrfect-savings",
  storageBucket: "purrfect-savings.firebasestorage.app",
  messagingSenderId: "305095038488",
  appId: "1:305095038488:web:0aa05457c52deb5f1f956d",
  measurementId: "G-L92ZSTPKR1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 500;
        let scaleSize = 1;
        if (img.width > MAX_WIDTH) {
          scaleSize = MAX_WIDTH / img.width;
        }
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.4));
      };
    };
  });
};

export default function App() {
  const [user, setUser] = useState(null);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("ks-theme") === "dark";
    } catch (e) {
      return false;
    }
  });
  const toggleTheme = () => {
    setDark(!dark);
    try {
      localStorage.setItem("ks-theme", !dark ? "dark" : "light");
    } catch (e) {}
  };
  const [stashId, setStashId] = useState(null);

  // Auth States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // App States
  const [savings, setSavings] = useState([]);
  const [goal, setGoal] = useState(50000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [rewardCatUrl, setRewardCatUrl] = useState(null);

  const fileInputRef = useRef(null);

  // Listen for user login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().stashId) {
          setStashId(userDoc.data().stashId);
        }
      } else {
        setStashId(null);
        setSavings([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for live database changes when a stash is selected
  useEffect(() => {
    if (!stashId) return;

    const unsubscribeSavings = onSnapshot(
      collection(db, "stashes", stashId, "savings"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSavings(data.sort((a, b) => b.timestamp - a.timestamp));
      }
    );

    const unsubscribeGoal = onSnapshot(
      doc(db, "stashes", stashId),
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().goal) {
          setGoal(docSnap.data().goal);
        }
      }
    );

    return () => {
      unsubscribeSavings();
      unsubscribeGoal();
    };
  }, [stashId]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setAuthError(err.message.replace("Firebase: ", ""));
    }
  };

  const createStash = async () => {
    try {
      const newStashId = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      await setDoc(doc(db, "stashes", newStashId), {
        goal: 50000,
        createdBy: user.uid,
      });
      await setDoc(doc(db, "users", user.uid), { stashId: newStashId });
      setStashId(newStashId);
    } catch (err) {
      alert(err.message);
    }
  };

  const joinStash = async () => {
    if (!joinCode) return;
    const stashRef = doc(db, "stashes", joinCode.toUpperCase());
    const stashSnap = await getDoc(stashRef);
    if (stashSnap.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        stashId: joinCode.toUpperCase(),
      });
      setStashId(joinCode.toUpperCase());
    } else {
      setAuthError("Stash code not found!");
    }
  };

  const handleLogout = () => signOut(auth);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isSubmitting || !stashId) return;

    setIsSubmitting(true);
    try {
      let base64Image = null;
      if (file) base64Image = await compressImage(file);

      const newEntryRef = doc(collection(db, "stashes", stashId, "savings"));
      await setDoc(newEntryRef, {
        amount: parseFloat(amount),
        note: note,
        imageUrl: base64Image,
        timestamp: Date.now(),
        addedBy: user.email,
      });

      setAmount("");
      setNote("");
      handleClearFile();

      try {
        const catRes = await fetch(
          "https://api.thecatapi.com/v1/images/search"
        );
        const catData = await catRes.json();
        if (catData && catData.length > 0) setRewardCatUrl(catData[0].url);
      } catch (catErr) {}
    } catch (error) {
      console.error("Error adding savings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "stashes", stashId, "savings", id));
  };

  const handleUpdateGoal = async () => {
    const newAmount = parseFloat(newGoalInput);
    if (!isNaN(newAmount) && newAmount > 0) {
      await updateDoc(doc(db, "stashes", stashId), { goal: newAmount });
    }
    setIsEditingGoal(false);
  };

  const totalSaved = savings.reduce((sum, item) => sum + (item.amount || 0), 0);
  const progressPercent = Math.min((totalSaved / goal) * 100, 100);
  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  // STYLES
  const textureBg = {
    backgroundColor: "#fdfaf2",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
  };

  // ===== PASTE THIS OVER LINE 208 ("// 1. LOGIN SCREEN") AND EVERYTHING BELOW IT =====

  const page = { ...textureBg, backgroundColor: "#f7f0ff" };

  const css = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
.ks{min-height:100vh;font-family:'Fredoka',system-ui,sans-serif;color:#3b2f4a;padding:24px 16px 64px;box-sizing:border-box}
.ks *{box-sizing:border-box}
.wrap{max-width:560px;margin:0 auto}
.card{background:#fff;border:2.5px solid #3b2f4a;border-radius:24px;padding:20px;box-shadow:5px 5px 0 #3b2f4a;margin-bottom:22px}
.title{font-size:34px;font-weight:700;margin:0;line-height:1.1}
.sub{margin:6px 0 0;color:#7a6a8a}
.input{width:100%;padding:12px 14px;border:2.5px solid #3b2f4a;border-radius:14px;font:inherit;background:#fffdf8;margin-top:10px}
.btn{font:inherit;font-weight:600;border:2.5px solid #3b2f4a;border-radius:14px;padding:11px 18px;background:#ffb8c6;color:#3b2f4a;cursor:pointer;box-shadow:3px 3px 0 #3b2f4a;transition:transform .08s,box-shadow .08s;display:inline-flex;align-items:center;gap:6px}
.btn:active{transform:translate(3px,3px);box-shadow:0 0 0 #3b2f4a}
.btn.alt{background:#bfe3c9}
.btn.ghost{background:#fff}
.btn:disabled{opacity:.5;cursor:default}
.ks :focus-visible{outline:3px solid #6b4fd8;outline-offset:2px}
.row{display:flex;gap:10px;align-items:center}
.err{color:#b3261e;font-weight:500;margin:10px 0 0}
.track{position:relative;height:26px;border:2.5px solid #3b2f4a;border-radius:99px;background:#f3ecf7;margin:38px 8px 10px}
.fill{height:100%;background:#ffb8c6;border-radius:99px;transition:width .6s ease}
.rider{position:absolute;top:-34px;transform:translateX(-50%);transition:left .6s ease}
.big{font-size:44px;font-weight:700;margin:0}
.item{display:flex;gap:12px;align-items:center;padding:12px 0;border-top:2px dashed #d8cbe3}
.item:first-child{border-top:0}
.thumb{width:56px;height:56px;border-radius:12px;border:2px solid #3b2f4a;object-fit:cover;cursor:pointer;flex:none}
.noimg{width:56px;height:56px;border-radius:12px;border:2px dashed #b9a8cc;display:flex;align-items:center;justify-content:center;color:#b9a8cc;flex:none}
.modal{position:fixed;inset:0;background:rgba(59,47,74,.7);display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;padding:20px;z-index:10;text-align:center;color:#fff}
.modal img{max-width:100%;max-height:65vh;border:3px solid #fff;border-radius:20px}
.code{font-weight:700;letter-spacing:.2em;background:#ffe29a;border:2px solid #3b2f4a;border-radius:10px;padding:2px 10px}
@media (prefers-reduced-motion:reduce){.fill,.rider,.btn{transition:none}}
`;

  const shell = (children) => (
    <div className="ks" style={page}>
      <style>{css}</style>
      <style>{baseCss}</style>
      {dark && <style>{themeCss}</style>}
      <div className="wrap">{children}</div>
      <button
        className="btn ghost"
        onClick={toggleTheme}
        style={{ position: "fixed", bottom: 16, right: 16, zIndex: 5 }}
      >
        {dark ? "Light mode" : "Dark mode"}
      </button>
    </div>
  );

  // 1. LOGIN SCREEN
  if (!user) {
    return shell(
      <div className="card" style={{ marginTop: 40 }}>
        <Cat size={44} />
        <h1 className="title">Purrfect Savings</h1>
        <p className="sub">Saving up together, one paw at a time.</p>
        <form onSubmit={handleAuth}>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {authError && <p className="err">{authError}</p>}
          <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
            <button className="btn" type="submit">
              {isLogin ? "Log in" : "Create account"}
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError("");
              }}
            >
              {isLogin ? "I need an account" : "I have an account"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 2. CREATE OR JOIN A STASH
  if (!stashId) {
    return shell(
      <>
        <div className="card" style={{ marginTop: 40 }}>
          <PawPrint size={36} />
          <h1 className="title">Start your stash</h1>
          <p className="sub">Create one, then give its code to your partner.</p>
          <button
            className="btn"
            style={{ marginTop: 16 }}
            onClick={createStash}
          >
            Create a new stash
          </button>
        </div>
        <div className="card">
          <Users size={30} />
          <h2 style={{ margin: "6px 0 0" }}>Join your partner's stash</h2>
          <input
            className="input"
            placeholder="6-letter code"
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />
          {authError && <p className="err">{authError}</p>}
          <button
            className="btn alt"
            style={{ marginTop: 14 }}
            onClick={joinStash}
          >
            Join stash
          </button>
        </div>
        <button className="btn ghost" onClick={handleLogout}>
          <LogOut size={16} /> Log out
        </button>
      </>
    );
  }

  // 3. MAIN SCREEN
  return shell(
    <>
      <div
        className="row"
        style={{ justifyContent: "space-between", marginBottom: 18 }}
      >
        <h1 className="title" style={{ fontSize: 28 }}>
          Kitty Stash
        </h1>
        <button
          className="btn ghost"
          onClick={handleLogout}
          aria-label="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>

      <div className="card">
        <p className="sub" style={{ margin: 0 }}>
          Saved so far
        </p>
        <p className="big">{formatCurrency(totalSaved)}</p>
        <div className="track">
          <div className="rider" style={{ left: `${progressPercent}%` }}>
            <Cat size={28} />
          </div>
          <div className="fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div
          className="row"
          style={{ justifyContent: "space-between", flexWrap: "wrap" }}
        >
          {isEditingGoal ? (
            <div className="row">
              <input
                className="input"
                style={{ margin: 0, width: 140 }}
                type="number"
                min="1"
                value={newGoalInput}
                onChange={(e) => setNewGoalInput(e.target.value)}
              />
              <button
                className="btn alt"
                onClick={handleUpdateGoal}
                aria-label="Save goal"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <span>
              Goal {formatCurrency(goal)}{" "}
              <button
                className="btn ghost"
                style={{ padding: "4px 8px" }}
                aria-label="Edit goal"
                onClick={() => {
                  setNewGoalInput(String(goal));
                  setIsEditingGoal(true);
                }}
              >
                <Edit3 size={14} />
              </button>
            </span>
          )}
          <span>{formatCurrency(Math.max(goal - totalSaved, 0))} to go</span>
        </div>
      </div>

      <div className="card">
        <div
          className="row"
          style={{ justifyContent: "space-between", flexWrap: "wrap" }}
        >
          <span>
            <Users size={16} style={{ verticalAlign: "-3px" }} /> Partner code:{" "}
            <span className="code">{stashId}</span>
          </span>
          <button
            className="btn ghost"
            onClick={() => {
              try {
                navigator.clipboard.writeText(stashId);
              } catch (err) {}
            }}
          >
            Copy code
          </button>
        </div>
        <p className="sub">
          Your partner signs up, picks "Join", and enters this code.
        </p>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <h2 style={{ margin: 0 }}>Add to the stash</h2>
        <input
          className="input"
          type="number"
          step="0.01"
          min="0"
          placeholder="Amount (PHP)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="What was it for? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn alt"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <Upload size={16} /> {file ? "Change receipt" : "Add receipt"}
          </button>
          {previewUrl && (
            <>
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="thumb"
                onClick={() => setSelectedImage(previewUrl)}
              />
              <button
                type="button"
                className="btn ghost"
                onClick={handleClearFile}
                aria-label="Remove receipt"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
        <button
          className="btn"
          type="submit"
          disabled={isSubmitting}
          style={{ marginTop: 16 }}
        >
          <Plus size={16} /> {isSubmitting ? "Saving…" : "Save it"}
        </button>
      </form>

      <div className="card">
        <h2 style={{ margin: "0 0 6px" }}>History</h2>
        {savings.length === 0 && (
          <p className="sub">Nothing here yet. Add your first saving above.</p>
        )}
        {savings.map((item) => (
          <div className="item" key={item.id}>
            {item.imageUrl ? (
              <img
                className="thumb"
                src={item.imageUrl}
                alt="Receipt"
                onClick={() => setSelectedImage(item.imageUrl)}
              />
            ) : (
              <div className="noimg">
                <ImageIcon size={20} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{formatCurrency(item.amount || 0)}</strong>
              <div className="sub" style={{ margin: 0 }}>
                {item.note || "No note"}
              </div>
              <div className="sub" style={{ margin: 0, fontSize: 13 }}>
                {item.addedBy} on{" "}
                {new Date(item.timestamp).toLocaleDateString("en-PH")}
              </div>
            </div>
            <button
              className="btn ghost"
              style={{ padding: "6px 10px" }}
              onClick={() => handleDelete(item.id)}
              aria-label="Delete entry"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <Survival db={db} stashId={stashId} savings={savings} />
      <Bonus db={db} stashId={stashId} savings={savings} />
      <Insights savings={savings} goal={goal} />
      <Extras db={db} stashId={stashId} user={user} savings={savings} />
      <Quests db={db} stashId={stashId} user={user} savings={savings} />
      {rewardCatUrl && (
        <div className="modal" onClick={() => setRewardCatUrl(null)}>
          <h2 style={{ margin: 0 }}>Purrfect! Here's your cat.</h2>
          <img src={rewardCatUrl} alt="A random cat" />
          <button className="btn">Keep saving</button>
        </div>
      )}

      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Receipt" />
          <button className="btn ghost">Close</button>
        </div>
      )}
    </>
  );
}
