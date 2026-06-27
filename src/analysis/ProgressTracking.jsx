import { Card, SectionTitle, BandBadge, StatCard, Reveal, thStyle, tdStyle,
  colors, font, monoFont, displayFont, computeStats, getBand, bandColor, safeNum } from "./shared.jsx";

export default function ProgressTracking({ allStudents, exams, classes }) {
  var students = allStudents || [];
  var examList = exams || [];
  if (examList.length < 2) return (
    <Card><div style={{ textAlign: "center", padding: 30 }}>
      <p style={{ fontFamily: monoFont, fontSize: 12, color: colors.textMuted }}>progress tracking requires 2+ exams</p>
      <p style={{ fontFamily: monoFont, fontSize: 10, color: colors.textLight, marginTop: 4 }}>{examList.length} exam{examList.length === 1 ? "" : "s"} submitted</p>
    </div></Card>
  );
  var shortExam = function(n) { return (n || "").replace("Ujian Bulanan ", "UB ").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT"); };
  var examStats = examList.map(function(exam) {
    var es = students.filter(function(s) { return s.exam === exam; });
    var stats = computeStats(es);
    return { exam: exam, stats: stats, students: es };
  }).filter(function(e) { return e.stats !== null; });
  if (examStats.length < 2) return <Card><p style={{ fontFamily: monoFont, fontSize: 12, color: colors.textMuted, textAlign: "center", padding: 30 }}>need data from 2+ exams</p></Card>;

  var compTrends = ["Reading", "Listening", "Speaking", "Writing"].map(function(name) {
    return { name: name, data: examStats.map(function(e) { var c = e.stats && e.stats.components ? e.stats.components.find(function(x) { return x.name === name; }) : null; return { exam: shortExam(e.exam), avg: c ? c.avg : 0 }; }) };
  });
  var lastTwo = examStats.slice(-2);
  var bandMovement = (function() {
    if (lastTwo.length < 2) return [];
    var prevMap = {};
    lastTwo[0].students.forEach(function(s) { prevMap[String(s.ic || s.name || "").toLowerCase()] = s; });
    return lastTwo[1].students.map(function(s) {
      var key = String(s.ic || s.name || "").toLowerCase();
      var prev = prevMap[key]; if (!prev) return null;
      var pB = prev.band || "-", cB = s.band || "-"; if (pB === cB) return null;
      return { name: s.name, class: s.class, prevBand: pB, band: cB, prevOverall: Math.round(safeNum(prev.overall)), overall: Math.round(safeNum(s.overall)), diff: Math.round(safeNum(s.overall)) - Math.round(safeNum(prev.overall)) };
    }).filter(Boolean).sort(function(a, b) { return b.diff - a.diff; });
  })();

  return (
    <div>
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>Overall Average Trend</SectionTitle>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, padding: "0 8px" }}>
            {examStats.map(function(e, i) {
              var overall = e.stats ? e.stats.overall : 0;
              var h = (overall / 360) * 150;
              var prev = i > 0 && examStats[i - 1].stats ? examStats[i - 1].stats.overall : null;
              var change = prev !== null ? overall - prev : null;
              return (
                <div key={e.exam} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                  {change !== null && <span style={{ fontFamily: monoFont, fontSize: 10, fontWeight: 600, color: change >= 0 ? colors.accent : colors.band1, marginBottom: 2 }}>{change >= 0 ? "+" : ""}{change}</span>}
                  <span style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 700, color: colors.text, marginBottom: 4 }}>{overall}</span>
                  <div style={{ width: "100%", maxWidth: 44, height: h, background: colors.accent, borderRadius: "4px 4px 0 0", transition: "height 0.6s cubic-bezier(0.16,1,0.3,1)", opacity: 0.7 + (i / examStats.length) * 0.3 }} />
                  <span style={{ fontFamily: monoFont, fontSize: 9, color: colors.textMuted, marginTop: 6, fontWeight: 500 }}>{shortExam(e.exam)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </Reveal>
      <Reveal delay={0.1}>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>Component Trends</SectionTitle>
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <th style={Object.assign({}, thStyle, { textAlign: "left" })}>Component</th>
                {examStats.map(function(e) { return <th key={e.exam} style={thStyle}>{shortExam(e.exam)}</th>; })}
                <th style={thStyle}>Trend</th>
              </tr></thead>
              <tbody>
                {compTrends.map(function(ct) {
                  var first = ct.data[0] ? ct.data[0].avg : 0;
                  var last = ct.data[ct.data.length - 1] ? ct.data[ct.data.length - 1].avg : 0;
                  var diff = last - first;
                  return (
                    <tr key={ct.name}>
                      <td style={Object.assign({}, tdStyle, { textAlign: "left", fontWeight: 600 })}>{ct.name}</td>
                      {ct.data.map(function(d, i) { return <td key={i} style={Object.assign({}, tdStyle, { fontFamily: monoFont })}>{d.avg}</td>; })}
                      <td style={Object.assign({}, tdStyle, { fontWeight: 700, fontFamily: monoFont, color: diff >= 0 ? colors.accent : colors.band1 })}>
                        {diff >= 0 ? "\u2191" : "\u2193"} {Math.abs(diff)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </Reveal>
      {bandMovement.length > 0 && (
        <Reveal delay={0.2}>
          <Card>
            <SectionTitle>Band Movement ({shortExam(lastTwo[0].exam)} → {shortExam(lastTwo[1].exam)})</SectionTitle>
            <div style={{ overflow: "auto", maxHeight: 300 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  {["Name", "Class", "Before", "After", "+/-", "Band"].map(function(h) {
                    return <th key={h} style={Object.assign({}, thStyle, { textAlign: h === "Name" ? "left" : "center" })}>{h}</th>;
                  })}
                </tr></thead>
                <tbody>
                  {bandMovement.map(function(s, i) {
                    return (
                      <tr key={i}>
                        <td style={Object.assign({}, tdStyle, { textAlign: "left", fontWeight: 500 })}>{s.name}</td>
                        <td style={Object.assign({}, tdStyle, { color: colors.textMuted, fontSize: 11 })}>{s.class}</td>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont })}>{s.prevOverall}</td>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont, fontWeight: 700 })}>{s.overall}</td>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont, fontWeight: 600, color: s.diff >= 0 ? colors.accent : colors.band1 })}>{s.diff >= 0 ? "+" : ""}{s.diff}</td>
                        <td style={tdStyle}><span style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted }}>{s.prevBand}</span> → <BandBadge band={s.band} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Reveal>
      )}
      {bandMovement.length === 0 && (
        <Card><p style={{ fontFamily: monoFont, fontSize: 12, color: colors.textMuted, textAlign: "center", padding: 16 }}>no band changes between {shortExam(lastTwo[0].exam)} and {shortExam(lastTwo[1].exam)}</p></Card>
      )}
    </div>
  );
}
