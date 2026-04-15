import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardList, Clock3, CheckCircle2, CloudUpload, Plus, Trash2, Star, Printer, Search, Menu } from "lucide-react";
import { motion } from "framer-motion";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw5N7ESgvEsgG0SMrSRhNx-ujRpCl_-YdVcfXFj_Vk1SpbgfvgNHKPcM5HOVzqwFsVg/exec";
const SHEET_PLACEHOLDER_NAME = "Town of Highland Public Works Daily Time Record";

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
  { department: "Water", jobDescription: "WT Other Maintenance" },
];

const departments = [...new Set(jobCatalog.map((j) => j.department))].sort();

const blankEntry = () => ({
  id: crypto.randomUUID(),
  department: "",
  jobDescription: "",
  equipmentUsed: "",
  hours: "",
  notes: "",
  status: "Completed",
});

const todayLocal = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString();
}

function getPayPeriodRange(dateStr) {
  if (!dateStr) return { start: "", end: "", label: "" };

  // Payroll calendar anchor: pay period starts on 2026-04-12 and runs for 14 days.
  // Example anchored period: 2026-04-12 through 2026-04-25.
  const anchorStart = new Date("2026-04-12T00:00:00");
  const targetDate = new Date(`${dateStr}T00:00:00`);
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((targetDate.getTime() - anchorStart.getTime()) / msPerDay);
  const periodIndex = Math.floor(diffDays / 14);

  const start = new Date(anchorStart);
  start.setDate(anchorStart.getDate() + periodIndex * 14);

  const end = new Date(start);
  end.setDate(start.getDate() + 13);

  const toIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const toLabel = (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

  return {
    start: toIso(start),
    end: toIso(end),
    label: `${toLabel(start)} - ${toLabel(end)}`,
  };
}

function downloadFile(filename, content, type = "text/plain;charset=utf-8;") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printHtml(title, bodyHtml) {
  const printWindow = window.open("", "_blank", "width=1000,height=800");
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1, h2 { margin: 0 0 12px; }
          .meta { margin-bottom: 20px; }
          .meta div { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>${bodyHtml}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export default function DailyTimeRecordApp() {
  const [employeeName, setEmployeeName] = useState("");
  const [workDate, setWorkDate] = useState(todayLocal());
  const [regularHoursWorked, setRegularHoursWorked] = useState("");
  const [overtimeHoursWorked, setOvertimeHoursWorked] = useState("");
  const [callOutHours, setCallOutHours] = useState("");
  const [entries, setEntries] = useState([blankEntry()]);
  const [submittedRecords, setSubmittedRecords] = useState([]);
  const [lockedRecordKeys, setLockedRecordKeys] = useState([]);
  const [employeeFavorites, setEmployeeFavorites] = useState({});
  const [search, setSearch] = useState("");
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

  useEffect(() => { localStorage.setItem("dtr-submitted-records", JSON.stringify(submittedRecords)); }, [submittedRecords]);
  useEffect(() => { localStorage.setItem("dtr-locked-record-keys", JSON.stringify(lockedRecordKeys)); }, [lockedRecordKeys]);
  useEffect(() => { localStorage.setItem("dtr-employee-favorites", JSON.stringify(employeeFavorites)); }, [employeeFavorites]);

  const totalEntryHours = useMemo(() => entries.reduce((sum, entry) => sum + (parseFloat(entry.hours) || 0), 0).toFixed(2), [entries]);
  const totalHoursWorked = useMemo(() => ((parseFloat(regularHoursWorked) || 0) + (parseFloat(overtimeHoursWorked) || 0) + (parseFloat(callOutHours) || 0)).toFixed(2), [regularHoursWorked, overtimeHoursWorked, callOutHours]);
  const payPeriod = useMemo(() => getPayPeriodRange(workDate), [workDate]);
  const reportPayPeriod = useMemo(() => getPayPeriodRange(reportDate), [reportDate]);
  const currentRecordKey = useMemo(() => employeeName && workDate ? `${employeeName.trim().toLowerCase()}__${workDate}` : "", [employeeName, workDate]);
  const isCurrentRecordLocked = useMemo(() => currentRecordKey ? lockedRecordKeys.includes(currentRecordKey) : false, [currentRecordKey, lockedRecordKeys]);
  const completedJobs = useMemo(() => entries.filter((e) => e.status === "Completed").length, [entries]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return submittedRecords;
    return submittedRecords.filter((record) => JSON.stringify(record).toLowerCase().includes(term));
  }, [search, submittedRecords]);

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
    if (!favoriteKeyForEmployee) {
      alert("Enter employee name first to save favorites.");
      return;
    }
    const favoriteId = `${department}__${jobDescription}`;
    setEmployeeFavorites((current) => {
      const existing = current[favoriteKeyForEmployee] || [];
      const alreadyExists = existing.some((item) => `${item.department}__${item.jobDescription}` === favoriteId);
      const next = alreadyExists ? existing.filter((item) => `${item.department}__${item.jobDescription}` !== favoriteId) : [{ department, jobDescription }, ...existing].slice(0, 12);
      return { ...current, [favoriteKeyForEmployee]: next };
    });
  };

  const applyFavoriteToEntry = (entryId, favorite) => {
    setEntries((current) => current.map((entry) => entry.id === entryId ? { ...entry, department: favorite.department, jobDescription: favorite.jobDescription } : entry));
  };

  const updateEntry = (id, field, value) => {
    setEntries((current) => current.map((entry) => {
      if (entry.id !== id) return entry;
      if (field === "department") return { ...entry, department: value, jobDescription: "" };
      return { ...entry, [field]: value };
    }));
  };

  const addEntry = () => setEntries((current) => [...current, blankEntry()]);
  const removeEntry = (id) => setEntries((current) => current.length > 1 ? current.filter((e) => e.id !== id) : current);

  const clearForm = () => {
    setEmployeeName("");
    setWorkDate(todayLocal());
    setRegularHoursWorked("");
    setOvertimeHoursWorked("");
    setCallOutHours("");
    setEntries([blankEntry()]);
    setSheetStatus("");
    localStorage.removeItem("dtr-current-draft");
  };

  const saveDraft = () => {
    localStorage.setItem("dtr-current-draft", JSON.stringify({ employeeName, workDate, regularHoursWorked, overtimeHoursWorked, callOutHours, entries }));
    alert("Draft saved.");
  };

  const buildRecord = () => {
    if (isCurrentRecordLocked) {
      alert("This employee's record for the selected date has already been submitted and locked.");
      return null;
    }
    const cleanedEntries = entries.filter((e) => e.jobDescription || e.equipmentUsed || e.hours || e.notes);
    if (!employeeName || !workDate || cleanedEntries.length === 0) {
      alert("Please add name, date, and at least one job entry before submitting.");
      return null;
    }
    return {
      id: crypto.randomUUID(),
      recordKey: currentRecordKey,
      employeeName,
      workDate,
      payPeriodStart: payPeriod.start,
      payPeriodEnd: payPeriod.end,
      payPeriodLabel: payPeriod.label,
      regularHoursWorked,
      overtimeHoursWorked,
      callOutHours,
      totalHoursWorked,
      totalEntryHours,
      submittedAt: new Date().toLocaleString(),
      entries: cleanedEntries,
    };
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
    setIsSubmitting(true);
    setSheetStatus("");
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
  const rows = [[
    "Name",
    "Date",
    "Pay Period Start",
    "Pay Period End",
    "Regular Hours Worked",
    "Overtime Hours Worked",
    "Call Out Hours",
    "Total Hours",
    "Department",
    "Job Description",
    "Hours",
    "Equipment Used",
    "Status",
    "Notes",
    "Submitted At"
  ]];

  submittedRecords.forEach((record) => {
    record.entries.forEach((entry) => {
      rows.push([
        record.employeeName,
        record.workDate,
        record.payPeriodStart,
        record.payPeriodEnd,
        record.regularHoursWorked,
        record.overtimeHoursWorked,
        record.callOutHours,
        record.totalHoursWorked,
        entry.department,
        entry.jobDescription,
        entry.hours,
        entry.equipmentUsed,
        entry.status,
        entry.notes,
        record.submittedAt
      ]);
    });
  });

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
    .join("\\n");

  downloadFile(`daily-time-records-${todayLocal()}.csv`, csv, "text/csv;charset=utf-8;");
};
    downloadFile(`daily-time-records-${todayLocal()}.csv`, csv, "text/csv;charset=utf-8;");
  };

  const printPayPeriodReport = () => {
    if (!reportEmployee) return alert("Select an employee for the pay period report.");
    const rowsHtml = payPeriodRecords.map((record) => record.entries.map((entry) => `<tr><td>${formatDate(record.workDate)}</td><td>${entry.department || ""}</td><td>${entry.jobDescription || ""}</td><td>${entry.hours || "0.00"}</td><td>${entry.equipmentUsed || ""}</td><td>${entry.notes || ""}</td></tr>`).join("")).join("");
    const bodyHtml = `<h1>Employee Pay Period Report</h1><div class="meta"><div><strong>Employee:</strong> ${reportEmployee}</div><div><strong>Pay Period:</strong> ${reportPayPeriod.label}</div><div><strong>Days Submitted:</strong> ${payPeriodRecords.length}</div></div><table><thead><tr><th>Date</th><th>Department</th><th>Job Description</th><th>Hours</th><th>Equipment Used</th><th>Notes</th></tr></thead><tbody>${rowsHtml || '<tr><td colspan="6">No records found for this pay period.</td></tr>'}</tbody></table><h2 style="margin-top:20px;">Pay Period Totals</h2><div><strong>Regular Hours:</strong> ${payPeriodTotals.reg.toFixed(2)}</div><div><strong>Overtime Hours:</strong> ${payPeriodTotals.ot.toFixed(2)}</div><div><strong>Call Out Hours:</strong> ${payPeriodTotals.callOut.toFixed(2)}</div><div><strong>Total Hours:</strong> ${payPeriodTotals.total.toFixed(2)}</div>`;
    printHtml(`Pay Period Report - ${reportEmployee}`, bodyHtml);
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <div className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Town of Highland</p>
            <h1 className="text-lg font-semibold">Public Works Daily Time Record</h1>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-2xl md:hidden"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px]">
              <SheetHeader>
                <SheetTitle>Quick Summary</SheetTitle>
                <SheetDescription>{payPeriod.label || "Current pay period"}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border p-4"><p className="text-xs text-slate-500">Jobs Logged</p><p className="text-2xl font-semibold">{entries.length}</p></div>
                <div className="rounded-2xl border p-4"><p className="text-xs text-slate-500">Job Hours Logged</p><p className="text-2xl font-semibold">{totalEntryHours}</p></div>
                <div className="rounded-2xl border p-4"><p className="text-xs text-slate-500">Total Hours</p><p className="text-2xl font-semibold">{totalHoursWorked}</p></div>
                <div className="rounded-2xl border p-4"><p className="text-xs text-slate-500">Completed Jobs</p><p className="text-2xl font-semibold">{completedJobs}</p></div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-3 py-4 md:px-6 md:py-6">
        <div className="mb-4 hidden gap-3 md:grid md:grid-cols-4">
          {[
            { label: "Jobs Logged", value: entries.length, icon: ClipboardList },
            { label: "Job Hours", value: totalEntryHours, icon: Clock3 },
            { label: "Completed", value: completedJobs, icon: CheckCircle2 },
            { label: "Pay Period", value: payPeriod.label || "Not set", icon: CloudUpload },
          ].map((item) => (
            <Card key={item.label} className="rounded-3xl shadow-sm">
              <CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-slate-50 p-3"><item.icon className="h-5 w-5" /></div><div><p className="text-xs text-slate-500">{item.label}</p><p className="font-semibold">{item.value}</p></div></CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="entry" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-white p-1 shadow-sm">
            <TabsTrigger value="entry" className="rounded-2xl text-xs md:text-sm">New</TabsTrigger>
            <TabsTrigger value="history" className="rounded-2xl text-xs md:text-sm">History</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-2xl text-xs md:text-sm">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-4">
            <Card className="rounded-3xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Daily Entry</CardTitle>
                <CardDescription className="text-sm">Mobile-first layout for field crews. Submit daily records to Google Sheets.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <Input value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} placeholder="Employee name" className="h-12 rounded-2xl text-base" disabled={isCurrentRecordLocked} />
                  <Input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} className="h-12 rounded-2xl text-base" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={regularHoursWorked} onChange={(e) => setRegularHoursWorked(e.target.value)} placeholder="Reg hours" className="h-12 rounded-2xl text-base" disabled={isCurrentRecordLocked} />
                    <Input value={overtimeHoursWorked} onChange={(e) => setOvertimeHoursWorked(e.target.value)} placeholder="OT hours" className="h-12 rounded-2xl text-base" disabled={isCurrentRecordLocked} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={callOutHours} onChange={(e) => setCallOutHours(e.target.value)} placeholder="Call out" className="h-12 rounded-2xl text-base" disabled={isCurrentRecordLocked} />
                    <Input value={totalHoursWorked} readOnly placeholder="Total" className="h-12 rounded-2xl bg-slate-50 text-base font-semibold" />
                  </div>
                  <Input value={payPeriod.label} readOnly className="h-12 rounded-2xl bg-slate-50 text-sm" />
                </div>

                {isCurrentRecordLocked ? <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-800">This daily record is locked because it has already been submitted for this employee and date.</div> : null}
                {sheetStatus ? <div className="rounded-2xl border bg-slate-50 p-3 text-sm text-slate-700">{sheetStatus}</div> : null}

                <div className="space-y-4">
                  {entries.map((entry, index) => {
                    const isFavorite = employeeFavoriteJobs.some((fav) => fav.department === entry.department && fav.jobDescription === entry.jobDescription);
                    const departmentJobs = jobCatalog.filter((j) => j.department === entry.department);
                    return (
                      <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <Badge variant="secondary" className="rounded-full px-3 py-1">Job {index + 1}</Badge>
                          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl" onClick={() => removeEntry(entry.id)} disabled={isCurrentRecordLocked}><Trash2 className="h-5 w-5" /></Button>
                        </div>

                        <div className="mb-3 rounded-2xl border border-dashed bg-slate-50 p-3">
                          <p className="mb-2 text-sm font-medium">Favorites</p>
                          <div className="flex flex-wrap gap-2">
                            {employeeFavoriteJobs.length ? employeeFavoriteJobs.map((fav) => (
                              <Button key={`${entry.id}-${fav.department}-${fav.jobDescription}`} type="button" variant="outline" className="min-h-11 rounded-2xl text-left text-xs" onClick={() => applyFavoriteToEntry(entry.id, fav)} disabled={isCurrentRecordLocked}>
                                {fav.department}: {fav.jobDescription}
                              </Button>
                            )) : <span className="text-sm text-slate-500">No favorites saved yet.</span>}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Select value={entry.department} onValueChange={(value) => updateEntry(entry.id, "department", value)} disabled={isCurrentRecordLocked}>
                            <SelectTrigger className="h-12 rounded-2xl text-base"><SelectValue placeholder="Select department" /></SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                            </SelectContent>
                          </Select>

                          <Select value={entry.jobDescription} onValueChange={(value) => updateEntry(entry.id, "jobDescription", value)} disabled={!entry.department || isCurrentRecordLocked}>
                            <SelectTrigger className="h-12 rounded-2xl text-base"><SelectValue placeholder="Select job description" /></SelectTrigger>
                            <SelectContent>
                              {departmentJobs.map((item) => <SelectItem key={`${item.department}-${item.jobDescription}`} value={item.jobDescription}>{item.jobDescription}</SelectItem>)}
                            </SelectContent>
                          </Select>

                          <div className="grid grid-cols-2 gap-3">
                            <Input value={entry.hours} onChange={(e) => updateEntry(entry.id, "hours", e.target.value)} placeholder="Hours" className="h-12 rounded-2xl text-base" disabled={isCurrentRecordLocked} />
                            <Select value={entry.status} onValueChange={(value) => updateEntry(entry.id, "status", value)} disabled={isCurrentRecordLocked}>
                              <SelectTrigger className="h-12 rounded-2xl text-base"><SelectValue placeholder="Status" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Follow-Up Needed">Follow-Up Needed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Input value={entry.equipmentUsed} onChange={(e) => updateEntry(entry.id, "equipmentUsed", e.target.value)} placeholder="Equipment used" className="h-12 rounded-2xl text-base" disabled={isCurrentRecordLocked} />
                          <Textarea value={entry.notes} onChange={(e) => updateEntry(entry.id, "notes", e.target.value)} placeholder="Notes" className="min-h-[96px] rounded-2xl text-base" disabled={isCurrentRecordLocked} />

                          <Button type="button" variant={isFavorite ? "secondary" : "outline"} className="min-h-12 w-full rounded-2xl text-base" onClick={() => toggleFavorite(entry.department, entry.jobDescription)} disabled={isCurrentRecordLocked || !entry.department || !entry.jobDescription}>
                            <Star className="mr-2 h-5 w-5" /> {isFavorite ? "Remove Favorite" : "Save Favorite"}
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Submitted Records</CardTitle>
                <CardDescription>Search daily entries and export a CSV.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records" className="h-12 rounded-2xl pl-9" /></div>
                  <Button variant="outline" onClick={exportCSV} className="min-h-12 rounded-2xl">Export</Button>
                </div>
                <div className="space-y-3">
                  {filteredRecords.length ? filteredRecords.map((record) => (
                    <div key={record.id} className="rounded-2xl border bg-white p-4">
                      <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{record.employeeName}</p><p className="text-sm text-slate-500">{record.workDate} · {record.payPeriodLabel}</p></div><Badge className="rounded-full">{record.totalHoursWorked} hrs</Badge></div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div>Reg: {record.regularHoursWorked || "0.00"}</div><div>OT: {record.overtimeHoursWorked || "0.00"}</div><div>Call Out: {record.callOutHours || "0.00"}</div><div>Jobs: {record.entries.length}</div></div>
                    </div>
                  )) : <div className="rounded-2xl border bg-white p-6 text-center text-slate-500">No submitted records found.</div>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="rounded-3xl shadow-sm">
              <CardHeader>
                <CardTitle>Pay Period Reports</CardTitle>
                <CardDescription>Print by employee and pay period.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={reportEmployee} onValueChange={setReportEmployee}>
                  <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{uniqueEmployees.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="h-12 rounded-2xl" />
                <Input value={reportPayPeriod.label} readOnly className="h-12 rounded-2xl bg-slate-50" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border p-4"><p className="text-xs text-slate-500">Regular</p><p className="text-xl font-semibold">{payPeriodTotals.reg.toFixed(2)}</p></div>
                  <div className="rounded-2xl border p-4"><p className="text-xs text-slate-500">Overtime</p><p className="text-xl font-semibold">{payPeriodTotals.ot.toFixed(2)}</p></div>
                  <div className="rounded-2xl border p-4"><p className="text-xs text-slate-500">Call Out</p><p className="text-xl font-semibold">{payPeriodTotals.callOut.toFixed(2)}</p></div>
                  <div className="rounded-2xl border p-4"><p className="text-xs text-slate-500">Total</p><p className="text-xl font-semibold">{payPeriodTotals.total.toFixed(2)}</p></div>
                </div>

                <Button onClick={printPayPeriodReport} className="min-h-12 w-full rounded-2xl text-base"><Printer className="mr-2 h-5 w-5" /> Print Pay Period Report</Button>

                <Dialog>
                  <DialogTrigger asChild><Button variant="outline" className="min-h-12 w-full rounded-2xl">Preview Report Entries</Button></DialogTrigger>
                  <DialogContent className="max-w-xl rounded-3xl">
                    <DialogHeader><DialogTitle>Report Preview</DialogTitle></DialogHeader>
                    <div className="max-h-[70vh] space-y-3 overflow-auto">
                      {payPeriodRecords.length ? payPeriodRecords.flatMap((record) => record.entries.map((entry, idx) => (
                        <div key={`${record.id}-${idx}`} className="rounded-2xl border p-3">
                          <p className="font-medium">{record.workDate} · {entry.jobDescription || "—"}</p>
                          <p className="text-sm text-slate-500">{entry.department || "—"}</p>
                          <p className="mt-1 text-sm">Hours: {entry.hours || "0.00"}</p>
                          <p className="text-sm">Equipment: {entry.equipmentUsed || "—"}</p>
                        </div>
                      ))) : <div className="rounded-2xl border p-6 text-center text-slate-500">No records found for this employee and pay period.</div>}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-2">
          <Button onClick={addEntry} className="min-h-12 flex-1 rounded-2xl text-base" disabled={isCurrentRecordLocked}><Plus className="mr-2 h-5 w-5" /> Add Job</Button>
          <Button variant="outline" onClick={saveDraft} className="min-h-12 rounded-2xl px-4 text-base" disabled={isCurrentRecordLocked}>Save</Button>
          <Button onClick={submitRecord} className="min-h-12 flex-1 rounded-2xl text-base" disabled={isSubmitting || isCurrentRecordLocked}><CloudUpload className="mr-2 h-5 w-5" /> {isSubmitting ? "Submitting..." : "Submit"}</Button>
        </div>
      </div>
    </div>
  );
}
