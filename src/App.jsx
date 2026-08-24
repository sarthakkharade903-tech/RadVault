import React from 'react'

function App() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-slate-900 text-slate-50">
      <div className="w-full max-w-4xl text-center">
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="text-6xl">🏥</span>
          <h1 className="text-5xl font-bold text-sky-400 tracking-tight">RadVault</h1>
        </div>
        
        <h2 className="text-3xl font-medium text-slate-100 mb-2">One patient. One connected health journey.</h2>
        <p className="text-lg text-slate-400 mb-16">Select a portal to enter the system. (Auth disabled for hackathon demo)</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Dashboard 1: Patient / Frontline */}
          <a href="#" className="block p-8 bg-slate-800 border-2 border-slate-700 rounded-2xl text-left transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500 hover:shadow-[0_10px_25px_-5px_rgba(16,185,129,0.15)] group">
            <div className="text-5xl mb-6">📱</div>
            <h3 className="text-2xl font-bold text-slate-50 mb-2">Frontline Portal</h3>
            <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm font-semibold text-slate-300 mb-4">Patients & ASHA Workers</div>
            <p className="text-slate-400 mb-8 leading-relaxed">Digital Triage, Health Timeline, Consent, and Emergency Break-Glass QR.</p>
            <span className="font-semibold text-emerald-500 inline-block transition-transform duration-200 group-hover:translate-x-2">Enter Portal &rarr;</span>
          </a>

          {/* Dashboard 2: Doctor / Diagnostic */}
          <a href="#" className="block p-8 bg-slate-800 border-2 border-slate-700 rounded-2xl text-left transition-all duration-300 hover:-translate-y-2 hover:border-blue-500 hover:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.15)] group">
            <div className="text-5xl mb-6">💻</div>
            <h3 className="text-2xl font-bold text-slate-50 mb-2">Clinical Portal</h3>
            <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-sm font-semibold text-slate-300 mb-4">Doctors & Diagnostics</div>
            <p className="text-slate-400 mb-8 leading-relaxed">RadVault File Uploads, AI Summarization, Referrals, and Timeline View.</p>
            <span className="font-semibold text-blue-500 inline-block transition-transform duration-200 group-hover:translate-x-2">Enter Portal &rarr;</span>
          </a>
        </div>
      </div>
    </main>
  )
}

export default App
