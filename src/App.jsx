import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Clock3, CheckCircle2, CloudUpload, Plus, Trash2, Star, Printer, Search } from "lucide-react";
import { motion } from "framer-motion";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw5N7ESgvEsgG0SMrSRhNx-ujRpCl_-YdVcfXFj_Vk1SpbgfvgNHKPcM5HOVzqwFsVg/exec";

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
const blankEntry = () => ({ id: crypto.randomUUID(), department: "", jobDescription: "", equipmentUsed: "", hours: "", notes: "", status: "Completed" });
const todayLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

function getPayPeriodRange(dateStr) {
  if (!dateStr) return { start: "", end: "", label: "" };
  const date = new Date(`${dateStr}T00:00:00`);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const startDay = day <= 15 ? 1 : 16;
  const endDay = day <= 15 ? 15 : new Date(year, month + 1, 0).getDate();
  const start = new Date(year, month, startDay);
  const end = new Date(year, month, endDay);
  const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: toIso(start), end: toIso(end), label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}` };
}

function printHtml(title, bodyHtml) {
  const printWindow = window.open("", "_blank", "width=1000,height=800");
  if (!printWindow) return;
  printWindow.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1,h2{margin:0 0 12px}.meta{margin-bottom:20px}.meta div{margin:4px 0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ccc;padding:8px;text-align:left;vertical-align:top}th{background:#f3f4f6}</style></head><body>${bodyHtml}</body></html>`);
  printWindow.document.close(); printWindow.focus(); printWindow.print();
}

