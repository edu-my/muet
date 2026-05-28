// ============================================================
// ANALYSIS - PROGRESS TRACKING PAGE
// ============================================================
import { Card, SectionTitle, BandBadge, StatCard, thStyle, tdStyle,
  colors, font, displayFont, computeStats, getBand, bandColor } from "./shared.jsx";

export default function ProgressTracking({ allStudents, exams, classes }) {
  if (exams.length < 2) {
    return (
      <Card>
        <p style={{ fontFamily: font, fontSize: 14, color: colors.textMuted, textAlign: "center", padding: 30 }}>
          Progress tracking requires at least 2 exams. Currently only {exams.length} exam{exams.length === 1 ? "" : "s"} submitted.
        </p>
      </Card>
    );
  }

  // -- Stats per exam --
  const examStats = exams.map(exam => {
    const students = allStudents.filter(s => s.exam === exam);
    const stats = computeStats(students);
    return { exam, stats, students };
  }).filter(e => e.stats);

  if (examStats.length < 2) {
    return (
      <Card>
        <p style={{ fontFamily: font, fontSize: 14, color: colors.textMuted, textAlign: "center", padding: 30 }}>
          Need data from at least 2 exams to show progress.
        </p>
      </Card>
    );
  }

  // -- Exam-over-exam trend bars --
  const maxOverall = 360;

  // -- Component trends --
  const compTrends = ["Reading", "Listening", "Speaking", "Writing"].map(name => {
    const key = name === "Reading" ? "t1Score" : name === "Listening" ? "t2Score" : name === "Speaking" ? "t3Score" : "t4Score";
    return {
      name,
      data: examStats.map(e => ({
        exam: e.exam.replace("Ujian Bulanan ", "UB").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT"),
        avg: e.stats.components.find(c => c.name === name)?.avg || 0,
      })),
    };
  });

  // -- Band movement: students who changed bands between last two exams --
  const lastTwo = examStats.slice(-2);
  const bandMovement = (() => {
    if (lastTwo.length < 2) return [];
    const prevMap = {};
    lastTwo[0].students.forEach(s => { prevMap[(s.ic || s.name).toLowerCase()] = s; });
    return lastTwo[1].students.map(s => {
      const key = (s.ic || s.name).toLowerCase();
      const prev = prevMap[key];
      if (!prev) return null;
      const prevBand = prev.band;
      const currBand = s.band;
      if (prevBand === currBand) return null;
      return {
        name: s.name, class: s.class,
        prevBand, band: currBand,
        prevOverall: Math.round(prev.overall), overall: Math.round(s.overall),
        diff: Math.round(s.overall) - Math.round(prev.overall),
      };
    }).filter(Boolean).sort((a, b) => b.diff - a.diff);
  })();

  return (
    <div>
      {/* Overall trend across exams */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Overall Average Trend</SectionTitle>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 200, padding: "0 8px" }}>
          {examStats.map((e, i) => {
            const h = (e.stats.overall / maxOverall) * 170;
            const prev = i > 0 ? examStats[i - 1].stats.overall : null;
            const change = prev !== null ? e.stats.overall - prev : null;
            const shortName = e.exam.replace("Ujian Bulanan ", "UB").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT");
            return (
              <div key={e.exam} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                {change !== null && (
                  <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: change >= 0 ? colors.accent : colors.band1, marginBottom: 2 }}>
                    {change >= 0 ? "+" : ""}{change}
                  </span>
                )}
                <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: colors.text, marginBottom: 4 }}>{e.stats.overall}</span>
                <div style={{ width: "100%", maxWidth: 50, height: h, background: colors.accent, borderRadius: "6px 6px 0 0", transition: "height 0.5s ease", opacity: 0.7 + (i / examStats.length) * 0.3 }} />
                <span style={{ fontFamily: font, fontSize: 9, color: colors.textMuted, marginTop: 6, fontWeight: 600, textAlign: "center" }}>{shortName}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Component trends */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Component Trends Across Exams</SectionTitle>
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left" }}>Component</th>
                {examStats.map(e => (
                  <th key={e.exam} style={thStyle}>
                    {e.exam.replace("Ujian Bulanan ", "UB").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT")}
                  </th>
                ))}
                <th style={thStyle}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {compTrends.map(ct => {
                const first = ct.data[0]?.avg || 0;
                const last = ct.data[ct.data.length - 1]?.avg || 0;
                const diff = last - first;
                return (
                  <tr key={ct.name}>
                    <td style={{ ...tdStyle, textAlign: "left", fontWeight: 600 }}>{ct.name}</td>
                    {ct.data.map((d, i) => (
                      <td key={i} style={tdStyle}>{d.avg}</td>
                    ))}
                    <td style={{ ...tdStyle, fontWeight: 700, color: diff >= 0 ? colors.accent : colors.band1 }}>
                      {diff >= 0 ? "\u2191" : "\u2193"} {Math.abs(diff)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Band movement between last two exams */}
      {bandMovement.length > 0 && (
        <Card>
          <SectionTitle>
            Band Movement ({lastTwo[0].exam.replace("Ujian Bulanan ", "UB").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT")} → {lastTwo[1].exam.replace("Ujian Bulanan ", "UB").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT")})
          </SectionTitle>
          <div style={{ overflow: "auto", maxHeight: 350 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Name", "Class", "Previous", "Current", "Score Change", "Band Change"].map(h => (
                    <th key={h} style={{ ...thStyle, textAlign: h === "Name" ? "left" : "center" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bandMovement.map((s, i) => (
                  <tr key={i}>
                    <td style={{ ...tdStyle, textAlign: "left", fontWeight: 500 }}>{s.name}</td>
                    <td style={{ ...tdStyle, color: colors.textMuted, fontSize: 11 }}>{s.class}</td>
                    <td style={tdStyle}>{s.prevOverall}</td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{s.overall}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: s.diff >= 0 ? colors.accent : colors.band1 }}>
                      {s.diff >= 0 ? "+" : ""}{s.diff}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: colors.textMuted, fontSize: 10 }}>{s.prevBand} </span>
                      <span style={{ fontSize: 10 }}>&rarr; </span>
                      <BandBadge band={s.band} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
