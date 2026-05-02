import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Helper: format timestamp ────────────────────────────
function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)} hr ago`;
}

function resultColor(result) {
  if (result === "Fresh")   return { bg: "#dcfce7", color: "#166534", border: "#86efac" };
  if (result === "At Risk") return { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
  return                           { bg: "#fef2f2", color: "#991b1b", border: "#fca5a5" };
}

function resultIcon(result) {
  if (result === "Fresh")   return "✅";
  if (result === "At Risk") return "⚠️";
  return "🚨";
}

// ─── Single detected item card ───────────────────────────
function ItemCard({ item, index }) {
  const { bg, color, border } = resultColor(item.result);
  return (
    <div style={{
      background: bg, border: `1.5px solid ${border}`,
      borderRadius: "14px", padding: "16px",
      animation: `fadeInCard 0.4s ease ${index * 60}ms both`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: "700", color: "#111" }}>{item.food_name}</div>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>{timeAgo(item.scanned_at)}</div>
        </div>
        <span style={{
          background: color, color: "white",
          padding: "4px 12px", borderRadius: "20px",
          fontSize: "11px", fontWeight: "700",
        }}>
          {resultIcon(item.result)} {item.result}
        </span>
      </div>
      {/* Confidence bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "20px", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "20px",
            width: `${item.confidence}%`,
            background: item.result === "Fresh" ? "#16a34a" : item.result === "At Risk" ? "#f97316" : "#dc2626",
            transition: "width 1s ease",
          }} />
        </div>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "#374151", minWidth: "36px" }}>
          {item.confidence}%
        </span>
      </div>
      {item.explanation && (
        <p style={{ fontSize: "12px", color: "#6b7280", margin: "8px 0 0", lineHeight: "1.5" }}>
          {item.explanation}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function FridgeMonitor({ user }) {
  const navigate   = useNavigate();
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const intervalRef = useRef(null);

  const [camReady,     setCamReady]     = useState(false);
  const [monitoring,   setMonitoring]   = useState(false);
  const [scanning,     setScanning]     = useState(false);
  const [foodName,     setFoodName]     = useState("");
  const [temperature,  setTemperature]  = useState(4);
  const [scanInterval, setScanInterval] = useState(30);   // seconds
  const [detectedItems, setDetectedItems] = useState([]);
  const [history,      setHistory]      = useState([]);
  const [lastScan,     setLastScan]     = useState(null);
  const [countdown,    setCountdown]    = useState(0);
  const [alertLog,     setAlertLog]     = useState([]);
  const [activeTab,    setActiveTab]    = useState("live"); // live | history

  // ── Start camera ────────────────────────────────────────
  useEffect(() => {
    startCamera();
    fetchHistory();
    return () => stopMonitoring();
  }, [user]);

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

  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res  = await fetch("http://127.0.0.1:8000/fridge/history?limit=30", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(data);
    } catch {}
  };

  // ── Single scan ──────────────────────────────────────────
  const runScan = useCallback(async () => {
    if (!camReady || scanning) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    setScanning(true);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob, "fridge_frame.jpg");
      formData.append("food_name",     foodName || "Fridge Item");
      formData.append("temperature",   temperature);
      formData.append("humidity",      65);
      formData.append("storage_hours", 24);

      try {
        const res  = await fetch("http://127.0.0.1:8000/fridge/scan", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();

        const newItem = {
          id:          Date.now(),
          food_name:   foodName || "Fridge Item",
          result:      data.result,
          confidence:  data.confidence,
          explanation: data.explanation,
          scanned_at:  data.scanned_at,
          email_sent:  data.email_sent,
        };

        setDetectedItems(prev => [newItem, ...prev].slice(0, 12));
        setLastScan(new Date());

        // Alert log
        if (data.result !== "Fresh") {
          setAlertLog(prev => [{
            id: Date.now(),
            food_name: foodName || "Fridge Item",
            result: data.result,
            time: new Date(),
            email_sent: data.email_sent,
          }, ...prev].slice(0, 10));
        }

        fetchHistory();
      } catch (err) {
        console.error("Fridge scan error:", err);
      } finally {
        setScanning(false);
      }
    }, "image/jpeg");
  }, [camReady, scanning, foodName, temperature]);

  // ── Start / stop auto monitoring ─────────────────────────
  const startMonitoring = () => {
    setMonitoring(true);
    setCountdown(scanInterval);
    runScan();   // immediate first scan
    let cd = scanInterval;
    intervalRef.current = setInterval(() => {
      cd -= 1;
      setCountdown(cd);
      if (cd <= 0) {
        runScan();
        cd = scanInterval;
        setCountdown(cd);
      }
    }, 1000);
  };

  const stopMonitoring = () => {
    setMonitoring(false);
    clearInterval(intervalRef.current);
    setCountdown(0);
  };

  // ── Stats ────────────────────────────────────────────────
  const freshCount   = detectedItems.filter(i => i.result === "Fresh").length;
  const atRiskCount  = detectedItems.filter(i => i.result === "At Risk").length;
  const spoiledCount = detectedItems.filter(i => i.result === "Spoiled").length;

  return (
    <div className="fridge-page">
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ── Background ── */}
      <div className="fridge-blob fridge-blob-1" />
      <div className="fridge-blob fridge-blob-2" />

      {/* ── NOT LOGGED IN: blurred overlay like Upload/Scanner ── */}
      {!user && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}>
          <div style={{
            background: "white", borderRadius: "20px", padding: "48px 40px",
            textAlign: "center", maxWidth: "400px", width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>❄️🔒</div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#111", marginBottom: "10px" }}>
              Login to Use Fridge Monitor
            </h2>
            <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "28px", lineHeight: "1.6" }}>
              Create a free account to start auto-monitoring your fridge and receive spoilage alerts.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <a href="/login"  style={{ flex: 1, padding: "12px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "12px", fontWeight: "700", fontSize: "15px", textDecoration: "none", textAlign: "center" }}>Login</a>
              <a href="/signup" style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "white", border: "none", borderRadius: "12px", fontWeight: "700", fontSize: "15px", textDecoration: "none", textAlign: "center" }}>Sign Up Free</a>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="fridge-header">
        <div className="fridge-tag">❄️ Automated Monitoring</div>
        <h1 className="fridge-title">Fridge Monitor</h1>
        <p className="fridge-subtitle">
          Point your camera at a food item — the system auto-scans and alerts you when something is spoiling.
        </p>
      </div>

      {/* ── Main Layout ── */}
      <div className="fridge-layout">

        {/* ── LEFT: Camera + Controls ── */}
        <div className="fridge-left">

          {/* Camera Frame */}
          <div className="fridge-cam-frame">
            {/* Corner brackets */}
            {["tl","tr","bl","br"].map(c => <div key={c} className={`fc-corner fc-${c}`} />)}

            {/* Scanning overlay */}
            {scanning && (
              <div className="fc-scanning-overlay">
                <div className="fc-ring fc-ring-1" />
                <div className="fc-ring fc-ring-2" />
                <div style={{ color: "#86efac", fontWeight: "700", fontSize: "15px", position: "relative", zIndex: 1 }}>
                  🔍 Analyzing...
                </div>
              </div>
            )}

            {/* Monitoring pulse border */}
            {monitoring && !scanning && <div className="fc-monitor-border" />}

            <video ref={videoRef} autoPlay playsInline muted className="fridge-video" />

            {/* Status badge */}
            <div className={`fc-status-badge ${monitoring ? "fc-status-active" : camReady ? "fc-status-ready" : "fc-status-connecting"}`}>
              <span className="fc-status-dot" />
              {monitoring ? `Auto-scanning · ${countdown}s` : camReady ? "Camera Ready" : "Connecting..."}
            </div>
          </div>

          {/* Food Name Input */}
          <div className="fridge-control-card">
            <label className="fridge-label">🥦 What are you monitoring?</label>
            <input
              type="text"
              placeholder="e.g. Apple, Tomato, Broccoli..."
              value={foodName}
              onChange={e => setFoodName(e.target.value)}
              className="fridge-input"
            />
          </div>

          {/* Settings Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="fridge-control-card">
              <label className="fridge-label">🌡️ Fridge Temp (°C)</label>
              <input
                type="number"
                value={temperature}
                onChange={e => setTemperature(Number(e.target.value))}
                className="fridge-input"
                placeholder="e.g. 4"
              />
            </div>
            <div className="fridge-control-card">
              <label className="fridge-label">⏱️ Scan every (sec)</label>
              <select
                value={scanInterval}
                onChange={e => setScanInterval(Number(e.target.value))}
                className="fridge-input"
                disabled={monitoring}
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {!monitoring ? (
              <button
                onClick={startMonitoring}
                disabled={!camReady}
                style={{
                  gridColumn: "1 / -1",
                  padding: "16px", fontSize: "16px", fontWeight: "800",
                  background: "linear-gradient(135deg,#0f766e,#0d9488,#14b8a6)",
                  color: "white", border: "none", borderRadius: "12px",
                  cursor: camReady ? "pointer" : "not-allowed",
                  opacity: camReady ? 1 : 0.6,
                  boxShadow: "0 8px 24px rgba(13,148,136,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                }}
              >
                ❄️ Start Fridge Monitor
              </button>
            ) : (
              <>
                <button
                  onClick={runScan}
                  disabled={scanning}
                  style={{
                    padding: "14px", fontSize: "14px", fontWeight: "700",
                    background: "#f0fdf4", color: "#16a34a",
                    border: "1.5px solid #86efac", borderRadius: "12px",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                >
                  {scanning ? "⏳ Scanning..." : "📷 Scan Now"}
                </button>
                <button
                  onClick={stopMonitoring}
                  style={{
                    padding: "14px", fontSize: "14px", fontWeight: "700",
                    background: "#fef2f2", color: "#dc2626",
                    border: "1.5px solid #fecaca", borderRadius: "12px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                >
                  ⏹ Stop Monitor
                </button>
              </>
            )}
          </div>

          {/* Stats Strip */}
          {detectedItems.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
              {[
                { label: "Fresh",   count: freshCount,   bg: "#dcfce7", color: "#166534" },
                { label: "At Risk", count: atRiskCount,  bg: "#fff7ed", color: "#c2410c" },
                { label: "Spoiled", count: spoiledCount, bg: "#fef2f2", color: "#991b1b" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: "12px", padding: "14px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: s.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Alert Log */}
          {alertLog.length > 0 && (
            <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "14px", padding: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#991b1b", marginBottom: "10px" }}>
                🚨 Alert Log ({alertLog.length})
              </div>
              {alertLog.map(a => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #fee2e2" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                    {resultIcon(a.result)} {a.food_name} — {a.result}
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{timeAgo(a.time)}</div>
                    {a.email_sent && <div style={{ fontSize: "10px", color: "#16a34a", fontWeight: "700" }}>📧 Email sent</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Detected Items + History ── */}
        <div className="fridge-right">

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "12px", padding: "4px", marginBottom: "16px" }}>
            {[
              { key: "live",    label: "🔴 Live Detections" },
              { key: "history", label: "📋 Full History" },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  flex: 1, padding: "10px", border: "none", borderRadius: "9px",
                  fontWeight: "700", fontSize: "13px", cursor: "pointer",
                  background: activeTab === t.key ? "white" : "transparent",
                  color: activeTab === t.key ? "#111" : "#6b7280",
                  boxShadow: activeTab === t.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Live Tab */}
          {activeTab === "live" && (
            <div>
              {detectedItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: "56px", marginBottom: "16px" }}>❄️</div>
                  <p style={{ fontWeight: "700", fontSize: "16px", color: "#374151", marginBottom: "6px" }}>
                    {monitoring ? "Scanning in progress..." : "No scans yet"}
                  </p>
                  <p style={{ fontSize: "13px", color: "#9ca3af" }}>
                    {monitoring
                      ? `Next scan in ${countdown} seconds`
                      : "Start monitoring to see live detections here"}
                  </p>
                  {monitoring && (
                    <div style={{ marginTop: "20px" }}>
                      <div className="fridge-pulse-ring" />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#374151" }}>
                      {detectedItems.length} item{detectedItems.length !== 1 ? "s" : ""} detected
                    </span>
                    {lastScan && (
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                        Last scan: {timeAgo(lastScan)}
                      </span>
                    )}
                  </div>
                  {detectedItems.map((item, i) => (
                    <ItemCard key={item.id} item={item} index={i} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "14px" }}>📋</div>
                  <p style={{ fontWeight: "700", fontSize: "15px", color: "#374151" }}>No history yet</p>
                  <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}>
                    Run your first fridge scan to see history here.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                    {history.length} total fridge scans
                  </div>
                  {history.map((item, i) => (
                    <div key={item.id} style={{
                      background: "white", border: "1px solid #e2e8f0",
                      borderRadius: "12px", padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: "14px",
                    }}>
                      <span style={{ fontSize: "24px" }}>
                        {item.result === "Fresh" ? "✅" : item.result === "At Risk" ? "⚠️" : "🚨"}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#111" }}>{item.food_name}</div>
                        <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{timeAgo(item.scanned_at)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "20px",
                          background: resultColor(item.result).bg,
                          color: resultColor(item.result).color,
                        }}>
                          {item.result}
                        </div>
                        <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>{item.confidence}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .fridge-page {
          min-height: 100vh; padding: 40px 40px 60px;
          background: var(--bg, #f8fafc); position: relative; overflow-x: hidden;
        }
        .fridge-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; opacity: 0.3; }
        .fridge-blob-1 { width: 450px; height: 450px; background: radial-gradient(circle, #99f6e4, transparent); top: -80px; right: -60px; animation: blob 12s ease-in-out infinite; }
        .fridge-blob-2 { width: 380px; height: 380px; background: radial-gradient(circle, #bbf7d0, transparent); bottom: 100px; left: -60px; animation: blob 10s ease-in-out infinite reverse; }

        .fridge-header { position: relative; z-index: 1; text-align: center; margin-bottom: 36px; animation: fadeUp 0.5s ease both; }
        .fridge-tag { display: inline-flex; align-items: center; gap: 8px; background: white; border: 1px solid #99f6e4; padding: 6px 16px; border-radius: 50px; font-size: 12px; font-weight: 700; color: #0f766e; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .fridge-title { font-size: 38px; font-weight: 900; color: #111; letter-spacing: -1px; margin-bottom: 10px; }
        .fridge-subtitle { font-size: 15px; color: #6b7280; max-width: 520px; margin: 0 auto; line-height: 1.7; }

        .fridge-layout { position: relative; z-index: 1; display: grid; grid-template-columns: 1.1fr 1fr; gap: 28px; max-width: 1100px; margin: 0 auto; }

        .fridge-left { display: flex; flex-direction: column; gap: 16px; animation: fadeUp 0.6s ease 0.1s both; }

        .fridge-cam-frame {
          position: relative; background: #0a1628; border-radius: 20px;
          overflow: hidden; aspect-ratio: 16/10;
          box-shadow: 0 12px 48px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.05);
        }
        .fridge-video { width: 100%; height: 100%; object-fit: cover; display: block; }

        .fc-corner { position: absolute; width: 28px; height: 28px; border-color: #14b8a6; border-style: solid; z-index: 2; }
        .fc-tl { top: 12px; left: 12px; border-width: 3px 0 0 3px; border-radius: 6px 0 0 0; }
        .fc-tr { top: 12px; right: 12px; border-width: 3px 3px 0 0; border-radius: 0 6px 0 0; }
        .fc-bl { bottom: 12px; left: 12px; border-width: 0 0 3px 3px; border-radius: 0 0 0 6px; }
        .fc-br { bottom: 12px; right: 12px; border-width: 0 3px 3px 0; border-radius: 0 0 6px 0; }

        .fc-scanning-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; z-index: 4; }
        .fc-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(20,184,166,0.5); }
        .fc-ring-1 { width: 120px; height: 120px; animation: ripple 1.5s ease-out infinite; }
        .fc-ring-2 { width: 75px; height: 75px; animation: ripple 1.5s ease-out 0.5s infinite; }

        .fc-monitor-border { position: absolute; inset: 0; border: 3px solid rgba(20,184,166,0.6); border-radius: 20px; animation: monitorPulse 2s ease-in-out infinite; z-index: 3; pointer-events: none; }
        @keyframes monitorPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

        .fc-status-badge { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 7px; padding: 6px 16px; border-radius: 50px; font-size: 12px; font-weight: 700; z-index: 3; white-space: nowrap; }
        .fc-status-active      { background: rgba(13,148,136,0.9); color: white; }
        .fc-status-ready       { background: rgba(22,163,74,0.85); color: white; }
        .fc-status-connecting  { background: rgba(245,158,11,0.85); color: white; }
        .fc-status-dot { width: 7px; height: 7px; border-radius: 50%; background: white; animation: pulse-dot 1.5s ease-in-out infinite; }

        .fridge-control-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .fridge-label { display: block; font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .fridge-input { width: 100%; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #374151; outline: none; background: #f8fafc; box-sizing: border-box; }
        .fridge-input:focus { border-color: #14b8a6; background: white; }

        .fridge-right { animation: fadeUp 0.6s ease 0.2s both; }

        .fridge-pulse-ring { width: 60px; height: 60px; border-radius: 50%; border: 3px solid rgba(13,148,136,0.4); margin: 0 auto; animation: ripple 1.5s ease-out infinite; }

        @keyframes fadeInCard { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ripple { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        @keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.4); } }
        @keyframes blob { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(20px,-20px) scale(1.05); } 66% { transform:translate(-15px,10px) scale(0.96); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        @media (max-width: 900px) {
          .fridge-page { padding: 24px 16px 40px; }
          .fridge-layout { grid-template-columns: 1fr; }
          .fridge-title { font-size: 28px; }
        }
      `}</style>
    </div>
  );
}
