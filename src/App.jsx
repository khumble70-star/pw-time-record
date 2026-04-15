import React, { useMemo, useState, useEffect } from "react";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw5N7ESgvEsgG0SMrSRhNx-ujRpCl_-YdVcfXFj_Vk1SpbgfvgNHKPcM5HOVzqwFsVg/exec";

const jobCatalog = [
  { department: "Mechanic Breakdown", jobDescription: "BI" },
  { department: "Mechanic Breakdown", jobDescription: "FD" },
  { department: "Mechanic Breakdown", jobDescription: "PD" },
  { department: "Mechanic Breakdown", jobDescription: "PR" },
  { department: "Mechanic Breakdown", jobDescription: "SD" },
  { department: "Mechanic Breakdown", jobDescription: "VIPS" },

  { department: "Sanitation", jobDescription: "Chipper" },
  { department: "Sanitation", jobDescription: "Leaf Vac" },
  { department: "Sanitation", jobDescription: "Loader Stops" },
  { department: "Sanitation", jobDescription: "Mosquito Spraying" },
  { department: "Sanitation", jobDescription: "Other Refuse Collection" },
  { department: "Sanitation", jobDescription: "SD Repair and Maint of Equipment" },
  { department: "Sanitation", jobDescription: "Yard Waste Collection" },
  { department: "Sanitation", jobDescription: "Yard/Dump Maintenance" },

  { department: "Sewer", jobDescription: "CC Video Inspection (Sanitary)" },
  { department: "Sewer", jobDescription: "CC Video Inspection (Storm)" },
  { department: "Sewer", jobDescription: "Janitorial Service" },
  { department: "Sewer", jobDescription: "Pump Station O & M (Sanitary)" },
  { department: "Sewer", jobDescription: "Pump Station O & M (Storm)" },
  { department: "Sewer", jobDescription: "Sanitary Sewer Maintenance" },
  { department: "Sewer", jobDescription: "Storm Sewer Maintenance" },
  { department: "Sewer", jobDescription: "Street Sweeping" },
  { department: "Sewer", jobDescription: "SW Repair and Maint of Equipment" },

  { department: "Street", jobDescription: "Alley Grading" },
  { department: "Street", jobDescription: "Banners" },
  { department: "Street", jobDescription: "Cold Patching" },
  { department: "Street", jobDescription: "Concrete Replacement Program" },
  { department: "Street", jobDescription: "Crack Sealing" },
  { department: "Street", jobDescription: "Events/Parades/Holiday Decorating" },
  { department: "Street", jobDescription: "Fire Call" },
  { department: "Street", jobDescription: "Flag Maintenance" },
  { department: "Street", jobDescription: "Graffiti Removal" },
  { department: "Street", jobDescription: "Hot Patching" },
  { department: "Street", jobDescription: "Milling/Paving" },
  { department: "Street", jobDescription: "Mowing/Weed Wacking/Trimming" },
  { department: "Street", jobDescription: "Other" },
  { department: "Street", jobDescription: "Restorations (ST)" },
  { department: "Street", jobDescription: "Signs" },
  { department: "Street", jobDescription: "Snow/Ice Removal" },
  { department: "Street", jobDescription: "ST Repair and Maint of Equipment" },
  { department: "Street", jobDescription: "Street Light Maint." },
  { department: "Street", jobDescription: "Street Markings" },
  { department: "Street", jobDescription: "Tree Removal" },

  { department: "Water", jobDescription: "B Box O & M" },
  { department: "Water", jobDescription: "Customer Service" },
  { department: "Water", jobDescription: "Hydrants O & M" },
  { department: "Water", jobDescription: "Locates" },
  { department: "Water", jobDescription: "Main/Water Breaks" },
  { department: "Water", jobDescription: "Meter Reads and Meter Repairs" },
  { department: "Water", jobDescription: "Restorations (WT)" },
  { department: "Water", jobDescription: "Turn offs/turn ons" },
  { department: "Water", jobDescription: "Valves O & M" },
  { department: "Water", jobDescription: "WT Other Maintenance" }
];

const departments = [...new Set(jobCatalog.map((j) => j.department))].sort();

const blankEntry = () => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  department: "",
  jobDescription: "",
  hours: "",
  equipmentUsed: "",
  notes: ""
});

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

