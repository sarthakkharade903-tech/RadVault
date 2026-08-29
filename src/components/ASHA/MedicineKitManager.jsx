import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Plus, Edit2, Trash2, Send, AlertTriangle, CheckCircle2,
  Search, X, RefreshCw, Filter, ChevronRight, FileText, ArrowRight,
  ShieldAlert, Clock, Calendar, Check, Layers
} from 'lucide-react';
import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  adjustMedicineStock,
  createMedicineIndent,
  getMedicineIndents
} from '../../services/ashaService';

const TRANSLATIONS = {
  en: {
    title: "Medicine Kit & Drug Stock",
    subtitle: "ASHA Field Medicine Bag • Real-time Inventory & PHC Indents",
    totalMedicines: "Medicines Tracked",
    totalUnits: "Total Units in Kit",
    lowStockAlerts: "Low Stock Items",
    indentsSent: "PHC Indents",
    searchPlaceholder: "Search medicine name, category or unit...",
    filterAll: "All Medicines",
    filterLowStock: "Low Stock (Urgent)",
    filterMaternal: "Maternal Health",
    filterChild: "Child Care",
    filterFever: "Fever & Pain",
    filterFirstAid: "Kits & Diagnostics",
    addMedicineBtn: "Add New Medicine",
    submitIndentBtn: "Submit Restock Indent to PHC",
    historyBtn: "Indent History",
    minThreshold: "Min Alert Threshold",
    stock: "Stock Balance",
    category: "Category",
    unit: "Unit",
    batchNo: "Batch No.",
    expiry: "Expiry Date",
    adjust: "Quick Adjust",
    editItem: "Edit Medicine",
    deleteItem: "Delete Medicine",
    saveChanges: "Save Changes",
    addNewItemTitle: "Add New Medicine to Kit",
    editItemTitle: "Edit Medicine Details",
    englishName: "Medicine Name (English)",
    marathiName: "नाव (मराठी)",
    hindiName: "नाम (हिंदी)",
    initialStock: "Current In-Hand Stock",
    alertThreshold: "Low Stock Alert Threshold",
    deleteConfirmTitle: "Confirm Deletion",
    deleteConfirmDesc: "Are you sure you want to remove this medicine from your kit register?",
    confirmDeleteBtn: "Yes, Delete",
    cancel: "Cancel",
    close: "Close",
    indentTitle: "Smart PHC Restock Indent Generator",
    indentSubtitle: "Auto-calculated replenishment based on low stock deficits",
    requestedQty: "Requested Restock Qty",
    ashaNotes: "ASHA Worker Clinical Notes for PHC Storekeeper",
    notesPlaceholder: "e.g. High incidence of seasonal viral fever in Sector 4; request extra paracetamol & ORS...",
    dispatchIndentBtn: "Dispatch Indent to PHC Shirwal",
    indentSuccess: "Restock Indent successfully dispatched to PHC Storekeeper!",
    noMedicinesFound: "No medicines match your search criteria.",
    lowStockBadge: "Low Stock ⚠️",
    healthyStockBadge: "Adequate Stock",
    indentStatusSubmitted: "Submitted to PHC",
    indentStatusApproved: "Approved by MO",
    indentStatusDispatched: "Dispatched"
  },
  mr: {
    title: "औषध साठा व किट व्यवस्थापन",
    subtitle: "आशा कार्यकर्ता औषध किट • थेट साठा नोंद व प्राथमिक आरोग्य केंद्र मागणी",
    totalMedicines: "एकूण औषध प्रकार",
    totalUnits: "एकूण उपलब्ध गोळ्या/किट",
    lowStockAlerts: "कमी साठा असलेली औषधे",
    indentsSent: "पाठवलेल्या मागण्या",
    searchPlaceholder: "औषधाचे नाव किंवा प्रकार शोधा...",
    filterAll: "सर्व औषधे",
    filterLowStock: "कमी साठा (तातडीने आवश्यक)",
    filterMaternal: "माता आरोग्य",
    filterChild: "बाल संगोपन",
    filterFever: "ताप व अंगदुखी",
    filterFirstAid: "किट व तपासणी साधने",
    addMedicineBtn: "नवीन औषध जोडा",
    submitIndentBtn: "आरोग्य केंद्राकडे मागणी पाठवा",
    historyBtn: "मागणी इतिहास",
    minThreshold: "किमान आवश्यक मर्यादा",
    stock: "उपलब्ध साठा",
    category: "प्रकार",
    unit: "एकक",
    batchNo: "बॅच क्र.",
    expiry: "कालबाह्यता तारीख",
    adjust: "साठा बदल",
    editItem: "माहिती बदला",
    deleteItem: "काढून टाका",
    saveChanges: "बदल जतन करा",
    addNewItemTitle: "किटमध्ये नवीन औषध जोडा",
    editItemTitle: "औषध माहिती संपादित करा",
    englishName: "औषधाचे नाव (इंग्रजी)",
    marathiName: "नाव (मराठी)",
    hindiName: "नाम (हिंदी)",
    initialStock: "सध्या उपलब्ध साठा",
    alertThreshold: "कमी साठा चेतावणी मर्यादा",
    deleteConfirmTitle: "औषध काढून टाकण्याची खात्री करा",
    deleteConfirmDesc: "तुम्ही नक्की हे औषध किटमधून काढून टाकू इच्छिता का?",
    confirmDeleteBtn: "होय, काढून टाका",
    cancel: "रद्द करा",
    close: "बंद करा",
    indentTitle: "प्राथमिक आरोग्य केंद्र मागणी पत्र",
    indentSubtitle: "कमी साठ्यानुसार स्वयंचलित तयार झालेली औषध मागणी यादी",
    requestedQty: "मागणी केलेली संख्या",
    ashaNotes: "औषध भांडार प्रमुखांसाठी शेरा",
    notesPlaceholder: "उदा. विभागात तापाचे रुग्ण वाढले असल्याने पॅरासिटामॉल व ओआरएस जास्त हवे आहे...",
    dispatchIndentBtn: "शिरवळ प्राथमिक आरोग्य केंद्रास पाठवा",
    indentSuccess: "औषध मागणी पत्र प्राथमिक आरोग्य केंद्राकडे यशस्वीरित्या पाठवले आहे!",
    noMedicinesFound: "शोधलेली औषधे सापडली नाहीत.",
    lowStockBadge: "कमी साठा ⚠️",
    healthyStockBadge: "पुरेसा साठा",
    indentStatusSubmitted: "मागणी सादर केली",
    indentStatusApproved: "मंजूर केली",
    indentStatusDispatched: "रवाना केले"
  },
  hi: {
    title: "दवा किट एवं स्टॉक प्रबंधन",
    subtitle: "आशा कार्यकर्ता दवा किट • लाइव स्टॉक एवं पीएचसी इंडेंट",
    totalMedicines: "कुल दवाएं",
    totalUnits: "कुल उपलब्ध मात्रा",
    lowStockAlerts: "कम स्टॉक वाली दवाएं",
    indentsSent: "भेजे गए इंडेंट",
    searchPlaceholder: "दवा का नाम या वर्ग खोजें...",
    filterAll: "सभी दवाएं",
    filterLowStock: "कम स्टॉक (आवश्यक)",
    filterMaternal: "मातृ स्वास्थ्य",
    filterChild: "शिशु देखभाल",
    filterFever: "बुखार एवं दर्द",
    filterFirstAid: "किट एवं जांच सामग्री",
    addMedicineBtn: "नई दवा जोड़ें",
    submitIndentBtn: "पीएचसी को नया इंडेंट भेजें",
    historyBtn: "इंडेंट इतिहास",
    minThreshold: "न्यूनतम सीमा",
    stock: "उपलब्ध स्टॉक",
    category: "श्रेणी",
    unit: "इकाई",
    batchNo: "बैच नं.",
    expiry: "समाप्ति तिथि",
    adjust: "त्वरित स्टॉक",
    editItem: "संशोधित करें",
    deleteItem: "हटाएं",
    saveChanges: "सहेजें",
    addNewItemTitle: "किट में नई दवा जोड़ें",
    editItemTitle: "दवा विवरण संशोधित करें",
    englishName: "दवा का नाम (अंग्रेजी)",
    marathiName: "नाव (मराठी)",
    hindiName: "नाम (हिंदी)",
    initialStock: "वर्तमान उपलब्ध स्टॉक",
    alertThreshold: "कम स्टॉक चेतावनी स्तर",
    deleteConfirmTitle: "दवा हटाने की पुष्टि करें",
    deleteConfirmDesc: "क्या आप वाकई इस दवा को किट से हटाना चाहते हैं?",
    confirmDeleteBtn: "हां, हटाएं",
    cancel: "रद्द करें",
    close: "बंद करें",
    indentTitle: "पीएचसी दवा मांग पत्र (स्मार्ट इंडेंट)",
    indentSubtitle: "कम स्टॉक के आधार पर तैयार मांग सूची",
    requestedQty: "मांगी गई संख्या",
    ashaNotes: "पीएचसी स्टोर हेतु टिप्पणी",
    notesPlaceholder: "उदा. मौसमी बुखार के चलते पैरासिटामोल व ओआरएस की अतिरिक्त आवश्यकता है...",
    dispatchIndentBtn: "पीएचसी शिरवल को इंडेंट भेजें",
    indentSuccess: "दवा इंडेंट सफलतापूर्वक प्राथमिक स्वास्थ्य केंद्र भेज दिया गया!",
    noMedicinesFound: "कोई दवा नहीं मिली।",
    lowStockBadge: "कम स्टॉक ⚠️",
    healthyStockBadge: "पर्याप्त स्टॉक",
    indentStatusSubmitted: "इंडेंट भेजा गया",
    indentStatusApproved: "स्वीकृत",
    indentStatusDispatched: "भेज दिया गया"
  }
};

