import { useState } from "react";
import { Card, SectionTitle, BandBadge, Reveal, thStyle, tdStyle,
  colors, font, monoFont, displayFont, computeStats, getBand, bandColor, BAND_ORDER, NATIONAL_BENCHMARK, safeNum } from "./shared.jsx";

export default function Comparative({ allStudents, exams, classes }) {
  var [pw, setPw] = useState("");
  var [unlocked, setUnlocked] = useState(false);
  var students = allStudents || [];
  var examList = exams || [];
  var classList = classes || [];

  if (!unlocked) return (
    <Card>
      <div style={{ textAlign: "center", padding: "30px 20px" }}>
        <SectionTitle>Admin Access Required</SectionTitle>
        <p style={{ fontFamily: font, fontSize: 12, color: colors.textMuted, marginBottom: 16 }}>Enter admin password to view comparative data.</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", maxWidth: 300, margin: "0 auto" }}>
          <input type="password" value={pw} onChange={function(e) { setPw(e.target.value); }} placeholder="Password"
            onKeyDown={function(e) { if (e.key === "Enter" && pw === "admin2026") setUnlocked(true); }}
            style={{ flex: 1, padding: "8px 12px", fontSize: 13, fontFamily: font, border: "1px solid " + colors.border, borderRadius: 6, outline: "none", background: colors.cardAlt, boxSizing: "border-box" }} />
          <button onClick={function() { if (pw === "admin2026") setUnlocked(true); }}
            style={{ padding: "8px 16px", fontSize: 12, fontFamily: monoFont, fontWeight: 500, color: "#fff", background: colors.accent, border: "none", borderRadius: 6, cursor: "pointer", letterSpacing: "0.02em" }}>unlock</button>
        </div>
      </div>
    </Card>
  );

  var latestExam = examList[examList.length - 1];
  var latestStudents = students.filter(function(s) { return s.exam === latestExam; });

  var classRanking = classList.map(function(cls) {
    var cs = latestStudents.filter(function(s) { return s.class === cls; });
    if (cs.length === 0) return null;
    return Object.assign({ class: cls }, computeStats(cs));
  }).filter(Boolean).sort(function(a, b) { return b.overall - a.overall; });

  var bandDist = {};
  latestStudents.forEach(function(s) { var b = s.band || "-"; bandDist[b] = (bandDist[b] || 0) + 1; });
  var total = latestStudents.length || 1;
  var benchmarkData = BAND_ORDER.map(function(b) {
    var school = Math.round(((bandDist[b] || 0) / total) * 100);
    return { band: b, school: school, national: NATIONAL_BENCHMARK[b] || 0 };
  });

  return (
    <div>
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>Class Ranking ({latestExam ? latestExam.replace("Ujian Bulanan ", "UB ") : "latest"})</SectionTitle>
          {classRanking.length === 0 ? <p style={{ fontFamily: monoFont, fontSize: 12, color: colors.textMuted, textAlign: "center" }}>no data</p> : (
            <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  {["#", "Class", "N", "Avg", "Band", "R", "L", "S", "W"].map(function(h) {
                    return <th key={h} style={Object.assign({}, thStyle, { textAlign: h === "Class" ? "left" : "center" })}>{h}</th>;
                  })}
                </tr></thead>
                <tbody>
                  {classRanking.map(function(c, i) {
                    return (
                      <tr key={c.class}>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont, color: colors.textMuted })}>{i + 1}</td>
                        <td style={Object.assign({}, tdStyle, { textAlign: "left", fontWeight: 600 })}>{c.class}</td>
                        <td style={Object.assign({}, tdStyle, { color: colors.textMuted })}>{c.total}</td>
                        <td style={Object.assign({}, tdStyle, { fontWeight: 700, fontFamily: monoFont, color: colors.accent })}>{c.overall}</td>
                        <td style={tdStyle}><BandBadge band={c.band.band} /></td>
                        {c.components.map(function(comp) { return <td key={comp.name} style={Object.assign({}, tdStyle, { fontFamily: monoFont })}>{comp.avg}</td>; })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Reveal>
      <Reveal delay={0.1}>
        <Card>
          <SectionTitle>Band Distribution vs National Benchmark</SectionTitle>
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={Object.assign({}, thStyle, { textAlign: "left" })}>Band</th>
                <th style={thStyle}>School %</th>
                <th style={thStyle}>National %</th>
                <th style={thStyle}>Diff</th>
              </tr></thead>
              <tbody>
                {benchmarkData.map(function(b) {
                  var diff = b.school - b.national;
                  return (
                    <tr key={b.band}>
                      <td style={Object.assign({}, tdStyle, { textAlign: "left" })}><BandBadge band={b.band} /></td>
                      <td style={Object.assign({}, tdStyle, { fontFamily: monoFont, fontWeight: 600 })}>{b.school}%</td>
                      <td style={Object.assign({}, tdStyle, { fontFamily: monoFont, color: colors.textMuted })}>{b.national}%</td>
                      <td style={Object.assign({}, tdStyle, { fontFamily: monoFont, fontWeight: 600, color: diff >= 0 ? colors.accent : colors.band1 })}>
                        {diff >= 0 ? "+" : ""}{diff}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