function getPayPeriodRange(dateStr) {
  if (!dateStr) return { label: "" };

  const anchor = new Date("2026-04-12T00:00:00");
  const target = new Date(`${dateStr}T00:00:00`);
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

  const [employeeLocked, setEmployeeLocked] = useState(() => {
    return !!localStorage.getItem("lastEmployeeName");
  });

  const [workDate, setWorkDate] = useState(todayLocal());
  const [regularHoursWorked, setRegularHoursWorked] = useState("");
  const [overtimeHoursWorked, setOvertimeHoursWorked] = useState("");
  const [callOutHours, setCallOutHours] = useState("");
  const [dailyNotes, setDailyNotes] = useState("");
  const [entries, setEntries] = useState([blankEntry()]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employeeName && employeeLocked) {
      localStorage.setItem("lastEmployeeName", employeeName);
    }
  }, [employeeName, employeeLocked]);

  const payPeriod = useMemo(() => getPayPeriodRange(workDate), [workDate]);

  const totalHoursWorked = useMemo(() => {
    return (
      (parseFloat(regularHoursWorked) || 0) +
      (parseFloat(overtimeHoursWorked) || 0) +
      (parseFloat(callOutHours) || 0)
    ).toFixed(2);
  }, [regularHoursWorked, overtimeHoursWorked, callOutHours]);

  const totalEntryHours = useMemo(() => {
    return entries
      .reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0)
      .toFixed(2);
  }, [entries]);

  const addEntry = () => {
    setEntries((prev) => [...prev, blankEntry()]);
  };

  const removeEntry = (id) => {
    setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));
  };

  const updateEntry = (id, field, value) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        if (field === "department") {
          return { ...e, department: value, jobDescription: "" };
        }
        return { ...e, [field]: value };
      })
    );
  };

  const lockEmployee = () => {
    if (!employeeName.trim()) {
      setStatusMessage("Enter employee name first.");
      return;
    }
    localStorage.setItem("lastEmployeeName", employeeName.trim());
    setEmployeeName(employeeName.trim());
    setEmployeeLocked(true);
    setStatusMessage("Employee saved on this device.");
  };

  const changeEmployee = () => {
    localStorage.removeItem("lastEmployeeName");
    setEmployeeName("");
    setEmployeeLocked(false);
    setStatusMessage("Employee unlocked. Enter a new name.");
  };

  const submitRecord = async () => {
    setStatusMessage("");

    if (!employeeName.trim()) {
      setStatusMessage("Enter employee name.");
      return;
    }

    if (!workDate) {
      setStatusMessage("Select a work date.");
      return;
    }

    const hasIncompleteEntry = entries.some(
      (e) => !e.department || !e.jobDescription || !e.hours
    );

    if (hasIncompleteEntry) {
      setStatusMessage("Each job entry needs department, job description, and hours.");
      return;
    }

    const enteredTotal = parseFloat(totalHoursWorked) || 0;
    const jobTotal = parseFloat(totalEntryHours) || 0;

    if (Math.abs(enteredTotal - jobTotal) > 0.01) {
      setStatusMessage(
        `Job entry hours (${jobTotal.toFixed(
          2
        )}) must equal total hours worked (${enteredTotal.toFixed(2)}).`
      );
      return;
    }

    const record = {
      employeeName: employeeName.trim(),
      workDate,
      payPeriod: payPeriod.label,
      regularHoursWorked,
      overtimeHoursWorked,
      callOutHours,
      totalHoursWorked,
      totalEntryHours,
      dailyNotes,
      entries
    };

    try {
      setIsSubmitting(true);

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(record)
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatusMessage("Submitted successfully.");
      setRegularHoursWorked("");
      setOvertimeHoursWorked("");
      setCallOutHours("");
      setDailyNotes("");
      setEntries([blankEntry()]);
    } catch (error) {
      setStatusMessage("Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerCard}>
          <h1 style={styles.title}>Daily Time Record</h1>
          <p style={styles.subtitle}>Enter daily hours and job activity.</p>
        </div>

        <div style={styles.card}>
          <div style={styles.fieldBlock}>
            <label style={styles.label}>Employee Name</label>
            <input
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Employee Name"
              style={styles.input}
              disabled={employeeLocked}
            />
          </div>

          <div style={styles.buttonRowWrap}>
            {!employeeLocked ? (
              <button onClick={lockEmployee} style={styles.secondaryButton} type="button">
                Save Employee
              </button>
            ) : (
              <button onClick={changeEmployee} style={styles.secondaryButton} type="button">
                Change Employee
              </button>
            )}
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Work Date</label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.infoBox}>
            Pay Period: <strong>{payPeriod.label}</strong>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Hours Summary</h2>

          <div style={styles.grid}>
            <div style={styles.fieldBlock}>
              <label style={styles.label}>Regular Hours</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={regularHoursWorked}
                onChange={(e) => setRegularHoursWorked(e.target.value)}
                placeholder="0.00"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Overtime Hours</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={overtimeHoursWorked}
                onChange={(e) => setOvertimeHoursWorked(e.target.value)}
                placeholder="0.00"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Call Out Hours</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={callOutHours}
                onChange={(e) => setCallOutHours(e.target.value)}
                placeholder="0.00"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldBlock}>
              <label style={styles.label}>Total Hours</label>
              <input
                value={totalHoursWorked}
                readOnly
                placeholder="0.00"
                style={styles.readOnlyInput}
              />
            </div>
          </div>

          <div style={styles.infoBox}>
            Job Entry Total: <strong>{totalEntryHours}</strong>
          </div>

          <div style={{ ...styles.infoBox, marginTop: "10px" }}>
            Total job entry hours must match total hours worked for the day.
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Daily Notes</h2>
          <div style={styles.fieldBlock}>
            <label style={styles.label}>Notes for the Day</label>
            <textarea
              value={dailyNotes}
              onChange={(e) => setDailyNotes(e.target.value)}
              placeholder="Enter any overall notes for the day"
              style={styles.textarea}
              rows={4}
            />
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Job Entries</h2>
            <button onClick={addEntry} style={styles.secondaryButton} type="button">
              Add Job
            </button>
          </div>

          {entries.map((entry, index) => {
            const departmentJobs = jobCatalog
              .filter((j) => j.department === entry.department)
              .map((j) => j.jobDescription);

            return (
              <div key={entry.id} style={styles.entryCard}>
                <div style={styles.entryHeader}>
                  <h3 style={styles.entryTitle}>Job #{index + 1}</h3>
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(entry.id)}
                      style={styles.removeButton}
                      type="button"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div style={styles.fieldBlock}>
                  <label style={styles.label}>Department</label>
                  <select
                    value={entry.department}
                    onChange={(e) => updateEntry(entry.id, "department", e.target.value)}
                    style={styles.input}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.fieldBlock}>
                  <label style={styles.label}>Job Description</label>
                  <select
                    value={entry.jobDescription}
                    onChange={(e) => updateEntry(entry.id, "jobDescription", e.target.value)}
                    style={styles.input}
                    disabled={!entry.department}
                  >
                    <option value="">Select Job Description</option>
                    {departmentJobs.map((job) => (
                      <option key={job} value={job}>
                        {job}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.fieldBlock}>
                  <label style={styles.label}>Hours</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={entry.hours}
                    onChange={(e) => updateEntry(entry.id, "hours", e.target.value)}
                    placeholder="0.00"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldBlock}>
                  <label style={styles.label}>Equipment Used</label>
                  <input
                    value={entry.equipmentUsed}
                    onChange={(e) => updateEntry(entry.id, "equipmentUsed", e.target.value)}
                    placeholder="Equipment used"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldBlock}>
                  <label style={styles.label}>Job Notes</label>
                  <textarea
                    value={entry.notes}
                    onChange={(e) => updateEntry(entry.id, "notes", e.target.value)}
                    placeholder="Notes for this specific job"
                    style={styles.textarea}
                    rows={4}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.footerCard}>
          <button
            onClick={submitRecord}
            style={isSubmitting ? styles.disabledButton : styles.primaryButton}
            type="button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Daily Record"}
          </button>

          {!!statusMessage && <div style={styles.status}>{statusMessage}</div>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "12px"
  },
  container: {
    width: "100%",
    maxWidth: "720px",
    margin: "0 auto"
  },
  headerCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
  },
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
  },
  footerCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
  },
  title: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.2
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#5f6b7a",
    fontSize: "14px"
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
    flexWrap: "wrap"
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px"
  },
  entryCard: {
    border: "1px solid #dbe3ee",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "12px",
    background: "#fafcff"
  },
  entryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
    flexWrap: "wrap"
  },
  entryTitle: {
    margin: 0,
    fontSize: "16px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px"
  },
  fieldBlock: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "12px"
  },
  label: {
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#334155"
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "16px",
    background: "#fff"
  },
  readOnlyInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "16px",
    background: "#eef2f7",
    color: "#334155"
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "16px",
    resize: "vertical",
    fontFamily: "inherit",
    background: "#fff"
  },
  infoBox: {
    marginTop: "6px",
    padding: "12px",
    borderRadius: "10px",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontSize: "14px"
  },
  buttonRowWrap: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "12px"
  },
  primaryButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer"
  },
  disabledButton: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#94a3b8",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "not-allowed"
  },
  secondaryButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer"
  },
  removeButton: {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer"
  },
  status: {
    marginTop: "12px",
    fontSize: "14px",
    fontWeight: 600
  }
};
