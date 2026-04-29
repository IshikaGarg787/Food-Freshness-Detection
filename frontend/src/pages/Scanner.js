import { useRef, useEffect, useState } from "react";

export default function Scanner() {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [camReady, setCamReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [foodName, setFoodName] = useState("");          // NEW

  const temperature   = 25;
  const humidity      = 60;
  const storage_hours = 10;

  useEffect(() => { startCamera(); }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => setCamReady(true);
    } catch {
      alert("Camera access denied — please allow camera permissions.");
    }
  };

  const captureAndPredict = async () => {
    if (!camReady) return;

    const token = localStorage.getItem("token");
    if (!token) { alert("Please login first"); return; }

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    setScanning(true);
    setLoading(true);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob, "scan.jpg");
      formData.append("temperature", temperature);
      formData.append("humidity",    humidity);
      formData.append("storage_hours", storage_hours);
      formData.append("food_name", foodName || "Live Scan"); // NEW

      try {
        const res = await fetch("http://localhost:8000/predict", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },   // NEW: send token
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
      }
      setLoading(false);
      setScanning(false);
    }, "image/jpeg");
  };

  const isFresh = result && result.result && result.result.toLowerCase().includes("fresh");

  return (
    <div className="scanner-page">

      <div className="scanner-blob scanner-blob-1" />
      <div className="scanner-blob scanner-blob-2" />

      {/* ── Header ── */}
      <div className="scanner-header">
        <div className="scanner-tag">📷 Live Camera Mode</div>
        <h1 className="scanner-title">Live Food Scanner</h1>
        <p className="scanner-subtitle">
          Point your camera at any fruit or vegetable and tap <strong>Scan</strong> to get an instant freshness reading.
        </p>
      </div>

      <div className="scanner-layout">

        {/* ── Camera Panel ── */}
        <div className="camera-panel">
          <div className="camera-frame">
            <div className="corner corner-tl" />
            <div className="corner corner-tr" />
            <div className="corner corner-bl" />
            <div className="corner corner-br" />

            {scanning && <div className="scan-line" />}
            {scanning && (
              <div className="scanning-overlay">
                <div className="scanning-ring scanning-ring-1" />
                <div className="scanning-ring scanning-ring-2" />
                <div className="scanning-text">🔍 Analyzing...</div>
              </div>
            )}

            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <div className={`cam-status ${camReady ? "cam-ready" : "cam-loading"}`}>
              <span className="cam-dot" />
              {camReady ? "Camera Live" : "Connecting..."}
            </div>
          </div>

          {/* Food name input — NEW */}
          <div style={{
            background: "white", borderRadius: "12px",
            border: "1px solid #e2e8f0", padding: "14px 18px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", gap: "10px"
          }}>
            <span style={{ fontSize: "20px" }}>🥦</span>
            <input
              type="text"
              placeholder="What food are you scanning? (e.g. Apple)"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: "14px", fontWeight: "500", color: "#374151",
                background: "transparent",
              }}
            />
          </div>

          {/* Sensor Indicators */}
          <div className="sensor-strip">
            <div className="sensor-pill">
              <span>🌡️</span>
              <div>
                <div className="pill-val">{temperature}°C</div>
                <div className="pill-lbl">Temp</div>
              </div>
            </div>
            <div className="sensor-pill">
              <span>💧</span>
              <div>
                <div className="pill-val">{humidity}%</div>
                <div className="pill-lbl">Humidity</div>
              </div>
            </div>
            <div className="sensor-pill">
              <span>⏱️</span>
              <div>
                <div className="pill-val">{storage_hours}h</div>
                <div className="pill-lbl">Storage</div>
              </div>
            </div>
          </div>

          {/* Scan Button */}
          <button
            className={`scan-btn ${loading ? "scan-btn-loading" : ""}`}
            onClick={captureAndPredict}
            disabled={loading || !camReady}
          >
            <div className="scan-btn-inner">
              {loading ? (
                <><span className="scan-spinner" /> Scanning...</>
              ) : (
                <><span className="scan-shutter">⚡</span> Scan Now</>
              )}
            </div>
          </button>
        </div>

        {/* ── Result Panel ── */}
        <div className="scanner-right">

          {result && !result.error && (
            <div className={`scanner-result ${isFresh ? "sr-fresh" : "sr-spoiled"}`}>
              <div className="sr-top">
                <div className="sr-verdict-icon">{isFresh ? "✅" : "🚨"}</div>
                <div className="sr-verdict">{result.result}</div>
                <div className="sr-desc">
                  {isFresh
                    ? "This food appears to be in good condition."
                    : "This food may have degraded quality or spoilage."}
                </div>
              </div>

              <div className="sr-bars">
                <div className="sr-bar-row">
                  <span>Visual Confidence</span>
                  <span>{result.visual_confidence}%</span>
                </div>
                <div className="sr-bar-track">
                  <div className="sr-bar-fill" style={{ width: `${result.visual_confidence}%`, background: isFresh ? "#16a34a" : "#dc2626" }} />
                </div>

                <div className="sr-bar-row" style={{ marginTop: "14px" }}>
                  <span>Adjusted Confidence</span>
                  <span>{(result.adjusted_confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="sr-bar-track">
                  <div className="sr-bar-fill" style={{ width: `${(result.adjusted_confidence * 100).toFixed(0)}%`, background: isFresh ? "#84cc16" : "#f97316" }} />
                </div>
              </div>

              {result.explanation && (
                <div className="sr-expl">
                  <span>💬</span>
                  <span>{result.explanation}</span>
                </div>
              )}

              <div className="sr-footer">
                ⚡ <strong>{result.latency_ms} ms</strong> response time
              </div>

              {/* Saved notice — NEW */}
              <div style={{ marginTop: "12px", textAlign: "center", fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>
                ✅ Scan saved to your dashboard
              </div>
            </div>
          )}

          {result && result.error && (
            <div className="sr-error">⚠️ {result.error}</div>
          )}

          {!result && (
            <div className="scanner-guide">
              <h3 className="guide-title">📋 Scanning Guide</h3>
              {[
                { icon: "🎯", text: "Center the food item in frame" },
                { icon: "☀️", text: "Ensure good lighting conditions" },
                { icon: "📏", text: "Keep 20–30 cm distance" },
                { icon: "🚫", text: "Avoid backgrounds with similar colors" },
                { icon: "✋", text: "Hold steady when scanning" },
              ].map(({ icon, text }) => (
                <div key={text} className="guide-row">
                  <span className="guide-icon">{icon}</span>
                  <span className="guide-text">{text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scanner-page { min-height: 100vh; padding: 40px 40px 60px; background: var(--bg); position: relative; overflow-x: hidden; }
        .scanner-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; opacity: 0.3; }
        .scanner-blob-1 { width: 400px; height: 400px; background: radial-gradient(circle, #a7f3d0, transparent); top: -60px; left: -60px; animation: blob 12s ease-in-out infinite; }
        .scanner-blob-2 { width: 350px; height: 350px; background: radial-gradient(circle, #fde68a, transparent); bottom: 100px; right: -40px; animation: blob 10s ease-in-out infinite reverse; }
        .scanner-header { position: relative; z-index: 1; text-align: center; margin-bottom: 36px; animation: fadeUp 0.5s ease both; }
        .scanner-tag { display: inline-flex; align-items: center; gap: 8px; background: white; border: 1px solid #bbf7d0; padding: 6px 16px; border-radius: 50px; font-size: 12px; font-weight: 700; color: var(--fresh-green); margin-bottom: 14px; box-shadow: var(--shadow-sm); }
        .scanner-title { font-family: var(--font-display); font-size: 38px; font-weight: 900; color: var(--text); letter-spacing: -1px; margin-bottom: 10px; }
        .scanner-subtitle { font-size: 15px; color: var(--text-2); max-width: 480px; margin: 0 auto; line-height: 1.7; }
        .scanner-layout { position: relative; z-index: 1; display: grid; grid-template-columns: 1.2fr 1fr; gap: 28px; max-width: 1100px; margin: 0 auto; }
        .camera-panel { display: flex; flex-direction: column; gap: 18px; animation: fadeUp 0.6s ease 0.1s both; }
        .camera-frame { position: relative; background: #0f1a0f; border-radius: 20px; overflow: hidden; aspect-ratio: 16/10; box-shadow: 0 12px 48px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.05); }
        .camera-video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .corner { position: absolute; width: 28px; height: 28px; border-color: #22c55e; border-style: solid; z-index: 2; }
        .corner-tl { top: 12px; left: 12px; border-width: 3px 0 0 3px; border-radius: 6px 0 0 0; }
        .corner-tr { top: 12px; right: 12px; border-width: 3px 3px 0 0; border-radius: 0 6px 0 0; }
        .corner-bl { bottom: 12px; left: 12px; border-width: 0 0 3px 3px; border-radius: 0 0 0 6px; }
        .corner-br { bottom: 12px; right: 12px; border-width: 0 3px 3px 0; border-radius: 0 0 6px 0; }
        .scan-line { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #22c55e, #86efac, #22c55e, transparent); box-shadow: 0 0 12px #22c55e; animation: scanLine 1.5s ease-in-out infinite; z-index: 3; }
        @keyframes scanLine { 0% { top: 10%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 90%; opacity: 0; } }
        .scanning-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.45); z-index: 4; }
        .scanning-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(34,197,94,0.5); }
        .scanning-ring-1 { width: 120px; height: 120px; animation: ripple 1.5s ease-out infinite; }
        .scanning-ring-2 { width: 80px; height: 80px; animation: ripple 1.5s ease-out 0.5s infinite; }
        .scanning-text { color: #86efac; font-size: 15px; font-weight: 700; position: relative; z-index: 1; }
        .cam-status { position: absolute; top: 16px; right: 16px; display: flex; align-items: center; gap: 7px; padding: 5px 12px; border-radius: 50px; font-size: 11px; font-weight: 700; z-index: 3; }
        .cam-ready { background: rgba(22,163,74,0.85); color: white; }
        .cam-loading { background: rgba(245,158,11,0.85); color: white; }
        .cam-dot { width: 7px; height: 7px; border-radius: 50%; background: white; animation: pulse-green 1.5s ease-in-out infinite; }
        .sensor-strip { display: flex; gap: 12px; justify-content: center; }
        .sensor-pill { display: flex; align-items: center; gap: 10px; background: white; border: 1px solid var(--border); border-radius: 50px; padding: 10px 18px; font-size: 20px; flex: 1; max-width: 160px; box-shadow: var(--shadow-sm); transition: var(--transition); }
        .sensor-pill:hover { border-color: var(--fresh-green); box-shadow: var(--shadow-md); }
        .pill-val { font-size: 15px; font-weight: 800; color: var(--text); line-height: 1; }
        .pill-lbl { font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .scan-btn { position: relative; overflow: hidden; width: 100%; padding: 20px; font-size: 18px; font-weight: 800; background: linear-gradient(135deg, #15803d, #16a34a, #22c55e); color: white; border: none; border-radius: var(--radius-md); box-shadow: 0 8px 28px rgba(22,163,74,0.45); transition: var(--spring); cursor: pointer; }
        .scan-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(22,163,74,0.55); }
        .scan-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .scan-btn-inner { display: flex; align-items: center; justify-content: center; gap: 10px; }
        .scan-shutter { font-size: 20px; animation: float 2s ease-in-out infinite; }
        .scan-spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin-slow 0.7s linear infinite; }
        .scanner-right { animation: fadeUp 0.6s ease 0.2s both; }
        .scanner-result { background: white; border: 2px solid; border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-md); animation: fadeUp 0.5s ease both; }
        .sr-fresh { border-color: #86efac; }
        .sr-spoiled { border-color: #fca5a5; }
        .sr-top { text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
        .sr-verdict-icon { font-size: 52px; margin-bottom: 8px; }
        .sr-verdict { font-family: var(--font-display); font-size: 30px; font-weight: 900; color: var(--text); margin-bottom: 6px; }
        .sr-desc { font-size: 13px; color: var(--text-muted); }
        .sr-bars { margin-bottom: 20px; }
        .sr-bar-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; color: var(--text-2); margin-bottom: 6px; }
        .sr-bar-track { height: 8px; background: #e2e8f0; border-radius: 20px; overflow: hidden; }
        .sr-bar-fill { height: 100%; border-radius: 20px; transition: width 1.3s cubic-bezier(0.4,0,0.2,1); }
        .sr-expl { display: flex; gap: 10px; background: #f8fafc; border-left: 3px solid var(--fresh-green); border-radius: 0 8px 8px 0; padding: 12px 14px; font-size: 13px; color: var(--text-2); line-height: 1.6; margin-bottom: 16px; }
        .sr-footer { text-align: center; font-size: 12px; color: var(--text-muted); }
        .sr-error { background: #fef2f2; border: 1.5px solid #fecaca; border-radius: var(--radius-md); padding: 24px; text-align: center; font-size: 14px; color: #b91c1c; font-weight: 600; }
        .scanner-guide { background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-sm); }
        .guide-title { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 18px; }
        .guide-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
        .guide-row:last-of-type { border: none; }
        .guide-icon { font-size: 20px; flex-shrink: 0; }
        .guide-text { font-size: 14px; font-weight: 500; color: var(--text-2); }
        @media (max-width: 900px) {
          .scanner-page { padding: 24px 16px 40px; }
          .scanner-layout { grid-template-columns: 1fr; }
          .sensor-strip { flex-wrap: wrap; }
          .scanner-title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
}
