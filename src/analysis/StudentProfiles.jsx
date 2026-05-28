// ============================================================
// ANALYSIS - STUDENT PROFILES PAGE
// ============================================================
import { useState, useMemo } from "react";
import { Card, SectionTitle, BandBadge, Bar, StatCard, thStyle, tdStyle,
  colors, font, displayFont, getBand, getNextBandThreshold, computeStats, bandColor, safeNum } from "./shared.jsx";

// -- Safe string coercion (handles numbers, null, undefined) --
const str = (v) => v == null ? "" : String(v);

export default function StudentProfiles({ allStudents, exams }) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const students = allStudents || [];
  const examList = exams || [];

  // -- Search results (deduplicated by IC or name) --
  const results = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    const seen = new Set();
    return students.filter(s => {
      const name = str(s.name).toLowerCase();
      const ic = str(s.ic).toLowerCase();
      if (!name.includes(q) && !ic.includes(q)) return false;
      const key = ic || name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 20);
  }, [search, students]);

  // -- Selected student's exam history --
  const studentHistory = useMemo(() => {
    if (!selectedStudent) return [];
    return students
      .filter(s => {
        if (selectedStudent.ic && s.ic) return str(s.ic) === str(selectedStudent.ic);
        return str(s.name) === str(selectedStudent.name);
      })
      .sort((a, b) => examList.indexOf(a.exam) - examList.indexOf(b.exam));
  }, [selectedStudent, students, examList]);

  // -- Class average for comparison --
  const classAvg = useMemo(() => {
    if (!selectedStudent || studentHistory.length === 0) return null;
    const latest = studentHistory[studentHistory.length - 1];
    if (!latest) return null;
    const classmates = students.filter(s => s.class === latest.class && s.exam === latest.exam);
    return computeStats(classmates);
  }, [selectedStudent, studentHistory, students]);

  const latest = studentHistory.length > 0 ? studentHistory[studentHistory.length - 1] : null;
  const nextBand = latest ? getNextBandThreshold(safeNum(latest.overall)) : null;

  return (
    <div>
      {/* Search bar */}
      <Card style={{ marginBottom: 12 }}>
        <SectionTitle>Find Student</SectionTitle>
        <input
          type="text" placeholder="Search by name or IC number..."
          value={search} onChange={(e) => { setSearch(e.target.value); setSelectedStudent(null); }}
          style={{
            width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: font,
            border: `1.5px solid ${colors.border}`, borderRadius: 8, background: colors.bg,
            color: colors.text, outline: "none", boxSizing: "border-box",
          }}
        />

        {/* Search results list */}
        {results.length > 0 && !selectedStudent && (
          <div style={{ marginTop: 8, maxHeight: 220, overflowY: "auto" }}>
            {results.map((s, i) => (
              <div key={i} onClick={() => { setSelectedStudent(s); setSearch(str(s.name)); }}
                style={{
                  padding: "8px 12px", cursor: "pointer", borderRadius: 6,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.warm}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <p style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: colors.text, margin: 0 }}>{s.name}</p>
                  <p style={{ fontFamily: font, fontSize: 11, color: colors.textMuted, margin: "2px 0 0" }}>{s.class}{s.ic ? ` \u00B7 ${s.ic}` : ""}</p>
                </div>
                <BandBadge band={s.band} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Student profile detail */}
      {selectedStudent && latest && (
        <>
          {/* Current scores */}
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h2 style={{ fontFamily: displayFont, fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>{latest.name}</h2>
                <p style={{ fontFamily: font, fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                  {latest.class}{latest.ic ? ` \u00B7 ${latest.ic}` : ""}{latest.exam ? ` \u00B7 ${latest.exam}` : ""}
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: displayFont, fontSize: 28, fontWeight: 700, color: bandColor(latest.band), margin: 0 }}>
                  {latest.band || "-"}
                </p>
                <p style={{ fontFamily: font, fontSize: 9, color: colors.textMuted }}>Band</p>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              <StatCard label="Overall" value={Math.round(safeNum(latest.overall))} sub="/360" color={colors.accent} />
              <StatCard label="Reading" value={Math.round(safeNum(latest.t1Score))} sub="/90" />
              <StatCard label="Listening" value={Math.round(safeNum(latest.t2Score))} sub="/90" />
              <StatCard label="Speaking" value={Math.round(safeNum(latest.t3Score))} sub="/90" />
              <StatCard label="Writing" value={Math.round(safeNum(latest.t4Score))} sub="/90" />
            </div>

            {/* Component bars vs class average */}
            {classAvg && classAvg.components && (
              <>
                <SectionTitle>vs Class Average</SectionTitle>
                {[
                  { name: "Reading", studentVal: safeNum(latest.t1Score), classVal: classAvg.components[0]?.avg || 0 },
                  { name: "Listening", studentVal: safeNum(latest.t2Score), classVal: classAvg.components[1]?.avg || 0 },
                  { name: "Speaking", studentVal: safeNum(latest.t3Score), classVal: classAvg.components[2]?.avg || 0 },
                  { name: "Writing", studentVal: safeNum(latest.t4Score), classVal: classAvg.components[3]?.avg || 0 },
                ].map(c => {
                  const sv = Math.round(c.studentVal);
                  const diff = sv - c.classVal;
                  return (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <p style={{ fontFamily: font, fontSize: 11, fontWeight: 500, width: 65, textAlign: "right", margin: 0 }}>{c.name}</p>
                      <div style={{ flex: 1, height: 20, background: "#F0F0EC", borderRadius: 5, overflow: "hidden", position: "relative" }}>
                        <div style={{ width: `${(sv / 90) * 100}%`, height: "100%", background: diff >= 0 ? colors.accent : colors.band1, borderRadius: 5, transition: "width 0.6s ease" }} />
                        <div style={{ position: "absolute", left: `${(c.classVal / 90) * 100}%`, top: 0, bottom: 0, width: 2, background: colors.text, opacity: 0.3 }} />
                      </div>
                      <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, width: 50, color: diff >= 0 ? colors.accent : colors.band1 }}>
                        {sv} ({diff >= 0 ? "+" : ""}{diff})
                      </span>
                    </div>
                  );
                })}
                <p style={{ fontFamily: font, fontSize: 9, color: colors.textMuted, marginTop: 4, fontStyle: "italic" }}>
                  Vertical line = class average
                </p>
              </>
            )}
          </Card>

          {/* Gap to next band */}
          {nextBand && (
            <Card style={{ marginBottom: 12 }}>
              <SectionTitle>Gap to Next Band</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ textAlign: "center", padding: "10px 16px", background: colors.warm, borderRadius: 8 }}>
                  <p style={{ fontFamily: font, fontSize: 9, color: colors.textMuted, textTransform: "uppercase", margin: 0 }}>Target</p>
                  <p style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 700, color: colors.accent, margin: "2px 0 0" }}>{nextBand.band}</p>
                </div>
                <div>
                  <p style={{ fontFamily: font, fontSize: 13, color: colors.text, margin: 0 }}>
                    Needs <strong>{nextBand.needed}</strong> more marks to reach Band {nextBand.band}
                  </p>
                  <p style={{ fontFamily: font, fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    Current: {Math.round(safeNum(latest.overall))}/360
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Exam history table */}
          {studentHistory.length > 1 && (
            <Card>
              <SectionTitle>Exam History</SectionTitle>
              <div style={{ overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Exam", "Reading", "Listening", "Speaking", "Writing", "Overall", "Band", "Change"].map(h => (
                        <th key={h} style={{ ...thStyle, textAlign: h === "Exam" ? "left" : "center" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {studentHistory.map((r, idx) => {
                      const prev = idx > 0 ? studentHistory[idx - 1] : null;
                      const change = prev ? Math.round(safeNum(r.overall)) - Math.round(safeNum(prev.overall)) : null;
                      return (
                        <tr key={idx}>
                          <td style={{ ...tdStyle, textAlign: "left", fontWeight: 500, fontSize: 11 }}>{r.exam}</td>
                          <td style={tdStyle}>{Math.round(safeNum(r.t1Score))}</td>
                          <td style={tdStyle}>{Math.round(safeNum(r.t2Score))}</td>
                          <td style={tdStyle}>{Math.round(safeNum(r.t3Score))}</td>
                          <td style={tdStyle}>{Math.round(safeNum(r.t4Score))}</td>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{Math.round(safeNum(r.overall))}</td>
                          <td style={tdStyle}><BandBadge band={r.band} /></td>
                          <td style={{ ...tdStyle, fontWeight: 600, color: change === null ? colors.textMuted : change >= 0 ? colors.accent : colors.band1 }}>
                            {change === null ? "-" : `${change >= 0 ? "+" : ""}${change}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Empty state */}
      {!selectedStudent && results.length === 0 && search.length >= 2 && (
        <Card>
          <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted, textAlign: "center", padding: 16 }}>
            No students found matching "{search}"
          </p>
        </Card>
      )}

      {/* Initial state */}
      {!selectedStudent && search.length < 2 && (
        <Card>
          <div style={{ textAlign: "center", padding: "24px 16px" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted, margin: 0 }}>
              Type a student's name or IC number to view their profile
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
