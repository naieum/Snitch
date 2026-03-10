import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  detectTools,
  launchScan,
  type ToolInfo,
  type ScanLaunchResult,
} from "../lib/tauri";

export function ScanLauncher() {
  const [projectPath, setProjectPath] = useState("");
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState<ScanLaunchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectPath) {
      setTools([]);
      setSelectedTool(null);
      return;
    }
    setLoading(true);
    detectTools([projectPath])
      .then((allTools) => {
        // Only show tools that are detected and have snitch loaded
        const available = allTools.filter(
          (t) => t.detected && t.snitch_loaded,
        );
        setTools(available);
        setSelectedTool(null);
        setResult(null);
        setError(null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectPath]);

  async function pickFolder() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select project to scan",
    });
    if (selected) {
      setProjectPath(selected as string);
    }
  }

  async function handleLaunch() {
    if (!selectedTool || !projectPath) return;
    setLaunching(true);
    setResult(null);
    setError(null);
    try {
      const res = await launchScan(selectedTool, projectPath);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLaunching(false);
    }
  }

  const selected = tools.find((t) => t.id === selectedTool);
  const isCli = selected?.tool_type === "cli";

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Scan
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Launch a security audit on a project
        </p>
      </div>

      {/* Project directory picker */}
      <div className="mb-6">
        <label
          className="block text-xs mb-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          Project Directory
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={projectPath}
            onChange={(e) => setProjectPath(e.target.value)}
            placeholder="Select a project to scan..."
            className="input-field flex-1"
          />
          <button
            onClick={pickFolder}
            className="btn-secondary px-4 py-2 rounded-lg text-sm flex-shrink-0"
          >
            Browse
          </button>
        </div>
      </div>

      {/* Tool selection */}
      {projectPath && (
        <div className="mb-6">
          <label
            className="block text-xs mb-2"
            style={{ color: "var(--text-tertiary)" }}
          >
            Select Tool
          </label>
          {loading ? (
            <div
              className="text-sm py-4 text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              Detecting tools...
            </div>
          ) : tools.length === 0 ? (
            <div
              className="text-sm py-6 text-center rounded-lg"
              style={{
                color: "var(--text-tertiary)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border)",
              }}
            >
              No tools with Snitch loaded were found. Load Snitch on a
              tool first via the Tools page.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className="rounded-lg p-4 text-left transition-colors"
                  style={{
                    backgroundColor:
                      selectedTool === tool.id
                        ? "var(--sidebar-active-bg)"
                        : "var(--bg-surface)",
                    border:
                      selectedTool === tool.id
                        ? "1px solid var(--border-focus)"
                        : "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {tool.name}
                  </div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {tool.tool_type === "cli" ? "CLI" : "IDE"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* IDE instruction */}
      {selected && !isCli && (
        <div
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: "var(--info-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--info-text)" }}>
            After opening the project in {selected.name}, type{" "}
            <span
              className="px-1 py-0.5 rounded text-xs"
              style={{ backgroundColor: "var(--code-bg)" }}
            >
              /snitch
            </span>{" "}
            in the AI chat to start the audit.
          </p>
        </div>
      )}

      {/* Launch button */}
      {selectedTool && projectPath && (
        <button
          onClick={handleLaunch}
          disabled={launching}
          className="btn-primary px-6 py-2.5 rounded-lg text-sm"
        >
          {launching ? (
            <span className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--btn-primary-text)" }}
              />
              {isCli ? "Scanning..." : "Opening..."}
            </span>
          ) : isCli ? (
            "Launch Scan"
          ) : (
            `Open in ${selected?.name}`
          )}
        </button>
      )}

      {/* Result */}
      {result && (
        <div
          className="mt-6 p-4 rounded-lg"
          style={{
            backgroundColor: result.launched
              ? "var(--success-surface)"
              : "var(--warning-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-sm"
            style={{
              color: result.launched
                ? "var(--success-text)"
                : "var(--warning-text)",
            }}
          >
            {result.message}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mt-6 p-4 rounded-lg"
          style={{
            backgroundColor: "var(--danger-surface)",
            border: "1px solid var(--danger-border)",
          }}
        >
          <p
            className="text-sm"
            style={{ color: "var(--danger-text)" }}
          >
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
