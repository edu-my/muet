// ============================================================
// ANALYSIS - COMPARATIVE PAGE (Admin-gated)
// ============================================================
import { useState } from "react";
import { Card, SectionTitle, BandBadge, StatCard, thStyle, tdStyle,
  colors, font, displayFont, computeStats, getBand, bandColor, BAND_ORDER, NATIONAL_BENCHMARK } from "./shared.jsx";

const ADMIN_PASSWORD = "admin2026";

export default function Comparative({ allStudents, exams, classes }) {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password.");
    }
  };

  if (!authenticated) {
    return (
      <Card>
        <div style={{ maxWidth: 340, margin: "40px auto", textAlign: "center" }}>
          <SectionTitle>Admin Access Required</SectionTitle>
          <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>
            Comparative data contains sensitive teacher performance metrics. Enter admin password to continue.
          </p>
          <input type="password" placeholder="Admin password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            style={{
              width: "100%", padding: "12px 14px", fontSize: 14, fontFamily: font,
              border: `1.5px solid ${error ? colors.error : colors.border}`, borderRadius: 10,
              background: colors.bg, color: colors.text, outline: "none", boxSizing: "border-box", marginBottom: 12,
            }}
          />
          {error && <p style={{ fontFamily: font, fontSize: 12, color: colors.error, marginBottom: 12 }}>{error}</p>}
          <button onClick={handleAuth} style={{
            fontFamily: font, fontSize: 14, fontWeight: 600, color: "#fff",
            background: colors.accent, border: "none", borderRadius: 10, padding: "12px 24px",
            cursor: "pointer", width: "100%",
          }}>Unlock</button>
        </div>
      </Card>
    );
  }

  // -- Use latest exam for comparison --
  const latestExam = exams[exams.length - 1];
  const latestStudents = allStudents.filter(s => s.exam === latestExam);

  // -- Class ranking --
  const classRanking = classes.map(cls => {
    const cs = latestStudents.filter(s => s.class === cls);
    if (cs.length === 0) return null;
    const stats = computeStats(cs);
    return { class: cls, ...stats };
  }).filter(Boolean).sort((a, b) => b.overall - a.overall);

  // -- Band distribution vs national benchmark --
  const totalLatest = latestStudents.length;
  const bandDist = {};
  latestStudents.forEach(s => { const b = s.band || "-"; bandDist[b] = (bandDist[b] || 0) + 1; });

  // -- Teacher performance (group by teacher if data has teacher field) --
  const hasTeacherData = latestStudents.some(s => s.teacher);
  const teacherStats = hasTeacherData ? (() => {
    const teachers = {};
    latestStudents.forEach(s => {
      if (!s.teacher) return;
      if (!teachers[s.teacher]) teachers[s.teacher] = [];
      teachers[s.teacher].push(s);
    });
    return Object.entries(teachers).map(([teacher, students]) => {
      const stats = computeStats(students);
      return { teacher, ...stats };
    }).sort((a, b) => b.overall - a.overall);
  })() : [];

  return (
    <div>
      {/* Latest exam context */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <SectionTitle>Comparative Analysis</SectionTitle>
            <p style={{ fontFamily: font, fontSize: 12, color: colors.textMuted }}>Based on: {latestExam} ({totalLatest} students)</p>
          </div>
          <button onClick={() => setAuthenticated(false)} style={{
            fontFamily: font, fontSize: 12, fontWeight: 500, color: colors.textMuted,
            background: "none", border: `1px solid ${colors.border}`, borderRadius: 8,
            padding: "6px 14px", cursor: "pointer",
          }}>Lock</button>
        </div>
      </Card>

      {/* Class ranking */}
      {classRanking.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>Class Ranking</SectionTitle>
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", "Class", "Students", "Avg Score", "Band", "Reading", "Listening", "Speaking", "Writing"].map(h => (
                    <th key={h} style={{ ...thStyle, textAlign: h === "Class" ? "left" : "center" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classRanking.map((c, i) => (
                  <tr key={c.class} style={{ background: i === 0 ? colors.accentLight : "transparent" }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: i === 0 ? colors.accent : colors.textMuted }}>{i + 1}</td>
                    <td style={{ ...tdStyle, textAlign: "left", fontWeight: 600 }}>{c.class}</td>
                    <td style={{ ...tdStyle, color: colors.textMuted }}>{c.total}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: colors.accent }}>{c.overall}</td>
                    <td style={tdStyle}><BandBadge band={c.band.band} /></td>
                    {c.components.map(comp => (
                      <td key={comp.name} style={tdStyle}>{comp.avg}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Teacher performance (if data available) */}
      {teacherStats.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>Teacher Performance</SectionTitle>
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Teacher", "Students", "Avg Score", "Band", "Weakest"].map(h => (
                    <th key={h} style={{ ...thStyle, textAlign: h === "Teacher" ? "left" : "center" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teacherStats.map(t => (
                  <tr key={t.teacher}>
                    <td style={{ ...tdStyle, textAlign: "left", fontWeight: 500 }}>{t.teacher}</td>
                    <td style={{ ...tdStyle, color: colors.textMuted }}>{t.total}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: colors.accent }}>{t.overall}</td>
                    <td style={tdStyle}><BandBadge band={t.band.band} /></td>
                    <td style={{ ...tdStyle, color: colors.band1, fontWeight: 600 }}>{t.weakest.name} ({t.weakest.avg})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* National benchmark comparison */}
      <Card>
        <SectionTitle>Band Distribution vs National Benchmark</SectionTitle>
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left" }}>Band</th>
                {BAND_ORDER.map(b => <th key={b} style={thStyle}>{b}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...tdStyle, textAlign: "left", fontSize: 11, fontWeight: 600 }}>School %</td>
                {BAND_ORDER.map(b => {
                  const count = bandDist[b] || 0;
                  const pct = totalLatest > 0 ? Math.round((count / totalLatest) * 100) : 0;
                  const natPct = NATIONAL_BENCHMARK[b] || 0;
                  return (
                    <td key={b} style={{ ...tdStyle, fontWeight: 700, color: pct < natPct ? colors.band1 : colors.accent }}>
                      {pct}%
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td style={{ ...tdStyle, textAlign: "left", fontSize: 11, color: colors.textMuted }}>National %</td>
                {BAND_ORDER.map(b => <td key={b} style={{ ...tdStyle, color: colors.textMuted }}>{NATIONAL_BENCHMARK[b] || 0}%</td>)}
              </tr>
            </tbody>
          </table>
        </div>
        <p style={{ fontFamily: font, fontSize: 10, color: colors.textMuted, marginTop: 8, fontStyle: "italic" }}>
          Green = above national average, Red = below national average
        </p>
      </Card>
    </div>
  );
}