export default function App() {
  const [employeeName, setEmployeeName] = useState("");
  const [workDate, setWorkDate] = useState(todayLocal());
  const [regularHoursWorked, setRegularHoursWorked] = useState("");
  const [overtimeHoursWorked, setOvertimeHoursWorked] = useState("");
  const [callOutHours, setCallOutHours] = useState("");
  const [entries, setEntries] = useState([blankEntry()]);
  const [submittedRecords, setSubmittedRecords] = useState([]);
  const [lockedRecordKeys, setLockedRecordKeys] = useState([]);
  const [employeeFavorites, setEmployeeFavorites] = useState({});
  const [view, setView] = useState("new");
  const [searchText, setSearchText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sheetStatus, setSheetStatus] = useState("");
  const [reportEmployee, setReportEmployee] = useState("");
  const [reportDate, setReportDate] = useState(todayLocal());

  useEffect(() => {
    const savedDraft = localStorage.getItem("dtr-current-draft");
    const savedRecords = localStorage.getItem("dtr-submitted-records");
    const savedLockedKeys = localStorage.getItem("dtr-locked-record-keys");
    const savedFavorites = localStorage.getItem("dtr-employee-favorites");
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setEmployeeName(draft.employeeName || "");
      setWorkDate(draft.workDate || todayLocal());
      setRegularHoursWorked(draft.regularHoursWorked || "");
      setOvertimeHoursWorked(draft.overtimeHoursWorked || "");
      setCallOutHours(draft.callOutHours || "");
      setEntries(draft.entries?.length ? draft.entries : [blankEntry()]);
    }
    if (savedRecords) setSubmittedRecords(JSON.parse(savedRecords));
    if (savedLockedKeys) setLockedRecordKeys(JSON.parse(savedLockedKeys));
    if (savedFavorites) setEmployeeFavorites(JSON.parse(savedFavorites));
  }, []);

  useEffect(() => {
    localStorage.setItem("dtr-current-draft", JSON.stringify({ employeeName, workDate, regularHoursWorked, overtimeHoursWorked, callOutHours, entries }));
  }, [employeeName, workDate, regularHoursWorked, overtimeHoursWorked, callOutHours, entries]);
  useEffect(() => localStorage.setItem("dtr-submitted-records", JSON.stringify(submittedRecords)), [submittedRecords]);
  useEffect(() => localStorage.setItem("dtr-locked-record-keys", JSON.stringify(lockedRecordKeys)), [lockedRecordKeys]);
  useEffect(() => localStorage.setItem("dtr-employee-favorites", JSON.stringify(employeeFavorites)), [employeeFavorites]);

  const totalEntryHours = useMemo(() => entries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0).toFixed(2), [entries]);
  const totalHoursWorked = useMemo(() => ((parseFloat(regularHoursWorked) || 0) + (parseFloat(overtimeHoursWorked) || 0) + (parseFloat(callOutHours) || 0)).toFixed(2), [regularHoursWorked, overtimeHoursWorked, callOutHours]);
  const payPeriod = useMemo(() => getPayPeriodRange(workDate), [workDate]);
  const reportPayPeriod = useMemo(() => getPayPeriodRange(reportDate), [reportDate]);
  const currentRecordKey = useMemo(() => employeeName && workDate ? `${employeeName.trim().toLowerCase()}__${workDate}` : "", [employeeName, workDate]);
  const isCurrentRecordLocked = useMemo(() => currentRecordKey ? lockedRecordKeys.includes(currentRecordKey) : false, [currentRecordKey, lockedRecordKeys]);
  const completedJobs = useMemo(() => entries.filter((e) => e.status === "Completed").length, [entries]);

  const filteredRecords = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return submittedRecords;
    return submittedRecords.filter((record) => JSON.stringify(record).toLowerCase().includes(term));
  }, [searchText, submittedRecords]);

  const uniqueEmployees = useMemo(() => {
    const names = [...new Set([...submittedRecords.map((r) => r.employeeName).filter(Boolean), ...Object.keys(employeeFavorites).filter(Boolean), employeeName || ""].filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [submittedRecords, employeeFavorites, employeeName]);

  const favoriteKeyForEmployee = useMemo(() => (employeeName || "").trim().toLowerCase(), [employeeName]);
  const employeeFavoriteJobs = useMemo(() => favoriteKeyForEmployee ? employeeFavorites[favoriteKeyForEmployee] || [] : [], [employeeFavorites, favoriteKeyForEmployee]);

  const payPeriodRecords = useMemo(() => {
    if (!reportEmployee || !reportPayPeriod.start || !reportPayPeriod.end) return [];
    return submittedRecords.filter((record) => record.employeeName === reportEmployee && record.workDate >= reportPayPeriod.start && record.workDate <= reportPayPeriod.end);
  }, [submittedRecords, reportEmployee, reportPayPeriod]);

  const payPeriodTotals = useMemo(() => payPeriodRecords.reduce((acc, record) => {
    acc.reg += parseFloat(record.regularHoursWorked) || 0;
    acc.ot += parseFloat(record.overtimeHoursWorked) || 0;
    acc.callOut += parseFloat(record.callOutHours) || 0;
    acc.total += parseFloat(record.totalHoursWorked) || 0;
    return acc;
  }, { reg: 0, ot: 0, callOut: 0, total: 0 }), [payPeriodRecords]);

  const toggleFavorite = (department, jobDescription) => {
    if (!favoriteKeyForEmployee) return alert("Enter employee name first to save favorites.");
    const favoriteId = `${department}__${jobDescription}`;
    setEmployeeFavorites((current) => {
      const existing = current[favoriteKeyForEmployee] || [];
      const alreadyExists = existing.some((item) => `${item.department}__${item.jobDescription}` === favoriteId);
      const next = alreadyExists ? existing.filter((item) => `${item.department}__${item.jobDescription}` !== favoriteId) : [{ department, jobDescription }, ...existing].slice(0, 12);
      return { ...current, [favoriteKeyForEmployee]: next };
    });
  };

  const applyFavoriteToEntry = (entryId, favorite) => setEntries((current) => current.map((entry) => entry.id === entryId ? { ...entry, department: favorite.department, jobDescription: favorite.jobDescription } : entry));
  const updateEntry = (id, field, value) => setEntries((current) => current.map((entry) => entry.id !== id ? entry : field === "department" ? { ...entry, department: value, jobDescription: "" } : { ...entry, [field]: value }));
  const addEntry = () => setEntries((current) => [...current, blankEntry()]);
  const removeEntry = (id) => setEntries((current) => current.length > 1 ? current.filter((e) => e.id !== id) : current);

  const clearForm = () => {
    setEmployeeName(""); setWorkDate(todayLocal()); setRegularHoursWorked(""); setOvertimeHoursWorked(""); setCallOutHours(""); setEntries([blankEntry()]); setSheetStatus(""); localStorage.removeItem("dtr-current-draft");
  };

  const saveDraft = () => {
    localStorage.setItem("dtr-current-draft", JSON.stringify({ employeeName, workDate, regularHoursWorked, overtimeHoursWorked, callOutHours, entries }));
    alert("Draft saved.");
  };

  const buildRecord = () => {
    if (isCurrentRecordLocked) return alert("This employee's record for the selected date has already been submitted and locked."), null;
    const cleanedEntries = entries.filter((e) => e.jobDescription || e.equipmentUsed || e.hours || e.notes);
    if (!employeeName || !workDate || cleanedEntries.length === 0) return alert("Please add employee name, date, and at least one job entry before submitting."), null;
    return { id: crypto.randomUUID(), recordKey: currentRecordKey, employeeName, workDate, payPeriodStart: payPeriod.start, payPeriodEnd: payPeriod.end, payPeriodLabel: payPeriod.label, regularHoursWorked, overtimeHoursWorked, callOutHours, totalHoursWorked, totalEntryHours, submittedAt: new Date().toLocaleString(), entries: cleanedEntries };
  };

  const submitToGoogleSheets = async (record) => {
    if (!GOOGLE_SCRIPT_URL.includes("script.google.com")) throw new Error("Google Apps Script URL has not been configured.");
    const response = await fetch(GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(record) });
    if (!response.ok) throw new Error(`Sheet submission failed with status ${response.status}.`);
    return response.text();
  };

  const submitRecord = async () => {
    const record = buildRecord();
    if (!record) return;
    setIsSubmitting(true); setSheetStatus("");
    try {
      await submitToGoogleSheets(record);
      setSubmittedRecords((current) => [record, ...current.filter((item) => item.recordKey !== record.recordKey)]);
      setLockedRecordKeys((current) => Array.from(new Set([...current, record.recordKey])));
      setSheetStatus("Submitted to Google Sheets successfully. Record is now locked.");
      clearForm();
      alert("Daily time record submitted to Google Sheets and locked.");
    } catch (error) {
      setSubmittedRecords((current) => [record, ...current.filter((item) => item.recordKey !== record.recordKey)]);
      setSheetStatus(error instanceof Error ? error.message : "Unable to submit to Google Sheets.");
      alert("Saved locally, but Google Sheets submission was not successful. Check the integration URL.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    const rows = [["Name","Date","Pay Period Start","Pay Period End","Regular Hours Worked","Overtime Hours Worked","Call Out Hours","Total Hours","Department","Job Description","Hours","Equipment Used","Status","Notes","Submitted At"]];
    submittedRecords.forEach((record) => record.entries.forEach((entry) => rows.push([record.employeeName, record.workDate, record.payPeriodStart, record.payPeriodEnd, record.regularHoursWorked, record.overtimeHoursWorked, record.callOutHours, record.totalHoursWorked, entry.department, entry.jobDescription, entry.hours, entry.equipmentUsed, entry.status, entry.notes, record.submittedAt])));
    const csv = rows.map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `daily-time-records-${todayLocal()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const printPayPeriodReport = () => {
    if (!reportEmployee) return alert("Select an employee for the pay period report.");
    const rowsHtml = payPeriodRecords.map((record) => record.entries.map((entry) => `<tr><td>${record.workDate}</td><td>${entry.department || ""}</td><td>${entry.jobDescription || ""}</td><td>${entry.hours || "0.00"}</td><td>${entry.equipmentUsed || ""}</td><td>${entry.notes || ""}</td></tr>`).join("")).join("");
    const bodyHtml = `<h1>Employee Pay Period Report</h1><div class="meta"><div><strong>Employee:</strong> ${reportEmployee}</div><div><strong>Pay Period:</strong> ${reportPayPeriod.label}</div><div><strong>Days Submitted:</strong> ${payPeriodRecords.length}</div></div><table><thead><tr><th>Date</th><th>Department</th><th>Job Description</th><th>Hours</th><th>Equipment Used</th><th>Notes</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="6">No records found for this pay period.</td></tr>'}</tbody></table><h2 style="margin-top:20px;">Pay Period Totals</h2><div><strong>Regular Hours:</strong> ${payPeriodTotals.reg.toFixed(2)}</div><div><strong>Overtime Hours:</strong> ${payPeriodTotals.ot.toFixed(2)}</div><div><strong>Call Out Hours:</strong> ${payPeriodTotals.callOut.toFixed(2)}</div><div><strong>Total Hours:</strong> ${payPeriodTotals.total.toFixed(2)}</div>`;
    printHtml(`Pay Period Report - ${reportEmployee}`, bodyHtml);
  };

  const StatCard = ({ icon: Icon, label, value }) => <div className="stat-card"><div className="stat-icon"><Icon size={20} /></div><div><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div></div>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div><div className="eyebrow">Town of Highland</div><h1>Public Works Daily Time Record</h1></div>
        <div className="payperiod-chip">{payPeriod.label || "Current pay period"}</div>
      </header>
      <main className="content">
        <section className="stats-grid">
          <StatCard icon={ClipboardList} label="Jobs Logged" value={entries.length} />
          <StatCard icon={Clock3} label="Job Hours" value={totalEntryHours} />
          <StatCard icon={CheckCircle2} label="Completed" value={completedJobs} />
          <StatCard icon={CloudUpload} label="Total Hours" value={totalHoursWorked} />
        </section>

        <section className="tabs">
          <div className="tab-strip">
            <button className={`tab-btn ${view === "new" ? "active" : ""}`} onClick={() => setView("new")}>New</button>
            <button className={`tab-btn ${view === "history" ? "active" : ""}`} onClick={() => setView("history")}>History</button>
            <button className={`tab-btn ${view === "reports" ? "active" : ""}`} onClick={() => setView("reports")}>Reports</button>
          </div>

          {view === "new" && <div className="panel">
            <div className="panel-header"><h2>Daily Entry</h2><p>Mobile-friendly layout for field crews.</p></div>
            <div className="form-grid">
              <input className="input" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Employee name" disabled={isCurrentRecordLocked} />
              <input className="input" type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
              <div className="two-col">
                <input className="input" value={regularHoursWorked} onChange={(e) => setRegularHoursWorked(e.target.value)} placeholder="Reg hours" disabled={isCurrentRecordLocked} />
                <input className="input" value={overtimeHoursWorked} onChange={(e) => setOvertimeHoursWorked(e.target.value)} placeholder="OT hours" disabled={isCurrentRecordLocked} />
              </div>
              <div className="two-col">
                <input className="input" value={callOutHours} onChange={(e) => setCallOutHours(e.target.value)} placeholder="Call out" disabled={isCurrentRecordLocked} />
                <input className="input input-muted" value={totalHoursWorked} readOnly />
              </div>
              <input className="input input-muted" value={payPeriod.label} readOnly />
            </div>

            {isCurrentRecordLocked && <div className="alert warning">This daily record is locked because it has already been submitted for this employee and date.</div>}
            {sheetStatus && <div className="alert">{sheetStatus}</div>}

            <div className="entry-list">
              {entries.map((entry, index) => {
                const isFavorite = employeeFavoriteJobs.some((fav) => fav.department === entry.department && fav.jobDescription === entry.jobDescription);
                const departmentJobs = jobCatalog.filter((j) => j.department === entry.department);
                return <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="entry-card">
                  <div className="entry-head">
                    <span className="pill">Job {index + 1}</span>
                    <button className="icon-btn" onClick={() => removeEntry(entry.id)} disabled={isCurrentRecordLocked}><Trash2 size={18} /></button>
                  </div>
                  <div className="favorites-box">
                    <div className="favorites-title">Favorites</div>
                    <div className="favorites-wrap">
                      {employeeFavoriteJobs.length ? employeeFavoriteJobs.map((fav) => <button key={`${entry.id}-${fav.department}-${fav.jobDescription}`} className="mini-btn" onClick={() => applyFavoriteToEntry(entry.id, fav)} disabled={isCurrentRecordLocked}>{fav.department}: {fav.jobDescription}</button>) : <span className="muted-text">No favorites saved yet.</span>}
                    </div>
                  </div>
                  <select className="input" value={entry.department} onChange={(e) => updateEntry(entry.id, "department", e.target.value)} disabled={isCurrentRecordLocked}>
                    <option value="">Select department</option>
                    {departments.map((dept) => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                  <select className="input" value={entry.jobDescription} onChange={(e) => updateEntry(entry.id, "jobDescription", e.target.value)} disabled={!entry.department || isCurrentRecordLocked}>
                    <option value="">Select job description</option>
                    {departmentJobs.map((item) => <option key={`${item.department}-${item.jobDescription}`} value={item.jobDescription}>{item.jobDescription}</option>)}
                  </select>
                  <div className="two-col">
                    <input className="input" value={entry.hours} onChange={(e) => updateEntry(entry.id, "hours", e.target.value)} placeholder="Hours" disabled={isCurrentRecordLocked} />
                    <select className="input" value={entry.status} onChange={(e) => updateEntry(entry.id, "status", e.target.value)} disabled={isCurrentRecordLocked}>
                      <option value="Completed">Completed</option><option value="In Progress">In Progress</option><option value="Follow-Up Needed">Follow-Up Needed</option>
                    </select>
                  </div>
                  <input className="input" value={entry.equipmentUsed} onChange={(e) => updateEntry(entry.id, "equipmentUsed", e.target.value)} placeholder="Equipment used" disabled={isCurrentRecordLocked} />
                  <textarea className="textarea" value={entry.notes} onChange={(e) => updateEntry(entry.id, "notes", e.target.value)} placeholder="Notes" disabled={isCurrentRecordLocked} />
                  <button className={`action-btn secondary ${isFavorite ? "selected" : ""}`} onClick={() => toggleFavorite(entry.department, entry.jobDescription)} disabled={isCurrentRecordLocked || !entry.department || !entry.jobDescription}><Star size={18} />{isFavorite ? "Remove Favorite" : "Save Favorite"}</button>
                </motion.div>;
              })}
            </div>
          </div>}

          {view === "history" && <div className="panel">
            <div className="panel-header"><h2>Submitted Records</h2><p>Search daily entries and export CSV.</p></div>
            <div className="history-tools">
              <div className="search-wrap"><Search size={16} /><input className="search-input" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search records" /></div>
              <button className="action-btn secondary" onClick={exportCSV}>Export</button>
            </div>
            <div className="record-list">
              {filteredRecords.length ? filteredRecords.filter((record) => record && record.employeeName).map((record) => <div key={record.id} className="record-card"><div className="record-head"><div><div className="record-name">{record.employeeName}</div><div className="record-sub">{record.workDate} · {record.payPeriodLabel}</div></div><span className="pill">{record.totalHoursWorked} hrs</span></div><div className="record-grid"><div>Reg: {record.regularHoursWorked || "0.00"}</div><div>OT: {record.overtimeHoursWorked || "0.00"}</div><div>Call Out: {record.callOutHours || "0.00"}</div><div>Jobs: {record.entries.length}</div></div></div>) : <div className="empty-card">No submitted records found.</div>}
            </div>
          </div>}

          {view === "reports" && <div className="panel">
            <div className="panel-header"><h2>Pay Period Reports</h2><p>Print by employee and pay period.</p></div>
            <select className="input" value={reportEmployee} onChange={(e) => setReportEmployee(e.target.value)}>
              <option value="">Select employee</option>
              {uniqueEmployees.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            <input className="input" type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
            <input className="input input-muted" value={reportPayPeriod.label} readOnly />
            <div className="totals-grid">
              <StatCard icon={Clock3} label="Regular" value={payPeriodTotals.reg.toFixed(2)} />
              <StatCard icon={Clock3} label="Overtime" value={payPeriodTotals.ot.toFixed(2)} />
              <StatCard icon={Clock3} label="Call Out" value={payPeriodTotals.callOut.toFixed(2)} />
              <StatCard icon={Clock3} label="Total" value={payPeriodTotals.total.toFixed(2)} />
            </div>
            <button className="action-btn" onClick={printPayPeriodReport}><Printer size={18} />Print Pay Period Report</button>
            <div className="report-preview">
              {payPeriodRecords.length ? payPeriodRecords.flatMap((record) => record.entries.map((entry, idx) => <div key={`${record.id}-${idx}`} className="record-card"><div className="record-name">{record.workDate} · {entry.jobDescription || "—"}</div><div className="record-sub">{entry.department || "—"}</div><div className="record-grid"><div>Hours: {entry.hours || "0.00"}</div><div>Equipment: {entry.equipmentUsed || "—"}</div></div></div>)) : <div className="empty-card">No records found for this employee and pay period.</div>}
            </div>
          </div>}
        </section>
      </main>
      <footer className="bottom-bar">
        <button className="action-btn secondary" onClick={addEntry} disabled={isCurrentRecordLocked}><Plus size={18} />Add Job</button>
        <button className="action-btn secondary" onClick={saveDraft} disabled={isCurrentRecordLocked}>Save</button>
        <button className="action-btn" onClick={submitRecord} disabled={isSubmitting || isCurrentRecordLocked}><CloudUpload size={18} />{isSubmitting ? "Submitting..." : "Submit"}</button>
      </footer>
    </div>
  );
}
