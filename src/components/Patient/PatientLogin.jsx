import React, { useState } from "react";
import { HeartPulse, Mail, Lock, AlertCircle, Loader2, ChevronLeft } from "lucide-react";
import { familyLogin } from "../../services/ashaService";

export default function PatientLogin({ onLoggedIn, onBack }) {
  const [email, setEmail] = useState(() => localStorage.getItem("test_family_email") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("test_family_pwd") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError("Enter your family email and password."); return; }
    setLoading(true); setError("");
    const { data, error: loginErr } = await familyLogin(email, password);
    setLoading(false);
    if (loginErr) { setError(loginErr); return; }
    
    // Save for convenient testing
    localStorage.setItem("test_family_email", email);
    localStorage.setItem("test_family_pwd", password);
    
    if (onLoggedIn) onLoggedIn(data);
  };

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-gray-50 flex flex-col relative">
      {/* ── Back Button ── */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex items-center">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-teal-600 transition-colors bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
          <ChevronLeft className="w-4 h-4" /> Portals
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 shadow-lg mb-4">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">RadVault</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Family Health Portal</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Family Sign In</h2>
            <p className="text-xs text-gray-500 mb-6">Use the email and password your ASHA worker created for your family.</p>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Family Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="family@gmail.com" autoComplete="email"
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white transition-all shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password"
                    className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white transition-all shadow-sm" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all mt-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign In to Family Portal"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5 font-medium leading-relaxed">
            Don't have access? Ask your ASHA worker to register your family.
          </p>
        </div>
      </div>
    </div>
  );
}