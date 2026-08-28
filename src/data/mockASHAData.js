// Mock data structured exactly like Supabase will return
// When we wire Supabase, swap these with DB queries

export const ashaWorker = {
  id: 'asha_001',
  name: 'Priya Deshmukh',
  village: 'Vadgaon',
  sub_village: 'Tambe Wadi',
  block: 'Haveli',
  district: 'Pune',
  mobile: '9876543210',
  asha_id: 'MH-PUNE-2847',
};

export const mockPatients = [
  { id: 'p1', name: 'Sunita Bai Kamble', age: 24, gender: 'F', village: 'Vadgaon', mobile: '9823001122', blood_group: 'B+', status: 'red', is_pregnant: true, is_child: false, has_chronic: false, chronic_conditions: [], last_visit: '2026-08-19', activation_email: null },
  { id: 'p2', name: 'Ramu Bhaurao Patil', age: 48, gender: 'M', village: 'Vadgaon', mobile: '9823445566', blood_group: 'O+', status: 'yellow', is_pregnant: false, is_child: false, has_chronic: true, chronic_conditions: ['Diabetes','Hypertension'], last_visit: '2026-08-22', activation_email: 'ramu.patil@gmail.com' },
  { id: 'p3', name: 'Baby Aisha (f/o Fatima)', age: 1, gender: 'F', village: 'Tambe Wadi', mobile: '9812334455', blood_group: null, status: 'yellow', is_pregnant: false, is_child: true, has_chronic: false, chronic_conditions: [], last_visit: '2026-08-15', activation_email: null },
  { id: 'p4', name: 'Meena Vitthal Shinde', age: 29, gender: 'F', village: 'Vadgaon', mobile: '9867123456', blood_group: 'A+', status: 'green', is_pregnant: true, is_child: false, has_chronic: false, chronic_conditions: [], last_visit: '2026-08-24', activation_email: 'meena.shinde@gmail.com' },
  { id: 'p5', name: 'Kiran Dagdu More', age: 65, gender: 'M', village: 'Tambe Wadi', mobile: '9890012345', blood_group: 'AB+', status: 'green', is_pregnant: false, is_child: false, has_chronic: true, chronic_conditions: ['Asthma'], last_visit: '2026-08-20', activation_email: null },
];

export const mockANCRecords = [
  { id: 'anc1', patient_id: 'p1', patient_name: 'Sunita Bai Kamble', lmp_date: '2026-03-10', edd: '2026-12-15', anc_visits_done: 1, ifa_given: true, tt_dose1: true, tt_dose2: false, tt_booster: false, institutional_delivery: true, weeks_pregnant: 24 },
  { id: 'anc2', patient_id: 'p4', patient_name: 'Meena Vitthal Shinde', lmp_date: '2026-05-02', edd: '2027-02-06', anc_visits_done: 3, ifa_given: true, tt_dose1: true, tt_dose2: true, tt_booster: false, institutional_delivery: true, weeks_pregnant: 16 },
];

export const mockImmunizationRecords = [
  { id: 'imm1', patient_id: 'p3', patient_name: 'Baby Aisha', bcg: true, opv: true, dpt: true, hep_b: true, measles: false, mr: false, muac_zone: 'yellow', weight_kg: 7.2, height_cm: 70 },
];

export const mockReferrals = [
  { id: 'ref1', patient_name: 'Sunita Bai Kamble', patient_id: 'p1', priority: 'red', priority_label: 'Emergency', referred_on: '2026-08-24', days_ago: 2, status: 'accepted', appointment: '27 Aug, 10:00 AM', destination_hospital: 'Sasoon General Hospital, Pune', symptoms: 'Severe headache, BP 160/110' },
  { id: 'ref2', patient_name: 'Ramu Bhaurao Patil', patient_id: 'p2', priority: 'yellow', priority_label: 'High', referred_on: '2026-08-21', days_ago: 5, status: 'pending', appointment: null, destination_hospital: 'PHC Vadgaon, Haveli Block', symptoms: 'Blood sugar 280 mg/dL, fatigue' },
];

export const getDueList = () => [
  { type: 'anc', urgent: true, patient_id: 'p1', patient_name: 'Sunita Bai Kamble', label: '2nd ANC Visit due', detail: '24 weeks pregnant — ANC-2 is overdue by 3 days', badge: 'ANC', badgeColor: 'bg-red-500' },
  { type: 'immunization', urgent: false, patient_id: 'p3', patient_name: 'Baby Aisha', label: 'Measles vaccine due', detail: 'Child aged 12 months — measles & MR pending', badge: 'Vaccine', badgeColor: 'bg-amber-500' },
  { type: 'followup', urgent: true, patient_id: 'p2', patient_name: 'Ramu Bhaurao Patil', label: 'Referral no response — 5 days', detail: 'PHC has not updated referral status. Follow up needed.', badge: 'Referral', badgeColor: 'bg-orange-500' },
];

export const mockActivityStats = {
  month: 'August 2026',
  home_visits: 14,
  referrals_submitted: 4,
  referrals_completed: 3,
  referrals_pending: 1,
  anc_registrations: 2,
  immunizations_recorded: 5,
  new_patients_registered: 3,
  closed_loop_referrals: 3,
};
