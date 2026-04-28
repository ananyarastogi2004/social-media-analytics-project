import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter
} from "recharts";

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE = "http://localhost:8000";
const api = {
  h: () => {
    const t = localStorage.getItem("sma_token");
    return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  },
  r: async (path, opts = {}) => {
    try {
      const res = await fetch(`${BASE}${path}`, { ...opts, headers: api.h() });
      if (!res.ok) { const e = await res.json().catch(() => ({})); return { error: e.detail || `HTTP ${res.status}` }; }
      return await res.json();
    } catch (e) { return { error: e.message }; }
  },
  signup: (u, p) => api.r(`/auth/signup?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`, { method: "POST" }),
  login:  (u, p) => api.r(`/auth/login?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`, { method: "POST" }),
  createCase: (n, k, pl, d) => api.r(`/cases/create?name=${encodeURIComponent(n)}&keyword=${encodeURIComponent(k)}&platform=${encodeURIComponent(pl)}&dataset_id=${encodeURIComponent(d)}`, { method: "POST" }),
  fetchCase:  (id) => api.r(`/apify/fetch-by-case?case_id=${id}`, { method: "POST" }),
  sentiment:   () => api.r("/analytics/sentiment"),
  trends:      () => api.r("/analytics/trends"),
  network:     () => api.r("/analytics/network"),
  recommend:   (i=0) => api.r(`/analytics/recommend?index=${i}`),
  fakeNews:    () => api.r("/analytics/fake-news"),
  segments:    (k=3) => api.r(`/analytics/segments?k=${k}`),
  engagement:  () => api.r("/analytics/engagement"),
  influencers: () => api.r("/analytics/influencers"),
  competitors: (kw) => api.r(`/analytics/competitors?keywords=${encodeURIComponent(kw)}`),
  predict:     (kw) => api.r(`/analytics/predict?keyword=${encodeURIComponent(kw)}`),
  debugPosts:  () => api.r("/analytics/debug-posts"),
};

// ─── GLOBAL CSS ───────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&family=Rajdhani:wght@400;500;600;700&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg0:#050b18;
  --bg1:#080f20;
  --bg2:#0c1528;
  --bg3:#101c32;
  --bg4:#162038;
  --bg5:#1c2840;
  --b50:#eff6ff;
  --b100:#dbeafe;
  --b200:#bfdbfe;
  --b300:#93c5fd;
  --b400:#60a5fa;
  --b500:#3b82f6;
  --b600:#2563eb;
  --b700:#1d4ed8;
  --b800:#1e40af;
  --b900:#1e3a8a;
  --cyan:#22d3ee;
  --teal:#2dd4bf;
  --violet:#a78bfa;
  --rose:#fb7185;
  --amber:#fbbf24;
  --emerald:#34d399;
  --text:#e2e8f0;
  --t1:#cbd5e1;
  --t2:#94a3b8;
  --t3:#475569;
  --t4:#334155;
  --bd:rgba(59,130,246,0.12);
  --bd2:rgba(59,130,246,0.22);
  --bd3:rgba(59,130,246,0.35);
  --glow:rgba(59,130,246,0.15);
  --r:8px;--r2:12px;--r3:16px;
  --font:'Space Grotesk',sans-serif;
  --mono:'Space Mono',monospace;
  --display:'Rajdhani',sans-serif;
  --sidebar:64px;
}
body{background:var(--bg0);color:var(--text);font-family:var(--font);overflow-x:hidden;font-size:14px;line-height:1.5}
button{font-family:var(--font)}
input,select{
  font-family:var(--mono);background:var(--bg3);
  border:1px solid var(--bd2);color:var(--text);outline:none;
  border-radius:var(--r);padding:10px 14px;font-size:13px;width:100%;
  transition:border-color .2s,box-shadow .2s,background .2s
}
input:focus,select:focus{
  border-color:var(--b500);
  box-shadow:0 0 0 3px rgba(59,130,246,0.12),inset 0 0 20px rgba(59,130,246,0.04)
}
input::placeholder{color:var(--t3)}
select option{background:var(--bg3)}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--b700);border-radius:4px}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
@keyframes counterUp{from{opacity:0;transform:scale(.85) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes borderGlow{0%,100%{box-shadow:0 0 12px rgba(59,130,246,.2)}50%{box-shadow:0 0 28px rgba(59,130,246,.4)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.pg{animation:fadeUp .35s cubic-bezier(.22,1,.36,1)}
.bg-grid{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:
    linear-gradient(rgba(59,130,246,.03) 1px,transparent 1px),
    linear-gradient(90deg,rgba(59,130,246,.03) 1px,transparent 1px);
  background-size:40px 40px
}
.bg-glow{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 70% 50% at 50% -5%,rgba(59,130,246,.09) 0%,transparent 60%),
    radial-gradient(ellipse 40% 30% at 80% 80%,rgba(34,211,238,.04) 0%,transparent 50%)
}
.recharts-tooltip-wrapper{z-index:9999!important}
.recharts-default-tooltip{
  background:var(--bg3)!important;border:1px solid var(--bd2)!important;
  border-radius:var(--r)!important;font-family:var(--mono)!important;
  font-size:12px!important;color:var(--text)!important
}
`;

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const CHART_COLORS = ["#3b82f6","#22d3ee","#a78bfa","#34d399","#fbbf24","#fb7185"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:"var(--bg3)",border:"1px solid var(--bd2)",borderRadius:"var(--r)",padding:"10px 14px"}}>
      {label && <p style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)",marginBottom:6}}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{fontFamily:"var(--mono)",fontSize:12,color:p.color||"var(--b400)",marginBottom:2}}>
          {p.name}: <span style={{fontWeight:700}}>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── RAW JSON FALLBACK ────────────────────────────────────────────────────────
const RawJSON = ({ data }) => (
  <pre style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)",background:"var(--bg3)",padding:16,borderRadius:"var(--r)",overflowX:"auto",whiteSpace:"pre-wrap",wordBreak:"break-word",maxHeight:400 }}>
    {JSON.stringify(data, null, 2)}
  </pre>
);

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const Spin = ({ size = 28 }) => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 52 }}>
    <div style={{
      width: size, height: size,
      border: "2px solid var(--bg4)", borderTopColor: "var(--b400)",
      borderRadius: "50%", animation: "spin .6s linear infinite"
    }} />
  </div>
);

const StatusDot = ({ color = "var(--b400)", pulse }) => (
  <span style={{
    display: "inline-block", width: 6, height: 6, borderRadius: "50%",
    background: color, flexShrink: 0,
    boxShadow: `0 0 8px ${color}`,
    animation: pulse ? "pulse 2s ease infinite" : ""
  }} />
);

const Tag = ({ children, color = "var(--b500)" }) => (
  <span style={{
    fontFamily: "var(--mono)", fontSize: 10, letterSpacing: .8,
    color, border: `1px solid ${color}28`, background: `${color}0f`,
    padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap",
    textTransform: "uppercase"
  }}>{children}</span>
);

const GlassCard = ({ children, style = {}, onClick, hover }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHov(true)}
      onMouseLeave={() => hover && setHov(false)}
      onClick={onClick}
      style={{
        background: hov ? "rgba(30,50,90,0.7)" : "rgba(12,21,40,0.8)",
        border: `1px solid ${hov ? "rgba(59,130,246,0.35)" : "rgba(59,130,246,0.12)"}`,
        borderRadius: "var(--r2)",
        backdropFilter: "blur(12px)",
        transition: "all .2s ease",
        boxShadow: hov ? "0 0 32px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.05)" : "inset 0 1px 0 rgba(255,255,255,0.03)",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
    >{children}</div>
  );
};

const KPICard = ({ value, label, sub, color = "var(--b400)", icon, trend }) => (
  <GlassCard style={{ padding: "20px 18px", textAlign: "center", position: "relative", overflow: "hidden" }}>
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg, transparent, ${color}, transparent)`
    }} />
    {icon && <div style={{ fontSize: 16, marginBottom: 10, opacity: .7, fontFamily: "var(--mono)", color }}>{icon}</div>}
    <div style={{
      fontFamily: "var(--display)", fontWeight: 700, fontSize: 38, color,
      lineHeight: 1, animation: "counterUp .5s ease",
      textShadow: `0 0 30px ${color}40`
    }}>{value}</div>
    <div style={{ fontSize: 11, color: "var(--t2)", marginTop: 7, letterSpacing: .6, fontWeight: 500, textTransform: "uppercase" }}>{label}</div>
    {sub && <div style={{ fontFamily: "var(--mono)", fontSize: 10, color, marginTop: 4, opacity: .8 }}>{sub}</div>}
    {trend !== undefined && (
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: trend >= 0 ? "var(--emerald)" : "var(--rose)", marginTop: 6 }}>
        {trend >= 0 ? "+" : "-"} {Math.abs(trend)}%
      </div>
    )}
  </GlassCard>
);

