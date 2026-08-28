/**
 * RadVault RoleGuard Component
 *
 * ARCHITECTURAL RESPONSIBILITY:
 * - RoleGuard controls frontend navigation protection.
 * - It is NOT a substitute for database-level security.
 * - Real data protection is enforced via PostgreSQL Row Level Security (RLS).
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_CONFIG } from '../../constants/roles';
import NoRoleScreen from './NoRoleScreen';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function RoleGuard({ allowedRoles = [], onSwitchToAuthorized, children }) {
  const { role, hasNoRole, switchDemoRole, isDemoMode } = useAuth();

  // If user is authenticated with no assigned role, render NoRoleScreen
  if (hasNoRole) {
    return <NoRoleScreen />;
  }

  const isAllowed = role && allowedRoles.includes(role);

  if (!isAllowed) {
    const currentConfig = (role && ROLE_CONFIG[role]) || { label: 'Unassigned / Unknown' };
    const allowedLabels = allowedRoles.map(r => ROLE_CONFIG[r]?.label || r).join(', ');
    const primaryAllowed = allowedRoles[0];

    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white border-2 border-rose-200 rounded-2xl shadow-sm text-center">
        <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6 text-rose-600" aria-hidden="true" />
        </div>
        <h3 className="text-base font-extrabold text-slate-800 mb-1">
          Access Restricted
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          This area requires <strong>{allowedLabels}</strong> credentials. Your current active role is <strong>{currentConfig.label}</strong>.
        </p>

        {isDemoMode && primaryAllowed && (
          <button
            onClick={() => {
              if (onSwitchToAuthorized) {
                onSwitchToAuthorized(primaryAllowed);
              } else {
                switchDemoRole(primaryAllowed);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            Switch to {ROLE_CONFIG[primaryAllowed]?.shortLabel || primaryAllowed} View (Demo)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return children;
}
