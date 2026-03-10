import { useState, useEffect, useRef, useCallback } from "react";
import { listDirectory, type DirEntry } from "../lib/tauri";

interface FolderBrowserProps {
  value: string;
  onChange: (path: string) => void;
}

export function FolderBrowser({ value, onChange }: FolderBrowserProps) {
  const [open, setOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadDir = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const dirs = await listDirectory(path);
      setEntries(dirs);
      setCurrentPath(path);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      const startPath = value !== "." ? parentOf(value) : "/";
      loadDir(startPath);
    }
  }, [open, loadDir, value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function parentOf(path: string): string {
    if (path === "/") return "/";
    const parts = path.split("/").filter(Boolean);
    parts.pop();
    return parts.length === 0 ? "/" : "/" + parts.join("/");
  }

  function handleSelect(path: string) {
    onChange(path);
    setOpen(false);
  }

  function handleNavigate(path: string) {
    loadDir(path);
  }

  const breadcrumbs = currentPath === "/"
    ? ["/"]
    : ["/", ...currentPath.split("/").filter(Boolean)];

  const isSelected = (path: string) => path === value;

  return (
    <div className="folder-browser" ref={panelRef}>
      <div className="folder-browser-trigger">
        <input
          type="text"
          value={value}
          readOnly
          onClick={() => setOpen(!open)}
          className="input-field top-bar-input"
          placeholder="."
          style={{ cursor: "pointer" }}
        />
        <button
          onClick={() => setOpen(!open)}
          className="btn-secondary top-bar-browse"
        >
          Browse
        </button>
      </div>

      <div
        className="folder-browser-panel"
        style={{
          maxHeight: open ? "320px" : "0",
          opacity: open ? 1 : 0,
          borderWidth: open ? "1px" : "0",
          padding: open ? undefined : "0 0.75rem",
        }}
      >
        {/* Breadcrumb */}
        <div className="folder-browser-breadcrumb">
          {breadcrumbs.map((crumb, i) => {
            const crumbPath =
              i === 0
                ? "/"
                : "/" + breadcrumbs.slice(1, i + 1).join("/");
            return (
              <span key={crumbPath}>
                {i > 0 && (
                  <span className="folder-browser-sep">/</span>
                )}
                <button
                  className="folder-browser-crumb"
                  onClick={() => handleNavigate(crumbPath)}
                >
                  {crumb === "/" ? "~" : crumb}
                </button>
              </span>
            );
          })}
        </div>

        {/* Directory List */}
        <div className="folder-browser-list">
          {currentPath !== "/" && (
            <button
              className="folder-browser-item"
              onClick={() => handleNavigate(parentOf(currentPath))}
            >
              <span className="folder-browser-dot" style={{ opacity: 0 }} />
              <span className="folder-browser-name" style={{ color: "var(--text-tertiary)" }}>..</span>
            </button>
          )}

          {loading ? (
            <div className="folder-browser-empty">Loading...</div>
          ) : error ? (
            <div className="folder-browser-empty" style={{ color: "var(--danger-text)" }}>{error}</div>
          ) : entries.length === 0 ? (
            <div className="folder-browser-empty">No folders</div>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.path}
                className={`folder-browser-item ${isSelected(entry.path) ? "selected" : ""}`}
                onDoubleClick={() => handleNavigate(entry.path)}
                onClick={() => handleSelect(entry.path)}
              >
                <span
                  className="folder-browser-dot"
                  style={{
                    backgroundColor: isSelected(entry.path)
                      ? "var(--success)"
                      : "var(--border-hover)",
                  }}
                />
                <span className="folder-browser-name">{entry.name}</span>
              </button>
            ))
          )}
        </div>

        {/* Current Selection */}
        <div className="folder-browser-footer">
          <span className="folder-browser-selected-path">
            {value === "." ? "No folder selected" : value}
          </span>
          <button
            className="folder-browser-select-btn"
            onClick={() => {
              onChange(currentPath);
              setOpen(false);
            }}
          >
            Select this folder
          </button>
        </div>
      </div>
    </div>
  );
}
