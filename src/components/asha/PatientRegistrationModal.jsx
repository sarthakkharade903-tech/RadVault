import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, X, AlertCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { checkDuplicateBeneficiary } from '../../services/encounterService';
import { useAuth } from '../../context/AuthContext';

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

export default function PatientRegistrationModal({
  isOpen,
  onClose,
  initialName = '',
  patients = [],
  onSelectExistingPatient,
  onPatientCreated
}) {
  const { ashaVillages, ashaArea, isDemoMode } = useAuth();

  const [fullName, setFullName] = useState(initialName);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('Shrirampur Ward 4');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [knownConditions, setKnownConditions] = useState([]);
  const [allergies, setAllergies] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState(false);

  // Set default village dynamically based on ASHA assignments
  useEffect(() => {
    if (ashaVillages && ashaVillages.length > 0) {
      setVillage(ashaVillages[0].name);
    }
  }, [ashaVillages, isOpen]);

  // Check for potential duplicate in real-time
  const duplicateMatch = useMemo(() => {
    if (ignoreDuplicateWarning) return null;
    return checkDuplicateBeneficiary({ fullName, age, phone, village }, patients);
  }, [fullName, age, phone, village, patients, ignoreDuplicateWarning]);

  if (!isOpen) return null;

  const toggleCondition = (cond) => {
    setKnownConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter patient full name.');
      return;
    }
    if (!age || isNaN(age) || parseInt(age) < 0 || parseInt(age) > 125) {
      setError('Please enter a valid patient age.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const generatedUnifiedId = `MH-P-${Math.floor(10000 + Math.random() * 90000)}`;

      // Resolve village_id and area_id based on selection
      const selectedVillageObj = ashaVillages?.find(v => v.name === village);
      const villageId = selectedVillageObj?.id || null;
      const areaId = selectedVillageObj?.area_id || ashaArea?.id || null;

      const newPatientRecord = {
        id: `pat-local-${Date.now()}`,
        unified_id: generatedUnifiedId,
        full_name: fullName.trim(),
        age: parseInt(age),
        gender,
        blood_group: bloodGroup,
        phone_number: phone.trim() || null,
        address: village.trim(),
        village_id: villageId,
        area_id: areaId,
        vitals: {
          emergencyContact: emergencyContact.trim(),
          emergencyPhone: emergencyPhone.trim(),
          conditions: knownConditions,
          allergies: allergies.trim()
        },
        created_at: new Date().toISOString()
      };

      // Try saving to Supabase if connected (skipped in Demo Mode)
      if (!isDemoMode) {
        try {
          const { data, err } = await supabase
            .from('patients')
            .insert([{
              unified_id: newPatientRecord.unified_id,
              full_name: newPatientRecord.full_name,
              age: newPatientRecord.age,
              gender: newPatientRecord.gender,
              blood_group: newPatientRecord.blood_group,
              phone_number: newPatientRecord.phone_number,
              vitals: newPatientRecord.vitals,
              village_id: villageId,
              area_id: areaId
            }])
            .select();

          if (!err && data && data.length > 0) {
            newPatientRecord.id = data[0].id;
          }
        } catch (dbErr) {
          console.warn('Supabase DB registration note (local fallback active):', dbErr.message);
        }
      }

      onPatientCreated(newPatientRecord);
      onClose();
    } catch (err) {
      console.error('Failed to register patient:', err);
      setError(`Registration error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5EB] border border-[#FF9933]/40 flex items-center justify-center text-[#b35900]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Register New Beneficiary</h2>
              <p className="text-xs text-slate-500 font-medium">Frontline intake for village registry</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Duplicate Match Warning Banner */}
          {duplicateMatch && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 space-y-2.5 shadow-2xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-extrabold text-amber-900 block">Possible Existing Beneficiary Found</span>
                  <span>A registered patient matches this name/phone:</span>
                  <div className="font-black text-slate-900 mt-1 bg-white p-2 rounded-lg border border-amber-200">
                    {duplicateMatch.full_name || duplicateMatch.name} ({duplicateMatch.unified_id}) · {duplicateMatch.age} yrs · {duplicateMatch.address || 'Village'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {onSelectExistingPatient && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectExistingPatient(duplicateMatch);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-[#008080] hover:bg-[#006666] text-white font-black text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Open Existing Record</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIgnoreDuplicateWarning(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Continue New Intake
                </button>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] focus:bg-white rounded-xl text-xs font-bold outline-none"
            />
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                Age (Years) *
              </label>
              <input
                type="number"
                required
                min="0"
                max="125"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 52"
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] focus:bg-white rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                Gender *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] rounded-xl text-xs font-bold outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Blood Group & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] rounded-xl text-xs font-bold outline-none"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] focus:bg-white rounded-xl text-xs font-bold outline-none"
              />
            </div>
          </div>

          {/* Village / Ward Address */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Village / Ward Location *
            </label>
            <select
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-[#008080] rounded-xl text-xs font-bold outline-none"
            >
              {ashaVillages && ashaVillages.length > 0 ? (
                ashaVillages.map((v) => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))
              ) : (
                <option value="Shrirampur Ward 4">Shrirampur Ward 4</option>
              )}
            </select>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. Sunita (Wife)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#008080] rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
                Emergency Phone
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="e.g. 9876500000"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#008080] rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          {/* Known Chronic Conditions */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
              Known Chronic Conditions
            </label>
            <div className="flex flex-wrap gap-2">
              {['Hypertension', 'Diabetes Type 2', 'Asthma', 'Heart Disease', 'TB', 'Pregnancy'].map((cond) => {
                const isSelected = knownConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#008080] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1">
              Documented Drug Allergies
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Sulfa drugs (Leave blank if none)"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-[#008080] rounded-xl text-xs outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#FF9933] hover:bg-[#e68a2e] text-slate-950 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Registering…' : 'Complete Registration & Open Record →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
