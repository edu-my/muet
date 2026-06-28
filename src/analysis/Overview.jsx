// ============================================================
// ANALYSIS - OVERVIEW PAGE
// ============================================================
import { Card, SectionTitle, StatCard, BandBadge, Bar, thStyle, tdStyle,
  colors, font, displayFont, computeStats, computeInterventionGroups, computeGapAnalysis, bandColor, BAND_ORDER, safeNum } from "./shared.jsx";

export default function Overview({ students, allStudents, classes }) {
  var stats = computeStats(students);
  if (!stats) return <p style={{ fontFamily: font, color: colors.textMuted, padding: 20, textAlign: "center" }}>No data available for this selection.</p>;

  var atRisk = students.filter(function(s) { var b = parseFloat(s.band); return b > 0 && b < 3; });
  var interventionGroups = computeInterventionGroups(atRisk);

  var bandDist = {};
  students.forEach(function(s) { var b = s.band || "-"; bandDist[b] = (bandDist[b] || 0) + 1; });
  var bandData = BAND_ORDER.map(function(b) { return { band: b, count: bandDist[b] || 0 }; }).filter(function(b) { return b.count > 0; });

  var classStats = classes.map(function(cls) {
    var cs = students.filter(function(s) { return s.class === cls; });
    if (cs.length === 0) return null;
    var st = computeStats(cs);
    return Object.assign({ class: cls }, st);
  }).filter(Boolean);

  return (
    <div>
      {/* Stat cards - 4 across */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        <StatCard label="Total students" value={stats.total} />
        <StatCard label="Average score" value={stats.overall} sub={"Band " + stats.band.band} color={colors.accent} />
        <StatCard label="Weakest component" value={stats.weakest.name} sub={stats.weakest.avg + "/90"} color={colors.band1} />
        <StatCard label="At risk (below Band 3)" value={atRisk.length} sub="students" color={atRisk.length > 0 ? colors.band1 : colors.accent} />
      </div>

      {/* Component averages + Band distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <Card>
          <SectionTitle>Component Averages</SectionTitle>
          {stats.components.map(function(c) {
            return <Bar key={c.name} label={c.name} value={c.avg} color={c.name === stats.weakest.name ? colors.band1 : c.color} />;
          })}
        </Card>

        <Card>
          <SectionTitle>Band Distribution</SectionTitle>
          {bandData.length === 0 ? (
            <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted }}>No data</p>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, padding: "0 4px" }}>
              {bandData.map(function(b) {
                var maxCount = Math.max.apply(null, bandData.map(function(x) { return x.count; }).concat([1]));
                var h = (b.count / maxCount) * 110;
                return (
                  <div key={b.band} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                    <span style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: colors.text, marginBottom: 3 }}>{b.count}</span>
                    <div style={{ width: "100%", maxWidth: 48, height: h, background: bandColor(b.band), borderRadius: "4px 4px 0 0", transition: "height 0.5s ease" }} />
                    <span style={{ fontFamily: font, fontSize: 9, color: colors.textMuted, marginTop: 3, fontWeight: 600 }}>{b.band}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Class comparison */}
      {classStats.length > 1 && (
        <Card style={{ marginBottom: 14 }}>
          <SectionTitle>Class Comparison</SectionTitle>
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Class", "Students", "Avg Score", "Band", "Reading", "Listening", "Speaking", "Writing"].map(function(h) {
                    return <th key={h} style={Object.assign({}, thStyle, { textAlign: h === "Class" ? "left" : "center" })}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {classStats.sort(function(a, b) { return b.overall - a.overall; }).map(function(c) {
                  return (
                    <tr key={c.class}>
                      <td style={Object.assign({}, tdStyle, { textAlign: "left", fontWeight: 600 })}>{c.class}</td>
                      <td style={Object.assign({}, tdStyle, { color: colors.textMuted })}>{c.total}</td>
                      <td style={Object.assign({}, tdStyle, { fontWeight: 700, color: colors.accent })}>{c.overall}</td>
                      <td style={tdStyle}><BandBadge band={c.band.band} /></td>
                      {c.components.map(function(comp) {
                        return <td key={comp.name} style={tdStyle}>{comp.avg}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Intervention groups */}
      {atRisk.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <SectionTitle>Intervention Groups (Below Band 3)</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
            {Object.entries(interventionGroups).map(function(entry) {
              var comp = entry[0], group = entry[1];
              return (
                <div key={comp} style={{ textAlign: "center", padding: 10, borderRadius: 8, background: group.length > 0 ? colors.errorBg : colors.warm }}>
                  <p style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", marginBottom: 2 }}>{comp}</p>
                  <p style={{ fontFamily: displayFont, fontSize: 20, fontWeight: 700, color: group.length > 0 ? colors.band1 : colors.accent }}>{group.length}</p>
                  <p style={{ fontFamily: font, fontSize: 9, color: colors.textMuted }}>students</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* At-risk students */}
      {atRisk.length > 0 && (
        <Card>
          <SectionTitle>Students Below Band 3 ({atRisk.length})</SectionTitle>
          <div style={{ overflow: "auto", maxHeight: 350 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Name", "Class", "Overall", "Band", "Reading", "Listening", "Speaking", "Writing"].map(function(h) {
                    return <th key={h} style={Object.assign({}, thStyle, { textAlign: h === "Name" ? "left" : "center", whiteSpace: "nowrap" })}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {atRisk.sort(function(a, b) { return (a.overall || 0) - (b.overall || 0); }).map(function(s, i) {
                  var comps = [
                    { n: "R", v: s.t1Score }, { n: "L", v: s.t2Score },
                    { n: "S", v: s.t3Score }, { n: "W", v: s.t4Score },
                  ];
                  var weak = comps.slice().sort(function(a, b) { return a.v - b.v; })[0].n;
                  return (
                    <tr key={i}>
                      <td style={Object.assign({}, tdStyle, { textAlign: "left", fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{s.name}</td>
                      <td style={Object.assign({}, tdStyle, { color: colors.textMuted, fontSize: 11 })}>{s.class}</td>
                      <td style={Object.assign({}, tdStyle, { fontWeight: 700 })}>{Math.round(s.overall)}</td>
                      <td style={tdStyle}><BandBadge band={s.band} /></td>
                      <td style={Object.assign({}, tdStyle, { background: weak === "R" ? "#FEE2E2" : "transparent" })}>{Math.round(s.t1Score)}</td>
                      <td style={Object.assign({}, tdStyle, { background: weak === "L" ? "#FEE2E2" : "transparent" })}>{Math.round(s.t2Score)}</td>
                      <td style={Object.assign({}, tdStyle, { background: weak === "S" ? "#FEE2E2" : "transparent" })}>{Math.round(s.t3Score)}</td>
                      <td style={Object.assign({}, tdStyle, { background: weak === "W" ? "#FEE2E2" : "transparent" })}>{Math.round(s.t4Score)}</td>
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
