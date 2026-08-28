import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldX, LogOut, Mail, UserCheck } from 'lucide-react';

export default function NoRoleScreen() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-md mx-auto my-16 px-4">
      <div className="bg-white border-2 border-amber-200 rounded-3xl p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-amber-600" aria-hidden="true" />
        </div>

        <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 mb-3">
          Account Setup Required
        </span>

        <h2 className="text-xl font-extrabold text-slate-800 mb-2">
          No Application Role Assigned
        </h2>

        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Your account is authenticated, but has not yet been assigned a RadVault care role (<strong>ASHA</strong>, <strong>Hospital Staff</strong>, or <strong>Doctor</strong>).
        </p>

        {user && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-left space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium">{user.email || 'Authenticated User'}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-mono text-[11px] text-slate-400">ID: {user.id}</span>
            </div>
          </div>
        )}

        <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl mb-6 text-left">
          <p className="text-[11px] text-amber-800 leading-snug">
            Please contact your District Health Administrator or Facility Supervisor to verify your clinical credentials and assign your workspace role.
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          Sign Out of Account
        </button>
      </div>
    </div>
  );
}
