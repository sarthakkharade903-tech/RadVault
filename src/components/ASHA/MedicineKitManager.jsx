import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Package, Plus, Edit2, Trash2, Send, CheckCircle2,
  Search, X, RefreshCw, FileText, Pill, Phone, MessageSquare, Hospital,
  AlertTriangle, Minus, Clock, ShieldCheck, ChevronRight
} from "lucide-react";
import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  adjustMedicineStock,
  createMedicineIndent,
  getMedicineIndents
} from "../../services/ashaService";

const TRANSLATIONS = {
  en: {
    title: "Field Medicine Bag · Sector 4",
    subtitle: "Priya Deshmukh · PHC Shirwal Supply Link",
    totalMedicines: "Medicines Tracked",
    totalUnits: "Total Units in Kit",
    lowStockAlerts: "Low Stock Items",
    indentsSent: "PHC Indents",
    searchPlaceholder: "Search medicine name, category or unit...",
    filterAll: "All Pouches",
    filterLowStock: "Low Stock (Urgent)",
    filterMaternal: "Maternal Care",
    filterChild: "Child Care",
    filterFever: "Fever & Pain",
    filterFirstAid: "Kits & Diagnostics",
    addMedicineBtn: "Add New Medicine",
    submitIndentBtn: "Submit Restock Indent to PHC",
    historyBtn: "Indent History",
    minThreshold: "Min Alert Threshold",
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
    lowStockBadge: "LOW STOCK",
    healthyStockBadge: "ADEQUATE",
    category: "Category",
    unit: "Unit",
    batchNo: "Batch No.",
    expiry: "Expiry Date",
    kitReadiness: "Kit Readiness",
    target: "Target",
    depotConnected: "PHC Depot Connected",
  },
  mr: {
    title: "फिल्ड औषध किट बॅग · सेक्टर ४",
    subtitle: "प्रिया देशमुख · प्राथमिक आरोग्य केंद्र शिरवळ थेट जोडणी",
    totalMedicines: "एकूण औषध प्रकार",
    totalUnits: "एकूण उपलब्ध गोळ्या/किट",
    lowStockAlerts: "कमी साठा असलेली औषधे",
    indentsSent: "पाठवलेल्या मागण्या",
    searchPlaceholder: "औषधाचे नाव किंवा प्रकार शोधा...",
    filterAll: "सर्व कप्पे (All)",
    filterLowStock: "कमी साठा (तातडीने)",
    filterMaternal: "माता आरोग्य",
    filterChild: "बाल संगोपन",
    filterFever: "ताप व अंगदुखी",
    filterFirstAid: "किट व तपासणी",
    addMedicineBtn: "नवीन औषध जोडा",
    submitIndentBtn: "आरोग्य केंद्राकडे मागणी पाठवा",
    historyBtn: "मागणी इतिहास",
    minThreshold: "किमान आवश्यक मर्यादा",
    editItem: "माहिती बदला",
    deleteItem: "काढून टाका",
    saveChanges: "बदल जतन करा",
    addNewItemTitle: "किटमध्ये नवीन औषध जोडा",
    editItemTitle: "औषध माहिती संपादित करा",
    englishName: "औषधाचे नाव (इंग्रजी)",
    marathiName: "नाव (मराठी)",
    hindiName: "नाव (हिंदी)",
    initialStock: "सध्याचा उपलब्ध साठा",
    alertThreshold: "कमी साठा सूचना मर्यादा",
    deleteConfirmTitle: "हटवण्याची पुष्टी करा",
    deleteConfirmDesc: "हे औषध किट नोंदणीतून काढायचे आहे का?",
    confirmDeleteBtn: "हो, काढा",
    cancel: "रद्द करा",
    close: "बंद करा",
    indentTitle: "स्मार्ट PHC पुनर्भरण मागणी",
    indentSubtitle: "कमी साठ्याच्या आधारे स्वयंचलित गणना",
    requestedQty: "मागवलेली संख्या",
    ashaNotes: "आशा कार्यकर्त्याच्या नोंदी",
    notesPlaceholder: "उदा. सेक्टर 4 मध्ये विषाणूजन्य (ताप) वाढला आहे...",
    dispatchIndentBtn: "PHC शिरवळकडे मागणी पाठवा",
    indentSuccess: "पुनर्भरण मागणी यशस्वीरीत्या पाठवली!",
    noMedicinesFound: "शोध निकषांशी जुळणारी औषधे नाहीत.",
    lowStockBadge: "कमी साठा",
    healthyStockBadge: "पुरेसा साठा",
    category: "प्रकार",
    unit: "एकक",
    batchNo: "बॅच क्र.",
    expiry: "कालबाह्यता तारीख",
    kitReadiness: "किट तयारी",
    target: "लक्ष्य",
    depotConnected: "PHC डेपो जोडलेला",
  },
  hi: {
    title: "फील्ड मेडिसिन किट बैग · सेक्टर 4",
    subtitle: "प्रिया देशमुख · पीएचसी शिरवल सप्लाई लिंक",
    totalMedicines: "कुल दवा प्रकार",
    totalUnits: "किट में कुल दवाइयां",
    lowStockAlerts: "कम स्टॉक वाली दवाएं",
    indentsSent: "भेजी गई मांगें",
    searchPlaceholder: "दवा का नाम या श्रेणी खोजें...",
    filterAll: "सभी पाउच",
    filterLowStock: "कम स्टॉक (अति आवश्यक)",
    filterMaternal: "मातृ स्वास्थ्य",
    filterChild: "बाल देखभाल",
    filterFever: "बुखार व दर्द",
    filterFirstAid: "किट व जांच",
    addMedicineBtn: "नई दवा जोड़ें",
    submitIndentBtn: "पीएचसी को मांग भेजें",
    historyBtn: "मांग इतिहास",
    minThreshold: "न्यूनतम अलर्ट सीमा",
    editItem: "दवा संपादित करें",
    deleteItem: "हटाएं",
    saveChanges: "बदलाव सहेजें",
    addNewItemTitle: "किट में नई दवा जोड़ें",
    editItemTitle: "दवा विवरण संपादित करें",
    englishName: "दवा का नाम (अंग्रेजी)",
    marathiName: "नाम (मराठी)",
    hindiName: "नाम (हिंदी)",
    initialStock: "वर्तमान उपलब्ध स्टॉक",
    alertThreshold: "कम स्टॉक अलर्ट सीमा",
    deleteConfirmTitle: "हटाने की पुष्टि करें",
    deleteConfirmDesc: "क्या आप वाकई इस दवा को अपनी किट से हटाना चाहते हैं?",
    confirmDeleteBtn: "हाँ, हटाएं",
    cancel: "रद्द करें",
    close: "बंद करें",
    indentTitle: "स्मार्ट पीएचसी रीस्टॉक मांग",
    indentSubtitle: "कम स्टॉक के आधार पर स्वचालित गणना",
    requestedQty: "मांगी गई मात्रा",
    ashaNotes: "आशा कार्यकर्ता की टिप्पणियां",
    notesPlaceholder: "उदा. सेक्टर 4 में मौसमी बुखार के मामले बढ़े हैं...",
    dispatchIndentBtn: "पीएचसी शिरवल को मांग भेजें",
    indentSuccess: "रीस्टॉक मांग सफलतापूर्वक भेजी गई!",
    noMedicinesFound: "खोज से मेल खाती कोई दवा नहीं मिली।",
    lowStockBadge: "कम स्टॉक",
    healthyStockBadge: "पर्याप्त स्टॉक",
    category: "श्रेणी",
    unit: "इकाई",
    batchNo: "बैच सं.",
    expiry: "समाप्ति तिथि",
    kitReadiness: "किट तैयारी",
    target: "लक्ष्य",
    depotConnected: "पीएचसी डिपो कनेक्टेड",
  }
};

