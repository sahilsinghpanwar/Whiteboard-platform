import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import styles from "./Landing.module.css";

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    title: "AI-Powered",
    desc: "Generate diagrams, write code, summarize content and more — right inside your board.",
    color: "#7C6EF8",
    bg: "rgba(124,110,248,0.08)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Real-time Collaboration",
    desc: "See live cursors, edits and comments from your entire team simultaneously.",
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    title: "Smart Diagrams",
    desc: "Auto-generate flowcharts, system diagrams, ER diagrams from a text description.",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="16 6 12 2 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Export & Share",
    desc: "Export to PNG, SVG, or PDF. Share a read-only link with anyone in one click.",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Secure by Default",
    desc: "End-to-end encryption, role-based permissions and enterprise-grade security.",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    title: "Lightning Fast",
    desc: "Built on WebSockets with Redis caching — sub-100ms latency for every action.",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create or Join",
    desc: "Sign up in seconds. Create a new board or join your team's existing workspace instantly.",
  },
  {
    num: "02",
    title: "Build Together",
    desc: "Add sticky notes, shapes, diagrams and text. Watch your team collaborate in real time.",
  },
  {
    num: "03",
    title: "Ask AI",
    desc: "Highlight anything and ask the AI to explain, refactor, diagram or improve it instantly.",
  },
  {
    num: "04",
    title: "Ship & Share",
    desc: "Export your work, share a link or embed it anywhere. From idea to delivery — all in one place.",
  },
];

const TECH = [
  { name: "React", icon: "⚛️", color: "#61DAFB" },
  { name: "Node.js", icon: "🟢", color: "#68A063" },
  { name: "Socket.IO", icon: "⚡", color: "#aaa" },
  { name: "PostgreSQL", icon: "🐘", color: "#336791" },
  { name: "Redis", icon: "🔴", color: "#DC382D" },
  { name: "AWS S3", icon: "☁️", color: "#FF9900" },
  { name: "OpenAI", icon: "🤖", color: "#00A67E" },
  { name: "Tailwind CSS", icon: "🎨", color: "#06B6D4" },
];

const STATS = [
  { value: "10k+", label: "Active boards" },
  { value: "50ms", label: "Avg. sync latency" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "4.9 ★", label: "User rating" },
];

// ─── Canvas Mock (clean, simplified) ─────────────────────────────────────────

