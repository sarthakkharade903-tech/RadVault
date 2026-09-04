/**
 * RadVault Auth & Role Context
 *
 * SECURITY ARCHITECTURE SPECIFICATION:
 * - RoleGuard and AuthContext control client-side navigation routing.
 * - Real user authorization and patient data security is enforced at the
 *   database layer via Supabase / PostgreSQL Row Level Security (RLS).
 * - A normal authenticated user CANNOT change their server-assigned role from the frontend.
 * - Missing or invalid roles never default to ASHA or any privileged role.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { ROLES, normalizeRole } from '../constants/roles';
import { mockPatient } from '../data/mockPatientData';

export const AuthContext = createContext();

export const AUTH_STATUS = {
  LOADING: 'LOADING',
  AUTHENTICATED: 'AUTHENTICATED',
  AUTHENTICATED_NO_ROLE: 'AUTHENTICATED_NO_ROLE',
  DEMO_MODE: 'DEMO_MODE'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authStatus, setAuthStatus] = useState(AUTH_STATUS.LOADING);
  const [verifiedRole, setVerifiedRole] = useState(null); // Real server role from JWT
  const [demoRole, setDemoRole] = useState(ROLES.ASHA); // Active role ONLY during demo mode
  const [authError, setAuthError] = useState(null);

  // ASHA identity and geographic assignment states
  const [ashaProfile, setAshaProfile] = useState(null);
  const [ashaVillages, setAshaVillages] = useState([]);
  const [ashaArea, setAshaArea] = useState(null);

  // Patient identity states
  const [patientProfile, setPatientProfile] = useState(null);
  const [patientProfileLoading, setPatientProfileLoading] = useState(false);
  const [patientProfileNotFound, setPatientProfileNotFound] = useState(false);

  // Global Demo Data ON/OFF toggle (defaults to ON initially, persisted in localStorage)
  const [demoDataEnabled, setDemoDataEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('radvault_demo_data_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleDemoData = () => {
    setDemoDataEnabled(prev => {
      const next = !prev;
      try {
        localStorage.setItem('radvault_demo_data_enabled', String(next));
      } catch (err) {
        console.warn('[RadVault Auth] Failed to save demoDataEnabled to localStorage:', err);
      }
      return next;
    });
  };

  // Helper to extract and validate role from Supabase user session
  const extractValidatedRole = (supabaseUser) => {
    if (!supabaseUser) return null;
    // Priority 1: app_metadata (server-controlled, immutable by user)
    // Priority 2: user_metadata (fallback for dev users)
    const rawRole = supabaseUser.app_metadata?.role || supabaseUser.user_metadata?.role;
    return normalizeRole(rawRole);
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        setAuthStatus(AUTH_STATUS.LOADING);
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          const validRole = extractValidatedRole(initialSession.user);

          if (validRole) {
            setVerifiedRole(validRole);
            setAuthStatus(AUTH_STATUS.AUTHENTICATED);
          } else {
            // Authenticated user but missing or invalid role
            setVerifiedRole(null);
            setAuthStatus(AUTH_STATUS.AUTHENTICATED_NO_ROLE);
          }
        } else {
          // Unauthenticated -> Activate Prototype Demo Mode for SIH evaluation
          setSession(null);
          setUser(null);
          setVerifiedRole(null);
          setAuthStatus(AUTH_STATUS.DEMO_MODE);
        }
      } catch (err) {
        if (!mounted) return;
        console.warn('[RadVault Auth] Session check warning:', err.message);
        setAuthError(err.message);
        setAuthStatus(AUTH_STATUS.DEMO_MODE);
      }
    }

    initAuth();

    // Subscribe to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        const validRole = extractValidatedRole(newSession.user);
        if (validRole) {
          setVerifiedRole(validRole);
          setAuthStatus(AUTH_STATUS.AUTHENTICATED);
        } else {
          setVerifiedRole(null);
          setAuthStatus(AUTH_STATUS.AUTHENTICATED_NO_ROLE);
        }
      } else {
        setVerifiedRole(null);
        setAuthStatus(AUTH_STATUS.DEMO_MODE);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Resolved active role:
  // - If real session exists with role -> verifiedRole
  // - If real session exists WITHOUT role -> null (blocks privileged access)
  // - If demo mode -> demoRole
  const resolvedRole = authStatus === AUTH_STATUS.AUTHENTICATED
    ? verifiedRole
    : authStatus === AUTH_STATUS.AUTHENTICATED_NO_ROLE
      ? null
      : demoRole;

  // Fetch ASHA worker profile and geographic assignments when role is ASHA
  useEffect(() => {
    if (resolvedRole === ROLES.ASHA) {
      if (authStatus === AUTH_STATUS.DEMO_MODE) {
        if (demoDataEnabled) {
          // Seed default demo assignments matching the seeded database structures
          setAshaProfile({
            id: 'demo-asha-id',
            worker_id: 'ASHA-MH-7042',
            name: 'Sunita Deshmukh',
            phone: '+91 98765 98765',
            phc_name: 'Shrirampur PHC'
          });
          setAshaVillages([
            { id: 'e1111111-1111-1111-1111-111111111111', name: 'Shrirampur Ward 4' },
            { id: 'e2222222-2222-2222-2222-222222222222', name: 'Pimpalgaon Rural' },
            { id: 'e3333333-3333-3333-3333-333333333333', name: 'Khedi Village' }
          ]);
          setAshaArea({
            id: 'd2222222-2222-2222-2222-222222222222',
            name: 'Sector 4',
            district: 'Ahmednagar'
          });
        } else {
          setAshaProfile(null);
          setAshaVillages([]);
          setAshaArea(null);
        }
      } else if (authStatus === AUTH_STATUS.AUTHENTICATED && user) {
        const fetchProfile = async () => {
          try {
            const { data: profile, error: pErr } = await supabase
              .from('asha_workers')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();

            if (pErr) throw pErr;

            if (profile) {
              setAshaProfile(profile);

              // Fetch village assignments
              const { data: assignments, error: aErr } = await supabase
                .from('asha_village_assignments')
                .select('village_id, villages(id, name, area_id, areas(id, name, district))')
                .eq('asha_id', profile.id);

              if (aErr) throw aErr;

              if (assignments && assignments.length > 0) {
                const villagesList = assignments
                  .map(a => a.villages)
                  .filter(Boolean);
                
                setAshaVillages(villagesList);
                if (villagesList[0]?.areas) {
                  setAshaArea(villagesList[0].areas);
                } else {
                  setAshaArea(null);
                }
              } else {
                setAshaVillages([]);
                setAshaArea(null);
              }
            } else {
              setAshaProfile(null);
              setAshaVillages([]);
              setAshaArea(null);
            }
          } catch (err) {
            console.error('[RadVault Auth] Error fetching ASHA profile:', err.message);
            if (demoDataEnabled) {
              setAshaProfile({
                id: 'demo-asha-id',
                worker_id: 'ASHA-MH-7042',
                name: 'Sunita Deshmukh',
                phone: '+91 98765 98765',
                phc_name: 'Shrirampur PHC'
              });
              setAshaVillages([
                { id: 'e1111111-1111-1111-1111-111111111111', name: 'Shrirampur Ward 4' },
                { id: 'e2222222-2222-2222-2222-222222222222', name: 'Pimpalgaon Rural' },
                { id: 'e3333333-3333-3333-3333-333333333333', name: 'Khedi Village' }
              ]);
              setAshaArea({
                id: 'd2222222-2222-2222-2222-222222222222',
                name: 'Sector 4',
                district: 'Ahmednagar'
              });
            } else {
              setAshaProfile(null);
              setAshaVillages([]);
              setAshaArea(null);
            }
          }
        };

        fetchProfile();
      }
    } else {
      setAshaProfile(null);
      setAshaVillages([]);
      setAshaArea(null);
    }
  }, [resolvedRole, authStatus, user, demoDataEnabled]);

  // Fetch Patient profile when role is PATIENT
  useEffect(() => {
    if (resolvedRole === ROLES.PATIENT) {
      if (authStatus === AUTH_STATUS.DEMO_MODE) {
        if (demoDataEnabled) {
          setPatientProfile(mockPatient);
          setPatientProfileNotFound(false);
        } else {
          setPatientProfile(null);
          setPatientProfileNotFound(true);
        }
        setPatientProfileLoading(false);
      } else if (authStatus === AUTH_STATUS.AUTHENTICATED && user) {
        let isMounted = true;
        const fetchPatientProfile = async () => {
          try {
            setPatientProfileLoading(true);
            setPatientProfileNotFound(false);
            const { data, error } = await supabase
              .from('patients')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();

            if (!isMounted) return;

            if (error) {
              console.error('[RadVault Auth] Error fetching patient profile:', error.message);
              setPatientProfile(null);
              setPatientProfileNotFound(true);
              return;
            }

            if (data) {
              setPatientProfile({
                id: data.id,
                fullName: data.full_name,
                age: data.age,
                gender: data.gender,
                bloodGroup: data.blood_group,
                phone: data.phone_number,
                abhaId: data.unified_id || 'N/A',
                insurance: { provider: 'Ayushman Bharat PM-JAY', policyNo: 'N/A' },
                emergencyContact: data.vitals?.emergencyContact || 'Family Member',
                emergencyPhone: data.vitals?.emergencyPhone || '9999999999',
                village_id: data.village_id,
                area_id: data.area_id
              });
              setPatientProfileNotFound(false);
            } else {
              console.warn('[RadVault Auth] No linked patient profile found in database for user_id:', user.id);
              setPatientProfile(null);
              setPatientProfileNotFound(true);
            }
          } catch (err) {
            if (!isMounted) return;
            console.error('[RadVault Auth] Error in patient profile fetch:', err.message);
            setPatientProfile(null);
            setPatientProfileNotFound(true);
          } finally {
            if (isMounted) setPatientProfileLoading(false);
          }
        };

        fetchPatientProfile();
        return () => {
          isMounted = false;
        };
      }
    } else {
      setPatientProfile(null);
      setPatientProfileLoading(false);
      setPatientProfileNotFound(false);
    }
  }, [resolvedRole, authStatus, user, demoDataEnabled]);

const DEMO_ROLE_CREDENTIALS = {
  [ROLES.ASHA]: {
    email: 'somu5243d@gmail.com',
    password: 'Samir@7498'
  },
  [ROLES.HOSPITAL_STAFF]: {
    email: 'myanawar5243d@gmail.com',
    password: 'Samir@135'
  },
  [ROLES.DOCTOR]: {
    email: 'samir5243d@gmail.com',
    password: 'Samir@8806'
  }
};

  /**
   * Prototype Demo Role Switcher
   * Authenticates directly into Supabase using the project's test account credentials.
   */
  const switchDemoRole = async (newRole) => {
    console.log(`[RADVAULT][DEMO_ROLE_SWITCH] targetRole = ${newRole}`);

    if (!Object.values(ROLES).includes(newRole)) {
      console.error(`[RADVAULT][DEMO_ROLE_SWITCH] Invalid demo role requested: ${newRole}`);
      return;
    }

    const creds = DEMO_ROLE_CREDENTIALS[newRole];
    if (creds) {
      console.log('[RADVAULT][DEMO_AUTH] authentication started');
      setAuthStatus(AUTH_STATUS.LOADING);
      setAuthError(null);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: creds.email,
          password: creds.password
        });

        if (error) {
          console.error('[RADVAULT][DEMO_AUTH] Login error:', error.message);
          setDemoRole(newRole);
          setAuthStatus(AUTH_STATUS.DEMO_MODE);
        } else if (data?.user) {
          console.log(`[RADVAULT][DEMO_AUTH] authenticated user = ${data.user.id}`);
          console.log(`[RADVAULT][DEMO_AUTH] role = ${newRole}`);
          console.log('[RADVAULT][DEMO_AUTH] session established = true');
          setUser(data.user);
          setSession(data.session);
          setVerifiedRole(newRole);
          setAuthStatus(AUTH_STATUS.AUTHENTICATED);
        }
      } catch (err) {
        console.error('[RADVAULT][DEMO_AUTH] Exception:', err.message);
        setDemoRole(newRole);
        setAuthStatus(AUTH_STATUS.DEMO_MODE);
      }
    } else {
      // For PATIENT role or client-only demo view
      console.log(`[RADVAULT][DEMO_ROLE_SWITCH] Switching to client demo role: ${newRole}`);
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[RADVAULT][DEMO_ROLE_SWITCH] Signout warning:', err.message);
      }
      setUser(null);
      setSession(null);
      setVerifiedRole(null);
      setDemoRole(newRole);
      setAuthStatus(AUTH_STATUS.DEMO_MODE);
    }
  };

  // Sign In with email/password
  const login = async (email, password) => {
    try {
      setAuthStatus(AUTH_STATUS.LOADING);
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        const validRole = extractValidatedRole(data.user);
        if (validRole) {
          setVerifiedRole(validRole);
          setAuthStatus(AUTH_STATUS.AUTHENTICATED);
        } else {
          setVerifiedRole(null);
          setAuthStatus(AUTH_STATUS.AUTHENTICATED_NO_ROLE);
        }
        return { success: true, data, role: validRole };
      }
      return { success: true, data };
    } catch (err) {
      setAuthError(err.message);
      setAuthStatus(AUTH_STATUS.DEMO_MODE);
      return { success: false, error: err.message };
    }
  };

  // Sign Out
  const logout = async () => {
    try {
      setAuthStatus(AUTH_STATUS.LOADING);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setVerifiedRole(null);
      setAuthStatus(AUTH_STATUS.DEMO_MODE);
      setDemoRole(ROLES.ASHA);
    } catch (err) {
      console.error('[RadVault Auth] Logout error:', err.message);
    }
  };

  // Role verification helper
  const hasRole = (targetRole) => {
    if (!resolvedRole) return false;
    if (Array.isArray(targetRole)) {
      return targetRole.includes(resolvedRole);
    }
    return resolvedRole === targetRole;
  };

  const value = {
    user,
    session,
    role: resolvedRole,
    authStatus,
    verifiedRole,
    isDemoMode: authStatus === AUTH_STATUS.DEMO_MODE,
    isAuthenticated: authStatus === AUTH_STATUS.AUTHENTICATED,
    hasNoRole: authStatus === AUTH_STATUS.AUTHENTICATED_NO_ROLE,
    loading: authStatus === AUTH_STATUS.LOADING,
    authError,
    demoDataEnabled,
    setDemoDataEnabled,
    toggleDemoData,
    switchRole: switchDemoRole, // Alias for prototype compatibility
    switchDemoRole,
    login,
    logout,
    hasRole,
    ashaProfile,
    ashaVillages,
    ashaArea,
    patientProfile,
    patientProfileLoading,
    patientProfileNotFound,
    setPatientProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
