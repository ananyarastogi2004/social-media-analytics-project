import { useState, useEffect, useRef } from "react";

// ─── API ──────────────────────────────────────────────────────────────────────
const BASE = "http://localhost:8000";
const api = {
  h: () => { const t = localStorage.getItem("sma_token"); return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }; },
  r: async (path, opts = {}) => { try { const res = await fetch(`${BASE}${path}`, { ...opts, headers: api.h() }); return await res.json(); } catch (e) { return { error: e.message }; } },
  signup: (u, p) => api.r(`/auth/signup?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`, { method: "POST" }),
  login: (u, p) => api.r(`/auth/login?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`, { method: "POST" }),
  createCase: (n, k, pl, d) => api.r(`/cases/create?name=${encodeURIComponent(n)}&keyword=${encodeURIComponent(k)}&platform=${encodeURIComponent(pl)}&dataset_id=${encodeURIComponent(d)}`, { method: "POST" }),
  fetchCase: (id) => api.r(`/apify/fetch-by-case?case_id=${id}`, { method: "POST" }),
  sentiment: () => api.r("/analytics/sentiment"),
  trends: () => api.r("/analytics/trends"),
  network: () => api.r("/analytics/network"),
  recommend: (i = 0) => api.r(`/analytics/recommend?index=${i}`),
  fakeNews: () => api.r("/analytics/fake-news"),
  segments: (k = 3) => api.r(`/analytics/segments?k=${k}`),
  engagement: () => api.r("/analytics/engagement"),
  influencers: () => api.r("/analytics/influencers"),
  competitors: (kw) => api.r(`/analytics/competitors?keywords=${encodeURIComponent(kw)}`),
  predict: (kw) => api.r(`/analytics/predict?keyword=${encodeURIComponent(kw)}`),
  debugPosts: () => api.r("/analytics/debug-posts"),
};

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@300;400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#050505;--bg1:#0a0a0a;--bg2:#0f0f0f;--bg3:#161616;--bg4:#1c1c1c;
  --g:#00ff88;--g2:#00cc66;--g3:#009944;--g4:#00ff8820;
  --red:#ff2244;--amber:#ffaa00;--blue:#4488ff;--purple:#aa44ff;
  --text:#f0f0f0;--t2:#888;--t3:#444;--t4:#222;
  --border:#1e1e1e;--border2:#2a2a2a;
  --font:'Rajdhani',sans-serif;--mono:'JetBrains Mono',monospace;
  --r:6px;
}
body{background:var(--bg);color:var(--text);font-family:var(--font);overflow-x:hidden}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--g3);border-radius:2px}
input,select,textarea{font-family:var(--mono);background:var(--bg3);border:1px solid var(--border2);color:var(--text);outline:none;border-radius:var(--r);padding:10px 14px;font-size:13px;width:100%;transition:border .2s}
input:focus,select:focus{border-color:var(--g)}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes glow{0%,100%{box-shadow:0 0 8px #00ff8820}50%{box-shadow:0 0 24px #00ff8840}}
@keyframes scanline{0%{top:-5%}100%{top:105%}}
@keyframes barIn{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.page{animation:fadeUp .35s ease}
.grid-bg{position:fixed;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(0,255,136,.025) 1px,transparent 1px),
  linear-gradient(90deg,rgba(0,255,136,.025) 1px,transparent 1px);
  background-size:48px 48px}
.scanline{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.scanline::after{content:'';position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(0,255,136,.06),transparent);animation:scanline 4s linear infinite}
`;

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
const Spin = () => <div style={{display:"flex",justifyContent:"center",padding:48}}><div style={{width:32,height:32,border:"2px solid var(--border2)",borderTopColor:"var(--g)",borderRadius:"50%",animation:"spin .7s linear infinite"}}/></div>;

const Btn = ({ children, onClick, color = "var(--g)", textColor = "var(--bg)", disabled, style = {}, size = "md" }) => {
  const pad = size === "sm" ? "6px 16px" : "10px 28px";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: pad, background: disabled ? "var(--bg4)" : color, color: disabled ? "var(--t3)" : textColor,
      border: "none", borderRadius: "var(--r)", fontFamily: "var(--font)", fontWeight: 700,
      fontSize: size === "sm" ? 12 : 14, letterSpacing: 2, textTransform: "uppercase",
      cursor: disabled ? "default" : "pointer", transition: "all .2s",
      boxShadow: disabled ? "none" : `0 0 20px ${color}40`,
      ...style
    }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.15)"; }}
      onMouseOut={e => { e.currentTarget.style.filter = "none"; }}
    >{children}</button>
  );
};

const Card = ({ children, style = {}, accent }) => (
  <div style={{
    background: "var(--bg2)", border: `1px solid ${accent ? accent + "30" : "var(--border)"}`,
    borderRadius: "var(--r)", padding: 20, position: "relative", overflow: "hidden",
    borderLeft: accent ? `3px solid ${accent}` : "1px solid var(--border)",
    ...style
  }}>{children}</div>
);

const Label = ({ children, color = "var(--g)" }) => (
  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color, letterSpacing: 2, textTransform: "uppercase", border: `1px solid ${color}30`, padding: "2px 8px", borderRadius: 3 }}>{children}</span>
);

const STitle = ({ icon, title, color = "var(--g)", sub }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 22, color }}>{icon}</span>
      <h1 style={{ fontFamily: "var(--font)", fontWeight: 700, fontSize: 26, color, letterSpacing: 1 }}>{title}</h1>
    </div>
    {sub && <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t2)", marginTop: 5, letterSpacing: 1 }}>{sub}</p>}
  </div>
);

const Toast = ({ type, msg }) => {
  const colors = { error: "var(--red)", success: "var(--g)", info: "var(--blue)", warn: "var(--amber)" };
  const c = colors[type] || colors.info;
  return <div style={{ padding: "10px 16px", borderRadius: "var(--r)", background: `${c}15`, border: `1px solid ${c}40`, fontFamily: "var(--mono)", fontSize: 12, color: c, marginBottom: 14 }}>{msg}</div>;
};

const BigStat = ({ value, label, color = "var(--g)", sub }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontFamily: "var(--font)", fontWeight: 700, fontSize: 40, color, lineHeight: 1, textShadow: `0 0 30px ${color}60` }}>{value}</div>
    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t2)", marginTop: 6, letterSpacing: 2 }}>{label}</div>
    {sub && <div style={{ fontFamily: "var(--mono)", fontSize: 11, color, marginTop: 4 }}>{sub}</div>}
  </div>
);

// Horizontal bar — robust: accepts any array with labelKey + valueKey
const HBar = ({ data = [], lk, vk, color = "var(--g)", max: maxOverride }) => {
  const vals = data.map(d => Number(d[vk]) || 0);
  const max = maxOverride || Math.max(...vals, 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {data.map((d, i) => {
        const label = String(d[lk] ?? "");
        const val = Number(d[vk]) || 0;
        const pct = (val / max) * 100;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 130, fontFamily: "var(--mono)", fontSize: 11, color: "var(--t2)", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0 }}>{label}</div>
            <div style={{ flex: 1, height: 18, background: "var(--bg4)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
              <div style={{
                height: "100%", width: `${pct}%`, transformOrigin: "left",
                background: `linear-gradient(90deg,${color}66,${color})`,
                borderRadius: 3, animation: "barIn .8s ease forwards",
                animationDelay: `${i * 0.04}s`, transform: "scaleX(0)"
              }} />
            </div>
            <div style={{ width: 36, fontFamily: "var(--mono)", fontSize: 11, color, textAlign: "right", flexShrink: 0 }}>{val}</div>
          </div>
        );
      })}
    </div>
  );
};

// SVG donut/pie
const Donut = ({ slices }) => {
  const COLORS = ["var(--g)", "var(--red)", "var(--amber)", "var(--blue)", "var(--purple)"];
  const total = slices.reduce((s, d) => s + (d.value || 0), 0) || 1;
  let angle = 0;
  const paths = slices.map((s, i) => {
    const pct = s.value / total;
    const a1 = (angle / 180) * Math.PI - Math.PI / 2;
    angle += pct * 360;
    const a2 = (angle / 180) * Math.PI - Math.PI / 2;
    const x1 = Math.cos(a1), y1 = Math.sin(a1), x2 = Math.cos(a2), y2 = Math.sin(a2);
    const large = pct > 0.5 ? 1 : 0;
    const col = COLORS[i % COLORS.length];
    return pct > 0.002 ? (
      <path key={i} d={`M0,0 L${x1},${y1} A1,1,0,${large},1,${x2},${y2} Z`}
        fill={col} opacity={.9} style={{ filter: `drop-shadow(0 0 6px ${col})` }} />
    ) : null;
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
      <svg width={130} height={130} viewBox="-1.1 -1.1 2.2 2.2">
        {paths}
        <circle r={0.52} fill="var(--bg2)" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--t2)" }}>{s.label}</span>
            <span style={{ fontFamily: "var(--font)", fontWeight: 700, fontSize: 15, color: COLORS[i % COLORS.length], marginLeft: 8 }}>{s.value}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--t3)" }}>({Math.round(s.value / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mini line sparkline
const Sparkline = ({ data = [], color = "var(--g)", height = 48 }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1), min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 280, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 8) - 4}`).join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
};

