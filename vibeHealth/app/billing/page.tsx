"use client";

import { useState } from "react";

// VULN [Cat 22 - PCI-DSS]: Custom card form instead of Stripe Elements
// Raw card data sent to server and stored in database
export default function BillingPage() {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [amount, setAmount] = useState("50");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // VULN [Cat 22]: Sending raw card data to our server
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: localStorage.getItem("user_id") || "demo",
          amount: parseFloat(amount),
          cardNumber,
          cvv,
          cardExpiry: expiry,
          description: "VibeHealth consultation payment",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Payment processed successfully!");
        setCardNumber("");
        setExpiry("");
        setCvv("");
      } else {
        setMessage(data.error || "Payment failed");
      }
    } catch {
      setMessage("Payment service unavailable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <h2 className="font-semibold mb-4">Make a Payment</h2>
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {message}
          </div>
        )}
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            {/* VULN [Cat 22]: Raw card input */}
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="4242 4242 4242 4242"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              maxLength={19}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                maxLength={5}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
              <input
                type="text"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                placeholder="123"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                maxLength={4}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              min="1"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : `Pay $${amount}`}
          </button>
        </form>
      </div>
    </div>
  );
}
