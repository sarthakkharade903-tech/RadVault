import React, { useState } from 'react';
import {
  Package, Search, Plus, Minus, AlertCircle, CheckCircle2,
  ShoppingCart, X, RefreshCw, TrendingDown, TrendingUp,
  Clock, User, Pill, FileText, Download, Filter, ChevronDown,
  BarChart2, AlertTriangle, Truck, Building2, Printer, Check,
  QrCode, Sparkles, Tag, ShieldCheck, Sun, Moon, Utensils
} from 'lucide-react';
import { SAMPLE_PATIENTS } from './radvault/SampleData';

// ─── Pre-seeded Pharmacy Medicine Stock ─────────────────────────────────────
const INITIAL_STOCK = [
  { id: 'MED-001', name: 'Amoxicillin 500mg', salt: 'Amoxicillin Trihydrate', category: 'Antibiotic', unit: 'Capsules', stock: 240, minLevel: 50, price: 8.5, genericPrice: 2.2, genericName: 'Jan Aushadhi Amoxicillin', supplier: 'Cipla Ltd.', batch: 'CIP-2026-X8', expiry: '2027-06', rack: 'Rack A-1' },
  { id: 'MED-002', name: 'Paracetamol 650mg', salt: 'Acetaminophen / Paracetamol', category: 'Analgesic & Antipyretic', unit: 'Tablets', stock: 850, minLevel: 100, price: 2.0, genericPrice: 0.6, genericName: 'Jan Aushadhi Paracetamol', supplier: 'Sun Pharma', batch: 'SUN-650-B4', expiry: '2027-12', rack: 'Rack A-2' },
  { id: 'MED-003', name: 'Azithromycin 500mg', salt: 'Azithromycin Dihydrate', category: 'Antibiotic', unit: 'Tablets', stock: 38, minLevel: 40, price: 35.0, genericPrice: 9.5, genericName: 'Jan Aushadhi Azithro', supplier: 'Dr. Reddy\'s', batch: 'DRR-500-Z1', expiry: '2026-11', rack: 'Rack A-3' },
  { id: 'MED-004', name: 'Metformin 500mg', salt: 'Metformin Hydrochloride (SR)', category: 'Antidiabetic', unit: 'Tablets', stock: 600, minLevel: 100, price: 4.5, genericPrice: 1.1, genericName: 'Jan Aushadhi Metformin', supplier: 'USV Ltd.', batch: 'USV-MET-99', expiry: '2027-09', rack: 'Rack B-1' },
  { id: 'MED-005', name: 'Amlodipine 5mg', salt: 'Amlodipine Besylate', category: 'Cardiac & BP', unit: 'Tablets', stock: 12, minLevel: 50, price: 6.0, genericPrice: 1.4, genericName: 'Jan Aushadhi Amlodipine', supplier: 'Lupin Ltd.', batch: 'LUP-5-A3', expiry: '2027-03', rack: 'Rack B-2' },
  { id: 'MED-006', name: 'Pantoprazole 40mg', salt: 'Pantoprazole Sodium Gastro-Resistant', category: 'GI & Antacid', unit: 'Tablets', stock: 400, minLevel: 80, price: 5.5, genericPrice: 1.8, genericName: 'Jan Aushadhi Panto 40', supplier: 'Torrent Pharma', batch: 'TOR-PAN-77', expiry: '2027-08', rack: 'Rack B-3' },
  { id: 'MED-007', name: 'Ibuprofen 400mg', salt: 'Ibuprofen IP', category: 'NSAID / Pain Relief', unit: 'Tablets', stock: 520, minLevel: 100, price: 3.0, genericPrice: 0.9, genericName: 'Jan Aushadhi Ibuprofen', supplier: 'Cipla Ltd.', batch: 'CIP-IBU-12', expiry: '2027-06', rack: 'Rack C-1' },
  { id: 'MED-008', name: 'Cefixime 200mg', salt: 'Cefixime Trihydrate', category: 'Antibiotic (3rd Gen)', unit: 'Tablets', stock: 75, minLevel: 40, price: 45.0, genericPrice: 12.0, genericName: 'Jan Aushadhi Cefixime', supplier: 'Alkem Labs', batch: 'ALK-CEF-55', expiry: '2026-10', rack: 'Rack C-2' },
  { id: 'MED-009', name: 'Vitamin D3 60000 IU', salt: 'Cholecalciferol', category: 'Supplements', unit: 'Capsules', stock: 90, minLevel: 30, price: 28.0, genericPrice: 7.0, genericName: 'Jan Aushadhi Vitamin D3', supplier: 'Abbott India', batch: 'ABB-D3-89', expiry: '2027-02', rack: 'Rack D-1' },
  { id: 'MED-010', name: 'Iron + Folic Acid', salt: 'Ferrous Ascorbate + Folic Acid', category: 'Supplements & Anemia', unit: 'Tablets', stock: 700, minLevel: 150, price: 1.5, genericPrice: 0.4, genericName: 'Jan Aushadhi Iron-Folic', supplier: 'Wockhardt', batch: 'WOC-FE-33', expiry: '2027-11', rack: 'Rack D-2' },
  { id: 'MED-011', name: 'Atorvastatin 20mg', salt: 'Atorvastatin Calcium', category: 'Cardiac / Statin', unit: 'Tablets', stock: 18, minLevel: 50, price: 12.0, genericPrice: 3.2, genericName: 'Jan Aushadhi Atorva', supplier: 'Sun Pharma', batch: 'SUN-ATO-44', expiry: '2027-04', rack: 'Rack E-1' },
  { id: 'MED-012', name: 'Salbutamol Inhaler 100mcg', salt: 'Salbutamol Sulphate Inhalation Aerosol', category: 'Respiratory / Asthma', unit: 'Units', stock: 22, minLevel: 10, price: 120.0, genericPrice: 42.0, genericName: 'Jan Aushadhi Salbutamol', supplier: 'GSK India', batch: 'GSK-INH-01', expiry: '2026-12', rack: 'Rack E-2' }
];