// JSON raw fallback
const RawJSON = ({ data }) => (
  <pre style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--t2)", background: "var(--bg3)", padding: 16, borderRadius: "var(--r)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 400 }}>
    {JSON.stringify(data, null, 2)}
  </pre>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const Login = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [u, setU] = useState(""); const [p, setP] = useState("");
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState(null);
  const go = async (e) => {
    e.preventDefault(); if (!u || !p) return setMsg({ t: "warn", m: "Fill all fields" });
    setLoading(true); setMsg(null);
    if (mode === "signup") {
      const r = await api.signup(u, p);
      if (r.error) setMsg({ t: "error", m: r.error }); else { setMode("login"); setMsg({ t: "success", m: "Account created. Sign in." }); }
    } else {
      const r = await api.login(u, p);
      if (!r.access_token) setMsg({ t: "error", m: r.error || "Invalid credentials" });
      else { localStorage.setItem("sma_token", r.access_token); localStorage.setItem("sma_user", u); onLogin(u); }
    }
    setLoading(false);
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <div className="grid-bg" /><div className="scanline" />
      {/* accent circles */}
      <div style={{ position:"fixed",top:"15%",right:"12%",width:320,height:320,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,255,136,.05) 0%,transparent 70%)",pointerEvents:"none" }} />
      <div style={{ position:"fixed",bottom:"15%",left:"10%",width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,34,68,.04) 0%,transparent 70%)",pointerEvents:"none" }} />
      <div className="page" style={{ width: "100%", maxWidth: 420, padding: 20, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          {/* Logo mark */}
          <div style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:60,height:60,border:"2px solid var(--g)",borderRadius:12,marginBottom:16,position:"relative" }}>
            <span style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:22,color:"var(--g)" }}>SMA</span>
            <span style={{ position:"absolute",top:-5,right:-5,width:10,height:10,borderRadius:"50%",background:"var(--g)",animation:"pulse 2s ease infinite" }} />
          </div>
          <div style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:30,color:"var(--text)",letterSpacing:2 }}>
            SOCIAL MEDIA <span style={{ color:"var(--g)" }}>ANALYTICS</span>
          </div>
          <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:4,marginTop:6 }}>BAI-404 · IGDTUW</div>
        </div>
        <Card>
          <div style={{ display:"flex",marginBottom:20,borderBottom:"1px solid var(--border)" }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex:1,padding:"10px 0",background:"none",border:"none",cursor:"pointer",
                fontFamily:"var(--font)",fontWeight:600,fontSize:14,letterSpacing:2,textTransform:"uppercase",
                color:mode===m?"var(--g)":"var(--t3)",
                borderBottom:mode===m?"2px solid var(--g)":"2px solid transparent",marginBottom:-1,transition:"all .2s"
              }}>{m === "login" ? "SIGN IN" : "REGISTER"}</button>
            ))}
          </div>
          {msg && <Toast type={msg.t} msg={msg.m} />}
          <form onSubmit={go} style={{ display:"flex",flexDirection:"column",gap:14 }}>
            {[["Username","text",u,setU],["Password","password",p,setP]].map(([lbl,type,val,set]) => (
              <div key={lbl}>
                <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:6 }}>{lbl.toUpperCase()}</div>
                <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={lbl==="Username"?"analyst":"••••••••"} />
              </div>
            ))}
            <Btn style={{ marginTop:4,width:"100%",justifyContent:"center" }} disabled={loading}>
              {loading ? "AUTHENTICATING..." : mode==="login" ? "ACCESS SYSTEM" : "CREATE ACCOUNT"}
            </Btn>
          </form>
        </Card>
      </div>
    </div>
  );
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV = [
  { id:"overview",  icon:"⊞", label:"OVERVIEW" },
  { id:"cases",     icon:"◫", label:"CASES" },
  { id:"sentiment", icon:"◎", label:"SENTIMENT" },
  { id:"trends",    icon:"↗", label:"TRENDS" },
  { id:"network",   icon:"⬡", label:"NETWORK" },
  { id:"fakenews",  icon:"⊗", label:"FAKE NEWS" },
  { id:"segments",  icon:"⊞", label:"SEGMENTS" },
  { id:"ads",       icon:"◆", label:"ADS & CTR" },
  { id:"influencers",icon:"★", label:"INFLUENCERS" },
  { id:"competitors",icon:"⊕", label:"COMPETITORS" },
  { id:"predict",   icon:"◇", label:"PREDICTION" },
  { id:"recommend", icon:"⊛", label:"RECOMMEND" },
];

