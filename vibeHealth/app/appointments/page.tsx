"use client";

import { useState, useEffect } from "react";

interface Appointment {
  id: string;
  date: string;
  status: string;
  notes?: string;
  doctor?: { name: string };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => setAppointments(data.appointments || []))
      .catch(() => {});
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: localStorage.getItem("user_id") || "demo",
          doctorId: doctorId || "demo-doctor",
          date,
          notes,
          // VULN [Cat 5]: Hidden callback URL for SSRF
          callbackUrl: (document.getElementById("callbackUrl") as HTMLInputElement)?.value,
        }),
      });
      if (res.ok) {
        setMessage("Appointment booked!");
        setDate("");
        setNotes("");
      }
    } catch {
      setMessage("Failed to book appointment");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Appointments</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-4">Book New Appointment</h2>
        {message && <p className="mb-4 text-sm text-green-600">{message}</p>}
        <form onSubmit={handleBook} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor ID</label>
            <input
              type="text"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter doctor ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={3}
            />
          </div>
          {/* Hidden field for SSRF demo */}
          <input type="hidden" id="callbackUrl" name="callbackUrl" value="" />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Book Appointment
          </button>
        </form>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold">Your Appointments</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {appointments.map((apt) => (
            <div key={apt.id} className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{apt.doctor?.name || "Doctor"}</p>
                  <p className="text-sm text-gray-500">{new Date(apt.date).toLocaleString()}</p>
                  {apt.notes && <p className="text-sm text-gray-600 mt-1">{apt.notes}</p>}
                </div>
                <span className="px-3 py-1 h-fit rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {apt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
