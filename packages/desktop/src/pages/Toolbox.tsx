import { useState } from "react";

interface Category {
  id: number;
  name: string;
}

interface CategoryGroup {
  name: string;
  categories: Category[];
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: "CORE SECURITY",
    categories: [
      { id: 1, name: "SQL Injection" },
      { id: 2, name: "XSS" },
      { id: 3, name: "Hardcoded Secrets" },
      { id: 4, name: "Authentication" },
      { id: 5, name: "SSRF" },
      { id: 6, name: "Supabase Security" },
      { id: 7, name: "Rate Limiting" },
      { id: 8, name: "CORS" },
      { id: 9, name: "Cryptography" },
      { id: 10, name: "Dangerous Code" },
      { id: 11, name: "Cloud Security" },
      { id: 12, name: "Logging Exposure" },
    ],
  },
  {
    name: "MODERN STACK",
    categories: [
      { id: 13, name: "Stripe Security" },
      { id: 14, name: "Auth Providers" },
      { id: 15, name: "AI API Security" },
      { id: 16, name: "Email Services" },
      { id: 17, name: "Database Security" },
      { id: 18, name: "Redis / Cache" },
      { id: 19, name: "SMS / Comms" },
    ],
  },
  {
    name: "COMPLIANCE",
    categories: [
      { id: 20, name: "HIPAA" },
      { id: 21, name: "SOC 2" },
      { id: 22, name: "PCI-DSS" },
      { id: 23, name: "GDPR" },
    ],
  },
  {
    name: "PERFORMANCE",
    categories: [
      { id: 24, name: "Memory Leaks" },
      { id: 25, name: "N+1 Queries" },
      { id: 26, name: "Performance" },
    ],
  },
  {
    name: "INFRASTRUCTURE",
    categories: [
      { id: 27, name: "Dependencies" },
      { id: 28, name: "Authorization / IDOR" },
      { id: 29, name: "File Uploads" },
      { id: 30, name: "Input Validation" },
      { id: 31, name: "CI/CD Security" },
      { id: 32, name: "Security Headers" },
      { id: 33, name: "Container Security" },
    ],
  },
  {
    name: "GOVERNANCE",
    categories: [
      { id: 34, name: "Code Review" },
      { id: 35, name: "Access Management" },
      { id: 36, name: "Incident Response" },
      { id: 37, name: "Data Classification" },
      { id: 38, name: "Vendor Assessment" },
    ],
  },
];

interface ToolboxProps {
  projectPath: string;
}

export function Toolbox({ projectPath }: ToolboxProps) {
  const [activeGroup, setActiveGroup] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const hasFolder = projectPath !== "." && projectPath.trim() !== "";

  const group = CATEGORY_GROUPS[activeGroup];

  function toggleCategory(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      const allChecked = group.categories.every((c) => next.has(c.id));
      if (allChecked) {
        group.categories.forEach((c) => next.delete(c.id));
      } else {
        group.categories.forEach((c) => next.add(c.id));
      }
      return next;
    });
  }

  const allChecked = group.categories.every((c) => selected.has(c.id));

  return (
    <div className="toolbox-layout">
      {/* Left sidebar - Category Groups */}
      <aside
        className="toolbox-sidebar"
        style={{
          opacity: hasFolder ? 1 : 0.3,
          pointerEvents: hasFolder ? "auto" : "none",
        }}
      >
        {CATEGORY_GROUPS.map((g, i) => (
          <button
            key={g.name}
            onClick={() => setActiveGroup(i)}
            disabled={!hasFolder}
            className={`toolbox-group ${activeGroup === i ? "active" : ""}`}
          >
            <span className="toolbox-group-name">{g.name}</span>
            <span className="toolbox-group-count">{g.categories.length}</span>
          </button>
        ))}
      </aside>

      {/* Right panel - Category checkboxes */}
      <div className="toolbox-main">
        {!hasFolder && (
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-tertiary)",
              padding: "0.5rem 0",
              marginBottom: "0.75rem",
              borderBottom: "1px solid var(--border)",
            }}
          >
            Select a project folder to configure scan categories.
          </div>
        )}
        <div
          className="toolbox-header"
          style={{ opacity: hasFolder ? 1 : 0.3 }}
        >
          <h2 className="toolbox-title">{group.name}</h2>
          <button
            onClick={handleSelectAll}
            disabled={!hasFolder}
            className="toolbox-select-all"
            style={{
              cursor: hasFolder ? "pointer" : "not-allowed",
              pointerEvents: hasFolder ? "auto" : "none",
            }}
          >
            {allChecked ? "deselect all" : "select all"}
          </button>
        </div>

        <div
          className="toolbox-grid"
          style={{
            opacity: hasFolder ? 1 : 0.3,
            pointerEvents: hasFolder ? "auto" : "none",
          }}
        >
          {group.categories.map((cat) => (
            <label key={cat.id} className="toolbox-category">
              <input
                type="checkbox"
                checked={selected.has(cat.id)}
                onChange={() => toggleCategory(cat.id)}
                disabled={!hasFolder}
                className="toolbox-checkbox"
              />
              <span className="toolbox-category-name">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
