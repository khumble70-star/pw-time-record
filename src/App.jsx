import React, { useMemo, useState } from "react";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw5N7ESgvEsgG0SMrSRhNx-ujRpCl_-YdVcfXFj_Vk1SpbgfvgNHKPcM5HOVzqwFsVg/exec";

const jobCatalog = [
  { department: "Street", jobDescription: "Snow/Ice Removal" },
  { department: "Street", jobDescription: "Signs" },
  { department: "Water", jobDescription: "Hydrants O & M" },
];

const departments = [...new Set(jobCatalog.map(j => j.department))];

const blankEntry = () => ({
  id: crypto.randomUUID(),
  department: "",
  jobDescription: "",
  hours: "",
  equipmentUsed: ""
});

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

function getPayPeriodRange(dateStr) {
  if (!dateStr) return { label: "" };

  const anchor = new Date("2026-04-12");
  const target = new Date(dateStr);
  const diff = Math.floor((target - anchor) / (1000 * 60 * 60 * 24));
  const index = Math.floor(diff / 14);

  const start = new Date(anchor);
  start.setDate(anchor.getDate() + index * 14);

  const end = new Date(start);
  end.setDate(start.getDate() + 13);

  return {
    label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
  };
}

export default function App() {
  const [employeeName, setEmployeeName] = useState("");
  const [workDate, setWorkDate] = useState(todayLocal());
  const [entries, setEntries] = useState([blankEntry()]);
  const [submittedRecords, setSubmittedRecords] = useState([]);

  const payPeriod = useMemo(() => getPayPeriodRange(workDate), [workDate]);

  const addEntry = () => setEntries([...entries, blankEntry()]);

  const removeEntry = (id) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id, field, value) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const submitRecord = async () => {
    const record = {
      employeeName,
      workDate,
      payPeriod: payPeriod.label,
      entries
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(record)
      });

      alert("Submitted successfully");

      setSubmittedRecords([record, ...submittedRecords]);
      setEntries([blankEntry()]);
    } catch (err) {
      alert("Error submitting");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto", fontFamily: "Arial" }}>
      <h2>Daily Time Record</h2>

      <input
        placeholder="Employee Name"
        value={employeeName}
        onChange={(e) => setEmployeeName(e.target.value)}
        style={{ width: "100%", marginBottom: 10, padding: 10 }}
      />

      <input
        type="date"
        value={workDate}
        onChange={(e) => setWorkDate(e.target.value)}
        style={{ width: "100%", marginBottom: 10, padding: 10 }}
      />

      <div style={{ marginBottom: 15 }}>
        Pay Period: <strong>{payPeriod.label}</strong>
      </div>

      {entries.map(entry => (
        <div key={entry.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <select
            value={entry.department}
            onChange={(e) => updateEntry(entry.id, "department", e.target.value)}
            style={{ width: "100%", marginBottom: 5 }}
          >
            <option value="">Department</option>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>

          <input
            placeholder="Job Description"
            value={entry.jobDescription}
            onChange={(e) => updateEntry(entry.id, "jobDescription", e.target.value)}
            style={{ width: "100%", marginBottom: 5 }}
          />

          <input
            placeholder="Hours"
            value={entry.hours}
            onChange={(e) => updateEntry(entry.id, "hours", e.target.value)}
            style={{ width: "100%", marginBottom: 5 }}
          />

          <input
            placeholder="Equipment Used"
            value={entry.equipmentUsed}
            onChange={(e) => updateEntry(entry.id, "equipmentUsed", e.target.value)}
            style={{ width: "100%", marginBottom: 5 }}
          />

          <button onClick={() => removeEntry(entry.id)}>Remove</button>
        </div>
      ))}

      <button onClick={addEntry} style={{ marginRight: 10 }}>
        Add Job
      </button>

      <button onClick={submitRecord}>
        Submit
      </button>

      <hr style={{ margin: "20px 0" }} />

      <h3>History</h3>
      {submittedRecords.map((r, i) => (
        <div key={i}>
          {r.employeeName} - {r.workDate}
        </div>
      ))}
    </div>
  );
}