// ─── Pre-seeded Incoming e-Prescription Orders ──────────────────────────────
const INITIAL_ORDERS = [
  {
    id: 'ORD-2026-101',
    rxId: 'RX-2026-8801',
    patientId: 'MH-P-10482',
    patientName: 'Ramesh Patil',
    patientAge: 54,
    patientGender: 'Male',
    village: 'Koregaon, Satara',
    doctorName: 'Dr. Medical Officer (PHC Shirwal)',
    prescribedAt: '2026-08-22 09:30 AM',
    diagnosis: 'Acute Bacterial Lobar Pneumonia',
    status: 'pending', // 'pending', 'ready', 'dispensed'
    items: [
      { medId: 'MED-001', name: 'Amoxicillin 500mg', qty: 20, price: 8.5, total: 170, timing: 'Twice daily (BD) - Morning & Night', withFood: 'After Food (Post Meal)' },
      { medId: 'MED-002', name: 'Paracetamol 650mg', qty: 10, price: 2.0, total: 20, timing: 'Thrice daily (TDS) - If Fever > 100°F', withFood: 'After Food' },
      { medId: 'MED-006', name: 'Pantoprazole 40mg', qty: 10, price: 5.5, total: 55, timing: 'Once daily (OD) - Morning', withFood: 'Before Food (Empty Stomach)' }
    ]
  },
  {
    id: 'ORD-2026-102',
    rxId: 'RX-2026-8802',
    patientId: 'MH-P-10492',
    patientName: 'Anil Deshmukh',
    patientAge: 28,
    patientGender: 'Male',
    village: 'Patan, Satara',
    doctorName: 'Dr. Ortho Specialist (Patan Emergency)',
    prescribedAt: '2026-08-22 10:15 AM',
    diagnosis: 'Colles Fracture Right Radius - Post Reduction Pain',
    status: 'ready',
    items: [
      { medId: 'MED-007', name: 'Ibuprofen 400mg', qty: 15, price: 3.0, total: 45, timing: 'Twice daily (BD)', withFood: 'After Food' },
      { medId: 'MED-002', name: 'Paracetamol 650mg', qty: 15, price: 2.0, total: 30, timing: 'Twice daily (BD)', withFood: 'After Food' },
      { medId: 'MED-009', name: 'Vitamin D3 60000 IU', qty: 4, price: 28.0, total: 112, timing: 'Once a week (Sunday)', withFood: 'With Milk / Meal' }
    ]
  },
  {
    id: 'ORD-2026-103',
    rxId: 'RX-2026-8803',
    patientId: 'MH-P-10485',
    patientName: 'Sunita Shinde',
    patientAge: 42,
    patientGender: 'Female',
    village: 'Wai, Satara',
    doctorName: 'Dr. Neurologist (Wai Rural Hospital)',
    prescribedAt: '2026-08-21 03:00 PM',
    diagnosis: 'Chronic Migraine Prophylaxis',
    status: 'dispensed',
    items: [
      { medId: 'MED-006', name: 'Pantoprazole 40mg', qty: 30, price: 5.5, total: 165, timing: 'Once daily (OD)', withFood: 'Before Food' },
      { medId: 'MED-010', name: 'Iron + Folic Acid', qty: 30, price: 1.5, total: 45, timing: 'Once daily (OD)', withFood: 'After Lunch' }
    ]
  }
];

