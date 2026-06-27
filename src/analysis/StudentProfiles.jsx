import { useState, useMemo } from "react";
import { Card, SectionTitle, BandBadge, Bar, StatCard, Reveal, thStyle, tdStyle,
  colors, font, monoFont, displayFont, getBand, getNextBandThreshold, computeStats, bandColor, safeNum } from "./shared.jsx";
var str = function(v) { return v == null ? "" : String(v); };

export default function StudentProfiles({ allStudents, exams, classes }) {
  var [selectedClass, setSelectedClass] = useState("");
  var [selectedExam, setSelectedExam] = useState("");
  var [selectedIC, setSelectedIC] = useState("");
  var students = allStudents || [];
  var examList = exams || [];
  var classList = classes || [];

  var availableExams = useMemo(function() {
    if (!selectedClass) return [];
    var exSet = {};
    students.forEach(function(s) { if (s.class === selectedClass && s.exam) exSet[s.exam] = true; });
    return examList.filter(function(e) { return exSet[e]; });
  }, [selectedClass, students, examList]);

  var matchingStudents = useMemo(function() {
    if (!selectedClass || !selectedExam) return [];
    return students.filter(function(s) { return s.class === selectedClass && s.exam === selectedExam; })
      .sort(function(a, b) { return str(a.name).localeCompare(str(b.name)); });
  }, [selectedClass, selectedExam, students]);

  var selectedStudent = useMemo(function() {
    if (!selectedIC) return null;
    return matchingStudents.find(function(s) { return str(s.ic) === selectedIC || str(s.name) === selectedIC; }) || null;
  }, [selectedIC, matchingStudents]);

  var studentHistory = useMemo(function() {
    if (!selectedStudent) return [];
    return students.filter(function(s) {
      if (selectedStudent.ic && s.ic) return str(s.ic) === str(selectedStudent.ic);
      return str(s.name) === str(selectedStudent.name);
    }).sort(function(a, b) { return examList.indexOf(a.exam) - examList.indexOf(b.exam); });
  }, [selectedStudent, students, examList]);

  var classAvg = useMemo(function() {
    if (!selectedStudent) return null;
    var classmates = students.filter(function(s) { return s.class === selectedStudent.class && s.exam === selectedStudent.exam; });
    return computeStats(classmates);
  }, [selectedStudent, students]);

  var nextBand = selectedStudent ? getNextBandThreshold(safeNum(selectedStudent.overall)) : null;
  var handleClassChange = function(val) { setSelectedClass(val); setSelectedExam(""); setSelectedIC(""); };
  var handleExamChange = function(val) { setSelectedExam(val); setSelectedIC(""); };
  var shortExam = function(n) { return (n || "").replace("Ujian Bulanan ", "UB ").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT"); };

  var selStyle = { width: "100%", padding: "9px 12px", fontSize: 13, fontFamily: font, border: "1px solid " + colors.border, borderRadius: 6, background: colors.card, color: colors.text, outline: "none", boxSizing: "border-box", cursor: "pointer" };
  var labelStyle = { display: "block", fontFamily: monoFont, fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 };

  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle>Find Student</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>class</label>
            <select value={selectedClass} onChange={function(e) { handleClassChange(e.target.value); }} style={selStyle}>
              <option value="">Select...</option>
              {classList.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>
          <div>
            <label style={labelStyle}>exam</label>
            <select value={selectedExam} onChange={function(e) { handleExamChange(e.target.value); }} style={selStyle} disabled={!selectedClass}>
              <option value="">Select...</option>
              {availableExams.map(function(ex) { return <option key={ex} value={ex}>{shortExam(ex)}</option>; })}
            </select>
          </div>
          <div>
            <label style={labelStyle}>student</label>
            <select value={selectedIC} onChange={function(e) { setSelectedIC(e.target.value); }} style={selStyle} disabled={!selectedExam}>
              <option value="">Select...</option>
              {matchingStudents.map(function(s, i) { var key = str(s.ic) || str(s.name); return <option key={i} value={key}>{s.name}</option>; })}
            </select>
          </div>
        </div>
        {selectedClass && selectedExam && (
          <p style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted, marginTop: 8 }}>{matchingStudents.length} students</p>
        )}
      </Card>

      {selectedStudent && (
        <Reveal>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <h2 style={{ fontFamily: displayFont, fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>{selectedStudent.name}</h2>
                <p style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                  {selectedStudent.class} / {str(selectedStudent.ic)} / {shortExam(selectedStudent.exam)}
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: displayFont, fontSize: 28, fontWeight: 700, color: bandColor(selectedStudent.band), margin: 0 }}>{selectedStudent.band || "-"}</p>
                <p style={{ fontFamily: monoFont, fontSize: 9, color: colors.textMuted }}>band</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 14 }}>
              <StatCard label="Overall" value={Math.round(safeNum(selectedStudent.overall))} sub="/360" color={colors.accent} />
              <StatCard label="Reading" value={Math.round(safeNum(selectedStudent.t1Score))} sub="/90" />
              <StatCard label="Listening" value={Math.round(safeNum(selectedStudent.t2Score))} sub="/90" />
              <StatCard label="Speaking" value={Math.round(safeNum(selectedStudent.t3Score))} sub="/90" />
              <StatCard label="Writing" value={Math.round(safeNum(selectedStudent.t4Score))} sub="/90" />
            </div>
            {classAvg && classAvg.components && (<>
              <SectionTitle>vs Class Average</SectionTitle>
              {[
                { name: "Reading", sv: safeNum(selectedStudent.t1Score), cv: (classAvg.components[0] || {}).avg || 0 },
                { name: "Listening", sv: safeNum(selectedStudent.t2Score), cv: (classAvg.components[1] || {}).avg || 0 },
                { name: "Speaking", sv: safeNum(selectedStudent.t3Score), cv: (classAvg.components[2] || {}).avg || 0 },
                { name: "Writing", sv: safeNum(selectedStudent.t4Score), cv: (classAvg.components[3] || {}).avg || 0 },
              ].map(function(c) {
                var sv = Math.round(c.sv), diff = sv - c.cv;
                return (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <p style={{ fontFamily: font, fontSize: 11, width: 65, textAlign: "right", margin: 0 }}>{c.name}</p>
                    <div style={{ flex: 1, height: 18, background: colors.warm, borderRadius: 3, overflow: "hidden", position: "relative" }}>
                      <div style={{ width: (sv / 90) * 100 + "%", height: "100%", background: diff >= 0 ? colors.accent : colors.band1, borderRadius: 3, transition: "width 0.6s ease" }} />
                      <div style={{ position: "absolute", left: (c.cv / 90) * 100 + "%", top: 0, bottom: 0, width: 1, background: colors.text, opacity: 0.2 }} />
                    </div>
                    <span style={{ fontFamily: monoFont, fontSize: 10, width: 50, color: diff >= 0 ? colors.accent : colors.band1 }}>
                      {sv} ({diff >= 0 ? "+" : ""}{diff})
                    </span>
                  </div>
                );
              })}
              <p style={{ fontFamily: monoFont, fontSize: 9, color: colors.textLight, marginTop: 4 }}>line = class avg</p>
            </>)}
          </Card>
        </Reveal>
      )}

      {nextBand && selectedStudent && (
        <Reveal delay={0.1}>
          <Card style={{ marginBottom: 12 }}>
            <SectionTitle>Gap to Next Band</SectionTitle>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ textAlign: "center", padding: "10px 16px", background: colors.cardAlt, borderRadius: 8, border: "1px solid " + colors.borderLight }}>
                <p style={{ fontFamily: monoFont, fontSize: 9, color: colors.textMuted, textTransform: "uppercase", margin: 0 }}>target</p>
                <p style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 700, color: colors.accent, margin: "2px 0 0" }}>{nextBand.band}</p>
              </div>
              <div>
                <p style={{ fontFamily: font, fontSize: 13, color: colors.text, margin: 0 }}>Needs <strong>{nextBand.needed}</strong> more marks</p>
                <p style={{ fontFamily: monoFont, fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{Math.round(safeNum(selectedStudent.overall))}/360</p>
              </div>
            </div>
          </Card>
        </Reveal>
      )}

      {studentHistory.length > 1 && selectedStudent && (
        <Reveal delay={0.15}>
          <Card>
            <SectionTitle>Exam History</SectionTitle>
            <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  {["Exam", "R", "L", "S", "W", "Total", "Band", "+/-"].map(function(h) {
                    return <th key={h} style={Object.assign({}, thStyle, { textAlign: h === "Exam" ? "left" : "center" })}>{h}</th>;
                  })}
                </tr></thead>
                <tbody>
                  {studentHistory.map(function(r, idx) {
                    var prev = idx > 0 ? studentHistory[idx - 1] : null;
                    var change = prev ? Math.round(safeNum(r.overall)) - Math.round(safeNum(prev.overall)) : null;
                    return (
                      <tr key={idx} style={{ background: r.exam === selectedExam ? colors.accentMuted : "transparent" }}>
                        <td style={Object.assign({}, tdStyle, { textAlign: "left", fontWeight: 500, fontSize: 11 })}>{shortExam(r.exam)}</td>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont })}>{Math.round(safeNum(r.t1Score))}</td>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont })}>{Math.round(safeNum(r.t2Score))}</td>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont })}>{Math.round(safeNum(r.t3Score))}</td>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont })}>{Math.round(safeNum(r.t4Score))}</td>
                        <td style={Object.assign({}, tdStyle, { fontWeight: 700, fontFamily: monoFont })}>{Math.round(safeNum(r.overall))}</td>
                        <td style={tdStyle}><BandBadge band={r.band} /></td>
                        <td style={Object.assign({}, tdStyle, { fontFamily: monoFont, fontWeight: 600, color: change === null ? colors.textMuted : change >= 0 ? colors.accent : colors.band1 })}>
                          {change === null ? "-" : (change >= 0 ? "+" : "") + change}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Reveal>
      )}

      {!selectedStudent && !selectedIC && (
        <Card><div style={{ textAlign: "center", padding: "24px 16px" }}>
          <p style={{ fontFamily: monoFont, fontSize: 12, color: colors.textMuted }}>select a class, exam, and student above</p>
        </div></Card>
      )}
    </div>
  );
}
