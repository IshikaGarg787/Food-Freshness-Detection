import { useState, useRef } from "react";

export default function Upload() {
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [foodName, setFoodName]   = useState("");          // NEW: food name
  const [temperature, setTemperature]   = useState("");
  const [humidity, setHumidity]         = useState("");
  const [storageHours, setStorageHours] = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const fileInputRef              = useRef(null);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { alert("Please select an image"); return; }

    const token = localStorage.getItem("token");
    if (!token) { alert("Please login first"); return; }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("temperature", temperature || 25);
    formData.append("humidity", humidity || 60);
    formData.append("storage_hours", storageHours || 10);
    formData.append("food_name", foodName || "Unknown");   // NEW

    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },     // NEW: send token
        body: formData,
      });

      if (res.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      alert("Error connecting to backend. Make sure it's running at http://localhost:8000");
    } finally {
      setLoading(false);
    }
  };

  const isFresh = result && result.result && result.result.toLowerCase().includes("fresh");

  const sensors = [
    { label: "Temperature", unit: "°C",  placeholder: "e.g. 22", icon: "🌡️", value: temperature,  set: setTemperature  },
    { label: "Humidity",    unit: "%",   placeholder: "e.g. 65", icon: "💧", value: humidity,      set: setHumidity     },
    { label: "Storage Time",unit: "hrs", placeholder: "e.g. 48", icon: "⏱️", value: storageHours,  set: setStorageHours },
  ];

  return (
    <div className="upload-page">

      {/* ── Background blobs ── */}
      <div className="upload-blob upload-blob-1" />
      <div className="upload-blob upload-blob-2" />

      {/* ── Header ── */}
      <div className="upload-header">
        <div className="upload-tag">🔍 Freshness Analysis</div>
        <h1 className="upload-title">Analyze Your Food</h1>
        <p className="upload-subtitle">
          Upload a photo and enter sensor data — our AI model will predict freshness in milliseconds.
        </p>
      </div>

      <div className="upload-layout">

        {/* ─── LEFT: Form Panel ─── */}
        <div className="upload-form-panel">

          {/* Drop Zone */}
          <div
            className={`drop-zone ${dragOver ? "drop-zone-active" : ""} ${preview ? "drop-zone-filled" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <div className="preview-wrap">
                <img src={preview} alt="Food preview" className="preview-img" />
                <div className="preview-overlay">
                  <span>🔄 Click to change</span>
                </div>
              </div>
            ) : (
              <div className="drop-placeholder">
                <div className="drop-icon-ring">
                  <span className="drop-icon">📸</span>
                </div>
                <p className="drop-title">Drop your food photo here</p>
                <p className="drop-sub">or <span className="drop-link">browse files</span></p>
                <p className="drop-types">JPG, PNG, WEBP • Max 10MB</p>
              </div>
            )}
            <input
              ref={fileInputRef} type="file" accept="image/*"
              onChange={(e) => handleFile(e.target.files[0])}
              style={{ display: "none" }}
            />
          </div>

          {/* Food Name — NEW field */}
          <div className="sensors-section">
            <h3 className="sensors-title">🥦 What food is this?</h3>
            <p className="sensors-desc">Give a name so it shows up correctly in Recent Scans</p>
            <input
              type="text"
              placeholder="e.g. Apple, Tomato, Broccoli..."
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="sensor-input"
              style={{ width: "100%", marginTop: "4px" }}
            />
          </div>

          {/* Sensor Inputs */}
          <div className="sensors-section">
            <h3 className="sensors-title">🌡️ Environmental Sensor Data</h3>
            <p className="sensors-desc">Optional — improves prediction accuracy</p>
            <div className="sensors-grid">
              {sensors.map(({ label, unit, placeholder, icon, value, set }) => (
                <div key={label} className="sensor-field">
                  <label className="sensor-label">
                    <span className="sensor-icon">{icon}</span> {label}
                    <span className="sensor-unit">{unit}</span>
                  </label>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="sensor-input"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            className={`submit-btn ${loading ? "submit-loading" : ""}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" />Analyzing freshness...</>
            ) : (
              <><span>🔬</span> Predict Freshness</>
            )}
          </button>
        </div>

        {/* ─── RIGHT: Result / Tips Panel ─── */}
        <div className="upload-right-panel">

          {/* Result Card */}
          {result && !result.error && (
            <div className={`result-card ${isFresh ? "result-fresh" : "result-spoiled"}`}>
              <div className="result-icon-wrap">
                <div className="result-icon">{isFresh ? "✅" : "🚨"}</div>
              </div>
              <div className="result-verdict">{result.result}</div>
              <div className="result-sub">{isFresh ? "This food appears safe to consume." : "This food may not be safe to consume."}</div>

              <div className="result-metrics">
                <div className="metric-card">
                  <div className="metric-value">{result.visual_confidence}%</div>
                  <div className="metric-label">Visual Score</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: `${result.visual_confidence}%`, background: isFresh ? "#16a34a" : "#dc2626" }} />
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{(result.adjusted_confidence * 100).toFixed(1)}%</div>
                  <div className="metric-label">Adjusted Score</div>
                  <div className="metric-bar">
                    <div className="metric-fill" style={{ width: `${(result.adjusted_confidence * 100).toFixed(0)}%`, background: isFresh ? "#84cc16" : "#f97316" }} />
                  </div>
                </div>
              </div>

              {result.explanation && (
                <div className="result-explanation">
                  <span className="expl-icon">💬</span>
                  {result.explanation}
                </div>
              )}

              <div className="result-meta">
                ⚡ Analyzed in <strong>{result.latency_ms} ms</strong>
              </div>

              {/* Saved notice */}
              <div style={{ marginTop: "12px", textAlign: "center", fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>
                ✅ Scan saved to your dashboard
              </div>
            </div>
          )}

          {result && result.error && (
            <div className="error-card">
              <div className="error-icon">⚠️</div>
              <div className="error-title">Analysis Failed</div>
              <div className="error-msg">{result.error}</div>
            </div>
          )}

          {/* Tips Panel (when no result) */}
          {!result && (
            <div className="tips-panel">
              <h3 className="tips-panel-title">📋 How to get the best results</h3>
              {[
                { icon: "☀️", tip: "Photograph in good lighting" },
                { icon: "🎯", tip: "Keep food centered in frame" },
                { icon: "📏", tip: "Get close enough to see texture" },
                { icon: "🌡️", tip: "Add sensor data for higher accuracy" },
                { icon: "🧼", tip: "Clean the lens before scanning" },
              ].map(({ icon, tip }) => (
                <div key={tip} className="tip-row">
                  <span className="tip-icon">{icon}</span>
                  <span className="tip-text">{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .upload-page {
          min-height: 100vh; padding: 40px 40px 60px;
          background: var(--bg); position: relative; overflow-x: hidden;
        }
        .upload-blob { position: fixed; border-radius: 50%; filter: blur(90px); pointer-events: none; z-index: 0; opacity: 0.35; }
        .upload-blob-1 { width: 450px; height: 450px; background: radial-gradient(circle, #bbf7d0, transparent); top: -80px; right: 0; animation: blob 11s ease-in-out infinite; }
        .upload-blob-2 { width: 350px; height: 350px; background: radial-gradient(circle, #fef9c3, transparent); bottom: 100px; left: -60px; animation: blob 14s ease-in-out infinite reverse; }
        .upload-header { position: relative; z-index: 1; text-align: center; margin-bottom: 36px; animation: fadeUp 0.5s ease both; }
        .upload-tag { display: inline-flex; align-items: center; gap: 8px; background: white; border: 1px solid #bbf7d0; padding: 6px 16px; border-radius: 50px; font-size: 12px; font-weight: 700; color: var(--fresh-green); margin-bottom: 14px; box-shadow: var(--shadow-sm); }
        .upload-title { font-family: var(--font-display); font-size: 38px; font-weight: 900; color: var(--text); letter-spacing: -1px; margin-bottom: 10px; }
        .upload-subtitle { font-size: 15px; color: var(--text-2); max-width: 500px; margin: 0 auto; line-height: 1.7; }
        .upload-layout { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 420px; gap: 28px; max-width: 1100px; margin: 0 auto; }
        .upload-form-panel { display: flex; flex-direction: column; gap: 24px; animation: fadeUp 0.6s ease 0.1s both; }
        .drop-zone { background: white; border: 2px dashed #86efac; border-radius: var(--radius-lg); min-height: 280px; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; overflow: hidden; transition: var(--transition); }
        .drop-zone:hover { border-color: var(--fresh-green); background: #f0fdf4; }
        .drop-zone-active { border-color: var(--fresh-green); background: #dcfce7; transform: scale(1.01); }
        .drop-zone-filled { border-style: solid; border-color: #bbf7d0; }
        .drop-placeholder { text-align: center; padding: 20px; }
        .drop-icon-ring { width: 72px; height: 72px; background: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px; border: 2px solid #bbf7d0; transition: var(--spring); }
        .drop-zone:hover .drop-icon-ring { transform: scale(1.1); background: #dcfce7; }
        .drop-title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
        .drop-sub { font-size: 14px; color: var(--text-muted); margin-bottom: 8px; }
        .drop-link { color: var(--fresh-green); font-weight: 700; }
        .drop-types { font-size: 12px; color: var(--text-muted); }
        .preview-wrap { width: 100%; height: 100%; position: relative; }
        .preview-img { width: 100%; height: 280px; object-fit: cover; display: block; border-radius: calc(var(--radius-lg) - 2px); }
        .preview-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; border-radius: calc(var(--radius-lg) - 2px); opacity: 0; transition: opacity 0.2s ease; color: white; font-size: 14px; font-weight: 700; }
        .drop-zone:hover .preview-overlay { opacity: 1; }
        .sensors-section { background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-sm); }
        .sensors-title { font-family: var(--font-display); font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
        .sensors-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 18px; }
        .sensors-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .sensor-label { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: var(--text-2); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .sensor-unit { margin-left: auto; font-size: 10px; color: var(--text-muted); font-weight: 400; text-transform: none; }
        .sensor-icon { font-size: 14px; }
        .sensor-input { width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; color: var(--text); background: var(--bg); outline: none; transition: var(--transition); box-sizing: border-box; }
        .sensor-input:focus { border-color: var(--fresh-green); background: white; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
        .sensor-input::placeholder { color: #c4d4bf; font-weight: 400; }
        .submit-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 16px; font-size: 16px; font-weight: 800; background: linear-gradient(135deg, #16a34a, #22c55e); color: white; border: none; border-radius: var(--radius-md); box-shadow: 0 8px 24px rgba(22,163,74,0.4); transition: var(--spring); letter-spacing: 0.3px; cursor: pointer; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(22,163,74,0.5); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .spinner { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin-slow 0.8s linear infinite; flex-shrink: 0; }
        .upload-right-panel { animation: fadeUp 0.6s ease 0.2s both; }
        .result-card { background: white; border-radius: var(--radius-lg); padding: 32px; border: 2px solid; box-shadow: var(--shadow-md); animation: fadeUp 0.5s ease both; }
        .result-fresh  { border-color: #86efac; background: linear-gradient(160deg, #f0fdf4, white); }
        .result-spoiled { border-color: #fca5a5; background: linear-gradient(160deg, #fef2f2, white); }
        .result-icon-wrap { text-align: center; margin-bottom: 10px; }
        .result-icon { font-size: 56px; }
        .result-verdict { font-family: var(--font-display); text-align: center; font-size: 32px; font-weight: 900; color: var(--text); margin-bottom: 6px; }
        .result-sub { text-align: center; font-size: 14px; color: var(--text-muted); margin-bottom: 24px; }
        .result-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
        .metric-card { background: var(--bg); border-radius: var(--radius-sm); padding: 14px; text-align: center; }
        .metric-value { font-family: var(--font-display); font-size: 26px; font-weight: 800; color: var(--text); margin-bottom: 2px; }
        .metric-label { font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .metric-bar { height: 6px; background: #e2e8f0; border-radius: 20px; overflow: hidden; }
        .metric-fill { height: 100%; border-radius: 20px; transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }
        .result-explanation { background: #f8fafc; border-left: 3px solid var(--fresh-green); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; padding: 12px 16px; font-size: 13px; color: var(--text-2); line-height: 1.6; margin-bottom: 14px; display: flex; gap: 10px; align-items: flex-start; }
        .expl-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
        .result-meta { text-align: center; font-size: 12px; color: var(--text-muted); }
        .error-card { background: #fef2f2; border: 1.5px solid #fecaca; border-radius: var(--radius-lg); padding: 32px; text-align: center; }
        .error-icon { font-size: 40px; margin-bottom: 10px; }
        .error-title { font-size: 18px; font-weight: 700; color: #991b1b; margin-bottom: 8px; }
        .error-msg { font-size: 14px; color: #b91c1c; }
        .tips-panel { background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-sm); }
        .tips-panel-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 18px; }
        .tip-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
        .tip-row:last-of-type { border: none; }
        .tip-icon { font-size: 20px; flex-shrink: 0; }
        .tip-text { font-size: 14px; font-weight: 500; color: var(--text-2); }
        @media (max-width: 900px) { .upload-page { padding: 24px 16px 40px; } .upload-layout { grid-template-columns: 1fr; } }
        @media (max-width: 500px) { .sensors-grid { grid-template-columns: 1fr; } .upload-title { font-size: 28px; } }
      `}</style>
    </div>
  );
}