const Sidebar = ({ active, set, user, logout }) => (
  <div style={{
    width: 220, flexShrink: 0, height: "100vh", position: "sticky", top: 0,
    background: "var(--bg1)", borderRight: "1px solid var(--border)",
    display: "flex", flexDirection: "column", zIndex: 100
  }}>
    {/* Brand */}
    <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid var(--border)" }}>
      <div style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:22,color:"var(--g)",letterSpacing:1,lineHeight:1 }}>SMA·PORTAL</div>
      <div style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--t3)",letterSpacing:3,marginTop:4 }}>ANALYTICS SYSTEM</div>
      {/* green accent line */}
      <div style={{ height:2,background:"linear-gradient(90deg,var(--g),transparent)",marginTop:12,borderRadius:1 }} />
    </div>
    {/* User */}
    <div style={{ padding:"12px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10 }}>
      <div style={{ width:32,height:32,borderRadius:8,background:"var(--bg4)",border:"1px solid var(--g)40",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font)",fontWeight:700,fontSize:14,color:"var(--g)" }}>
        {user?.[0]?.toUpperCase()}
      </div>
      <div>
        <div style={{ fontFamily:"var(--font)",fontWeight:600,fontSize:14,color:"var(--text)" }}>{user}</div>
        <div style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--g)",letterSpacing:1 }}>● ONLINE</div>
      </div>
    </div>
    {/* Nav */}
    <nav style={{ flex:1,overflowY:"auto",padding:"8px 0" }}>
      {NAV.map(n => {
        const on = active === n.id;
        return (
          <button key={n.id} onClick={() => set(n.id)} style={{
            width:"100%",display:"flex",alignItems:"center",gap:11,
            padding:"9px 18px",background:on?"rgba(0,255,136,.07)":"none",
            border:"none",borderLeft:on?"3px solid var(--g)":"3px solid transparent",
            cursor:"pointer",transition:"all .15s",textAlign:"left"
          }}
            onMouseOver={e => { if (!on) { e.currentTarget.style.background="rgba(0,255,136,.03)"; e.currentTarget.style.borderLeftColor="rgba(0,255,136,.25)"; }}}
            onMouseOut={e => { if (!on) { e.currentTarget.style.background="none"; e.currentTarget.style.borderLeftColor="transparent"; }}}
          >
            <span style={{ fontSize:13,color:on?"var(--g)":"var(--t3)",width:16,textAlign:"center" }}>{n.icon}</span>
            <span style={{ fontFamily:"var(--font)",fontWeight:on?700:500,fontSize:13,letterSpacing:1.5,color:on?"var(--g)":"var(--t2)" }}>{n.label}</span>
            {on && <div style={{ marginLeft:"auto",width:5,height:5,borderRadius:"50%",background:"var(--g)",animation:"pulse 2s infinite" }} />}
          </button>
        );
      })}
    </nav>
    <button onClick={logout} style={{
      margin:"10px 14px",padding:"9px 0",background:"none",border:"1px solid var(--border2)",
      borderRadius:"var(--r)",color:"var(--t2)",fontFamily:"var(--mono)",fontSize:10,
      letterSpacing:2,cursor:"pointer",transition:"all .2s"
    }}
      onMouseOver={e => { e.currentTarget.style.borderColor="var(--red)"; e.currentTarget.style.color="var(--red)"; }}
      onMouseOut={e => { e.currentTarget.style.borderColor="var(--border2)"; e.currentTarget.style.color="var(--t2)"; }}
    >SIGN OUT</button>
  </div>
);

// ─── OVERVIEW ─────────────────────────────────────────────────────────────────
const Overview = ({ go }) => {
  const [posts, setPosts] = useState(null);
  useEffect(() => { api.debugPosts().then(setPosts); }, []);
  const modules = [
    {id:"sentiment",icon:"◎",label:"Sentiment",color:"var(--g)",desc:"NLP classification"},
    {id:"trends",icon:"↗",label:"Trends",color:"var(--amber)",desc:"Hashtag frequency"},
    {id:"network",icon:"⬡",label:"Network",color:"var(--blue)",desc:"Graph analysis"},
    {id:"fakenews",icon:"⊗",label:"Fake News",color:"var(--red)",desc:"Misinformation detect"},
    {id:"segments",icon:"⊞",label:"Segments",color:"var(--purple)",desc:"User clustering"},
    {id:"ads",icon:"◆",label:"Ads & CTR",color:"var(--g)",desc:"Campaign optimizer"},
    {id:"influencers",icon:"★",label:"Influencers",color:"var(--amber)",desc:"Opinion leaders"},
    {id:"competitors",icon:"⊕",label:"Competitors",color:"var(--blue)",desc:"Brand comparison"},
    {id:"predict",icon:"◇",label:"Prediction",color:"var(--purple)",desc:"ML forecasting"},
    {id:"recommend",icon:"⊛",label:"Recommend",color:"var(--g)",desc:"Content filtering"},
  ];
  return (
    <div className="page" style={{ padding: 28 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:32,letterSpacing:1 }}>
            ANALYTICS <span style={{ color:"var(--g)" }}>OVERVIEW</span>
          </h1>
          <p style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)",marginTop:5,letterSpacing:1 }}>Social Media Intelligence · BAI-404</p>
        </div>
        <div style={{ textAlign:"right",fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)" }}>
          <div>{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</div>
          <div style={{ color:"var(--g)",marginTop:3 }}>● SYSTEM ONLINE</div>
        </div>
      </div>
      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24 }}>
        {[
          {v:posts?.count ?? "—",l:"POSTS LOADED",c:"var(--g)"},
          {v:12,l:"MODULES",c:"var(--amber)"},
          {v:2,l:"PLATFORMS",c:"var(--blue)"},
          {v:6,l:"ML MODELS",c:"var(--purple)"},
        ].map(s => (
          <Card key={s.l} accent={s.c}><BigStat value={s.v} label={s.l} color={s.c} /></Card>
        ))}
      </div>
      {/* Samples */}
      {posts?.sample?.length > 0 && (
        <Card style={{ marginBottom:24 }} accent="var(--g)">
          <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--g)",letterSpacing:2,marginBottom:14 }}>RECENT POSTS IN DATABASE</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {posts.sample.map((t,i) => (
              <div key={i} style={{ padding:"10px 14px",background:"var(--bg3)",borderRadius:"var(--r)",fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)",lineHeight:1.6,borderLeft:"2px solid var(--g)30" }}>
                {t.length>140?t.slice(0,140)+"…":t}
              </div>
            ))}
          </div>
        </Card>
      )}
      {/* Module grid */}
      <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t3)",letterSpacing:3,marginBottom:14 }}>10 ANALYTICS MODULES</div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:10 }}>
        {modules.map(m => (
          <button key={m.id} onClick={() => go(m.id)} style={{
            background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"var(--r)",
            padding:"16px 14px",cursor:"pointer",textAlign:"left",transition:"all .2s",
            display:"flex",flexDirection:"column",gap:7
          }}
            onMouseOver={e => { e.currentTarget.style.borderColor=m.color; e.currentTarget.style.background="var(--bg3)"; e.currentTarget.style.boxShadow=`0 0 20px ${m.color}15`; }}
            onMouseOut={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--bg2)"; e.currentTarget.style.boxShadow="none"; }}
          >
            <span style={{ fontSize:20,color:m.color }}>{m.icon}</span>
            <span style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:15,color:"var(--text)" }}>{m.label}</span>
            <span style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)" }}>{m.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── CASES ────────────────────────────────────────────────────────────────────
