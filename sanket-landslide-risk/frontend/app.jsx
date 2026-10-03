import { useEffect, useState } from "react";
import "./styles.css";

const API = "http://localhost:8000/api";
const COLOR = { Critical: "#e5322d", High: "#f0840c", Moderate: "#e6c619", Low: "#34a853" };
const NAV = ["Dashboard", "Live Monitoring", "Risk Map", "Sensor Data", "Alerts", "Predictions", "Historical Data", "Settings", "User Management"];

// Fetch helper that refreshes on an interval (live data)
function useApi(path, every = 0) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const load = () => fetch(`${API}${path}`).then(r => r.json()).then(setData).catch(() => {});
    load();
    if (!every) return;
    const id = setInterval(load, every);
    return () => clearInterval(id);
  }, [path, every]);
  return data;
}

// Risk map = your rendered image + pins placed in % of the image
const POS = { "Lebong, Darjeeling": [48, 45], "Sukhiapokhri": [32, 34], "Kalimpong Town": [61, 36],
              "Mirik": [63, 66], "Kurseong": [52, 71] };
function RiskMap({ areas, height = 420 }) {
  if (!areas) return <div className="card">Loading map…</div>;
  return (
    <div className="riskmap" style={{ height }}>
      {areas.map(a => POS[a.name] && (
        <button key={a.name} className="pin" title={`${a.name}: ${a.score}% (${a.level})`}
          style={{ left: POS[a.name][0] + "%", top: POS[a.name][1] + "%", "--c": COLOR[a.level] }}>
          <i /><span>{a.name.split(",")[0]} <b>{a.score}</b></span>
        </button>))}
    </div>
  );
}

const Badge = ({ level }) => <span className="badge" style={{ background: COLOR[level] }}>{level}</span>;

function Dashboard() {
  const sum = useApi("/summary", 10000), areas = useApi("/areas", 10000),
        live = useApi("/sensors/live", 5000), alerts = useApi("/alerts", 10000);
  return (
    <>
      <div className="stats">
        <div className="card"><h4>Overall Risk Level</h4><b className="big red">{sum?.overall ?? "–"}%</b></div>
        <div className="card"><h4>Affected Areas</h4><b className="big orange">{sum?.high ?? "–"}</b> High Risk</div>
        <div className="card"><h4>Active Alerts</h4><b className="big red">{sum?.critical ?? "–"}</b> Critical</div>
        <div className="card"><h4>Monitored Areas</h4><b className="big green">{sum?.monitored ?? "–"}</b> Total</div>
        <div className="card"><h4>Sensors Online</h4><b className="big green">{sum ? `${sum.sensors_online}/${sum.sensors_total}` : "–"}</b></div>
      </div>
      <div className="row">
        <div className="card grow"><h3>Landslide Risk Map</h3><RiskMap areas={areas} /></div>
        <div className="card side"><h3>Recent Alerts</h3>
          {alerts?.map(a => (
            <div key={a.area} className="alert" style={{ borderColor: COLOR[a.level] }}>
              <b style={{ color: COLOR[a.level] }}>{a.title}</b><br />{a.area} · {a.time} <Badge level={a.level} />
            </div>))}
        </div>
      </div>
      <div className="card"><h3>Current Sensor Readings (Live)</h3>
        <div className="stats">
          <div>Rainfall <b className="big">{live?.rainfall} mm</b></div>
          <div>Soil Moisture <b className="big">{live?.soil_moisture}%</b></div>
          <div>Ground Movement <b className="big">{live?.ground_movement} mm/hr</b></div>
          <div>Soil Temp <b className="big">{live?.soil_temp} °C</b></div>
        </div>
      </div>
    </>
  );
}

function Alerts() {
  const alerts = useApi("/alerts", 10000);
  return alerts?.map(a => (
    <div key={a.area} className="card alert big-alert" style={{ borderColor: COLOR[a.level] }}>
      <div><h3 style={{ color: COLOR[a.level] }}>{a.title}</h3>Area: {a.area} · Risk Score: {a.score}%</div>
      <div>{a.time}<br /><Badge level={a.level} /></div>
    </div>)) ?? <p>Loading…</p>;
}

function Sensors() {
  const live = useApi("/sensors/live", 3000);
  if (!live) return <p>Loading…</p>;
  return (
    <div className="stats">
      {[["Rainfall (mm)", live.rainfall], ["Soil Moisture (%)", live.soil_moisture],
        ["Ground Movement (mm/hr)", live.ground_movement], ["Soil Temperature (°C)", live.soil_temp],
        ["Sensors Online", `${live.online}/${live.total}`]].map(([k, v]) =>
        <div className="card" key={k}><h4>{k}</h4><b className="big">{v}</b></div>)}
    </div>
  );
}

function Predictions() {
  const p = useApi("/predictions", 15000);
  if (!p) return <p>Loading…</p>;
  return (
    <>
      <div className="card"><h3>Risk Predictions</h3>
        <table><thead><tr><th>Area</th><th>Risk Score</th><th>Level</th><th>Updated</th></tr></thead>
          <tbody>{p.rows.map(r => <tr key={r.name}><td>{r.name}</td><td>{r.score}%</td><td><Badge level={r.level} /></td><td>{r.updated}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="card"><h3>Model: {p.model.name}</h3>
        Accuracy {p.model.accuracy}% · Precision {p.model.precision}% · Recall {p.model.recall}% · F1 {p.model.f1}%
      </div>
    </>
  );
}

function FullMap() {
  const areas = useApi("/areas", 10000);
  return <div className="card"><RiskMap areas={areas} height={640} /></div>;
}

const Soon = ({ name }) => <div className="card">{name} page: next to build.</div>;

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const view = {
    Dashboard: <Dashboard />, "Risk Map": <FullMap />, Alerts: <Alerts />,
    "Sensor Data": <Sensors />, "Live Monitoring": <Dashboard />, Predictions: <Predictions />,
  }[page] ?? <Soon name={page} />;
  return (
    <div className="app">
      <aside>
        <div className="logo">SANKET</div>
        {NAV.map(n => <button key={n} className={n === page ? "on" : ""} onClick={() => setPage(n)}>{n}</button>)}
      </aside>
      <main>
        <header><h1>{page === "Dashboard" ? "Landslide Early Warning System" : page}</h1><span>Admin</span></header>
        {view}
      </main>
    </div>
  );
}