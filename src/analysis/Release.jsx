// ============================================================
// ANALYSIS - RELEASE SETTINGS (toggle exam visibility for students)
// ============================================================
import { useState, useEffect } from "react";
import { Card, SectionTitle, colors, font, displayFont, safeNum } from "./shared.jsx";

export default function Release({ appsScriptUrl, exams }) {
  var [releases, setReleases] = useState({});
  var [saving, setSaving] = useState("");
  var [loaded, setLoaded] = useState(false);
  var [error, setError] = useState("");

  // Fetch current release settings
  useEffect(function() {
    if (!appsScriptUrl) return;
    fetch(appsScriptUrl + "?action=get_release")
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success && data.releases) {
          setReleases(data.releases);
        }
        setLoaded(true);
      })
      .catch(function() { setError("Failed to load release settings."); setLoaded(true); });
  }, [appsScriptUrl]);

  var toggleExam = function(examName) {
    var current = releases[examName] || false;
    var updated = Object.assign({}, releases);
    updated[examName] = !current;
    setReleases(updated);
    setSaving(examName);

    fetch(appsScriptUrl, {
      method: "POST",
      body: JSON.stringify({ action: "set_release", exam: examName, released: !current }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.success) setError("Failed to save. Try again.");
        setSaving("");
      })
      .catch(function() { setError("Failed to save. Try again."); setSaving(""); });
  };

  if (!loaded) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 20 }}>
          <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted }}>Loading release settings...</p>
        </div>
      </Card>
    );
  }

  var examList = exams || [];

  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle>Release Results to Students</SectionTitle>
        <p style={{ fontFamily: font, fontSize: 12, color: colors.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
          Toggle which exam results are visible to students. Only released exams will appear when students search by IC number.
        </p>

        {error && <p style={{ fontFamily: font, fontSize: 12, color: colors.error, marginBottom: 12 }}>{error}</p>}

        {examList.length === 0 && (
          <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted, textAlign: "center", padding: 20 }}>
            No exams found. Upload marks first.
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {examList.map(function(exam) {
            var released = releases[exam] || false;
            var isSaving = saving === exam;
            var short = exam.replace("Ujian Bulanan ", "UB ").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT");

            return (
              <div key={exam} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", borderRadius: 10,
                background: released ? "rgba(45,106,79,0.06)" : colors.bg,
                border: "1px solid " + (released ? colors.accent : colors.border),
                transition: "all 0.2s",
              }}>
                <div>
                  <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: colors.text, margin: 0 }}>{short}</p>
                  <p style={{ fontFamily: font, fontSize: 11, color: colors.textMuted, margin: "2px 0 0" }}>
                    {released ? "Visible to students" : "Hidden from students"}
                  </p>
                </div>

                {/* Toggle switch */}
                <div
                  onClick={function() { if (!isSaving) toggleExam(exam); }}
                  style={{
                    width: 48, height: 26, borderRadius: 13, cursor: isSaving ? "wait" : "pointer",
                    background: released ? colors.accent : "#D1D5DB",
                    position: "relative", transition: "background 0.2s",
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 11,
                    background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    position: "absolute", top: 2,
                    left: released ? 24 : 2,
                    transition: "left 0.2s",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle>How It Works</SectionTitle>
        <div style={{ fontFamily: font, fontSize: 12, color: colors.textMuted, lineHeight: 1.6 }}>
          <p style={{ marginBottom: 8 }}>When a student searches their IC number, only results from released exams will appear. Unreleased exam data stays safe in the system but is hidden from the student view.</p>
          <p>You can release results on the scheduled date (e.g. Pengumuman Keputusan) and hide them again if needed.</p>
        </div>
      </Card>
    </div>
  );
}