const PrimaryBtn = ({ children, onClick, color = "var(--b500)", disabled, sm, outline, style = {} }) => {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: sm ? "6px 16px" : "9px 22px",
        background: outline ? "transparent" : disabled ? "var(--bg4)" : h ? "#60a5fa" : color,
        color: outline ? color : disabled ? "var(--t3)" : "#050b18",
        border: outline ? `1px solid ${color}` : "none",
        borderRadius: "var(--r)", fontFamily: "var(--font)", fontWeight: 600,
        fontSize: sm ? 12 : 13, letterSpacing: .3, cursor: disabled ? "not-allowed" : "pointer",
        transition: "all .2s",
        boxShadow: !disabled && !outline ? `0 0 20px ${color}40` : "none",
        ...style
      }}>{children}</button>
  );
};

const ErrBox = ({ type = "info", msg }) => {
  const C = { error: "var(--rose)", success: "var(--emerald)", warn: "var(--amber)", info: "var(--b400)" };
  const c = C[type] || C.info;
  return (
    <div style={{
      padding: "10px 14px", borderRadius: "var(--r)", background: `${c}0d`,
      border: `1px solid ${c}22`, fontFamily: "var(--mono)", fontSize: 12,
      color: c, marginBottom: 12, lineHeight: 1.6
    }}>{msg}</div>
  );
};

const SectionHeader = ({ icon, title, color = "var(--b400)", sub, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: `${color}15`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          fontFamily: "var(--mono)", color
        }}>{icon}</div>
        <h1 style={{
          fontFamily: "var(--display)", fontWeight: 700, fontSize: 26, color,
          letterSpacing: -.3, lineHeight: 1
        }}>{title}</h1>
      </div>
      {sub && <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t2)", marginTop: 4, letterSpacing: .3 }}>{sub}</p>}
    </div>
    {right}
  </div>
);

const Ruler = () => <div style={{ height: "1px", background: "linear-gradient(90deg,transparent,var(--bd2),transparent)", margin: "16px 0" }} />;

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const Login = ({ onLogin }) => {
  const [mode, setMode] = useState("login"), [u, setU] = useState(""), [p, setP] = useState("");
  const [loading, setLoading] = useState(false), [msg, setMsg] = useState(null);
  const submit = async e => {
    e.preventDefault();
    if (!u || !p) return setMsg({ t: "warn", m: "Please fill all fields" });
    setLoading(true); setMsg(null);
    if (mode === "signup") {
      const r = await api.signup(u, p);
      if (r.error) setMsg({ t: "error", m: r.error });
      else { setMode("login"); setMsg({ t: "success", m: "Account created — sign in." }); }
    } else {
      const r = await api.login(u, p);
      if (!r.access_token) setMsg({ t: "error", m: r.error || "Invalid credentials" });
      else { localStorage.setItem("sma_token", r.access_token); localStorage.setItem("sma_user", u); onLogin(u); }
    }
    setLoading(false);
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <div className="bg-grid" /><div className="bg-glow" />
      <div className="pg" style={{ width: "100%", maxWidth: 420, padding: 20, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: 14,
            background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
            boxShadow: "0 0 40px rgba(59,130,246,0.4)",
            fontFamily: "var(--display)", fontWeight: 700, fontSize: 22, color: "#fff",
            marginBottom: 16
          }}>SMA</div>
          <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 28, letterSpacing: -.4, lineHeight: 1 }}>
            Social Media <span style={{ color: "var(--b400)" }}>Analytics</span>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t3)", marginTop: 8, letterSpacing: 2 }}>
            FastAPI · SQLite · Apify · scikit-learn
          </div>
        </div>
        <GlassCard style={{ padding: 28 }}>
          <div style={{ display: "flex", gap: 2, marginBottom: 24, padding: 4, background: "var(--bg3)", borderRadius: "var(--r)" }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "9px 0", borderRadius: 6, border: "none", cursor: "pointer",
                fontFamily: "var(--font)", fontWeight: 600, fontSize: 13, transition: "all .2s",
                background: mode === m ? "var(--b600)" : "transparent",
                color: mode === m ? "#fff" : "var(--t2)"
              }}>{m === "login" ? "Sign In" : "Register"}</button>
            ))}
          </div>
          {msg && <ErrBox type={msg.t} msg={msg.m} />}
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[["Username", "text", u, setU, "analyst_01"], ["Password", "password", p, setP, "••••••••"]].map(([l, t, v, sv, ph]) => (
              <div key={l}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--t2)", marginBottom: 7, letterSpacing: .3 }}>{l}</div>
                <input type={t} value={v} onChange={e => sv(e.target.value)} placeholder={ph} />
              </div>
            ))}
            <PrimaryBtn style={{ marginTop: 6, width: "100%", padding: "12px" }} disabled={loading}>
              {loading ? "Authenticating…" : (mode === "login" ? "Access System" : "Create Account")}
            </PrimaryBtn>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAVS = [
  { id: "overview",    emoji: "⬡", label: "Overview" },
  { id: "cases",       emoji: "◈", label: "Cases" },
  { id: "sentiment",   emoji: "◎", label: "Sentiment" },
  { id: "trends",      emoji: "↗", label: "Trends" },
  { id: "network",     emoji: "⬡", label: "Network" },
  { id: "fakenews",    emoji: "⊗", label: "Fake News" },
  { id: "segments",    emoji: "◉", label: "Segments" },
  { id: "ads",         emoji: "◈", label: "Ads & CTR" },
  { id: "influencers", emoji: "★", label: "Influencers" },
  { id: "competitors", emoji: "⊕", label: "Competitors" },
  { id: "predict",     emoji: "◇", label: "Prediction" },
  { id: "recommend",   emoji: "◇", label: "Recommend" },
];

