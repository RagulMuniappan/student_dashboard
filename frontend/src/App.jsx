import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell, Legend, LabelList, ReferenceLine
} from "recharts";

const MOCK = {
  overview: { total_students:520, pass_count:490, fail_count:30, pass_rate:94.2, avg_attendance:75.4, avg_marks:70.3 },
  subjectPerf: [
    {subject:"Maths",     average:70.1, pass_rate:98.5, highest:100.0, lowest:24.8},
    {subject:"Physics",   average:70.5, pass_rate:98.7, highest:100.0, lowest:33.8},
    {subject:"Chemistry", average:69.8, pass_rate:97.9, highest:99.2,  lowest:22.1},
    {subject:"English",   average:71.2, pass_rate:99.0, highest:100.0, lowest:28.5},
    {subject:"CS",        average:72.4, pass_rate:99.2, highest:100.0, lowest:31.2},
    {subject:"Tamil",     average:70.9, pass_rate:98.8, highest:99.8,  lowest:26.7},
  ],
  trend: [
    {semester:"Sem 1",pass:61,fail:6},{semester:"Sem 2",pass:57,fail:5},
    {semester:"Sem 3",pass:64,fail:4},{semester:"Sem 4",pass:58,fail:7},
    {semester:"Sem 5",pass:60,fail:3},{semester:"Sem 6",pass:65,fail:5},
    {semester:"Sem 7",pass:62,fail:4},{semester:"Sem 8",pass:63,fail:5},
  ],
  attendance: [
    {range:"30-50%",avg_marks:57.0,pass_rate:84.6,count:26},
    {range:"50-60%",avg_marks:61.6,pass_rate:83.1,count:59},
    {range:"60-75%",avg_marks:67.3,pass_rate:91.2,count:134},
    {range:"75-85%",avg_marks:72.8,pass_rate:96.7,count:178},
    {range:"85-100%",avg_marks:78.4,pass_rate:99.1,count:123},
  ],
  deptStats: [
    {department:"CSE", students:108, avg_marks:71.2, pass_rate:95.4, avg_attendance:76.1},
    {department:"IT",  students:104, avg_marks:70.8, pass_rate:94.2, avg_attendance:75.8},
    {department:"ECE", students:103, avg_marks:69.5, pass_rate:93.2, avg_attendance:74.9},
    {department:"EEE", students:102, avg_marks:70.1, pass_rate:94.1, avg_attendance:75.5},
    {department:"MECH",students:103, avg_marks:69.9, pass_rate:93.2, avg_attendance:74.8},
  ],
};

const BASE = "http://localhost:8000";
async function apiFetch(path) {
  try {
    const r = await fetch(BASE + path);
    if (!r.ok) throw new Error("bad");
    return await r.json();
  } catch { return null; }
}

const C = {
  blue:    "#1A6FD4",
  teal:    "#0FA37F",
  rose:    "#D94F6A",
  amber:   "#D97706",
  violet:  "#7C3AED",
  bg:      "#F5F7FA",
  surface: "#FFFFFF",
  border:  "#DDE3ED",
  muted:   "#8A96A8",
  text:    "#1A2233",
  sub:     "#4A5568",
  gridLine:"#E8ECF2",
};

const ACCENT = [C.blue, C.teal, C.rose, C.amber, C.violet, "#059669"];
const DEPT_C  = [C.blue, C.teal, C.rose, C.amber, C.violet];
const FONT    = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const TICK    = { fill: C.sub,  fontSize: 11, fontFamily: FONT, fontWeight: 500 };
const YLABEL  = { fill: C.muted, fontSize: 10, fontFamily: FONT };

function Card({ children, style={} }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "20px 24px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)", ...style }}>
      {children}
    </div>
  );
}

function Title({ children }) {
  return <h2 style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.text,
    marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{children}</h2>;
}

function Sub({ children }) {
  return <p style={{ color: C.muted, fontSize: 11, fontFamily: FONT, marginBottom: 14 }}>{children}</p>;
}

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:`1px solid ${C.border}`, borderRadius:8,
      padding:"10px 14px", fontSize:12, fontFamily:FONT,
      boxShadow:"0 4px 12px rgba(0,0,0,0.10)" }}>
      <p style={{ color:C.text, fontWeight:700, marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color, margin:"3px 0", fontWeight:500 }}>
          {p.name}: <strong style={{ color:C.text }}>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

