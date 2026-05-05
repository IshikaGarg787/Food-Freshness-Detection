export default function About() {
  const stack = [
    { label: "React.js",      cat: "Frontend",       emoji: "⚛️",  color: "#06b6d4" },
    { label: "FastAPI",       cat: "Backend",        emoji: "🐍",  color: "#059669" },
    { label: "TensorFlow",    cat: "ML Framework",   emoji: "🧠",  color: "#f59e0b" },
    { label: "Python",        cat: "Language",       emoji: "🐍",  color: "#3b82f6" },
    { label: "CNN Model",     cat: "Architecture",   emoji: "🔬",  color: "#8b5cf6" },
    { label: "Sensor Fusion", cat: "Data Pipeline",  emoji: "📡",  color: "#f97316" },
  ];

  const steps = [
    { n: "01", icon: "📸", title: "Capture or Upload",  desc: "Take a live photo using the camera scanner or upload a saved image of any food item." },
    { n: "02", icon: "🌡️", title: "Add Sensor Data",   desc: "Input temperature, humidity, and storage hours to enrich the prediction context." },
    { n: "03", icon: "🧠", title: "AI Analysis",         desc: "A CNN model extracts visual features and fuses them with sensor readings for predictions." },
    { n: "04", icon: "📊", title: "Get Your Result",     desc: "Receive a Fresh/Spoiled verdict with confidence scores and a human-readable explanation." },
  ];

  const features = [
    {
      icon: "📸",
      title: "Smart Food Scanner",
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      desc: "Upload or capture any food item. Our CNN model visually analyzes it and fuses the result with temperature, humidity, and storage data for an accurate freshness verdict."
    },
    {
      icon: "❄️",
      title: "Fridge Monitor",
      color: "#0f766e",
      bg: "#f0fdfa",
      border: "#99f6e4",
      desc: "Point your camera at fridge items for automated, continuous monitoring. The system scans at set intervals and instantly emails you when something is spoiling or at risk — so nothing goes to waste."
    },
    {
      icon: "📋",
      title: "Scan History",
      color: "#7c3aed",
      bg: "#faf5ff",
      border: "#ddd6fe",
      desc: "Every scan is saved to your personal dashboard. Track freshness trends, review past results, and make smarter decisions about your food over time."
    },
    {
      icon: "🔔",
      title: "Email Alerts",
      color: "#c2410c",
      bg: "#fff7ed",
      border: "#fed7aa",
      desc: "Get instant email notifications whenever the fridge monitor detects a spoiled or at-risk item — so you're always informed, even when away from the screen."
    },
  ];

  return (
    <div className="about-page">

      <div className="about-blob about-blob-1" />
      <div className="about-blob about-blob-2" />
      <div className="about-blob about-blob-3" />

      {/* ── Hero ── */}
      <div className="about-hero">
        <div className="about-tag">🌿 Open Source Project</div>
        <h1 className="about-title">
          About <span className="about-title-accent">FreshScan AI</span>
        </h1>
        <p className="about-intro">
          FreshScan AI is a semester-end academic project that combines computer vision
          and IoT sensor data to build a practical, real-world food freshness classifier —
          now with an automated Fridge Monitor that keeps watch so you don't have to.
        </p>
      </div>

      {/* ── Mission ── */}
      <div className="mission-banner">
        <div className="mission-accent-bar" />
        <div className="mission-inner">
          <div className="mission-icon-wrap">
            <div className="mission-icon">🎯</div>
          </div>
          <div className="mission-content">
            <div className="mission-eyebrow">Our Purpose</div>
            <div className="mission-title">Our Mission</div>
            <div className="mission-text">
              Reduce food waste and improve food safety using accessible AI technology —
              so everyone knows exactly when their produce is at its freshest,
              and gets alerted before anything spoils.
            </div>
            <div className="mission-pills">
              <span className="mission-pill">🌱 Reduce Waste</span>
              <span className="mission-pill">🤖 AI-Powered</span>
              <span className="mission-pill">🛡️ Food Safety</span>
              <span className="mission-pill">❄️ Fridge Monitor</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="section">
        <div className="section-label">✨ Features</div>
        <h2 className="section-heading">What FreshScan Can Do</h2>
        <div className="features-grid">
          {features.map(({ icon, title, color, bg, border, desc }) => (
            <div key={title} className="feature-card" style={{ "--fc": color, "--fb": bg, "--fborder": border }}>
              <div className="feature-icon-wrap">
                <span className="feature-icon">{icon}</span>
              </div>
              <div className="feature-title">{title}</div>
              <div className="feature-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it Works ── */}
      <div className="section">
        <div className="section-label">⚙️ Process</div>
        <h2 className="section-heading">How FreshScan Works</h2>
        <div className="steps-grid">
          {steps.map(({ n, icon, title, desc }) => (
            <div key={n} className="step-card">
              <div className="step-num">{n}</div>
              <div className="step-icon">{icon}</div>
              <div className="step-title">{title}</div>
              <div className="step-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fridge Monitor Highlight ── */}
      <div className="fridge-highlight">
        <div className="fh-left">
          <div className="fh-badge">❄️ New Feature</div>
          <h2 className="fh-title">Automated Fridge Monitor</h2>
          <p className="fh-desc">
            Stop manually checking your fridge. The Fridge Monitor uses your device camera
            to continuously watch your food at customizable intervals — every 15 seconds,
            every minute, or every 5 minutes. The moment something is detected as
            <strong> Spoiled</strong> or <strong>At Risk</strong>, you get an instant
            email alert with actionable tips.
          </p>
          <div className="fh-list">
            {[
              "🎥 Live camera feed with auto-scan",
              "⏱️ Configurable scan intervals (15s – 5min)",
              "📧 Instant email alerts for spoiled items",
              "📋 Full fridge scan history",
              "🌡️ Fridge temperature-aware risk scoring",
            ].map(item => (
              <div key={item} className="fh-item">{item}</div>
            ))}
          </div>
        </div>
        <div className="fh-right">
          <div className="fh-mockup">
            <div className="fh-mockup-header">
              <span className="fh-dot fh-dot-r" /><span className="fh-dot fh-dot-y" /><span className="fh-dot fh-dot-g" />
              <span className="fh-mockup-title">Fridge Monitor</span>
            </div>
            <div className="fh-cam">
              <div className="fh-cam-label">❄️ Camera Feed</div>
              <div className="fh-scan-line" />
              {["tl","tr","bl","br"].map(c => <div key={c} className={`fh-corner fh-${c}`} />)}
            </div>
            <div className="fh-results">
              {[
                { name: "Apple",    result: "Fresh",   color: "#16a34a", bg: "#dcfce7", icon: "✅" },
                { name: "Tomato",   result: "At Risk", color: "#c2410c", bg: "#fff7ed", icon: "⚠️" },
                { name: "Broccoli", result: "Spoiled", color: "#991b1b", bg: "#fef2f2", icon: "🚨" },
              ].map(item => (
                <div key={item.name} className="fh-result-row" style={{ background: item.bg }}>
                  <span style={{ fontSize: "14px" }}>{item.icon}</span>
                  <span className="fh-result-name">{item.name}</span>
                  <span className="fh-result-badge" style={{ color: item.color }}>
                    {item.result}
                  </span>
                  {item.result !== "Fresh" && (
                    <span className="fh-email-tag">📧</span>
                  )}
                </div>
              ))}
            </div>
            <div className="fh-status">
              <span className="fh-status-dot" />
              Auto-scanning · 28s
            </div>
          </div>
        </div>
      </div>

      {/* ── Tech Stack ── */}
      <div className="section">
        <div className="section-label">🛠️ Technology</div>
        <h2 className="section-heading">Built With</h2>
        <div className="stack-grid">
          {stack.map(({ label, cat, emoji, color }) => (
            <div key={label} className="stack-card" style={{ "--c": color }}>
              <div className="stack-icon" style={{ background: `${color}18`, color }}>{emoji}</div>
              <div>
                <div className="stack-label">{label}</div>
                <div className="stack-cat">{cat}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer Banner ── */}
      <div className="about-footer-banner">
        <div className="afb-glow" />
        <div className="afb-badge">FreshScan AI</div>
        <h3 className="afb-title">Built for Better Food Safety</h3>
        <p className="afb-sub">
          A semester project by passionate students. Reducing food waste, one scan at a time —
          now with 24/7 fridge monitoring.
        </p>
      </div>

      <style>{`
        .about-page {
          min-height: 100vh; padding: 40px 40px 60px;
          background: var(--bg); position: relative; overflow-x: hidden;
        }

        /* Blobs */
        .about-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; opacity: 0.3; }
        .about-blob-1 { width: 450px; height: 450px; background: radial-gradient(circle, #bbf7d0, transparent); top: -80px; right: -80px; animation: blob 12s ease-in-out infinite; }
        .about-blob-2 { width: 350px; height: 350px; background: radial-gradient(circle, #fde68a, transparent); bottom: 200px; left: -60px; animation: blob 9s ease-in-out infinite reverse; }
        .about-blob-3 { width: 280px; height: 280px; background: radial-gradient(circle, #c7d2fe, transparent); top: 40%; left: 40%; animation: blob 14s ease-in-out infinite 3s; }

        /* Hero */
        .about-hero { position: relative; z-index: 1; text-align: center; padding: 60px 20px 50px; animation: fadeUp 0.6s ease both; }
        .about-tag { display: inline-flex; align-items: center; gap: 8px; background: white; border: 1px solid #bbf7d0; padding: 6px 18px; border-radius: 50px; font-size: 12px; font-weight: 700; color: var(--fresh-green); margin-bottom: 16px; box-shadow: var(--shadow-sm); }
        .about-title { font-family: var(--font-display); font-size: 50px; font-weight: 900; color: var(--text); letter-spacing: -2px; margin-bottom: 18px; line-height: 1.1; }
        .about-title-accent { background: linear-gradient(135deg, #16a34a, #84cc16, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .about-intro { font-size: 16px; color: var(--text-2); max-width: 600px; margin: 0 auto; line-height: 1.8; }

        /* Mission */
        .mission-banner { position: relative; z-index: 1; background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 0; margin: 0 auto 48px; max-width: 900px; box-shadow: 0 4px 24px rgba(0,0,0,0.07); overflow: hidden; animation: fadeUp 0.6s ease 0.1s both; }
        .mission-accent-bar { height: 4px; background: linear-gradient(90deg, #16a34a, #84cc16, #0ea5e9, #8b5cf6); width: 100%; }
        .mission-inner { display: flex; align-items: flex-start; gap: 24px; padding: 30px 36px; }
        .mission-icon-wrap { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1.5px solid #bbf7d0; border-radius: 16px; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mission-icon { font-size: 30px; }
        .mission-content { flex: 1; }
        .mission-eyebrow { font-size: 10px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: #16a34a; margin-bottom: 4px; }
        .mission-title { font-family: var(--font-display); font-size: 22px; font-weight: 900; color: var(--text); margin-bottom: 10px; }
        .mission-text { font-size: 15px; color: var(--text-2); line-height: 1.75; margin-bottom: 16px; }
        .mission-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .mission-pill { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 50px; }

        /* Features */
        .features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .feature-card { background: var(--fb); border: 1.5px solid var(--fborder); border-radius: 18px; padding: 28px 24px; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .feature-card:hover { transform: translateY(-5px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
        .feature-icon-wrap { width: 52px; height: 52px; background: white; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); border: 1.5px solid var(--fborder); }
        .feature-icon { font-size: 26px; }
        .feature-title { font-size: 17px; font-weight: 800; color: var(--fc); margin-bottom: 10px; }
        .feature-desc { font-size: 14px; color: #4b5563; line-height: 1.7; }

        /* Sections */
        .section { position: relative; z-index: 1; max-width: 1000px; margin: 0 auto 52px; animation: fadeUp 0.6s ease 0.15s both; }
        .section-label { font-size: 11px; font-weight: 800; color: var(--fresh-green); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
        .section-heading { font-family: var(--font-display); font-size: 30px; font-weight: 800; color: var(--text); margin-bottom: 28px; letter-spacing: -0.5px; }

        /* Steps */
        .steps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .step-card { background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 26px 22px; position: relative; overflow: hidden; box-shadow: var(--shadow-sm); transition: var(--spring); }
        .step-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-md); border-color: #86efac; }
        .step-num { font-family: var(--font-display); font-size: 44px; font-weight: 900; color: #f0fdf4; position: absolute; top: 12px; right: 16px; line-height: 1; pointer-events: none; user-select: none; }
        .step-icon { font-size: 28px; margin-bottom: 14px; }
        .step-title { font-size: 15px; font-weight: 800; color: var(--text); margin-bottom: 8px; }
        .step-desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

        /* Fridge Highlight */
        .fridge-highlight {
          position: relative; z-index: 1;
          display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;
          max-width: 1000px; margin: 0 auto 56px;
          background: linear-gradient(135deg, #f0fdfa, #ecfdf5);
          border: 1.5px solid #99f6e4; border-radius: 24px; padding: 44px;
          animation: fadeUp 0.6s ease 0.2s both;
          overflow: hidden;
        }
        .fridge-highlight::before {
          content: ''; position: absolute; top: -40px; right: -40px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(20,184,166,0.15), transparent);
          border-radius: 50%; pointer-events: none;
        }
        .fh-badge { display: inline-block; background: rgba(13,148,136,0.12); border: 1px solid #99f6e4; color: #0f766e; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; padding: 5px 14px; border-radius: 50px; margin-bottom: 16px; }
        .fh-title { font-family: var(--font-display); font-size: 28px; font-weight: 900; color: #0f172a; margin-bottom: 14px; letter-spacing: -0.5px; }
        .fh-desc { font-size: 14px; color: #374151; line-height: 1.75; margin-bottom: 20px; }
        .fh-list { display: flex; flex-direction: column; gap: 8px; }
        .fh-item { font-size: 13px; font-weight: 600; color: #1e293b; background: white; border: 1px solid #ccfbf1; border-radius: 8px; padding: 8px 14px; }

        /* Fridge Mockup */
        .fh-right { display: flex; justify-content: center; }
        .fh-mockup { background: #0a1628; border-radius: 16px; padding: 16px; width: 100%; max-width: 280px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
        .fh-mockup-header { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
        .fh-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .fh-dot-r { background: #ef4444; }
        .fh-dot-y { background: #f59e0b; }
        .fh-dot-g { background: #22c55e; }
        .fh-mockup-title { font-size: 11px; font-weight: 700; color: #94a3b8; margin-left: 6px; flex: 1; text-align: center; }
        .fh-cam { position: relative; background: #0f2027; border-radius: 10px; height: 110px; margin-bottom: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .fh-cam-label { font-size: 11px; color: #14b8a6; font-weight: 700; position: relative; z-index: 2; }
        .fh-scan-line { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #14b8a6, transparent); animation: scanLine 2s ease-in-out infinite; }
        @keyframes scanLine { 0% { top: 10%; } 100% { top: 90%; } }
        .fh-corner { position: absolute; width: 16px; height: 16px; border-color: #14b8a6; border-style: solid; }
        .fh-tl { top: 8px; left: 8px; border-width: 2px 0 0 2px; border-radius: 4px 0 0 0; }
        .fh-tr { top: 8px; right: 8px; border-width: 2px 2px 0 0; border-radius: 0 4px 0 0; }
        .fh-bl { bottom: 8px; left: 8px; border-width: 0 0 2px 2px; border-radius: 0 0 0 4px; }
        .fh-br { bottom: 8px; right: 8px; border-width: 0 2px 2px 0; border-radius: 0 0 4px 0; }
        .fh-results { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .fh-result-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; }
        .fh-result-name { font-size: 12px; font-weight: 700; color: #1e293b; flex: 1; }
        .fh-result-badge { font-size: 11px; font-weight: 800; }
        .fh-email-tag { font-size: 11px; }
        .fh-status { display: flex; align-items: center; gap: 7px; background: rgba(13,148,136,0.15); border-radius: 8px; padding: 8px 12px; font-size: 11px; color: #14b8a6; font-weight: 700; }
        .fh-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #14b8a6; animation: pulse-dot 1.5s ease-in-out infinite; }
        @keyframes pulse-dot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.4); } }

        /* Stack */
        .stack-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .stack-card { background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 22px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow-sm); transition: var(--spring); }
        .stack-card:hover { transform: translateX(4px); border-color: var(--c); box-shadow: var(--shadow-md); }
        .stack-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; transition: var(--spring); }
        .stack-card:hover .stack-icon { transform: scale(1.15) rotate(8deg); }
        .stack-label { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
        .stack-cat { font-size: 12px; color: var(--text-muted); font-weight: 600; }

        /* Footer Banner */
        .about-footer-banner { position: relative; z-index: 1; background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%); border-radius: 24px; padding: 52px 44px; text-align: center; max-width: 1000px; margin: 0 auto; overflow: hidden; animation: fadeUp 0.6s ease 0.3s both; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
        .afb-glow { position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 400px; height: 200px; background: radial-gradient(ellipse, rgba(22,163,74,0.35), transparent 70%); pointer-events: none; }
        .afb-badge { display: inline-block; background: rgba(22,163,74,0.15); border: 1px solid rgba(22,163,74,0.4); color: #4ade80; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; padding: 5px 16px; border-radius: 50px; margin-bottom: 18px; }
        .afb-title { font-family: var(--font-display); font-size: 30px; font-weight: 900; color: white; margin-bottom: 12px; letter-spacing: -0.5px; }
        .afb-sub { font-size: 15px; color: #94a3b8; line-height: 1.7; max-width: 500px; margin: 0 auto; }

        /* Animations */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blob { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(20px,-20px) scale(1.05); } 66% { transform: translate(-15px,10px) scale(0.96); } }

        /* Responsive */
        @media (max-width: 900px) {
          .about-page { padding: 24px 16px 40px; }
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .stack-grid { grid-template-columns: repeat(2, 1fr); }
          .features-grid { grid-template-columns: 1fr; }
          .fridge-highlight { grid-template-columns: 1fr; padding: 28px 20px; }
          .fh-right { display: none; }
          .about-title { font-size: 36px; }
          .mission-inner { flex-direction: column; gap: 16px; }
        }
        @media (max-width: 500px) {
          .steps-grid, .stack-grid { grid-template-columns: 1fr; }
          .about-footer-banner { padding: 36px 24px; }
        }
      `}</style>
    </div>
  );
}