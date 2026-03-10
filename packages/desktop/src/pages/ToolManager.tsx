import { useState, useEffect, useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  detectTools,
  installSkill,
  uninstallSkill,
  type ToolInfo,
} from "../lib/tauri";

// ── Toggle Switch ───────────────────────────────────────────────

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      disabled={disabled}
      className="relative w-10 h-5 rounded-full transition-colors duration-200"
      style={{
        backgroundColor: on ? "var(--success)" : "var(--bg-raised)",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
        padding: 0,
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200"
        style={{
          backgroundColor: "white",
          transform: on ? "translateX(20px)" : "translateX(0)",
        }}
      />
    </button>
  );
}

// ── Tool Row ────────────────────────────────────────────────────

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
      className="flex items-center justify-between py-3 px-4 rounded-lg"
      style={{
        opacity: !tool.detected ? 0.4 : dimmed ? 0.6 : 1,
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span
          className="w-6 text-center text-sm"
          style={{ color: "var(--text-tertiary)" }}
        >
          {isIde ? "\u25A0" : "\u25B6"}
        </span>
        <div className="min-w-0">
          <div
            className="text-sm truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {tool.name}
          </div>
          {error && (
            <div
              className="text-xs mt-0.5 truncate"
              style={{ color: "var(--danger-text)" }}
            >
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span
          className="badge text-xs"
          style={
            tool.detected
              ? {
                  backgroundColor: "var(--success-surface)",
                  color: "var(--success-text)",
                }
              : {}
          }
        >
          {tool.detected ? "Detected" : "Not detected"}
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

// ── Tool Manager Page ───────────────────────────────────────────

export function ToolManager() {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [projectPath, setProjectPath] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const paths = projectPath ? [projectPath] : [];
    setLoading(true);
    detectTools(paths)
      .then(setTools)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectPath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function pickFolder() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select project directory",
    });
    if (selected) {
      setProjectPath(selected as string);
    }
  }

  const globalTools = tools.filter((t) => t.tool_type === "cli");
  const projectTools = tools.filter((t) => t.tool_type === "ide");

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Tools
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Load or unload Snitch across your AI coding tools
        </p>
      </div>

      {/* Global Tools (CLI) */}
      <section className="mb-10">
        <h2
          className="text-sm font-medium mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          Global Tools (CLI)
        </h2>
        <div className="flex flex-col gap-2">
          {loading && globalTools.length === 0 ? (
            <div
              className="text-sm py-4 text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              Detecting tools...
            </div>
          ) : globalTools.length === 0 ? (
            <div
              className="text-sm py-4 text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              No CLI tools found
            </div>
          ) : (
            globalTools.map((tool) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                onRefresh={refresh}
              />
            ))
          )}
        </div>
      </section>

      {/* Project Tools (IDE) */}
      <section>
        <h2
          className="text-sm font-medium mb-3"
          style={{ color: "var(--text-secondary)" }}
        >
          Project Tools (IDE)
        </h2>

        {/* Project path selector */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={projectPath}
            onChange={(e) => setProjectPath(e.target.value)}
            placeholder="Select a project directory..."
            className="input-field flex-1"
          />
          <button
            onClick={pickFolder}
            className="btn-secondary px-4 py-2 rounded-lg text-sm flex-shrink-0"
          >
            Browse
          </button>
        </div>

        {!projectPath && (
          <div
            className="text-sm py-4 text-center rounded-lg"
            style={{
              color: "var(--text-tertiary)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            Select a project directory to manage IDE tools
          </div>
        )}

        {projectPath && (
          <div className="flex flex-col gap-2">
            {loading && projectTools.length === 0 ? (
              <div
                className="text-sm py-4 text-center"
                style={{ color: "var(--text-tertiary)" }}
              >
                Detecting tools...
              </div>
            ) : projectTools.length === 0 ? (
              <div
                className="text-sm py-4 text-center"
                style={{ color: "var(--text-tertiary)" }}
              >
                No IDE tools found
              </div>
            ) : (
              projectTools.map((tool) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  projectPath={projectPath}
                  onRefresh={refresh}
                />
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
