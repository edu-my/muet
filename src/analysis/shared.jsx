// ============================================================
// SHARED DESIGN SYSTEM - Oberon-inspired editorial style
// ============================================================
import { Component, useEffect, useRef, useState } from "react";

// -- Typography --
export const font = `'Inter', 'DM Sans', system-ui, sans-serif`;
export const displayFont = `'Playfair Display', Georgia, serif`;
export const monoFont = `'JetBrains Mono', 'SF Mono', 'Fira Code', monospace`;

// -- Colors (warm light, structured) --
export const colors = {
  bg: "#F4F1EC",
  card: "#FFFFFF",
  cardAlt: "#FAF8F5",
  accent: "#2D6A4F",
  accentLight: "#D8F3DC",
  accentMuted: "rgba(45,106,79,0.08)",
  accentDark: "#1B4332",
  text: "#1A1A1A",
  textMuted: "#8A8A8A",
  textLight: "#B0ADA8",
  border: "#E2DED8",
  borderLight: "#EDEAE5",
  warm: "#F0ECE6",
  error: "#C53030",
  errorBg: "#FFF5F5",
  band5: "#2D6A4F", band4: "#40916C", band3: "#52B788", band2: "#D69E2E", band1: "#C53030",
  reading: "#2D6A4F", listening: "#40916C", speaking: "#52B788", writing: "#95D5B2",
};

// -- Band logic --
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
export const NATIONAL_BENCHMARK = { "5+": 1, "5.0": 3, "4.5": 8, "4.0": 15, "3.5": 22, "3.0": 24, "2.5": 16, "2.0": 8, "1.0": 3 };

export const getBand = (score) => {
  if (!score || score <= 0) return { band: "-", cefr: "-" };
  for (const row of BAND_TABLE) { if (score >= row.min && score <= row.max) return row; }
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
export const safeNum = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };

// -- Stats --
export const computeStats = (students) => {
  if (!students || students.length === 0) return null;
  const n = students.length;
  const avg = (key) => Math.round(students.reduce((s, x) => s + safeNum(x[key]), 0) / n);
  const overall = avg("overall");
  const components = [
    { name: "Reading", key: "t1Score", avg: avg("t1Score"), color: colors.reading },
    { name: "Listening", key: "t2Score", avg: avg("t2Score"), color: colors.listening },
    { name: "Speaking", key: "t3Score", avg: avg("t3Score"), color: colors.speaking },
    { name: "Writing", key: "t4Score", avg: avg("t4Score"), color: colors.writing },
  ];
  const weakest = [...components].sort((a, b) => a.avg - b.avg)[0];
  const strongest = [...components].sort((a, b) => b.avg - a.avg)[0];
  return { total: n, overall, band: getBand(overall), components, weakest, strongest };
};
export const computeInterventionGroups = (atRisk) => {
  const groups = { Reading: [], Listening: [], Speaking: [], Writing: [] };
  if (!atRisk) return groups;
  atRisk.forEach(s => {
    const comps = [
      { name: "Reading", val: safeNum(s.t1Score) }, { name: "Listening", val: safeNum(s.t2Score) },
      { name: "Speaking", val: safeNum(s.t3Score) }, { name: "Writing", val: safeNum(s.t4Score) },
    ].sort((a, b) => a.val - b.val);
    groups[comps[0].name].push(s);
  });
  return groups;
};
export const computeGapAnalysis = (students) => {
  if (!students) return [];
  return students.map(s => {
    const next = getNextBandThreshold(s.overall);
    const comps = [
      { name: "Reading", val: safeNum(s.t1Score) }, { name: "Listening", val: safeNum(s.t2Score) },
      { name: "Speaking", val: safeNum(s.t3Score) }, { name: "Writing", val: safeNum(s.t4Score) },
    ].sort((a, b) => a.val - b.val);
    return { ...s, nextBand: next, weakestComp: comps[0].name, weakestScore: comps[0].val };
  });
};

// -- Scroll animation hook --
export const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
};

