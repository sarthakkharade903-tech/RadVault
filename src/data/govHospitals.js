// Mock database of authentic government hospitals in Maharashtra (Pune District region)
// In a real production app, this would be downloaded/synced periodically from the ABDM HFR database.

export const govHospitals = [
  // District Hospitals (DH)
  { id: "DH-001", name: "District Civil Hospital (Aundh)", type: "DH", lat: 18.5714, lon: 73.8056 },
  { id: "DH-002", name: "Sassoon General Government Hospital", type: "DH", lat: 18.5284, lon: 73.8746 },
  
  // Community Health Centres (CHC) / Rural Hospitals
  { id: "CHC-001", name: "Rural Hospital - Saswad", type: "CHC", lat: 18.3411, lon: 74.0306 },
  { id: "CHC-002", name: "Rural Hospital - Shirur", type: "CHC", lat: 18.8260, lon: 74.3756 },
  { id: "CHC-003", name: "Community Health Centre - Bhor", type: "CHC", lat: 18.1691, lon: 73.8443 },
  { id: "CHC-004", name: "Rural Hospital - Paud", type: "CHC", lat: 18.5244, lon: 73.5786 },

  // Primary Health Centres (PHC)
  { id: "PHC-001", name: "Primary Health Centre - Wagholi", type: "PHC", lat: 18.5808, lon: 73.9787 },
  { id: "PHC-002", name: "Primary Health Centre - Hinjewadi", type: "PHC", lat: 18.5913, lon: 73.7389 },
  { id: "PHC-003", name: "Primary Health Centre - Katraj", type: "PHC", lat: 18.4529, lon: 73.8596 },
  { id: "PHC-004", name: "Primary Health Centre - Hadapsar", type: "PHC", lat: 18.5089, lon: 73.9259 },
  { id: "PHC-005", name: "Primary Health Centre - Loni Kalbhor", type: "PHC", lat: 18.4950, lon: 74.0203 },
  { id: "PHC-006", name: "Primary Health Centre - Alandi", type: "PHC", lat: 18.6756, lon: 73.8906 },
  { id: "PHC-007", name: "Primary Health Centre - Khed Shivapur", type: "PHC", lat: 18.3241, lon: 73.8553 },
  { id: "PHC-008", name: "Primary Health Centre - Uruli Kanchan", type: "PHC", lat: 18.4893, lon: 74.1378 },

  // Sub-Centres (SC) / Ayushman Arogya Mandirs
  { id: "SC-001", name: "Sub-Centre - Bavdhan", type: "SC", lat: 18.5134, lon: 73.7719 },
  { id: "SC-002", name: "Sub-Centre - Sus Gaon", type: "SC", lat: 18.5529, lon: 73.7371 },
  { id: "SC-003", name: "Sub-Centre - Narhe", type: "SC", lat: 18.4501, lon: 73.8242 },
  { id: "SC-004", name: "Sub-Centre - Pisoli", type: "SC", lat: 18.4357, lon: 73.8967 },
  { id: "SC-005", name: "Sub-Centre - Manjari", type: "SC", lat: 18.5170, lon: 73.9856 },
  { id: "SC-006", name: "Sub-Centre - Lohegaon", type: "SC", lat: 18.6015, lon: 73.9142 },
  { id: "SC-007", name: "Sub-Centre - Dhayari", type: "SC", lat: 18.4485, lon: 73.8051 },
  { id: "SC-008", name: "Sub-Centre - Undri", type: "SC", lat: 18.4533, lon: 73.9152 },
];
