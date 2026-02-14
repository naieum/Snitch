import Link from "next/link";

export default function Home() {
  return (
    <div className="-ml-64 -mt-16 min-h-screen">
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Healthcare, <span className="text-blue-600">reimagined.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Connect with your doctor, manage prescriptions, and take charge of
            your health — all from one platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 text-lg font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
          {[
            { title: "Virtual Visits", desc: "See your doctor from anywhere via secure video calls." },
            { title: "AI Symptom Check", desc: "Get instant preliminary assessments powered by AI." },
            { title: "Rx Management", desc: "View and manage your prescriptions online." },
          ].map((f) => (
            <div key={f.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
