import { useState, useEffect, useCallback, useRef } from "react";
// === SUPABASE CONFIG ===
const SUPA_URL = "https://rknpdyfwdwobihbnfyka.supabase.co";
const SUPA_KEY = "sb_publishable_TIXxlUUACfMYdf_GeNQMVA_rcJgJsEL";
async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": `Bearer ${SUPA_KEY}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer || "return=representation",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const txt = await res.text();
  return txt ? JSON.parse(txt) : [];
}
const db = {
  get: (table) => sbFetch(`${table}?select=*&order=created_at.asc`),
  getSimple: (table) => sbFetch(`${table}?select=*`),
  insert: (table, data) => sbFetch(table, { method: "POST", body: JSON.stringify(data), prefer: "return=representation" }),
  update: (table, id, data) => sbFetch(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data), prefer: "return=representation" }),
  delete: (table, id) => sbFetch(`${table}?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" }),
  upsert: (table, data) => sbFetch(table, { method: "POST", body: JSON.stringify(data), headers: { "Prefer": "resolution=merge-duplicates,return=representation" } }),
};
// === DEFAULTS ===
const DEF_COMM = [
  { id: "c1", nom: "Finances & Budget", color: "#2563eb", icon: " " },
  { id: "c2", nom: "Urbanisme & Travaux", color: "#059669", icon: " " },
  { id: "c3", nom: "Vie Scolaire & Jeunesse", color: "#d97706", icon: " " },
  { id: "c4", nom: "Communication & Événements", color: "#7c3aed", icon: " " },
  { id: "c5", nom: "Environnement & Cadre de vie", color: "#0d9488", icon: " " },
];
const REM_OPTS = [
  { v: 0, l: "Au moment de l'événement" }, { v: 5, l: "5 min avant" }, { v: 15, l: "15 min avant" },
  { v: 30, l: "30 min avant" }, { v: 60, l: "1 heure avant" }, { v: 120, l: "2 heures avant" },
  { v: 1440, l: "1 jour avant" }, { v: 2880, l: "2 jours avant" }, { v: 10080, l: "1 semaine avant" },
];
const MO = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DF = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const gid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const fmtD = d => { const x = new Date(d); return `${DF[x.getDay()]} ${x.getDate()} ${MO[x.getMonth()]} ${x.getFullYear()}`; };
const fmtT = d => { const x = new Date(d); return `${String(x.getHours()).padStart(2,"0")}h${String(x.getMinutes()).padStart(2,"0")}`; };
const fmtRel = ed => { const diff = new Date(ed) - new Date(), m = Math.round(diff / 60000); if (m < 0) return "maintenant"; if (m < 60) return `dans ${m} min`; const h = Math.floor(m / 60); if (h < 24) return `dans ${h}h`; return `dans ${Math.floor(h/24)}j`; };
// === ICONS ===
const I = {
  cal: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  grp: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  doc: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  usr: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  add: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  bk: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  del: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  ed: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  ok: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>,
  ch: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>,
  sr: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  bl: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  bf: <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  ck: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  x: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  sync: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
};
const T = {
  bg:"#f7f5f0", primary:"#1e3a5f", pL:"#2d5a8e", accent:"#c9a227", aL:"#f5e6a3",
  tx:"#1a1a1a", tm:"#6b7280", bd:"#e5e1d8", red:"#dc2626", green:"#059669",
  r:"14px", sh:"0 2px 12px rgba(0,0,0,0.06)",
  f:"'Libre Baskerville','Georgia',serif", fs:"'Source Sans 3','Segoe UI',sans-serif",
};
const iS = { width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${T.bd}`, fontSize:14, fontFamily:T.fs, color:T.tx, background:"#fafaf8", outline:"none", boxSizing:"border-box" };
const bP = { display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px 20px", borderRadius:12, border:"none", background:T.primary, color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:T.fs };
const bS = { display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:10, border:"none", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:T.fs };
const bI = { background:"none", border:"none", cursor:"pointer", padding:4, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" };
function Fl({ label, children }) {
  return <div style={{ marginBottom:16 }}><label style={{ display:"block", fontSize:12, fontWeight:600, color:T.tm, marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>{label}</label>{children}</div>;
}
// === NOTIFICATION BANNER ===
function NotifBanner({ n, onX }) {
  if (!n) return null;
  return (
    <div style={{ position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:200,width:"calc(100% - 32px)",maxWidth:448,background:`linear-gradient(135deg,${T.primary},${T.pL})`,borderRadius:16,padding:"14px 16px",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",color:"#fff",animation:"nSlide .4s cubic-bezier(.34,1.56,.64,1)" }}>
      <style>{`@keyframes nSlide{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes nPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}`}</style>
      <div style={{ display:"flex",alignItems:"flex-start",gap:12 }}>
        <div style={{ width:40,height:40,borderRadius:12,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,animation:"nPulse 2s infinite",fontSize:20 }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:1,opacity:.7,marginBottom:3 }}>Rappel</div>
          <div style={{ fontSize:14,fontWeight:600,marginBottom:2 }}>{n.title}</div>
          <div style={{ fontSize:12,opacity:.85 }}>{fmtRel(n.eventDate)} - {fmtT(n.eventDate)}</div>
          {n.lieu && <div style={{ fontSize:11,opacity:.7,marginTop:2 }}> {n.lieu}</div>}
        </div>
        <button onClick={onX} style={{ background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,padding:6,cursor:"pointer",color:"#fff" }}>{I.x}</button>
      </div>
    </div>
  );
}
// === MAIN APP ===
export default function MairieNoailly() {
  const [tab, setTab] = useState("calendar");
  const [events, setEvents] = useState([]);
  const [comms, setComms] = useState([]);
  const [reports, setReports] = useState([]);
  const [elus, setElus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [sub, setSub] = useState(null);
  const [selDate, setSelDate] = useState(null);
  const [cM, setCM] = useState(new Date().getMonth());
  const [cY, setCY] = useState(new Date().getFullYear());
  const [banner, setBanner] = useState(null);
  const [firedR, setFiredR] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem("noailly_fired")||"[]")); } catch { return new Set(); } });
  const evRef = useRef([]);
  const fiRef = useRef(new Set());
  useEffect(() => { evRef.current = events; }, [events]);
  useEffect(() => { fiRef.current = firedR; localStorage.setItem("noailly_fired", JSON.stringify([...firedR])); }, [firedR]);
  // Load all data
  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [ev, co, rp, el] = await Promise.all([
        db.get("events").catch(() => []),
        db.getSimple("commissions").catch(() => []),
        db.get("reports").catch(() => []),
        db.getSimple("elus").catch(() => []),
      ]);
      setEvents(ev.map(e => ({ ...e, reminders: e.reminders || [] })));
      setComms(co.length > 0 ? co : DEF_COMM);
      setReports(rp);
      setElus(el);
      // Seed default commissions if empty
      if (co.length === 0) {
        await Promise.all(DEF_COMM.map(c => db.upsert("commissions", c).catch(() => {})));
        setComms(DEF_COMM);
      }
    } catch (e) {
      setError("Impossible de se connecter. Vérifiez votre connexion internet.");
    }
    setLoading(false);
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);
  // Auto-refresh every 30s (real-time sync)
  useEffect(() => {
    const t = setInterval(() => { setSyncing(true); loadAll().finally(() => setSyncing(false)); }, 30000);
    return () => clearInterval(t);
  }, [loadAll]);
  // Notification engine
  useEffect(() => {
    if (loading) return;
    const check = () => {
      const now = new Date();
      evRef.current.forEach(ev => {
        if (!ev.reminders?.length) return;
        const et = new Date(ev.date);
        if (et < now && (now - et) > 60000) return;
        ev.reminders.forEach(rm => {
          const rid = `${ev.id}_${rm}`;
          if (fiRef.current.has(rid)) return;
          const rt = new Date(et.getTime() - rm * 60000);
          const diff = now - rt;
          if (diff >= 0 && diff < 30000) {
            const notif = { id: rid, title: ev.title, eventDate: ev.date, lieu: ev.lieu };
            setBanner(notif);
            setTimeout(() => setBanner(null), 8000);
            try { if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("
            setFiredR(p => new Set([...p, rid]));
          }
        });
      });
    };
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, [loading]);
  useEffect(() => { try { if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission(); } catch(e) {} }, []);
  // CRUD helpers — all write to Supabase
  const addEvent = async (obj) => { const r = await db.insert("events", obj); setEvents(p => [...p, { ...r[0], reminders: r[0].reminders || [] }]); };
  const updEvent = async (obj) => { await db.update("events", obj.id, obj); setEvents(p => p.map(e => e.id === obj.id ? { ...obj } : e)); };
  const delEvent = async (id) => { await db.delete("events", id); setEvents(p => p.filter(e => e.id !== id)); };
  const addComm = async (obj) => { const r = await db.insert("commissions", obj); setComms(p => [...p, r[0]]); };
  const updComm = async (obj) => { await db.update("commissions", obj.id, obj); setComms(p => p.map(c => c.id === obj.id ? obj : c)); };
  const delComm = async (id) => { await db.delete("commissions", id); setComms(p => p.filter(c => c.id !== id)); };
  const addReport = async (obj) => { const r = await db.insert("reports", obj); setReports(p => [...p, r[0]]); };
  const updReport = async (obj) => { await db.update("reports", obj.id, obj); setReports(p => p.map(r => r.id === obj.id ? obj : r)); };
  const delReport = async (id) => { await db.delete("reports", id); setReports(p => p.filter(r => r.id !== id)); };
  const addElu = async (obj) => { const r = await db.insert("elus", obj); setElus(p => [...p, r[0]]); };
  const updElu = async (obj) => { await db.update("elus", obj.id, obj); setElus(p => p.map(e => e.id === obj.id ? obj : e)); };
  const delElu = async (id) => { await db.delete("elus", id); setElus(p => p.filter(e => e.id !== id)); };
  if (loading) return (
    <div style={{ height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:T.fs }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40,marginBottom:12 }}> </div>
        <div style={{ color:T.primary,fontFamily:T.f,fontSize:18,marginBottom:8 }}>Mairie de Noailly</div>
        <div style={{ color:T.tm,fontSize:14 }}>Connexion en cours...</div>
      </div>
    </div>
  );
  if (error) return (
    <div style={{ height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,fontFamily:T.fs,padding:24 }}>
      <div style={{ textAlign:"center",background:"#fff",borderRadius:T.r,padding:28,boxShadow:T.sh,maxWidth:320 }}>
        <div style={{ fontSize:36,marginBottom:12 }}> </div>
        <div style={{ color:T.primary,fontFamily:T.f,fontSize:16,marginBottom:8 }}>Connexion impossible</div>
        <div style={{ color:T.tm,fontSize:13,marginBottom:20 }}>{error}</div>
        <button onClick={loadAll} style={{ ...bP,width:"100%" }}>{I.sync} <span>Réessayer</span></button>
      </div>
    </div>
  );
  const navI = [
    { k:"calendar", l:"Agenda", i:I.cal },
    { k:"commissions", l:"Commissions", i:I.grp },
    { k:"reports", l:"Rapports", i:I.doc },
    { k:"contacts", l:"Élus", i:I.usr },
  ];
  return (
    <div style={{ minHeight:"100vh",background:T.bg,fontFamily:T.fs,color:T.tx,display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",position:"relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes bPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}`}</style>
      <NotifBanner n={banner} onX={() => setBanner(null)} />
      <header style={{ background:`linear-gradient(135deg,${T.primary},${T.pL})`,color:"#fff",padding:"18px 20px 14px",position:"sticky",top:0,zIndex:100 }}>
        {sub ? (
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <button onClick={() => setSub(null)} style={{ background:"none",border:"none",color:"#fff",cursor:"pointer",padding:4 }}>{I.bk}</button>
            <h1 style={{ fontFamily:T.f,fontSize:18,fontWeight:700,margin:0,flex:1 }}>{sub.title}</h1>
          </div>
        ) : (
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:11,fontWeight:500,letterSpacing:2,textTransform:"uppercase",opacity:.7,marginBottom:2 }}>Commune de</div>
              <h1 style={{ fontFamily:T.f,fontSize:22,fontWeight:700,margin:0 }}>Noailly</h1>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
              {syncing && <div style={{ color:"rgba(255,255,255,.7)",display:"flex",alignItems:"center",gap:4,fontSize:11 }}><div style={{ animation:"spin 1s linear infinite",display:"flex" }}>{I.sync}</div></div>}
              <div style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.15)",borderRadius:20,padding:"6px 14px" }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:T.accent }} />
                <span style={{ fontSize:12,fontWeight:500 }}>16 élus</span>
              </div>
            </div>
          </div>
        )}
      </header>
      <main style={{ flex:1,padding:"0 0 90px",overflowY:"auto" }}>
        {sub ? sub.component
          : tab==="calendar" ? <CalView ev={events} addEv={addEvent} updEv={updEvent} delEv={delEvent} co={comms} ss={setSub} cM={cM} sCM={setCM} cY={cY} sCY={setCY} sd={selDate} sSD={setSelDate} />
          : tab==="commissions" ? <ComView co={comms} addCo={addComm} updCo={updComm} delCo={delComm} ev={events} rp={reports} ss={setSub} />
          : tab==="reports" ? <RepView rp={reports} addRp={addReport} updRp={updReport} delRp={delReport} co={comms} ss={setSub} />
          : <ConView el={elus} addEl={addElu} updEl={updElu} delEl={delElu} co={comms} ss={setSub} />}
      </main>
      {!sub && (
        <nav style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:`1px solid ${T.bd}`,display:"flex",zIndex:100,boxShadow:"0 -2px 20px rgba(0,0,0,.06)" }}>
          {navI.map(it => (
            <button key={it.k} onClick={() => { setTab(it.k); setSub(null); }}
              style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 0 12px",background:"none",border:"none",cursor:"pointer",color:tab===it.k?T.primary:T.tm }}>
              <div style={{ opacity:tab===it.k?1:.5 }}>{it.i}</div>
              <span style={{ fontSize:11,fontWeight:tab===it.k?600:400 }}>{it.l}</span>
              {tab===it.k && <div style={{ width:20,height:3,borderRadius:2,background:T.accent,marginTop:1 }}/>}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
// === CALENDAR VIEW ===
function CalView({ ev, addEv, updEv, delEv, co, ss, cM, sCM, cY, sCY, sd, sSD }) {
  const today = new Date();
  const fd = new Date(cY, cM, 1).getDay(), dim = new Date(cY, cM+1, 0).getDate(), off = (fd+6)%7;
  const evOn = d => ev.filter(e => { const ed=new Date(e.date); return ed.getDate()===d&&ed.getMonth()===cM&&ed.getFullYear()===cY; });
  const pm = () => cM===0?(sCM(11),sCY(y=>y-1)):sCM(m=>m-1);
  const nm = () => cM===11?(sCM(0),sCY(y=>y+1)):sCM(m=>m+1);
  const todayEvs = sd ? evOn(sd) : [];
  const upcoming = ev.filter(e=>new Date(e.date)>=new Date(today.getFullYear(),today.getMonth(),today.getDate())).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,5);
  return (
    <div>
      <div style={{ background:"#fff",margin:16,borderRadius:T.r,boxShadow:T.sh }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px" }}>
          <button onClick={pm} style={{ ...bI,fontSize:22 }}>‹</button>
          <h2 style={{ fontFamily:T.f,fontSize:16,fontWeight:700,margin:0,color:T.primary }}>{MO[cM]} {cY}</h2>
          <button onClick={nm} style={{ ...bI,fontSize:22 }}>›</button>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 12px",gap:2 }}>
          {["L","M","M","J","V","S","D"].map((d,i)=><div key={i} style={{ textAlign:"center",fontSize:11,fontWeight:600,color:T.tm,padding:"4px 0" }}>{d}</div>)}
          {Array.from({length:off}).map((_,i)=><div key={"e"+i}/>)}
          {Array.from({length:dim}).map((_,i)=>{ const d=i+1,isT=d===today.getDate()&&cM===today.getMonth()&&cY===today.getFullYear(),isSel=d===sd,de=evOn(d);
            return <button key={d} onClick={()=>sSD(isSel?null:d)} style={{ position:"relative",background:isSel?T.primary:isT?T.aL:"none",color:isSel?"#fff":T.tx,border:"none",borderRadius:10,padding:"8px 0",cursor:"pointer",fontWeight:isT?700:400,fontSize:14 }}>
              {d}{de.length>0&&<div style={{ display:"flex",gap:2,justifyContent:"center",marginTop:2 }}>{de.slice(0,3).map((e,j)=><div key={j} style={{ width:5,height:5,borderRadius:"50%",background:isSel?"#fff":(co.find(c=>c.nom===e.commission)?.color||T.accent) }}/>)}</div>}
            </button>; })}
        </div>
        <div style={{ height:12 }}/>
      </div>
      {sd && (
        <div style={{ padding:"0 16px",marginBottom:16 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <h3 style={{ fontFamily:T.f,fontSize:15,fontWeight:700,color:T.primary,margin:0 }}>{sd} {MO[cM]}</h3>
            <button onClick={()=>ss({title:"Nouvel événement",component:<EvForm co={co} addEv={addEv} ss={ss} defDate={new Date(cY,cM,sd)}/>})} style={{ ...bS,background:T.primary,color:"#fff" }}>{I.add}<span>Ajouter</span></button>
          </div>
          {todayEvs.length===0?<div style={{ background:"#fff",borderRadius:T.r,padding:20,textAlign:"center",color:T.tm,fontSize:14,boxShadow:T.sh }}>Aucun événement ce jour</div>
            :todayEvs.map(e=><EvCard key={e.id} e={e} co={co} updEv={updEv} delEv={delEv} ss={ss}/>)}
        </div>
      )}
      {!sd && (
        <div style={{ padding:"0 16px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
            <h3 style={{ fontFamily:T.f,fontSize:15,fontWeight:700,color:T.primary,margin:0 }}>Prochains événements</h3>
            <button onClick={()=>ss({title:"Nouvel événement",component:<EvForm co={co} addEv={addEv} ss={ss}/>})} style={{ ...bS,background:T.primary,color:"#fff" }}>{I.add}<span>Ajouter</span></button>
          </div>
          {upcoming.length===0?<div style={{ background:"#fff",borderRadius:T.r,padding:24,textAlign:"center",boxShadow:T.sh }}><div style={{ fontSize:32,marginBottom:8 }}>
            :upcoming.map(e=><EvCard key={e.id} e={e} co={co} updEv={updEv} delEv={delEv} ss={ss}/>)}
        </div>
      )}
    </div>
  );
}
function EvCard({ e, co, updEv, delEv, ss }) {
  const cm = co.find(c=>c.nom===e.commission), hasR = e.reminders?.length>0;
  return (
    <div style={{ background:"#fff",borderRadius:T.r,padding:"14px 16px",marginBottom:10,boxShadow:T.sh,borderLeft:`4px solid ${cm?.color||T.accent}` }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:600,fontSize:15,marginBottom:4,display:"flex",alignItems:"center",gap:6 }}>{e.title}{hasR&&<span style={{ color:T.accent,display:"flex" }}>{I.bl}</span>}</div>
          <div style={{ fontSize:13,color:T.tm,marginBottom:4 }}>{fmtD(e.date)} - {fmtT(e.date)}</div>
          {e.lieu&&<div style={{ fontSize:12,color:T.tm }}> {e.lieu}</div>}
          <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginTop:6 }}>
            {e.commission&&<span style={{ fontSize:11,fontWeight:500,background:(cm?.color||T.accent)+"18",color:cm?.color||T.accent,padding:"3px 10px",borderRadius:20 }}>{cm?.icon} {e.commission}</span>}
            {hasR&&<span style={{ fontSize:11,fontWeight:500,background:T.accent+"18",color:T.accent,padding:"3px 10px",borderRadius:20 }}>
          </div>
        </div>
        <div style={{ display:"flex",gap:6 }}>
          <button onClick={()=>ss({title:"Modifier",component:<EvForm co={co} updEv={updEv} ss={ss} ev={e}/>})} style={{ ...bI,color:T.tm }}>{I.ed}</button>
          <button onClick={()=>{if(confirm("Supprimer ?"))delEv(e.id);}} style={{ ...bI,color:T.red }}>{I.del}</button>
        </div>
      </div>
      {e.notes&&<div style={{ marginTop:8,fontSize:13,color:T.tm,lineHeight:1.5,borderTop:`1px solid ${T.bd}`,paddingTop:8 }}>{e.notes}</div>}
    </div>
  );
}
function EvForm({ co, addEv, updEv, ss, ev, defDate }) {
  const [title,setTitle]=useState(ev?.title||"");
  const [date,setDate]=useState(ev?.date?new Date(ev.date).toISOString().slice(0,16):(defDate?new Date(defDate.getTime()-defDate.getTimezoneOffset()*60000).toISOString().slice(0,11)+"18:00":""));
  const [lieu,setLieu]=useState(ev?.lieu||"Mairie de Noailly");
  const [comm,setComm]=useState(ev?.commission||"");
  const [notes,setNotes]=useState(ev?.notes||"");
  const [type,setType]=useState(ev?.type||"reunion");
  const [rems,setRems]=useState(ev?.reminders||[60]);
  const [saving,setSaving]=useState(false);
  const addR=()=>{ if(rems.length>=5)return; const a=REM_OPTS.find(o=>!rems.includes(o.v)); if(a)setRems([...rems,a.v]); };
  const delR=i=>setRems(rems.filter((_,j)=>j!==i));
  const updR=(i,v)=>{ const n=[...rems]; n[i]=parseInt(v); setRems(n); };
  const save=async()=>{
    if(!title||!date)return;
    setSaving(true);
    const obj={id:ev?.id||gid(),title,date,lieu,commission:comm,notes,type,reminders:rems};
    try { ev ? await updEv(obj) : await addEv(obj); ss(null); } catch(e) { alert("Erreur : "+e.message); }
    setSaving(false);
  };
  return (
    <div style={{ padding:16 }}>
      <div style={{ background:"#fff",borderRadius:T.r,padding:20,boxShadow:T.sh }}>
        <Fl label="Type"><div style={{ display:"flex",gap:8 }}>{[["reunion"," Réunion"],["conseil","
        <Fl label="Titre"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex: Conseil Municipal" style={iS}/></Fl>
        <Fl label="Date et heure"><input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} style={iS}/></Fl>
        <Fl label="Lieu"><input value={lieu} onChange={e=>setLieu(e.target.value)} style={iS}/></Fl>
        <Fl label="Commission"><select value={comm} onChange={e=>setComm(e.target.value)} style={iS}><option value="">— Aucune —</option>{co.map(c=><option key={c.id} value={c.nom}>{c.icon} {c.nom}</option>)}</select></Fl>
        <Fl label=" Rappels">
          <div style={{ background:T.bg,borderRadius:12,padding:14 }}>
            {rems.length===0&&<div style={{ fontSize:13,color:T.tm,textAlign:"center",padding:"8px 0" }}>Aucun rappel</div>}
            {rems.map((r,idx)=>(
              <div key={idx} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:idx<rems.length-1?8:0 }}>
                <div style={{ color:T.accent,flexShrink:0,display:"flex" }}>{I.ck}</div>
                <select value={r} onChange={e=>updR(idx,e.target.value)} style={{ ...iS,margin:0,flex:1,padding:"8px 12px",fontSize:13,background:"#fff" }}>{REM_OPTS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
                <button onClick={()=>delR(idx)} style={{ ...bI,color:T.red }}>{I.x}</button>
              </div>
            ))}
            {rems.length<5&&<button onClick={addR} style={{ display:"flex",alignItems:"center",gap:6,marginTop:rems.length>0?10:0,background:"none",border:`1.5px dashed ${T.bd}`,borderRadius:10,padding:"8px 14px",width:"100%",cursor:"pointer",color:T.primary,fontSize:13,fontWeight:500,justifyContent:"center" }}>{I.add} Ajouter un rappel</button>}
          </div>
        </Fl>
        <Fl label="Notes"><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Ordre du jour..." style={{ ...iS,resize:"vertical" }}/></Fl>
        <button onClick={save} disabled={saving} style={{ ...bP,width:"100%",marginTop:8,opacity:saving?.7:1 }}>{I.ok} <span>{saving?"Enregistrement...":(ev?"Modifier":"Créer l'événement")}</span></button>
      </div>
    </div>
  );
}
// === COMMISSIONS VIEW ===
function ComView({ co, addCo, updCo, delCo, ev, rp, ss }) {
  return (
    <div style={{ padding:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <h3 style={{ fontFamily:T.f,fontSize:15,fontWeight:700,color:T.primary,margin:0 }}>Commissions</h3>
        <button onClick={()=>ss({title:"Nouvelle commission",component:<CoForm addCo={addCo} ss={ss}/>})} style={{ ...bS,background:T.primary,color:"#fff" }}>{I.add}<span>Ajouter</span></button>
      </div>
      {co.map(c=>{ const cEv=ev.filter(e=>e.commission===c.nom),cRp=rp.filter(r=>r.commission===c.nom),nx=cEv.filter(e=>new Date(e.date)>=new Date()).sort((a,b)=>new Date(a.date)-new Date(b.date))[0];
        return <div key={c.id} style={{ background:"#fff",borderRadius:T.r,padding:"16px 18px",marginBottom:12,boxShadow:T.sh,borderLeft:`4px solid ${c.color}` }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10 }}><span style={{ fontSize:24 }}>{c.icon}</span><div><div style={{ fontWeight:600,fontSize:15 }}>{c.nom}</div><div style={{ fontSize:12,color:T.tm,marginTop:2 }}>{cEv.length} réunion{cEv.length>1?"s":""} - {cRp.length} rapport{cRp.length>1?"s":""}</div></div></div>
            <div style={{ display:"flex",gap:4 }}>
              <button onClick={()=>ss({title:"Modifier",component:<CoForm updCo={updCo} ss={ss} cm={c}/>})} style={{ ...bI,color:T.tm }}>{I.ed}</button>
              <button onClick={()=>{if(confirm("Supprimer ?"))delCo(c.id);}} style={{ ...bI,color:T.red }}>{I.del}</button>
            </div>
          </div>
          {nx&&<div style={{ marginTop:10,padding:"8px 12px",background:c.color+"0a",borderRadius:10,fontSize:13 }}><span style={{ fontWeight:600 }}>Prochaine : </span>{fmtD(nx.date)} à {fmtT(nx.date)}</div>}
        </div>;
      })}
    </div>
  );
}
function CoForm({ addCo, updCo, ss, cm }) {
  const [nom,setNom]=useState(cm?.nom||""); const [icon,setIcon]=useState(cm?.icon||" "); const [color,setColor]=useState(cm?.color||"#2563eb");
  const [saving,setSaving]=useState(false);
  const cols=["#2563eb","#059669","#d97706","#7c3aed","#0d9488","#dc2626","#db2777","#4f46e5","#0891b2"];
  const ics=[" "," "," "," "," "," "," "," "," ","⚕"," "," "," "," "," "];
  const save=async()=>{ if(!nom)return; setSaving(true); const o={id:cm?.id||gid(),nom,icon,color}; try { cm?await updCo(o):await addCo(o); ss(null); } catch(e){ alert("Erreur"); } setSaving(false); };
  return (
    <div style={{ padding:16 }}><div style={{ background:"#fff",borderRadius:T.r,padding:20,boxShadow:T.sh }}>
      <Fl label="Nom"><input value={nom} onChange={e=>setNom(e.target.value)} style={iS}/></Fl>
      <Fl label="Icône"><div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>{ics.map(ic=><button key={ic} onClick={()=>setIcon(ic)} style={{ width:40,height:40,borderRadius:10,border:`2px solid ${icon===ic?T.primary:T.bd}`,background:icon===ic?T.primary+"0d":"#fff",fontSize:20,cursor:"pointer" }}>{ic}</button>)}</div></Fl>
      <Fl label="Couleur"><div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>{cols.map(c=><button key={c} onClick={()=>setColor(c)} style={{ width:36,height:36,borderRadius:"50%",background:c,border:`3px solid ${color===c?T.primary:"transparent"}`,cursor:"pointer" }}/>)}</div></Fl>
      <button onClick={save} disabled={saving} style={{ ...bP,width:"100%",marginTop:8 }}>{I.ok} <span>{saving?"...":(cm?"Modifier":"Créer")}</span></button>
    </div></div>
  );
}
// === REPORTS VIEW ===
function RepView({ rp, addRp, updRp, delRp, co, ss }) {
  const [q,setQ]=useState("");
  const fl=rp.filter(r=>r.title?.toLowerCase().includes(q.toLowerCase())||r.content?.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ padding:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
        <h3 style={{ fontFamily:T.f,fontSize:15,fontWeight:700,color:T.primary,margin:0 }}>Comptes-rendus</h3>
        <button onClick={()=>ss({title:"Nouveau rapport",component:<RpForm co={co} addRp={addRp} ss={ss}/>})} style={{ ...bS,background:T.primary,color:"#fff" }}>{I.add}<span>Ajouter</span></button>
      </div>
      <div style={{ position:"relative",marginBottom:14 }}><div style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.tm }}>{I.sr}</div><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher..." style={{ ...iS,paddingLeft:40,width:"100%",boxSizing:"border-box" }}/></div>
      {fl.length===0?<div style={{ background:"#fff",borderRadius:T.r,padding:24,textAlign:"center",boxShadow:T.sh }}><div style={{ fontSize:32,marginBottom:8 }}>
        :fl.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r=>{ const cm=co.find(c=>c.nom===r.commission);
          return <div key={r.id} onClick={()=>ss({title:r.title,component:<RpDetail r={r} co={co} updRp={updRp} delRp={delRp} ss={ss}/>})} style={{ background:"#fff",borderRadius:T.r,padding:"14px 16px",marginBottom:10,boxShadow:T.sh,cursor:"pointer",display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:44,height:44,borderRadius:12,background:(cm?.color||T.accent)+"14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>{r.type==="pv"?"
            <div style={{ flex:1,minWidth:0 }}><div style={{ fontWeight:600,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{r.title}</div><div style={{ fontSize:12,color:T.tm,marginTop:2 }}>{fmtD(r.date)}</div>{r.commission&&<span style={{ display:"inline-block",marginTop:4,fontSize:10,fontWeight:500,background:(cm?.color||T.accent)+"18",color:cm?.color||T.accent,padding:"2px 8px",borderRadius:20 }}>{r.commission}</span>}</div>
            <div style={{ color:T.tm }}>{I.ch}</div>
          </div>;
        })}
    </div>
  );
}
function RpDetail({ r, co, updRp, delRp, ss }) {
  return <div style={{ padding:16 }}><div style={{ background:"#fff",borderRadius:T.r,padding:20,boxShadow:T.sh }}>
    <div style={{ fontSize:12,color:T.tm,marginBottom:8 }}>{fmtD(r.date)}{r.commission&&` - ${r.commission}`}</div>
    <div style={{ fontSize:14,lineHeight:1.7,whiteSpace:"pre-wrap" }}>{r.content||"Aucun contenu."}</div>
    <div style={{ display:"flex",gap:8,marginTop:16 }}>
      <button onClick={()=>ss({title:"Modifier",component:<RpForm co={co} updRp={updRp} ss={ss} rp={r}/>})} style={{ ...bS,background:T.primary+"10",color:T.primary }}>{I.ed}<span>Modifier</span></button>
      <button onClick={()=>{if(confirm("Supprimer ?")){ delRp(r.id); ss(null); }}} style={{ ...bS,background:T.red+"10",color:T.red }}>{I.del}<span>Supprimer</span></button>
    </div>
  </div></div>;
}
function RpForm({ co, addRp, updRp, ss, rp }) {
  const [title,setTitle]=useState(rp?.title||""); const [date,setDate]=useState(rp?.date?new Date(rp.date).toISOString().slice(0,10):new Date().toISOString().slice(0,10));
  const [type,setType]=useState(rp?.type||"pv"); const [comm,setComm]=useState(rp?.commission||""); const [content,setContent]=useState(rp?.content||"");
  const [saving,setSaving]=useState(false);
  const save=async()=>{ if(!title)return; setSaving(true); const o={id:rp?.id||gid(),title,date,type,commission:comm,content}; try { rp?await updRp(o):await addRp(o); ss(null); } catch(e){ alert("Erreur"); } setSaving(false); };
  return <div style={{ padding:16 }}><div style={{ background:"#fff",borderRadius:T.r,padding:20,boxShadow:T.sh }}>
    <Fl label="Type"><div style={{ display:"flex",gap:8 }}>{[["pv"," PV"],["cr"," CR"],["note","
    <Fl label="Titre"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex: PV Conseil du 15 mars" style={iS}/></Fl>
    <Fl label="Date"><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={iS}/></Fl>
    <Fl label="Commission"><select value={comm} onChange={e=>setComm(e.target.value)} style={iS}><option value="">— Aucune —</option>{co.map(c=><option key={c.id} value={c.nom}>{c.icon} {c.nom}</option>)}</select></Fl>
    <Fl label="Contenu"><textarea value={content} onChange={e=>setContent(e.target.value)} rows={8} placeholder="Rédiger le compte-rendu..." style={{ ...iS,resize:"vertical",lineHeight:1.6 }}/></Fl>
    <button onClick={save} disabled={saving} style={{ ...bP,width:"100%",marginTop:8 }}>{I.ok} <span>{saving?"Enregistrement...":(rp?"Modifier":"Enregistrer")}</span></button>
  </div></div>;
}
// === CONTACTS VIEW ===
function ConView({ el, addEl, updEl, delEl, co, ss }) {
  return <div style={{ padding:16 }}>
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
      <h3 style={{ fontFamily:T.f,fontSize:15,fontWeight:700,color:T.primary,margin:0 }}>Conseillers municipaux</h3>
      <button onClick={()=>ss({title:"Nouvel élu",component:<ElForm co={co} addEl={addEl} ss={ss}/>})} style={{ ...bS,background:T.primary,color:"#fff" }}>{I.add}<span>Ajouter</span></button>
    </div>
    <div style={{ background:"#fff",borderRadius:T.r,padding:"14px 18px",marginBottom:14,boxShadow:T.sh,display:"flex",justifyContent:"space-around" }}>
      <div style={{ textAlign:"center" }}><div style={{ fontSize:22,fontWeight:700,color:T.primary }}>{el.length}</div><div style={{ fontSize:11,color:T.tm }}>Élus</div></div>
      <div style={{ width:1,background:T.bd }}/>
      <div style={{ textAlign:"center" }}><div style={{ fontSize:22,fontWeight:700,color:T.accent }}>{co.length}</div><div style={{ fontSize:11,color:T.tm }}>Commissions</div></div>
    </div>
    {el.map(e=>(
      <div key={e.id} style={{ background:"#fff",borderRadius:T.r,padding:"14px 16px",marginBottom:10,boxShadow:T.sh,display:"flex",alignItems:"center",gap:14 }}>
        <div style={{ width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${T.primary},${T.pL})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:16,flexShrink:0 }}>{(e.prenom?.[0]||"").toUpperCase()}{(e.nom?.[0]||"").toUpperCase()}</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontWeight:600,fontSize:15 }}>{e.prenom} {e.nom}</div>
          <div style={{ fontSize:13,color:T.accent,fontWeight:500 }}>{e.role}</div>
          {e.commission&&<div style={{ fontSize:12,color:T.tm,marginTop:2 }}>{e.commission}</div>}
          <div style={{ display:"flex",gap:10,marginTop:4 }}>
            {e.tel&&<a href={`tel:${e.tel}`} style={{ fontSize:12,color:T.primary,textDecoration:"none" }}>
            {e.email&&<a href={`mailto:${e.email}`} style={{ fontSize:12,color:T.primary,textDecoration:"none" }}>
          </div>
        </div>
        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
          <button onClick={()=>ss({title:"Modifier",component:<ElForm co={co} updEl={updEl} ss={ss} el={e}/>})} style={{ ...bI,color:T.tm }}>{I.ed}</button>
          <button onClick={()=>{if(confirm("Supprimer ?"))delEl(e.id);}} style={{ ...bI,color:T.red }}>{I.del}</button>
        </div>
      </div>
    ))}
  </div>;
}
function ElForm({ co, addEl, updEl, ss, el }) {
  const [nom,setNom]=useState(el?.nom||""); const [prenom,setPrenom]=useState(el?.prenom||""); const [role,setRole]=useState(el?.role||"Conseiller municipal");
  const [tel,setTel]=useState(el?.tel||""); const [email,setEmail]=useState(el?.email||""); const [comm,setComm]=useState(el?.commission||"");
  const [saving,setSaving]=useState(false);
  const save=async()=>{ if(!nom)return; setSaving(true); const o={id:el?.id||gid(),nom,prenom,role,tel,email,commission:comm}; try { el?await updEl(o):await addEl(o); ss(null); } catch(e){ alert("Erreur"); } setSaving(false); };
  return <div style={{ padding:16 }}><div style={{ background:"#fff",borderRadius:T.r,padding:20,boxShadow:T.sh }}>
    <Fl label="Prénom"><input value={prenom} onChange={e=>setPrenom(e.target.value)} style={iS}/></Fl>
    <Fl label="Nom"><input value={nom} onChange={e=>setNom(e.target.value)} style={iS}/></Fl>
    <Fl label="Fonction"><select value={role} onChange={e=>setRole(e.target.value)} style={iS}>{["Maire","1er Adjoint","2e Adjoint","3e Adjoint","Conseiller municipal","Conseiller délégué"].map(r=><option key={r} value={r}>{r}</option>)}</select></Fl>
    <Fl label="Téléphone"><input type="tel" value={tel} onChange={e=>setTel(e.target.value)} placeholder="06 00 00 00 00" style={iS}/></Fl>
    <Fl label="Email"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={iS}/></Fl>
    <Fl label="Commission"><select value={comm} onChange={e=>setComm(e.target.value)} style={iS}><option value="">— Aucune —</option>{co.map(c=><option key={c.id} value={c.nom}>{c.icon} {c.nom}</option>)}</select></Fl>
    <button onClick={save} disabled={saving} style={{ ...bP,width:"100%",marginTop:8 }}>{I.ok} <span>{saving?"...":(el?"Modifier":"Ajouter l'élu")}</span></button>
  </div></div>;
}
