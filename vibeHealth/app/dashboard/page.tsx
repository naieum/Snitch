"use client";

import { useEffect, useState } from "react";

interface Appointment {
  id: string;
  date: string;
  status: string;
  doctor?: { name: string };
  patient?: { name: string };
  notes?: string;
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => setAppointments(data.appointments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Upcoming Appointments</p>
          <p className="text-3xl font-bold text-blue-600">{appointments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Unread Messages</p>
          <p className="text-3xl font-bold text-green-600">3</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Active Prescriptions</p>
          <p className="text-3xl font-bold text-purple-600">1</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold">Recent Appointments</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {appointments.length === 0 ? (
            <p className="p-4 text-gray-500 text-sm">No appointments scheduled.</p>
          ) : (
            appointments.slice(0, 5).map((apt) => (
              <div key={apt.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{apt.doctor?.name || apt.patient?.name || "Doctor"}</p>
                  <p className="text-sm text-gray-500">{new Date(apt.date).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  apt.status === "scheduled" ? "bg-blue-100 text-blue-700" :
                  apt.status === "completed" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {apt.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