const CATEGORIES = [
  "Maternal Health",
  "Child Care",
  "Fever & Pain",
  "First Aid & Kits",
  "Chronic Care",
  "General"
];

const UNITS = ["tabs", "packets", "kits", "bottles", "strips", "tubes", "vials"];

export default function MedicineKitManager({ onClose, onStockUpdated }) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    name_en: "",
    name_mr: "",
    name_hi: "",
    category: "Maternal Health",
    stock: 50,
    unit: "tabs",
    threshold: 20,
    batch_number: "",
    expiry_date: ""
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [showIndentModal, setShowIndentModal] = useState(false);
  const [indentItems, setIndentItems] = useState([]);
  const [indentNotes, setIndentNotes] = useState("");
  const [indentSuccessMsg, setIndentSuccessMsg] = useState("");
  const [isSubmittingIndent, setIsSubmittingIndent] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [indentsHistory, setIndentsHistory] = useState([]);

  // Load medicines
  const loadMedicinesList = async () => {
    setLoading(true);
    const res = await getMedicines();
    if (res.data) {
      setMedicines(res.data);
      if (onStockUpdated) onStockUpdated(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMedicinesList();
  }, []);

  // Filtered List
  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      const nameMatch =
        (m.name_en && m.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.name_mr && m.name_mr.includes(searchTerm)) ||
        (m.name_hi && m.name_hi.includes(searchTerm)) ||
        (m.batch_number && m.batch_number.toLowerCase().includes(searchTerm.toLowerCase()));

      if (searchTerm.trim() && !nameMatch) return false;

      if (activeCategory === "Low Stock") {
        return (m.stock || 0) <= (m.threshold || 10);
      }
      if (activeCategory === "Maternal Health") return m.category === "Maternal Health";
      if (activeCategory === "Child Care") return m.category === "Child Care";
      if (activeCategory === "Fever & Pain") return m.category === "Fever & Pain";
      if (activeCategory === "First Aid & Kits") return m.category === "First Aid & Kits";

      return true;
    });
  }, [medicines, searchTerm, activeCategory]);

  // Summary Metrics
  const lowStockCount = useMemo(() => {
    return medicines.filter(m => (m.stock || 0) <= (m.threshold || 10)).length;
  }, [medicines]);

  const totalUnitsInBag = useMemo(() => {
    return medicines.reduce((sum, m) => sum + (parseInt(m.stock, 10) || 0), 0);
  }, [medicines]);

  // Adjust stock
  const handleQuickAdjust = async (id, delta) => {
    const item = medicines.find(m => m.id === id);
    if (!item) return;
    const newStock = Math.max(0, (parseInt(item.stock, 10) || 0) + delta);
    
    // Optimistic UI update
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, stock: newStock } : m));
    await adjustMedicineStock(id, newStock);
    if (onStockUpdated) onStockUpdated(medicines);
  };

  // Direct numeric input
  const handleDirectStockChange = async (id, val) => {
    const parsed = parseInt(val, 10);
    const newStock = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, stock: newStock } : m));
    await adjustMedicineStock(id, newStock);
    if (onStockUpdated) onStockUpdated(medicines);
  };

  // Open Add/Edit Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemFormData({
      name_en: "",
      name_mr: "",
      name_hi: "",
      category: "Maternal Health",
      stock: 50,
      unit: "tabs",
      threshold: 20,
      batch_number: "",
      expiry_date: ""
    });
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setItemFormData({
      name_en: item.name_en || "",
      name_mr: item.name_mr || "",
      name_hi: item.name_hi || "",
      category: item.category || "General",
      stock: item.stock || 0,
      unit: item.unit || "tabs",
      threshold: item.threshold || 10,
      batch_number: item.batch_number || "",
      expiry_date: item.expiry_date || ""
    });
    setShowAddEditModal(true);
  };

  // Save Add/Edit
  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    if (!itemFormData.name_en.trim()) return;

    if (editingItem) {
      // Update
      await updateMedicine(editingItem.id, itemFormData);
    } else {
      // Add
      await addMedicine(itemFormData);
    }

    setShowAddEditModal(false);
    loadMedicinesList();
  };

  // Delete Medicine
  const handleDeleteMedicine = async () => {
    if (!itemToDelete) return;
    await deleteMedicine(itemToDelete.id);
    setShowDeleteModal(false);
    setItemToDelete(null);
    loadMedicinesList();
  };

  // Open Smart Indent Generator
  const handleOpenIndentGenerator = () => {
    // Collect all medicines where stock <= threshold, or all if none is low
    const autoList = medicines.map(m => {
      const isLow = (m.stock || 0) <= (m.threshold || 10);
      const suggestedQty = isLow
        ? Math.max(m.threshold * 2 - (m.stock || 0), m.threshold)
        : 0;

      return {
        medicine_id: m.id,
        name: lang === 'mr' ? (m.name_mr || m.name_en) : lang === 'hi' ? (m.name_hi || m.name_en) : m.name_en,
        name_en: m.name_en,
        unit: m.unit,
        current_stock: m.stock,
        threshold: m.threshold,
        is_low: isLow,
        requested_qty: suggestedQty > 0 ? suggestedQty : (isLow ? 50 : 0)
      };
    }).filter(item => item.is_low || item.requested_qty > 0);

    // If nothing is low, provide at least top essential medicines
    if (autoList.length === 0) {
      const fallbackList = medicines.slice(0, 3).map(m => ({
        medicine_id: m.id,
        name: lang === 'mr' ? (m.name_mr || m.name_en) : lang === 'hi' ? (m.name_hi || m.name_en) : m.name_en,
        name_en: m.name_en,
        unit: m.unit,
        current_stock: m.stock,
        threshold: m.threshold,
        is_low: false,
        requested_qty: 50
      }));
      setIndentItems(fallbackList);
    } else {
      setIndentItems(autoList);
    }

    setIndentNotes("");
    setIndentSuccessMsg("");
    setShowIndentModal(true);
  };

  // Dispatch Indent
  const handleDispatchIndent = async () => {
    const validItems = indentItems.filter(i => (parseInt(i.requested_qty, 10) || 0) > 0);
    if (validItems.length === 0) return;

    setIsSubmittingIndent(true);
    await createMedicineIndent({
      asha_name: "Priya Deshmukh",
      phc_name: "PHC Shirwal",
      items: validItems,
      notes: indentNotes
    });
    setIsSubmittingIndent(false);

    setIndentSuccessMsg(t.indentSuccess);
    setTimeout(() => {
      setShowIndentModal(false);
      setIndentSuccessMsg("");
    }, 2500);
  };

  // Open Indent History
  const handleOpenHistory = async () => {
    const res = await getMedicineIndents();
    if (res.data) setIndentsHistory(res.data);
    setShowHistoryModal(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden text-slate-800 font-sans">
        
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-[#16324F] via-[#008F83] to-[#005B54] text-white px-5 sm:px-7 py-4.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Package className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">{t.title}</h2>
              <p className="text-xs text-teal-100/90 font-medium">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Top Metric Ribbon ── */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-7 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.totalMedicines}</p>
            <p className="text-xl font-black text-[#16324F] mt-0.5">{medicines.length}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.totalUnits}</p>
            <p className="text-xl font-black text-teal-700 mt-0.5">{totalUnitsInBag}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <p className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">{t.lowStockAlerts}</p>
            <p className={`text-xl font-black mt-0.5 ${lowStockCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
              {lowStockCount}
            </p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider">{t.indentsSent}</p>
              <p className="text-xl font-black text-indigo-700 mt-0.5">PHC Shirwal</p>
            </div>
            <button
              onClick={handleOpenHistory}
              className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 cursor-pointer"
            >
              {t.historyBtn}
            </button>
          </div>
        </div>

        {/* ── Action Toolbar: Search, Filters & Add Button ── */}
        <div className="px-5 sm:px-7 pt-4 pb-2 space-y-3 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#008F83] focus:bg-white transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddModal}
                className="px-3.5 py-2 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>{t.addMedicineBtn}</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {["All", "Low Stock", "Maternal Health", "Child Care", "Fever & Pain", "First Aid & Kits"].map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? cat === 'Low Stock'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-[#16324F] text-white shadow-xs'
                      : cat === 'Low Stock' && lowStockCount > 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === "All" ? t.filterAll :
                   cat === "Low Stock" ? `${t.filterLowStock} (${lowStockCount})` :
                   cat === "Maternal Health" ? t.filterMaternal :
                   cat === "Child Care" ? t.filterChild :
                   cat === "Fever & Pain" ? t.filterFever : t.filterFirstAid}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Medicine Inventory Table / List ── */}
        <div className="px-5 sm:px-7 py-3 flex-1 overflow-y-auto space-y-2.5">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#008F83]" />
              <span>Loading medicine inventory...</span>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-extrabold text-slate-700 text-sm">{t.noMedicinesFound}</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search query or add a new drug item.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              {filteredMedicines.map((med) => {
                const isLow = (med.stock || 0) <= (med.threshold || 10);
                const displayName =
                  lang === 'mr' ? (med.name_mr || med.name_en) :
                  lang === 'hi' ? (med.name_hi || med.name_en) : med.name_en;

                return (
                  <div
                    key={med.id}
                    className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isLow ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Left: Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isLow ? 'bg-rose-100 text-rose-700 font-black' : 'bg-teal-50 text-teal-700 font-black'
                      }`}>
                        {med.unit === 'kits' ? '🧰' : med.unit === 'packets' ? '📦' : '💊'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-900 text-sm truncate">{displayName}</h4>
                          {lang !== 'en' && med.name_en !== displayName && (
                            <span className="text-[10px] text-slate-400 font-medium truncate">({med.name_en})</span>
                          )}
                          <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                            {med.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap font-medium">
                          <span>{t.minThreshold}: <b className="text-slate-700">{med.threshold} {med.unit}</b></span>
                          {med.batch_number && <span>• Batch: <b className="text-slate-700">{med.batch_number}</b></span>}
                          {med.expiry_date && <span>• Exp: <b className="text-slate-700">{med.expiry_date}</b></span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: Stock Steppers & Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                      {/* Stock Badge & Input */}
                      <div className="text-right flex items-center gap-2">
                        {isLow ? (
                          <span className="text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {t.lowStockBadge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full whitespace-nowrap hidden sm:inline-block">
                            {t.healthyStockBadge}
                          </span>
                        )}

                        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(med.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          
                          <input
                            type="number"
                            value={med.stock}
                            onChange={(e) => handleDirectStockChange(med.id, e.target.value)}
                            className="w-14 text-center font-black text-sm bg-transparent text-slate-900 focus:outline-none"
                          />
                          <span className="text-[10px] font-bold text-slate-400 pr-2 select-none">{med.unit}</span>

                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(med.id, +1)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shadow-2xs transition-colors cursor-pointer mr-1"
                          >
                            +1
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(med.id, +10)}
                            className="px-2 h-7 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-black text-[10px] flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                          >
                            +10
                          </button>
                        </div>
                      </div>

                      {/* Edit & Delete Actions */}
                      <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(med)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#008F83] rounded-lg transition-colors cursor-pointer"
                          title={t.editItem}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setItemToDelete(med);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title={t.deleteItem}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-7 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenIndentGenerator}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.submitIndentBtn}</span>
              {lowStockCount > 0 && (
                <span className="bg-white text-indigo-700 px-1.5 py-0.2 rounded-full text-[10px] font-black ml-0.5">
                  {lowStockCount}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl text-slate-700 transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>

      </div>

      {/* ── MODAL: ADD / EDIT MEDICINE ── */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="bg-[#16324F] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-black text-sm">
                {editingItem ? t.editItemTitle : t.addNewItemTitle}
              </h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.englishName} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Albendazole 400mg"
                  value={itemFormData.name_en}
                  onChange={e => setItemFormData(p => ({ ...p, name_en: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.marathiName}</label>
                  <input
                    type="text"
                    placeholder="उदा. अल्बेंडाझोल गोळ्या"
                    value={itemFormData.name_mr}
                    onChange={e => setItemFormData(p => ({ ...p, name_mr: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.hindiName}</label>
                  <input
                    type="text"
                    placeholder="उदा. अलबेंडाजोल गोलियां"
                    value={itemFormData.name_hi}
                    onChange={e => setItemFormData(p => ({ ...p, name_hi: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.category}</label>
                  <select
                    value={itemFormData.category}
                    onChange={e => setItemFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none bg-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.unit}</label>
                  <select
                    value={itemFormData.unit}
                    onChange={e => setItemFormData(p => ({ ...p, unit: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none bg-white"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.initialStock} *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemFormData.stock}
                    onChange={e => setItemFormData(p => ({ ...p, stock: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.alertThreshold} *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itemFormData.threshold}
                    onChange={e => setItemFormData(p => ({ ...p, threshold: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.batchNo}</label>
                  <input
                    type="text"
                    placeholder="e.g. B-9921"
                    value={itemFormData.batch_number}
                    onChange={e => setItemFormData(p => ({ ...p, batch_number: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.expiry}</label>
                  <input
                    type="date"
                    value={itemFormData.expiry_date}
                    onChange={e => setItemFormData(p => ({ ...p, expiry_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM DELETE ── */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 p-6 text-center animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-base">{t.deleteConfirmTitle}</h3>
            <p className="text-xs text-slate-500 mt-1">{t.deleteConfirmDesc}</p>
            <p className="font-extrabold text-slate-900 text-sm mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {itemToDelete.name_en}
            </p>

            <div className="mt-5 flex gap-2 justify-center">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl text-slate-700 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteMedicine}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {t.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: SMART PHC RESTOCK INDENT ── */}
      {showIndentModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="bg-gradient-to-r from-indigo-700 to-[#16324F] text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-300" /> {t.indentTitle}
                </h3>
                <p className="text-xs text-indigo-200">{t.indentSubtitle}</p>
              </div>
              <button onClick={() => setShowIndentModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              {indentSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{indentSuccessMsg}</span>
                </div>
              )}

              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="text-left p-3">Medicine</th>
                      <th className="text-center p-3">Current In-Hand</th>
                      <th className="text-right p-3">{t.requestedQty}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {indentItems.map((item, idx) => (
                      <tr key={item.medicine_id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-extrabold text-slate-900">{item.name}</p>
                          {item.is_low && (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                              Low Stock Deficit
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-600">
                          {item.current_stock} {item.unit}
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={item.requested_qty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setIndentItems(prev => prev.map((it, i) => i === idx ? { ...it, requested_qty: val } : it));
                              }}
                              className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-right font-black text-indigo-700 focus:outline-none focus:border-indigo-500"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.ashaNotes}</label>
                <textarea
                  rows="3"
                  placeholder={t.notesPlaceholder}
                  value={indentNotes}
                  onChange={e => setIndentNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowIndentModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl text-slate-700 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={isSubmittingIndent}
                onClick={handleDispatchIndent}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingIndent ? "Dispatching..." : t.dispatchIndentBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: INDENT HISTORY ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-black text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" /> Dispatched Indent Log
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto text-xs flex-1">
              {indentsHistory.length === 0 ? (
                <div className="text-center p-8 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold">No previous indents found in log.</p>
                </div>
              ) : (
                indentsHistory.map((ind, idx) => (
                  <div key={ind.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-slate-900 text-sm">Indent to {ind.phc_name || "PHC Shirwal"}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(ind.created_at || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full uppercase">
                        {ind.status || 'SUBMITTED'}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                      <p className="font-extrabold text-[11px] text-slate-700 mb-1">Items ({ind.items?.length || 0}):</p>
                      <ul className="text-[11px] text-slate-600 space-y-0.5">
                        {ind.items?.map((it, i) => (
                          <li key={i} className="flex justify-between">
                            <span>• {it.name || it.name_en}</span>
                            <b className="text-indigo-700">+{it.requested_qty} {it.unit}</b>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {ind.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                        Note: {ind.notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl text-slate-700 cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
