// Offline Government Healthcare Facility Directory (Maharashtra / Satara / Pune Region)
// Used as resilient fallback when network or online map APIs are unreachable in rural areas.

export const govHospitals = [
  // District & Sub-District Hospitals (DH / SDH)
  { id: 'DH-001', name: 'District Civil Hospital (Satara)', type: 'District Hospital', district: 'Satara', lat: 17.6805, lon: 74.0183 },
  { id: 'DH-002', name: 'Sassoon General Government Hospital', type: 'District Hospital', district: 'Pune', lat: 18.5284, lon: 73.8746 },
  { id: 'DH-003', name: 'Aundh District Hospital', type: 'District Hospital', district: 'Pune', lat: 18.5714, lon: 73.8056 },
  
  // Community Health Centres (CHC) / Rural Hospitals
  { id: 'CHC-001', name: 'Rural Hospital - Shirwal', type: 'Community Health Centre (CHC)', district: 'Satara', lat: 18.1363, lon: 73.9856 },
  { id: 'CHC-002', name: 'Rural Hospital - Saswad', type: 'Community Health Centre (CHC)', district: 'Pune', lat: 18.3411, lon: 74.0306 },
  { id: 'CHC-003', name: 'Community Health Centre - Bhor', type: 'Community Health Centre (CHC)', district: 'Pune', lat: 18.1691, lon: 73.8443 },
  { id: 'CHC-004', name: 'Rural Hospital - Khandala', type: 'Community Health Centre (CHC)', district: 'Satara', lat: 18.0412, lon: 74.0289 },
  { id: 'CHC-005', name: 'Rural Hospital - Wai', type: 'Community Health Centre (CHC)', district: 'Satara', lat: 17.9472, lon: 73.8928 },

  // Primary Health Centres (PHC)
  { id: 'PHC-001', name: 'Primary Health Centre - Shirwal', type: 'Primary Health Centre (PHC)', district: 'Satara', lat: 18.1385, lon: 73.9822 },
  { id: 'PHC-002', name: 'Primary Health Centre - Shrirampur', type: 'Primary Health Centre (PHC)', district: 'Ahmednagar', lat: 19.6197, lon: 74.6558 },
  { id: 'PHC-003', name: 'Primary Health Centre - Khed Shivapur', type: 'Primary Health Centre (PHC)', district: 'Pune', lat: 18.3241, lon: 73.8553 },
  { id: 'PHC-004', name: 'Primary Health Centre - Wagholi', type: 'Primary Health Centre (PHC)', district: 'Pune', lat: 18.5808, lon: 73.9787 },
  { id: 'PHC-005', name: 'Primary Health Centre - Loni Kalbhor', type: 'Primary Health Centre (PHC)', district: 'Pune', lat: 18.4950, lon: 74.0203 },
  { id: 'PHC-006', name: 'Primary Health Centre - Katraj', type: 'Primary Health Centre (PHC)', district: 'Pune', lat: 18.4529, lon: 73.8596 },

  // Sub-Centres (SC) / Ayushman Arogya Mandirs
  { id: 'SC-001', name: 'Sub-Centre - Naigaon', type: 'Sub-Centre / Health Wellness Centre', district: 'Satara', lat: 18.1189, lon: 73.9654 },
  { id: 'SC-002', name: 'Sub-Centre - Pargaon', type: 'Sub-Centre / Health Wellness Centre', district: 'Satara', lat: 18.1524, lon: 74.0112 },
  { id: 'SC-003', name: 'Sub-Centre - Bavdhan', type: 'Sub-Centre / Health Wellness Centre', district: 'Pune', lat: 18.5134, lon: 73.7719 },
  { id: 'SC-004', name: 'Sub-Centre - Dhayari', type: 'Sub-Centre / Health Wellness Centre', district: 'Pune', lat: 18.4485, lon: 73.8051 },
];
