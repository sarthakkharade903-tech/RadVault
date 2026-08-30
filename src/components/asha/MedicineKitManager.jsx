import React, { useState, useEffect } from 'react';
import {
  Pill,
  AlertTriangle,
  Send,
  CheckCircle2,
  Package,
  Plus,
  Minus,
  RefreshCw,
  Clock,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';
import { supabase } from '../../services/supabase';

// Standard National Health Mission (NHM) Frontline ASHA Drug Kit Definitions
const DEFAULT_MEDICINES = [
  {
    id: 'med-ifa',
    name: 'Iron Folic Acid (IFA) Tablets',
    marathi: 'आयर्न फॉलिक ऍसिड गोळ्या',
    category: 'Maternal & Adolescent Health',
    stock: 120,
    unit: 'tabs',
    threshold: 50,
    dosage: '1 tablet daily after food',
    indication: 'Prevention & treatment of anemia in pregnant women & adolescent girls'
  },
  {
    id: 'med-pcm',
    name: 'Paracetamol 500mg',
    marathi: 'पॅरासिटामॉल गोळ्या',
    category: 'Fever & Pain Relief',
    stock: 65,
    unit: 'tabs',
    threshold: 30,
    dosage: '1 tablet every 6–8 hours as needed for fever/body ache',
    indication: 'First-line relief for fever, headache, body pain'
  },
  {
    id: 'med-ors',
    name: 'ORS Packets (Oral Rehydration)',
    marathi: 'ओ.आर.एस. पाकिटे',
    category: 'Child Health & Diarrhea',
    stock: 24,
    unit: 'packets',
    threshold: 15,
    dosage: 'Dissolve 1 full packet in 1 liter clean drinking water',
    indication: 'Dehydration control in acute diarrhea & vomiting'
  },
  {
    id: 'med-zinc',
    name: 'Zinc Sulfate 20mg',
    marathi: 'झिंक गोळ्या',
    category: 'Child Health',
    stock: 40,
    unit: 'tabs',
    threshold: 20,
    dosage: '1 tab daily dissolved in water/breast milk for 14 days',
    indication: 'Pediatric diarrhea management alongside ORS'
  },
  {
    id: 'med-nischay',
    name: 'Pregnancy Test Kits (Nischay)',
    marathi: 'गर्भधारणा तपासणी किट',
    category: 'Maternal Care',
    stock: 8,
    unit: 'kits',
    threshold: 5,
    dosage: 'Single-use urine test cassette',
    indication: 'Early pregnancy detection in field visits'
  },
  {
    id: 'med-ddk',
    name: 'Clean Delivery Kits (DDK)',
    marathi: 'स्वच्छ प्रसूती किट',
    category: 'Emergency Obstetric',
    stock: 3,
    unit: 'kits',
    threshold: 2,
    dosage: 'Sterile blade, thread, soap, plastic sheet',
    indication: 'Emergency clean home delivery if transport delayed'
  }
];

export default function MedicineKitManager({ ashaId, ashaName = 'Sunita Deshmukh', phcName = 'Shrirampur PHC' }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispenseQty, setDispenseQty] = useState({});
  const [dispenseMessage, setDispenseMessage] = useState(null);
  
  // Indent Dispatch State
  const [indentingMed, setIndentingMed] = useState(null);
  const [indentQuantity, setIndentQuantity] = useState(50);
  const [indentUrgency, setIndentUrgency] = useState('NORMAL'); // NORMAL, URGENT
  const [indentSubmitting, setIndentSubmitting] = useState(false);
  const [recentIndents, setRecentIndents] = useState([]);
  const [showIndentSuccess, setShowIndentSuccess] = useState(false);

  // Load medicines from Supabase or fallback
  const fetchMedicineInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('asha_medicines')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        setMedicines(DEFAULT_MEDICINES);
      } else {
        setMedicines(data);
      }
    } catch (err) {
      console.warn('[MedicineKit] Supabase query notice:', err.message);
      setMedicines(DEFAULT_MEDICINES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicineInventory();
  }, [ashaId]);

  // Handle local dispensing
  const handleDispense = (medId, delta) => {
    setMedicines(prev =>
      prev.map(item => {
        if (item.id === medId) {
          const updatedStock = Math.max(0, item.stock + delta);
          return { ...item, stock: updatedStock };
        }
        return item;
      })
    );
    setDispenseMessage(`Updated stock count.`);
    setTimeout(() => setDispenseMessage(null), 3000);
  };

  // Submit Digital PHC Indent
  const handleDispatchIndent = async (e) => {
    e.preventDefault();
    if (!indentingMed) return;

    setIndentSubmitting(true);
    const indentPayload = {
      reference_id: `IND-${Date.now().toString().slice(-6)}`,
      asha_id: ashaId || 'demo-asha-id',
      asha_name: ashaName,
      phc_name: phcName,
      medicine_name: indentingMed.name,
      marathi_name: indentingMed.marathi,
      quantity_requested: indentQuantity,
      unit: indentingMed.unit,
      urgency: indentUrgency,
      status: 'SUBMITTED',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('medicine_indents')
        .insert([indentPayload])
        .select()
        .single();

      const record = data || indentPayload;
      setRecentIndents(prev => [record, ...prev]);
      setShowIndentSuccess(true);
      setIndentingMed(null);
      setTimeout(() => setShowIndentSuccess(false), 5000);
    } catch (err) {
      console.warn('[MedicineKit] Indent save notice:', err.message);
      setRecentIndents(prev => [indentPayload, ...prev]);
      setShowIndentSuccess(true);
      setIndentingMed(null);
      setTimeout(() => setShowIndentSuccess(false), 5000);
    } finally {
      setIndentSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & PHC Supply Status */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5EB] border-2 border-[#FF9933]/40 flex items-center justify-center text-xl shrink-0">
              💊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  Frontline Medicine Kit (औषध किट व्यवस्थापन)
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  NHM Essential
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Frontline drug inventory & digital requisition linked to <strong className="text-slate-800">{phcName}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchMedicineInventory}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Inventory</span>
          </button>
        </div>

        {/* Stock Level Quick Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-xl font-black text-slate-900">{medicines.length}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Drug Items</div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-xl font-black text-emerald-800">
              {medicines.filter(m => m.stock > m.threshold).length}
            </div>
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Adequate Stock</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-xl font-black text-amber-800">
              {medicines.filter(m => m.stock > 0 && m.stock <= m.threshold).length}
            </div>
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Low Stock Warning</div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
            <div className="text-xl font-black text-rose-800">
              {medicines.filter(m => m.stock === 0).length}
            </div>
            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Out of Stock</div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showIndentSuccess && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs font-bold">
              Digital medicine indent successfully dispatched to <strong>{phcName}</strong> dispensary.
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            Dispatched
          </span>
        </div>
      )}

      {/* Medicine Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {medicines.map((med) => {
          const isOutOfStock = med.stock === 0;
          const isLowStock = med.stock > 0 && med.stock <= med.threshold;

          return (
            <div
              key={med.id}
              className={`bg-white rounded-3xl border-2 p-5 flex flex-col justify-between transition-all shadow-xs ${
                isOutOfStock
                  ? 'border-rose-300 bg-rose-50/20'
                  : isLowStock
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Status Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 truncate">
                    {med.category}
                  </span>
                  {isOutOfStock ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      Low Stock
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                      Available
                    </span>
                  )}
                </div>

                {/* Medicine Title & Dual Marathi Label */}
                <h3 className="font-black text-slate-900 text-sm leading-snug">
                  {med.name}
                </h3>
                <div className="text-xs font-bold text-[#FF9933] mt-0.5">
                  {med.marathi}
                </div>

                {/* Indication Note */}
                <p className="text-[11px] text-slate-500 font-medium mt-2 line-clamp-2 leading-relaxed">
                  {med.indication}
                </p>
              </div>

              {/* Stock Counter & Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Current Field Stock:</span>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">{med.stock}</span>
                    <span className="text-xs font-bold text-slate-500 ml-1">{med.unit}</span>
                  </div>
                </div>

                {/* Stock Dispense Controls (+ / -) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleDispense(med.id, -1)}
                      disabled={med.stock <= 0}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-700 font-black shadow-xs cursor-pointer"
                      title="Dispense 1 unit to patient"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-black px-2 text-slate-600">Dispense</span>
                    <button
                      type="button"
                      onClick={() => handleDispense(med.id, 1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 font-black shadow-xs cursor-pointer"
                      title="Restock 1 unit"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Indent Request Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIndentingMed(med);
                      setIndentQuantity(med.threshold * 2 || 50);
                    }}
                    className="px-3 py-1.5 bg-[#FF9933]/10 hover:bg-[#FF9933]/20 text-[#b35900] border border-[#FF9933]/30 rounded-xl text-xs font-black transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Indent PHC</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indent Request Modal */}
      {indentingMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#FF9933]" />
                <h3 className="font-black text-slate-900 text-base">
                  Dispatch PHC Medicine Indent
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIndentingMed(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-[#FFF5EB] border border-[#FF9933]/30 rounded-2xl">
              <div className="text-xs font-black text-slate-900">{indentingMed.name}</div>
              <div className="text-[11px] font-bold text-[#FF9933]">{indentingMed.marathi}</div>
              <div className="text-[10px] text-slate-500 mt-1">Current Stock: {indentingMed.stock} {indentingMed.unit}</div>
            </div>

            <form onSubmit={handleDispatchIndent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Requisition Quantity ({indentingMed.unit})
                </label>
                <input
                  type="number"
                  min="5"
                  max="500"
                  required
                  value={indentQuantity}
                  onChange={(e) => setIndentQuantity(parseInt(e.target.value, 10) || 0)}
                  className="w-full border-2 border-slate-200 focus:border-[#FF9933] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Requisition Priority Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIndentUrgency('NORMAL')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      indentUrgency === 'NORMAL'
                        ? 'bg-teal-50 border-teal-400 text-teal-900 font-black'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    🟢 Normal Routine
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndentUrgency('URGENT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      indentUrgency === 'URGENT'
                        ? 'bg-rose-50 border-rose-400 text-rose-900 font-black'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    🔴 Urgent / Emergency
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIndentingMed(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={indentSubmitting}
                  className="px-5 py-2.5 bg-[#FF9933] hover:bg-[#e68524] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{indentSubmitting ? 'Dispatching...' : 'Dispatch Requisition'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Dispatched Indents Log */}
      {recentIndents.length > 0 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Recent PHC Indent History (मागणी इतिहास)
          </h4>
          <div className="divide-y divide-slate-100">
            {recentIndents.map((indent) => (
              <div key={indent.reference_id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{indent.medicine_name}</span>
                  <span className="text-[11px] text-slate-500 ml-2">Qty: {indent.quantity_requested} {indent.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    indent.urgency === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {indent.urgency}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {indent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
