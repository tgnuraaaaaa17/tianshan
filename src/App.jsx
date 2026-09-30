import { useState } from "react";
import "./App.css";

const STATUSES = ["Ready", "Climbing", "Resting", "Summited"];
const ROLES = ["Leader", "Guide", "Medic", "Porter"];

const INITIAL = [
  { id: 1, name: "Baigabyl Nurdaulet", role: "Leader", peak: "Talgar Peak", altitude: 4979, status: "Climbing" },
  { id: 2, name: "Bolatbek Mardan", role: "Guide", peak: "Komsomol Peak", altitude: 4376, status: "Ready" },
  { id: 3, name: "Nakypbek Nurasyl", role: "Medic", peak: "Furmanov Peak", altitude: 4146, status: "Resting" },
  { id: 4, name: "Kulmakhanbet Nurbakyt", role: "Porter", peak: "Left Talgar", altitude: 4040, status: "Summited" },
];

// Child with its OWN local state: oxygen, note, details open
function ClimberCard({ climber, onStatusChange, onRemove, onReset }) {
  const [oxygen, setOxygen] = useState(100);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  console.log(`render ClimberCard: ${climber.name} (oxygen ${oxygen})`);

  const low = oxygen <= 30;

  return (
    <li className={`card status-${climber.status.toLowerCase()}`}>
      <div className="card-head">
        <div>
          <h3>{climber.name}</h3>
          <p className="sub">{climber.role} · {climber.peak}, {climber.altitude} m</p>
        </div>
        <select
          aria-label={`Status of ${climber.name}`}
          value={climber.status}
          onChange={(e) => onStatusChange(climber.id, e.target.value)}
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="oxygen">
        <span>Oxygen</span>
        <div className="bar"><div className={low ? "fill low" : "fill"} style={{ width: `${oxygen}%` }} /></div>
        <b>{oxygen}%</b>
        <button onClick={() => setOxygen((o) => Math.max(0, o - 10))}>−10</button>
        <button onClick={() => setOxygen((o) => Math.min(100, o + 10))}>+10</button>
      </div>

      {low && <p className="warning">Low oxygen. Send {climber.name.split(" ")[0]} down.</p>}
      {climber.status === "Summited" && <p className="success">Reached {climber.peak}.</p>}

      <button className="link" onClick={() => setOpen(!open)}>
        {open ? "Hide note" : "Add note"}
      </button>
      {open && (
        <input
          className="note"
          placeholder="Write a note for this climber"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      )}
      {!open && note && <p className="saved-note">“{note}”</p>}

      <div className="card-foot">
        <button onClick={() => onReset(climber.id)}>Reset local state</button>
        <button className="danger" onClick={() => onRemove(climber.id)}>Remove</button>
      </div>
    </li>
  );
}

function AddForm({ onAdd }) {
  const [name, setName] = useState("");
  const [peak, setPeak] = useState("");
  const [role, setRole] = useState(ROLES[0]);

  console.log("render AddForm");

  function submit(e) {
    e.preventDefault();
    if (!name.trim() || !peak.trim()) return;
    onAdd({ name: name.trim(), peak: peak.trim(), role });
    setName("");
    setPeak("");
  }

  return (
    <form className="add" onSubmit={submit}>
      <input placeholder="Climber name" value={name} onChange={(e) => setName(e.target.value)} />
      <input placeholder="Target peak" value={peak} onChange={(e) => setPeak(e.target.value)} />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        {ROLES.map((r) => <option key={r}>{r}</option>)}
      </select>
      <button type="submit" className="primary">Add climber</button>
    </form>
  );
}

function Toolbar({ filter, setFilter, counts, onReverse, onSort }) {
  console.log("render Toolbar");
  return (
    <div className="toolbar">
      <div className="filters">
        {["All", ...STATUSES].map((s) => (
          <button key={s} className={filter === s ? "chip active" : "chip"} onClick={() => setFilter(s)}>
            {s} <span>{counts[s]}</span>
          </button>
        ))}
      </div>
      <div className="order">
        <button onClick={onReverse}>Reverse</button>
        <button onClick={onSort}>Sort A–Z</button>
      </div>
    </div>
  );
}

export default function App() {
  const [climbers, setClimbers] = useState(INITIAL);
  const [filter, setFilter] = useState("All");
  const [resets, setResets] = useState({}); // id -> reset counter (changes the key)
  const [nextId, setNextId] = useState(5);

  console.log("render App");

  const counts = { All: climbers.length };
  STATUSES.forEach((s) => (counts[s] = climbers.filter((c) => c.status === s).length));

  const visible = filter === "All" ? climbers : climbers.filter((c) => c.status === filter);

  function addClimber({ name, peak, role }) {
    setClimbers([...climbers, { id: nextId, name, peak, role, altitude: 3500, status: "Ready" }]);
    setNextId(nextId + 1);
  }
  const removeClimber = (id) => setClimbers(climbers.filter((c) => c.id !== id));
  const changeStatus = (id, status) =>
    setClimbers(climbers.map((c) => (c.id === id ? { ...c, status } : c)));
  const resetLocal = (id) => setResets({ ...resets, [id]: (resets[id] || 0) + 1 });
  const reverse = () => setClimbers([...climbers].reverse());
  const sortAZ = () => setClimbers([...climbers].sort((a, b) => a.name.localeCompare(b.name)));

  return (
    <div className="page">
      <header>
        <h1>Tian Shan Expedition</h1>
        <p>Track your climbing team before the ascent.</p>
      </header>

      <AddForm onAdd={addClimber} />
      <Toolbar filter={filter} setFilter={setFilter} counts={counts} onReverse={reverse} onSort={sortAZ} />

      {visible.length === 0 ? (
        <p className="empty">No climbers with this status. Change a status or add a climber.</p>
      ) : (
        <ul className="grid">
          {visible.map((c) => (
            // stable id keeps local state on filter/reorder; changing the reset counter remounts the card
            <ClimberCard
              key={`${c.id}-${resets[c.id] || 0}`}
              climber={c}
              onStatusChange={changeStatus}
              onRemove={removeClimber}
              onReset={resetLocal}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
