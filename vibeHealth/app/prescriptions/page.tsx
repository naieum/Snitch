"use client";

import { useEffect, useState } from "react";

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  instructions: string;
  doctorNotes?: string;
  status: string;
  createdAt: string;
}

// VULN [Cat 2 - XSS]: Renders doctor notes as raw HTML
export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    // For demo, fetch from a simple endpoint
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        const allRx = data.users?.flatMap((u: { prescriptions?: Prescription[] }) => u.prescriptions || []) || [];
        setPrescriptions(allRx);
      })
      .catch(() => {
        // Fallback demo data
        setPrescriptions([
          {
            id: "demo-1",
            medication: "Amoxicillin",
            dosage: "500mg",
            instructions: "Take twice daily with food",
            doctorNotes: '<strong>Important:</strong> Complete full course',
            status: "active",
            createdAt: new Date().toISOString(),
          },
        ]);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Prescriptions</h1>
      <div className="space-y-4">
        {prescriptions.map((rx) => (
          <div key={rx.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{rx.medication}</h3>
                <p className="text-gray-600">{rx.dosage}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                rx.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}>
                {rx.status}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-3">{rx.instructions}</p>
            {rx.doctorNotes && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium mb-1">Doctor Notes:</p>
                {/* VULN [Cat 2 - XSS]: Rendering unsanitized HTML from database */}
                <div dangerouslySetInnerHTML={{ __html: rx.doctorNotes }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