// -- Reveal wrapper component --
export const Reveal = ({ children, delay = 0, style = {} }) => {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      ...style,
    }}>{children}</div>
  );
};

// -- Section number label --
export const SectionNum = ({ num, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
    <span style={{ fontFamily: monoFont, fontSize: 11, fontWeight: 500, color: colors.accent, letterSpacing: "0.02em" }}>{num}</span>
    <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
  </div>
);

// -- Table styles --
export const thStyle = {
  padding: "10px 12px", fontFamily: font, fontSize: 10, fontWeight: 600,
  color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em",
  borderBottom: `1px solid ${colors.border}`, textAlign: "center", background: colors.cardAlt,
};
export const tdStyle = {
  padding: "10px 12px", fontFamily: font, fontSize: 12, textAlign: "center",
  borderBottom: `1px solid ${colors.borderLight}`, color: colors.text,
};

// -- UI Components --
export const Card = ({ children, style = {} }) => (
  <div style={{
    background: colors.card, borderRadius: 12, padding: "20px 22px",
    border: `1px solid ${colors.border}`, ...style,
  }}>{children}</div>
);

export const SectionTitle = ({ children }) => (
  <h3 style={{
    fontFamily: font, fontSize: 11, fontWeight: 600, color: colors.textMuted,
    marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.1em",
  }}>{children}</h3>
);

export const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    textAlign: "center", background: colors.card, borderRadius: 10,
    padding: "14px 10px", border: `1px solid ${colors.border}`,
  }}>
    <p style={{ fontFamily: font, fontSize: 9, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
    <p style={{ fontFamily: displayFont, fontSize: 24, fontWeight: 700, color: color || colors.text, margin: "4px 0 0", lineHeight: 1.1 }}>{value}</p>
    {sub && <p style={{ fontFamily: monoFont, fontSize: 10, color: colors.textLight, margin: "2px 0 0" }}>{sub}</p>}
  </div>
);

export const BandBadge = ({ band }) => {
  const b = parseFloat(band);
  let bg = colors.borderLight, fg = colors.textMuted;
  if (b >= 5) { bg = colors.accentMuted; fg = colors.band5; }
  else if (b >= 4) { bg = colors.accentMuted; fg = colors.band4; }
  else if (b >= 3) { bg = "rgba(82,183,136,0.1)"; fg = colors.band3; }
  else if (b >= 2) { bg = "rgba(214,158,46,0.1)"; fg = colors.band2; }
  else if (b >= 1) { bg = "rgba(197,48,48,0.1)"; fg = colors.band1; }
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, fontFamily: monoFont, background: bg, color: fg }}>{band || "-"}</span>;
};

export const Bar = ({ value, max = 90, color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
    <p style={{ fontFamily: font, fontSize: 11, fontWeight: 500, color: colors.text, width: 65, textAlign: "right", margin: 0 }}>{label}</p>
    <div style={{ flex: 1, height: 20, background: colors.warm, borderRadius: 4, overflow: "hidden", position: "relative" }}>
      <div style={{ width: `${(safeNum(value) / max) * 100}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
    </div>
    <span style={{ fontFamily: monoFont, fontSize: 11, fontWeight: 500, color: colors.text, width: 28, textAlign: "right" }}>{safeNum(value)}</span>
    <span style={{ fontFamily: monoFont, fontSize: 9, color: colors.textLight, width: 20 }}>/{max}</span>
  </div>
);

// -- Global CSS for animations --
export const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: ${colors.bg}; -webkit-font-smoothing: antialiased; }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    ::selection { background: ${colors.accentLight}; color: ${colors.accentDark}; }
  `}</style>
);

// -- Error boundary --
export class PageErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: colors.error, marginBottom: 8 }}>Something went wrong</p>
          <p style={{ fontFamily: monoFont, fontSize: 11, color: colors.textMuted, marginBottom: 16 }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            style={{ fontFamily: font, fontSize: 11, fontWeight: 500, color: colors.accent, background: "none", border: `1px solid ${colors.accent}`, borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}>Try Again</button>
        </Card>
      );
    }
    return this.props.children;
  }
}
