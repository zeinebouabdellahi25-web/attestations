import { useState } from "react";

function CertificateCard({ student, message }) {
  return (
    <div style={{
      background: "#fff",
      border: "2px solid #222",
      padding: "32px 44px",
      margin: "20px auto",
      maxWidth: "620px",
      position: "relative",
      fontFamily: "'EB Garamond', Georgia, serif",
      pageBreakAfter: "always",
    }}>
      <div style={{
        position: "absolute", top: "7px", left: "7px", right: "7px", bottom: "7px",
        border: "1px solid #bbb", pointerEvents: "none",
      }} />

      <div style={{ textAlign: "center", marginBottom: "14px" }}>
        <div style={{ fontSize: "10px", letterSpacing: "3px", color: "#555", textTransform: "uppercase", marginBottom: "2px" }}>
          République Islamique de Mauritanie
        </div>
        <div style={{ width: "36px", height: "1px", background: "#333", margin: "5px auto" }} />
        <div style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "0.5px", color: "#111" }}>
          Université de Nouakchott Al-Aasriya
        </div>
        <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>جامعة نواكشوط العصرية</div>
      </div>

      <div style={{ textAlign: "center", margin: "10px 0 14px" }}>
        <span style={{ fontSize: "9px", letterSpacing: "5px", color: "#777", textTransform: "uppercase" }}>
          — Attestation de Résultat —
        </span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", color: "#222", marginBottom: "12px" }}>
        <tbody>
          <tr>
            <td style={{ padding: "5px 0", color: "#777", width: "45%", fontSize: "12px" }}>Nom et Prénom :</td>
            <td style={{ padding: "5px 0", fontWeight: "bold", fontSize: "15px" }}>{student.name}</td>
          </tr>
          {student.id && (
            <tr>
              <td style={{ padding: "5px 0", color: "#777", fontSize: "12px" }}>N° d'inscription :</td>
              <td style={{ padding: "5px 0", fontWeight: "bold", fontSize: "13px" }}>{student.id}</td>
            </tr>
          )}
          <tr>
            <td style={{ padding: "5px 0", color: "#777", fontSize: "12px" }}>Résultat :</td>
            <td style={{ padding: "5px 0", fontWeight: "bold", fontSize: "17px", letterSpacing: "1px" }}>{student.score}</td>
          </tr>
        </tbody>
      </table>

      {message && (
        <>
          <div style={{ borderTop: "1px solid #ddd", margin: "10px 0" }} />
          <div style={{ fontSize: "11px", color: "#555", fontStyle: "italic", lineHeight: 1.8, textAlign: "center" }}>
            {message}
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "22px", fontSize: "10px", color: "#777" }}>
        <div><div style={{ borderTop: "1px solid #999", paddingTop: "4px", minWidth: "100px" }}>Date</div></div>
        <div style={{ textAlign: "center" }}><div style={{ borderTop: "1px solid #999", paddingTop: "4px", minWidth: "100px" }}>Signature et Cachet</div></div>
      </div>
    </div>
  );
}

