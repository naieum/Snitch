import { useState, useEffect, useCallback } from "react";
import { checkLicense, type LicenseInfo } from "./lib/tauri";
import { Activation } from "./pages/Activation";
import { Toolbox } from "./pages/Toolbox";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { FolderBrowser } from "./components/FolderBrowser";
import "./app.css";

type Tab = "toolbox" | "reports" | "settings";

export default function App() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paired, setPaired] = useState(false);
  const [projectPath, setProjectPath] = useState(".");
  const [activeTab, setActiveTab] = useState<Tab>("toolbox");

  useEffect(() => {
    checkLicense()
      .then((info) => {
        if (info) {
          setLicense(info);
          setPaired(true);
        } else {
          setPaired(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setPaired(false);
        setLoading(false);
      });
  }, []);

  const refreshLicense = useCallback(() => {
    checkLicense()
      .then((info) => {
        if (info) {
          setLicense(info);
          setPaired(true);
        }
      })
      .catch(() => {
        setPaired(false);
      });
  }, []);

  const handlePaired = useCallback(() => {
    setPaired(true);
    refreshLicense();
  }, [refreshLicense]);

  if (loading) {
    return (
      <div
        data-tauri-drag-region
        className="flex h-screen items-center justify-center"
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <div style={{ color: "var(--text-secondary)" }}>Loading...</div>
      </div>
    );
  }

  if (!paired) {
    return <Activation onPaired={handlePaired} />;
  }

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* ── Top Bar ──────────────────────────────────────────── */}
      <header data-tauri-drag-region className="top-bar">
        <span className="top-bar-brand">SNITCH</span>

        <div className="top-bar-path">
          <FolderBrowser value={projectPath} onChange={setProjectPath} />
        </div>

        <nav className="top-bar-tabs">
          <button
            onClick={() => setActiveTab("reports")}
            className={`top-bar-tab ${activeTab === "reports" ? "active" : ""}`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab("toolbox")}
            className={`top-bar-tab ${activeTab === "toolbox" ? "active" : ""}`}
          >
            Toolbox
          </button>
        </nav>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "toolbox" && <Toolbox projectPath={projectPath} />}
        {activeTab === "reports" && <Reports projectPath={projectPath} />}
        {activeTab === "settings" && (
          <Settings
            license={license}
            projectPath={projectPath}
            onDisconnect={() => setPaired(false)}
          />
        )}
      </main>

      {/* ── Status Bar ───────────────────────────────────────── */}
      <footer className="status-bar">
        <span className="status-bar-item">
          {license?.email || "not connected"}
        </span>
        <span className="status-bar-item">
          {license?.status === "active" ? "active" : "inactive"}
        </span>
        <button
          onClick={() =>
            setActiveTab(activeTab === "settings" ? "toolbox" : "settings")
          }
          className="status-bar-item status-bar-link"
        >
          settings
        </button>
        <span className="status-bar-item" style={{ marginLeft: "auto" }}>
          v1.0.0
        </span>
      </footer>
    </div>
  );
}
