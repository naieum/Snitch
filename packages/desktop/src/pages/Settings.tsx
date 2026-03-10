import { useState, useEffect, useCallback } from "react";
import { ThemeToggle, useTheme } from "../lib/theme";
import {
  disconnectDevice,
  detectTools,
  installSkill,
  uninstallSkill,
  type LicenseInfo,
  type ToolInfo,
} from "../lib/tauri";

type SettingsSection = "account" | "tools" | "appearance" | "about";

const SECTIONS: { id: SettingsSection; name: string }[] = [
  { id: "account", name: "ACCOUNT" },
  { id: "tools", name: "TOOLS" },
  { id: "appearance", name: "APPEARANCE" },
  { id: "about", name: "ABOUT" },
];

interface SettingsProps {
  license: LicenseInfo | null;
  projectPath: string;
  onDisconnect: () => void;
}

/* ── Toggle Switch ─────────────────────────────────────────────── */

function Toggle({
  on,
  onToggle,
  disabled,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      disabled={disabled}
      className="toggle-switch"
      style={{
        backgroundColor: on ? "var(--success)" : "var(--bg-raised)",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="toggle-switch-thumb"
        style={{
          transform: on ? "translateX(20px)" : "translateX(0)",
        }}
      />
    </button>
  );
}

/* ── Tool Row ──────────────────────────────────────────────────── */

function ToolRow({
  tool,
  projectPath,
  onRefresh,
}: {
  tool: ToolInfo;
  projectPath?: string;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setLoading(true);
    setError(null);
    try {
      if (tool.snitch_loaded) {
        await uninstallSkill(tool.id, projectPath);
      } else {
        await installSkill(tool.id, projectPath);
      }
      onRefresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const isIde = tool.tool_type === "ide";
  const dimmed = isIde && !projectPath;

  return (
    <div
      className="settings-tool-row"
      style={{
        opacity: !tool.detected ? 0.4 : dimmed ? 0.6 : 1,
      }}
    >
      <div className="settings-tool-info">
        <span
          className="settings-tool-icon"
          style={{ color: "var(--text-tertiary)" }}
        >
          {isIde ? "\u25A0" : "\u25B6"}
        </span>
        <div className="settings-tool-details">
          <div className="settings-tool-name">{tool.name}</div>
          {error && (
            <div className="settings-tool-error">{error}</div>
          )}
        </div>
      </div>

      <div className="settings-tool-actions">
        <span
          className="badge"
          style={
            tool.detected
              ? {
                  backgroundColor: "var(--success-surface)",
                  color: "var(--success-text)",
                }
              : {}
          }
        >
          {tool.detected ? "Detected" : "Not found"}
        </span>
        <Toggle
          on={tool.snitch_loaded}
          disabled={!tool.detected || (isIde && !projectPath) || loading}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}

/* ── Settings Page ─────────────────────────────────────────────── */

export function Settings({ license, projectPath, onDisconnect }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [confirming, setConfirming] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  // Tools state
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);

  const hasFolder = projectPath !== "." && projectPath.trim() !== "";

  const refreshTools = useCallback(() => {
    const paths = hasFolder ? [projectPath] : [];
    setToolsLoading(true);
    detectTools(paths)
      .then(setTools)
      .catch(console.error)
      .finally(() => setToolsLoading(false));
  }, [projectPath, hasFolder]);

  useEffect(() => {
    refreshTools();
  }, [refreshTools]);

  async function handleDisconnect() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDisconnecting(true);
    setError(null);
    try {
      await disconnectDevice();
      onDisconnect();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setDisconnecting(false);
    }
  }

  const globalTools = tools.filter((t) => t.tool_type === "cli");
  const projectTools = tools.filter((t) => t.tool_type === "ide");

  return (
    <div className="toolbox-layout">
      {/* Left sidebar */}
      <aside className="toolbox-sidebar">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`toolbox-group ${activeSection === s.id ? "active" : ""}`}
          >
            <span className="toolbox-group-name">{s.name}</span>
          </button>
        ))}
      </aside>

      {/* Right panel */}
      <div className="toolbox-main">
        {/* ── Account ───────────────────────────────── */}
        {activeSection === "account" && (
          <>
            <div className="toolbox-header">
              <h2 className="toolbox-title">ACCOUNT</h2>
            </div>

            <div className="settings-card">
              <div className="settings-rows">
                {[
                  { label: "Email", value: license?.email || "\u2014" },
                  { label: "Tier", value: license?.tier || "\u2014", badge: true },
                  {
                    label: "Activations",
                    value: license
                      ? `${license.activations_used} of ${license.activations_max}`
                      : "\u2014",
                  },
                  { label: "Machine", value: license?.machine_label || "\u2014" },
                  { label: "Status", value: license?.status || "\u2014", status: true },
                ].map((row) => (
                  <div key={row.label} className="settings-row">
                    <span className="settings-row-label">{row.label}</span>
                    {row.badge ? (
                      <span className="badge">{row.value}</span>
                    ) : row.status ? (
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            license?.status === "active"
                              ? "var(--success-surface)"
                              : "var(--warning-surface)",
                          color:
                            license?.status === "active"
                              ? "var(--success-text)"
                              : "var(--warning-text)",
                        }}
                      >
                        {row.value}
                      </span>
                    ) : (
                      <span className="settings-row-value">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="settings-action-bar">
                {error && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--danger-text)",
                      flex: 1,
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="btn-danger"
                  style={{ padding: "0.375rem 1rem", borderRadius: "6px", fontSize: "12px" }}
                >
                  {disconnecting
                    ? "Disconnecting..."
                    : confirming
                      ? "Confirm disconnect"
                      : "Disconnect this machine"}
                </button>
                {confirming && !disconnecting && (
                  <button
                    onClick={() => setConfirming(false)}
                    className="btn-secondary"
                    style={{ padding: "0.375rem 1rem", borderRadius: "6px", fontSize: "12px" }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Tools ─────────────────────────────────── */}
        {activeSection === "tools" && (
          <>
            <div className="toolbox-header">
              <h2 className="toolbox-title">CLI TOOLS</h2>
            </div>

            <div className="settings-card">
              <div className="settings-tool-list">
                {toolsLoading && globalTools.length === 0 ? (
                  <div className="settings-tool-empty">Detecting tools...</div>
                ) : globalTools.length === 0 ? (
                  <div className="settings-tool-empty">No CLI tools found</div>
                ) : (
                  globalTools.map((tool) => (
                    <ToolRow
                      key={tool.id}
                      tool={tool}
                      onRefresh={refreshTools}
                    />
                  ))
                )}
              </div>
            </div>

            {hasFolder && (
              <>
                <div className="settings-section-divider" />
                <div className="toolbox-header">
                  <h2 className="toolbox-title">IDE TOOLS</h2>
                </div>
                <div className="settings-card">
                  <div className="settings-tool-list">
                    {toolsLoading && projectTools.length === 0 ? (
                      <div className="settings-tool-empty">Detecting tools...</div>
                    ) : projectTools.length === 0 ? (
                      <div className="settings-tool-empty">No IDE tools found</div>
                    ) : (
                      projectTools.map((tool) => (
                        <ToolRow
                          key={tool.id}
                          tool={tool}
                          projectPath={projectPath}
                          onRefresh={refreshTools}
                        />
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Appearance ────────────────────────────── */}
        {activeSection === "appearance" && (
          <>
            <div className="toolbox-header">
              <h2 className="toolbox-title">APPEARANCE</h2>
            </div>

            <div className="settings-card">
              <div className="settings-row">
                <div>
                  <span className="settings-row-value">Theme</span>
                  <div className="settings-row-description">
                    {theme === "midnight" ? "Midnight (dark)" : "Cream (light)"}
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </>
        )}

        {/* ── About ─────────────────────────────────── */}
        {activeSection === "about" && (
          <>
            <div className="toolbox-header">
              <h2 className="toolbox-title">ABOUT</h2>
            </div>

            <div className="settings-card">
              <div className="settings-rows">
                <div className="settings-row">
                  <span className="settings-row-label">Version</span>
                  <span className="settings-row-value">1.0.0</span>
                </div>
                <div className="settings-row">
                  <span className="settings-row-label">Product</span>
                  <span className="settings-row-value">Snitch Desktop</span>
                </div>
                <div className="settings-row">
                  <span className="settings-row-label">Description</span>
                  <span className="settings-row-value">Security audit plugin manager</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
