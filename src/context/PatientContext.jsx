import React, { createContext, useState, useEffect, useContext } from 'react';
import { getPatients } from '../services/patientService';

export const PatientContext = createContext();

export function PatientProvider({ children }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPatients();
      setPatients(data || []);
    } catch (err) {
      console.error('Error fetching patients in PatientProvider:', err);
      setError(err.message || 'Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <PatientContext.Provider value={{ patients, loading, error, refreshPatients: fetchPatients }}>
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
