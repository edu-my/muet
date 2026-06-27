// ============================================================
// ANALYSIS DASHBOARD - Oberon-inspired sidebar layout
// ============================================================
import { useState, useEffect } from "react";
import { colors, font, monoFont, displayFont, GlobalStyles, PageErrorBoundary } from "./shared.jsx";
import Overview from "./Overview.jsx";
import StudentProfiles from "./StudentProfiles.jsx";
import ProgressTracking from "./ProgressTracking.jsx";
import Intervention from "./Intervention.jsx";
import Comparative from "./Comparative.jsx";
import Release from "./Release.jsx";
import Registration from "./Registration.jsx";

var NAV = [
  { id: "overview", label: "Overview" },
  { id: "students", label: "Student Profiles" },
  { id: "progress", label: "Progress" },
  { id: "intervention", label: "Intervention" },
  { id: "comparative", label: "Comparative" },
  { id: "release", label: "Release Results" },
  { id: "registration", label: "MUET Registration" },
];

export default function AnalysisDashboard({ onBack, appsScriptUrl, SchoolLogo }) {
  var [page, setPage] = useState("overview");
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState("");
  var [selectedExam, setSelectedExam] = useState("");
  var [selectedClass, setSelectedClass] = useState("all");

  useEffect(function() { window.scrollTo(0, 0); }, [page]);

  useEffect(function() {
    var url = appsScriptUrl || "";
    if (!url) { setError("No Apps Script URL."); setLoading(false); return; }
    fetch(url + "?action=get_analysis")
      .then(function(r) { return r.json(); })
      .then(function(json) {
        if (json.success) { setData(json); if (json.exams && json.exams.length > 0) setSelectedExam(json.exams[json.exams.length - 1]); }
        else setError("Failed to load data.");
        setLoading(false);
      })
      .catch(function(err) { setError("Connection failed: " + (err && err.message ? err.message : "")); setLoading(false); });
  }, [appsScriptUrl]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.bg }}>
      <div style={{ textAlign: "center", fontFamily: font }}>
        <div style={{ width: 28, height: 28, border: "2px solid " + colors.border, borderTopColor: colors.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <p style={{ color: colors.textMuted, fontSize: 12, fontFamily: monoFont }}>loading data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.bg }}>
      <div style={{ textAlign: "center", fontFamily: font, maxWidth: 360 }}>
        <p style={{ color: colors.error, marginBottom: 12, fontSize: 13 }}>{error}</p>
        <button onClick={onBack} style={{ fontFamily: monoFont, fontSize: 11, color: colors.accent, background: "none", border: "1px solid " + colors.accent, borderRadius: 6, padding: "8px 16px", cursor: "pointer", letterSpacing: "0.02em" }}>back</button>
      </div>
    </div>
  );

  var allStudents = (data && data.students) ? data.students : [];
  var classes = (data && data.classes) ? data.classes : [];
  var exams = (data && data.exams) ? data.exams : [];
  var examFiltered = selectedExam ? allStudents.filter(function(s) { return s.exam === selectedExam; }) : allStudents;
  var classFiltered = selectedClass === "all" ? examFiltered : examFiltered.filter(function(s) { return s.class === selectedClass; });
  var shortExam = function(n) { return (n || "").replace("Ujian Bulanan ", "UB ").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT"); };
  var showFilters = (page === "overview" || page === "intervention");

  var renderPage = function() {
    try {
      switch (page) {
        case "overview": return <Overview students={classFiltered} allStudents={allStudents} classes={classes} />;
        case "students": return <StudentProfiles allStudents={allStudents} exams={exams} classes={classes} />;
        case "progress": return <ProgressTracking allStudents={allStudents} exams={exams} classes={classes} />;
        case "intervention": return <Intervention students={classFiltered} classes={classes} />;
        case "comparative": return <Comparative allStudents={allStudents} exams={exams} classes={classes} />;
        case "release": return <Release appsScriptUrl={appsScriptUrl} exams={exams} />;
        case "registration": return <Registration appsScriptUrl={appsScriptUrl} classes={classes} />;
        default: return null;
      }
    } catch(e) { return <p style={{ padding: 20, color: colors.error, fontFamily: monoFont, fontSize: 12 }}>render error: {String(e)}</p>; }
  };

  var sel = {
    width: "100%", padding: "7px 10px", fontSize: 11, fontFamily: font,
    border: "1px solid " + colors.border, borderRadius: 6, background: colors.card,
    color: colors.text, outline: "none", cursor: "pointer", boxSizing: "border-box",
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", minHeight: "100vh", fontFamily: font }}>
        {/* SIDEBAR */}
        <div style={{
          width: 210, flexShrink: 0, background: colors.card,
          borderRight: "1px solid " + colors.border,
          position: "sticky", top: 0, height: "100vh",
          display: "flex", flexDirection: "column", overflowY: "auto",
        }}>
          {/* Logo */}
          <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid " + colors.border }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {SchoolLogo && <SchoolLogo size={28} />}
              <div>
                <p style={{ fontFamily: displayFont, fontSize: 14, fontWeight: 700, color: colors.text, margin: 0, lineHeight: 1.1 }}>MUET</p>
                <p style={{ fontFamily: monoFont, fontSize: 9, color: colors.textMuted, margin: 0, letterSpacing: "0.04em" }}>analysis</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ padding: "8px 8px", flex: 1 }}>
            {NAV.map(function(item, idx) {
              var a = page === item.id;
              return (
                <div key={item.id} onClick={function() { setPage(item.id); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 10px", borderRadius: 6, marginBottom: 1, cursor: "pointer",
                    background: a ? colors.accent : "transparent",
                    color: a ? "#fff" : colors.textMuted,
                    fontSize: 12, fontWeight: a ? 600 : 400,
                    transition: "all 0.15s",
                  }}>
                  <span style={{ fontFamily: monoFont, fontSize: 10, opacity: 0.6, width: 16 }}>
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {item.label}
                </div>
              );
            })}

            {showFilters && (
              <div style={{ marginTop: 10, padding: "10px 0", borderTop: "1px solid " + colors.border }}>
                <p style={{ fontFamily: monoFont, fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 8px", marginBottom: 6 }}>filters</p>
                <div style={{ padding: "0 4px", marginBottom: 6 }}>
                  <label style={{ fontFamily: monoFont, fontSize: 9, color: colors.textLight, display: "block", marginBottom: 2, paddingLeft: 2 }}>exam</label>
                  <select value={selectedExam} onChange={function(e) { setSelectedExam(e.target.value); }} style={sel}>
                    {exams.map(function(ex) { return <option key={ex} value={ex}>{shortExam(ex)}</option>; })}
                  </select>
                </div>
                <div style={{ padding: "0 4px" }}>
                  <label style={{ fontFamily: monoFont, fontSize: 9, color: colors.textLight, display: "block", marginBottom: 2, paddingLeft: 2 }}>class</label>
                  <select value={selectedClass} onChange={function(e) { setSelectedClass(e.target.value); }} style={sel}>
                    <option value="all">All Classes</option>
                    {classes.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Back */}
          <div style={{ padding: "8px 10px", borderTop: "1px solid " + colors.border }}>
            <button onClick={onBack} style={{
              fontFamily: monoFont, fontSize: 10, color: colors.textMuted,
              background: "none", border: "1px solid " + colors.border, borderRadius: 6,
              padding: "7px 10px", cursor: "pointer", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              letterSpacing: "0.02em", transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 14 }}>&larr;</span> back to upload
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, minWidth: 0, padding: "24px 28px 48px" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 2 }}>
              <span style={{ fontFamily: monoFont, fontSize: 11, color: colors.accent }}>
                {String(NAV.findIndex(function(n) { return n.id === page; }) + 1).padStart(2, "0")}
              </span>
              <h1 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>
                {(NAV.find(function(n) { return n.id === page; }) || {}).label || "Analysis"}
              </h1>
            </div>
            {showFilters && (
              <p style={{ fontFamily: monoFont, fontSize: 11, color: colors.textMuted, marginLeft: 26 }}>
                {shortExam(selectedExam)}{selectedClass !== "all" ? " / " + selectedClass : " / all classes"}
              </p>
            )}
          </div>
          <PageErrorBoundary key={page}>
            {renderPage()}
          </PageErrorBoundary>
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid " + colors.border }}>
            <p style={{ fontFamily: monoFont, fontSize: 9, color: colors.textLight, letterSpacing: "0.04em" }}>
              muet marks &middot; analysis &middot; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
