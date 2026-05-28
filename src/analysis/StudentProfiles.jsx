// ============================================================
// ANALYSIS - STUDENT PROFILES PAGE
// ============================================================
import { useState, useMemo } from "react";
import { Card, SectionTitle, BandBadge, Bar, StatCard, thStyle, tdStyle,
  colors, font, displayFont, getBand, getNextBandThreshold, computeStats, bandColor } from "./shared.jsx";

export default function StudentProfiles({ allStudents, exams }) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // -- Search results --
  const results = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    const seen = new Set();
    return allStudents.filter(s => {
      if (!s.name.toLowerCase().includes(q) && !(s.ic || "").includes(q)) return false;
      const key = (s.ic || s.name).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 20);
  }, [search, allStudents]);

  // -- Selected student's exam history --
  const studentHistory = useMemo(() => {
    if (!selectedStudent) return [];
    const key = selectedStudent.ic || selectedStudent.name;
    return allStudents
      .filter(s => (s.ic && s.ic === selectedStudent.ic) || s.name === selectedStudent.name)
      .sort((a, b) => exams.indexOf(a.exam) - exams.indexOf(b.exam));
  }, [selectedStudent, allStudents, exams]);

  // -- Class average for comparison --
  const classAvg = useMemo(() => {
    if (!selectedStudent || studentHistory.length === 0) return null;
    const latest = studentHistory[studentHistory.length - 1];
    const classmates = allStudents.filter(s => s.class === latest.class && s.exam === latest.exam);
    return computeStats(classmates);
  }, [selectedStudent, studentHistory, allStudents]);

  const latest = studentHistory.length > 0 ? studentHistory[studentHistory.length - 1] : null;
  const nextBand = latest ? getNextBandThreshold(latest.overall) : null;

  return (
    <div>
      {/* Search bar */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Find Student</SectionTitle>
        <input
          type="text" placeholder="Search by name or IC number..."
          value={search} onChange={(e) => { setSearch(e.target.value); setSelectedStudent(null); }}
          style={{
            width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: font,
            border: `1.5px solid ${colors.border}`, borderRadius: 10, background: colors.bg,
            color: colors.text, outline: "none", boxSizing: "border-box",
          }}
        />

        {/* Search results list */}
        {results.length > 0 && !selectedStudent && (
          <div style={{ marginTop: 12, maxHeight: 250, overflowY: "auto" }}>
            {results.map((s, i) => (
              <div key={i} onClick={() => { setSelectedStudent(s); setSearch(s.name); }}
                style={{
                  padding: "10px 14px", cursor: "pointer", borderRadius: 8,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.warm}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <p style={{ fontFamily: font, fontSize: 13, fontWeight: 500, color: colors.text, margin: 0 }}>{s.name}</p>
                  <p style={{ fontFamily: font, fontSize: 11, color: colors.textMuted, margin: "2px 0 0" }}>{s.class} {s.ic ? ` \u00B7 ${s.ic}` : ""}</p>
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
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontFamily: displayFont, fontSize: 20, fontWeight: 700, color: colors.text, margin: 0 }}>{latest.name}</h2>
                <p style={{ fontFamily: font, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  {latest.class} {latest.ic ? ` \u00B7 ${latest.ic}` : ""} {latest.exam ? ` \u00B7 ${latest.exam}` : ""}
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: displayFont, fontSize: 32, fontWeight: 700, color: bandColor(latest.band), margin: 0 }}>
                  {latest.band}
                </p>
                <p style={{ fontFamily: font, fontSize: 10, color: colors.textMuted }}>Band</p>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              <StatCard label="Overall" value={Math.round(latest.overall)} sub="/360" color={colors.accent} />
              <StatCard label="Reading" value={Math.round(latest.t1Score)} sub="/90" />
              <StatCard label="Listening" value={Math.round(latest.t2Score)} sub="/90" />
              <StatCard label="Speaking" value={Math.round(latest.t3Score)} sub="/90" />
              <StatCard label="Writing" value={Math.round(latest.t4Score)} sub="/90" />
            </div>

            {/* Component bars vs class average */}
            {classAvg && (
              <>
                <SectionTitle>vs Class Average</SectionTitle>
                {[
                  { name: "Reading", key: "t1Score", studentVal: latest.t1Score, classVal: classAvg.components[0].avg },
                  { name: "Listening", key: "t2Score", studentVal: latest.t2Score, classVal: classAvg.components[1].avg },
                  { name: "Speaking", key: "t3Score", studentVal: latest.t3Score, classVal: classAvg.components[2].avg },
                  { name: "Writing", key: "t4Score", studentVal: latest.t4Score, classVal: classAvg.components[3].avg },
                ].map(c => {
                  const diff = Math.round(c.studentVal) - c.classVal;
                  return (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <p style={{ fontFamily: font, fontSize: 12, fontWeight: 500, width: 70, textAlign: "right" }}>{c.name}</p>
                      <div style={{ flex: 1, height: 24, background: "#F0F0EC", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                        <div style={{ width: `${(Math.round(c.studentVal) / 90) * 100}%`, height: "100%", background: diff >= 0 ? colors.accent : colors.band1, borderRadius: 6, transition: "width 0.6s ease" }} />
                        <div style={{ position: "absolute", left: `${(c.classVal / 90) * 100}%`, top: 0, bottom: 0, width: 2, background: colors.text, opacity: 0.3 }} />
                      </div>
                      <span style={{ fontFamily: font, fontSize: 11, fontWeight: 600, width: 55, color: diff >= 0 ? colors.accent : colors.band1 }}>
                        {Math.round(c.studentVal)} ({diff >= 0 ? "+" : ""}{diff})
                      </span>
                    </div>
                  );
                })}
                <p style={{ fontFamily: font, fontSize: 10, color: colors.textMuted, marginTop: 6, fontStyle: "italic" }}>
                  Vertical line = class average
                </p>
              </>
            )}
          </Card>

          {/* Gap to next band */}
          {nextBand && (
            <Card style={{ marginBottom: 16 }}>
              <SectionTitle>Gap to Next Band</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "center", padding: "12px 20px", background: colors.warm, borderRadius: 10 }}>
                  <p style={{ fontFamily: font, fontSize: 10, color: colors.textMuted, textTransform: "uppercase", margin: 0 }}>Target</p>
                  <p style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 700, color: colors.accent, margin: "4px 0 0" }}>{nextBand.band}</p>
                </div>
                <div>
                  <p style={{ fontFamily: font, fontSize: 14, color: colors.text, margin: 0 }}>
                    Needs <strong>{nextBand.needed}</strong> more marks to reach Band {nextBand.band}
                  </p>
                  <p style={{ fontFamily: font, fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                    Current: {Math.round(latest.overall)}/360
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
                      const change = prev ? Math.round(r.overall) - Math.round(prev.overall) : null;
                      return (
                        <tr key={idx}>
                          <td style={{ ...tdStyle, textAlign: "left", fontWeight: 500, fontSize: 11 }}>{r.exam}</td>
                          <td style={tdStyle}>{Math.round(r.t1Score)}</td>
                          <td style={tdStyle}>{Math.round(r.t2Score)}</td>
                          <td style={tdStyle}>{Math.round(r.t3Score)}</td>
                          <td style={tdStyle}>{Math.round(r.t4Score)}</td>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{Math.round(r.overall)}</td>
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
          <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted, textAlign: "center", padding: 20 }}>
            No students found matching "{search}"
          </p>
        </Card>
      )}
    </div>
  );
}
