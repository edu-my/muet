// ============================================================
// ANALYSIS - STUDENT REGISTRATION (drag-reorder + save)
// ============================================================
import { useState, useEffect, useMemo, useRef } from "react";
import { Card, SectionTitle, Reveal, colors, font, monoFont, displayFont, safeNum, thStyle, tdStyle } from "./shared.jsx";

var str = function(v) { return v == null ? "" : String(v); };
var YEARS = ["2024", "2025", "2026", "2027", "2028"];
var SEX_OPTIONS = ["Male", "Female"];
var RACE_OPTIONS = ["Malay", "Chinese", "Indian", "Kadazan", "Dusun", "Bajau", "Murut", "Rungus", "Others"];
var emptyForm = { year: "2026", class: "", name: "", ic: "", contact: "", email: "", sex: "", race: "" };

export default function Registration({ appsScriptUrl, classes }) {
  var [records, setRecords] = useState([]);
  var [form, setForm] = useState(Object.assign({}, emptyForm));
  var [editing, setEditing] = useState(null);
  var [saving, setSaving] = useState(false);
  var [loading, setLoading] = useState(true);
  var [msg, setMsg] = useState("");
  var [tab, setTab] = useState("list");
  var [filterYear, setFilterYear] = useState("");
  var [filterClass, setFilterClass] = useState("");
  var [search, setSearch] = useState("");
  var [dragIdx, setDragIdx] = useState(null);
  var [overIdx, setOverIdx] = useState(null);
  var [orderChanged, setOrderChanged] = useState(false);
  var [savingOrder, setSavingOrder] = useState(false);
  var classList = classes || [];

  useEffect(function() { fetchRecords(); }, [appsScriptUrl]);

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

  var filtered = useMemo(function() {
    return records.filter(function(r) {
      if (filterYear && str(r.year) !== filterYear) return false;
      if (filterClass && str(r.class) !== filterClass) return false;
      if (search) {
        var q = search.toLowerCase();
        if (!str(r.name).toLowerCase().includes(q) && !str(r.ic).toLowerCase().includes(q) && !str(r.contact).toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [records, filterYear, filterClass, search]);

  // Drag handlers
  var handleDragStart = function(i) { setDragIdx(i); };
  var handleDragOver = function(e, i) { e.preventDefault(); setOverIdx(i); };
  var handleDragEnd = function() {
    if (dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      var newFiltered = filtered.slice();
      var dragged = newFiltered.splice(dragIdx, 1)[0];
      newFiltered.splice(overIdx, 0, dragged);

      // Rebuild full records with new order for filtered items
      var filteredSet = new Set(filtered.map(function(r) { return str(r.ic) + "|" + str(r.name); }));
      var nonFiltered = records.filter(function(r) { return !filteredSet.has(str(r.ic) + "|" + str(r.name)); });
      setRecords(newFiltered.concat(nonFiltered));
      setOrderChanged(true);
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  // Save reordered list back to Google Sheet
  var handleSaveOrder = function() {
    setSavingOrder(true);
    setMsg("");
    fetch(appsScriptUrl, {
      method: "POST",
      body: JSON.stringify({ action: "reorder_registrations", records: records }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          setMsg("Order saved successfully.");
          setOrderChanged(false);
        } else {
          setMsg("Error: " + (data.error || "Failed to save order."));
        }
        setSavingOrder(false);
      })
      .catch(function() { setMsg("Failed to save order."); setSavingOrder(false); });
  };

  var handleChange = function(field, val) {
    var updated = Object.assign({}, form);
    updated[field] = val;
    setForm(updated);
  };

  var handleSubmit = function() {
    if (!form.name || !form.class || !form.year) { setMsg("Please fill in Year, Class, and Name."); return; }
    setSaving(true); setMsg("");
    var payload = Object.assign({}, form, { action: "save_registration" });
    if (editing) payload.editingIC = editing;
    fetch(appsScriptUrl, { method: "POST", body: JSON.stringify(payload) })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          setMsg(editing ? "Updated successfully." : "Registered successfully.");
          setForm(Object.assign({}, emptyForm)); setEditing(null); setTab("list"); fetchRecords();
        } else { setMsg("Error: " + (data.error || "Unknown error")); }
        setSaving(false);
      })
      .catch(function() { setMsg("Failed to save."); setSaving(false); });
  };

  var handleEdit = function(record) {
    setForm({ year: str(record.year) || "2026", class: str(record.class), name: str(record.name), ic: str(record.ic), contact: str(record.contact), email: str(record.email), sex: str(record.sex), race: str(record.race) });
    setEditing(str(record.ic) || str(record.name)); setTab("form");
  };

  var handleDownload = function() {
    var headers = ["No", "Year", "Class", "Name", "IC No.", "Contact", "Email", "Sex", "Race"];
    var rows = filtered.map(function(r, i) {
      return [String(i + 1), str(r.year), str(r.class), str(r.name), str(r.ic), str(r.contact), str(r.email), str(r.sex), str(r.race)];
    });
    var csv = [headers.join(",")].concat(rows.map(function(row) {
      return row.map(function(cell) { return '"' + cell.replace(/"/g, '""') + '"'; }).join(",");
    })).join("\n");
    var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a"); a.href = url;
    var fname = "MUET_Registration";
    if (filterYear) fname += "_" + filterYear;
    if (filterClass) fname += "_" + filterClass;
    a.download = fname + ".csv"; a.click(); URL.revokeObjectURL(url);
  };

  var inputStyle = { width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: font, border: "1px solid " + colors.border, borderRadius: 8, background: colors.card, color: colors.text, outline: "none", boxSizing: "border-box" };
  var selectInput = Object.assign({}, inputStyle, { cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238A8A8A' d='M2 4l4 4 4-4'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" });
  var labelStyle = { display: "block", fontFamily: monoFont, fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 };

  var tabBtn = function(id, label) {
    var active = tab === id;
    return (
      <button key={id} onClick={function() { setTab(id); setMsg(""); }}
        style={{ padding: "8px 18px", fontSize: 12, fontFamily: font, fontWeight: active ? 600 : 400, color: active ? "#fff" : colors.textMuted, background: active ? colors.accent : colors.card, border: "1px solid " + (active ? colors.accent : colors.border), borderRadius: 6, cursor: "pointer" }}>{label}</button>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {tabBtn("list", "Student List (" + records.length + ")")}
        {tabBtn("form", editing ? "Edit Student" : "Register New")}
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", marginBottom: 14, borderRadius: 8, fontFamily: font, fontSize: 12,
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
                <label style={labelStyle}>year</label>
                <select value={filterYear} onChange={function(e) { setFilterYear(e.target.value); }} style={selectInput}>
                  <option value="">All Years</option>
                  {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
                </select>
              </div>
              <div>
                <label style={labelStyle}>class</label>
                <select value={filterClass} onChange={function(e) { setFilterClass(e.target.value); }} style={selectInput}>
                  <option value="">All Classes</option>
                  {classList.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                </select>
              </div>
              <div>
                <label style={labelStyle}>search</label>
                <input type="text" value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Name, IC, or contact..." style={inputStyle} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={handleDownload} disabled={filtered.length === 0}
                  style={{ padding: "10px 14px", fontSize: 11, fontFamily: monoFont, fontWeight: 500, color: "#fff", background: filtered.length > 0 ? colors.accent : colors.border, border: "none", borderRadius: 6, cursor: filtered.length > 0 ? "pointer" : "not-allowed", whiteSpace: "nowrap", height: 40, letterSpacing: "0.02em" }}>
                  download csv
                </button>
                {orderChanged && (
                  <button onClick={handleSaveOrder} disabled={savingOrder}
                    style={{ padding: "10px 14px", fontSize: 11, fontFamily: monoFont, fontWeight: 600, color: "#fff", background: "#D97706", border: "none", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap", height: 40, letterSpacing: "0.02em", animation: "fadeUp 0.3s ease" }}>
                    {savingOrder ? "saving..." : "save order"}
                  </button>
                )}
              </div>
            </div>
            <p style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted, marginTop: 8 }}>
              {filtered.length} of {records.length} students {orderChanged ? " \u2022 order changed (unsaved)" : ""}
            </p>
          </Card>

          {loading ? (
            <Card><p style={{ fontFamily: monoFont, fontSize: 12, color: colors.textMuted, textAlign: "center", padding: 20 }}>loading...</p></Card>
          ) : filtered.length === 0 ? (
            <Card><p style={{ fontFamily: monoFont, fontSize: 12, color: colors.textMuted, textAlign: "center", padding: 20 }}>no students found</p></Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.map(function(r, i) {
                var isDragging = dragIdx === i;
                var isOver = overIdx === i;
                return (
                  <div key={str(r.ic) + str(r.name) + i}
                    draggable
                    onDragStart={function() { handleDragStart(i); }}
                    onDragOver={function(e) { handleDragOver(e, i); }}
                    onDragEnd={handleDragEnd}
                    style={{
                      background: colors.card, border: "1px solid " + (isOver ? colors.accent : colors.border),
                      borderRadius: 10, padding: "14px 16px",
                      opacity: isDragging ? 0.4 : 1,
                      transform: isOver ? "scale(1.01)" : "scale(1)",
                      transition: "all 0.15s ease",
                      cursor: "grab",
                      borderTop: isOver && dragIdx < i ? "3px solid " + colors.accent : undefined,
                      borderBottom: isOver && dragIdx > i ? "3px solid " + colors.accent : undefined,
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Drag handle + number */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textLight} strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/></svg>
                        <span style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{i + 1}</span>
                      </div>

                      {/* Main content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                          <p style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: colors.text, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</p>
                          <span style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted, flexShrink: 0 }}>{r.ic}</span>
                        </div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted }}>
                            <span style={{ color: colors.textLight }}>year</span> {r.year}
                          </span>
                          <span style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted }}>
                            <span style={{ color: colors.textLight }}>class</span> {r.class}
                          </span>
                          {r.contact && <span style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted }}>
                            <span style={{ color: colors.textLight }}>tel</span> {r.contact}
                          </span>}
                          {r.email && <span style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted }}>
                            <span style={{ color: colors.textLight }}>email</span> {r.email}
                          </span>}
                          {r.sex && <span style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted }}>
                            <span style={{ color: colors.textLight }}>sex</span> {r.sex}
                          </span>}
                          {r.race && <span style={{ fontFamily: monoFont, fontSize: 10, color: colors.textMuted }}>
                            <span style={{ color: colors.textLight }}>race</span> {r.race}
                          </span>}
                        </div>
                      </div>

                      {/* Edit button */}
                      <button onClick={function(e) { e.stopPropagation(); handleEdit(r); }}
                        style={{ fontFamily: monoFont, fontSize: 10, color: colors.accent, background: "none", border: "1px solid " + colors.accent, borderRadius: 4, padding: "4px 10px", cursor: "pointer", flexShrink: 0, letterSpacing: "0.02em" }}>
                        edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== FORM VIEW ===== */}
      {tab === "form" && (
        <Card>
          <SectionTitle>{editing ? "Edit Student" : "Register New Student"}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>year *</label>
              <select value={form.year} onChange={function(e) { handleChange("year", e.target.value); }} style={selectInput}>
                {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
              </select>
            </div>
            <div>
              <label style={labelStyle}>class *</label>
              <select value={form.class} onChange={function(e) { handleChange("class", e.target.value); }} style={selectInput}>
                <option value="">Select class...</option>
                {classList.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>full name *</label>
              <input type="text" value={form.name} onChange={function(e) { handleChange("name", e.target.value); }} placeholder="Student's full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>ic number</label>
              <input type="text" value={form.ic} onChange={function(e) { handleChange("ic", e.target.value); }} placeholder="e.g. 080101-12-1234" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>contact no.</label>
              <input type="text" value={form.contact} onChange={function(e) { handleChange("contact", e.target.value); }} placeholder="e.g. 011-12345678" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>email</label>
              <input type="email" value={form.email} onChange={function(e) { handleChange("email", e.target.value); }} placeholder="student@email.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>sex</label>
              <select value={form.sex} onChange={function(e) { handleChange("sex", e.target.value); }} style={selectInput}>
                <option value="">Select...</option>
                {SEX_OPTIONS.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
              </select>
            </div>
            <div>
              <label style={labelStyle}>race</label>
              <select value={form.race} onChange={function(e) { handleChange("race", e.target.value); }} style={selectInput}>
                <option value="">Select...</option>
                {RACE_OPTIONS.map(function(r) { return <option key={r} value={r}>{r}</option>; })}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ padding: "10px 20px", fontSize: 12, fontFamily: monoFont, fontWeight: 500, color: "#fff", background: colors.accent, border: "none", borderRadius: 6, cursor: "pointer", letterSpacing: "0.02em" }}>
              {saving ? "saving..." : editing ? "update student" : "register student"}
            </button>
            {editing && (
              <button onClick={function() { setForm(Object.assign({}, emptyForm)); setEditing(null); setTab("list"); }}
                style={{ padding: "10px 20px", fontSize: 12, fontFamily: monoFont, fontWeight: 500, color: colors.textMuted, background: "none", border: "1px solid " + colors.border, borderRadius: 6, cursor: "pointer" }}>cancel</button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
