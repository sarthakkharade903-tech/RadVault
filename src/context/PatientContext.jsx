import React, { createContext, useState, useEffect, useContext } from 'react';
import { getPatients } from '../services/patientService';
import { useAuth } from './AuthContext';

export const PatientContext = createContext();

// Safe in-memory seed data for Demo Mode
const DEMO_PATIENTS = [
  {
    id: "pat-demo-1",
    unified_id: "MH-P-10482",
    full_name: "Rajesh Kumar",
    age: 45,
    gender: "Male",
    blood_group: "O+",
    phone_number: "9876543210",
    address: "Shrirampur Ward 4",
    village_id: "e1111111-1111-1111-1111-111111111111",
    area_id: "d2222222-2222-2222-2222-222222222222",
    vitals: {
      emergencyContact: "Sunita Kumar (Wife)",
      emergencyPhone: "9876543211",
      conditions: ["Hypertension"],
      allergies: "Penicillin"
    },
    created_at: "2026-08-20T10:00:00Z"
  },
  {
    id: "pat-demo-2",
    unified_id: "MH-P-44021",
    full_name: "Sunita Patil",
    age: 34,
    gender: "Female",
    blood_group: "A+",
    phone_number: "9123456789",
    address: "Pimpalgaon Rural",
    village_id: "e2222222-2222-2222-2222-222222222222",
    area_id: "d2222222-2222-2222-2222-222222222222",
    vitals: {
      emergencyContact: "Anil Patil (Husband)",
      emergencyPhone: "9123456780",
      conditions: ["Type 2 Diabetes"],
      allergies: "Sulfa Drugs"
    },
    created_at: "2026-08-21T11:00:00Z"
  },
  {
    id: "pat-demo-3",
    unified_id: "MH-P-99821",
    full_name: "Amit Shinde",
    age: 29,
    gender: "Male",
    blood_group: "B+",
    phone_number: "8888888888",
    address: "Khedi Village",
    village_id: "e3333333-3333-3333-3333-333333333333",
    area_id: "d2222222-2222-2222-2222-222222222222",
    vitals: {
      emergencyContact: "Ramesh Shinde (Father)",
      emergencyPhone: "8888888889",
      conditions: [],
      allergies: "None"
    },
    created_at: "2026-08-22T09:30:00Z"
  }
];

export function PatientProvider({ children }) {
  const { ashaVillages, role, isDemoMode } = useAuth();
  const [dbPatients, setDbPatients] = useState([]);
  const [demoPatientsList, setDemoPatientsList] = useState(DEMO_PATIENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = async (villageIds = null) => {
    if (isDemoMode) {
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Determine scoped village IDs for ASHA workers
      const targetVillageIds = villageIds !== null 
        ? villageIds 
        : (role === 'asha' && ashaVillages && ashaVillages.length > 0)
          ? ashaVillages.map((v) => v.id)
          : [];

      const data = await getPatients(targetVillageIds);
      setDbPatients(data || []);
    } catch (err) {
      console.error('Error fetching patients in PatientProvider:', err);
      setError(err.message || 'Failed to load patients');
      setDbPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [ashaVillages, role, isDemoMode]);

  const addPatient = (patient) => {
    if (isDemoMode) {
      setDemoPatientsList((prev) => [patient, ...prev]);
    } else {
      fetchPatients();
    }
  };

  const patients = isDemoMode ? demoPatientsList : dbPatients;

  return (
    <PatientContext.Provider value={{ 
      patients, 
      loading, 
      error, 
      refreshPatients: fetchPatients,
      addPatient 
    }}>
      {children}
    </PatientContext.Provider>
  );
}

/**
 * Custom hook to use the PatientContext
 */
export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}

export default PatientContext;
