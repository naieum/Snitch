"use client";

import { useState } from "react";

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState("");
  const [assessment, setAssessment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAssessment("");

    try {
      const res = await fetch("/api/symptom-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: localStorage.getItem("user_id") || "demo",
          symptoms,
        }),
      });
      const data = await res.json();
      setAssessment(data.assessment || "Unable to analyze symptoms.");
    } catch {
      setAssessment("Service temporarily unavailable. Please contact your doctor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">AI Symptom Checker</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-600 mb-4">
          Describe your symptoms and our AI will provide a preliminary assessment.
          This is not a substitute for professional medical advice.
        </p>
        <form onSubmit={handleCheck} className="space-y-4">
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describe your symptoms..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg min-h-[120px]"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Check Symptoms"}
          </button>
        </form>
      </div>
      {assessment && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-2">Assessment</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{assessment}</p>
        </div>
      )}
    </div>
  );
}
