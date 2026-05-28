// ============================================================
// ANALYSIS - INTERVENTION PAGE
// ============================================================
import { useState } from "react";
import { Card, SectionTitle, BandBadge, Bar, thStyle, tdStyle,
  colors, font, displayFont, getBand, getNextBandThreshold, computeInterventionGroups, computeStats } from "./shared.jsx";

export default function Intervention({ students, classes }) {
  const [simImprovement, setSimImprovement] = useState(10);

  const atRisk = students.filter(s => { const b = parseFloat(s.band); return b > 0 && b < 3; });
  const interventionGroups = computeInterventionGroups(atRisk);
  const stats = computeStats(students);

  // -- Target simulator: what if at-risk students improve by X marks in weakest component? --
  const simulate = () => {
    if (!stats) return null;
    const simStudents = students.map(s => {
      const b = parseFloat(s.band);
      if (b >= 3 || b <= 0) return s;
      const comps = [
        { name: "t1Score", val: s.t1Score || 0 },
        { name: "t2Score", val: s.t2Score || 0 },
        { name: "t3Score", val: s.t3Score || 0 },
        { name: "t4Score", val: s.t4Score || 0 },
      ].sort((a, b) => a.val - b.val);
      const improved = { ...s };
      improved[comps[0].name] = Math.min((improved[comps[0].name] || 0) + simImprovement, 90);
      improved.overall = (improved.t1Score || 0) + (improved.t2Score || 0) + (improved.t3Score || 0) + (improved.t4Score || 0);
      improved.band = getBand(Math.round(improved.overall)).band;
      return improved;
    });
    return computeStats(simStudents);
  };

  const simStats = simulate();
  const currentAtRisk = atRisk.length;
  const simAtRisk = simStats ? students.filter(s => {
    const b = parseFloat(s.band);
    if (b >= 3 || b <= 0) return false;
    return true;
  }).filter(s => {
    const comps = [
      { name: "t1Score", val: s.t1Score || 0 },
      { name: "t2Score", val: s.t2Score || 0 },
      { name: "t3Score", val: s.t3Score || 0 },
      { name: "t4Score", val: s.t4Score || 0 },
    ].sort((a, b) => a.val - b.val);
    const newWeakest = Math.min((s[comps[0].name] || 0) + simImprovement, 90);
    const newOverall = (s.t1Score || 0) + (s.t2Score || 0) + (s.t3Score || 0) + (s.t4Score || 0) - (s[comps[0].name] || 0) + newWeakest;
    const newBand = parseFloat(getBand(Math.round(newOverall)).band);
    return newBand < 3;
  }).length : currentAtRisk;

  return (
    <div>
      {/* Intervention groups by weakest component */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle>Intervention Groups by Weakest Component</SectionTitle>
        {atRisk.length === 0 ? (
          <p style={{ fontFamily: font, fontSize: 13, color: colors.accent, textAlign: "center", padding: 20 }}>
            No at-risk students (all Band 3+). Well done!
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {Object.entries(interventionGroups).map(([comp, group]) => (
              <div key={comp} style={{ borderRadius: 12, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
                <div style={{
                  padding: "10px 14px", background: group.length > 0 ? colors.errorBg : colors.warm,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: group.length > 0 ? colors.band1 : colors.accent }}>{comp}</span>
                  <span style={{ fontFamily: font, fontSize: 12, fontWeight: 600, color: colors.textMuted }}>{group.length} students</span>
                </div>
                {group.length > 0 && (
                  <div style={{ padding: 12, maxHeight: 200, overflowY: "auto" }}>
                    {group.sort((a, b) => (a[comp === "Reading" ? "t1Score" : comp === "Listening" ? "t2Score" : comp === "Speaking" ? "t3Score" : "t4Score"] || 0) - (b[comp === "Reading" ? "t1Score" : comp === "Listening" ? "t2Score" : comp === "Speaking" ? "t3Score" : "t4Score"] || 0)).map((s, i) => {
                      const scoreKey = comp === "Reading" ? "t1Score" : comp === "Listening" ? "t2Score" : comp === "Speaking" ? "t3Score" : "t4Score";
                      const next = getNextBandThreshold(s.overall);
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < group.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                          <div>
                            <p style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: colors.text, margin: 0 }}>{s.name}</p>
                            <p style={{ fontFamily: font, fontSize: 10, color: colors.textMuted, margin: 0 }}>
                              {comp}: {Math.round(s[scoreKey])}/90 {next ? ` \u00B7 Need +${next.needed} for Band ${next.band}` : ""}
                            </p>
                          </div>
                          <BandBadge band={s.band} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Target simulator */}
      {atRisk.length > 0 && (
        <Card>
          <SectionTitle>Target Simulator</SectionTitle>
          <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>
            What if at-risk students improve their weakest component by <strong style={{ color: colors.accent }}>{simImprovement}</strong> marks?
          </p>

          {/* Slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <span style={{ fontFamily: font, fontSize: 12, color: colors.textMuted }}>+5</span>
            <input type="range" min={5} max={30} step={5} value={simImprovement}
              onChange={(e) => setSimImprovement(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: colors.accent }}
            />
            <span style={{ fontFamily: font, fontSize: 12, color: colors.textMuted }}>+30</span>
          </div>

          {/* Simulation results */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1, textAlign: "center", padding: 16, borderRadius: 10, background: colors.errorBg }}>
              <p style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", margin: 0 }}>Current at-risk</p>
              <p style={{ fontFamily: displayFont, fontSize: 28, fontWeight: 700, color: colors.band1, margin: "4px 0" }}>{currentAtRisk}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ fontFamily: font, fontSize: 20, color: colors.textMuted }}>&rarr;</span>
            </div>
            <div style={{ flex: 1, textAlign: "center", padding: 16, borderRadius: 10, background: colors.accentLight }}>
              <p style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", margin: 0 }}>After +{simImprovement}</p>
              <p style={{ fontFamily: displayFont, fontSize: 28, fontWeight: 700, color: colors.accent, margin: "4px 0" }}>{simAtRisk}</p>
            </div>
            <div style={{ flex: 1, textAlign: "center", padding: 16, borderRadius: 10, background: colors.warm }}>
              <p style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", margin: 0 }}>Would move up</p>
              <p style={{ fontFamily: displayFont, fontSize: 28, fontWeight: 700, color: colors.accent, margin: "4px 0" }}>{currentAtRisk - simAtRisk}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
