import { useState, useEffect } from "react";
import { Card, SectionTitle, Reveal, colors, font, monoFont, displayFont, safeNum } from "./shared.jsx";

export default function Release({ appsScriptUrl, exams }) {
  var [releases, setReleases] = useState({});
  var [saving, setSaving] = useState("");
  var [loaded, setLoaded] = useState(false);
  var [error, setError] = useState("");

  useEffect(function() {
    if (!appsScriptUrl) return;
    fetch(appsScriptUrl + "?action=get_release")
      .then(function(r) { return r.json(); })
      .then(function(data) { if (data.success && data.releases) setReleases(data.releases); setLoaded(true); })
      .catch(function() { setError("Failed to load release settings."); setLoaded(true); });
  }, [appsScriptUrl]);

  var toggleExam = function(examName) {
    var current = releases[examName] || false;
    var updated = Object.assign({}, releases);
    updated[examName] = !current;
    setReleases(updated);
    setSaving(examName);
    fetch(appsScriptUrl, { method: "POST", body: JSON.stringify({ action: "set_release", exam: examName, released: !current }) })
      .then(function(r) { return r.json(); })
      .then(function(data) { if (!data.success) setError("Failed to save."); setSaving(""); })
      .catch(function() { setError("Failed to save."); setSaving(""); });
  };

  if (!loaded) return <Card><p style={{ fontFamily: monoFont, fontSize: 12, color: colors.textMuted, textAlign: "center", padding: 20 }}>loading...</p></Card>;
  var examList = exams || [];

  return (
    <div>
      <Reveal>
        <Card style={{ marginBottom: 14 }}>
          <SectionTitle>Release Results to Students</SectionTitle>
          <p style={{ fontFamily: font, fontSize: 12, color: colors.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
            Toggle which exam results are visible to students. Only released exams appear when students search by IC.
          </p>
          {error && <p style={{ fontFamily: monoFont, fontSize: 11, color: colors.error, marginBottom: 12 }}>{error}</p>}
          {examList.length === 0 && <p style={{ fontFamily: monoFont, fontSize: 12, color: colors.textMuted, textAlign: "center", padding: 20 }}>no exams found</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {examList.map(function(exam) {
              var released = releases[exam] || false;
              var isSaving = saving === exam;
              var short = exam.replace("Ujian Bulanan ", "UB ").replace("Peperiksaan Pertengahan Tahun", "PPT").replace("Peperiksaan Akhir Tahun", "PAT");
              return (
                <div key={exam} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: 8,
                  background: released ? colors.accentMuted : colors.cardAlt,
                  border: "1px solid " + (released ? colors.accent : colors.border),
                  transition: "all 0.2s",
                }}>
                  <div>
                    <p style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: colors.text, margin: 0 }}>{short}</p>
                    <p style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted, margin: "2px 0 0" }}>
                      {released ? "visible to students" : "hidden"}
                    </p>
                  </div>
                  <div onClick={function() { if (!isSaving) toggleExam(exam); }}
                    style={{ width: 44, height: 24, borderRadius: 12, cursor: isSaving ? "wait" : "pointer",
                      background: released ? colors.accent : colors.border, position: "relative", transition: "background 0.2s", opacity: isSaving ? 0.5 : 1 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                      position: "absolute", top: 2, left: released ? 22 : 2, transition: "left 0.2s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
