import { useState } from "react";
import { Card, SectionTitle, Reveal, thStyle, tdStyle,
  colors, font, monoFont, displayFont, getBand, getNextBandThreshold, computeInterventionGroups, computeStats, safeNum } from "./shared.jsx";

export default function Intervention({ students, classes }) {
  var [simBoost, setSimBoost] = useState(15);
  var st = students || [];
  var atRisk = st.filter(function(s) { var b = parseFloat(s.band); return b > 0 && b < 3; });
  var groups = computeInterventionGroups(atRisk);

  var simulated = atRisk.map(function(s) {
    var comps = [{ n: "R", v: safeNum(s.t1Score) }, { n: "L", v: safeNum(s.t2Score) }, { n: "S", v: safeNum(s.t3Score) }, { n: "W", v: safeNum(s.t4Score) }].sort(function(a, b) { return a.v - b.v; });
    var boosted = safeNum(s.overall) + simBoost;
    return { name: s.name, current: safeNum(s.overall), simulated: boosted, currentBand: s.band, simBand: getBand(boosted).band, weak: comps[0].n };
  });
  var improved = simulated.filter(function(s) { return parseFloat(s.simBand) >= 3 && parseFloat(s.currentBand) < 3; }).length;

  return (
    <div>
      <Reveal>
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>Intervention Groups (Below Band 3)</SectionTitle>
          {atRisk.length === 0 ? <p style={{ fontFamily: monoFont, fontSize: 12, color: colors.textMuted, textAlign: "center", padding: 16 }}>no at-risk students</p> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {Object.entries(groups).map(function(entry) {
                var comp = entry[0], group = entry[1];
                return (
                  <div key={comp} style={{ textAlign: "center", padding: 12, borderRadius: 8, background: group.length > 0 ? colors.errorBg : colors.cardAlt, border: "1px solid " + colors.borderLight }}>
                    <p style={{ fontFamily: monoFont, fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{comp}</p>
                    <p style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 700, color: group.length > 0 ? colors.band1 : colors.accent, margin: "4px 0 0" }}>{group.length}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Reveal>
      {atRisk.length > 0 && (
        <Reveal delay={0.1}>
          <Card style={{ marginBottom: 16 }}>
            <SectionTitle>Target Simulator</SectionTitle>
            <p style={{ fontFamily: font, fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>If each at-risk student improved by <strong>{simBoost}</strong> marks overall:</p>
            <input type="range" min="5" max="50" step="5" value={simBoost} onChange={function(e) { setSimBoost(Number(e.target.value)); }}
              style={{ width: "100%", marginBottom: 12 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ textAlign: "center", padding: 14, borderRadius: 8, background: colors.cardAlt, border: "1px solid " + colors.borderLight }}>
                <p style={{ fontFamily: monoFont, fontSize: 9, color: colors.textMuted, textTransform: "uppercase", margin: 0 }}>current at-risk</p>
                <p style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 700, color: colors.band1, margin: "4px 0 0" }}>{atRisk.length}</p>
              </div>
              <div style={{ textAlign: "center", padding: 14, borderRadius: 8, background: colors.accentMuted, border: "1px solid " + colors.borderLight }}>
                <p style={{ fontFamily: monoFont, fontSize: 9, color: colors.textMuted, textTransform: "uppercase", margin: 0 }}>would reach band 3+</p>
                <p style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 700, color: colors.accent, margin: "4px 0 0" }}>{improved}</p>
              </div>
            </div>
          </Card>
        </Reveal>
      )}
      {atRisk.length > 0 && (
        <Reveal delay={0.2}>
          <Card>
            <SectionTitle>At-Risk Details</SectionTitle>
            <div style={{ overflow: "auto", maxHeight: 350 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  {["Name", "Class", "Score", "Band", "Weakest", "Gap"].map(function(h) {
                    return <th key={h} style={Object.assign({}, thStyle, { textAlign: h === "Name" ? "left" : "center" })}>{h}</th>;
                  })}
                </tr></thead>
                <tbody>
                  {atRisk.sort(function(a, b) { return safeNum(a.overall) - safeNum(b.overall); }).map(function(s, i) {
                    var comps = [{ n: "Reading", v: safeNum(s.t1Score) }, { n: "Listening", v: safeNum(s.t2Score) }, { n: "Speaking", v: safeNum(s.t3Score) }, { n: "Writing", v: safeNum(s.t4Score) }].sort(function(a, b) { return a.v - b.v; });
                    var next = getNextBandThreshold(safeNum(s.overall));
                    return (
                      <tr key={i}>
                        <td style={Object.assign({}, tdStyle, { textAlign: "left", fontWeight: 500 })}>{s.name}</td>
                        <td style={Object.assign({}, tdStyle, { color: colors.textMuted, fontSize: 11 })}>{s.class}</td>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont, fontWeight: 700 })}>{Math.round(safeNum(s.overall))}</td>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont })}>{s.band}</td>
                        <td style={Object.assign({}, tdStyle, { fontSize: 11 })}>{comps[0].n} ({comps[0].v})</td>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont, color: colors.accent })}>{next ? "+" + next.needed : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
