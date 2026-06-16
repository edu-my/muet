// ============================================================
// ANALYSIS - STUDENT PROFILES PAGE
// Class > Exam > Student ID dropdown flow
// ============================================================
import { useState, useMemo } from "react";
import { Card, SectionTitle, BandBadge, Bar, StatCard, thStyle, tdStyle,
  colors, font, displayFont, getBand, getNextBandThreshold, computeStats, bandColor, safeNum } from "./shared.jsx";

var str = function(v) { return v == null ? "" : String(v); };

export default function StudentProfiles({ allStudents, exams, classes }) {
  var [selectedClass, setSelectedClass] = useState("");
  var [selectedExam, setSelectedExam] = useState("");
  var [selectedIC, setSelectedIC] = useState("");

  var students = allStudents || [];
  var examList = exams || [];
  var classList = classes || [];

  // Derive available exams for selected class
  var availableExams = useMemo(function() {
    if (!selectedClass) return [];
    var exSet = {};
    students.forEach(function(s) {
      if (s.class === selectedClass && s.exam) exSet[s.exam] = true;
    });
    return examList.filter(function(e) { return exSet[e]; });
  }, [selectedClass, students, examList]);

  // Derive students for selected class + exam
  var matchingStudents = useMemo(function() {
    if (!selectedClass || !selectedExam) return [];
    return students
      .filter(function(s) { return s.class === selectedClass && s.exam === selectedExam; })
      .sort(function(a, b) { return str(a.name).localeCompare(str(b.name)); });
  }, [selectedClass, selectedExam, students]);

  // Selected student record
  var selectedStudent = useMemo(function() {
    if (!selectedIC) return null;
    return matchingStudents.find(function(s) { return str(s.ic) === selectedIC || str(s.name) === selectedIC; }) || null;
  }, [selectedIC, matchingStudents]);

  // Exam history for selected student (across all exams)
  var studentHistory = useMemo(function() {
    if (!selectedStudent) return [];
    return students
      .filter(function(s) {
        if (selectedStudent.ic && s.ic) return str(s.ic) === str(selectedStudent.ic);
        return str(s.name) === str(selectedStudent.name);
      })
      .sort(function(a, b) { return examList.indexOf(a.exam) - examList.indexOf(b.exam); });
  }, [selectedStudent, students, examList]);

  // Class average for comparison
  var classAvg = useMemo(function() {
    if (!selectedStudent) return null;
    var classmates = students.filter(function(s) { return s.class === selectedStudent.class && s.exam === selectedStudent.exam; });
    return computeStats(classmates);
  }, [selectedStudent, students]);

  var nextBand = selectedStudent ? getNextBandThreshold(safeNum(selectedStudent.overall)) : null;

  // Reset downstream selections when upstream changes
  var handleClassChange = function(val) {
    setSelectedClass(val);
    setSelectedExam("");
    setSelectedIC("");
  };

  var handleExamChange = function(val) {
    setSelectedExam(val);
    setSelectedIC("");
  };

  var shortExam = function(n) { return (n || "").replace("Ujian Bulanan ", "UB ").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT"); };

  var selectStyle = {
    width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: font,
    border: "1.5px solid " + colors.border, borderRadius: 8, background: colors.bg,
    color: colors.text, outline: "none", boxSizing: "border-box", cursor: "pointer",
    appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M2 4l4 4 4-4'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
  };

  var labelStyle = { display: "block", fontFamily: font, fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 };

  return (
    <div>
      {/* Filter dropdowns */}
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle>Find Student</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {/* Class */}
          <div>
            <label style={labelStyle}>Class</label>
            <select value={selectedClass} onChange={function(e) { handleClassChange(e.target.value); }} style={selectStyle}>
              <option value="">Select class...</option>
              {classList.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>

          {/* Exam */}
          <div>
            <label style={labelStyle}>Exam</label>
            <select value={selectedExam} onChange={function(e) { handleExamChange(e.target.value); }} style={selectStyle} disabled={!selectedClass}>
              <option value="">Select exam...</option>
              {availableExams.map(function(ex) { return <option key={ex} value={ex}>{shortExam(ex)}</option>; })}
            </select>
          </div>

          {/* Student */}
          <div>
            <label style={labelStyle}>Student</label>
            <select value={selectedIC} onChange={function(e) { setSelectedIC(e.target.value); }} style={selectStyle} disabled={!selectedExam}>
              <option value="">Select student...</option>
              {matchingStudents.map(function(s, i) {
                var key = str(s.ic) || str(s.name);
                return <option key={i} value={key}>{s.name}{s.ic ? " (" + s.ic + ")" : ""}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Quick summary */}
        {selectedClass && selectedExam && (
          <p style={{ fontFamily: font, fontSize: 11, color: colors.textMuted, marginTop: 10 }}>
            {matchingStudents.length} student{matchingStudents.length !== 1 ? "s" : ""} in {selectedClass}, {shortExam(selectedExam)}
          </p>
        )}
      </Card>

      {/* Student profile detail */}
      {selectedStudent && (
        <>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <h2 style={{ fontFamily: displayFont, fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>{selectedStudent.name}</h2>
                <p style={{ fontFamily: font, fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                  {selectedStudent.class}{selectedStudent.ic ? " \u00B7 " + selectedStudent.ic : ""}{selectedStudent.exam ? " \u00B7 " + shortExam(selectedStudent.exam) : ""}
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: displayFont, fontSize: 28, fontWeight: 700, color: bandColor(selectedStudent.band), margin: 0 }}>
                  {selectedStudent.band || "-"}
                </p>
                <p style={{ fontFamily: font, fontSize: 9, color: colors.textMuted }}>Band</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 14 }}>
              <StatCard label="Overall" value={Math.round(safeNum(selectedStudent.overall))} sub="/360" color={colors.accent} />
              <StatCard label="Reading" value={Math.round(safeNum(selectedStudent.t1Score))} sub="/90" />
              <StatCard label="Listening" value={Math.round(safeNum(selectedStudent.t2Score))} sub="/90" />
              <StatCard label="Speaking" value={Math.round(safeNum(selectedStudent.t3Score))} sub="/90" />
              <StatCard label="Writing" value={Math.round(safeNum(selectedStudent.t4Score))} sub="/90" />
            </div>

            {/* vs Class Average */}
            {classAvg && classAvg.components && (
              <>
                <SectionTitle>vs Class Average</SectionTitle>
                {[
                  { name: "Reading", studentVal: safeNum(selectedStudent.t1Score), classVal: (classAvg.components[0] || {}).avg || 0 },
                  { name: "Listening", studentVal: safeNum(selectedStudent.t2Score), classVal: (classAvg.components[1] || {}).avg || 0 },
                  { name: "Speaking", studentVal: safeNum(selectedStudent.t3Score), classVal: (classAvg.components[2] || {}).avg || 0 },
                  { name: "Writing", studentVal: safeNum(selectedStudent.t4Score), classVal: (classAvg.components[3] || {}).avg || 0 },
                ].map(function(c) {
                  var sv = Math.round(c.studentVal);
                  var diff = sv - c.classVal;
                  return (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <p style={{ fontFamily: font, fontSize: 11, fontWeight: 500, width: 65, textAlign: "right", margin: 0 }}>{c.name}</p>
                      <div style={{ flex: 1, height: 20, background: "#F0F0EC", borderRadius: 5, overflow: "hidden", position: "relative" }}>
                        <div style={{ width: (sv / 90) * 100 + "%", height: "100%", background: diff >= 0 ? colors.accent : colors.band1, borderRadius: 5, transition: "width 0.6s ease" }} />
                        <div style={{ position: "absolute", left: (c.classVal / 90) * 100 + "%", top: 0, bottom: 0, width: 2, background: colors.text, opacity: 0.3 }} />
                      </div>
                      <span style={{ fontFamily: font, fontSize: 10, fontWeight: 600, width: 50, color: diff >= 0 ? colors.accent : colors.band1 }}>
                        {sv} ({diff >= 0 ? "+" : ""}{diff})
                      </span>
                    </div>
                  );
                })}
                <p style={{ fontFamily: font, fontSize: 9, color: colors.textMuted, marginTop: 4, fontStyle: "italic" }}>
                  Vertical line = class average
                </p>
              </>
            )}
          </Card>

          {/* Gap to next band */}
          {nextBand && (
            <Card style={{ marginBottom: 12 }}>
              <SectionTitle>Gap to Next Band</SectionTitle>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ textAlign: "center", padding: "10px 16px", background: colors.warm, borderRadius: 8 }}>
                  <p style={{ fontFamily: font, fontSize: 9, color: colors.textMuted, textTransform: "uppercase", margin: 0 }}>Target</p>
                  <p style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 700, color: colors.accent, margin: "2px 0 0" }}>{nextBand.band}</p>
                </div>
                <div>
                  <p style={{ fontFamily: font, fontSize: 13, color: colors.text, margin: 0 }}>
                    Needs <strong>{nextBand.needed}</strong> more marks to reach Band {nextBand.band}
                  </p>
                  <p style={{ fontFamily: font, fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    Current: {Math.round(safeNum(selectedStudent.overall))}/360
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Exam history */}
          {studentHistory.length > 1 && (
            <Card>
              <SectionTitle>Exam History</SectionTitle>
              <div style={{ overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Exam", "Reading", "Listening", "Speaking", "Writing", "Overall", "Band", "Change"].map(function(h) {
                        return <th key={h} style={Object.assign({}, thStyle, { textAlign: h === "Exam" ? "left" : "center" })}>{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {studentHistory.map(function(r, idx) {
                      var prev = idx > 0 ? studentHistory[idx - 1] : null;
                      var change = prev ? Math.round(safeNum(r.overall)) - Math.round(safeNum(prev.overall)) : null;
                      return (
                        <tr key={idx} style={{ background: r.exam === selectedExam ? "rgba(45,106,79,0.04)" : "transparent" }}>
                          <td style={Object.assign({}, tdStyle, { textAlign: "left", fontWeight: 500, fontSize: 11 })}>{shortExam(r.exam)}</td>
                          <td style={tdStyle}>{Math.round(safeNum(r.t1Score))}</td>
                          <td style={tdStyle}>{Math.round(safeNum(r.t2Score))}</td>
                          <td style={tdStyle}>{Math.round(safeNum(r.t3Score))}</td>
                          <td style={tdStyle}>{Math.round(safeNum(r.t4Score))}</td>
                          <td style={Object.assign({}, tdStyle, { fontWeight: 700 })}>{Math.round(safeNum(r.overall))}</td>
                          <td style={tdStyle}><BandBadge band={r.band} /></td>
                          <td style={Object.assign({}, tdStyle, { fontWeight: 600, color: change === null ? colors.textMuted : change >= 0 ? colors.accent : colors.band1 })}>
                            {change === null ? "-" : (change >= 0 ? "+" : "") + change}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Initial state */}
      {!selectedStudent && !selectedIC && (
        <Card>
          <div style={{ textAlign: "center", padding: "24px 16px" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted, margin: 0 }}>
              Select a class, exam, and student above to view their profile
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
