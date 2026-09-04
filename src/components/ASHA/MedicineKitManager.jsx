import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Package, Plus, Edit2, Trash2, Send, CheckCircle2,
  Search, X, RefreshCw, FileText, Pill, Phone, MessageSquare, Hospital
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
    title: "Medicine Kit & Drug Stock",
    subtitle: "ASHA Field Medicine Bag \u2022 Real-time Inventory & PHC Indents",
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
    editItem: "Edit Medicine",
    deleteItem: "Delete Medicine",
    saveChanges: "Save Changes",
    addNewItemTitle: "Add New Medicine to Kit",
    editItemTitle: "Edit Medicine Details",
    englishName: "Medicine Name (English)",
    marathiName: "\u0928\u093e\u0935 (\u092e\u0930\u093e\u0920\u0940)",
    hindiName: "\u0928\u093e\u092e (\u0939\u093f\u0902\u0926\u0940)",
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
    lowStockBadge: "Low Stock",
    healthyStockBadge: "Adequate Stock",
    category: "Category",
    unit: "Unit",
    batchNo: "Batch No.",
    expiry: "Expiry Date",
  },
  mr: {
    title: "\u0914\u0937\u0927 \u0938\u093e\u0920\u093e \u0935 \u0915\u093f\u091f \u0935\u094d\u092f\u0935\u0938\u094d\u0925\u093e\u092a\u0928",
    subtitle: "\u0906\u0936\u093e \u0915\u093e\u0930\u094d\u092f\u0915\u0930\u094d\u0924\u093e \u0914\u0937\u0927 \u0915\u093f\u091f \u2022 \u0925\u0947\u091f \u0938\u093e\u0920\u093e \u0928\u094b\u0902\u0926 \u0935 \u092a\u094d\u0930\u093e\u0925\u092e\u093f\u0915 \u0906\u0930\u094b\u0917\u094d\u092f \u0915\u0947\u0902\u0926\u094d\u0930 \u092e\u093e\u0917\u0923\u0940",
    totalMedicines: "\u090f\u0915\u0942\u0923 \u0914\u0937\u0927 \u092a\u094d\u0930\u0915\u093e\u0930",
    totalUnits: "\u090f\u0915\u0942\u0923 \u0909\u092a\u0932\u092c\u094d\u0927 \u0917\u094b\u0933\u094d\u092f\u093e/\u0915\u093f\u091f",
    lowStockAlerts: "\u0915\u092e\u0940 \u0938\u093e\u0920\u093e \u0905\u0938\u0932\u0947\u0932\u0940 \u0914\u0937\u0927\u0947",
    indentsSent: "\u092a\u093e\u0920\u0935\u0932\u0947\u0932\u094d\u092f\u093e \u092e\u093e\u0917\u0923\u094d\u092f\u093e",
    searchPlaceholder: "\u0914\u0937\u0927\u093e\u091a\u0947 \u0928\u093e\u0935 \u0915\u093f\u0902\u0935\u093e \u092a\u094d\u0930\u0915\u093e\u0930 \u0936\u094b\u0927\u093e...",
    filterAll: "\u0938\u0930\u094d\u0935 \u0914\u0937\u0927\u0947",
    filterLowStock: "\u0915\u092e\u0940 \u0938\u093e\u0920\u093e (\u0924\u093e\u0924\u0921\u0940\u0928\u0947 \u0906\u0935\u0936\u094d\u092f\u0915)",
    filterMaternal: "\u092e\u093e\u0924\u093e \u0906\u0930\u094b\u0917\u094d\u092f",
    filterChild: "\u092c\u093e\u0932 \u0938\u0902\u0917\u094b\u092a\u0928",
    filterFever: "\u0924\u093e\u092a \u0935 \u0905\u0902\u0917\u0926\u0941\u0916\u0940",
    filterFirstAid: "\u0915\u093f\u091f \u0935 \u0924\u092a\u093e\u0938\u0923\u0940 \u0938\u093e\u0927\u0928\u0947",
    addMedicineBtn: "\u0928\u0935\u0940\u0928 \u0914\u0937\u0927 \u091c\u094b\u0921\u093e",
    submitIndentBtn: "\u0906\u0930\u094b\u0917\u094d\u092f \u0915\u0947\u0902\u0926\u094d\u0930\u093e\u0915\u0921\u0947 \u092e\u093e\u0917\u0923\u0940 \u092a\u093e\u0920\u0935\u093e",
    historyBtn: "\u092e\u093e\u0917\u0923\u0940 \u0907\u0924\u093f\u0939\u093e\u0938",
    minThreshold: "\u0915\u093f\u092e\u093e\u0928 \u0906\u0935\u0936\u094d\u092f\u0915 \u092e\u0930\u094d\u092f\u093e\u0926\u093e",
    editItem: "\u092e\u093e\u0939\u093f\u0924\u0940 \u092c\u0926\u0932\u093e",
    deleteItem: "\u0915\u093e\u0922\u0942\u0928 \u091f\u093e\u0915\u093e",
    saveChanges: "\u092c\u0926\u0932 \u091c\u0924\u0928 \u0915\u0930\u093e",
    addNewItemTitle: "\u0915\u093f\u091f\u092e\u0927\u094d\u092f\u0947 \u0928\u0935\u0940\u0928 \u0914\u0937\u0927 \u091c\u094b\u0921\u093e",
    editItemTitle: "\u0914\u0937\u0927 \u092e\u093e\u0939\u093f\u0924\u0940 \u0938\u0902\u092a\u093e\u0926\u093f\u0924 \u0915\u0930\u093e",
    englishName: "\u0914\u0937\u0927\u093e\u091a\u0947 \u0928\u093e\u0935 (\u0907\u0902\u0917\u094d\u0930\u091c\u0940)",
    marathiName: "\u0928\u093e\u0935 (\u092e\u0930\u093e\u0920\u0940)",
    hindiName: "\u0928\u093e\u0935 (\u0939\u093f\u0902\u0926\u0940)",
    initialStock: "\u0938\u0927\u094d\u092f\u093e\u091a\u093e \u0909\u092a\u0932\u092c\u094d\u0927 \u0938\u093e\u0920\u093e",
    alertThreshold: "\u0915\u092e\u0940 \u0938\u093e\u0920\u093e \u0938\u0942\u091a\u0928\u093e \u092e\u0930\u094d\u092f\u093e\u0926\u093e",
    deleteConfirmTitle: "\u0939\u091f\u0935\u0923\u094d\u092f\u093e\u091a\u0940 \u092a\u0941\u0937\u094d\u091f\u0940 \u0915\u0930\u093e",
    deleteConfirmDesc: "\u0939\u0947 \u0914\u0937\u0927 \u0915\u093f\u091f \u0928\u094b\u0902\u0926\u0923\u0940\u0924\u0942\u0928 \u0915\u093e\u0922\u093e\u092f\u091a\u0947 \u0906\u0939\u0947 \u0915\u093e?",
    confirmDeleteBtn: "\u0939\u094b, \u0915\u093e\u0922\u093e",
    cancel: "\u0930\u0926\u094d\u0926 \u0915\u0930\u093e",
    close: "\u092c\u0902\u0926 \u0915\u0930\u093e",
    indentTitle: "\u0938\u094d\u092e\u093e\u0930\u094d\u091f PHC \u092a\u0941\u0928\u0930\u094d\u092d\u0930\u0923 \u092e\u093e\u0917\u0923\u0940",
    indentSubtitle: "\u0915\u092e\u0940 \u0938\u093e\u0920\u094d\u092f\u093e\u091a\u094d\u092f\u093e \u0906\u0927\u093e\u0930\u0947 \u0938\u094d\u0935\u092f\u0902\u091a\u0932\u093f\u0924 \u0917\u0923\u0928\u093e",
    requestedQty: "\u092e\u093e\u0917\u0935\u0932\u0947\u0932\u0940 \u0938\u0902\u0916\u094d\u092f\u093e",
    ashaNotes: "\u0906\u0936\u093e \u0915\u093e\u0930\u094d\u092f\u0915\u0930\u094d\u0924\u094d\u092f\u093e\u091a\u094d\u092f\u093e \u0928\u094b\u0902\u0926\u0940",
    notesPlaceholder: "\u0909\u0926\u093e. \u0938\u0947\u0915\u094d\u091f\u0930 4 \u092e\u0927\u094d\u092f\u0947 \u0935\u093f\u0937\u093e\u0923\u0941\u091c\u0928\u094d\u092f (\u0924\u093e\u092a) \u0935\u093e\u0922\u0932\u093e \u0906\u0939\u0947...",
    dispatchIndentBtn: "PHC \u0936\u093f\u0930\u0935\u0933\u0915\u0921\u0947 \u092e\u093e\u0917\u0923\u0940 \u092a\u093e\u0920\u0935\u093e",
    indentSuccess: "\u092a\u0941\u0928\u0930\u094d\u092d\u0930\u0923 \u092e\u093e\u0917\u0923\u0940 \u092f\u0936\u0938\u094d\u0935\u0940\u0930\u093f\u0924\u094d\u092f\u093e \u092a\u093e\u0920\u0935\u0932\u0940!",
    noMedicinesFound: "\u0936\u094b\u0927 \u0928\u093f\u0915\u0937\u093e\u0902\u0936\u0940 \u091c\u0941\u0933\u0923\u093e\u0930\u0940 \u0914\u0937\u0927\u0947 \u0928\u093e\u0939\u0940\u0924.",
    lowStockBadge: "\u0915\u092e\u0940 \u0938\u093e\u0920\u093e",
    healthyStockBadge: "\u092a\u0941\u0930\u0947\u0938\u093e \u0938\u093e\u0920\u093e",
    category: "\u092a\u094d\u0930\u0915\u093e\u0930",
    unit: "\u090f\u0915\u0915",
    batchNo: "\u092c\u0945\u091a \u0915\u094d\u0930.",
    expiry: "\u0915\u093e\u0932\u092c\u093e\u0939\u094d\u092f\u0924\u093e \u0924\u093e\u0930\u0940\u0916",
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

  const totalUnitsInBag = useMemo(() =>
    medicines.reduce((sum, m) => sum + (parseInt(m.stock, 10) || 0), 0), [medicines]);

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

  const mainContent = (
    <div className="flex flex-col h-full bg-[#F5FBF9]">
      {/* Header in Signal Green / Navy */}
      <div className="bg-gradient-to-r from-[#16324F] via-[#008F83] to-[#007A70] text-white px-5 sm:px-7 py-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">{t.title}</h2>
            <p className="text-xs text-teal-100/90 font-medium">{t.subtitle}</p>
          </div>
        </div>
        {!isFullPage && onClose && (
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Metric Ribbon with Connected PHC Hotline */}
      <div className="bg-white border-b border-slate-200 px-5 sm:px-7 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.totalMedicines}</p>
          <p className="text-xl font-black text-[#16324F] mt-0.5">{medicines.length}</p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{t.totalUnits}</p>
          <p className="text-xl font-black text-[#008F83] mt-0.5">{totalUnitsInBag}</p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
          <p className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">{t.lowStockAlerts}</p>
          <p className={"text-xl font-black mt-0.5 " + (lowStockCount > 0 ? "text-rose-600" : "text-slate-700")}>{lowStockCount}</p>
        </div>
        {/* Connected PHC Depot Card */}
        <div className="bg-[#E8F7F3] p-2.5 rounded-xl border border-[#008F83]/30 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-[#008F83] uppercase tracking-wider flex items-center gap-1">
              <Hospital className="w-3 h-3" /> PHC Shirwal Depot
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <a
                href="tel:+919422012345"
                className="text-xs font-black text-[#008F83] hover:underline flex items-center gap-1"
                title="Call PHC Pharmacist"
              >
                <Phone className="w-3 h-3" /> +91 94220-12345
              </a>
            </div>
          </div>
          <button
            onClick={handleOpenHistory}
            className="text-[10px] font-black text-[#008F83] hover:text-white bg-white hover:bg-[#008F83] px-2 py-1 rounded-lg border border-[#008F83]/30 transition-all cursor-pointer shrink-0"
          >
            {t.historyBtn}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white px-5 sm:px-7 pt-4 pb-3 space-y-3 flex-shrink-0 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder={t.searchPlaceholder} value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#008F83] focus:bg-white transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button onClick={handleOpenAddModal} className="px-3.5 py-2 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t.addMedicineBtn}</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {["All", "Low Stock", "Maternal Health", "Child Care", "Fever & Pain", "First Aid & Kits"].map((cat) => {
            const active = activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={"px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer " + (
                  active
                    ? (cat === "Low Stock" ? "bg-rose-600 text-white shadow-xs" : "bg-[#008F83] text-white shadow-xs")
                    : (cat === "Low Stock" && lowStockCount > 0
                      ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                )}>
                {cat === "All" ? t.filterAll :
                 cat === "Low Stock" ? (t.filterLowStock + " (" + lowStockCount + ")") :
                 cat === "Maternal Health" ? t.filterMaternal :
                 cat === "Child Care" ? t.filterChild :
                 cat === "Fever & Pain" ? t.filterFever : t.filterFirstAid}
              </button>
            );
          })}
        </div>
      </div>

      {/* Medicine List */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#008F83]" />
            <span>Loading medicine inventory...</span>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-extrabold text-slate-700 text-sm">{t.noMedicinesFound}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            {filteredMedicines.map((med) => {
              const isLow = (med.stock || 0) <= (med.threshold || 10);
              const displayName = lang === "mr" ? (med.name_mr || med.name_en) : lang === "hi" ? (med.name_hi || med.name_en) : med.name_en;
              const stockVal = localStock[med.id] ?? String(med.stock ?? 0);
              let expiryWarning = null;
              if (med.expiry_date) {
                const diffDays = Math.floor((new Date(med.expiry_date) - new Date()) / 86400000);
                if (diffDays < 0) expiryWarning = "expired";
                else if (diffDays <= 60) expiryWarning = "soon";
              }
              return (
                <div key={med.id} className={"p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors " + (isLow ? "bg-rose-50/40 hover:bg-rose-50/70" : "hover:bg-slate-50")}>
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={"w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-lg " + (isLow ? "bg-rose-100" : "bg-teal-50")}>
                      {med.unit === "kits" ? "🧰" : med.unit === "packets" ? "📦" : "💊"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 text-sm">{displayName}</h4>
                        {lang !== "en" && med.name_en !== displayName && (
                          <span className="text-[10px] text-slate-400">({med.name_en})</span>
                        )}
                        <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{med.category}</span>
                        {isLow && <span className="text-[9px] font-black bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">{t.lowStockBadge} ⚠️</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap font-medium">
                        <span>{t.minThreshold}: <b className="text-slate-700">{med.threshold} {med.unit}</b></span>
                        {med.batch_number && <span>• Batch: <b className="text-slate-700">{med.batch_number}</b></span>}
                        {med.expiry_date && (
                          <span className={expiryWarning === "expired" ? "text-rose-700 font-bold" : expiryWarning === "soon" ? "text-amber-600 font-bold" : ""}>
                            • Exp: <b>{med.expiry_date}</b>
                            {expiryWarning === "expired" && " 🚫 EXPIRED"}
                            {expiryWarning === "soon" && " ⚠️ Expiring Soon"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                    <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap hidden sm:inline-block " + (isLow ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700")}>
                      {isLow ? "⚠️ Low" : "✓ OK"}
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                      <input
                        type="number" min="0" value={stockVal}
                        onChange={e => handleStockInputChange(med.id, e.target.value)}
                        onBlur={() => handleStockInputBlur(med.id)}
                        className={"w-16 text-center font-black text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-[#008F83] rounded " + (isLow ? "text-rose-700" : "text-slate-900")}
                        aria-label={"Stock for " + med.name_en}
                      />
                      <span className="text-[10px] font-bold text-slate-400 select-none whitespace-nowrap">{med.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                      <button type="button" onClick={() => handleOpenEditModal(med)} className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#008F83] rounded-lg transition-colors cursor-pointer" title={t.editItem}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => { setItemToDelete(med); setShowDeleteModal(true); }} className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer" title={t.deleteItem}>
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

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 px-5 sm:px-7 py-3.5 flex items-center justify-between gap-3 flex-shrink-0">
        <button onClick={handleOpenIndentGenerator} className="px-4 py-2.5 bg-[#008F83] hover:bg-[#007A70] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer">
          <Send className="w-3.5 h-3.5" />
          <span>{t.submitIndentBtn}</span>
          {lowStockCount > 0 && <span className="bg-white text-[#008F83] px-1.5 py-0.5 rounded-full text-[10px] font-black ml-0.5">{lowStockCount}</span>}
        </button>
        {!isFullPage && onClose && (
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 font-bold text-xs rounded-xl text-slate-700 transition-colors cursor-pointer">
            {t.close}
          </button>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="bg-[#16324F] text-white px-6 py-4 flex justify-between items-center">
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

      {/* Delete Modal */}
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

      {/* Indent Modal with Connected PHC Pipeline */}
      {showIndentModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-[#16324F] to-[#008F83] text-white px-6 py-4 flex justify-between items-center">
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

      {/* History Modal in Signal Green Theme */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 max-h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-[#16324F] text-white px-6 py-4 flex justify-between items-center">
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
