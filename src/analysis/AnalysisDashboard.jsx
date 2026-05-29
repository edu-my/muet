// ============================================================
// ANALYSIS DASHBOARD - Responsive sidebar layout
// ============================================================
import { useState, useEffect } from "react";
import { colors, font, displayFont, PageErrorBoundary } from "./shared.jsx";
import Overview from "./Overview.jsx";
import StudentProfiles from "./StudentProfiles.jsx";
import ProgressTracking from "./ProgressTracking.jsx";
import Intervention from "./Intervention.jsx";
import Comparative from "./Comparative.jsx";

const NAV = [
  { id: "overview", label: "Overview", icon: "M3 3h7v7H3V3zm11 0h7v7h-7V3zm-11 11h7v7H3v-7zm11 0h7v7h-7v-7z" },
  { id: "students", label: "Student Profiles", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  { id: "progress", label: "Progress Tracking", icon: "M23 6l-9.5 9.5-5-5L1 18" },
  { id: "intervention", label: "Intervention", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01" },
  { id: "comparative", label: "Comparative", icon: "M18 20V10M12 20V4M6 20v-6" },
];

const Icon = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);

export default function AnalysisDashboard({ onBack, appsScriptUrl, SchoolLogo }) {
  const [page, setPage] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [crashError, setCrashError] = useState(null);

  useEffect(function scrollTop() { window.scrollTo(0, 0); }, [page]);

  useEffect(function fetchData() {
    var url = appsScriptUrl || "";
    if (!url) { setError("No Apps Script URL."); setLoading(false); return; }
    fetch(url + "?action=get_analysis")
      .then(function(res) { return res.json(); })
      .then(function(json) {
        if (json.success) {
          setData(json);
          if (json.exams && json.exams.length > 0) setSelectedExam(json.exams[json.exams.length - 1]);
        } else { setError("Failed to load data."); }
        setLoading(false);
      })
      .catch(function(err) {
        setError("Failed to connect: " + (err && err.message ? err.message : "unknown"));
        setLoading(false);
      });
  }, [appsScriptUrl]);

  // -- Top-level crash catcher --
  if (crashError) {
    return (
      <div style={{ padding: 40, fontFamily: font, textAlign: "center" }}>
        <p style={{ color: colors.error, marginBottom: 8, fontWeight: 600 }}>Dashboard Error</p>
        <p style={{ color: colors.textMuted, fontSize: 12, marginBottom: 16 }}>{String(crashError)}</p>
        <button onClick={onBack} style={{ fontFamily: font, fontSize: 12, color: colors.accent, background: "none", border: "1px solid " + colors.accent, borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>Back</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", fontFamily: font }}>
          <div style={{ width: 32, height: 32, border: "3px solid " + colors.accentLight, borderTopColor: colors.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
          <p style={{ color: colors.textMuted, fontSize: 13 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", fontFamily: font }}>
          <p style={{ color: colors.error, marginBottom: 12, fontSize: 13 }}>{error}</p>
          <button onClick={onBack} style={{ fontFamily: font, fontSize: 12, color: colors.accent, background: "none", border: "1px solid " + colors.accent, borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>Back</button>
        </div>
      </div>
    );
  }

  var allStudents = [];
  var classes = [];
  var exams = [];
  try {
    allStudents = (data && data.students) ? data.students : [];
    classes = (data && data.classes) ? data.classes : [];
    exams = (data && data.exams) ? data.exams : [];
  } catch(e) {
    return <p style={{ padding: 20, color: "red", fontFamily: font }}>Data error: {String(e)}</p>;
  }

  var examFiltered = selectedExam ? allStudents.filter(function(s) { return s.exam === selectedExam; }) : allStudents;
  var classFiltered = selectedClass === "all" ? examFiltered : examFiltered.filter(function(s) { return s.class === selectedClass; });

  var shortExam = function(n) { return (n || "").replace("Ujian Bulanan ", "UB ").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT"); };
  var showFilters = (page === "overview" || page === "intervention");

  var renderPage = function() {
    try {
      switch (page) {
        case "overview": return <Overview students={classFiltered} allStudents={allStudents} classes={classes} />;
        case "students": return <StudentProfiles allStudents={allStudents} exams={exams} />;
        case "progress": return <ProgressTracking allStudents={allStudents} exams={exams} classes={classes} />;
        case "intervention": return <Intervention students={classFiltered} classes={classes} />;
        case "comparative": return <Comparative allStudents={allStudents} exams={exams} classes={classes} />;
        default: return null;
      }
    } catch(e) {
      return <p style={{ padding: 20, color: "red", fontFamily: font }}>Page render error: {String(e)}</p>;
    }
  };

  var sel = {
    width: "100%", padding: "6px 8px", fontSize: 11, fontFamily: font,
    border: "1px solid " + colors.border, borderRadius: 6, background: colors.card,
    color: colors.text, outline: "none", cursor: "pointer", boxSizing: "border-box",
  };

  var navItem = function(item) {
    var a = page === item.id;
    return (
      <div key={item.id} onClick={function() { setPage(item.id); }}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 6, marginBottom: 1,
          cursor: "pointer", background: a ? colors.accent : "transparent", color: a ? "#fff" : colors.textMuted,
          fontSize: 12, fontWeight: a ? 600 : 400,
        }}>
        <Icon d={item.icon}/>{item.label}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: font, position: "relative", zIndex: 1 }}>

      {/* SIDEBAR */}
      <div style={{
        width: 200, flexShrink: 0, background: colors.card,
        borderRight: "1px solid " + colors.border,
        position: "sticky", top: 0, height: "100vh",
        display: "flex", flexDirection: "column",
        overflowY: "auto", zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: "12px 12px 10px", borderBottom: "1px solid " + colors.border, background: colors.warm }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {SchoolLogo && <div style={{ width: 32, height: 32, borderRadius: 6, background: colors.card, border: "1px solid " + colors.border, display: "flex", alignItems: "center", justifyContent: "center" }}><SchoolLogo size={24}/></div>}
            <div>
              <p style={{ fontFamily: displayFont, fontSize: 13, fontWeight: 700, color: colors.text, margin: 0, lineHeight: 1.1 }}>MUET Marks</p>
              <p style={{ fontSize: 9, color: colors.textMuted, margin: 0 }}>Analysis Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ padding: "6px 6px", flex: 1 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 8px 2px", margin: 0 }}>Menu</p>
          {NAV.map(navItem)}

          {/* Filters */}
          {showFilters && (
            <div style={{ marginTop: 8, padding: "8px 0", borderTop: "1px solid " + colors.border }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 8px", marginBottom: 4 }}>Filters</p>
              <div style={{ padding: "0 4px", marginBottom: 6 }}>
                <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2, paddingLeft: 2 }}>Exam</label>
                <select value={selectedExam} onChange={function(e) { setSelectedExam(e.target.value); }} style={sel}>
                  {exams.map(function(ex) { return <option key={ex} value={ex}>{shortExam(ex)}</option>; })}
                </select>
              </div>
              <div style={{ padding: "0 4px" }}>
                <label style={{ fontSize: 9, color: colors.textMuted, display: "block", marginBottom: 2, paddingLeft: 2 }}>Class</label>
                <select value={selectedClass} onChange={function(e) { setSelectedClass(e.target.value); }} style={sel}>
                  <option value="all">All Classes</option>
                  {classes.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Back button */}
        <div style={{ padding: "6px 8px", borderTop: "1px solid " + colors.border }}>
          <button onClick={onBack} style={{
            fontSize: 11, fontWeight: 500, color: colors.textMuted, fontFamily: font,
            background: "none", border: "1px solid " + colors.border, borderRadius: 6,
            padding: "6px 8px", cursor: "pointer", width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Upload
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, minWidth: 0, padding: "20px 24px 40px" }}>
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ fontFamily: displayFont, fontSize: 20, fontWeight: 700, color: colors.text, margin: 0 }}>
            {(NAV.find(function(n) { return n.id === page; }) || {}).label || "Analysis"}
          </h1>
          {showFilters && (
            <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
              {shortExam(selectedExam)}{selectedClass !== "all" ? " \u00B7 " + selectedClass : " \u00B7 All Classes"}
            </p>
          )}
        </div>
        <PageErrorBoundary key={page}>
          {renderPage()}
        </PageErrorBoundary>
        <p style={{ marginTop: 32, fontSize: 10, color: colors.textMuted, opacity: 0.35 }}>MUET Marks - Analysis Dashboard - 2026</p>
      </div>
    </div>
  );
}