const Cases = () => {
  const [f, setF] = useState({ name:"",keyword:"",platform:"X",dataset_id:"" });
  const [caseId, setCaseId] = useState(null);
  const [fetchId, setFetchId] = useState("");
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const create = async (e) => {
    e.preventDefault(); setLoading(true); setMsg(null);
    const r = await api.createCase(f.name,f.keyword,f.platform,f.dataset_id);
    if (r.error) setMsg({t:"error",m:r.error});
    else { setMsg({t:"success",m:`Case created — ID: ${r.case_id}`}); setCaseId(r.case_id); }
    setLoading(false);
  };
  const fetch = async () => {
    if (!fetchId) return; setFetchLoading(true); setRes(null);
    const r = await api.fetchCase(fetchId); setRes(r); setFetchLoading(false);
  };

  return (
    <div className="page" style={{ padding:28 }}>
      <STitle icon="◫" title="CASE MANAGEMENT" sub="Create analysis cases linked to Apify dataset IDs" color="var(--amber)" />
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:20 }}>
        <Card accent="var(--g)">
          <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--g)",letterSpacing:2,marginBottom:16 }}>NEW CASE</div>
          {msg && <Toast type={msg.t} msg={msg.m} />}
          <form onSubmit={create} style={{ display:"flex",flexDirection:"column",gap:14 }}>
            {[["CASE NAME","name","Tesla Brand Analysis"],["KEYWORD","keyword","#Tesla"],["APIFY DATASET ID","dataset_id","abc123xyz"]].map(([lbl,key,ph]) => (
              <div key={key}>
                <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:6 }}>{lbl}</div>
                <input value={f[key]} onChange={e=>setF(p=>({...p,[key]:e.target.value}))} placeholder={ph} />
              </div>
            ))}
            <div>
              <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:6 }}>PLATFORM</div>
              <select value={f.platform} onChange={e=>setF(p=>({...p,platform:e.target.value}))}>
                <option value="X">X (Twitter)</option>
                <option value="Facebook">Facebook</option>
              </select>
            </div>
            <Btn disabled={loading} style={{ marginTop:4 }}>{loading?"CREATING...":"CREATE CASE"}</Btn>
          </form>
        </Card>
        <Card accent="var(--amber)">
          <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--amber)",letterSpacing:2,marginBottom:16 }}>FETCH DATA FROM APIFY</div>
          <p style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)",marginBottom:16,lineHeight:1.7 }}>Enter Case ID to pull posts from the linked Apify dataset into the local database.</p>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:6 }}>CASE ID</div>
            <input value={fetchId} onChange={e=>setFetchId(e.target.value)} placeholder={caseId ? String(caseId) : "e.g. 5"} />
          </div>
          <Btn color="var(--amber)" disabled={fetchLoading||!fetchId} onClick={fetch} style={{ width:"100%",justifyContent:"center",marginBottom:16 }}>
            {fetchLoading?"FETCHING...":"FETCH POSTS"}
          </Btn>
          {res && (
            <div style={{ padding:14,background:"var(--bg3)",borderRadius:"var(--r)" }}>
              {res.error ? <Toast type="error" msg={res.error} /> : (
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--g)",letterSpacing:2 }}>FETCH COMPLETE</div>
                  {[["CASE",res.case,"var(--text)"],["SAVED",res.saved,"var(--g)"],["SKIPPED",res.skipped,"var(--amber)"]].map(([l,v,c]) => (
                    <div key={l} style={{ display:"flex",justifyContent:"space-between",fontFamily:"var(--mono)",fontSize:12 }}>
                      <span style={{ color:"var(--t2)" }}>{l}</span><span style={{ color:c }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop:16,padding:14,background:"var(--bg3)",borderRadius:"var(--r)" }}>
            <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t3)",letterSpacing:1,marginBottom:8 }}>HOW TO GET DATASET ID</div>
            {["Run a scraper on apify.com","Go to Storage → Datasets","Copy the Dataset ID","Paste above and fetch"].map((s,i) => (
              <div key={i} style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)",marginBottom:4 }}>
                <span style={{ color:"var(--g)",marginRight:8 }}>{i+1}.</span>{s}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── SENTIMENT ────────────────────────────────────────────────────────────────
const Sentiment = () => {
  const [data,setData] = useState(null); const [loading,setLoading] = useState(false); const [err,setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.sentiment(); if(r.error) setErr(r.error); else setData(r); setLoading(false); };
  const SC = { Positive:"var(--g)", Negative:"var(--red)", Neutral:"var(--amber)" };
  return (
    <div className="page" style={{ padding:28 }}>
      <STitle icon="◎" title="SENTIMENT ANALYSIS" sub="TextBlob NLP — Positive / Negative / Neutral classification" color="var(--g)" />
      <Btn onClick={run} disabled={loading} style={{ marginBottom:24 }}>{loading?"ANALYSING...":"RUN ANALYSIS"}</Btn>
      {err && <Toast type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
            {Object.entries(data.summary||{}).map(([k,v]) => (
              <Card key={k} accent={SC[k]}><BigStat value={v} label={k.toUpperCase()} color={SC[k]} sub={`${Math.round(v/(Object.values(data.summary).reduce((a,b)=>a+b,0)||1)*100)}%`} /></Card>
            ))}
          </div>
          <Card>
            <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:16 }}>DISTRIBUTION</div>
            <Donut slices={Object.entries(data.summary||{}).map(([k,v])=>({label:k,value:v}))} />
          </Card>
          <Card>
            <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:14 }}>CLASSIFIED POSTS ({data.data?.length ?? 0})</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:360,overflowY:"auto" }}>
              {(data.data||[]).slice(0,40).map((p,i) => (
                <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"10px 12px",background:"var(--bg3)",borderRadius:"var(--r)",borderLeft:`3px solid ${SC[p.sentiment]||"var(--border2)"}`}}>
                  <Label color={SC[p.sentiment]||"var(--t2)"}>{p.sentiment}</Label>
                  <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)",lineHeight:1.6,flex:1 }}>{(p.text||"").slice(0,130)}{(p.text||"").length>130?"…":""}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ─── TRENDS ───────────────────────────────────────────────────────────────────
const Trends = () => {
  const [data,setData] = useState(null); const [loading,setLoading] = useState(false); const [err,setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.trends(); if(r.error) setErr(r.error); else setData(r); setLoading(false); };

  // normalise: backend may return [{hashtag,count}] or [{tag,count}] or [{_id,count}] or strings
  const normalise = (arr=[]) => arr.map(item => {
    if (typeof item === "string") return { label:item, count:1 };
    const label = item.hashtag ?? item.tag ?? item._id ?? item.name ?? item.word ?? String(Object.values(item)[0]);
    const count = Number(item.count ?? item.frequency ?? item.value ?? Object.values(item)[1]) || 0;
    return { label, count };
  }).sort((a,b)=>b.count-a.count);

  const tags = normalise(data?.trending_hashtags);

  return (
    <div className="page" style={{ padding:28 }}>
      <STitle icon="↗" title="TRENDING TOPICS" sub="Hashtag frequency ranking across all collected posts" color="var(--amber)" />
      <Btn color="var(--amber)" textColor="var(--bg)" onClick={run} disabled={loading} style={{ marginBottom:24 }}>{loading?"SCANNING...":"DETECT TRENDS"}</Btn>
      {err && <Toast type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <Card accent="var(--amber)">
            <BigStat value={data.total_posts ?? 0} label="TOTAL POSTS ANALYSED" color="var(--amber)" />
          </Card>
          {tags.length > 0 ? (
            <>
              <Card>
                <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:20 }}>TOP {Math.min(tags.length,15)} TRENDING HASHTAGS</div>
                <HBar data={tags.slice(0,15)} lk="label" vk="count" color="var(--amber)" />
              </Card>
              <Card>
                <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:14 }}>ALL HASHTAGS ({tags.length})</div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                  {tags.map((h,i) => {
                    const opacity = Math.max(0.4, h.count / (tags[0].count||1));
                    return (
                      <span key={i} style={{
                        padding:"5px 12px",borderRadius:20,
                        background:`rgba(255,170,0,${opacity*0.15})`,
                        border:`1px solid rgba(255,170,0,${opacity*0.5})`,
                        fontFamily:"var(--mono)",fontSize:11,color:"var(--amber)"
                      }}>
                        {h.label} <span style={{ opacity:.5 }}>{h.count}</span>
                      </span>
                    );
                  })}
                </div>
              </Card>
            </>
          ) : (
            <Toast type="warn" msg="No hashtags found. Fetch posts first via Cases." />
          )}
        </div>
      )}
    </div>
  );
};

