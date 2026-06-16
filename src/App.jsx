import { useState, useRef, useEffect, useReducer, createContext, useContext } from "react";
import React from "react";

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError)
      return <div style={styles.fallback}>Something went wrong. <button onClick={() => this.setState({ hasError: false })}>Retry</button></div>;
    return this.props.children;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

function skillReducer(state, action) {
  switch (action.type) {
    case "ADD_SKILL": return { ...state, mySkills: [...state.mySkills, action.payload] };
    case "TOGGLE_SAVE": {
      const saved = state.savedSkills.includes(action.id)
        ? state.savedSkills.filter(id => id !== action.id)
        : [...state.savedSkills, action.id];
      return { ...state, savedSkills: saved };
    }
    case "SET_USER": return { ...state, user: action.payload };
    case "SEND_REQUEST": return { ...state, swapRequests: [...state.swapRequests, action.payload] };
    case "UPDATE_REQUEST": return {
      ...state,
      swapRequests: state.swapRequests.map(r => r.id === action.id ? { ...r, status: action.status } : r)
    };
    case "SEND_MSG": return {
      ...state,
      chats: {
        ...state.chats,
        [action.skillId]: [...(state.chats[action.skillId] || []), action.msg]
      }
    };
    default: return state;
  }
}

const initialState = {
  user: null,
  mySkills: [],
  savedSkills: [],
  swapRequests: [],
  chats: {},
};

