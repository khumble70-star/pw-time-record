import React, { useMemo, useState, useEffect } from "react";

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
  equipmentUsed: "",
  notes: ""
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
  const [employeeName, setEmployeeName] = useState(() => {
    return localStorage.getItem("lastEmployeeName") || "";
  });

  const [workDate, setWorkDate] = useState(todayLocal());
  const [regularHoursWorked, setRegularHoursWorked] = useState("");
  const [overtimeHoursWorked, setOvertimeHoursWorked] = useState("");
  const [callOutHours, setCallOutHours] = useState("");
  const [entries, setEntries] = useState([blankEntry()]);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (employeeName) {
      localStorage.setItem("lastEmployeeName", employeeName);
    }
  }, [employeeName]);

  const payPeriod = useMemo(() => getPayPeriodRange(workDate), [workDate]);

  const totalHoursWorked = useMemo(() => {
    return (
      (parseFloat(regularHoursWorked) || 0) +
      (parseFloat(overtimeHoursWorked) || 0) +
      (parseFloat(callOutHours) || 0)
    ).toFixed(2);
  }, [regularHoursWorked, overtimeHoursWorked, callOutHours]);

  const addEntry = () => setEntries([...entries, blankEntry()]);

  const removeEntry = (id) => {
    setEntries(entries.length > 1 ? entries.filter(e => e.id !== id) : entries);
  };

  const updateEntry = (id, field, value) => {
    setEntries(entries.map(e => {
      if (e.id !== id) return e;
      if (field === "department") return { ...e, department: value, jobDescription: "" };
      return { ...e, [field]: value };
    }));
  };

  const submitRecord = async () => {
    if (!employeeName) {
      setStatusMessage("Enter employee name");
      return;
    }

    const record = {
      employeeName,
      workDate,
      payPeriod: payPeriod.label,
      regularHoursWorked,
      overtimeHoursWorked,
      callOutHours,
      totalHoursWorked,
      entries
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(record)
      });

      setStatusMessage("Submitted successfully");
      setEntries([blankEntry()]);
    } catch {
      setStatusMessage("Submission failed");
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h2>Daily Time Record</h2>

      <input
        value={employeeName}
        onChange={(e) => setEmployeeName(e.target.value)}
        placeholder="Employee Name"
        style={{ width: "100%", padding: 10 }}
        disabled={!!localStorage.getItem("lastEmployeeName")}
      />

      <button
        onClick={() => {
          localStorage.removeItem("lastEmployeeName");
          setEmployeeName("");
        }}
        style={{ marginBottom: 10 }}
      >
        Change Employee
      </button>

      <input
        type="date"
        value={workDate}
        onChange={(e) => setWorkDate(e.target.value)}
        style={{ width: "100%", padding: 10 }}
      />

      <div style={{ margin: "10px 0" }}>
        Pay Period: <strong>{payPeriod.label}</strong>
      </div>

      <input
        value={regularHoursWorked}
        onChange={(e) => setRegularHoursWorked(e.target.value)}
        placeholder="Regular Hours"
        style={{ width: "100%", padding: 10 }}
      />

      <input
        value={overtimeHoursWorked}
        onChange={(e) => setOvertimeHoursWorked(e.target.value)}
        placeholder="Overtime Hours"
        style={{ width: "100%", padding: 10 }}
      />

      <input
        value={callOutHours}
        onChange={(e) => setCallOutHours(e.target.value)}
        placeholder="Call Out Hours"
        style={{ width: "100%", padding: 10 }}
      />

      <input
        value={totalHoursWorked}
        readOnly
        placeholder="Total Hours"
        style={{ width: "100%", padding: 10, background: "#eee" }}
      />

      <h3>Job Entries</h3>

      {entries.map(entry => {
        const departmentJobs = jobCatalog.filter(j => j.department === entry.department);

        return (
          <div key={entry.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
            <select onChange={(e) => updateEntry(entry.id, "department", e.target.value)}>
              <option value="">Department</option>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>

            <select onChange={(e) => updateEntry(entry.id, "jobDescription", e.target.value)}>
              <option value="">Job Description</option>
              {departmentJobs.map(j => <option key={j.jobDescription}>{j.jobDescription}</option>)}
            </select>

            <input placeholder="Hours" onChange={(e) => updateEntry(entry.id, "hours", e.target.value)} />
            <input placeholder="Equipment" onChange={(e) => updateEntry(entry.id, "equipmentUsed", e.target.value)} />
            <textarea placeholder="Notes" onChange={(e) => updateEntry(entry.id, "notes", e.target.value)} />

            <button onClick={() => removeEntry(entry.id)}>Remove</button>
          </div>
        );
      })}

      <button onClick={addEntry}>Add Job</button>
      <button onClick={submitRecord}>Submit</button>

      <div>{statusMessage}</div>
    </div>
  );
}