// ─── NETWORK ──────────────────────────────────────────────────────────────────
const Network = () => {
  const [data,setData] = useState(null); const [loading,setLoading] = useState(false); const [err,setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.network(); if(r.error) setErr(r.error); else setData(r); setLoading(false); };

  // normalise influencer entries: backend may return string, or {username,score}, or {user,score}
  const normInf = (arr=[]) => arr.map(x => typeof x === "string" ? { name:x, score:null } : { name: x.username ?? x.user ?? x.name ?? "unknown", score: x.score ?? x.centrality ?? null });
  const normConn = (arr=[]) => arr.map(x => typeof x === "string" ? x : (x.user ?? x.username ?? JSON.stringify(x)));

  return (
    <div className="page" style={{ padding:28 }}>
      <STitle icon="⬡" title="NETWORK ANALYSIS" sub="NetworkX — community detection, influencers, key connectors" color="var(--blue)" />
      <Btn color="var(--blue)" onClick={run} disabled={loading} style={{ marginBottom:24 }}>{loading?"MAPPING GRAPH...":"BUILD GRAPH"}</Btn>
      {err && <Toast type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            <Card accent="var(--blue)"><BigStat value={data.total_nodes??0} label="NODES" color="var(--blue)" /></Card>
            <Card accent="var(--purple)"><BigStat value={data.total_edges??0} label="EDGES" color="var(--purple)" /></Card>
          </div>
          {normInf(data.top_influencers||[]).length > 0 && (
            <Card accent="var(--blue)">
              <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--blue)",letterSpacing:2,marginBottom:16 }}>TOP INFLUENCERS — EIGENVECTOR CENTRALITY</div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {normInf(data.top_influencers).slice(0,10).map((inf,i) => {
                  const maxS = normInf(data.top_influencers)[0]?.score||1;
                  return (
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:"11px 14px",background:"var(--bg3)",borderRadius:"var(--r)" }}>
                      <div style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:18,color:"var(--blue)",width:30,textAlign:"center" }}>#{i+1}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"var(--font)",fontWeight:600,fontSize:14,color:"var(--text)",marginBottom:5 }}>@{inf.name}</div>
                        {inf.score && (
                          <div style={{ height:4,background:"var(--bg4)",borderRadius:2 }}>
                            <div style={{ height:"100%",width:`${(inf.score/maxS)*100}%`,background:"var(--blue)",borderRadius:2,transition:"width .8s ease",transitionDelay:`${i*.07}s` }} />
                          </div>
                        )}
                      </div>
                      {inf.score && <Label color="var(--blue)">{Number(inf.score).toFixed(4)}</Label>}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          {normConn(data.key_connectors||[]).length > 0 && (
            <Card>
              <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:12 }}>KEY CONNECTORS (BRIDGE NODES)</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                {normConn(data.key_connectors).map((c,i) => (
                  <span key={i} style={{ padding:"5px 14px",border:"1px solid var(--blue)40",borderRadius:4,fontFamily:"var(--mono)",fontSize:11,color:"var(--blue)" }}>{c}</span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// ─── FAKE NEWS ────────────────────────────────────────────────────────────────
const FakeNews = () => {
  const [data,setData] = useState(null); const [loading,setLoading] = useState(false); const [err,setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.fakeNews(); if(r.error) setErr(r.error); else setData(r); setLoading(false); };
  return (
    <div className="page" style={{ padding:28 }}>
      <STitle icon="⊗" title="FAKE NEWS DETECTION" sub="TF-IDF + Logistic Regression misinformation classifier" color="var(--red)" />
      <Btn color="var(--red)" textColor="#fff" onClick={run} disabled={loading} style={{ marginBottom:24 }}>{loading?"SCANNING...":"RUN DETECTION"}</Btn>
      {err && <Toast type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            <Card accent="var(--red)"><BigStat value={data.summary?.Suspicious??0} label="SUSPICIOUS" color="var(--red)" /></Card>
            <Card accent="var(--g)"><BigStat value={data.summary?.["Likely Real"]??0} label="LIKELY REAL" color="var(--g)" /></Card>
          </div>
          <Card>
            <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:16 }}>DISTRIBUTION</div>
            <Donut slices={[{label:"Suspicious",value:data.summary?.Suspicious??0},{label:"Likely Real",value:data.summary?.["Likely Real"]??0}]} />
          </Card>
          <Card>
            <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:14 }}>RESULTS ({data.data?.length??0})</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:380,overflowY:"auto" }}>
              {(data.data||[]).slice(0,30).map((p,i) => {
                const s = p.prediction === "Suspicious";
                return (
                  <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"10px 12px",background:"var(--bg3)",borderRadius:"var(--r)",borderLeft:`3px solid ${s?"var(--red)":"var(--g)"}`}}>
                    <Label color={s?"var(--red)":"var(--g)"}>{p.prediction}</Label>
                    <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)",lineHeight:1.6,flex:1 }}>{(p.text||"").slice(0,130)}{(p.text||"").length>130?"…":""}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// ─── SEGMENTS ─────────────────────────────────────────────────────────────────
const Segments = () => {
  const [data,setData] = useState(null); const [loading,setLoading] = useState(false); const [err,setErr] = useState(null); const [k,setK] = useState(3);
  const run = async () => { setLoading(true); setErr(null); const r = await api.segments(k); if(r.error) setErr(r.error); else setData(r); setLoading(false); };
  const CC = ["var(--g)","var(--blue)","var(--purple)","var(--amber)","var(--red)"];

  // Robust cluster extraction: data might have {clusters:{...}} or be the clusters object directly, or have numeric keys
  const extractClusters = (d) => {
    if (!d) return [];
    const obj = d.clusters ?? d;
    if (typeof obj !== "object" || Array.isArray(obj)) return [];
    return Object.entries(obj).map(([k,v]) => ({ label:k, items: Array.isArray(v)?v:[v] }));
  };

  const clusters = extractClusters(data);

  return (
    <div className="page" style={{ padding:28 }}>
      <STitle icon="⊞" title="USER SEGMENTATION" sub="K-Means clustering — users grouped by text behaviour" color="var(--purple)" />
      <div style={{ display:"flex",alignItems:"flex-end",gap:14,marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:8 }}>CLUSTERS (K)</div>
          <div style={{ display:"flex",gap:8 }}>
            {[2,3,4,5].map(n => (
              <button key={n} onClick={() => setK(n)} style={{
                width:40,height:40,background:k===n?"var(--purple)":"var(--bg4)",
                color:k===n?"#fff":"var(--t2)",border:`1px solid ${k===n?"var(--purple)":"var(--border2)"}`,
                borderRadius:"var(--r)",fontFamily:"var(--font)",fontWeight:700,fontSize:16,cursor:"pointer",transition:"all .15s"
              }}>{n}</button>
            ))}
          </div>
        </div>
        <Btn color="var(--purple)" onClick={run} disabled={loading}>{loading?"CLUSTERING...":"RUN SEGMENTATION"}</Btn>
      </div>
      {err && <Toast type="error" msg={err} />}
      {loading && <Spin />}
      {data && clusters.length > 0 && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ display:"grid",gridTemplateColumns:`repeat(${Math.min(clusters.length,3)},1fr)`,gap:12,marginBottom:8 }}>
            {clusters.map((c,i) => (
              <Card key={c.label} accent={CC[i%CC.length]}>
                <BigStat value={c.items.length} label={`CLUSTER ${i+1}`} color={CC[i%CC.length]} small />
              </Card>
            ))}
          </div>
          {clusters.map((c,i) => (
            <Card key={c.label} accent={CC[i%CC.length]}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                <div style={{ width:10,height:10,borderRadius:"50%",background:CC[i%CC.length] }} />
                <div style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:15,color:CC[i%CC.length] }}>
                  CLUSTER {i+1}
                </div>
                <Label color={CC[i%CC.length]}>{c.items.length} POSTS</Label>
                <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t3)",marginLeft:8,maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                  {c.label}
                </div>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:6,maxHeight:220,overflowY:"auto" }}>
                {c.items.slice(0,6).map((item,j) => {
                  const text = typeof item === "string" ? item : (item.text ?? JSON.stringify(item));
                  return (
                    <div key={j} style={{ padding:"9px 12px",background:"var(--bg3)",borderRadius:"var(--r)",fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)",lineHeight:1.6,borderLeft:`2px solid ${CC[i%CC.length]}30` }}>
                      {text.length>130?text.slice(0,130)+"…":text}
                    </div>
                  );
                })}
                {c.items.length > 6 && (
                  <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t3)",textAlign:"center",padding:6 }}>
                    +{c.items.length-6} more posts in this cluster
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {data && clusters.length === 0 && (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <Toast type="info" msg="Received response — displaying raw output below." />
          <RawJSON data={data} />
        </div>
      )}
    </div>
  );
};

// ─── ADS / ENGAGEMENT ─────────────────────────────────────────────────────────
const Ads = () => {
  const [data,setData] = useState(null); const [loading,setLoading] = useState(false); const [err,setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.engagement(); if(r.error) setErr(r.error); else setData(r); setLoading(false); };
  return (
    <div className="page" style={{ padding:28 }}>
      <STitle icon="◆" title="ADS & ENGAGEMENT" sub="CTR · Conversion Rate · CPA optimization suggestions" color="var(--g)" />
      <Btn onClick={run} disabled={loading} style={{ marginBottom:24 }}>{loading?"ANALYSING...":"RUN ANALYSIS"}</Btn>
      {err && <Toast type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          {data.top_posts?.length > 0 && (
            <Card accent="var(--g)">
              <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--g)",letterSpacing:2,marginBottom:14 }}>TOP PERFORMING POSTS</div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {data.top_posts.map((p,i) => (
                  <div key={i} style={{ padding:"12px 14px",background:"var(--bg3)",borderRadius:"var(--r)",borderLeft:"3px solid var(--g)" }}>
                    <div style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--text)",marginBottom:6,lineHeight:1.6 }}>{(typeof p==="string"?p:(p.text??"")).slice(0,120) || JSON.stringify(p)}</div>
                    <div style={{ display:"flex",gap:16 }}>
                      {p.likes!==undefined && <span style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--g)" }}>♥ {p.likes}</span>}
                      {p.retweets!==undefined && <span style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--blue)" }}>↺ {p.retweets}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {data.suggestions?.length > 0 && (
            <Card accent="var(--amber)">
              <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--amber)",letterSpacing:2,marginBottom:14 }}>OPTIMIZATION RECOMMENDATIONS</div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {data.suggestions.map((s,i) => (
                  <div key={i} style={{ padding:"11px 14px",background:"var(--bg3)",borderRadius:"var(--r)",display:"flex",gap:12,alignItems:"flex-start" }}>
                    <span style={{ color:"var(--amber)",fontWeight:700,marginTop:1 }}>→</span>
                    <span style={{ fontFamily:"var(--mono)",fontSize:12,color:"var(--t2)",lineHeight:1.6 }}>{typeof s==="string"?s:JSON.stringify(s)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

// ─── INFLUENCERS ──────────────────────────────────────────────────────────────
const Influencers = () => {
  const [data,setData] = useState(null); const [loading,setLoading] = useState(false); const [err,setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.influencers(); if(r.error) setErr(r.error); else setData(r); setLoading(false); };
  const normInf = (arr=[]) => arr.map(x => typeof x==="string"?{name:x,score:null}:{name:x.username??x.user??x.name??"unknown",score:x.score??x.centrality??null});
  return (
    <div className="page" style={{ padding:28 }}>
      <STitle icon="★" title="INFLUENCER DETECTION" sub="Eigenvector centrality scoring of opinion leaders" color="var(--amber)" />
      <Btn color="var(--amber)" textColor="var(--bg)" onClick={run} disabled={loading} style={{ marginBottom:24 }}>{loading?"COMPUTING...":"FIND INFLUENCERS"}</Btn>
      {err && <Toast type="error" msg={err} />}
      {loading && <Spin />}
      {data?.top_influencers && (
        <Card accent="var(--amber)">
          <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--amber)",letterSpacing:2,marginBottom:16 }}>RANKED BY INFLUENCE SCORE</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {normInf(data.top_influencers).map((inf,i) => {
              const maxS = normInf(data.top_influencers)[0]?.score||1;
              const medal = ["🥇","🥈","🥉"][i] || `#${i+1}`;
              return (
                <div key={i} style={{ display:"flex",alignItems:"center",gap:14,padding:"13px 16px",background:"var(--bg3)",borderRadius:"var(--r)" }}>
                  <div style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:18,width:36,textAlign:"center" }}>{medal}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"var(--font)",fontWeight:600,fontSize:15,color:"var(--text)",marginBottom:5 }}>@{inf.name}</div>
                    {inf.score && (
                      <div style={{ height:5,background:"var(--bg4)",borderRadius:3 }}>
                        <div style={{ height:"100%",width:`${(inf.score/maxS)*100}%`,background:"linear-gradient(90deg,var(--amber)66,var(--amber))",borderRadius:3,transition:"width .8s ease",transitionDelay:`${i*.07}s` }} />
                      </div>
                    )}
                  </div>
                  {inf.score && <Label color="var(--amber)">{Number(inf.score).toFixed(4)}</Label>}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── COMPETITORS ──────────────────────────────────────────────────────────────
const Competitors = () => {
  const [kw, setKw] = useState("tesla,ford,byd");
  const [data,setData] = useState(null); const [loading,setLoading] = useState(false); const [err,setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.competitors(kw); if(r.error) setErr(r.error); else setData(r); setLoading(false); };
  const CC = ["var(--g)","var(--blue)","var(--purple)","var(--amber)","var(--red)"];

  // robust extraction of comparison data
  const extractRows = (d) => {
    if (!d) return [];
    const obj = d.comparison ?? d;
    if (typeof obj !== "object" || Array.isArray(obj)) return [];
    return Object.entries(obj).map(([brand,stats]) => ({brand, stats: typeof stats==="object" ? stats : {value:stats}}));
  };

  const rows = extractRows(data);

  return (
    <div className="page" style={{ padding:28 }}>
      <STitle icon="⊕" title="COMPETITOR ANALYSIS" sub="Brand comparison — mentions, engagement, growth strategy" color="var(--blue)" />
      <div style={{ display:"flex",gap:12,alignItems:"flex-end",marginBottom:24 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:8 }}>KEYWORDS (comma-separated)</div>
          <input value={kw} onChange={e=>setKw(e.target.value)} placeholder="tesla,ford,byd" />
        </div>
        <Btn color="var(--blue)" onClick={run} disabled={loading}>{loading?"COMPARING...":"COMPARE"}</Btn>
      </div>
      {err && <Toast type="error" msg={err} />}
      {loading && <Spin />}
      {data && rows.length > 0 && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          {rows.map(({brand,stats},i) => {
            const entries = Object.entries(stats);
            return (
              <Card key={brand} accent={CC[i%CC.length]}>
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
                  <div style={{ width:10,height:10,borderRadius:"50%",background:CC[i%CC.length],boxShadow:`0 0 8px ${CC[i%CC.length]}` }} />
                  <div style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:20,color:CC[i%CC.length] }}>{brand.toUpperCase()}</div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10 }}>
                  {entries.map(([key,val]) => (
                    <div key={key} style={{ padding:"12px 10px",background:"var(--bg3)",borderRadius:"var(--r)",textAlign:"center" }}>
                      <div style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:20,color:CC[i%CC.length] }}>
                        {typeof val==="number"?(val%1!==0?val.toFixed(2):val):String(val)}
                      </div>
                      <div style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--t3)",marginTop:5,letterSpacing:1,textTransform:"uppercase" }}>{key.replace(/_/g," ")}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {data && rows.length === 0 && (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <Toast type="info" msg="Response received — showing raw data." />
          <RawJSON data={data} />
        </div>
      )}
    </div>
  );
};

// ─── PREDICTION ───────────────────────────────────────────────────────────────
const Predict = () => {
  const [kw,setKw] = useState("AI");
  const [data,setData] = useState(null); const [loading,setLoading] = useState(false); const [err,setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.predict(kw); if(r.error) setErr(r.error); else setData(r); setLoading(false); };

  // extract useful fields robustly
  const pred = data?.predicted_engagement ?? data?.predicted ?? null;
  const hist = Array.isArray(data?.history) ? data.history : null;
  const preds = Array.isArray(data?.predictions) ? data.predictions : null;
  const fi = data?.feature_importance ?? null;

  return (
    <div className="page" style={{ padding:28 }}>
      <STitle icon="◇" title="POPULARITY PREDICTION" sub="RandomForest ML model — engagement forecasting by keyword" color="var(--purple)" />
      <div style={{ display:"flex",gap:12,alignItems:"flex-end",marginBottom:24 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:8 }}>KEYWORD</div>
          <input value={kw} onChange={e=>setKw(e.target.value)} placeholder="AI" />
        </div>
        <Btn color="var(--purple)" onClick={run} disabled={loading}>{loading?"PREDICTING...":"PREDICT"}</Btn>
      </div>
      {err && <Toast type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          {/* Big predicted number */}
          {pred !== null && (
            <Card accent="var(--purple)" style={{ textAlign:"center",padding:32 }}>
              <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:3,marginBottom:16 }}>PREDICTED ENGAGEMENT FOR "{kw.toUpperCase()}"</div>
              <div style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:72,color:"var(--purple)",lineHeight:1,textShadow:"0 0 40px rgba(170,68,255,.5)" }}>
                {Math.round(pred)}
              </div>
              <div style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)",marginTop:10 }}>interactions per post · estimated</div>
            </Card>
          )}

          {/* Sparkline: history */}
          {hist && (
            <Card accent="var(--purple)">
              <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--purple)",letterSpacing:2,marginBottom:8 }}>
                HISTORICAL TREND ({hist.length} data points)
              </div>
              <div style={{ display:"flex",gap:12,marginBottom:10,flexWrap:"wrap" }}>
                <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)" }}>Min: <span style={{ color:"var(--purple)" }}>{Math.min(...hist)}</span></span>
                <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)" }}>Max: <span style={{ color:"var(--purple)" }}>{Math.max(...hist)}</span></span>
                <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)" }}>Avg: <span style={{ color:"var(--purple)" }}>{(hist.reduce((a,b)=>a+b,0)/hist.length).toFixed(1)}</span></span>
              </div>
              <Sparkline data={hist} color="var(--purple)" />
            </Card>
          )}

          {/* Forecast line */}
          {preds && (
            <Card accent="var(--blue)">
              <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--blue)",letterSpacing:2,marginBottom:8 }}>
                FORECAST ({preds.length} future periods)
              </div>
              <Sparkline data={preds} color="var(--blue)" />
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:8,marginTop:12 }}>
                {preds.slice(0,10).map((v,i) => (
                  <div key={i} style={{ padding:"8px 6px",background:"var(--bg3)",borderRadius:"var(--r)",textAlign:"center" }}>
                    <div style={{ fontFamily:"var(--font)",fontWeight:700,fontSize:16,color:"var(--blue)" }}>{Math.round(v)}</div>
                    <div style={{ fontFamily:"var(--mono)",fontSize:9,color:"var(--t3)" }}>T+{i+1}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Feature importance */}
          {fi && (
            <Card>
              <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:16 }}>FEATURE IMPORTANCE</div>
              <HBar
                data={Object.entries(fi).map(([k,v])=>({label:k.replace(/_/g," "),count:Math.round(Number(v)*1000)/10})).sort((a,b)=>b.count-a.count)}
                lk="label" vk="count" color="var(--purple)"
              />
            </Card>
          )}

          {/* keyword field */}
          {data.keyword && (
            <div style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)" }}>
              Keyword analysed: <span style={{ color:"var(--purple)" }}>{data.keyword}</span>
            </div>
          )}

          {/* If none of the above matched, just show the raw JSON cleanly */}
          {pred===null && !hist && !preds && !fi && (
            <>
              <Toast type="info" msg="Response received. Displaying structured output below." />
              <RawJSON data={data} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── RECOMMEND ────────────────────────────────────────────────────────────────
const Recommend = () => {
  const [idx,setIdx] = useState(0);
  const [data,setData] = useState(null); const [loading,setLoading] = useState(false); const [err,setErr] = useState(null);
  const run = async () => { setLoading(true); setErr(null); const r = await api.recommend(idx); if(r.error) setErr(r.error); else setData(r); setLoading(false); };
  return (
    <div className="page" style={{ padding:28 }}>
      <STitle icon="⊛" title="CONTENT RECOMMENDATIONS" sub="TF-IDF cosine similarity — collaborative filtering" color="var(--g)" />
      <div style={{ display:"flex",gap:12,alignItems:"flex-end",marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:8 }}>POST INDEX</div>
          <input type="number" min={0} value={idx} onChange={e=>setIdx(Number(e.target.value))} style={{ width:100 }} />
        </div>
        <Btn onClick={run} disabled={loading}>{loading?"FINDING...":"GET RECOMMENDATIONS"}</Btn>
      </div>
      {err && <Toast type="error" msg={err} />}
      {loading && <Spin />}
      {data && (
        <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
          {data.selected_post && (
            <Card accent="var(--g)">
              <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--g)",letterSpacing:2,marginBottom:10 }}>QUERY POST</div>
              <div style={{ padding:"12px 14px",background:"var(--bg3)",borderRadius:"var(--r)",fontFamily:"var(--mono)",fontSize:12,color:"var(--text)",lineHeight:1.7,borderLeft:"3px solid var(--g)" }}>
                {data.selected_post}
              </div>
            </Card>
          )}
          {data.recommendations?.length > 0 && (
            <Card>
              <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--t2)",letterSpacing:2,marginBottom:14 }}>
                SIMILAR POSTS ({data.recommendations.length})
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {data.recommendations.map((r,i) => {
                  const txt = typeof r==="string"?r:(r.text??JSON.stringify(r));
                  return (
                    <div key={i} style={{ padding:"11px 14px",background:"var(--bg3)",borderRadius:"var(--r)",borderLeft:"2px solid var(--g)25" }}>
                      <div style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--t2)",lineHeight:1.6 }}>{txt.slice(0,150)}{txt.length>150?"…":""}</div>
                      {r.similarity && <div style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--g)",marginTop:5 }}>similarity: {Number(r.similarity).toFixed(4)}</div>}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          {data.message && <Toast type="info" msg={data.message} />}
        </div>
      )}
    </div>
  );
};

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem("sma_user"));
  const [page, setPage] = useState("overview");
  const logout = () => { localStorage.removeItem("sma_token"); localStorage.removeItem("sma_user"); setUser(null); };
  const PAGES = { overview:<Overview go={setPage}/>, cases:<Cases/>, sentiment:<Sentiment/>, trends:<Trends/>, network:<Network/>, fakenews:<FakeNews/>, segments:<Segments/>, ads:<Ads/>, influencers:<Influencers/>, competitors:<Competitors/>, predict:<Predict/>, recommend:<Recommend/> };
  return (
    <>
      <style>{G}</style>
      <div className="grid-bg" /><div className="scanline" />
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <div style={{ display:"flex",minHeight:"100vh",position:"relative",zIndex:1 }}>
          <Sidebar active={page} set={setPage} user={user} logout={logout} />
          <main style={{ flex:1,overflowY:"auto",minHeight:"100vh" }}>
            {PAGES[page] ?? <Overview go={setPage} />}
          </main>
        </div>
      )}
    </>
  );
}