const CATEGORIES = ["Maternal Health", "Child Care", "Fever & Pain", "First Aid & Kits", "Chronic Care", "General"];
const UNITS = ["tabs", "packets", "kits", "bottles", "strips", "tubes", "vials"];

function useDebounce(callback, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

export default function MedicineKitManager({ isFullPage = false, onClose, onStockUpdated }) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [localStock, setLocalStock] = useState({});

  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    name_en: "", name_mr: "", name_hi: "", category: "Maternal Health",
    stock: 50, unit: "tabs", threshold: 20, batch_number: "", expiry_date: ""
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

  const loadMedicinesList = useCallback(async () => {
    setLoading(true);
    const res = await getMedicines();
    if (res.data) {
      setMedicines(res.data);
      const map = {};
      res.data.forEach(m => { map[m.id] = String(m.stock ?? 0); });
      setLocalStock(map);
      if (onStockUpdated) onStockUpdated(res.data);
    }
    setLoading(false);
  }, [onStockUpdated]);

  useEffect(() => { loadMedicinesList(); }, [loadMedicinesList]);

  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      const nameMatch =
        (m.name_en && m.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.name_mr && m.name_mr.includes(searchTerm)) ||
        (m.name_hi && m.name_hi.includes(searchTerm)) ||
        (m.batch_number && m.batch_number.toLowerCase().includes(searchTerm.toLowerCase()));
      if (searchTerm.trim() && !nameMatch) return false;
      if (activeCategory === "Low Stock") return (m.stock || 0) <= (m.threshold || 10);
      if (activeCategory === "Maternal Health") return m.category === "Maternal Health";
      if (activeCategory === "Child Care") return m.category === "Child Care";
      if (activeCategory === "Fever & Pain") return m.category === "Fever & Pain";
      if (activeCategory === "First Aid & Kits") return m.category === "First Aid & Kits";
      return true;
    });
  }, [medicines, searchTerm, activeCategory]);

  const lowStockCount = useMemo(() =>
    medicines.filter(m => (m.stock || 0) <= (m.threshold || 10)).length, [medicines]);

  const lowStockNames = useMemo(() => {
    const list = medicines.filter(m => (m.stock || 0) <= (m.threshold || 10));
    if (list.length === 0) return "";
    return list.map(m => m.name_en.split(" ")[0]).join(", ");
  }, [medicines]);

  const totalUnitsInBag = useMemo(() =>
    medicines.reduce((sum, m) => sum + (parseInt(m.stock, 10) || 0), 0), [medicines]);

  // Dynamic Kit Readiness score: percentage of stock categories meeting safety thresholds
  const readinessPercent = useMemo(() => {
    if (medicines.length === 0) return 100;
    const safeItems = medicines.filter(m => (m.stock || 0) > (m.threshold || 10)).length;
    return Math.round((safeItems / medicines.length) * 100);
  }, [medicines]);

  const persistStockToServer = useCallback(async (id, newStock) => {
    await adjustMedicineStock(id, newStock);
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, stock: newStock } : m));
  }, []);

  const debouncedPersist = useDebounce(persistStockToServer, 700);

  const handleStockInputChange = (id, rawVal) => {
    setLocalStock(prev => ({ ...prev, [id]: rawVal }));
    const parsed = parseInt(rawVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      debouncedPersist(id, parsed);
    }
  };

  const handleStockInputBlur = async (id) => {
    const rawVal = localStock[id] ?? "0";
    const parsed = parseInt(rawVal, 10);
    const newStock = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setLocalStock(prev => ({ ...prev, [id]: String(newStock) }));
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, stock: newStock } : m));
    await adjustMedicineStock(id, newStock);
  };

  // Tactile one-handed stepper adjustment (+ / -)
  const handleStepStock = async (id, delta) => {
    const currentVal = parseInt(localStock[id] ?? "0", 10) || 0;
    const nextVal = Math.max(0, currentVal + delta);
    setLocalStock(prev => ({ ...prev, [id]: String(nextVal) }));
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, stock: nextVal } : m));
    await adjustMedicineStock(id, nextVal);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemFormData({ name_en: "", name_mr: "", name_hi: "", category: "Maternal Health", stock: 50, unit: "tabs", threshold: 20, batch_number: "", expiry_date: "" });
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setItemFormData({
      name_en: item.name_en || "", name_mr: item.name_mr || "", name_hi: item.name_hi || "",
      category: item.category || "General", stock: item.stock || 0,
      unit: item.unit || "tabs", threshold: item.threshold || 10,
      batch_number: item.batch_number || "", expiry_date: item.expiry_date || ""
    });
    setShowAddEditModal(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    if (!itemFormData.name_en.trim()) return;
    if (editingItem) {
      await updateMedicine(editingItem.id, itemFormData);
    } else {
      await addMedicine(itemFormData);
    }
    setShowAddEditModal(false);
    loadMedicinesList();
  };

  const handleDeleteMedicine = async () => {
    if (!itemToDelete) return;
    await deleteMedicine(itemToDelete.id);
    setShowDeleteModal(false);
    setItemToDelete(null);
    loadMedicinesList();
  };

  const handleOpenIndentGenerator = () => {
    const autoList = medicines.map(m => {
      const isLow = (m.stock || 0) <= (m.threshold || 10);
      const suggestedQty = isLow ? Math.max((m.threshold || 10) * 2 - (m.stock || 0), m.threshold || 10) : 0;
      return {
        medicine_id: m.id,
        name: lang === "mr" ? (m.name_mr || m.name_en) : lang === "hi" ? (m.name_hi || m.name_en) : m.name_en,
        name_en: m.name_en, unit: m.unit,
        current_stock: m.stock, threshold: m.threshold,
        is_low: isLow, requested_qty: suggestedQty > 0 ? suggestedQty : (isLow ? 50 : 0)
      };
    }).filter(item => item.is_low || item.requested_qty > 0);

    if (autoList.length === 0) {
      setIndentItems(medicines.slice(0, 3).map(m => ({
        medicine_id: m.id,
        name: lang === "mr" ? (m.name_mr || m.name_en) : lang === "hi" ? (m.name_hi || m.name_en) : m.name_en,
        name_en: m.name_en, unit: m.unit, current_stock: m.stock,
        threshold: m.threshold, is_low: false, requested_qty: 50
      })));
    } else {
      setIndentItems(autoList);
    }
    setIndentNotes(""); setIndentSuccessMsg(""); setShowIndentModal(true);
  };

  const handleDispatchIndent = async () => {
    const validItems = indentItems.filter(i => (parseInt(i.requested_qty, 10) || 0) > 0);
    if (validItems.length === 0) return;
    setIsSubmittingIndent(true);
    await createMedicineIndent({ asha_name: "Priya Deshmukh", phc_name: "PHC Shirwal", items: validItems, notes: indentNotes });
    setIsSubmittingIndent(false);
    setIndentSuccessMsg(t.indentSuccess);
    setTimeout(() => { setShowIndentModal(false); setIndentSuccessMsg(""); }, 2500);
  };

  const generateWhatsAppUrl = () => {
    const validItems = indentItems.filter(i => (parseInt(i.requested_qty, 10) || 0) > 0);
    const lines = validItems.map(i => `• ${i.name}: ${i.requested_qty} ${i.unit}`).join('\n');
    const msg =
      `*ASHA Drug Restock Indent*\n` +
      `Worker: Priya Deshmukh (ASHA Sector 4, Shirwal)\n` +
      `PHC: PHC Shirwal Central Drug Depot\n` +
      `Date: ${new Date().toLocaleDateString('en-IN')}\n\n` +
      `*Supplies Requisitioned:*\n${lines || 'Standard emergency replenishment'}\n\n` +
      `*Notes:* ${indentNotes || 'Please prepare supply for collection.'}`;
    return `https://wa.me/919422012345?text=${encodeURIComponent(msg)}`;
  };

  const handleOpenHistory = async () => {
    const res = await getMedicineIndents();
    if (res.data) setIndentsHistory(res.data);
    setShowHistoryModal(true);
  };

  // Helper for pouch icon
  const getPouchIcon = (category, unit) => {
    if (unit === "kits" || category === "First Aid & Kits") return "🧰";
    if (category === "Maternal Health") return "🤰";
    if (category === "Child Care" || unit === "packets") return "🍼";
    if (unit === "bottles" || unit === "syrup") return "🧴";
    return "💊";
  };

  const mainContent = (
    <div className="flex flex-col h-full bg-[#F5FBF9]">
      {/* ── Top Header Row (Tactical Field Bag) ── */}
      <div className="bg-gradient-to-r from-[#112437] via-[#16324F] to-[#0D4B46] text-white px-5 sm:px-8 py-5 flex items-center justify-between flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-xl shadow-inner">
            🎒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight">{t.title}</h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30 px-2 py-0.5 rounded-md">
                Sector 4
              </span>
            </div>
            <p className="text-xs text-teal-100/80 font-medium mt-0.5">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Kit Readiness Badge */}
          <div className="hidden md:flex items-center gap-2 bg-slate-900/60 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs font-black">
            <span className="text-slate-400 text-[11px] font-bold">{t.kitReadiness}:</span>
            <span className={readinessPercent >= 85 ? "text-teal-400 font-black" : "text-amber-400 font-black"}>
              {readinessPercent}% Stored
            </span>
            <span className={"w-2 h-2 rounded-full " + (readinessPercent >= 85 ? "bg-teal-400 animate-pulse" : "bg-amber-400 animate-pulse")} />
          </div>

          {/* Quick PHC Indent Action */}
          <button
            onClick={handleOpenIndentGenerator}
            className="flex items-center gap-2 bg-gradient-to-r from-[#008F83] to-[#00A896] hover:from-[#007A70] hover:to-[#008F83] text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer border border-teal-300/30"
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PHC Indent</span>
            {lowStockCount > 0 ? (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {lowStockCount} Urgent
              </span>
            ) : (
              <span className="bg-teal-800/60 text-teal-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                Ready
              </span>
            )}
          </button>

          {!isFullPage && onClose && (
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Quick Status Bar (Tactile Pouch Counters) ── */}
      <div className="bg-white border-b border-slate-200/90 px-5 sm:px-8 py-3.5 grid grid-cols-2 lg:grid-cols-4 gap-3.5 flex-shrink-0">
        {/* Total Medicines */}
        <div className="bg-slate-50 hover:bg-white transition-all p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.totalMedicines}</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{medicines.length}</p>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Active field formulary</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-200/60 text-slate-600 flex items-center justify-center text-sm">
            📋
          </div>
        </div>

        {/* Total Units */}
        <div className="bg-teal-50/50 hover:bg-teal-50 transition-all p-3 rounded-2xl border border-teal-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-teal-700 uppercase tracking-wider">{t.totalUnits}</p>
            <p className="text-2xl font-black text-[#008F83] mt-0.5">{totalUnitsInBag}</p>
            <p className="text-[10px] text-teal-600 font-semibold mt-0.5">Across all pouches</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#008F83] flex items-center justify-center text-sm font-black">
            💊
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className={"transition-all p-3 rounded-2xl border flex items-center justify-between " + (
          lowStockCount > 0
            ? "bg-rose-50/60 border-rose-200/80 hover:bg-rose-50"
            : "bg-slate-50 border-slate-200 hover:bg-white"
        )}>
          <div>
            <p className={"text-[10px] font-extrabold uppercase tracking-wider " + (lowStockCount > 0 ? "text-rose-600" : "text-slate-400")}>
              {t.lowStockAlerts}
            </p>
            <p className={"text-2xl font-black mt-0.5 " + (lowStockCount > 0 ? "text-rose-600" : "text-slate-800")}>
              {lowStockCount}
            </p>
            <p className={"text-[10px] font-semibold mt-0.5 " + (lowStockCount > 0 ? "text-rose-700 font-bold" : "text-slate-500")}>
              {lowStockCount > 0 ? `${lowStockNames || 'Requires indent'} alert` : "All pouches safe"}
            </p>
          </div>
          <div className={"w-9 h-9 rounded-xl flex items-center justify-center text-sm " + (
            lowStockCount > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-700"
          )}>
            {lowStockCount > 0 ? "⚠️" : "✓"}
          </div>
        </div>

        {/* PHC Shirwal Depot Card */}
        <div className="bg-[#E8F7F3] p-3 rounded-2xl border border-[#008F83]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-[#008F83] uppercase tracking-wider flex items-center gap-1">
              <Hospital className="w-3.5 h-3.5" /> PHC Shirwal Depot
            </p>
            <button
              onClick={handleOpenHistory}
              className="text-[9px] font-black text-[#008F83] hover:text-white bg-white hover:bg-[#008F83] px-2 py-0.5 rounded-lg border border-[#008F83]/30 transition-all cursor-pointer"
            >
              {t.historyBtn}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <a
              href="tel:+919422012345"
              className="text-xs font-black text-[#008F83] hover:underline flex items-center gap-1"
              title="Call PHC Pharmacist"
            >
              <Phone className="w-3 h-3 stroke-[2.5]" /> +91 94220-12345
            </a>
            <span className="text-[9px] font-bold text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded">
              ● Connected
            </span>
          </div>
        </div>
      </div>

      {/* ── Search Bar & Pouch Category Tabs ── */}
      <div className="bg-white px-5 sm:px-8 pt-4 pb-3 space-y-3 flex-shrink-0 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder={t.searchPlaceholder} value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#008F83] focus:bg-white transition-all shadow-inner"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={handleOpenAddModal} className="px-4 py-2.5 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t.addMedicineBtn}</span>
          </button>
        </div>

        {/* Pouch Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {[
            { id: "All", label: t.filterAll, icon: "🎒" },
            { id: "Low Stock", label: `${t.filterLowStock} (${lowStockCount})`, icon: "⚠️" },
            { id: "Maternal Health", label: t.filterMaternal, icon: "🤰" },
            { id: "Child Care", label: t.filterChild, icon: "🍼" },
            { id: "Fever & Pain", label: t.filterFever, icon: "💊" },
            { id: "First Aid & Kits", label: t.filterFirstAid, icon: "🧰" },
          ].map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={"px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 text-xs " + (
                  active
                    ? (cat.id === "Low Stock" ? "bg-rose-600 text-white shadow-sm font-black" : "bg-[#008F83] text-white shadow-sm font-black")
                    : (cat.id === "Low Stock" && lowStockCount > 0
                      ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-black"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Medicine Pouch Cards List ── */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-4 space-y-3">
        {loading ? (
          <div className="p-16 text-center text-slate-400 font-bold text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-7 h-7 animate-spin text-[#008F83]" />
            <span>Opening field medicine kit...</span>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-extrabold text-slate-700 text-sm">{t.noMedicinesFound}</p>
            <p className="text-xs text-slate-400 mt-1">Check pouch filters or search for another drug name.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMedicines.map((med) => {
              const isLow = (med.stock || 0) <= (med.threshold || 10);
              const displayName = lang === "mr" ? (med.name_mr || med.name_en) : lang === "hi" ? (med.name_hi || med.name_en) : med.name_en;
              const stockVal = localStock[med.id] ?? String(med.stock ?? 0);
              const currentStockNum = parseInt(stockVal, 10) || 0;

              // Safe target capacity calculation (e.g. 2x threshold or current stock + 10)
              const targetCapacity = Math.max((med.threshold || 10) * 2, med.stock || 0, 10);
              const stockRatio = Math.min(100, Math.round((currentStockNum / targetCapacity) * 100));

              let expiryWarning = null;
              if (med.expiry_date) {
                const diffDays = Math.floor((new Date(med.expiry_date) - new Date()) / 86400000);
                if (diffDays < 0) expiryWarning = "expired";
                else if (diffDays <= 60) expiryWarning = "soon";
              }

              return (
                <div
                  key={med.id}
                  className={"p-4 sm:p-5 rounded-2xl border transition-all shadow-xs " + (
                    isLow
                      ? "bg-rose-50/35 border-rose-200/90 hover:border-rose-300"
                      : "bg-white border-slate-200/80 hover:border-slate-300"
                  )}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Icon & Medicine Clinical Details */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className={"w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl shadow-xs border " + (
                        isLow ? "bg-rose-100 border-rose-200" : "bg-teal-50 border-teal-100"
                      )}>
                        {getPouchIcon(med.category, med.unit)}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Title Row with Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-900 text-base">{displayName}</h4>
                          {lang !== "en" && med.name_en !== displayName && (
                            <span className="text-[11px] text-slate-400 font-medium">({med.name_en})</span>
                          )}

                          {/* Category Tag */}
                          <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {med.category}
                          </span>

                          {/* Stock Status Pill */}
                          {isLow ? (
                            <span className="text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              ⚠️ {t.lowStockBadge} ({med.stock} LEFT)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                              ✓ {t.healthyStockBadge}
                            </span>
                          )}
                        </div>

                        {/* Metadata row: Threshold, Batch, Expiry */}
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap font-medium">
                          <span>{t.minThreshold}: <b className="text-slate-800">{med.threshold} {med.unit}</b></span>
                          {med.batch_number && <span>• Batch: <b className="text-slate-800 font-mono">{med.batch_number}</b></span>}
                          {med.expiry_date && (
                            <span className={expiryWarning === "expired" ? "text-rose-700 font-bold" : expiryWarning === "soon" ? "text-amber-600 font-bold" : ""}>
                              • Exp: <b className="font-mono">{med.expiry_date}</b>
                              {expiryWarning === "expired" && " 🚫 EXPIRED"}
                              {expiryWarning === "soon" && " ⚠️ Expiring Soon"}
                            </span>
                          )}
                        </div>

                        {/* Visual Stock Level Tube / Progress Bar */}
                        <div className="mt-2.5 max-w-md">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>Field Stock Level: <b className={isLow ? "text-rose-600" : "text-teal-700"}>{currentStockNum} / {targetCapacity} {med.unit}</b></span>
                            <span>{stockRatio}% Capacity</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                            <div
                              className={"h-full rounded-full transition-all duration-300 " + (
                                isLow ? "bg-rose-500" : "bg-gradient-to-r from-[#008F83] to-[#00A896]"
                              )}
                              style={{ width: `${stockRatio}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Tactile One-Handed Dispense Steppers & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Tactile Stepper Box */}
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-inner">
                        {/* Decrement [-] Button */}
                        <button
                          type="button"
                          onClick={() => handleStepStock(med.id, -1)}
                          disabled={currentStockNum <= 0}
                          className="w-8 h-8 rounded-xl bg-white hover:bg-rose-100 text-slate-700 hover:text-rose-700 border border-slate-200/80 flex items-center justify-center font-black transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-xs active:scale-95"
                          title="Dispense / Deduct 1 unit"
                        >
                          <Minus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        {/* Stock Number Display & Direct Input */}
                        <div className="px-2 flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={stockVal}
                            onChange={e => handleStockInputChange(med.id, e.target.value)}
                            onBlur={() => handleStockInputBlur(med.id)}
                            className={"w-14 text-center font-black text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-[#008F83] rounded " + (isLow ? "text-rose-700" : "text-slate-900")}
                            aria-label={"Stock for " + med.name_en}
                          />
                          <span className="text-[10px] font-black text-slate-400 select-none uppercase tracking-wider">{med.unit}</span>
                        </div>

                        {/* Increment [+] Button */}
                        <button
                          type="button"
                          onClick={() => handleStepStock(med.id, +1)}
                          className="w-8 h-8 rounded-xl bg-white hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 border border-slate-200/80 flex items-center justify-center font-black transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Add / Restock 1 unit"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>

                      {/* Edit & Delete Actions */}
                      <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(med)}
                          className="p-2 hover:bg-slate-100 text-slate-500 hover:text-[#008F83] rounded-xl transition-colors cursor-pointer"
                          title={t.editItem}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setItemToDelete(med); setShowDeleteModal(true); }}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                          title={t.deleteItem}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom Dispatch Action Bar ── */}
      <div className="bg-white border-t border-slate-200/90 px-5 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs">
          <span className={"w-2 h-2 rounded-full " + (lowStockCount > 0 ? "bg-rose-500 animate-pulse" : "bg-teal-500")} />
          <span className="font-bold text-slate-600">
            {lowStockCount > 0
              ? `Restock Requisition: ${lowStockCount} items below alert safety threshold.`
              : `Kit Status: All frontline medicine supplies optimal.`}
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleOpenIndentGenerator}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-[#008F83] to-[#007A70] hover:from-[#007A70] hover:to-[#006860] text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.submitIndentBtn}</span>
            {lowStockCount > 0 && (
              <span className="bg-white text-[#008F83] px-2 py-0.5 rounded-full text-[10px] font-black">
                {lowStockCount}
              </span>
            )}
          </button>

          {!isFullPage && onClose && (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl text-slate-700 transition-colors cursor-pointer"
            >
              {t.close}
            </button>
          )}
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#112437] to-[#16324F] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-black text-sm">{editingItem ? t.editItemTitle : t.addNewItemTitle}</h3>
              <button onClick={() => setShowAddEditModal(false)} className="text-white/80 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveMedicine} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.englishName} *</label>
                <input type="text" required placeholder="e.g. Albendazole 400mg" value={itemFormData.name_en}
                  onChange={e => setItemFormData(p => ({ ...p, name_en: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.marathiName}</label>
                  <input type="text" value={itemFormData.name_mr} onChange={e => setItemFormData(p => ({ ...p, name_mr: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.hindiName}</label>
                  <input type="text" value={itemFormData.name_hi} onChange={e => setItemFormData(p => ({ ...p, name_hi: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.category}</label>
                  <select value={itemFormData.category} onChange={e => setItemFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.unit}</label>
                  <select value={itemFormData.unit} onChange={e => setItemFormData(p => ({ ...p, unit: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none bg-white">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.initialStock} *</label>
                  <input type="number" min="0" required value={itemFormData.stock}
                    onChange={e => setItemFormData(p => ({ ...p, stock: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.alertThreshold} *</label>
                  <input type="number" min="1" required value={itemFormData.threshold}
                    onChange={e => setItemFormData(p => ({ ...p, threshold: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.batchNo}</label>
                  <input type="text" placeholder="e.g. B-9921" value={itemFormData.batch_number}
                    onChange={e => setItemFormData(p => ({ ...p, batch_number: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.expiry}</label>
                  <input type="date" value={itemFormData.expiry_date}
                    onChange={e => setItemFormData(p => ({ ...p, expiry_date: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-[#008F83] focus:outline-none" />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddEditModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700 cursor-pointer">{t.cancel}</button>
                <button type="submit" className="px-5 py-2 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold rounded-xl shadow-xs cursor-pointer">{t.saveChanges}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-slate-900 text-base">{t.deleteConfirmTitle}</h3>
            <p className="text-xs text-slate-500 mt-1">{t.deleteConfirmDesc}</p>
            <p className="font-extrabold text-slate-900 text-sm mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{itemToDelete.name_en}</p>
            <div className="mt-5 flex gap-2 justify-center">
              <button onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-xl text-slate-700 cursor-pointer">{t.cancel}</button>
              <button onClick={handleDeleteMedicine} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer">{t.confirmDeleteBtn}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Smart Indent Modal ── */}
      {showIndentModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-[#112437] to-[#008F83] text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-black text-sm flex items-center gap-2"><Send className="w-4 h-4 text-teal-200" /> {t.indentTitle}</h3>
                <p className="text-xs text-teal-100">{t.indentSubtitle}</p>
              </div>
              <button onClick={() => setShowIndentModal(false)} className="text-white/80 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              {indentSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{indentSuccessMsg}</span>
                </div>
              )}

              {/* Connected PHC Drug Depot Contact Ribbon */}
              <div className="bg-[#E8F7F3] border border-[#008F83]/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Hospital className="w-4 h-4 text-[#008F83]" />
                    <div>
                      <p className="font-black text-slate-900 text-xs">Primary Health Centre (PHC) - Shirwal Central Drug Depot</p>
                      <p className="text-[11px] text-slate-600">Store In-Charge: <b>Shri. S. K. Jadhav</b> (Pharmacist) • Sector 4 Supply Hub</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-[#008F83] text-white px-2 py-0.5 rounded-full">
                    🟢 Depot Connected
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="tel:+919422012345"
                    className="flex items-center gap-1.5 bg-white text-[#008F83] border border-[#008F83]/30 hover:bg-[#008F83] hover:text-white px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Call Storekeeper (+91 94220-12345)</span>
                  </a>

                  <a
                    href={generateWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send via WhatsApp</span>
                  </a>
                </div>
              </div>

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
                          {item.is_low && <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">Low Stock Deficit</span>}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-600">{item.current_stock} {item.unit}</td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <input type="number" min="0" value={item.requested_qty}
                              onChange={(e) => { const val = parseInt(e.target.value, 10) || 0; setIndentItems(prev => prev.map((it, i) => i === idx ? { ...it, requested_qty: val } : it)); }}
                              className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-right font-black text-[#008F83] focus:outline-none focus:border-[#008F83]" />
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
                <textarea rows="3" placeholder={t.notesPlaceholder} value={indentNotes} onChange={e => setIndentNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#008F83]" />
              </div>
            </div>
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center">
              <button type="button" onClick={() => setShowIndentModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl text-slate-700 cursor-pointer">{t.cancel}</button>
              <button type="button" disabled={isSubmittingIndent} onClick={handleDispatchIndent} className="px-5 py-2.5 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50">
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingIndent ? "Dispatching..." : t.dispatchIndentBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dispatched Indent Log Modal ── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 max-h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-[#112437] text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-black text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-[#008F83]" /> Dispatched Indent Log</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-white/80 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
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
                        <p className="text-[10px] text-slate-500 mt-0.5">{new Date(ind.created_at || Date.now()).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                      <span className="text-[9px] font-black bg-[#E8F7F3] text-[#008F83] border border-[#008F83]/30 px-2 py-0.5 rounded-full uppercase">{ind.status || "SUBMITTED"}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                      <p className="font-extrabold text-[11px] text-slate-700 mb-1">Items ({ind.items?.length || 0}):</p>
                      <ul className="text-[11px] text-slate-600 space-y-0.5">
                        {ind.items?.map((it, i) => (
                          <li key={i} className="flex justify-between">
                            <span>• {it.name || it.name_en}</span>
                            <b className="text-[#008F83]">+{it.requested_qty} {it.unit}</b>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {ind.notes && <p className="text-[11px] text-slate-500 italic bg-amber-50/60 p-2 rounded-lg border border-amber-100">Note: {ind.notes}</p>}
                  </div>
                ))
              )}
            </div>
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
              <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold rounded-xl text-slate-700 cursor-pointer">{t.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isFullPage) {
    return <div className="flex flex-col h-full overflow-hidden">{mainContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden text-slate-800 font-sans">
        {mainContent}
      </div>
    </div>
  );
}
