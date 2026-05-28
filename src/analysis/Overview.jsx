// ============================================================
// ANALYSIS - OVERVIEW PAGE
// ============================================================
import { Card, SectionTitle, StatCard, BandBadge, Bar, thStyle, tdStyle,
  colors, font, displayFont, computeStats, computeInterventionGroups, computeGapAnalysis, bandColor, BAND_ORDER } from "./shared.jsx";

export default function Overview({ students, allStudents, classes }) {
  const stats = computeStats(students);
  if (!stats) return <p style={{ fontFamily: font, color: colors.textMuted, padding: 20, textAlign: "center" }}>No data available for this selection.</p>;

  const atRisk = students.filter(s => { const b = parseFloat(s.band); return b > 0 && b < 3; });
  const interventionGroups = computeInterventionGroups(atRisk);

  // -- Band distribution --
  const bandDist = {};
  students.forEach(s => { const b = s.band || "-"; bandDist[b] = (bandDist[b] || 0) + 1; });
  const bandData = BAND_ORDER.map(b => ({ band: b, count: bandDist[b] || 0 })).filter(b => b.count > 0);

  // -- Class comparison --
  const classStats = classes.map(cls => {
    const cs = students.filter(s => s.class === cls);
    if (cs.length === 0) return null;
    const st = computeStats(cs);
    return { class: cls, ...st };
  }).filter(Boolean);

  return (
    <div>
      {/* Stat cards row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <StatCard label="Total students" value={stats.total} />
        <StatCard label="Average score" value={stats.overall} sub={`Band ${stats.band.band}`} color={colors.accent} />
        <StatCard label="Weakest component" value={stats.weakest.name} sub={`${stats.weakest.avg}/90`} color={colors.band1} />
        <StatCard label="At risk (below Band 3)" value={atRisk.length} sub="students" color={atRisk.length > 0 ? colors.band1 : colors.accent} />
      </div>

      {/* Component averages + Band distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionTitle>Component Averages</SectionTitle>
          {stats.components.map(c => (
            <Bar key={c.name} label={c.name} value={c.avg} color={c.name === stats.weakest.name ? colors.band1 : c.color} />
          ))}
        </Card>

        <Card>
          <SectionTitle>Band Distribution</SectionTitle>
          {bandData.length === 0 ? (
            <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted }}>No data</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160, padding: "0 4px" }}>
              {bandData.map(b => {
                const maxCount = Math.max(...bandData.map(x => x.count), 1);
                const h = (b.count / maxCount) * 130;
                return (
                  <div key={b.band} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                    <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: colors.text, marginBottom: 4 }}>{b.count}</span>
                    <div style={{ width: "100%", maxWidth: 40, height: h, background: bandColor(b.band), borderRadius: "4px 4px 0 0", transition: "height 0.5s ease" }} />
                    <span style={{ fontFamily: font, fontSize: 9, color: colors.textMuted, marginTop: 4, fontWeight: 600 }}>{b.band}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Class comparison table */}
      {classStats.length > 1 && (
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>Class Comparison</SectionTitle>
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Class", "Students", "Avg Score", "Band", "Reading", "Listening", "Speaking", "Writing"].map(h => (
                    <th key={h} style={{ ...thStyle, textAlign: h === "Class" ? "left" : "center" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classStats.sort((a, b) => b.overall - a.overall).map(c => (
                  <tr key={c.class}>
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

      {/* Intervention groups summary */}
      {atRisk.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>Intervention Groups (Below Band 3)</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            {Object.entries(interventionGroups).map(([comp, group]) => (
              <div key={comp} style={{ textAlign: "center", padding: 12, borderRadius: 10, background: group.length > 0 ? colors.errorBg : colors.warm }}>
                <p style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", marginBottom: 4 }}>{comp}</p>
                <p style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 700, color: group.length > 0 ? colors.band1 : colors.accent }}>{group.length}</p>
                <p style={{ fontFamily: font, fontSize: 10, color: colors.textMuted }}>students</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* At-risk students table */}
      {atRisk.length > 0 && (
        <Card>
          <SectionTitle>Students Below Band 3 ({atRisk.length})</SectionTitle>
          <div style={{ overflow: "auto", maxHeight: 350 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Name", "Class", "Overall", "Band", "Reading", "Listening", "Speaking", "Writing"].map(h => (
                    <th key={h} style={{ ...thStyle, textAlign: h === "Name" ? "left" : "center", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {atRisk.sort((a, b) => (a.overall || 0) - (b.overall || 0)).map((s, i) => {
                  const comps = [
                    { name: "R", val: s.t1Score }, { name: "L", val: s.t2Score },
                    { name: "S", val: s.t3Score }, { name: "W", val: s.t4Score },
                  ];
                  const weakComp = [...comps].sort((a, b) => a.val - b.val)[0].name;
                  return (
                    <tr key={i}>
                      <td style={{ ...tdStyle, textAlign: "left", fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</td>
                      <td style={{ ...tdStyle, color: colors.textMuted, fontSize: 11 }}>{s.class}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{Math.round(s.overall)}</td>
                      <td style={tdStyle}><BandBadge band={s.band} /></td>
                      <td style={{ ...tdStyle, background: weakComp === "R" ? "#FEE2E2" : "transparent" }}>{Math.round(s.t1Score)}</td>
                      <td style={{ ...tdStyle, background: weakComp === "L" ? "#FEE2E2" : "transparent" }}>{Math.round(s.t2Score)}</td>
                      <td style={{ ...tdStyle, background: weakComp === "S" ? "#FEE2E2" : "transparent" }}>{Math.round(s.t3Score)}</td>
                      <td style={{ ...tdStyle, background: weakComp === "W" ? "#FEE2E2" : "transparent" }}>{Math.round(s.t4Score)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
