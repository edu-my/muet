// ============================================================
// ANALYSIS MODULE - SHARED UTILITIES, STYLES, COMPONENTS
// ============================================================
import { useRef, useEffect } from "react";

// -- Design tokens (match MUETMarks.jsx) --
export const font = `'DM Sans', sans-serif`;
export const displayFont = `'Playfair Display', serif`;
export const colors = {
  bg: "#FAFAF7", card: "#FFFFFF",
  accent: "#2D6A4F", accentLight: "#D8F3DC", accentDark: "#1B4332",
  text: "#1A1A1A", textMuted: "#6B7280",
  border: "#E8E5E0", warm: "#F5F0EB",
  error: "#DC2626", errorBg: "#FEF2F2",
  band5: "#2D6A4F", band4: "#40916C", band3: "#52B788", band2: "#F59E0B", band1: "#EF4444",
  reading: "#2D6A4F", listening: "#40916C", speaking: "#52B788", writing: "#95D5B2",
};

// -- Band logic (same as MUETMarks.jsx) --
export const BAND_TABLE = [
  { min: 331, max: 360, band: "5+", cefr: "C2" },
  { min: 294, max: 330, band: "5.0", cefr: "C1" },
  { min: 258, max: 293, band: "4.5", cefr: "B2" },
  { min: 211, max: 257, band: "4.0", cefr: "B2" },
  { min: 164, max: 210, band: "3.5", cefr: "B1" },
  { min: 123, max: 163, band: "3.0", cefr: "B1" },
  { min: 82, max: 122, band: "2.5", cefr: "A2" },
  { min: 36, max: 81, band: "2.0", cefr: "A2" },
  { min: 1, max: 35, band: "1.0", cefr: "A1" },
];

export const BAND_ORDER = ["5+", "5.0", "4.5", "4.0", "3.5", "3.0", "2.5", "2.0", "1.0"];

export const NATIONAL_BENCHMARK = {
  "5+": 1, "5.0": 3, "4.5": 8, "4.0": 15, "3.5": 22, "3.0": 24, "2.5": 16, "2.0": 8, "1.0": 3,
};

export const getBand = (score) => {
  if (!score || score <= 0) return { band: "-", cefr: "-" };
  for (const row of BAND_TABLE) {
    if (score >= row.min && score <= row.max) return row;
  }
  return { band: "-", cefr: "-" };
};

export const getNextBandThreshold = (score) => {
  if (!score || score <= 0) return null;
  for (let i = BAND_TABLE.length - 1; i >= 0; i--) {
    if (BAND_TABLE[i].min > score) return { band: BAND_TABLE[i].band, needed: BAND_TABLE[i].min - score };
  }
  return null;
};

export const bandColor = (band) => {
  const b = parseFloat(band);
  if (b >= 5) return colors.band5;
  if (b >= 4) return colors.band4;
  if (b >= 3) return colors.band3;
  if (b >= 2) return colors.band2;
  if (b >= 1) return colors.band1;
  return colors.textMuted;
};

// -- Stats computation --
export const computeStats = (students) => {
  const n = students.length;
  if (n === 0) return null;
  const avg = (key) => Math.round(students.reduce((s, x) => s + (x[key] || 0), 0) / n);
  const overall = avg("overall");
  const components = [
    { name: "Reading", key: "t1Score", avg: avg("t1Score"), color: colors.reading },
    { name: "Listening", key: "t2Score", avg: avg("t2Score"), color: colors.listening },
    { name: "Speaking", key: "t3Score", avg: avg("t3Score"), color: colors.speaking },
    { name: "Writing", key: "t4Score", avg: avg("t4Score"), color: colors.writing },
  ];
  const weakest = [...components].sort((a, b) => a.avg - b.avg)[0];
  const strongest = [...components].sort((a, b) => b.avg - a.avg)[0];
  const bandInfo = getBand(overall);
  return { total: n, overall, band: bandInfo, components, weakest, strongest };
};

export const computeInterventionGroups = (atRiskStudents) => {
  const groups = { Reading: [], Listening: [], Speaking: [], Writing: [] };
  atRiskStudents.forEach(s => {
    const comps = [
      { name: "Reading", val: s.t1Score || 0 },
      { name: "Listening", val: s.t2Score || 0 },
      { name: "Speaking", val: s.t3Score || 0 },
      { name: "Writing", val: s.t4Score || 0 },
    ].sort((a, b) => a.val - b.val);
    groups[comps[0].name].push(s);
  });
  return groups;
};

export const computeGapAnalysis = (students) => {
  return students.map(s => {
    const next = getNextBandThreshold(s.overall);
    const comps = [
      { name: "Reading", val: s.t1Score || 0 },
      { name: "Listening", val: s.t2Score || 0 },
      { name: "Speaking", val: s.t3Score || 0 },
      { name: "Writing", val: s.t4Score || 0 },
    ].sort((a, b) => a.val - b.val);
    return { ...s, nextBand: next, weakestComp: comps[0].name, weakestScore: comps[0].val };
  });
};

// -- Shared table styles --
export const thStyle = {
  padding: "8px 10px", fontFamily: font, fontSize: 10, fontWeight: 700,
  color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.04em",
  borderBottom: `2px solid ${colors.border}`, textAlign: "center",
};

export const tdStyle = {
  padding: "8px 10px", fontFamily: font, fontSize: 12, textAlign: "center",
  borderBottom: `1px solid ${colors.border}`,
};

// -- Shared UI components --
export const Card = ({ children, style = {} }) => (
  <div style={{
    background: colors.card, borderRadius: 14, padding: "20px 22px",
    border: `1px solid ${colors.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", ...style,
  }}>{children}</div>
);

export const SectionTitle = ({ children }) => (
  <h3 style={{
    fontFamily: font, fontSize: 13, fontWeight: 700, color: colors.text,
    marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.04em",
  }}>{children}</h3>
);

export const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    flex: "1 1 140px", textAlign: "center", background: colors.card,
    borderRadius: 12, padding: "16px 14px", border: `1px solid ${colors.border}`,
  }}>
    <p style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{label}</p>
    <p style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 700, color: color || colors.text, margin: "4px 0 0" }}>{value}</p>
    {sub && <p style={{ fontFamily: font, fontSize: 11, color: colors.textMuted, margin: "2px 0 0" }}>{sub}</p>}
  </div>
);

export const BandBadge = ({ band }) => {
  let bg = colors.border, fg = colors.textMuted;
  const b = parseFloat(band);
  if (b >= 5) { bg = "#D1FAE5"; fg = colors.band5; }
  else if (b >= 4) { bg = "#D1FAE5"; fg = colors.band4; }
  else if (b >= 3) { bg = "#ECFDF5"; fg = colors.band3; }
  else if (b >= 2) { bg = "#FEF3C7"; fg = colors.band2; }
  else if (b >= 1) { bg = "#FEE2E2"; fg = colors.band1; }
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: font, background: bg, color: fg }}>{band}</span>;
};

export const Bar = ({ value, max = 90, color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
    <p style={{ fontFamily: font, fontSize: 12, fontWeight: 500, color: colors.text, width: 70, textAlign: "right" }}>{label}</p>
    <div style={{ flex: 1, height: 24, background: "#F0F0EC", borderRadius: 6, overflow: "hidden", position: "relative" }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.6s ease" }} />
      <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: font, fontSize: 11, fontWeight: 600, color: value > max * 0.6 ? "#fff" : colors.text }}>{value}</span>
    </div>
    <p style={{ fontFamily: font, fontSize: 10, color: colors.textMuted, width: 30 }}>/{max}</p>
  </div>
);