function StatTile({ label, value, sub, accent }) {
  return (
    <Card style={{ position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:4,
        background:accent, borderRadius:"10px 10px 0 0" }} />
      <p style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:"0.12em",
        margin:"6px 0 8px", fontFamily:FONT, fontWeight:700 }}>{label}</p>
      <p style={{ color:C.text, fontSize:30, fontFamily:FONT, fontWeight:800, margin:0, lineHeight:1 }}>{value}</p>
      {sub && <p style={{ color:C.muted, fontSize:11, marginTop:6, fontFamily:FONT }}>{sub}</p>}
    </Card>
  );
}

function FilterBar({ filters, dept, setDept, sem, setSem }) {
  const btn = (active, accent=C.blue) => ({
    background: active ? accent : "#fff",
    color: active ? "#fff" : C.sub,
    border: `1px solid ${active ? accent : C.border}`,
    borderRadius: 6, padding: "5px 12px", fontSize: 11,
    cursor: "pointer", fontWeight: active ? 700 : 500,
    fontFamily: FONT, transition: "all .15s",
    boxShadow: active ? `0 2px 6px ${accent}40` : "none",
  });
  return (
    <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center",
      marginBottom:24, padding:"12px 16px", background:"#fff",
      border:`1px solid ${C.border}`, borderRadius:8 }}>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ color:C.muted, fontSize:10, fontFamily:FONT, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.1em", marginRight:4 }}>Dept</span>
        {(filters.departments || ["All","CSE","IT","ECE","EEE","MECH"]).map(d => (
          <button key={d} style={btn(dept===d)} onClick={()=>setDept(d)}>{d}</button>
        ))}
      </div>
      <div style={{ width:1, height:24, background:C.border }} />
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ color:C.muted, fontSize:10, fontFamily:FONT, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.1em", marginRight:4 }}>Semester</span>
        {[0,1,2,3,4,5,6,7,8].map(s => (
          <button key={s} style={btn(sem===s, C.teal)} onClick={()=>setSem(s)}>
            {s===0 ? "All" : `Sem ${s}`}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [dept,      setDept]      = useState("All");
  const [sem,       setSem]       = useState(0);
  const [filters,   setFilters]   = useState({departments:[],semesters:[]});
  const [overview,  setOverview]  = useState(MOCK.overview);
  const [subjPerf,  setSubjPerf]  = useState(MOCK.subjectPerf);
  const [trend,     setTrend]     = useState(MOCK.trend);
  const [attend,    setAttend]    = useState(MOCK.attendance);
  const [deptStats, setDeptStats] = useState(MOCK.deptStats);
  const [online,    setOnline]    = useState(false);
  const [tab,       setTab]       = useState("overview");

  useEffect(() => {
    apiFetch("/api/filters").then(d=>{ if(d){setFilters(d);setOnline(true);} });
    apiFetch("/api/department-stats").then(d=>{ if(d) setDeptStats(d); });
  }, []);

  useEffect(() => {
    const q = `?department=${dept}&semester=${sem}`;
    apiFetch(`/api/overview${q}`).then(d=>{ if(d) setOverview(d); });
    apiFetch(`/api/subject-performance${q}`).then(d=>{
      if(d) setSubjPerf(d.map(s=>({...s, subject: s.subject.split(" ")[0]})));
    });
    apiFetch(`/api/pass-fail-trend?department=${dept}`).then(d=>{ if(d) setTrend(d); });
    apiFetch(`/api/attendance-correlation${q}`).then(d=>{ if(d) setAttend(d); });
  }, [dept, sem]);

  const TABS = ["overview","subjects","trends","departments"];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:FONT, padding:"0 0 60px" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};font-family:${FONT};}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px;}
        button:hover{opacity:0.82;}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom:`1px solid ${C.border}`, padding:"16px 40px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"#fff", position:"sticky", top:0, zIndex:100,
        boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
        <div>
          <h1 style={{ fontFamily:FONT, fontSize:20, fontWeight:800, color:C.blue, letterSpacing:"-0.02em" }}>
            Academia
          </h1>
          <p style={{ color:C.muted, fontSize:10, letterSpacing:"0.14em",
            textTransform:"uppercase", marginTop:2, fontWeight:700 }}>
            Student Performance Analytics
          </p>
        </div>
        <div style={{ display:"flex", gap:4, background:C.bg, borderRadius:8,
          padding:4, border:`1px solid ${C.border}` }}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{
              background: tab===t ? "#fff" : "transparent",
              color: tab===t ? C.blue : C.muted,
              border:"none", borderRadius:6, padding:"6px 18px",
              fontSize:12, cursor:"pointer", textTransform:"capitalize",
              fontWeight: tab===t ? 700 : 500, fontFamily:FONT,
              boxShadow: tab===t ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
              transition:"all .15s",
            }}>{t}</button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6,
          color: online ? C.teal : C.muted, fontSize:11, fontWeight:700 }}>
          <span style={{ width:7, height:7, borderRadius:"50%",
            background: online ? C.teal : C.muted, display:"inline-block" }} />
          {online ? "API Connected" : "Demo Mode"}
        </div>
      </div>

      <div style={{ padding:"28px 40px" }}>
        <FilterBar filters={filters} dept={dept} setDept={setDept} sem={sem} setSem={setSem} />

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",
              gap:14, marginBottom:24 }}>
              <StatTile label="Total Students"  value={overview.total_students}          accent={C.blue}   />
              <StatTile label="Pass Rate"        value={`${overview.pass_rate}%`}
                sub={`${overview.pass_count} passed / ${overview.fail_count} failed`}    accent={C.teal}   />
              <StatTile label="Failed Students"  value={overview.fail_count}              accent={C.rose}   />
              <StatTile label="Avg Attendance"   value={`${overview.avg_attendance}%`}
                sub="across all students"                                                 accent={C.amber}  />
              <StatTile label="Avg Score"        value={`${overview.avg_marks}`}
                sub="out of 100 marks"                                                    accent={C.violet} />
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:14 }}>
              <Card>
                <Title>Pass vs Fail</Title>
                <Sub>Total {overview.total_students} students · Pass mark: 40</Sub>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    {name:"Pass",value:overview.pass_count},
                    {name:"Fail",value:overview.fail_count},
                  ]} layout="vertical" barCategoryGap="30%" margin={{left:10,right:50,top:8,bottom:20}}>
                    <XAxis type="number" tick={TICK} axisLine={{stroke:C.border}} tickLine={false} tickCount={6}
                      label={{value:"Number of Students", position:"insideBottom", offset:-8,
                        fill:C.muted, fontSize:10, fontFamily:FONT}} />
                    <YAxis type="category" dataKey="name"
                      tick={{...TICK,fontSize:13,fontWeight:700}} axisLine={false} tickLine={false} width={38} />
                    <CartesianGrid horizontal={false} stroke={C.gridLine} strokeDasharray="3 3" />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="value" radius={[0,6,6,0]}>
                      <LabelList dataKey="value" position="right"
                        style={{fill:C.sub,fontSize:11,fontFamily:FONT,fontWeight:700}} />
                      {[C.teal,C.rose].map((c,i)=><Cell key={i} fill={c}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <Title>Attendance → Average Marks Correlation</Title>
                <Sub>Higher attendance consistently drives better academic scores</Sub>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={attend} margin={{left:10,right:20,top:8,bottom:28}}>
                    <defs>
                      <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.blue} stopOpacity={0.18}/>
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={C.gridLine} strokeDasharray="3 3"/>
                    <XAxis dataKey="range" tick={TICK} axisLine={{stroke:C.border}} tickLine={false}
                      label={{value:"Attendance Range", position:"insideBottom", offset:-16,
                        fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                    <YAxis domain={[50,85]} tick={TICK} axisLine={{stroke:C.border}}
                      tickLine={false} tickCount={8}
                      label={{value:"Avg Marks (out of 100)", angle:-90, position:"insideLeft", offset:14,
                        fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                    <Tooltip content={<Tip/>}/>
                    <Area type="monotone" dataKey="avg_marks" name="Avg Marks"
                      stroke={C.blue} fill="url(#ag)" strokeWidth={2.5}
                      dot={{fill:C.blue,r:5,strokeWidth:2,stroke:"#fff"}} activeDot={{r:7}}>
                      <LabelList dataKey="avg_marks" position="top"
                        style={{fill:C.blue,fontSize:10,fontFamily:FONT,fontWeight:700}}/>
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </>
        )}

        {/* ── SUBJECTS ── */}
        {tab === "subjects" && (
          <div style={{display:"grid", gridTemplateColumns:"3fr 2fr", gap:14}}>
            <Card>
              <Title>Subject-wise Average Marks</Title>
              <Sub>Pass mark: 40 | Max marks: 100 | Red dashed line = pass threshold</Sub>
              <ResponsiveContainer width="100%" height={310}>
                <BarChart data={subjPerf} barCategoryGap="35%"
                  margin={{top:20,right:20,left:10,bottom:32}}>
                  <CartesianGrid stroke={C.gridLine} strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="subject" tick={TICK} axisLine={{stroke:C.border}} tickLine={false}
                    label={{value:"Subject", position:"insideBottom", offset:-20,
                      fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                  <YAxis domain={[0,100]} tick={TICK} axisLine={{stroke:C.border}}
                    tickLine={false} tickCount={11}
                    label={{value:"Average Marks (out of 100)", angle:-90,
                      position:"insideLeft", offset:16,
                      fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                  <ReferenceLine y={40} stroke={C.rose} strokeDasharray="4 3"
                    label={{value:"Pass Mark (40)", position:"right",
                      fill:C.rose, fontSize:10, fontFamily:FONT}}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="average" name="Avg Marks" radius={[5,5,0,0]}>
                    <LabelList dataKey="average" position="top"
                      style={{fill:C.sub,fontSize:10,fontFamily:FONT,fontWeight:700}}/>
                    {subjPerf.map((_,i)=><Cell key={i} fill={ACCENT[i%6]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Title>Subject Pass Rates (%)</Title>
              <Sub>Radar scale: 90–100% · All subjects performing well</Sub>
              <ResponsiveContainer width="100%" height={310}>
                <RadarChart data={subjPerf} margin={{top:10,right:30,bottom:10,left:30}}>
                  <PolarGrid stroke={C.gridLine}/>
                  <PolarAngleAxis dataKey="subject" tick={{...TICK,fontSize:12,fontWeight:700}}/>
                  <PolarRadiusAxis angle={90} domain={[90,100]} tick={YLABEL} tickCount={3}/>
                  <Radar name="Pass %" dataKey="pass_rate"
                    stroke={C.blue} fill={C.blue} fillOpacity={0.15} strokeWidth={2}/>
                  <Tooltip content={<Tip/>}/>
                </RadarChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{gridColumn:"1 / -1"}}>
              <Title>Subject Detail Breakdown</Title>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:FONT,marginTop:12}}>
                <thead>
                  <tr style={{background:C.bg}}>
                    {["Subject","Avg Marks","Pass Rate (%)","Highest Score","Lowest Score","Rating"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"10px 14px",color:C.muted,
                        fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em",
                        borderBottom:`2px solid ${C.border}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjPerf.map((s,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${C.gridLine}`}}>
                      <td style={{padding:"11px 14px",fontWeight:700,color:ACCENT[i]}}>{s.subject}</td>
                      <td style={{padding:"11px 14px"}}>
                        <span style={{background:`${C.blue}12`,color:C.blue,
                          padding:"3px 10px",borderRadius:4,fontWeight:700}}>{s.average}</span>
                      </td>
                      <td style={{padding:"11px 14px",color: s.pass_rate>95?C.teal:C.amber,fontWeight:700}}>
                        {s.pass_rate}%
                      </td>
                      <td style={{padding:"11px 14px",color:C.teal,fontWeight:600}}>{s.highest ?? "–"}</td>
                      <td style={{padding:"11px 14px",color:C.rose,fontWeight:600}}>{s.lowest ?? "–"}</td>
                      <td style={{padding:"11px 14px"}}>
                        <span style={{
                          background: s.pass_rate>=99 ? `${C.teal}15` : s.pass_rate>=97 ? `${C.amber}15` : `${C.rose}15`,
                          color:       s.pass_rate>=99 ? C.teal        : s.pass_rate>=97 ? C.amber        : C.rose,
                          padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:700
                        }}>
                          {s.pass_rate>=99 ? "Excellent" : s.pass_rate>=97 ? "Good" : "Average"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── TRENDS ── */}
        {tab === "trends" && (
          <div style={{display:"grid",gap:14}}>
            <Card>
              <Title>Pass / Fail Count by Semester</Title>
              <Sub>Grouped bars — exact counts labeled on top of each bar</Sub>
              <ResponsiveContainer width="100%" height={310}>
                <BarChart data={trend} barCategoryGap="28%" barGap={3}
                  margin={{top:20,right:24,left:10,bottom:32}}>
                  <CartesianGrid stroke={C.gridLine} strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="semester" tick={TICK} axisLine={{stroke:C.border}} tickLine={false}
                    label={{value:"Semester", position:"insideBottom", offset:-20,
                      fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                  <YAxis tick={TICK} axisLine={{stroke:C.border}} tickLine={false}
                    tickCount={9} domain={[0,80]}
                    label={{value:"Number of Students", angle:-90, position:"insideLeft", offset:16,
                      fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                  <Tooltip content={<Tip/>}/>
                  <Legend wrapperStyle={{color:C.sub,fontSize:12,fontFamily:FONT,paddingTop:8}}/>
                  <Bar dataKey="pass" name="Pass" fill={C.teal} radius={[4,4,0,0]}>
                    <LabelList dataKey="pass" position="top"
                      style={{fill:C.teal,fontSize:10,fontFamily:FONT,fontWeight:700}}/>
                  </Bar>
                  <Bar dataKey="fail" name="Fail" fill={C.rose} radius={[4,4,0,0]}>
                    <LabelList dataKey="fail" position="top"
                      style={{fill:C.rose,fontSize:10,fontFamily:FONT,fontWeight:700}}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Title>Pass Rate Trend across Semesters (%)</Title>
              <Sub>Y-axis: 80–100% range | Amber dashed line = 90% target | Values labeled on each point</Sub>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={trend.map(t=>({...t, pass_rate:+(t.pass/(t.pass+t.fail)*100).toFixed(1)}))}
                  margin={{top:20,right:40,left:10,bottom:32}}>
                  <CartesianGrid stroke={C.gridLine} strokeDasharray="3 3"/>
                  <XAxis dataKey="semester" tick={TICK} axisLine={{stroke:C.border}} tickLine={false}
                    label={{value:"Semester", position:"insideBottom", offset:-20,
                      fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                  <YAxis domain={[80,100]} tick={TICK} axisLine={{stroke:C.border}}
                    tickLine={false} tickCount={11}
                    label={{value:"Pass Rate (%)", angle:-90, position:"insideLeft", offset:16,
                      fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                  <ReferenceLine y={90} stroke={C.amber} strokeDasharray="4 3"
                    label={{value:"90% Target", position:"right",
                      fill:C.amber, fontSize:10, fontFamily:FONT}}/>
                  <Tooltip content={<Tip/>}/>
                  <Line type="monotone" dataKey="pass_rate" name="Pass Rate %"
                    stroke={C.blue} strokeWidth={2.5}
                    dot={{fill:C.blue,r:5,strokeWidth:2,stroke:"#fff"}} activeDot={{r:7}}>
                    <LabelList dataKey="pass_rate" position="top"
                      style={{fill:C.blue,fontSize:10,fontFamily:FONT,fontWeight:700}}/>
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <Title>Attendance Band vs Pass Rate (%)</Title>
              <Sub>Students with 85-100% attendance achieve a 99.1% pass rate</Sub>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attend} barCategoryGap="35%"
                  margin={{top:20,right:24,left:10,bottom:32}}>
                  <CartesianGrid stroke={C.gridLine} strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="range" tick={TICK} axisLine={{stroke:C.border}} tickLine={false}
                    label={{value:"Attendance Range", position:"insideBottom", offset:-20,
                      fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                  <YAxis domain={[70,100]} tick={TICK} axisLine={{stroke:C.border}}
                    tickLine={false} tickCount={7}
                    label={{value:"Pass Rate (%)", angle:-90, position:"insideLeft", offset:16,
                      fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                  <Tooltip content={<Tip/>}/>
                  <Bar dataKey="pass_rate" name="Pass Rate %" radius={[5,5,0,0]}>
                    <LabelList dataKey="pass_rate" position="top"
                      style={{fill:C.sub,fontSize:10,fontFamily:FONT,fontWeight:700}}/>
                    {attend.map((_,i)=>(
                      <Cell key={i} fill={[C.rose,"#E8A030",C.amber,C.blue,C.teal][i]??C.teal}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── DEPARTMENTS ── */}
        {tab === "departments" && (
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
            <Card style={{gridColumn:"1 / -1"}}>
              <Title>Department Comparison — Avg Marks & Avg Attendance (%)</Title>
              <Sub>Side-by-side grouped bars across all 5 departments · Values labeled on each bar</Sub>
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={deptStats} barCategoryGap="28%" barGap={4}
                  margin={{top:20,right:24,left:10,bottom:32}}>
                  <CartesianGrid stroke={C.gridLine} strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="department" tick={{...TICK,fontWeight:700}}
                    axisLine={{stroke:C.border}} tickLine={false}
                    label={{value:"Department", position:"insideBottom", offset:-20,
                      fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                  <YAxis tick={TICK} axisLine={{stroke:C.border}} tickLine={false}
                    tickCount={10} domain={[0,90]}
                    label={{value:"Score / Attendance (%)", angle:-90,
                      position:"insideLeft", offset:18,
                      fill:C.muted, fontSize:10, fontFamily:FONT}}/>
                  <Tooltip content={<Tip/>}/>
                  <Legend wrapperStyle={{color:C.sub,fontSize:12,fontFamily:FONT,paddingTop:8}}/>
                  <Bar dataKey="avg_marks" name="Avg Marks" fill={C.blue} radius={[4,4,0,0]}>
                    <LabelList dataKey="avg_marks" position="top"
                      style={{fill:C.blue,fontSize:10,fontFamily:FONT,fontWeight:700}}/>
                  </Bar>
                  <Bar dataKey="avg_attendance" name="Avg Attendance %" fill={C.teal} radius={[4,4,0,0]}>
                    <LabelList dataKey="avg_attendance" position="top"
                      style={{fill:C.teal,fontSize:10,fontFamily:FONT,fontWeight:700}}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {deptStats.map((d,i)=>(
              <Card key={d.department}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <p style={{color:DEPT_C[i],fontSize:22,fontWeight:800,fontFamily:FONT}}>{d.department}</p>
                    <p style={{color:C.muted,fontSize:11,marginTop:2}}>{d.students} students enrolled</p>
                  </div>
                  <span style={{
                    background:`${DEPT_C[i]}12`, color:DEPT_C[i],
                    border:`1.5px solid ${DEPT_C[i]}50`,
                    borderRadius:20, padding:"5px 14px",
                    fontSize:12, fontWeight:700, fontFamily:FONT,
                  }}>{d.pass_rate}% pass</span>
                </div>
                <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {label:"Avg Marks",     value:d.avg_marks,           color:C.blue, note:"/ 100"},
                    {label:"Avg Attendance",value:`${d.avg_attendance}%`, color:C.teal, note:""},
                  ].map(m=>(
                    <div key={m.label} style={{background:C.bg,border:`1px solid ${C.border}`,
                      borderRadius:8,padding:"12px 14px"}}>
                      <p style={{color:C.muted,fontSize:10,textTransform:"uppercase",
                        letterSpacing:"0.1em",fontWeight:700}}>{m.label}</p>
                      <p style={{color:m.color,fontSize:24,fontWeight:800,fontFamily:FONT,marginTop:4}}>{m.value}</p>
                      {m.note && <p style={{color:C.muted,fontSize:10,marginTop:2}}>{m.note}</p>}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
