"use client";

import { useState } from "react";

// VULN [Cat 23 - GDPR]: Data export and account deletion not implemented
export default function SettingsPage() {
  const [exportMsg, setExportMsg] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");

  const handleExport = async () => {
    try {
      const res = await fetch("/api/settings/export");
      const data = await res.json();
      setExportMsg(data.error || "Export unavailable");
    } catch {
      setExportMsg("Service unavailable");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch("/api/settings/delete", { method: "DELETE" });
      const data = await res.json();
      setDeleteMsg(data.error || "Deletion unavailable");
    } catch {
      setDeleteMsg("Service unavailable");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="font-semibold mb-2">Export Your Data</h2>
          <p className="text-sm text-gray-600 mb-3">
            Download a copy of all your personal data.
          </p>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            Export Data
          </button>
          {exportMsg && <p className="mt-2 text-sm text-orange-600">{exportMsg}</p>}
        </div>
        <hr />
        <div>
          <h2 className="font-semibold mb-2 text-red-700">Delete Account</h2>
          <p className="text-sm text-gray-600 mb-3">
            Permanently delete your account and all associated data.
          </p>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
          >
            Delete My Account
          </button>
          {deleteMsg && <p className="mt-2 text-sm text-orange-600">{deleteMsg}</p>}
        </div>
      </div>
    </div>
  );
}