function StepDot({ num, label, active, done }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
      <div style={{
        width: "24px", height: "24px", borderRadius: "50%",
        background: done ? "#111" : active ? "#111" : "#ddd",
        color: done || active ? "#fff" : "#aaa",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "11px", fontWeight: "bold", flexShrink: 0,
      }}>{done ? "✓" : num}</div>
      <span style={{ fontSize: "12px", color: active || done ? "#111" : "#bbb", fontWeight: active ? "bold" : "normal" }}>{label}</span>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState("Nous vous félicitons pour ce résultat et vous souhaitons beaucoup de succès dans la poursuite de vos études.");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageBase64(ev.target.result.split(",")[1]);
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const extractStudents = async () => {
    if (!imageBase64) { setError("Veuillez choisir une image."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
              { type: "text", text: `Extract all students from this list image. Return ONLY a valid JSON array, no markdown, no preamble.
Each object must have: "name" (full name), "id" (registration number, empty string if absent), "score" (result/grade, empty string if absent).
Example: [{"name":"Ahmed Mohamed","id":"2023001","score":"16/20"}]` }
            ]
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Aucun étudiant trouvé.");
      setStudents(parsed);
      setStep(2);
    } catch (e) {
      setError("Échec de l'extraction. Vérifiez que l'image est lisible. (" + e.message + ")");
    }
    setLoading(false);
  };

  const reset = () => {
    setStep(1); setImageBase64(null); setImagePreview(null);
    setStudents([]); setError("");
    setMessage("Nous vous félicitons pour ce résultat et vous souhaitons beaucoup de succès dans la poursuite de vos études.");
  };

  const btn = (label, onClick, opts = {}) => (
    <button onClick={onClick} style={{
      background: opts.outline ? "#fff" : "#111",
      color: opts.outline ? "#333" : "#fff",
      border: opts.outline ? "1px solid #bbb" : "none",
      padding: "10px 24px", fontSize: "13px",
      fontFamily: "'EB Garamond', serif",
      cursor: "pointer", letterSpacing: "1px",
      textTransform: "uppercase",
      opacity: opts.disabled ? 0.4 : 1,
      ...opts.style,
    }} disabled={opts.disabled}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f3f3f3", fontFamily: "'EB Garamond', Georgia, serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap'); * { box-sizing: border-box; } textarea { resize: vertical; } @media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>

      {/* Header */}
      <div className="no-print" style={{ background: "#111", color: "#fff", textAlign: "center", padding: "22px 20px 18px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "5px", color: "#777", marginBottom: "5px", textTransform: "uppercase" }}>Université de Nouakchott Al-Aasriya</div>
        <div style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase" }}>Générateur d'Attestations</div>
      </div>

      {/* Steps */}
      <div className="no-print" style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", justifyContent: "center", gap: "28px", padding: "12px 20px" }}>
        <StepDot num={1} label="Importer la liste" active={step === 1} done={step > 1} />
        <span style={{ color: "#ccc", alignSelf: "center" }}>›</span>
        <StepDot num={2} label="Message commun" active={step === 2} done={step > 2} />
        <span style={{ color: "#ccc", alignSelf: "center" }}>›</span>
        <StepDot num={3} label="Attestations" active={step === 3} done={false} />
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="no-print" style={{ maxWidth: "520px", margin: "32px auto", padding: "0 16px" }}>
          <div style={{ background: "#fff", border: "1px solid #ddd", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>Étape 1 — Liste des étudiants</div>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "20px", fontStyle: "italic" }}>Importez une photo ou image de la liste (tableau, document scanné…)</div>

            <label style={{ display: "block", border: "2px dashed #ccc", padding: "28px", textAlign: "center", cursor: "pointer", background: "#fafafa" }}>
              <input type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
              {imagePreview
                ? <img src={imagePreview} alt="" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }} />
                : <div><div style={{ fontSize: "28px", marginBottom: "8px" }}>🖼</div><div style={{ fontSize: "13px", color: "#666" }}>Cliquez pour choisir une image</div><div style={{ fontSize: "11px", color: "#bbb", marginTop: "3px" }}>JPG, PNG…</div></div>
              }
            </label>

            {imagePreview && (
              <div style={{ textAlign: "center", marginTop: "6px" }}>
                <label style={{ fontSize: "11px", color: "#999", cursor: "pointer", textDecoration: "underline" }}>
                  <input type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />Changer l'image
                </label>
              </div>
            )}

            {error && <div style={{ color: "#b00", fontSize: "12px", marginTop: "12px", textAlign: "center" }}>{error}</div>}

            <div style={{ marginTop: "18px" }}>
              {btn(loading ? "Analyse en cours…" : "Extraire la liste →", extractStudents, { disabled: !imageBase64 || loading, style: { width: "100%" } })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="no-print" style={{ maxWidth: "520px", margin: "32px auto", padding: "0 16px" }}>
          <div style={{ background: "#fff", border: "1px solid #ddd", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>Étape 2 — Message commun</div>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "16px", fontStyle: "italic" }}>{students.length} étudiant{students.length > 1 ? "s" : ""} détecté{students.length > 1 ? "s" : ""}</div>

            <div style={{ border: "1px solid #eee", marginBottom: "18px" }}>
              <div style={{ background: "#f5f5f5", padding: "7px 11px", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase", color: "#666" }}>Liste extraite</div>
              {students.map((s, i) => (
                <div key={i} style={{ padding: "6px 11px", borderTop: "1px solid #eee", display: "flex", gap: "10px", fontSize: "12px" }}>
                  <span style={{ flex: 2 }}>{s.name}</span>
                  {s.id && <span style={{ flex: 1, color: "#888" }}>{s.id}</span>}
                  <span style={{ flex: 1, fontWeight: "bold" }}>{s.score}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px", color: "#555", marginBottom: "7px" }}>Message à inclure dans chaque attestation</div>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
              style={{ width: "100%", padding: "9px", border: "1px solid #ccc", fontSize: "13px", fontFamily: "'EB Garamond', serif", color: "#222", outline: "none" }} />

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              {btn("← Retour", reset, { outline: true, style: { flex: 1 } })}
              {btn("Générer →", () => setStep(3), { style: { flex: 2 } })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div>
          <div className="no-print" style={{ display: "flex", justifyContent: "center", gap: "10px", padding: "16px", background: "#fff", borderBottom: "1px solid #eee" }}>
            {btn("← Nouvelle liste", reset, { outline: true })}
            {btn("🖨 Imprimer / PDF", () => window.print())}
          </div>
          <div style={{ padding: "12px 16px 60px" }}>
            <div className="no-print" style={{ textAlign: "center", fontSize: "11px", color: "#aaa", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>
              {students.length} attestation{students.length > 1 ? "s" : ""}
            </div>
            {students.map((s, i) => <CertificateCard key={i} student={s} message={message} />)}
          </div>
        </div>
      )}
    </div>
  );
