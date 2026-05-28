// ============================================================
// ANALYSIS DASHBOARD - Main wrapper with sidebar navigation
// ============================================================
import { useState, useEffect } from "react";
import { colors, font, displayFont } from "./shared.jsx";
import Overview from "./Overview.jsx";
import StudentProfiles from "./StudentProfiles.jsx";
import ProgressTracking from "./ProgressTracking.jsx";
import Intervention from "./Intervention.jsx";
import Comparative from "./Comparative.jsx";

// -- Navigation items --
const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "M3 3h7v7H3V3zm11 0h7v7h-7V3zm-11 11h7v7H3v-7zm11 0h7v7h-7v-7z" },
  { id: "students", label: "Student Profiles", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" },
  { id: "progress", label: "Progress Tracking", icon: "M23 6l-9.5 9.5-5-5L1 18" },
  { id: "intervention", label: "Intervention", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01" },
  { id: "comparative", label: "Comparative", icon: "M18 20V10M12 20V4M6 20v-6" },
];

const NavIcon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export default function AnalysisDashboard({ onBack, appsScriptUrl, SchoolLogo }) {
  const [page, setPage] = useState("overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");

  // -- Fetch analysis data from Apps Script --
  useEffect(() => {
    (async () => {
      try {
        const url = appsScriptUrl || "";
        if (!url) { setError("No Apps Script URL configured."); setLoading(false); return; }
        const res = await fetch(`${url}?action=get_analysis`);
        const json = await res.json();
        if (json.success) {
          setData(json);
          if (json.exams && json.exams.length > 0) setSelectedExam(json.exams[json.exams.length - 1]);
        } else setError("Failed to load data.");
      } catch (err) { setError("Failed to connect. Please try again."); }
      setLoading(false);
    })();
  }, [appsScriptUrl]);

  // -- Loading state --
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
      <div style={{ textAlign: "center", fontFamily: font }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${colors.accentLight}`, borderTopColor: colors.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: colors.textMuted }}>Loading analysis data...</p>
      </div>
    </div>
  );

  // -- Error state --
  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
      <div style={{ textAlign: "center", fontFamily: font }}>
        <p style={{ color: colors.error, marginBottom: 16 }}>{error}</p>
        <button onClick={onBack} style={{
          fontFamily: font, fontSize: 13, fontWeight: 500, color: colors.accent,
          background: "none", border: `1px solid ${colors.accent}`, borderRadius: 8,
          padding: "8px 16px", cursor: "pointer",
        }}>Back to Dashboard</button>
      </div>
    </div>
  );

  // -- Filter data --
  const allStudents = data.students || [];
  const classes = data.classes || [];
  const exams = data.exams || [];
  const examFiltered = selectedExam ? allStudents.filter(s => s.exam === selectedExam) : allStudents;
  const classFiltered = selectedClass === "all" ? examFiltered : examFiltered.filter(s => s.class === selectedClass);

  // -- Render active page --
  const renderPage = () => {
    switch (page) {
      case "overview": return <Overview students={classFiltered} allStudents={allStudents} classes={classes} />;
      case "students": return <StudentProfiles allStudents={allStudents} exams={exams} />;
      case "progress": return <ProgressTracking allStudents={allStudents} exams={exams} classes={classes} />;
      case "intervention": return <Intervention students={classFiltered} classes={classes} />;
      case "comparative": return <Comparative allStudents={allStudents} exams={exams} classes={classes} />;
      default: return null;
    }
  };

  // -- Show filters only on pages that use filtered data --
  const showFilters = page === "overview" || page === "intervention";

  // -- Select style helper --
  const selectStyle = {
    width: "100%", padding: "8px 10px", fontSize: 12, fontFamily: font,
    border: `1px solid ${colors.border}`, borderRadius: 8, background: colors.card,
    color: colors.text, outline: "none", cursor: "pointer", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px 64px" }}>
        <div style={{ display: "flex", gap: 20 }}>

          {/* ---- SIDEBAR ---- */}
          <div style={{ width: 210, flexShrink: 0 }}>
            <div style={{ position: "sticky", top: 24 }}>
              {/* Logo + title */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "0 4px" }}>
                {SchoolLogo && <SchoolLogo size={32} />}
                <div>
                  <p style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: colors.text, margin: 0 }}>MUET Marks</p>
                  <p style={{ fontFamily: font, fontSize: 10, color: colors.textMuted, margin: 0 }}>Analysis Dashboard</p>
                </div>
              </div>

              {/* Nav items */}
              <div style={{ marginBottom: 24 }}>
                {NAV_ITEMS.map(item => {
                  const active = page === item.id;
                  return (
                    <div key={item.id} onClick={() => setPage(item.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 12px", borderRadius: 8, marginBottom: 2,
                        cursor: "pointer", transition: "all 0.15s",
                        background: active ? colors.card : "transparent",
                        border: active ? `1px solid ${colors.border}` : "1px solid transparent",
                        color: active ? colors.accent : colors.textMuted,
                        fontFamily: font, fontSize: 13, fontWeight: active ? 600 : 400,
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = colors.warm; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    >
                      <NavIcon d={item.icon} />
                      {item.label}
                    </div>
                  );
                })}
              </div>

              {/* Filters (only on overview + intervention) */}
              {showFilters && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: font, fontSize: 10, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, padding: "0 4px" }}>Filters</p>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontFamily: font, fontSize: 10, color: colors.textMuted, marginBottom: 4, display: "block", padding: "0 4px" }}>Exam</label>
                    <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} style={selectStyle}>
                      {exams.map(ex => <option key={ex} value={ex}>{ex.replace("Ujian Bulanan ", "UB ").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: font, fontSize: 10, color: colors.textMuted, marginBottom: 4, display: "block", padding: "0 4px" }}>Class</label>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={selectStyle}>
                      <option value="all">All Classes</option>
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Back button */}
              <button onClick={onBack} style={{
                fontFamily: font, fontSize: 12, fontWeight: 500, color: colors.textMuted,
                background: "none", border: `1px solid ${colors.border}`, borderRadius: 8,
                padding: "8px 14px", cursor: "pointer", width: "100%", transition: "all 0.2s",
              }}
                onMouseEnter={(e) => { e.target.style.borderColor = colors.accent; e.target.style.color = colors.accent; }}
                onMouseLeave={(e) => { e.target.style.borderColor = colors.border; e.target.style.color = colors.textMuted; }}
              >
                &larr; Back to Upload
              </button>
            </div>
          </div>

          {/* ---- MAIN CONTENT ---- */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Page header */}
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 700, color: colors.text, margin: 0 }}>
                {NAV_ITEMS.find(n => n.id === page)?.label || "Analysis"}
              </h1>
              {showFilters && (
                <p style={{ fontFamily: font, fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                  {selectedExam} {selectedClass !== "all" ? ` \u00B7 ${selectedClass}` : " \u00B7 All Classes"}
                </p>
              )}
            </div>

            {/* Active page content */}
            {renderPage()}
          </div>
        </div>

        <footer style={{ marginTop: 48, textAlign: "center", fontFamily: font, fontSize: 12, color: colors.textMuted, opacity: 0.5 }}>
          MUET Marks &middot; Analysis Dashboard &middot; 2026
        </footer>
      </div>
    </div>
  );
}