const CanvasMock = () => (
  <div className={styles.mockWrap}>
    {/* Top bar */}
    <div className={styles.mockBar}>
      <div className={styles.mockBarLeft}>
        <div className={styles.mockLogo}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="9" height="9" rx="2" fill="#7C6EF8" />
            <rect x="13" y="2" width="9" height="9" rx="2" fill="#7C6EF8" opacity="0.5" />
            <rect x="2" y="13" width="9" height="9" rx="2" fill="#7C6EF8" opacity="0.5" />
            <rect x="13" y="13" width="9" height="9" rx="2" fill="#7C6EF8" />
          </svg>
          <span>AI Collab Board</span>
        </div>
      </div>
      <div className={styles.mockBarRight}>
        <div className={styles.mockAvatars}>
          {["#7C6EF8", "#10B981", "#F59E0B", "#3B82F6"].map((c, i) => (
            <div key={i} className={styles.mockAvatar} style={{ background: c, marginLeft: i ? -6 : 0 }} />
          ))}
        </div>
        <div className={styles.mockShareBtn}>Share</div>
      </div>
    </div>

    {/* Canvas area */}
    <div className={styles.mockCanvas}>
      {/* Dot grid background */}
      <div className={styles.mockGrid} />

      {/* Sticky notes */}
      <motion.div
        className={styles.mockSticky}
        style={{ background: "#FDE68A", top: 24, left: 24, width: 120 }}
        animate={{ rotate: [-1, 1, -1] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      >
        <p className={styles.mockStickyTitle}>💡 Idea</p>
        <p className={styles.mockStickyText}>AI-first collaborative workspace for teams</p>
        <div className={styles.mockCursor} style={{ "--cc": "#7C6EF8" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#7C6EF8"><path d="M4 0l16 12-7 1-4 7z" /></svg>
          <span>Ritik</span>
        </div>
      </motion.div>

      <motion.div
        className={styles.mockSticky}
        style={{ background: "#FBCFE8", top: 24, left: 164, width: 130 }}
        animate={{ rotate: [1, -0.5, 1] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
      >
        <p className={styles.mockStickyTitle}>✦ Features</p>
        <ul className={styles.mockStickyList}>
          <li>AI Assistant</li>
          <li>Real-time Collab</li>
          <li>Smart Diagrams</li>
          <li>Export & Share</li>
        </ul>
      </motion.div>

      <motion.div
        className={styles.mockSticky}
        style={{ background: "#A7F3D0", top: 24, left: 314, width: 110 }}
        animate={{ rotate: [-0.5, 1.5, -0.5] }}
        transition={{ repeat: Infinity, duration: 5.5, ease: "easeInOut" }}
      >
        <p className={styles.mockStickyTitle}>🎯 Goal</p>
        <p className={styles.mockStickyText}>Build the best AI whiteboard</p>
        <div className={styles.mockCursor} style={{ "--cc": "#10B981" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#10B981"><path d="M4 0l16 12-7 1-4 7z" /></svg>
          <span>Aisha</span>
        </div>
      </motion.div>

      {/* Architecture box */}
      <div className={styles.mockArchBox}>
        <p className={styles.mockArchTitle}>System Architecture</p>
        <div className={styles.mockArchRow}>
          {["Web / Mobile", "API Gateway", "AI Service"].map((n, i) => (
            <div key={i} className={`${styles.mockArchNode} ${i === 1 ? styles.mockArchNodeAccent : ""}`}>
              {n}
            </div>
          ))}
        </div>
        <div className={styles.mockArchRow} style={{ marginTop: 6 }}>
          {["Auth Service", "PostgreSQL", "File Storage"].map((n, i) => (
            <div key={i} className={`${styles.mockArchNode} ${i === 1 ? styles.mockArchNodeAccent : ""}`}>
              {n}
            </div>
          ))}
        </div>
        <div className={styles.mockCursor} style={{ "--cc": "#F59E0B", bottom: -14, right: 8 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B"><path d="M4 0l16 12-7 1-4 7z" /></svg>
          <span>Jordan</span>
        </div>
      </div>

      {/* AI response card */}
      <div className={styles.mockAICard}>
        <div className={styles.mockAIHeader}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#7C6EF8" />
          </svg>
          <span>AI Assistant</span>
        </div>
        <pre className={styles.mockAICode}>
{`users
  id, name, email
  password, avatar

roles
  id, name

role_permissions
  role_id, permission_id`}
        </pre>
        <div className={styles.mockInsertBtn}>Insert on board</div>
      </div>
    </div>

    {/* Footer toolbar */}
    <div className={styles.mockFooterBar}>
      <span className={styles.mockZoom}>100%</span>
      <span className={styles.mockTool}>●</span>
      <span className={styles.mockTool}>−</span>
      <span className={styles.mockTool}>+</span>
    </div>
  </div>
);

// ─── Navbar ───────────────────────────────────────────────────────────────────

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""}`}>
      <div className={styles.navInner}>
        <div className={styles.navBrand}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="9" height="9" rx="2" fill="#7C6EF8" />
            <rect x="13" y="2" width="9" height="9" rx="2" fill="#7C6EF8" opacity="0.5" />
            <rect x="2" y="13" width="9" height="9" rx="2" fill="#7C6EF8" opacity="0.5" />
            <rect x="13" y="13" width="9" height="9" rx="2" fill="#7C6EF8" />
          </svg>
          <span className={styles.navBrandName}>Canvai</span>
        </div>

        <nav className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#how" className={styles.navLink}>How it works</a>
          <a href="#tech" className={styles.navLink}>Tech stack</a>
        </nav>

        <div className={styles.navCtas}>
          <Link to="/login" className={styles.navLoginBtn}>Sign in</Link>
          <Link to="/register" className={styles.navRegisterBtn}>
            Get started free
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <div className={styles.root}>
      <Navbar />

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true">
          <div className={styles.heroBgGlow1} />
          <div className={styles.heroBgGlow2} />
        </div>

        <div className={styles.heroContent}>
          <motion.div
            className={styles.heroText}
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className={styles.heroBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#7C6EF8" />
              </svg>
              AI-Powered Collaborative Whiteboard
            </motion.div>

            <motion.h1 variants={fadeUp} className={styles.heroHeading}>
              Where ideas become<br />
              <span className={styles.heroHeadingAccent}>real-world solutions</span>
            </motion.h1>

            <motion.p variants={fadeUp} className={styles.heroSub}>
              A modern workspace where your team thinks, plans, diagrams and ships — all in real time,
              with AI as your co-pilot.
            </motion.p>

            <motion.div variants={fadeUp} className={styles.heroCtas}>
              <Link to="/register" className={styles.heroPrimaryBtn}>
                Start for free
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link to="/login" className={styles.heroSecondaryBtn}>
                Sign in
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className={styles.heroStats}>
              {STATS.map((s) => (
                <div key={s.label} className={styles.heroStat}>
                  <span className={styles.heroStatVal}>{s.value}</span>
                  <span className={styles.heroStatLabel}>{s.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Product preview */}
          <motion.div
            className={styles.heroVisual}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <CanvasMock />
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.section} id="features">
        <div className={styles.sectionInner}>
          <motion.div
            className={styles.sectionHead}
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.p variants={fadeUp} className={styles.sectionLabel}>
              Everything you need
            </motion.p>
            <motion.h2 variants={fadeUp} className={styles.sectionTitle}>
              Built for how teams actually work
            </motion.h2>
            <motion.p variants={fadeUp} className={styles.sectionSub}>
              Every tool is designed to reduce friction, spark creativity and help your team move faster.
            </motion.p>
          </motion.div>

          <motion.div
            className={styles.featuresGrid}
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={fadeUp} className={styles.featureCard}>
                <div className={styles.featureIcon} style={{ background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={`${styles.section} ${styles.sectionAlt}`} id="how">
        <div className={styles.sectionInner}>
          <motion.div
            className={styles.sectionHead}
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.p variants={fadeUp} className={styles.sectionLabel}>
              Simple by design
            </motion.p>
            <motion.h2 variants={fadeUp} className={styles.sectionTitle}>
              From idea to done in four steps
            </motion.h2>
          </motion.div>

          <motion.div
            className={styles.stepsGrid}
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {STEPS.map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} className={styles.stepCard}>
                <div className={styles.stepNum}>{step.num}</div>
                {i < STEPS.length - 1 && (
                  <div className={styles.stepConnector} aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className={styles.section} id="tech">
        <div className={styles.sectionInner}>
          <motion.div
            className={styles.sectionHead}
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
          >
            <motion.p variants={fadeUp} className={styles.sectionLabel}>
              Rock-solid foundation
            </motion.p>
            <motion.h2 variants={fadeUp} className={styles.sectionTitle}>
              Built with best-in-class tech
            </motion.h2>
            <motion.p variants={fadeUp} className={styles.sectionSub}>
              Every layer of the stack is chosen for performance, reliability and developer experience.
            </motion.p>
          </motion.div>

          <motion.div
            className={styles.techGrid}
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {TECH.map((t) => (
              <motion.div key={t.name} variants={fadeUp} className={styles.techCard}>
                <span className={styles.techIcon}>{t.icon}</span>
                <span className={styles.techName}>{t.name}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Architecture flow */}
          <motion.div
            className={styles.archFlow}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.2 }}
          >
            {["Client", "Socket.IO", "API Server\n(Node.js)", "DB\n(PostgreSQL)", "Redis\n(Cache)", "File Storage\n(AWS S3)", "AI Service\n(OpenAI)"].map((node, i, arr) => (
              <div key={i} className={styles.archFlowItem}>
                <div className={styles.archFlowNode}>
                  {node.split("\n").map((line, j) => (
                    <span key={j} className={j === 0 ? styles.archFlowNodeMain : styles.archFlowNodeSub}>
                      {line}
                    </span>
                  ))}
                </div>
                {i < arr.length - 1 && (
                  <svg width="20" height="12" viewBox="0 0 20 12" fill="none" className={styles.archArrow}>
                    <path d="M0 6h16M11 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaGlow} aria-hidden="true" />
        <motion.div
          className={styles.ctaContent}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          <motion.h2 variants={fadeUp} className={styles.ctaTitle}>
            Ready to build something amazing?
          </motion.h2>
          <motion.p variants={fadeUp} className={styles.ctaSub}>
            Join thousands of teams already using Canvai to collaborate, create, and ship faster.
            Free to start. No credit card needed.
          </motion.p>
          <motion.div variants={fadeUp} className={styles.ctaActions}>
            <Link to="/register" className={styles.ctaPrimaryBtn}>
              Create free account
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link to="/login" className={styles.ctaSecondaryBtn}>
              Sign in
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="9" height="9" rx="2" fill="#7C6EF8" />
              <rect x="13" y="2" width="9" height="9" rx="2" fill="#7C6EF8" opacity="0.5" />
              <rect x="2" y="13" width="9" height="9" rx="2" fill="#7C6EF8" opacity="0.5" />
              <rect x="13" y="13" width="9" height="9" rx="2" fill="#7C6EF8" />
            </svg>
            <span className={styles.footerBrandName}>Canvai</span>
          </div>
          <p className={styles.footerCopy}>© 2026 Canvai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
