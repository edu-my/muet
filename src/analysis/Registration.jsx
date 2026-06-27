// ============================================================
// ANALYSIS - STUDENT REGISTRATION FORM + LIST
// ============================================================
import { useState, useEffect, useMemo } from "react";
import { Card, SectionTitle, Reveal, colors, font, monoFont, displayFont, safeNum, thStyle, tdStyle } from "./shared.jsx";

var str = function(v) { return v == null ? "" : String(v); };

var YEARS = ["2024", "2025", "2026", "2027", "2028"];
var SEX_OPTIONS = ["Male", "Female"];
var RACE_OPTIONS = ["Malay", "Chinese", "Indian", "Kadazan", "Dusun", "Bajau", "Murut", "Rungus", "Others"];

var emptyForm = { year: "2026", class: "", name: "", ic: "", contact: "", email: "", sex: "", race: "" };

export default function Registration({ appsScriptUrl, classes }) {
  var [records, setRecords] = useState([]);
  var [form, setForm] = useState(Object.assign({}, emptyForm));
  var [editing, setEditing] = useState(null); // IC of record being edited
  var [saving, setSaving] = useState(false);
  var [loading, setLoading] = useState(true);
  var [msg, setMsg] = useState("");
  var [tab, setTab] = useState("list"); // "list" or "form"

  // Filters for list view
  var [filterYear, setFilterYear] = useState("");
  var [filterClass, setFilterClass] = useState("");
  var [search, setSearch] = useState("");

  var classList = classes || [];

  // Fetch all registration records
  useEffect(function() {
    fetchRecords();
  }, [appsScriptUrl]);

  var fetchRecords = function() {
    if (!appsScriptUrl) return;
    setLoading(true);
    fetch(appsScriptUrl + "?action=get_registrations")
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) setRecords(data.records || []);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  };

  // Filtered records
  var filtered = useMemo(function() {
    return records.filter(function(r) {
      if (filterYear && str(r.year) !== filterYear) return false;
      if (filterClass && str(r.class) !== filterClass) return false;
      if (search) {
        var q = search.toLowerCase();
        var match = str(r.name).toLowerCase().includes(q) || str(r.ic).toLowerCase().includes(q) || str(r.contact).toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [records, filterYear, filterClass, search]);

  // Handle form change
  var handleChange = function(field, val) {
    var updated = Object.assign({}, form);
    updated[field] = val;
    setForm(updated);
  };

  // Submit (add or update)
  var handleSubmit = function() {
    if (!form.name || !form.class || !form.year) {
      setMsg("Please fill in Year, Class, and Name.");
      return;
    }
    setSaving(true);
    setMsg("");

    var payload = Object.assign({}, form, { action: "save_registration" });
    if (editing) payload.editingIC = editing;

    fetch(appsScriptUrl, {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          setMsg(editing ? "Updated successfully." : "Registered successfully.");
          setForm(Object.assign({}, emptyForm));
          setEditing(null);
          setTab("list");
          fetchRecords();
        } else {
          setMsg("Error: " + (data.error || "Unknown error"));
        }
        setSaving(false);
      })
      .catch(function() { setMsg("Failed to save."); setSaving(false); });
  };

  // Edit existing record
  var handleEdit = function(record) {
    setForm({
      year: str(record.year) || "2026",
      class: str(record.class),
      name: str(record.name),
      ic: str(record.ic),
      contact: str(record.contact),
      email: str(record.email),
      sex: str(record.sex),
      race: str(record.race),
    });
    setEditing(str(record.ic) || str(record.name));
    setTab("form");
  };

  // Download filtered records as CSV (for Excel)
  var handleDownload = function() {
    var headers = ["Year", "Class", "Name", "IC No.", "Contact", "Email", "Sex", "Race"];
    var rows = filtered.map(function(r) {
      return [str(r.year), str(r.class), str(r.name), str(r.ic), str(r.contact), str(r.email), str(r.sex), str(r.race)];
    });

    var csv = [headers.join(",")].concat(rows.map(function(row) {
      return row.map(function(cell) {
        return '"' + cell.replace(/"/g, '""') + '"';
      }).join(",");
    })).join("\n");

    var BOM = "\uFEFF";
    var blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    var fname = "MUET_Registration";
    if (filterYear) fname += "_" + filterYear;
    if (filterClass) fname += "_" + filterClass;
    a.download = fname + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  var inputStyle = {
    width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: font,
    border: "1.5px solid " + colors.border, borderRadius: 8, background: colors.bg,
    color: colors.text, outline: "none", boxSizing: "border-box",
  };

  var selectInput = Object.assign({}, inputStyle, {
    cursor: "pointer", appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M2 4l4 4 4-4'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
  });

  var labelStyle = { display: "block", fontFamily: font, fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 };

  var tabBtn = function(id, label) {
    var active = tab === id;
    return (
      <button key={id} onClick={function() { setTab(id); setMsg(""); }}
        style={{
          padding: "8px 20px", fontSize: 13, fontFamily: font, fontWeight: active ? 600 : 400,
          color: active ? "#fff" : colors.textMuted,
          background: active ? colors.accent : colors.card,
          border: "1.5px solid " + (active ? colors.accent : colors.border),
          borderRadius: 8, cursor: "pointer",
        }}>{label}</button>
    );
  };

  return (
    <div>
      {/* Tab toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {tabBtn("list", "Student List (" + records.length + ")")}
        {tabBtn("form", editing ? "Edit Student" : "Register New")}
      </div>

      {msg && (
        <div style={{
          padding: "10px 14px", marginBottom: 14, borderRadius: 8, fontFamily: font, fontSize: 12,
          background: msg.includes("Error") || msg.includes("Failed") || msg.includes("Please") ? colors.errorBg : "rgba(45,106,79,0.08)",
          color: msg.includes("Error") || msg.includes("Failed") || msg.includes("Please") ? colors.error : colors.accent,
        }}>{msg}</div>
      )}

      {/* ===== LIST VIEW ===== */}
      {tab === "list" && (
        <>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <label style={labelStyle}>Year</label>
                <select value={filterYear} onChange={function(e) { setFilterYear(e.target.value); }} style={selectInput}>
                  <option value="">All Years</option>
                  {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Class</label>
                <select value={filterClass} onChange={function(e) { setFilterClass(e.target.value); }} style={selectInput}>
                  <option value="">All Classes</option>
                  {classList.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Search</label>
                <input type="text" value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Name, IC, or contact..." style={inputStyle} />
              </div>
              <button onClick={handleDownload} disabled={filtered.length === 0}
                style={{
                  padding: "10px 16px", fontSize: 12, fontFamily: font, fontWeight: 600,
                  color: "#fff", background: filtered.length > 0 ? colors.accent : colors.border,
                  border: "none", borderRadius: 8, cursor: filtered.length > 0 ? "pointer" : "not-allowed",
                  whiteSpace: "nowrap", height: 40,
                }}>
                Download CSV
              </button>
            </div>
            <p style={{ fontFamily: font, fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
              Showing {filtered.length} of {records.length} student{records.length !== 1 ? "s" : ""}
            </p>
          </Card>

          <Card>
            {loading ? (
              <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted, textAlign: "center", padding: 20 }}>Loading...</p>
            ) : filtered.length === 0 ? (
              <p style={{ fontFamily: font, fontSize: 13, color: colors.textMuted, textAlign: "center", padding: 20 }}>No students found.</p>
            ) : (
              <div style={{ overflow: "auto", maxHeight: 500 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["#", "Year", "Class", "Name", "IC No.", "Contact", "Email", "Sex", "Race", ""].map(function(h) {
                        return <th key={h} style={Object.assign({}, thStyle, { textAlign: h === "Name" ? "left" : "center", whiteSpace: "nowrap", position: "sticky", top: 0, background: colors.card, zIndex: 1 })}>{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(function(r, i) {
                      return (
                        <tr key={i}>
                          <td style={Object.assign({}, tdStyle, { color: colors.textMuted, fontSize: 10 })}>{i + 1}</td>
                          <td style={tdStyle}>{r.year}</td>
                          <td style={tdStyle}>{r.class}</td>
                          <td style={Object.assign({}, tdStyle, { textAlign: "left", fontWeight: 500, whiteSpace: "nowrap" })}>{r.name}</td>
                          <td style={Object.assign({}, tdStyle, { fontSize: 11, whiteSpace: "nowrap" })}>{r.ic}</td>
                          <td style={Object.assign({}, tdStyle, { fontSize: 11, whiteSpace: "nowrap" })}>{r.contact}</td>
                          <td style={Object.assign({}, tdStyle, { fontSize: 11 })}>{r.email}</td>
                          <td style={tdStyle}>{r.sex}</td>
                          <td style={tdStyle}>{r.race}</td>
                          <td style={tdStyle}>
                            <button onClick={function() { handleEdit(r); }}
                              style={{ fontFamily: font, fontSize: 10, color: colors.accent, background: "none", border: "1px solid " + colors.accent, borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}>
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ===== FORM VIEW ===== */}
      {tab === "form" && (
        <Card>
          <SectionTitle>{editing ? "Edit Student" : "Register New Student"}</SectionTitle>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Year *</label>
              <select value={form.year} onChange={function(e) { handleChange("year", e.target.value); }} style={selectInput}>
                {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Class *</label>
              <select value={form.class} onChange={function(e) { handleChange("class", e.target.value); }} style={selectInput}>
                <option value="">Select class...</option>
                {classList.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Full Name *</label>
              <input type="text" value={form.name} onChange={function(e) { handleChange("name", e.target.value); }} placeholder="Student's full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>IC Number</label>
              <input type="text" value={form.ic} onChange={function(e) { handleChange("ic", e.target.value); }} placeholder="e.g. 080101-12-1234" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contact No.</label>
              <input type="text" value={form.contact} onChange={function(e) { handleChange("contact", e.target.value); }} placeholder="e.g. 011-12345678" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={function(e) { handleChange("email", e.target.value); }} placeholder="student@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sex</label>
              <select value={form.sex} onChange={function(e) { handleChange("sex", e.target.value); }} style={selectInput}>
                <option value="">Select...</option>
                {SEX_OPTIONS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Race</label>
              <select value={form.race} onChange={function(e) { handleChange("race", e.target.value); }} style={selectInput}>
                <option value="">Select...</option>
                {RACE_OPTIONS.map(function(r) { return <option key={r} value={r}>{r}</option>; })}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{
                padding: "10px 24px", fontSize: 13, fontFamily: font, fontWeight: 600,
                color: "#fff", background: colors.accent, border: "none", borderRadius: 8, cursor: "pointer",
              }}>
              {saving ? "Saving..." : editing ? "Update Student" : "Register Student"}
            </button>
            {editing && (
              <button onClick={function() { setForm(Object.assign({}, emptyForm)); setEditing(null); setTab("list"); }}
                style={{
                  padding: "10px 24px", fontSize: 13, fontFamily: font, fontWeight: 500,
                  color: colors.textMuted, background: "none", border: "1px solid " + colors.border, borderRadius: 8, cursor: "pointer",
                }}>Cancel</button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