const Sidebar = ({ active, set, user, logout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const w = collapsed ? 64 : 220;
  return (
    <div style={{
      position: "fixed", left: 0, top: 0, width: w, height: "100vh",
      background: "rgba(5,11,24,0.97)", borderRight: "1px solid rgba(59,130,246,0.12)",
      display: "flex", flexDirection: "column", zIndex: 1000,
      transition: "width .25s cubic-bezier(.4,0,.2,1)",
      backdropFilter: "blur(20px)"
    }}>
      <div style={{ height: 2, background: "linear-gradient(90deg,var(--b700),var(--b400),var(--cyan))", flexShrink: 0 }} />
      <div style={{
        padding: collapsed ? "14px 0" : "14px 14px",
        borderBottom: "1px solid rgba(59,130,246,0.1)",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between", gap: 8, flexShrink: 0
      }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg,var(--b700),var(--b500))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--display)", fontWeight: 700, fontSize: 12, color: "#fff",
              boxShadow: "0 0 16px rgba(59,130,246,0.35)"
            }}>SMA</div>
            <div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 14, letterSpacing: -.2, lineHeight: 1 }}>Analytics</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--b400)", marginTop: 2, letterSpacing: 1.5 }}>PORTAL</div>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(c => !c)} style={{
          width: 26, height: 26, borderRadius: 6, border: "1px solid var(--bd)",
          background: "var(--bg3)", cursor: "pointer", color: "var(--t2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, flexShrink: 0, transition: "all .15s"
        }}>
          {collapsed ? ">>" : "<<"}
        </button>
      </div>

      <div style={{
        padding: collapsed ? "10px 0" : "10px 12px",
        borderBottom: "1px solid rgba(59,130,246,0.08)",
        display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
        gap: 9, flexShrink: 0
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--display)", fontWeight: 700, fontSize: 12, color: "var(--b300)"
        }}>{user?.[0]?.toUpperCase()}</div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
              <StatusDot pulse />
              <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--b400)", letterSpacing: 1 }}>ACTIVE</span>
            </div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "6px 6px", overflowX: "hidden" }}>
        {!collapsed && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--t4)", letterSpacing: 2, padding: "8px 8px 4px", textTransform: "uppercase" }}>
            Navigation
          </div>
        )}
        {NAVS.map(n => {
          const on = active === n.id;
          return (
            <button key={n.id} onClick={() => set(n.id)}
              title={collapsed ? n.label : undefined}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: 9, padding: collapsed ? "9px 0" : "8px 10px",
                borderRadius: "var(--r)",
                background: on ? "rgba(59,130,246,0.12)" : "transparent",
                border: `1px solid ${on ? "rgba(59,130,246,0.28)" : "transparent"}`,
                cursor: "pointer", textAlign: "left", transition: "all .15s", marginBottom: 2,
                boxShadow: on ? "inset 0 0 20px rgba(59,130,246,0.05)" : "none"
              }}
              onMouseOver={e => { if (!on) e.currentTarget.style.background = "rgba(59,130,246,0.06)"; }}
              onMouseOut={e => { if (!on) e.currentTarget.style.background = "transparent"; }}
            >
              <span style={{
                fontFamily: "var(--mono)", fontSize: 14, width: 20, textAlign: "center",
                flexShrink: 0, color: on ? "var(--b400)" : "var(--t3)", lineHeight: 1
              }}>{n.emoji}</span>
              {!collapsed && (
                <span style={{
                  fontWeight: on ? 600 : 400, fontSize: 13, color: on ? "var(--b300)" : "var(--t1)",
                  letterSpacing: -.1, whiteSpace: "nowrap"
                }}>{n.label}</span>
              )}
              {on && !collapsed && (
                <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "var(--b400)", animation: "pulse 2s infinite" }} />
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "6px 6px 12px", flexShrink: 0 }}>
        <button onClick={logout}
          title={collapsed ? "Sign Out" : undefined}
          style={{
            width: "100%", padding: collapsed ? "9px 0" : "8px 0",
            background: "none", border: "1px solid rgba(59,130,246,0.12)", borderRadius: "var(--r)",
            color: "var(--t3)", fontFamily: "var(--font)", fontSize: 12, cursor: "pointer",
            transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = "var(--rose)"; e.currentTarget.style.color = "var(--rose)"; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.12)"; e.currentTarget.style.color = "var(--t3)"; }}
        >
          <span style={{ fontSize: 13, fontFamily: "var(--mono)" }}>⏻</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

// ─── PAGE WRAPPER ─────────────────────────────────────────────────────────────
const Page = ({ children }) => (
  <div className="pg" style={{ padding: "28px 32px", maxWidth: 1160 }}>
    {children}
  </div>
);

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
const Overview = ({ go }) => {
  const [posts, setPosts] = useState(null);
  useEffect(() => { api.debugPosts().then(setPosts); }, []);

  const mockActivity = Array.from({ length: 14 }, (_, i) => ({
    day: `D${i + 1}`, posts: Math.floor(20 + Math.random() * 80),
    engagement: Math.floor(40 + Math.random() * 60)
  }));

  const mods = [
    { id: "sentiment",   emoji: "◎", label: "Sentiment",    color: "#3b82f6",  desc: "TextBlob NLP" },
    { id: "trends",      emoji: "↗", label: "Trends",       color: "#22d3ee",  desc: "Hashtag ranking" },
    { id: "network",     emoji: "⬡", label: "Network",      color: "#a78bfa",  desc: "NetworkX graph" },
    { id: "fakenews",    emoji: "⊗", label: "Fake News",    color: "#fb7185",  desc: "LR classifier" },
    { id: "segments",    emoji: "◉", label: "Segments",     color: "#34d399",  desc: "K-Means clusters" },
    { id: "ads",         emoji: "◈", label: "Ads & CTR",    color: "#fbbf24",  desc: "Engagement opt." },
    { id: "influencers", emoji: "★", label: "Influencers",  color: "#22d3ee",  desc: "Eigenvector score" },
    { id: "competitors", emoji: "⊕", label: "Competitors",  color: "#a78bfa",  desc: "Brand comparison" },
    { id: "predict",     emoji: "◇", label: "Prediction",   color: "#fbbf24",  desc: "LinearRegression" },
    { id: "recommend",   emoji: "◇", label: "Recommend",    color: "#3b82f6",  desc: "TF-IDF cosine" },
  ];

  return (
    <Page>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--b400)", letterSpacing: 3, marginBottom: 8, textTransform: "uppercase" }}>
            ◈ Social Media Analytics Platform
          </div>
          <h1 style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 32, letterSpacing: -.5, lineHeight: 1 }}>
            Analytics <span style={{ color: "var(--b400)" }}>Overview</span>
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t2)" }}>
            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
            <StatusDot pulse />
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--b400)", letterSpacing: 1 }}>SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { v: posts?.count ?? "—", l: "Posts Loaded",   c: "var(--b400)",   icon: "◈" },
          { v: "12",                l: "Modules Active", c: "var(--cyan)",    icon: "◎" },
          { v: "2",                 l: "Platforms",      c: "var(--violet)",  icon: "⬡" },
          { v: "6",                 l: "ML Models",      c: "var(--emerald)", icon: "◇" },
        ].map(s => <KPICard key={s.l} value={s.v} label={s.l} color={s.c} icon={s.icon} />)}
      </div>

      <GlassCard style={{ padding: 20, marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--b400)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>
              ◈ Activity Overview — 14 Day Window
            </div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, color: "var(--t1)" }}>Posts & Engagement Trend</div>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: "var(--mono)", color: "var(--t2)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 2, background: "#3b82f6", display: "inline-block" }} />Posts
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 2, background: "#22d3ee", display: "inline-block" }} />Engagement
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={mockActivity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gEng" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.07)" />
            <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#475569", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="posts" stroke="#3b82f6" strokeWidth={2} fill="url(#gPosts)" name="Posts" dot={false} />
            <Area type="monotone" dataKey="engagement" stroke="#22d3ee" strokeWidth={2} fill="url(#gEng)" name="Engagement" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      {posts?.sample?.length > 0 && (
        <GlassCard style={{ padding: 20, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <StatusDot pulse />
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--b400)", letterSpacing: 2, textTransform: "uppercase" }}>Live Feed</span>
          </div>
          {posts.sample.map((t, i) => (
            <div key={i} style={{
              padding: "10px 14px", background: "rgba(59,130,246,0.04)",
              borderRadius: "var(--r)", marginBottom: 8,
              fontFamily: "var(--mono)", fontSize: 11, color: "var(--t1)", lineHeight: 1.7,
              borderLeft: "2px solid rgba(59,130,246,0.4)"
            }}>
              {t.length > 160 ? t.slice(0, 160) + "…" : t}
            </div>
          ))}
        </GlassCard>
      )}

      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--t4)", letterSpacing: 2.5, marginBottom: 14, textTransform: "uppercase" }}>
        ◈ 10 Analytics Modules
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}>
        {mods.map(m => (
          <GlassCard key={m.id} hover onClick={() => go(m.id)} style={{ padding: "18px 16px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${m.color}50, transparent)`
            }} />
            <div style={{ fontFamily: "var(--mono)", fontSize: 18, color: m.color, marginBottom: 10 }}>{m.emoji}</div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, color: m.color, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", lineHeight: 1.5 }}>{m.desc}</div>
          </GlassCard>
        ))}
      </div>
    </Page>
  );
};