// ─── Skills Data ──────────────────────────────────────────────────────────────
const SKILLS = [
  { id: 1, title: "UI/UX Design", teacher: "Aisha Rahman", level: "Intermediate", category: "Design", img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80", rating: 4.8, students: 142 },
  { id: 2, title: "React Development", teacher: "Rohan Mehta", level: "Advanced", category: "Tech", img: "https://images.unsplash.com/photo-1587620962725-abab19836100?w=400&q=80", rating: 4.9, students: 210 },
  { id: 3, title: "Photography Basics", teacher: "Sara Kim", level: "Beginner", category: "Creative", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80", rating: 4.6, students: 98 },
  { id: 4, title: "Guitar for Beginners", teacher: "Carlos Ruiz", level: "Beginner", category: "Music", img: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&q=80", rating: 4.7, students: 175 },
  { id: 5, title: "Data Analysis with Python", teacher: "Priya Nair", level: "Intermediate", category: "Tech", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80", rating: 4.8, students: 130 },
  { id: 6, title: "Watercolor Painting", teacher: "Mei Lin", level: "Beginner", category: "Creative", img: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80", rating: 4.5, students: 87 },
];

const CATEGORIES = ["All", "Tech", "Design", "Creative", "Music"];

// ─── Swap Request Modal ───────────────────────────────────────────────────────
function SwapRequestModal({ skill, onClose }) {
  const { state, dispatch } = useContext(AppContext);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const existing = state.swapRequests.find(r => r.skillId === skill.id);

  const handleSend = () => {
    if (!msg.trim()) return;
    const req = {
      id: Date.now(),
      skillId: skill.id,
      skillTitle: skill.title,
      teacher: skill.teacher,
      from: state.user.name,
      message: msg,
      status: "pending",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    dispatch({ type: "SEND_REQUEST", payload: req });
    // simulate teacher auto-response after 2s
    setTimeout(() => {
      dispatch({ type: "SEND_MSG", skillId: skill.id, msg: { from: skill.teacher, text: `Hi ${state.user.name}! Got your request for ${skill.title}. Let me review and get back to you.`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } });
    }, 2000);
    setSent(true);
  };

  if (existing) {
    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={{ ...styles.modal, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>Request Status</h2>
            <button style={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {existing.status === "pending" ? "⏳" : existing.status === "accepted" ? "✅" : "❌"}
            </div>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
              {existing.status === "pending" ? "Request Pending" : existing.status === "accepted" ? "Request Accepted!" : "Request Declined"}
            </p>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              {existing.status === "pending" ? `Waiting for ${skill.teacher} to respond.` : existing.status === "accepted" ? "You can now chat with the teacher!" : "The teacher couldn't accommodate your request."}
            </p>
          </div>
          <button style={{ ...styles.btnPrimary, width: "100%" }} onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Request Skill Swap</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {!sent ? (
          <>
            <div style={styles.requestSkillInfo}>
              <img src={skill.img} alt={skill.title} style={styles.requestSkillImg} />
              <div>
                <p style={styles.cardCategory}>{skill.category}</p>
                <p style={{ margin: 0, fontWeight: 700, color: "#111827" }}>{skill.title}</p>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>by {skill.teacher}</p>
              </div>
            </div>
            <label style={styles.label}>Introduce yourself & what you offer in return</label>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              rows={4}
              style={{ ...styles.input, resize: "none" }}
              placeholder={`Hi ${skill.teacher}, I'd love to learn ${skill.title}. In exchange I can teach...`}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={handleSend} disabled={!msg.trim()}>Send Request</button>
              <button style={{ ...styles.btnOutline, flex: 1 }} onClick={onClose}>Cancel</button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📨</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>Request Sent!</p>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
              {skill.teacher} will review your request and respond shortly.
            </p>
            <button style={{ ...styles.btnPrimary, width: "100%" }} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Incoming Request Card (for teacher side) ─────────────────────────────────
function IncomingRequestCard({ req, onAction }) {
  return (
    <div style={styles.reqCard}>
      <div style={styles.reqCardTop}>
        <div style={styles.reqAvatar}>{req.from[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827" }}>{req.from}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#6d28d9" }}>wants to learn {req.skillTitle}</p>
          <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{req.time}</p>
        </div>
        <span style={{
          ...styles.statusBadge,
          background: req.status === "pending" ? "#fef3c7" : req.status === "accepted" ? "#d1fae5" : "#fee2e2",
          color: req.status === "pending" ? "#92400e" : req.status === "accepted" ? "#065f46" : "#991b1b"
        }}>{req.status}</span>
      </div>
      <p style={styles.reqMsg}>"{req.message}"</p>
      {req.status === "pending" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...styles.btnAccept }} onClick={() => onAction(req.id, "accepted")}>Accept</button>
          <button style={{ ...styles.btnDecline }} onClick={() => onAction(req.id, "declined")}>Decline</button>
        </div>
      )}
      {req.status === "accepted" && (
        <p style={{ margin: 0, fontSize: 12, color: "#059669", fontWeight: 600 }}>Accepted — Chat is now open</p>
      )}
    </div>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────
function ChatWindow({ skill, onClose }) {
  const { state, dispatch } = useContext(AppContext);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const messages = state.chats[skill.id] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = () => {
    if (!input.trim()) return;
    dispatch({ type: "SEND_MSG", skillId: skill.id, msg: { from: state.user.name, text: input, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } });
    setInput("");
    // auto-reply
    setTimeout(() => {
      const replies = [
        "Sure! Let's set up a session this week.",
        "Great, I'm available on weekends.",
        "Sounds good! What time works for you?",
        "Looking forward to our swap!",
      ];
      dispatch({ type: "SEND_MSG", skillId: skill.id, msg: { from: skill.teacher, text: replies[Math.floor(Math.random() * replies.length)], time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } });
    }, 1500);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.chatWindow} onClick={e => e.stopPropagation()}>
        <div style={styles.chatHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={skill.img} alt={skill.teacher} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827" }}>{skill.teacher}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#10b981" }}>Online</p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.chatBody}>
          {messages.length === 0 && (
            <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 40 }}>No messages yet. Say hello!</p>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.from === state.user?.name ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{ ...styles.bubble, background: m.from === state.user?.name ? "#6d28d9" : "#f3f4f6", color: m.from === state.user?.name ? "#fff" : "#111827" }}>
                <p style={{ margin: 0, fontSize: 13 }}>{m.text}</p>
                <p style={{ margin: "4px 0 0", fontSize: 10, opacity: 0.65, textAlign: "right" }}>{m.time}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={styles.chatInput}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMsg()}
            placeholder="Type a message..."
            style={{ ...styles.input, marginBottom: 0, flex: 1 }}
          />
          <button style={styles.btnPrimary} onClick={sendMsg}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ─── Skill Card ───────────────────────────────────────────────────────────────
function SkillCard({ skill, saved, onToggleSave }) {
  const { state } = useContext(AppContext);
  const [hovered, setHovered] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const req = state.swapRequests.find(r => r.skillId === skill.id);
  const btnLabel = !req ? "Request Swap" : req.status === "pending" ? "Pending..." : req.status === "accepted" ? "Open Chat" : "Declined";
  const btnStyle = !req ? styles.btnPrimary : req.status === "pending" ? styles.btnPending : req.status === "accepted" ? styles.btnAccepted : styles.btnDeclined;

  const handleSwapClick = () => {
    if (req?.status === "accepted") setShowChat(true);
    else setShowRequest(true);
  };

  return (
    <>
      <div
        style={{ ...styles.card, transform: hovered ? "translateY(-4px)" : "none", boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.12)" : "0 2px 12px rgba(0,0,0,0.07)" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={styles.cardImgWrap}>
          <img src={skill.img} alt={skill.title} style={styles.cardImg} />
          <span style={{ ...styles.levelBadge, background: skill.level === "Beginner" ? "#d1fae5" : skill.level === "Intermediate" ? "#fef3c7" : "#ede9fe", color: skill.level === "Beginner" ? "#065f46" : skill.level === "Intermediate" ? "#92400e" : "#5b21b6" }}>{skill.level}</span>
        </div>
        <div style={styles.cardBody}>
          <p style={styles.cardCategory}>{skill.category}</p>
          <h3 style={styles.cardTitle}>{skill.title}</h3>
          <p style={styles.cardTeacher}>by {skill.teacher}</p>
          <div style={styles.cardMeta}>
            <span style={styles.rating}>★ {skill.rating}</span>
            <span style={styles.students}>{skill.students} learners</span>
          </div>
          <div style={styles.cardActions}>
            <button style={btnStyle} onClick={handleSwapClick}>{btnLabel}</button>
            <button onClick={() => onToggleSave(skill.id)} style={{ ...styles.btnOutline, background: saved ? "#6d28d9" : "transparent", color: saved ? "#fff" : "#6d28d9" }}>
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {showRequest && <SwapRequestModal skill={skill} onClose={() => setShowRequest(false)} />}
      {showChat && <ChatWindow skill={skill} onClose={() => setShowChat(false)} />}
    </>
  );
}

// ─── Skill Grid ───────────────────────────────────────────────────────────────
function SkillGrid({ skills, savedSkills, onToggleSave }) {
  return (
    <div style={styles.grid}>
      {skills.map(skill => (
        <SkillCard key={skill.id} skill={skill} saved={savedSkills.includes(skill.id)} onToggleSave={onToggleSave} />
      ))}
    </div>
  );
}

// ─── Container Components ─────────────────────────────────────────────────────
function SkillListContainer({ filter }) {
  const { state, dispatch } = useContext(AppContext);
  const filtered = filter === "All" ? SKILLS : SKILLS.filter(s => s.category === filter);
  const savedCount = state.savedSkills.length; // derived state
  return <SkillGrid skills={filtered} savedSkills={state.savedSkills} onToggleSave={id => dispatch({ type: "TOGGLE_SAVE", id })} savedCount={savedCount} />;
}

function AddSkillContainer({ onClose }) {
  const { dispatch } = useContext(AppContext);
  const handleAdd = (skill) => { dispatch({ type: "ADD_SKILL", payload: skill }); onClose(); };
  return <AddSkillForm onAdd={handleAdd} onClose={onClose} />;
}

// ─── Add Skill Form ───────────────────────────────────────────────────────────
function AddSkillForm({ onAdd, onClose }) {
  const [form, setForm] = useState({ title: "", category: "Tech", level: "Beginner", description: "" });
  const [errors, setErrors] = useState({});
  const descRef = useRef(null);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (form.title.length > 50) e.title = "Max 50 characters";
    if (!form.description.trim()) e.description = "Description is required";
    return e;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }));
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onAdd({ ...form, id: Date.now(), img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80", teacher: "You", rating: 5.0, students: 0 });
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modal, maxWidth: 460 }}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Add a Skill to Offer</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <label style={styles.label}>Skill Title</label>
        <input name="title" value={form.title} onChange={handleChange} style={{ ...styles.input, borderColor: errors.title ? "#ef4444" : "#e5e7eb" }} placeholder="e.g. Illustration Basics" />
        {errors.title && <p style={styles.error}>{errors.title}</p>}
        <label style={styles.label}>Category</label>
        <select name="category" value={form.category} onChange={handleChange} style={styles.input}>
          {["Tech", "Design", "Creative", "Music"].map(c => <option key={c}>{c}</option>)}
        </select>
        <label style={styles.label}>Level</label>
        <select name="level" value={form.level} onChange={handleChange} style={styles.input}>
          {["Beginner", "Intermediate", "Advanced"].map(l => <option key={l}>{l}</option>)}
        </select>
        <label style={styles.label}>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} ref={descRef} rows={3}
          style={{ ...styles.input, resize: "none", borderColor: errors.description ? "#ef4444" : "#e5e7eb" }} placeholder="What will learners gain?" />
        {errors.description && <p style={styles.error}>{errors.description}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={handleSubmit}>Add Skill</button>
          <button style={{ ...styles.btnOutline, flex: 1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm() {
  const { dispatch } = useContext(AppContext);
  const [creds, setCreds] = useState({ name: "", email: "" });
  const [err, setErr] = useState("");
  const nameRef = useRef(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleLogin = () => {
    if (!creds.name.trim() || !creds.email.trim()) { setErr("Please fill in both fields"); return; }
    if (!creds.email.includes("@")) { setErr("Invalid email address"); return; }
    localStorage.setItem("skillswap_user", JSON.stringify(creds));
    dispatch({ type: "SET_USER", payload: creds });
  };

  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80" alt="People learning" style={styles.loginImg} />
        <div style={styles.loginForm}>
          <h1 style={styles.loginTitle}>SkillSwap</h1>
          <p style={styles.loginSub}>Teach what you know. Learn what you don't.</p>
          <input ref={nameRef} placeholder="Your name" value={creds.name} onChange={e => setCreds(c => ({ ...c, name: e.target.value }))} style={styles.input} />
          <input placeholder="Email address" value={creds.email} onChange={e => setCreds(c => ({ ...c, email: e.target.value }))} style={{ ...styles.input, marginTop: 10 }} />
          {err && <p style={styles.error}>{err}</p>}
          <button style={{ ...styles.btnPrimary, width: "100%", marginTop: 16, padding: "12px" }} onClick={handleLogin}>Get Started</button>
        </div>
      </div>
    </div>
  );
}

// ─── Requests Tab ─────────────────────────────────────────────────────────────
function RequestsSection() {
  const { state, dispatch } = useContext(AppContext);
  const incoming = state.swapRequests; // In real app, filter by teacher
  const [activeChat, setActiveChat] = useState(null);

  const handleAction = (id, status) => {
    dispatch({ type: "UPDATE_REQUEST", id, status });
    if (status === "accepted") {
      const req = state.swapRequests.find(r => r.id === id);
      const skill = SKILLS.find(s => s.id === req?.skillId);
      if (skill) {
        dispatch({ type: "SEND_MSG", skillId: skill.id, msg: { from: skill.teacher, text: `Hi ${req.from}! Your swap request for ${req.skillTitle} has been accepted. Let's get started!`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) } });
      }
    }
  };

  if (incoming.length === 0) return (
    <div style={styles.emptyState}>
      <img src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80" alt="Empty" style={{ width: 200, borderRadius: 12, marginBottom: 16 }} />
      <p style={{ color: "#9ca3af" }}>No swap requests yet. Send a request from the Browse tab.</p>
    </div>
  );

  return (
    <div>
      <h2 style={styles.sectionTitle}>Swap Requests</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {incoming.map(req => {
          const skill = SKILLS.find(s => s.id === req.skillId);
          return (
            <div key={req.id}>
              <IncomingRequestCard req={req} onAction={handleAction} />
              {req.status === "accepted" && skill && (
                <button style={{ ...styles.btnAccepted, marginTop: 8, fontSize: 13 }} onClick={() => setActiveChat(skill)}>
                  Open Chat with {req.from}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {activeChat && <ChatWindow skill={activeChat} onClose={() => setActiveChat(null)} />}
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection() {
  const { state } = useContext(AppContext);
  return (
    <div style={styles.profileWrap}>
      <div style={styles.profileHeader}>
        <div style={styles.avatar}>{state.user?.name?.[0]?.toUpperCase()}</div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{state.user?.name}</h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>{state.user?.email}</p>
        </div>
      </div>
      <h3 style={{ marginBottom: 12, color: "#374151" }}>My Offered Skills ({state.mySkills.length})</h3>
      {state.mySkills.length === 0
        ? <p style={{ color: "#9ca3af" }}>You haven't added any skills yet.</p>
        : <SkillGrid skills={state.mySkills} savedSkills={[]} onToggleSave={() => {}} />}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(skillReducer, initialState);
  const [tab, setTab] = useState("browse");
  const [filter, setFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("skillswap_user");
    if (saved) dispatch({ type: "SET_USER", payload: JSON.parse(saved) });
  }, []);

  useEffect(() => {
    sessionStorage.setItem("skillswap_saved", JSON.stringify(state.savedSkills));
  }, [state.savedSkills]);

  const pendingCount = state.swapRequests.filter(r => r.status === "pending").length;

  if (!state.user) return (
    <AppContext.Provider value={{ state, dispatch }}>
      <LoginForm />
    </AppContext.Provider>
  );

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <ErrorBoundary>
        <div style={styles.appWrap}>
          <header style={styles.header}>
            <span style={styles.logo}>SkillSwap</span>
            <nav style={styles.nav}>
              {[
                { key: "browse", label: "Browse" },
                { key: "requests", label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
                { key: "saved", label: `Saved (${state.savedSkills.length})` },
                { key: "profile", label: "Profile" },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)} style={{ ...styles.navBtn, borderBottom: tab === t.key ? "2px solid #6d28d9" : "2px solid transparent", color: tab === t.key ? "#6d28d9" : "#6b7280" }}>
                  {t.label}
                </button>
              ))}
            </nav>
            <button style={styles.btnPrimary} onClick={() => setShowAddModal(true)}>+ Offer Skill</button>
          </header>

          <main style={styles.main}>
            {tab === "browse" && (
              <>
                <div style={styles.hero}>
                  <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80" alt="People collaborating" style={styles.heroImg} />
                  <div style={styles.heroOverlay}>
                    <h1 style={styles.heroTitle}>Exchange Skills, Grow Together</h1>
                    <p style={styles.heroSub}>Connect with people who have what you need — and need what you have.</p>
                  </div>
                </div>
                <div style={styles.filterRow}>
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setFilter(c)} style={{ ...styles.filterBtn, background: filter === c ? "#6d28d9" : "#f3f4f6", color: filter === c ? "#fff" : "#374151" }}>{c}</button>
                  ))}
                </div>
                <SkillListContainer filter={filter} />
              </>
            )}
            {tab === "requests" && <RequestsSection />}
            {tab === "saved" && (
              <div>
                <h2 style={styles.sectionTitle}>Saved Skills</h2>
                {state.savedSkills.length === 0
                  ? <div style={styles.emptyState}>
                    <img src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&q=80" alt="Empty" style={{ width: 220, borderRadius: 12, marginBottom: 16 }} />
                    <p style={{ color: "#9ca3af" }}>No saved skills yet.</p>
                  </div>
                  : <SkillGrid skills={SKILLS.filter(s => state.savedSkills.includes(s.id))} savedSkills={state.savedSkills} onToggleSave={id => dispatch({ type: "TOGGLE_SAVE", id })} />}
              </div>
            )}
            {tab === "profile" && <ProfileSection />}
          </main>

          {showAddModal && <AddSkillContainer onClose={() => setShowAddModal(false)} />}
        </div>
      </ErrorBoundary>
    </AppContext.Provider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  appWrap: { minHeight: "100vh", background: "#f9fafb", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  header: { display: "flex", alignItems: "center", gap: 20, padding: "0 40px", height: 60, background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontWeight: 800, fontSize: 20, color: "#6d28d9", letterSpacing: "-0.5px", marginRight: "auto" },
  nav: { display: "flex", gap: 2 },
  navBtn: { background: "none", border: "none", cursor: "pointer", padding: "8px 12px", fontSize: 13, fontWeight: 500, transition: "color 0.2s" },
  main: { maxWidth: 1100, margin: "0 auto", padding: "32px 20px" },
  hero: { position: "relative", borderRadius: 16, overflow: "hidden", marginBottom: 32, height: 300 },
  heroImg: { width: "100%", height: "100%", objectFit: "cover" },
  heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(109,40,217,0.75), rgba(0,0,0,0.2))", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 48px" },
  heroTitle: { color: "#fff", fontSize: 32, fontWeight: 800, margin: "0 0 8px", maxWidth: 500 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 16, margin: 0, maxWidth: 420 },
  filterRow: { display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  filterBtn: { border: "none", borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 },
  card: { background: "#fff", borderRadius: 14, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" },
  cardImgWrap: { position: "relative", height: 180 },
  cardImg: { width: "100%", height: "100%", objectFit: "cover" },
  levelBadge: { position: "absolute", top: 10, right: 10, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 },
  cardBody: { padding: "16px 18px 18px" },
  cardCategory: { margin: "0 0 4px", fontSize: 11, fontWeight: 600, color: "#6d28d9", textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: { margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#111827" },
  cardTeacher: { margin: "0 0 10px", fontSize: 13, color: "#6b7280" },
  cardMeta: { display: "flex", gap: 12, marginBottom: 14 },
  rating: { fontSize: 13, color: "#f59e0b", fontWeight: 600 },
  students: { fontSize: 13, color: "#9ca3af" },
  cardActions: { display: "flex", gap: 8 },
  btnPrimary: { background: "#6d28d9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnOutline: { background: "transparent", color: "#6d28d9", border: "1px solid #6d28d9", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnPending: { background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnAccepted: { background: "#d1fae5", color: "#065f46", border: "1px solid #6ee7b7", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnDeclined: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnAccept: { background: "#059669", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnDecline: { background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  sectionTitle: { fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 24 },
  emptyState: { textAlign: "center", paddingTop: 40 },
  profileWrap: { padding: "8px 0" },
  profileHeader: { display: "flex", alignItems: "center", gap: 16, marginBottom: 32 },
  avatar: { width: 56, height: 56, borderRadius: "50%", background: "#6d28d9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 460 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" },
  closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#9ca3af", lineHeight: 1 },
  requestSkillInfo: { display: "flex", gap: 12, alignItems: "center", background: "#f9fafb", borderRadius: 10, padding: "12px", marginBottom: 16 },
  requestSkillImg: { width: 52, height: 52, borderRadius: 8, objectFit: "cover" },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, boxSizing: "border-box", outline: "none", marginBottom: 12 },
  error: { color: "#ef4444", fontSize: 12, margin: "-8px 0 10px" },
  reqCard: { background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 8px rgba(0,0,0,0.07)" },
  reqCardTop: { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  reqAvatar: { width: 38, height: 38, borderRadius: "50%", background: "#6d28d9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 },
  reqMsg: { margin: "0 0 12px", fontSize: 13, color: "#374151", fontStyle: "italic", background: "#f9fafb", padding: "10px 12px", borderRadius: 8, borderLeft: "3px solid #6d28d9" },
  statusBadge: { borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" },
  chatWindow: { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", overflow: "hidden", height: 560 },
  chatHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #e5e7eb", background: "#fff" },
  chatBody: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column" },
  bubble: { maxWidth: "72%", padding: "10px 14px", borderRadius: 14, wordBreak: "break-word" },
  chatInput: { display: "flex", gap: 8, padding: "12px 14px", borderTop: "1px solid #e5e7eb" },
  loginWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" },
  loginCard: { background: "#fff", borderRadius: 20, overflow: "hidden", display: "flex", maxWidth: 860, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.1)" },
  loginImg: { width: "50%", objectFit: "cover", display: "block" },
  loginForm: { padding: "48px 40px", flex: 1 },
  loginTitle: { margin: "0 0 6px", fontSize: 28, fontWeight: 800, color: "#6d28d9" },
  loginSub: { margin: "0 0 28px", color: "#6b7280", fontSize: 15 },
  fallback: { padding: 24, textAlign: "center", color: "#ef4444", background: "#fef2f2", borderRadius: 12, margin: 24 },
};