export default function PharmacyDashboard({ onBack }) {
  const [stock, setStock] = useState(INITIAL_STOCK);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'stock' | 'pos' | 'alerts'
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState(null);
  const [selectedOrderForDispense, setSelectedOrderForDispense] = useState(null);

  // New Medicine Form State
  const [newMedName, setNewMedName] = useState('');
  const [newMedSalt, setNewMedSalt] = useState('');
  const [newMedCategory, setNewMedCategory] = useState('Antibiotic');
  const [newMedUnit, setNewMedUnit] = useState('Tablets');
  const [newMedStock, setNewMedStock] = useState('200');
  const [newMedMin, setNewMedMin] = useState('40');
  const [newMedPrice, setNewMedPrice] = useState('12.50');
  const [newMedGenericPrice, setNewMedGenericPrice] = useState('3.50');
  const [newMedSupplier, setNewMedSupplier] = useState('Cipla Ltd.');
  const [newMedBatch, setNewMedBatch] = useState('CIP-2026-N1');
  const [newMedExpiry, setNewMedExpiry] = useState('2027-12');
  const [newMedRack, setNewMedRack] = useState('Rack A-4');

  const lowStockItems = stock.filter(m => m.stock <= m.minLevel);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const categories = ['All', ...Array.from(new Set(stock.map(m => m.category)))];

  const filteredStock = stock.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.salt.toLowerCase().includes(search.toLowerCase()) ||
      m.supplier.toLowerCase().includes(search.toLowerCase()) ||
      m.batch.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'All' || m.category === filterCategory;
    return matchSearch && matchCat;
  });

  const handleUpdateQty = (id, delta) => {
    setStock(prev => prev.map(m => m.id === id ? { ...m, stock: Math.max(0, m.stock + delta) } : m));
  };

  const handleDispenseOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Deduct stock for all items
    order.items.forEach(item => {
      setStock(prev => prev.map(m => m.id === item.medId ? { ...m, stock: Math.max(0, m.stock - item.qty) } : m));
    });

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'dispensed' } : o));
    setSelectedOrderForDispense(null);
    alert(`Order ${orderId} successfully verified & dispensed! Stock levels updated.`);
  };

  const handleAddMedicine = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `MED-0${stock.length + 1}`,
      name: newMedName,
      salt: newMedSalt || newMedName,
      category: newMedCategory,
      unit: newMedUnit,
      stock: parseInt(newMedStock) || 100,
      minLevel: parseInt(newMedMin) || 30,
      price: parseFloat(newMedPrice) || 10,
      genericPrice: parseFloat(newMedGenericPrice) || 3,
      genericName: `Jan Aushadhi ${newMedName.split(' ')[0]}`,
      supplier: newMedSupplier,
      batch: newMedBatch,
      expiry: newMedExpiry,
      rack: newMedRack
    };

    setStock(prev => [newEntry, ...prev]);
    setShowAddModal(false);
    // Reset Form
    setNewMedName('');
    setNewMedSalt('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">

      {/* ── Top Navigation Bar ── */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl shadow-sm">
            💊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-slate-900 text-base tracking-tight">Pharmacy &amp; Druggist Dispensing Hub</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 uppercase">
                Jan Aushadhi Synced
              </span>
            </div>
            <p className="text-xs text-slate-400">e-Prescription Ingestion • Real-Time Stock Tracking • Jan Aushadhi Savings</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lowStockItems.length > 0 && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-black px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" /> {lowStockItems.length} Low Stock Alert
            </span>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medicine</span>
          </button>

          <button
            onClick={onBack}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ← Portals Home
          </button>
        </div>
      </header>

      {/* ── Key Metrics Overview ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Doctor Prescriptions</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingOrders.length} <span className="text-xs text-amber-500 font-bold">To Dispense</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
            📥
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Medicines in Stock</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{stock.length} <span className="text-xs text-indigo-600 font-bold">Formulations</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">
            📦
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Critical / Low Stock Items</p>
            <p className="text-2xl font-black text-red-600 mt-0.5">{lowStockItems.length} <span className="text-xs text-red-500 font-bold">Need PO</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-lg font-bold">
            ⚠️
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dispensed Today</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">
              {orders.filter(o => o.status === 'dispensed').length} <span className="text-xs text-emerald-500 font-bold">Completed</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
            ✅
          </div>
        </div>
      </section>

      {/* ── Main Tab Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 w-full flex-1">

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 mb-5 bg-white rounded-2xl p-1 shadow-xs gap-1 overflow-x-auto">
          {[
            { key: 'orders', label: `📋 Incoming e-Prescription Queue (${pendingOrders.length})` },
            { key: 'stock', label: `📦 Medicine Stock & Inventory (${stock.length})` },
            { key: 'alerts', label: `⚠️ Low Stock & Re-Order Hub (${lowStockItems.length})` },
            { key: 'pos', label: '🏷️ Jan Aushadhi Generic Savings Calculator' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB 1: INCOMING E-PRESCRIPTION QUEUE ── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Active Patient e-Prescriptions</h3>
                <p className="text-xs text-slate-400">Incoming prescription stream from Doctor Consultation Workstations</p>
              </div>
              <span className="text-xs text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                Verified with Ayushman Bharat ID
              </span>
            </div>

            <div className="space-y-3">
              {orders.map(order => {
                const isPending = order.status === 'pending';
                const totalOrderPrice = order.items.reduce((acc, i) => acc + i.total, 0);

                return (
                  <div
                    key={order.id}
                    className={`bg-white border-2 rounded-2xl p-5 shadow-xs transition-all ${
                      isPending ? 'border-amber-300 hover:border-indigo-400' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Patient Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xl flex-shrink-0 text-indigo-700 font-black">
                          {order.patientName.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-slate-900 text-base">{order.patientName}</h4>
                            <span className="text-xs font-mono font-bold text-slate-400">ID: {order.patientId}</span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase border ${
                              order.status === 'dispensed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              order.status === 'ready' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {order.status === 'dispensed' ? '✅ Dispensed' : order.status === 'ready' ? '📦 Ready' : '⏳ Awaiting Dispense'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 mt-0.5">
                            {order.patientAge}y {order.patientGender} • {order.village} • Prescribed by <strong>{order.doctorName}</strong>
                          </p>
                          <p className="text-xs font-bold text-indigo-900 mt-1 bg-indigo-50/70 px-2.5 py-1 rounded-lg border border-indigo-100 inline-block">
                            Diagnosis: {order.diagnosis}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-end lg:self-start">
                        <button
                          onClick={() => setSelectedOrderForLabel(order)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" /> Dosage Label (Multilingual)
                        </button>

                        {order.status !== 'dispensed' && (
                          <button
                            onClick={() => handleDispenseOrder(order.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Verify &amp; Dispense
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Prescribed Drugs Table */}
                    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                          <tr>
                            <th className="text-left p-2.5">Medicine Name</th>
                            <th className="text-left p-2.5">Dosage Timing</th>
                            <th className="text-left p-2.5">Food Guidance</th>
                            <th className="text-center p-2.5">Qty</th>
                            <th className="text-right p-2.5">Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {order.items.map((item, idx) => {
                            const matchingStock = stock.find(s => s.id === item.medId);
                            const hasStock = matchingStock ? matchingStock.stock >= item.qty : true;

                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5">
                                  <p className="font-bold text-slate-900">{item.name}</p>
                                  {matchingStock && (
                                    <p className="text-[10px] text-slate-400">
                                      Location: {matchingStock.rack} • Available: <strong className={hasStock ? 'text-emerald-600' : 'text-red-600'}>{matchingStock.stock}</strong>
                                    </p>
                                  )}
                                </td>
                                <td className="p-2.5 font-medium text-slate-700">{item.timing}</td>
                                <td className="p-2.5 text-slate-600">{item.withFood}</td>
                                <td className="p-2.5 text-center font-bold text-slate-800">{item.qty}</td>
                                <td className="p-2.5 text-right font-black text-slate-900">₹{item.total.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t border-slate-200">
                          <tr>
                            <td colSpan={4} className="p-2.5 text-right font-bold text-slate-600">Total Prescription Bill:</td>
                            <td className="p-2.5 text-right font-black text-indigo-700 text-sm">₹{totalOrderPrice.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 2: MEDICINE STOCK & INVENTORY ── */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            {/* Search & Filter */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search drug, chemical salt, batch, supplier..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 font-medium"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setFilterCategory(c)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                      filterCategory === c
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicine Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="text-left p-3">Medicine &amp; Formulation</th>
                    <th className="text-left p-3 hidden sm:table-cell">Salt Composition</th>
                    <th className="text-center p-3">Current Stock</th>
                    <th className="text-left p-3 hidden md:table-cell">Rack &amp; Batch</th>
                    <th className="text-right p-3">Retail Price</th>
                    <th className="text-center p-3">Quick Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStock.map(med => {
                    const isLow = med.stock <= med.minLevel;
                    const stockRatio = Math.min(100, (med.stock / (med.minLevel * 2.5)) * 100);

                    return (
                      <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <p className="font-extrabold text-slate-900">{med.name}</p>
                          <span className="text-[10px] px-2 py-0.2 bg-slate-100 text-slate-600 rounded-full font-semibold">
                            {med.category} • {med.unit}
                          </span>
                        </td>

                        <td className="p-3 hidden sm:table-cell">
                          <p className="text-slate-700 font-medium">{med.salt}</p>
                          <p className="text-[10px] text-slate-400">Mfg: {med.supplier} • Exp: {med.expiry}</p>
                        </td>

                        <td className="p-3 text-center">
                          <span className={`text-base font-black ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                            {med.stock} {med.unit}
                          </span>
                          <div className="w-20 h-1.5 bg-slate-200 rounded-full mx-auto mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                              style={{ width: `${stockRatio}%` }}
                            />
                          </div>
                        </td>

                        <td className="p-3 hidden md:table-cell">
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {med.rack}
                          </span>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{med.batch}</p>
                        </td>

                        <td className="p-3 text-right">
                          <span className="font-black text-slate-800 text-sm">₹{med.price.toFixed(2)}</span>
                          <p className="text-[10px] text-emerald-600 font-bold">Generic: ₹{med.genericPrice.toFixed(2)}</p>
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleUpdateQty(med.id, -10)}
                              className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs border border-red-200 transition-colors"
                              title="Dispense 10 units"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateQty(med.id, 100)}
                              className="w-7 h-7 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs border border-emerald-200 transition-colors"
                              title="Restock 100 units"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: LOW STOCK & PURCHASE ORDER RE-ORDER HUB ── */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Automated Supply Chain &amp; Supplier Re-Orders</h3>
                <p className="text-xs text-slate-400">Items below minimum safety stock buffer requiring immediate replenishment</p>
              </div>
              <button
                onClick={() => alert(`Purchase Order PO-2026-${Math.floor(100+Math.random()*900)} automatically dispatched to Cipla, Lupin & Sun Pharma!`)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors"
              >
                <Truck className="w-4 h-4" />
                <span>Dispatch Bulk PO to All Suppliers</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lowStockItems.map(item => (
                <div key={item.id} className="bg-white border-2 border-red-200 rounded-2xl p-4 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        CRITICAL STOCK ALERT
                      </span>
                      <h4 className="font-black text-slate-900 text-base mt-1">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.salt} • {item.supplier}</p>
                    </div>
                    <span className="text-2xl font-black text-red-600">{item.stock}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-red-50/50 p-2.5 rounded-xl border border-red-100">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">Minimum Safety Buffer</span>
                      <span className="font-bold text-slate-800">{item.minLevel} {item.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">Recommended Restock Qty</span>
                      <span className="font-bold text-indigo-700">+300 {item.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-400 text-[11px]">Storage: <strong>{item.rack}</strong></span>
                    <button
                      onClick={() => handleUpdateQty(item.id, 200)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Order +200 Units
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: JAN AUSHADHI GENERIC SAVINGS CALCULATOR ── */}
        {activeTab === 'pos' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) Calculator</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Empowering rural patients by offering high-quality generic alternatives at 50% - 85% reduced cost.
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="text-left p-3">Branded Medicine</th>
                    <th className="text-left p-3">Jan Aushadhi Generic Equivalent</th>
                    <th className="text-right p-3">Branded MRP (₹)</th>
                    <th className="text-right p-3">Jan Aushadhi Price (₹)</th>
                    <th className="text-right p-3">Patient Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stock.slice(0, 6).map(m => {
                    const savingPct = Math.round(((m.price - m.genericPrice) / m.price) * 100);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{m.name}</td>
                        <td className="p-3 text-indigo-700 font-semibold">{m.genericName}</td>
                        <td className="p-3 text-right text-slate-500 font-semibold">₹{m.price.toFixed(2)}</td>
                        <td className="p-3 text-right font-black text-emerald-700 text-sm">₹{m.genericPrice.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-black rounded-md border border-emerald-200">
                            Save {savingPct}% (₹{(m.price - m.genericPrice).toFixed(2)})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ── MULTILINGUAL DOSAGE LABEL MODAL (FOR RURAL PATIENTS) ── */}
      {selectedOrderForLabel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-700 to-slate-900 text-white px-5 py-3.5 flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm">🏷️ Patient Medicine Dosage Label (सुलभ औषध पत्रिका)</h3>
                <p className="text-[11px] text-indigo-200">Pictorial meal &amp; timing instructions for rural patient accessibility</p>
              </div>
              <button onClick={() => setSelectedOrderForLabel(null)} className="p-1 text-white hover:bg-white/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-800">
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block font-bold">Patient Name / रुग्ण</span>
                  <span className="font-black text-slate-900 text-sm">{selectedOrderForLabel.patientName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block font-bold">Prescription ID</span>
                  <span className="font-mono font-bold text-indigo-700">{selectedOrderForLabel.rxId}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {selectedOrderForLabel.items.map((item, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center font-black text-slate-900 text-sm">
                      <span>{i + 1}. {item.name}</span>
                      <span className="text-xs text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">{item.qty} units</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1 font-bold text-amber-700">
                        <Sun className="w-3.5 h-3.5" /> सकाळ (Morn): 1
                      </div>
                      <div className="flex items-center gap-1 font-bold text-indigo-700">
                        <Moon className="w-3.5 h-3.5" /> रात्र (Night): 1
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 ml-auto font-medium">
                        <Utensils className="w-3 h-3" /> {item.withFood}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-2">
              <button onClick={() => setSelectedOrderForLabel(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl">
                Close
              </button>
              <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Print Patient Dosage Sticker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD MEDICINE MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Add Medicine Formulation to Inventory</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Brand Name &amp; Strength</label>
                <input
                  required
                  value={newMedName}
                  onChange={e => setNewMedName(e.target.value)}
                  placeholder="e.g. Augmentin 625mg Duo"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none bg-white font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Chemical Salt Composition</label>
                <input
                  value={newMedSalt}
                  onChange={e => setNewMedSalt(e.target.value)}
                  placeholder="e.g. Amoxicillin 500mg + Potassium Clavulanate 125mg"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Category</label>
                  <select
                    value={newMedCategory}
                    onChange={e => setNewMedCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    {['Antibiotic', 'Analgesic & Antipyretic', 'Antidiabetic', 'Cardiac & BP', 'GI & Antacid', 'NSAID / Pain Relief', 'Supplements', 'Respiratory / Asthma'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Unit</label>
                  <select
                    value={newMedUnit}
                    onChange={e => setNewMedUnit(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none bg-white"
                  >
                    {['Tablets', 'Capsules', 'Syrup (ml)', 'Inhaler / Aerosol', 'Injection (Vials)'].map(u => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Initial Qty</label>
                  <input
                    type="number"
                    value={newMedStock}
                    onChange={e => setNewMedStock(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Min Buffer</label>
                  <input
                    type="number"
                    value={newMedMin}
                    onChange={e => setNewMedMin(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMedPrice}
                    onChange={e => setNewMedPrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Manufacturer / Supplier</label>
                  <input
                    value={newMedSupplier}
                    onChange={e => setNewMedSupplier(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Rack Location</label>
                  <input
                    value={newMedRack}
                    onChange={e => setNewMedRack(e.target.value)}
                    placeholder="Rack B-4"
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                <Plus className="w-4 h-4" /> Save Formulation to Inventory
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