// ─── CASES ────────────────────────────────────────────────────────────────────
const Cases = () => {
  const [f, setF] = useState({ name: "", keyword: "", platform: "X", dataset_id: "" });
  const [caseId, setCaseId] = useState(null), [fetchId, setFetchId] = useState("");
  const [res, setRes] = useState(null), [l1, setL1] = useState(false), [l2, setL2] = useState(false);
  const [msg, setMsg] = useState(null);
  const create = async e => {
    e.preventDefault(); setL1(true); setMsg(null);
    const r = await api.createCase(f.name, f.keyword, f.platform, f.dataset_id);
    if (r.error) setMsg({ t: "error", m: r.error });
    else { setMsg({ t: "success", m: `Case created — ID: ${r.case_id}` }); setCaseId(r.case_id); }
    setL1(false);
  };
  const fetch = async () => {
    if (!fetchId) return; setL2(true); setRes(null);
    setRes(await api.fetchCase(fetchId)); setL2(false);
  };
  return (
    <Page>
      <SectionHeader icon="◈" title="Case Management" sub="Create cases and pull data from Apify datasets" color="var(--cyan)" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <GlassCard style={{ padding: 24 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--b400)", letterSpacing: 2, marginBottom: 18, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase" }}>
            <StatusDot />New Case
          </div>
          {msg && <ErrBox type={msg.t} msg={msg.m} />}
          <form onSubmit={create} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[["Case Name", "name", "Tesla Brand Analysis"], ["Keyword", "keyword", "#Tesla"], ["Apify Dataset ID", "dataset_id", "abc123xyz"]].map(([l, k, ph]) => (
              <div key={k}>
                <div style={{ fontSize: 11, fontWeight: 500, color: "var(--t2)", marginBottom: 7, fontFamily: "var(--mono)", letterSpacing: .5 }}>{l}</div>
                <input value={f[k]} onChange={e => setF(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--t2)", marginBottom: 7, fontFamily: "var(--mono)", letterSpacing: .5 }}>Platform</div>
              <select value={f.platform} onChange={e => setF(p => ({ ...p, platform: e.target.value }))}>
                <option value="X">X (Twitter)</option>
                <option value="Facebook">Facebook</option>
              </select>
            </div>
            <PrimaryBtn disabled={l1} style={{ marginTop: 4 }}>{l1 ? "Creating…" : "Create Case"}</PrimaryBtn>
          </form>
        </GlassCard>
        <GlassCard style={{ padding: 24 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--cyan)", letterSpacing: 2, marginBottom: 18, display: "flex", alignItems: "center", gap: 6, textTransform: "uppercase" }}>
            <StatusDot color="var(--cyan)" />Fetch from Apify
          </div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t2)", marginBottom: 18, lineHeight: 1.8 }}>
            Enter your Case ID to pull posts from the linked Apify dataset into the local SQLite database.
          </p>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--t2)", marginBottom: 7, fontFamily: "var(--mono)", letterSpacing: .5 }}>Case ID</div>
            <input value={fetchId} onChange={e => setFetchId(e.target.value)} placeholder={caseId ? String(caseId) : "e.g. 1"} />
          </div>
          <PrimaryBtn color="var(--cyan)" disabled={l2 || !fetchId} onClick={fetch} style={{ width: "100%", marginBottom: 18 }}>
            {l2 ? "Fetching…" : "Fetch Posts"}
          </PrimaryBtn>
          {res && (
            <div style={{ padding: 14, background: "rgba(59,130,246,0.06)", borderRadius: "var(--r)", border: "1px solid var(--bd)" }}>
              {res.error ? <ErrBox type="error" msg={res.error} /> : (
                <>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--b400)", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>Fetch Complete</div>
                  {[["Case", res.case, "var(--t1)"], ["Saved", res.saved, "var(--emerald)"], ["Skipped", res.skipped, "var(--amber)"]].map(([l, v, c]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "var(--t2)" }}>{l}</span>
                      <span style={{ color: c, fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
          <Ruler />
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--t4)", marginBottom: 10, letterSpacing: 2, textTransform: "uppercase" }}>How to Get Dataset ID</div>
          {["Run a scraper on apify.com", "Go to Storage → Datasets", "Copy the Dataset ID string", "Paste above and click Fetch"].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 8, fontFamily: "var(--mono)", fontSize: 11, color: "var(--t2)", marginBottom: 6 }}>
              <span style={{ color: "var(--b400)", fontWeight: 700 }}>{i + 1}.</span>{s}
            </div>
          ))}
        </GlassCard>
      </div>
    </Page>
  );
};

// ─── SENTIMENT ────────────────────────────────────────────────────────────────
const Sentiment = () => {
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [err, setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.sentiment(); if (r.error) setErr(r.error); else setData(r); setLoading(false); };
  const SC = { Positive: "#3b82f6", Negative: "#fb7185", Neutral: "#fbbf24" };

  const chartData = data ? Object.entries(data.summary || {}).map(([k, v]) => ({ name: k, value: v, fill: SC[k] })) : [];

  return (
    <Page>
      <SectionHeader icon="◎" title="Sentiment Analysis" sub="TextBlob NLP — Positive / Negative / Neutral classification"
        color="var(--b400)" right={<PrimaryBtn onClick={run} disabled={loading}>{loading ? "Analysing…" : "Run Analysis"}</PrimaryBtn>} />
      {err && <ErrBox type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {Object.entries(data.summary || {}).map(([k, v]) => <KPICard key={k} value={v} label={k} color={SC[k]} />)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Distribution</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                {chartData.map((d, i) => (
                  <span key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "var(--mono)", color: "var(--t2)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: d.fill, display: "inline-block" }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} innerRadius={44} dataKey="value" paddingAngle={3}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>By Count</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.07)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#475569", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>
          <GlassCard style={{ padding: 20 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>
              Classified Posts ({data.data?.length ?? 0})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
              {(data.data || []).slice(0, 30).map((p, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                  background: `${SC[p.sentiment] || "#3b82f6"}08`, borderRadius: "var(--r)",
                  borderLeft: `2px solid ${SC[p.sentiment] || "var(--bd)"}`
                }}>
                  <Tag color={SC[p.sentiment] || "var(--t2)"}>{p.sentiment}</Tag>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t1)", lineHeight: 1.6, flex: 1 }}>
                    {(p.text || "").slice(0, 130)}{(p.text || "").length > 130 ? "…" : ""}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </Page>
  );
};

// ─── TRENDS ───────────────────────────────────────────────────────────────────
const Trends = () => {
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [err, setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.trends(); if (r.error) setErr(r.error); else setData(r); setLoading(false); };
  const norm = (arr = []) => arr.map(x => {
    if (typeof x === "string") return { label: x, count: 1 };
    const label = x.hashtag ?? x.tag ?? x._id ?? x.name ?? Object.values(x)[0];
    const count = Number(x.count ?? x.frequency ?? x.value ?? Object.values(x)[1]) || 0;
    return { label: String(label || ""), count };
  }).filter(x => x.label).sort((a, b) => b.count - a.count);
  const tags = norm(data?.trending_hashtags);
  const chartData = tags.slice(0, 12).map((t, i) => ({ name: t.label.slice(0, 14), count: t.count }));

  return (
    <Page>
      <SectionHeader icon="↗" title="Trending Topics" sub="Hashtag frequency ranking across all collected posts"
        color="var(--cyan)" right={<PrimaryBtn color="var(--cyan)" onClick={run} disabled={loading}>{loading ? "Scanning…" : "Detect Trends"}</PrimaryBtn>} />
      {err && <ErrBox type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            <KPICard value={data.total_posts ?? 0} label="Posts Analysed" color="var(--cyan)" />
            <KPICard value={tags.length} label="Unique Hashtags" color="var(--b400)" />
            <KPICard value={tags[0]?.count ?? 0} label="Top Tag Count" color="var(--violet)" sub={tags[0]?.label} />
          </div>
          {tags.length > 0 ? (
            <>
              <GlassCard style={{ padding: 20 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>
                  Top {Math.min(tags.length, 12)} Trending Hashtags
                </div>
                <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 42)}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.06)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#475569", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]} name="Count"
                      background={{ fill: "rgba(34,211,238,0.04)", radius: [0, 4, 4, 0] }} />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
              <GlassCard style={{ padding: 20 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>
                  All Hashtags — {tags.length} Detected
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {tags.map((h, i) => {
                    const op = Math.max(0.3, h.count / (tags[0].count || 1));
                    return (
                      <span key={i} style={{
                        padding: "4px 12px", borderRadius: 20,
                        background: `rgba(34,211,238,${op * .15})`,
                        border: `1px solid rgba(34,211,238,${op * .4})`,
                        fontFamily: "var(--mono)", fontSize: 11, color: "var(--cyan)"
                      }}>
                        {h.label} <span style={{ opacity: .5, fontSize: 10 }}>{h.count}</span>
                      </span>
                    );
                  })}
                </div>
              </GlassCard>
            </>
          ) : <ErrBox type="warn" msg="No hashtags found. Fetch data via Cases first." />}
        </div>
      )}
    </Page>
  );
};

// ─── NETWORK ──────────────────────────────────────────────────────────────────
const Network = () => {
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [err, setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.network(); if (r.error) setErr(r.error); else setData(r); setLoading(false); };
  const ni = (arr = []) => arr.map(x => typeof x === "string" ? { name: x, score: null } : { name: x.username ?? x.user ?? x.name ?? "unknown", score: x.score ?? x.centrality ?? null });
  const nc = (arr = []) => arr.map(x => typeof x === "string" ? x : (x.user ?? x.username ?? JSON.stringify(x)));

  const influencers = ni(data?.top_influencers || []);
  const radarData = influencers.slice(0, 6).map(inf => ({
    name: `@${inf.name.slice(0, 8)}`, score: inf.score ? parseFloat(Number(inf.score * 100).toFixed(2)) : 0
  }));

  return (
    <Page>
      <SectionHeader icon="⬡" title="Network Analysis" sub="NetworkX — community detection, influencers & bridge nodes"
        color="var(--violet)" right={<PrimaryBtn color="var(--violet)" onClick={run} disabled={loading}>{loading ? "Mapping…" : "Build Graph"}</PrimaryBtn>} />
      {err && <ErrBox type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            <KPICard value={data.total_nodes ?? 0} label="Nodes (Users)" color="var(--b400)" />
            <KPICard value={data.total_edges ?? 0} label="Edges (Connections)" color="var(--violet)" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: influencers.length > 0 ? "1fr 1fr" : "1fr", gap: 16 }}>
            {influencers.length > 0 && (
              <GlassCard style={{ padding: 20 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--violet)", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>
                  Influence Radar
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(167,139,250,0.15)" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "Space Mono" }} />
                    <Radar name="Score" dataKey="score" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </GlassCard>
            )}
            {influencers.length > 0 && (
              <GlassCard style={{ padding: 20 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--violet)", letterSpacing: 2, marginBottom: 14, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <StatusDot color="var(--violet)" />Top Influencers
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {influencers.slice(0, 8).map((inf, i) => {
                    const maxS = influencers[0]?.score || 1;
                    const rankLabel = i < 3 ? ["#1", "#2", "#3"][i] : `#${i + 1}`;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "rgba(167,139,250,0.06)", borderRadius: "var(--r)" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 12, width: 24, flexShrink: 0, color: "var(--violet)" }}>{rankLabel}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>@{inf.name}</div>
                          {inf.score && <div style={{ height: 3, background: "var(--bg4)", borderRadius: 2 }}>
                            <div style={{ height: "100%", width: `${(inf.score / maxS) * 100}%`, background: "var(--violet)", borderRadius: 2, transition: "width .8s ease", transitionDelay: `${i * .07}s` }} />
                          </div>}
                        </div>
                        {inf.score && <Tag color="var(--violet)">{Number(inf.score).toFixed(4)}</Tag>}
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}
          </div>
          {nc(data.key_connectors || []).length > 0 && (
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Key Connectors — Bridge Nodes</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {nc(data.key_connectors).map((c, i) => (
                  <span key={i} style={{ padding: "5px 14px", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 4, fontFamily: "var(--mono)", fontSize: 11, color: "var(--violet)" }}>{c}</span>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </Page>
  );
};

// ─── FAKE NEWS ────────────────────────────────────────────────────────────────
const FakeNews = () => {
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [err, setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.fakeNews(); if (r.error) setErr(r.error); else setData(r); setLoading(false); };
  const suspicious = data?.summary?.Suspicious ?? 0;
  const real = data?.summary?.["Likely Real"] ?? 0;
  const total = suspicious + real || 1;
  const barData = [
    { name: "Suspicious", value: suspicious, pct: Math.round(suspicious / total * 100) },
    { name: "Likely Real", value: real, pct: Math.round(real / total * 100) }
  ];

  return (
    <Page>
      <SectionHeader icon="⊗" title="Fake News Detection" sub="TF-IDF + Logistic Regression misinformation classifier"
        color="var(--rose)" right={<PrimaryBtn color="var(--rose)" style={{ color: "#fff" }} onClick={run} disabled={loading}>{loading ? "Scanning…" : "Run Detection"}</PrimaryBtn>} />
      {err && <ErrBox type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            <KPICard value={suspicious} label="Suspicious Posts" color="var(--rose)" icon="⊗" />
            <KPICard value={real} label="Likely Real Posts" color="var(--emerald)" icon="◎" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Distribution</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[{ name: "Suspicious", value: suspicious }, { name: "Likely Real", value: real }]}
                    cx="50%" cy="50%" outerRadius={80} innerRadius={44} dataKey="value" paddingAngle={4}>
                    <Cell fill="#fb7185" />
                    <Cell fill="#34d399" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "var(--mono)", color: "var(--t2)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#fb7185", display: "inline-block" }} />Suspicious
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "var(--mono)", color: "var(--t2)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: "#34d399", display: "inline-block" }} />Likely Real
                </span>
              </div>
            </GlassCard>
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Breakdown</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(251,113,133,0.07)" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    <Cell fill="#fb7185" />
                    <Cell fill="#34d399" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>
          <GlassCard style={{ padding: 20 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>
              Classified Posts ({data.data?.length ?? 0})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
              {(data.data || []).slice(0, 30).map((p, i) => {
                const s = p.prediction === "Suspicious";
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                    background: s ? "rgba(251,113,133,0.06)" : "rgba(52,211,153,0.06)",
                    borderRadius: "var(--r)", borderLeft: `2px solid ${s ? "var(--rose)" : "var(--emerald)"}`
                  }}>
                    <Tag color={s ? "var(--rose)" : "var(--emerald)"}>{s ? "Suspicious" : "Real"}</Tag>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t1)", lineHeight: 1.6, flex: 1 }}>
                      {(p.text || "").slice(0, 130)}{(p.text || "").length > 130 ? "…" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}
    </Page>
  );
};

// ─── SEGMENTS ─────────────────────────────────────────────────────────────────
const Segments = () => {
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [err, setErr] = useState(null), [k, setK] = useState(3);
  const run = async () => { setLoading(true); setErr(null); const r = await api.segments(k); if (r.error) setErr(r.error); else setData(r); setLoading(false); };
  const CC = ["#3b82f6", "#22d3ee", "#a78bfa", "#fbbf24", "#fb7185"];
  const extract = d => {
    if (!d) return [];
    const obj = d.clusters ?? d;
    if (typeof obj !== "object" || Array.isArray(obj)) return [];
    return Object.entries(obj).map(([lab, v]) => ({ label: lab, items: Array.isArray(v) ? v : [v] }));
  };
  const clusters = extract(data);
  const pieData = clusters.map((c, i) => ({ name: `Cluster ${i + 1}`, value: c.items.length, fill: CC[i % CC.length] }));

  return (
    <Page>
      <SectionHeader icon="◉" title="User Segmentation" sub="K-Means TF-IDF clustering — posts by content similarity"
        color="var(--violet)"
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--t2)", fontFamily: "var(--mono)" }}>k =</span>
            {[2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setK(n)} style={{
                width: 32, height: 32, borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 14,
                background: k === n ? "var(--b600)" : "var(--bg4)",
                color: k === n ? "#fff" : "var(--t2)",
                border: `1px solid ${k === n ? "var(--b500)" : "var(--bd)"}`, transition: "all .15s"
              }}>{n}</button>
            ))}
            <PrimaryBtn color="var(--violet)" onClick={run} disabled={loading} style={{ marginLeft: 4 }}>{loading ? "Clustering…" : "Run"}</PrimaryBtn>
          </div>
        } />
      {err && <ErrBox type="error" msg={err} />}
      {loading && <Spin />}
      {data && clusters.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(clusters.length, 4)},1fr)`, gap: 12 }}>
            {clusters.map((c, i) => <KPICard key={c.label} value={c.items.length} label={`Cluster ${i + 1}`} color={CC[i % CC.length]} />)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Cluster Distribution</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                {pieData.map((d, i) => (
                  <span key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "var(--mono)", color: "var(--t2)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: d.fill, display: "inline-block" }} />{d.name} ({d.value})
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Post Count per Cluster</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={clusters.map((c, i) => ({ name: `C${i + 1}`, posts: c.items.length, fill: CC[i % CC.length] }))} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.07)" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="posts" radius={[4, 4, 0, 0]} name="Posts">
                    {clusters.map((_, i) => <Cell key={i} fill={CC[i % CC.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>
          {clusters.map((c, i) => (
            <GlassCard key={c.label} style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: CC[i % CC.length] }} />
                <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, color: CC[i % CC.length] }}>Cluster {i + 1}</span>
                <Tag color={CC[i % CC.length]}>{c.items.length} posts</Tag>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
                  {c.label}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 200, overflowY: "auto" }}>
                {c.items.slice(0, 5).map((item, j) => {
                  const txt = typeof item === "string" ? item : (item.text ?? JSON.stringify(item));
                  return (
                    <div key={j} style={{
                      padding: "8px 12px", background: `${CC[i % CC.length]}06`, borderRadius: "var(--r)",
                      fontFamily: "var(--mono)", fontSize: 11, color: "var(--t1)", lineHeight: 1.6,
                      borderLeft: `2px solid ${CC[i % CC.length]}30`
                    }}>{txt.length > 140 ? txt.slice(0, 140) + "…" : txt}</div>
                  );
                })}
                {c.items.length > 5 && <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t3)", padding: "4px 12px" }}>+{c.items.length - 5} more posts…</div>}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </Page>
  );
};

// ─── ADS & CTR ────────────────────────────────────────────────────────────────
const Ads = () => {
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [err, setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.engagement(); if (r.error) setErr(r.error); else setData(r); setLoading(false); };
  return (
    <Page>
      <SectionHeader icon="◈" title="Ads & Engagement" sub="CTR · Conversion Rate · Campaign optimization insights"
        color="var(--emerald)" right={<PrimaryBtn color="var(--emerald)" onClick={run} disabled={loading}>{loading ? "Analysing…" : "Run Analysis"}</PrimaryBtn>} />
      {err && <ErrBox type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {data.top_posts?.length > 0 && (
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--emerald)", letterSpacing: 2, marginBottom: 14, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <StatusDot color="var(--emerald)" />Top Performing Posts
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.top_posts.map((p, i) => {
                  const txt = typeof p === "string" ? p : (p.text ?? "");
                  return (
                    <div key={i} style={{ padding: "12px 14px", background: "rgba(52,211,153,0.06)", borderRadius: "var(--r)", borderLeft: "2px solid rgba(52,211,153,0.5)" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t1)", marginBottom: 8, lineHeight: 1.7 }}>{txt.slice(0, 120) || JSON.stringify(p)}</div>
                      <div style={{ display: "flex", gap: 16 }}>
                        {p.likes !== undefined && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--rose)" }}>+ {p.likes} likes</span>}
                        {p.retweets !== undefined && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--b400)" }}>RT {p.retweets}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}
          {data.suggestions?.length > 0 && (
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--amber)", letterSpacing: 2, marginBottom: 14, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <StatusDot color="var(--amber)" />Optimization Recommendations
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.suggestions.map((s, i) => (
                  <div key={i} style={{ padding: "10px 14px", background: "rgba(251,191,36,0.06)", borderRadius: "var(--r)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--amber)", fontFamily: "var(--mono)", fontSize: 13 }}>→</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--t1)", lineHeight: 1.6 }}>{typeof s === "string" ? s : JSON.stringify(s)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </Page>
  );
};

// ─── INFLUENCERS ──────────────────────────────────────────────────────────────
const Influencers = () => {
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [err, setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.influencers(); if (r.error) setErr(r.error); else setData(r); setLoading(false); };
  const ni = (arr = []) => arr.map(x => typeof x === "string" ? { name: x, score: null } : { name: x.username ?? x.user ?? x.name ?? "unknown", score: x.score ?? x.centrality ?? null });
  const infs = ni(data?.top_influencers || []);
  const barData = infs.slice(0, 10).map((inf, i) => ({ name: `@${inf.name.slice(0, 10)}`, score: inf.score ? parseFloat(Number(inf.score).toFixed(4)) : 0 }));

  return (
    <Page>
      <SectionHeader icon="★" title="Influencer Detection" sub="Eigenvector centrality — opinion leader ranking"
        color="var(--amber)" right={<PrimaryBtn color="var(--amber)" onClick={run} disabled={loading}>{loading ? "Computing…" : "Find Influencers"}</PrimaryBtn>} />
      {err && <ErrBox type="error" msg={err} />}
      {loading && <Spin />}
      {data?.top_influencers && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {barData.length > 0 && (
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--amber)", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Influence Score Chart</div>
              <ResponsiveContainer width="100%" height={Math.max(260, barData.length * 38)}>
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(251,191,36,0.07)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#475569", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#fbbf24" radius={[0, 4, 4, 0]} name="Score"
                    background={{ fill: "rgba(251,191,36,0.04)", radius: [0, 4, 4, 0] }} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}
          <GlassCard style={{ padding: 20 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--amber)", letterSpacing: 2, marginBottom: 14, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
              <StatusDot color="var(--amber)" />Ranked by Influence Score
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {infs.map((inf, i) => {
                const maxS = infs[0]?.score || 1;
                const rankLabel = i < 3 ? ["#1", "#2", "#3"][i] : `#${i + 1}`;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "rgba(251,191,36,0.05)", borderRadius: "var(--r)" }}>
                    <span style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13, width: 26, flexShrink: 0, color: "var(--amber)" }}>{rankLabel}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 5 }}>@{inf.name}</div>
                      {inf.score && <div style={{ height: 3, background: "var(--bg4)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${(inf.score / maxS) * 100}%`, background: "linear-gradient(90deg,#92400e,#fbbf24)", borderRadius: 2, transition: "width .8s ease", transitionDelay: `${i * .07}s` }} />
                      </div>}
                    </div>
                    {inf.score && <Tag color="var(--amber)">{Number(inf.score).toFixed(4)}</Tag>}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}
    </Page>
  );
};

// ─── COMPETITORS ──────────────────────────────────────────────────────────────
const Competitors = () => {
  const [kw, setKw] = useState("tesla,ford,byd");
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [err, setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.competitors(kw); if (r.error) setErr(r.error); else setData(r); setLoading(false); };
  const CC = ["#3b82f6", "#22d3ee", "#a78bfa", "#fbbf24", "#fb7185"];

  // Robust extraction — mirrors the working version from the old UI
  const extractRows = (d) => {
    if (!d) return [];
    const obj = d.comparison ?? d;
    if (typeof obj !== "object" || Array.isArray(obj)) return [];
    return Object.entries(obj).map(([brand, stats]) => ({
      brand,
      stats: typeof stats === "object" ? stats : { value: stats }
    }));
  };

  const brandRows = extractRows(data);
  const mentionData = brandRows
    .filter(r => r.stats.count !== undefined)
    .map((r, i) => ({ name: r.brand.toUpperCase(), count: r.stats.count || 0, fill: CC[i % CC.length] }));

  return (
    <Page>
      <SectionHeader icon="⊕" title="Competitor Analysis" sub="Compare brands — mentions, sentiment, top keywords"
        color="var(--b400)" right={<PrimaryBtn color="var(--b400)" onClick={run} disabled={loading}>{loading ? "Comparing…" : "Compare"}</PrimaryBtn>} />
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--t2)", marginBottom: 8, fontFamily: "var(--mono)", letterSpacing: .5 }}>Keywords (comma-separated)</div>
        <input value={kw} onChange={e => setKw(e.target.value)} placeholder="tesla,ford,byd" style={{ maxWidth: 400 }} />
      </div>
      {err && <ErrBox type="error" msg={err} />}
      {loading && <Spin />}
      {data && brandRows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mentionData.length > 0 && (
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Mention Count Comparison</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                {mentionData.map(d => (
                  <span key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "var(--mono)", color: "var(--t2)" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: d.fill, display: "inline-block" }} />{d.name}
                  </span>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mentionData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.07)" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Mentions">
                    {mentionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          )}
          {brandRows.map(({ brand, stats }, i) => (
            <GlassCard key={brand} style={{ padding: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${CC[i % CC.length]}60, transparent)` }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: CC[i % CC.length] }} />
                <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 18, color: CC[i % CC.length] }}>{brand.toUpperCase()}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10 }}>
                {Object.entries(stats).map(([k, v]) => (
                  <div key={k} style={{ padding: "12px 10px", background: `${CC[i % CC.length]}08`, borderRadius: "var(--r)", textAlign: "center", border: `1px solid ${CC[i % CC.length]}15` }}>
                    <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 18, color: CC[i % CC.length] }}>
                      {typeof v === "number" ? (v % 1 !== 0 ? v.toFixed(2) : v) : typeof v === "object" ? JSON.stringify(v).slice(0, 20) : String(v)}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--t3)", marginTop: 5, textTransform: "uppercase", letterSpacing: .5, fontFamily: "var(--mono)" }}>{k.replace(/_/g, " ")}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
      {/* Fallback: show raw JSON so the response is never silently lost */}
      {data && brandRows.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ErrBox type="info" msg="Response received — displaying raw output below. Check that keywords match posts in your database." />
          <RawJSON data={data} />
        </div>
      )}
    </Page>
  );
};

// ─── PREDICTION ───────────────────────────────────────────────────────────────
const Predict = () => {
  const [kw, setKw] = useState("tesla");
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [err, setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.predict(kw); if (r.error) setErr(r.error); else setData(r); setLoading(false); };
  const hist = Array.isArray(data?.history) ? data.history : null;
  const preds = Array.isArray(data?.predictions) ? data.predictions : null;
  const histChart = hist?.map((v, i) => ({ t: `T${i}`, value: v, type: "history" }));
  const predChart = preds?.map((v, i) => ({ t: `T+${i + 1}`, value: parseFloat(Number(v).toFixed(2)), type: "forecast" }));
  const combined = [...(histChart || []), ...(predChart || [])];

  return (
    <Page>
      <SectionHeader icon="◇" title="Popularity Prediction" sub="LinearRegression ML — engagement forecasting by keyword"
        color="var(--violet)" right={<PrimaryBtn color="var(--violet)" onClick={run} disabled={loading}>{loading ? "Predicting…" : "Predict"}</PrimaryBtn>} />
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--t2)", marginBottom: 8, fontFamily: "var(--mono)", letterSpacing: .5 }}>Keyword</div>
        <input value={kw} onChange={e => setKw(e.target.value)} placeholder="tesla" style={{ maxWidth: 300 }} />
      </div>
      {err && <ErrBox type="error" msg={err} />}
      {loading && <Spin />}
      {data && !data.error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            <KPICard value={hist?.length ?? 0} label="Historical Points" color="var(--b400)" icon="◈" />
            <KPICard value={hist?.reduce((a, b) => a + b, 0) ?? 0} label="Total Mentions" color="var(--violet)" icon="◉" />
            <KPICard value={preds?.length ?? 0} label="Forecast Periods" color="var(--cyan)" icon="◇" />
          </div>
          {combined.length > 0 && (
            <GlassCard style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--violet)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    <StatusDot color="var(--violet)" />History + Forecast — "{kw}"
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: "var(--mono)", color: "var(--t2)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 2, background: "#a78bfa", display: "inline-block" }} />History
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 2, background: "#22d3ee", display: "inline-block" }} />Forecast
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={combined} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.08)" />
                  <XAxis dataKey="t" tick={{ fill: "#475569", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 10, fontFamily: "Space Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2.5} dot={{ fill: "#a78bfa", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }} name="Value" />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>
          )}
          {preds && (
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--cyan)", letterSpacing: 2, marginBottom: 14, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <StatusDot color="var(--cyan)" />Forecast — Next {preds.length} Periods
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(88px,1fr))", gap: 8 }}>
                {preds.map((v, i) => (
                  <div key={i} style={{ padding: "12px 8px", background: "rgba(34,211,238,0.06)", borderRadius: "var(--r)", textAlign: "center", border: "1px solid rgba(34,211,238,0.12)" }}>
                    <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 18, color: "var(--cyan)" }}>{Number(v).toFixed(2)}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--t3)", marginTop: 4 }}>T+{i + 1}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}
      {data?.error && <ErrBox type="warn" msg={data.error} />}
    </Page>
  );
};

// ─── RECOMMEND ────────────────────────────────────────────────────────────────
const Recommend = () => {
  const [idx, setIdx] = useState(0);
  const [data, setData] = useState(null), [loading, setLoading] = useState(false), [err, setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.recommend(idx); if (r.error) setErr(r.error); else setData(r); setLoading(false); };
  return (
    <Page>
      <SectionHeader icon="◇" title="Content Recommendations" sub="TF-IDF cosine similarity — collaborative filtering"
        color="var(--b400)" right={<PrimaryBtn onClick={run} disabled={loading}>{loading ? "Finding…" : "Get Recommendations"}</PrimaryBtn>} />
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--t2)", marginBottom: 8, fontFamily: "var(--mono)", letterSpacing: .5 }}>Query Post Index</div>
        <input type="number" min={0} value={idx} onChange={e => setIdx(Number(e.target.value))} style={{ maxWidth: 120 }} />
      </div>
      {err && <ErrBox type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {data.selected_post && (
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--b400)", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <StatusDot />Query Post
              </div>
              <div style={{ padding: "12px 14px", background: "rgba(59,130,246,0.08)", borderRadius: "var(--r)", fontFamily: "var(--mono)", fontSize: 12, color: "var(--text)", lineHeight: 1.7, borderLeft: "2px solid var(--b500)" }}>
                {data.selected_post}
              </div>
            </GlassCard>
          )}
          {data.recommendations?.length > 0 && (
            <GlassCard style={{ padding: 20 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>
                Similar Posts ({data.recommendations.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.recommendations.map((r, i) => {
                  const txt = typeof r === "string" ? r : (r.text ?? JSON.stringify(r));
                  return (
                    <div key={i} style={{ padding: "11px 14px", background: "rgba(59,130,246,0.05)", borderRadius: "var(--r)", borderLeft: "2px solid rgba(59,130,246,0.25)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <Tag>#{i + 1}</Tag>
                        {r.similarity && <Tag color="var(--b400)">sim: {Number(r.similarity).toFixed(4)}</Tag>}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t1)", lineHeight: 1.6 }}>
                        {txt.slice(0, 160)}{txt.length > 160 ? "…" : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}
          {data.message && <ErrBox type="info" msg={data.message} />}
        </div>
      )}
    </Page>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem("sma_user"));
  const [page, setPage] = useState("overview");
  const logout = () => { localStorage.removeItem("sma_token"); localStorage.removeItem("sma_user"); setUser(null); };

  const PAGES = {
    overview: <Overview go={setPage} />, cases: <Cases />, sentiment: <Sentiment />,
    trends: <Trends />, network: <Network />, fakenews: <FakeNews />,
    segments: <Segments />, ads: <Ads />, influencers: <Influencers />,
    competitors: <Competitors />, predict: <Predict />, recommend: <Recommend />
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="bg-grid" /><div className="bg-glow" />
      {!user ? <Login onLogin={setUser} /> : (
        <div style={{ display: "flex", minHeight: "100vh", position: "relative", zIndex: 1 }}>
          <Sidebar active={page} set={setPage} user={user} logout={logout} />
          <main style={{
            flex: 1, overflowY: "auto", minHeight: "100vh",
            background: "transparent", marginLeft: 220,
            transition: "margin-left .25s cubic-bezier(.4,0,.2,1)"
          }}>
            {PAGES[page] ?? <Overview go={setPage} />}
          </main>
        </div>
      )}
    </>
  );
}