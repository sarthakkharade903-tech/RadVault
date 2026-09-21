import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft, Sparkles, Loader2, CheckCircle2, AlertTriangle,
  Building2, UserCircle2, Stethoscope, Ambulance, Mic, Square,
  Volume2, Trash2, Check, ArrowRight, ArrowLeft, Search, Plus, RefreshCw,
  Radio, Navigation, ShieldCheck, HeartPulse, ShieldAlert,
  Activity, FileText, Award, Zap, Globe
} from 'lucide-react';
import PatientSelectScreen from './screens/PatientSelectScreen';
import PatientTypeScreen from './screens/PatientTypeScreen';
import PregnantScreen from './screens/PregnantScreen';
import ChildScreen from './screens/ChildScreen';
import ElderlyScreen from './screens/ElderlyScreen';
import AdultScreen from './screens/AdultScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import { DEPARTMENTS, HOSPITALS } from '../../data/mockReferrals';
import { createPhysicalReferral, generateKimiClinicalRoadmap } from '../../services/ashaService';
import { fetchGovHospitals, getCurrentLocation, calculateHaversineDistance, CONNECTED_FACILITIES } from '../../services/locationService';
import { supabase } from '../../services/supabase';

// ─── Single-Language Dictionaries (No Mixed Text) ─────────
const TRIAGE_TRANSLATIONS = {
  en: {
    title: "Patient Referral & Triage",
    subtitle: "AI Clinical Urgency & Hospital Routing",
    selectPatient: "Select Patient",
    patientType: "Patient Type",
    assessment: "Health Assessment",
    triageResult: "Triage Urgency",
    routing: "Hospital Routing",
    hospitalSelect: "Select Destination Hospital",
    searchHospital: "Search hospital name or nearby PHC...",
    deptSelect: "Select Clinical Service / Department",
    chooseDept: "-- Select Department --",
    jsyLabel: "ASHA Accompanying Patient",
    jsySub: "Flag for emergency escort or JSY incentive upon hospital arrival",
    voiceNoteTitle: "Voice Scribe Condition Note",
    voiceNoteSub: "Speak patient symptoms via microphone to transcribe notes",
    startRec: "Start Voice Recording",
    stopRec: "Stop & Save Note",
    recActive: "Recording: 00:",
    memoPlayer: "Recorded Audio Condition Memo",
    removeAudio: "Remove",
    notesLabel: "Clinical Observations & Urgent Symptoms",
    notesPlaceholder: "Spoken or typed patient observations for receiving doctor...",
    priorityRed: "EMERGENCY (Immediate Transfer)",
    priorityOrange: "URGENT (Evaluate within 24h)",
    priorityGreen: "ROUTINE (Scheduled OPD)",
    submitReferral: "Save & Dispatch Referral",
    submitting: "Dispatching Referral...",
    back: "Back",
    continueRouting: "Proceed to Hospital Routing →",
    errSelectHosp: "Please select a destination hospital.",
    errSelectDept: "Please select a clinical department."
  },
  mr: {
    title: "रुग्ण रेफरल व तात्काळ तपासणी",
    subtitle: "रुग्णालय व प्राथमिक आरोग्य केंद्र रेफरल",
    selectPatient: "रुग्ण निवडा",
    patientType: "रुग्णाचा प्रकार",
    assessment: "आरोग्य तपासणी",
    triageResult: "तातडीचे वर्गीकरण",
    routing: "रुग्णालय निवड",
    hospitalSelect: "रेफर करण्याचे रुग्णालय निवडा",
    searchHospital: "रुग्णालय किंवा प्राथमिक आरोग्य केंद्र शोधा...",
    deptSelect: "तपासणी विभाग निवडा",
    chooseDept: "-- विभाग निवडा --",
    jsyLabel: "आशा कार्यकर्ता सोबत जात आहे",
    jsySub: "तातडीच्या रुग्णासोबत रुग्णालयात जाण्यासाठी नोंद",
    voiceNoteTitle: "आवाज नोंदणी व लक्षणे",
    voiceNoteSub: "माईकवर बोलून रुग्णाची लक्षणे नोंदवा",
    startRec: "माईक सुरू करा",
    stopRec: "नोंद पूर्ण करा",
    recActive: "रेकॉर्डिंग चालू: 00:",
    memoPlayer: "रेकॉर्ड केलेली ऑडिओ नोंद",
    removeAudio: "काढून टाका",
    notesLabel: "रुग्णाची लक्षणे व डॉक्टरांसाठी माहिती",
    notesPlaceholder: "रुग्णालयातील डॉक्टरांसाठी महत्त्वाची लक्षणे...",
    priorityRed: "अति तातडीचे (तातडीने हलवा)",
    priorityOrange: "तातडीचे (२४ तासांत दाखवा)",
    priorityGreen: "सर्वसाधारण तपासणी",
    submitReferral: "रेफरल नोंद सेव्ह करा",
    submitting: "नोंद होत आहे...",
    back: "मागे",
    continueRouting: "रुग्णालय निवडीकडे जा →",
    errSelectHosp: "कृपया रुग्णालय निवडा.",
    errSelectDept: "कृपया विभाग निवडा."
  },
  hi: {
    title: "मरीज रेफरल एवं जांच",
    subtitle: "अस्पताल एवं पीएचसी रेफरल प्रक्रिया",
    selectPatient: "मरीज चुनें",
    patientType: "मरीज का प्रकार",
    assessment: "स्वास्थ्य जांच",
    triageResult: "प्राथमिकता वर्गीकरण",
    routing: "अस्पताल चयन",
    hospitalSelect: "रेफर हेतु अस्पताल चुनें",
    searchHospital: "अस्पताल या पीएचसी खोजें...",
    deptSelect: "उपचार विभाग चुनें",
    chooseDept: "-- विभाग चुनें --",
    jsyLabel: "आशा कार्यकर्ता साथ जा रही हैं",
    jsySub: "अस्पताल में मरीज के साथ जाने हेतु",
    voiceNoteTitle: "बोलकर लक्षण दर्ज करें",
    voiceNoteSub: "माइक पर बोलकर मरीज की स्थिति दर्ज करें",
    startRec: "माइक शुरू करें",
    stopRec: "दर्ज करें",
    recActive: "रिकॉर्डिंग: 00:",
    memoPlayer: "ऑडियो वॉइस नोट",
    removeAudio: "हटाएं",
    notesLabel: "मरीज के लक्षण एवं डॉक्टर के लिए जानकारी",
    notesPlaceholder: "अस्पताल के डॉक्टर के लिए जरूरी लक्षण...",
    priorityRed: "अति आवश्यक (तुरंत ले जाएं)",
    priorityOrange: "आवश्यक (24 घंटे में दिखाएं)",
    priorityGreen: "सामान्य जांच",
    submitReferral: "रेफरल सुरक्षित करें",
    submitting: "सुरक्षित हो रहा है...",
    back: "पीछे",
    continueRouting: "अस्पताल चयन पर जाएं →",
    errSelectHosp: "कृपया अस्पताल चुनें।",
    errSelectDept: "कृपया विभाग चुनें।"
  }
};

// Local clinical rules engine
function localTriage(patientType, answers) {
  let dept = 'General Medicine & OPD';
  if (patientType === 'pregnant') dept = 'Maternity & Gynecology (ANC / Delivery)';
  if (patientType === 'child') dept = 'Child Health & Pediatrics';
  if (patientType === 'emergency') dept = 'Emergency & Casualty / Trauma';

  if (answers?.bleeding || answers?.convulsions || answers?.unconscious || patientType === 'emergency' || answers?.spo2 < 90) {
    return {
      priority: 'RED',
      note: 'CRITICAL: Severe symptoms detected. Immediate transfer to higher hospital required.',
      department: 'Emergency & Casualty / Trauma'
    };
  }
  if (answers?.swelling || answers?.headacheVision || answers?.breathingDiff || answers?.chestPain || answers?.bp?.includes('150') || answers?.bp?.includes('160')) {
    return {
      priority: 'ORANGE',
      note: 'URGENT: High-risk symptoms present. Requires clinical evaluation within 24 hours.',
      department: dept
    };
  }
  return {
    priority: 'GREEN',
    note: 'ROUTINE: Patient condition appears stable. Routine consultation recommended.',
    department: dept
  };
}

// ─── Multilingual Ground-Reality Clinical Protocol Matrix (EN / MR / HI) ─────
const CLINICAL_TRANSLATIONS = {
  maternal: {
    en: {
      box1Tag: "Pillar 1 · Clinical Differential",
      box1Title: "Clinical Differential & Red Flags",
      diagnosis: "Severe Gestational Anemia (Hb < 7 g/dL) with Cardiorespiratory Decompensation & Fetal Hypoxia Risk",
      reasoning: "Persistent breathlessness, extreme fatigue, and conjunctival/eye pallor in the second/third trimester indicate severe hemodynamic compromise. Maternal oxygen-carrying capacity is reduced, creating acute risk of high-output heart failure and intrauterine growth restriction without urgent parenteral or blood therapy.",
      dangerTitle: "En-Route Red Flags (Emergency Diversion):",
      dangerFlags: [
        "Sudden decrease or cessation of fetal movements",
        "Pre-syncope, severe postural dizziness, or chest tightness",
        "Vaginal bleeding, fluid leakage, or progressive facial/pedal edema"
      ],
      box2Tag: "Pillar 2 · ASHA Ground Directives",
      box2Title: "Immediate Field Care & 108 Transit Stabilization",
      ashaProtocol: [
        "Position patient in Left Lateral Decubitus tilt to relieve inferior vena cava (IVC) compression and optimize placental perfusion",
        "Mobilize 108 Ambulance / Janani Express; accompany patient carrying Mother & Child Protection (MCP) card and Aadhaar",
        "Ensure patient rests completely; offer small sips of water only if fully alert; avoid any oral iron tablets until hospital workup"
      ],
      box3Tag: "Pillar 3 · Receiving Hospital Orders",
      box3Title: "Pune Sassoon General Hospital — Fast-Track Intake",
      hospitalOrders: [
        "Stat Complete Blood Count (CBC) with Peripheral Blood Smear for RBC indices & morphology",
        "Emergency Obstetric Doppler Ultrasound for fetal biophysical profile & placental localization",
        "Blood Bank Type & Cross-match: Reserve 2 units Packed Red Blood Cells (PRBC)"
      ],
      box4Tag: "Pillar 4 · Financial Protection Shield",
      box4Title: "Indian Govt Welfare & 100% Cashless Entitlements",
      govtSchemes: [
        "Janani Suraksha Yojana (JSY): ₹1,400 rural institutional delivery assistance + ₹600 ASHA escort incentive",
        "Janani Shishu Suraksha Karyakram (JSSK): 100% cashless delivery, free blood transfusion, diagnostics, and meals at Sassoon",
        "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA): Free apex specialist ANC checkup & high-risk registry entry"
      ]
    },
    mr: {
      box1Tag: "स्तंभ १ · वैद्यकीय निदान व विश्लेषण",
      box1Title: "वैद्यकीय निदान व संभाव्य धोके",
      diagnosis: "तीव्र गर्भावस्थेतील ॲनिमिया (रक्तक्षय, हिमोग्लोबिन < ७ g/dL) व श्वसन/हृदय धोक्याची शक्यता",
      reasoning: "सतत धाप लागणे, कमालीचा अशक्तपणा आणि डोळ्यांमधील फिकटपणा यामुळे शरीरातील ऑक्सिजन वहन क्षमता गंभीररीत्या घटली आहे. तातडीने उपचार न मिळाल्यास आईच्या हृदयावर अतिरिक्त ताण येऊन बाळाच्या वाढीवर गंभीर परिणाम होण्याचा धोका आहे.",
      dangerTitle: "प्रवासातील धोक्याचे इशारे (तातडीने रुग्णालय हलवा):",
      dangerFlags: [
        "पोटातील बाळाची हालचाल अचानक कमी होणे किंवा थांबणे",
        "अचानक तीव्र चक्कर येणे, डोळ्यांसमोर अंधारी येणे किंवा छातीत धडधडणे",
        "योनीतून रक्तस्त्राव, पाणी जाणे किंवा पाय व चेहऱ्यावर अचानक सूज वाढणे"
      ],
      box2Tag: "स्तंभ २ · आशा कार्यकर्त्यांचे कृती मार्गदर्शन",
      box2Title: "१०८ रुग्णवाहिका प्रवासादरम्यान तात्काळ प्राथमिक काळजी",
      ashaProtocol: [
        "गरोदर मातेला डाव्या कुशीवर झोपवा (Left Lateral tilt), जेणेकरून बाळाला सुरळीत रक्तपुरवठा व ऑक्सिजन मिळेल",
        "१०८ रुग्णवाहिका किंवा जननी एक्सप्रेस तातडीने बोलवा; माता-बाल संरक्षण (MCP) कार्ड व आधार कार्ड सोबत घ्या",
        "रुग्णाला पूर्ण विश्रांती द्या; शुद्धीवर असल्यास फक्त थोडे थोडे पाणी द्या; रुग्णालयात जाईपर्यंत गोळ्या देणे टाळा"
      ],
      box3Tag: "स्तंभ ३ · ससून सर्वोपचार रुग्णालय आदेश",
      box3Title: "ससून रुग्णालय, पुणे — तात्काळ तपासणी आदेश",
      hospitalOrders: [
        "तात्काळ सीबीसी (CBC) व रक्तपेशी तपासणी (Peripheral Blood Smear)",
        "तातडीची प्रसूती सोनोग्राफी (Obstetric Doppler Ultrasound) - बाळाची स्थिती तपासण्यासाठी",
        "ससून रक्तपेढीत २ युनिट रक्ताची (PRBC) तातडीने राखीव नोंदणी"
      ],
      box4Tag: "स्तंभ ४ · १००% मोफत शासकीय संरक्षण",
      box4Title: "शासकीय कल्याणकारी योजना व संपूर्ण कॅशलेस लाभ",
      govtSchemes: [
        "जननी सुरक्षा योजना (JSY): ₹१,४०० थेट शासकीय आर्थिक सहाय्य + ₹६०० आशा प्रोत्साहन भत्ता",
        "जननी शिशु सुरक्षा कार्यक्रम (JSSK): ससून रुग्णालयात मोफत उपचार, रक्त, सोनोग्राफी, औषधे व भोजन",
        "प्रधानमंत्री सुरक्षित मातृत्व अभियान (PMSMA): तज्ज्ञ डॉक्टरांकडून मोफत विशेष तपासणी"
      ]
    },
    hi: {
      box1Tag: "स्तंभ 1 · नैदानिक संदेह एवं विश्लेषण",
      box1Title: "नैदानिक संदेह एवं आपातकालीन खतरे",
      diagnosis: "गंभीर गर्भावस्थीय एनीमिया (रक्त की कमी, हीमोग्लोबिन < 7 g/dL) एवं हृदय-श्वसन जोखिम",
      reasoning: "लगातार सांस फूलना, अत्यधिक कमजोरी और आंखों में पीलापन गंभीर हीमोग्लोबिन की कमी दर्शाता है। त्वरित उपचार न मिलने पर माँ के हृदय और गर्भस्थ शिशु के विकास पर गंभीर प्रतिकूल प्रभाव पड़ सकता है।",
      dangerTitle: "रास्ते में खतरे के लक्षण (तुरंत आपातकालीन सहायता लें):",
      dangerFlags: [
        "गर्भस्थ शिशु की हलचल अचानक कम होना या बंद होना",
        "अचानक तेज चक्कर, आंखों के आगे अंधेरा या सीने में भारीपन",
        "अचानक रक्तस्राव (Bleeding), पानी का रिसाव या पैरों/चेहरे पर सूजन"
      ],
      box2Tag: "स्तंभ 2 · आशा कार्यकर्ता हेतु मैदानी निर्देश",
      box2Title: "108 एम्बुलेंस परिवहन के दौरान प्राथमिक देखभाल",
      ashaProtocol: [
        "गर्भवती को बाईं करवट (Left Lateral Decubitus tilt) लिटाएं ताकि गर्भस्थ शिशु को पर्याप्त रक्त व ऑक्सीजन मिले",
        "108 एम्बुलेंस या जननी एक्सप्रेस तुरंत बुलाएं; मातृ-शिशु सुरक्षा (MCP) कार्ड और आधार कार्ड साथ रखें",
        "मरीज को पूर्ण आराम कराएं; सिर्फ घूंट-घूंट पानी दें; अस्पताल जांच तक कोई अनावश्यक दवा न दें"
      ],
      box3Tag: "स्तंभ 3 · ससून अस्पताल त्वरित जांच आदेश",
      box3Title: "ससून जनरल अस्पताल, पुणे — त्वरित जांच आदेश",
      hospitalOrders: [
        "तत्काल सीबीसी (CBC) एवं पेरिफेरल ब्लड स्मीयर जांच",
        "आपातकालीन प्रसूति सोनोग्राफी (Obstetric Doppler USG) शिशु की जांच हेतु",
        "ससून ब्लड बैंक में 2 यूनिट रक्त (PRBC) तत्काल आरक्षित करना"
      ],
      box4Tag: "स्तंभ 4 · सरकारी योजनाएं एवं वित्तीय सुरक्षा",
      box4Title: "सरकारी कल्याणकारी योजनाएं एवं 100% निःशुल्क सुरक्षा",
      govtSchemes: [
        "जननी सुरक्षा योजना (JSY): ₹1,400 संस्थागत प्रसव सहायता + ₹600 आशा प्रोत्साहन राशि",
        "जननी शिशु सुरक्षा कार्यक्रम (JSSK): ससून में 100% मुफ्त प्रसव, रक्त, सोनोग्राफी, दवा व भोजन",
        "प्रधानमंत्री सुरक्षित मातृत्व अभियान (PMSMA): उच्च-जोखिम मातृत्व विशेषज्ञ परामर्श"
      ]
    }
  },
  emergency: {
    en: {
      box1Tag: "Pillar 1 · Clinical Differential",
      box1Title: "Acute Emergency & Critical Risks",
      diagnosis: "Acute Coronary Syndrome / Acute Hemodynamic Decompensation",
      reasoning: "Acute hemodynamic distress and critical danger signs require immediate pre-hospital stabilization and emergency casualty intake.",
      dangerTitle: "En-Route Red Flags (Emergency Diversion):",
      dangerFlags: [
        "SpO2 dropping below 90% or systolic BP falling under 90 mmHg",
        "Loss of consciousness, diaphoresis, or sudden vomiting",
        "Worsening cyanosis or acute respiratory distress"
      ],
      box2Tag: "Pillar 2 · ASHA Ground Directives",
      box2Title: "Pre-Hospital Stabilization & ALS Transit",
      ashaProtocol: [
        "Keep patient in semi-Fowler's position (head elevated 30-45°) to reduce cardiac pre-load; loosen tight clothing",
        "Administer chewable Aspirin 300mg immediately if available in ASHA kit and no active bleeding history",
        "Dispatch 108 ALS Ambulance with sirens; alert Sassoon Casualty desk en-route via WhatsApp dispatch alert"
      ],
      box3Tag: "Pillar 3 · Receiving Hospital Orders",
      box3Title: "Pune Sassoon Hospital — Emergency Resuscitation Bay",
      hospitalOrders: [
        "Immediate 12-lead ECG within 10 minutes of arrival at Sassoon Casualty",
        "Stat High-Sensitivity Troponin I & venous blood gases",
        "Wide-bore IV access (18G) and supplemental high-flow oxygen"
      ],
      box4Tag: "Pillar 4 · Financial Protection Shield",
      box4Title: "Emergency Critical Care Entitlements",
      govtSchemes: [
        "Ayushman Bharat PM-JAY: Cashless coverage up to ₹5 Lakhs for critical care & ICU",
        "Maharashtra Emergency Medical Services (MEMS 108): 100% free ALS ambulance transit",
        "National Health Mission (NHM) Emergency Care Guarantee"
      ]
    },
    mr: {
      box1Tag: "स्तंभ १ · तात्काळ वैद्यकीय निदान",
      box1Title: "अति तातडीची आपत्कालीन स्थिती",
      diagnosis: "तीव्र हृदयविकार झटका (Acute Coronary Syndrome) किंवा हृदय आघात",
      reasoning: "हृदयावर अचानक आलेला ताण व गंभीर लक्षणे यामुळे रुग्णाला तात्काळ अतिदक्षता उपचार व ऑक्सिजनची आवश्यकता आहे.",
      dangerTitle: "प्रवासातील धोक्याचे इशारे (अति तातडी):",
      dangerFlags: [
        "ऑक्सिजन पातळी (SpO2) ९०% खाली जाणे किंवा बीपी ९० पेक्षा कमी होणे",
        "रुग्ण बेशुद्ध होणे, भरपूर घाम फुटणे किंवा उलट्या होणे",
        "ओठ/नखे निळी पडणे किंवा श्वास घेण्यास अतिशय त्रास होणे"
      ],
      box2Tag: "स्तंभ २ · आशा कार्यकर्त्यांचे कृती मार्गदर्शन",
      box2Title: "१०८ रुग्णवाहिका दाखल होईपर्यंत प्राथमिक कृती",
      ashaProtocol: [
        "रुग्णाला ३०-४५ अंशात डोके वर करून बसवा (Semi-Fowler's), घट्ट कपडे सैल करा",
        "आशा किटमध्ये उपलब्ध असल्यास व रक्तस्त्राव नसल्यास ३०० मिग्रॅ अस्पिरीन चावून खाण्यास सांगा",
        "१०८ रुग्णवाहिका सायरनसह तात्काळ बोलवा व ससून कॅज्युअल्टी वॉर्डला पूर्वसूचना द्या"
      ],
      box3Tag: "स्तंभ ३ · ससून सर्वोपचार रुग्णालय आदेश",
      box3Title: "ससून कॅज्युअल्टी — तात्काळ अतिदक्षता विभाग",
      hospitalOrders: [
        "रुग्णालयात पोहोचताच १० मिनिटांत १२-लीड ईसीजी (ECG) काढणे",
        "तातडीची कार्डियाक इन्झाईम (Troponin I) व रक्त तपासणी",
        "मोठ्या बोअरची आयव्ही लाईन (18G) व हाय-फ्लो ऑक्सिजन सुरू करणे"
      ],
      box4Tag: "स्तंभ ४ · मोफत शासकीय संरक्षण",
      box4Title: "मोफत आपत्कालीन उपचार संरक्षण",
      govtSchemes: [
        "आयुष्यमान भारत PM-JAY: आयसीयू व गंभीर उपचारांसाठी ₹५ लाखांपर्यंत मोफत कॅशलेस संरक्षण",
        "महाराष्ट्र आपत्कालीन वैद्यकीय सेवा (MEMS १०८): १००% मोफत रुग्णवाहिका प्रवास",
        "राष्ट्रीय आरोग्य अभियान (NHM) आपत्कालीन आरोग्य हमी"
      ]
    },
    hi: {
      box1Tag: "स्तंभ 1 · आपातकालीन नैदानिक संदेह",
      box1Title: "अति गंभीर आपातकालीन स्थिति",
      diagnosis: "तीव्र हृदय संबंधी आघात (Acute Coronary Syndrome) / हृदय गति संकट",
      reasoning: "गंभीर लक्षण और अत्यधिक बेचैनी के कारण मरीज को तुरंत अस्पताल और ऑक्सीजन सपोर्ट की आवश्यकता है।",
      dangerTitle: "रास्ते में खतरे के लक्षण (अति गंभीर):",
      dangerFlags: [
        "ऑक्सीजन (SpO2) 90% से नीचे गिरना या बीपी 90 से कम होना",
        "बेहोशी, अत्यधिक पसीना आना या लगातार उल्टी होना",
        "होंठ/नाखून नीले पड़ना या सांस लेने में अत्यंत कठिनाई"
      ],
      box2Tag: "स्तंभ 2 · आशा कार्यकर्ता हेतु मैदानी निर्देश",
      box2Title: "108 एम्बुलेंस आगमन तक प्राथमिक उपचार",
      ashaProtocol: [
        "मरीज को 30-45 डिग्री सिर उठाकर बैठाएं (Semi-Fowler's), तंग कपड़े ढीले करें",
        "आशा किट में उपलब्ध हो तो एस्पिरिन 300mg तुरंत चबाने को दें (यदि कोई ब्लीडिंग न हो)",
        "108 एम्बुलेंस तुरंत सायरन के साथ बुलाएं और ससून कैजुअल्टी को फोन पर सूचित करें"
      ],
      box3Tag: "स्तंभ 3 · ससून अस्पताल त्वरित जांच आदेश",
      box3Title: "ससून कैजुअल्टी — आपातकालीन जांच",
      hospitalOrders: [
        "अस्पताल पहुंचते ही 10 मिनट के भीतर 12-लीड ईसीजी (ECG)",
        "तत्काल कार्डियक एंजाइम (Troponin I) एवं रक्त गैस जांच",
        "आईवी लाइन (18G) और हाई-फ्लो ऑक्सीजन तुरंत शुरू करना"
      ],
      box4Tag: "स्तंभ 4 · सरकारी कल्याणकारी सुरक्षा",
      box4Title: "आपातकालीन निःशुल्क स्वास्थ्य सुरक्षा",
      govtSchemes: [
        "आयुष्मान भारत PM-JAY: आईसीयू व क्रिटिकल केयर हेतु ₹5 लाख तक कैशलेस उपचार",
        "महाराष्ट्र आपातकालीन चिकित्सा सेवा (MEMS 108): 100% मुफ्त एम्बुलेंस परिवहन",
        "राष्ट्रीय स्वास्थ्य मिशन (NHM) आपातकालीन स्वास्थ्य गारंटी"
      ]
    }
  },
  child: {
    en: {
      box1Tag: "Pillar 1 · Clinical Differential",
      box1Title: "Pediatric Differential & Warning Signs",
      diagnosis: "Acute Lower Respiratory Infection (Pneumonia) with Dehydration Risk",
      reasoning: "Tachypnea and chest indrawing in early childhood indicate compromised ventilation requiring pediatric nebulization and antibiotic coverage.",
      dangerTitle: "En-Route Red Flags (Emergency Diversion):",
      dangerFlags: [
        "Chest wall indrawing (subcostal retractions) or audible stridor at rest",
        "Inability to drink, suckle, or breastfeed; persistent vomiting",
        "Lethargy, drowsiness, or high fever with convulsions"
      ],
      box2Tag: "Pillar 2 · ASHA Ground Directives",
      box2Title: "Thermal Protection & Airway Support",
      ashaProtocol: [
        "Provide Kangaroo Mother Care (KMC) or wrap in clean dry warm cloth to prevent hypothermia en-route",
        "Offer small frequent sips of low-osmolarity ORS if child is conscious and able to swallow",
        "Keep airway clear; position child upright in mother's arms during 102/108 ambulance transit"
      ],
      box3Tag: "Pillar 3 · Receiving Hospital Orders",
      box3Title: "Pune Sassoon Hospital — Pediatric Acute Bay",
      hospitalOrders: [
        "Stat Pediatric Triage & continuous SpO2 pulse oximetry monitoring",
        "Stat Pediatric Chest Radiograph (X-Ray Chest AP view)",
        "Stat Micro-ESR, complete hemogram, and Weight-for-Height Z-score assessment"
      ],
      box4Tag: "Pillar 4 · Financial Protection Shield",
      box4Title: "Child Health Welfare Entitlements",
      govtSchemes: [
        "Rashtriya Bal Swasthya Karyakram (RBSK): 100% free early intervention and tertiary child care",
        "Janani Shishu Suraksha Karyakram (JSSK): Zero expenditure for infant inpatient care up to 1 year",
        "Poshan Abhiyaan Nutritional Support registry"
      ]
    },
    mr: {
      box1Tag: "स्तंभ १ · बाल आरोग्य निदान व धोके",
      box1Title: "बालरोग निदान व तात्काळ धोक्याचे इशारे",
      diagnosis: "तीव्र श्वसनमार्ग संसर्ग (न्यूमोनिया) व डिहायड्रेशनचा धोका",
      reasoning: "बाळाच्या छातीचे ठोके जलद चालणे आणि बरगड्या ओढल्या जाणे हे श्वसन संसर्गाचे लक्षण असून बालरोगतज्ज्ञांकडून नेब्युलायझेशन व उपचारांची गरज आहे.",
      dangerTitle: "प्रवासातील धोक्याचे इशारे (तातडीने लक्ष द्या):",
      dangerFlags: [
        "बाळाची छाती आत ओढली जाणे किंवा श्वासाचा घरघर आवाज येणे",
        "स्तनपान किंवा पाणी पिण्यास असमर्थ असणे; सतत उलट्या होणे",
        "बाळ ग्लानीत असणे, प्रतिसाद न देणे किंवा तापाची झटके येणे"
      ],
      box2Tag: "स्तंभ २ · आशा कार्यकर्त्यांचे कृती मार्गदर्शन",
      box2Title: "उबदार काळजी व १०८ प्रवासातील सुरक्षितता",
      ashaProtocol: [
        "बाळाला स्वच्छ कोरड्या कपड्यात गुंडाळून आईच्या छातीशी उबदार ठेवा (KMC कंगारू केअर)",
        "बाळ शुद्धीवर असल्यास थोडे थोडे ओआरएस (ORS) पाणी पाजा",
        "रुग्णवाहिका प्रवासात बाळाला आईच्या कुशीत सरळ/उभे धरून ठेवा"
      ],
      box3Tag: "स्तंभ ३ · ससून सर्वोपचार रुग्णालय आदेश",
      box3Title: "ससून बालरोग विभाग — तात्काळ तपासण्या",
      hospitalOrders: [
        "बालरोग वॉर्डमध्ये तात्काळ ऑक्सिजन (SpO2) मॉनिटरिंग",
        "तातडीचा छातीचा एक्स-रे (Pediatric Chest X-Ray)",
        "सीबीसी (CBC) रक्त तपासणी व बाल पोषण श्रेणी मोजमाप"
      ],
      box4Tag: "स्तंभ ४ · १००% मोफत बाल आरोग्य योजना",
      box4Title: "शासकीय बाल संरक्षण योजना",
      govtSchemes: [
        "राष्ट्रीय बाल स्वास्थ्य कार्यक्रम (RBSK): बालकांसाठी १००% मोफत उपचार व शस्त्रक्रिया",
        "जननी शिशु सुरक्षा (JSSK): १ वर्षापर्यंतच्या बालकांसाठी सर्व उपचार, औषधे व चाचण्या पूर्ण मोफत",
        "पोषण अभियान: मोफत पौष्टिक आहार व बाल आरोग्य नोंदणी"
      ]
    },
    hi: {
      box1Tag: "स्तंभ 1 · बाल स्वास्थ्य नैदानिक संदेह",
      box1Title: "बालरोग निदान एवं आपातकालीन खतरे",
      diagnosis: "तीव्र श्वसन संक्रमण (निमोनिया) एवं निर्जलीकरण (Dehydration) का जोखिम",
      reasoning: "बच्चे की तेज सांसें और पसलियों का चलना श्वसन तंत्र के संक्रमण को दर्शाता है, जिसके लिए तत्काल नेबुलाइजेशन और बाल रोग विशेषज्ञ की जरूरत है।",
      dangerTitle: "रास्ते में खतरे के लक्षण (तुरंत ध्यान दें):",
      dangerFlags: [
        "बच्चे की पसलियां अंदर धंसना या सांस में घरघराहट होना",
        "स्तनपान या पानी पीने में असमर्थ होना; लगातार उल्टी होना",
        "अत्यधिक सुस्ती, बेहोशी या तेज बुखार में झटके आना"
      ],
      box2Tag: "स्तंभ 2 · आशा कार्यकर्ता हेतु मैदानी निर्देश",
      box2Title: "गर्मी बनाए रखना एवं 108 परिवहन देखभाल",
      ashaProtocol: [
        "बच्चे को साफ सूखे कपड़े में लपेटकर माँ के सीने से सटाकर रखें (कंगारू केयर)",
        "यदि बच्चा होश में है तो चम्मच से थोड़ा-थोड़ा ओआरएस (ORS) घोल पिलाएं",
        "108 एम्बुलेंस में यात्रा के दौरान बच्चे का सिर थोड़ा ऊंचा रखें"
      ],
      box3Tag: "स्तंभ 3 · ससून अस्पताल त्वरित जांच आदेश",
      box3Title: "ससून बालरोग विभाग — त्वरित जांच आदेश",
      hospitalOrders: [
        "तत्काल पीडियाट्रिक ऑक्सीजन (SpO2) मॉनिटरिंग",
        "सीने का एक्स-रे (Pediatric Chest X-Ray AP View)",
        "सीबीसी (CBC) रक्त जांच एवं पोषण स्तर का आकलन"
      ],
      box4Tag: "स्तंभ 4 · बाल स्वास्थ्य निःशुल्क सुरक्षा",
      box4Title: "सरकारी बाल स्वास्थ्य सुरक्षा योजनाएं",
      govtSchemes: [
        "राष्ट्रीय बाल स्वास्थ्य कार्यक्रम (RBSK): बच्चों के लिए 100% मुफ्त संपूर्ण उपचार",
        "जननी शिशु सुरक्षा कार्यक्रम (JSSK): 1 वर्ष तक के शिशुओं का संपूर्ण इलाज, दवाएं व भोजन मुफ्त",
        "पोषण अभियान डिजिटल रजिस्ट्री"
      ]
    }
  },
  general: {
    en: {
      box1Tag: "Pillar 1 · Clinical Differential",
      box1Title: "General Clinical Evaluation & Risks",
      diagnosis: "Subacute Febrile Illness with Constitutional Symptoms",
      reasoning: "Parameters indicate clinical stability without red-flag hemodynamic compromise. Structured OPD workup recommended for definitive etiology.",
      dangerTitle: "En-Route Red Flags (Emergency Diversion):",
      dangerFlags: [
        "High spiking fever (>103°F) unresponsive to antipyretics",
        "Sudden onset of severe localized abdominal or thoracic pain",
        "Persistent intractable vomiting or signs of clinical dehydration"
      ],
      box2Tag: "Pillar 2 · ASHA Ground Directives",
      box2Title: "Community Health Guidance & OPD Prep",
      ashaProtocol: [
        "Advise bed rest in a well-ventilated room; sponge with lukewarm water if febrile",
        "Ensure adequate oral fluid intake (boiled water, lemon water, light dal water)",
        "Accompany with previous medical prescriptions and ABHA digital health card"
      ],
      box3Tag: "Pillar 3 · Receiving Hospital Orders",
      box3Title: "Pune Sassoon General Hospital — OPD Evaluation",
      hospitalOrders: [
        "Stat CBC with differential count and Erythrocyte Sedimentation Rate (ESR)",
        "Rapid Diagnostic Test (RDT) for Malaria and NS1 Antigen for Dengue",
        "Serum Creatinine & Random Blood Sugar evaluation"
      ],
      box4Tag: "Pillar 4 · Financial Protection Shield",
      box4Title: "National Health Mission Entitlements",
      govtSchemes: [
        "Ayushman Bharat ABHA: Verified digital health pass auto-linked for paperless OPD registration",
        "National Health Mission (NHM): Free generic essential medicines and diagnostic tests at Sassoon"
      ]
    },
    mr: {
      box1Tag: "स्तंभ १ · सर्वसाधारण वैद्यकीय निदान",
      box1Title: "तपासणी निष्कर्ष व संभाव्य धोके",
      diagnosis: "ताप व अंगदुखीसह प्राथमिक आजार (तपासणी आवश्यक)",
      reasoning: "रुग्णाची प्राथमिक स्थिती नियंत्रणात आहे, मात्र निश्चित निदानासाठी ससून रुग्णालयात तज्ज्ञ डॉक्टरांकडून रक्त तपासणी व औषधोपचार आवश्यक आहेत.",
      dangerTitle: "प्रवासातील धोक्याचे इशारे:",
      dangerFlags: [
        "ताप १०३°F पेक्षा जास्त वाढणे व औषधाने न उतरणे",
        "पोटात किंवा छातीत अचानक तीव्र असह्य वेदना सुरू होणे",
        "सतत उलट्या होणे किंवा पाणी पिणेही अशक्य होणे"
      ],
      box2Tag: "स्तंभ २ · आशा कार्यकर्त्यांचे मार्गदर्शन",
      box2Title: "घरगुती काळजी व ओपीडी नोंदणी तयारी",
      ashaProtocol: [
        "रुग्णाला हवेशीर खोलीत विश्रांती द्या; ताप आल्यास कोमट पाण्याच्या पट्ट्या कपाळावर ठेवा",
        "उकळलेले पाणी, लिंबू पाणी किंवा ताक पिण्यास द्यावे",
        "रुग्णाचे जुने वैद्यकीय कागदपत्रे व आभा (ABHA) कार्ड सोबत द्या"
      ],
      box3Tag: "स्तंभ ३ · ससून सर्वोपचार रुग्णालय आदेश",
      box3Title: "ससून ओपीडी विभाग — आवश्यक तपासण्या",
      hospitalOrders: [
        "सीबीसी (CBC) रक्त तपासणी व ईएसआर (ESR)",
        "मलेरिया (Malaria RDT) व डेंग्यू (Dengue NS1) तात्काळ चाचणी",
        "रक्त शर्करा (Blood Sugar) व डॉक्टरांचा सल्ला"
      ],
      box4Tag: "स्तंभ ४ · १००% मोफत शासकीय लाभ",
      box4Title: "शासकीय आरोग्य योजना व मोफत औषधे",
      govtSchemes: [
        "आयुष्यमान भारत आभा (ABHA): पेपरलेस ओपीडी नोंदणीसाठी डिजिटल हेल्थ पास सक्रिय",
        "राष्ट्रीय आरोग्य अभियान (NHM): ससून रुग्णालयात मोफत जेनेरिक औषधे व प्रयोगशाळा चाचण्या"
      ]
    },
    hi: {
      box1Tag: "स्तंभ 1 · सामान्य नैदानिक मूल्यांकन",
      box1Title: "जांच निष्कर्ष एवं संभावित खतरे",
      diagnosis: "बुखार एवं सामान्य कमजोरी (जांच एवं उपचार आवश्यक)",
      reasoning: "मरीज की स्थिति स्थिर है, लेकिन सही कारण जानने के लिए ससून अस्पताल में ओपीडी विशेषज्ञ परामर्श एवं रक्त जांच आवश्यक है।",
      dangerTitle: "रास्ते में खतरे के संकेत:",
      dangerFlags: [
        "तेज बुखार (103°F से अधिक) जो दवा से न उतरे",
        "पेट या सीने में अचानक तेज दर्द शुरू होना",
        "लगातार उल्टी होना या शरीर में पानी की गंभीर कमी"
      ],
      box2Tag: "स्तंभ 2 · आशा कार्यकर्ता हेतु मैदानी निर्देश",
      box2Title: "घरेलू देखभाल एवं ओपीडी पंजीकरण तैयारी",
      ashaProtocol: [
        "मरीज को हवादार कमरे में आराम कराएं; बुखार में गुनगुने पानी की पट्टी रखें",
        "उबला हुआ पानी, नींबू पानी या तरल पेय पर्याप्त मात्रा में दें",
        "पुराने इलाज के पर्चे और आभा (ABHA) डिजिटल कार्ड साथ रखें"
      ],
      box3Tag: "स्तंभ 3 · ससून अस्पताल जांच आदेश",
      box3Title: "ससून जनरल अस्पताल — आवश्यक ओपीडी जांच",
      hospitalOrders: [
        "सीबीसी (CBC) पूर्ण रक्त जांच एवं ईएसआर (ESR)",
        "मलेरिया (RDT) एवं डेंगू (NS1) त्वरित जांच",
        "ब्लड शुगर और विशेषज्ञ डॉक्टर परामर्श"
      ],
      box4Tag: "स्तंभ 4 · सरकारी स्वास्थ्य योजनाएं",
      box4Title: "राष्ट्रीय स्वास्थ्य मिशन निःशुल्क लाभ",
      govtSchemes: [
        "आयुष्मान भारत आभा (ABHA): डिजिटल हेल्थ पास द्वारा बिना पर्ची तुरंत ओपीडी रजिस्ट्रेशन",
        "राष्ट्रीय स्वास्थ्य मिशन (NHM): ससून अस्पताल में 100% मुफ्त दवाइयां एवं जांच"
      ]
    }
  }
};

function getCategoryKey(patientType, patient) {
  if (patientType === 'pregnant' || patient?.is_pregnant) return 'maternal';
  if (patientType === 'emergency') return 'emergency';
  if (patientType === 'child' || patient?.is_child) return 'child';
  return 'general';
}

export default function TriageForm({ onSubmit, onCancel, demoMode = false }) {
  const lang = localStorage.getItem("radvault_asha_lang") || "en";
  const t = TRIAGE_TRANSLATIONS[lang] || TRIAGE_TRANSLATIONS.en;

  // Step machine: -1=select patient, 0=patient type, 1=assessment, 2=triage review, 3=routing
  const [step, setStep] = useState(-1);
  const [patient, setPatient] = useState(null);
  const [patientType, setPatientType] = useState(null);
  const [intakeAnswers, setIntakeAnswers] = useState(null);

  // AI & Triage State
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRoadmap, setAiRoadmap] = useState(null);
  const [roadmapLang, setRoadmapLang] = useState(lang === 'mr' ? 'mr' : lang === 'hi' ? 'hi' : 'en');
  const [loadingStep, setLoadingStep] = useState(0);

  const KIMI_TELEMETRY_STEPS = [
    { title: "Kimi-K3 Deep Clinical Reasoning", desc: "Correlating frontline vitals, reported symptoms & maternal risk profiles..." },
    { title: "Pathophysiology & Risk Synthesis", desc: "Evaluating hemodynamic stability, anemia decompensation & fetal hypoxia..." },
    { title: "Hospital Protocol Mapping", desc: "Formulating Pune Sassoon General Hospital fast-track stat lab & intake orders..." },
    { title: "Welfare Entitlement Audit", desc: "Verifying JSY (₹1,400+₹600), JSSK cashless care, and ABHA PM-JAY coverage..." },
  ];

  useEffect(() => {
    let interval;
    if (aiLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 4);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [aiLoading]);

  // Routing State — dynamically populated from CONNECTED_FACILITIES & Supabase
  const hasUserSelectedRef = useRef(false);
  const [hospital, setHospital] = useState(CONNECTED_FACILITIES[0].name);
  const [selectedFacility, setSelectedFacility] = useState(CONNECTED_FACILITIES[0]);
  const [facilitiesList, setFacilitiesList] = useState(CONNECTED_FACILITIES);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [isJsyClaim, setIsJsyClaim] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [routeError, setRouteError] = useState('');

  // Hospital State & Live Geolocation
  const [hospSearch, setHospSearch] = useState('');
  const [showMoreFacilities, setShowMoreFacilities] = useState(false);
  const [nearbyGovHospitals, setNearbyGovHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  // Real-Time Government Hospital Fetching & Live Geolocation
  const loadNearbyHospitals = async () => {
    try {
      setLoadingHospitals(true);
      const coords = await getCurrentLocation();
      setUserCoords(coords);
      const hospitals = await fetchGovHospitals(coords.lat, coords.lon);
      if (hospitals && hospitals.length > 0) {
        setNearbyGovHospitals(hospitals);
      }
    } catch (err) {
      console.warn("Could not fetch nearby government hospitals:", err);
    } finally {
      setLoadingHospitals(false);
    }
  };

  useEffect(() => {
    loadNearbyHospitals();
  }, []);

  // Load real facilities from Supabase and merge with coordinates
  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('id, name, district')
          .order('name');
        if (!error && data && data.length > 0 && isMounted) {
          const merged = data.map(dbFac => {
            const matched = CONNECTED_FACILITIES.find(
              cf => cf.id === dbFac.id || cf.name.toLowerCase() === dbFac.name.toLowerCase()
            );
            return {
              id: dbFac.id,
              name: dbFac.name,
              district: dbFac.district,
              lat: matched?.lat ?? (dbFac.name.toLowerCase().includes('shrirampur') ? 19.6174 : 18.5284),
              lon: matched?.lon ?? (dbFac.name.toLowerCase().includes('shrirampur') ? 74.6595 : 73.8746),
              type: matched?.type ?? 'PHC',
              typeLabel: matched?.typeLabel ?? (dbFac.district ? `${dbFac.district} District Facility` : 'Registered Govt Facility'),
              isIntegrated: true,
              isGovernment: true
            };
          });
          setFacilitiesList(merged);
          // Auto-select Pune Sassoon General Hospital if user hasn't explicitly chosen one
          if (!hasUserSelectedRef.current && merged.length > 0) {
            const sassoon = merged.find(f => f.id === 'f2222222-2222-2222-2222-222222222222' || f.name.toLowerCase().includes('sassoon'));
            const defaultFac = sassoon || merged[0];
            setSelectedFacility(defaultFac);
            setHospital(defaultFac.name);
          }
        }
      } catch (e) {
        console.warn('[TriageForm] Error loading facilities:', e);
      }
    }
    loadFacilities();
    return () => { isMounted = false; };
  }, [userCoords]);

  // Compute facilities sorted by proximity (connected first, expandable regional health centres)
  const baseFacilities = useMemo(() => {
    const userLat = userCoords?.lat ?? 18.5284;
    const userLon = userCoords?.lon ?? 73.8746;

    const list = facilitiesList.length > 0 ? facilitiesList : CONNECTED_FACILITIES;
    const connected = list.map(f => {
      const d = calculateHaversineDistance(userLat, userLon, f.lat, f.lon) ?? 0;
      return {
        id: f.id,
        name: f.name,
        type: f.type || 'PHC',
        dist: String(d),
        rawDist: d,
        typeLabel: f.district ? `${f.district} District · ${f.typeLabel || 'Facility'}` : (f.typeLabel || 'Government Facility'),
        isIntegrated: true
      };
    }).sort((a, b) => {
      // Prioritize Pune Sassoon General Hospital as the primary integrated apex center
      if (a.id === 'f2222222-2222-2222-2222-222222222222' || a.name.toLowerCase().includes('sassoon')) return -1;
      if (b.id === 'f2222222-2222-2222-2222-222222222222' || b.name.toLowerCase().includes('sassoon')) return 1;
      return a.rawDist - b.rawDist;
    });

    if (!showMoreFacilities && !hospSearch) {
      return connected;
    }

    const existingNames = new Set(connected.map(c => c.name.toLowerCase()));
    const extra = (nearbyGovHospitals || [])
      .filter(h => !existingNames.has(h.name.toLowerCase()))
      .map(h => ({
        ...h,
        isIntegrated: false
      }));

    return [...connected, ...extra].sort((a, b) => {
      if (a.id === 'f2222222-2222-2222-2222-222222222222') return -1;
      if (b.id === 'f2222222-2222-2222-2222-222222222222') return 1;
      return (a.rawDist || 0) - (b.rawDist || 0);
    });
  }, [facilitiesList, userCoords, showMoreFacilities, hospSearch, nearbyGovHospitals]);

  // Auto-sync default selected facility to Pune Sassoon General Hospital when baseFacilities updates
  useEffect(() => {
    if (!hasUserSelectedRef.current && baseFacilities && baseFacilities.length > 0) {
      const sassoon = baseFacilities.find(f => f.id === 'f2222222-2222-2222-2222-222222222222' || f.name.toLowerCase().includes('sassoon'));
      const nearest = sassoon || baseFacilities[0];
      if (nearest && nearest.name !== hospital) {
        setHospital(nearest.name);
        const matched = facilitiesList.find(f => f.id === nearest.id || f.name.toLowerCase() === nearest.name.toLowerCase()) || nearest;
        setSelectedFacility(matched);
      }
    }
  }, [baseFacilities, facilitiesList, hospital]);

  // ── Real Audio Recording State ──
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState(null);
  const [voiceNotes, setVoiceNotes] = useState('');
  const [audioLang, setAudioLang] = useState(lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const initialVoiceNotesRef = useRef('');
  const recognitionRef = useRef(null);

  // Clean up audio streams on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // ── Audio Recording Handler ──
  const startRecording = async () => {
    try {
      initialVoiceNotesRef.current = voiceNotes || '';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlobUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = audioLang;

        recognition.onresult = (event) => {
          let fullSpeech = "";
          for (let i = 0; i < event.results.length; i++) {
            fullSpeech += event.results[i][0].transcript + " ";
          }
          const cleanedSpeech = fullSpeech.replace(/\s+/g, ' ').trim();
          if (cleanedSpeech) {
            const base = initialVoiceNotesRef.current ? initialVoiceNotesRef.current.trim() : "";
            setVoiceNotes(base ? `${base} ${cleanedSpeech}` : cleanedSpeech);
          }
        };
        recognition.start();
      }
    } catch (err) {
      console.error("Mic access denied:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) recognitionRef.current.stop();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);

    if (!voiceNotes.trim()) {
      setVoiceNotes(
        lang === 'mr'
          ? "रुग्णास गंभीर लक्षणे दिसत आहेत. तातडीने पुढील तपासणीसाठी रेफर केले आहे."
          : lang === 'hi'
          ? "मरीज में गंभीर लक्षण दिखाई दे रहे हैं। तुरंत जांच हेतु रेफर किया गया है।"
          : "Patient displaying acute clinical symptoms. Referred for immediate medical evaluation."
      );
    }
  };

  const handlePatientSelected = (selectedPatient) => {
    setPatient(selectedPatient);
    // Strict age and biological checks
    if (selectedPatient.gender === 'Female' && selectedPatient.is_pregnant && (!selectedPatient.age_years || selectedPatient.age_years >= 12)) {
      setPatientType('pregnant');
      setStep(1);
    } else if (selectedPatient.age_years !== undefined && selectedPatient.age_years !== null && selectedPatient.age_years <= 5) {
      setPatientType('child');
      setStep(1);
    } else {
      // Show age and gender filtered category screen
      setStep(0);
    }
  };

  const handleIntakeSubmit = (answers) => {
    setIntakeAnswers(answers);
    if (answers?.voiceNotes) setVoiceNotes(answers.voiceNotes);
    if (answers?.audioBlobUrl) setAudioBlobUrl(answers.audioBlobUrl);
    const triage = localTriage(patientType, answers);
    setAiResult(triage);
    setDepartment(triage.department || DEPARTMENTS[0]);
    setAiRoadmap(null); // Reset roadmap for new intake
    setStep(2);
  };

  const handleGenerateAiRoadmap = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    try {
      const roadmap = await generateKimiClinicalRoadmap({
        patient,
        patientType,
        answers: intakeAnswers,
        voiceNotes,
        lang
      });
      if (roadmap) {
        setAiRoadmap(roadmap);
        setAiResult(prev => ({
          ...prev,
          priority: roadmap.priority || prev?.priority,
          note: roadmap.note || prev?.note,
          department: roadmap.department || prev?.department,
          clinicalSummary: roadmap.hospitalRoadmap,
          keyRisks: roadmap.keyRisks,
          firstAidSteps: roadmap.firstAidSteps,
          aiModel: roadmap.model
        }));
        if (roadmap.department) {
          const matchedDept = DEPARTMENTS.find(d => d.toLowerCase() === roadmap.department.toLowerCase());
          if (matchedDept) {
            setDepartment(matchedDept);
          }
        }
      }
    } catch (err) {
      console.warn('[TriageForm] AI Roadmap generation error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmittingRef.current || isSubmitting) {
      console.warn('[TriageForm] Submission already in flight. Ignoring duplicate trigger.');
      return;
    }
    if (!hospital) { setRouteError(t.errSelectHosp); return; }
    if (!department) { setRouteError(t.errSelectDept); return; }
    setRouteError('');
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const isUrgent = aiResult?.priority === 'RED' || aiResult?.priority === 'ORANGE';
      const finalPriority = isUrgent ? 'URGENT' : 'ROUTINE';

      let ashaNotes = voiceNotes.trim() || aiResult?.note || 'ASHA referral initiated';
      if (isJsyClaim) ashaNotes += " [ASHA Accompanying Patient - JSY Escort]";

      // Ensure valid patient_id (strictly required in Demo OFF mode)
      const patientId = patient?.id || (demoMode ? 'b6f81101-46d0-4b4d-8df0-9d9ce11a6a70' : null);
      const patientName = patient?.name || (demoMode ? 'Rekha Bai' : null);

      const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

      if (!patientId || !patientName) {
        setRouteError("Please select a registered patient before dispatching referral.");
        return;
      }

      if (!isUuid(patientId)) {
        setRouteError("Selected patient identifier is not a valid clinical UUID.");
        return;
      }

      const resolvedAbha = (patient?.abha_id && patient.abha_id !== 'PENDING' && patient.abha_id !== 'Not linked yet')
        ? patient.abha_id
        : (patientId ? localStorage.getItem(`radvault_abha_${patientId}`) : null);

      const patientVitals = {
        bp: intakeAnswers?.bp || patient?.vitals?.bp || patient?.bp || '',
        pulse: intakeAnswers?.pulse || patient?.vitals?.pulse || patient?.pulse || '',
        spo2: intakeAnswers?.spo2 || patient?.vitals?.spo2 || patient?.spo2 || '',
        temp: intakeAnswers?.temp || patient?.vitals?.temp || patient?.temp || '',
        weight: intakeAnswers?.weight || patient?.vitals?.weight || patient?.weight || '',
        height: intakeAnswers?.height || patient?.vitals?.height || patient?.height || '',
        blood_sugar: intakeAnswers?.blood_sugar || patient?.vitals?.blood_sugar || patient?.blood_sugar || '',
        abha_number: resolvedAbha || '',
        abha_id: resolvedAbha || ''
      };

      let destinationFacilityId = (selectedFacility?.id && isUuid(selectedFacility.id))
        ? selectedFacility.id
        : (facilitiesList.find(f => f.name.toLowerCase() === hospital.toLowerCase())?.id);

      if (!destinationFacilityId || !isUuid(destinationFacilityId)) {
        const matchedConnected = CONNECTED_FACILITIES.find(
          f => f.name.toLowerCase() === hospital.toLowerCase() || f.id === selectedFacility?.id
        );
        if (matchedConnected && isUuid(matchedConnected.id)) {
          destinationFacilityId = matchedConnected.id;
        } else {
          // Default to first connected facility (Pune Sassoon General Hospital)
          destinationFacilityId = CONNECTED_FACILITIES[0].id;
        }
      }

      const chosenHospital = selectedFacility?.name || hospital || CONNECTED_FACILITIES[0].name;

      // Zero Demographic Fabrication: preserve actual values, never default to 30, 'Other', or fake phone
      const resolvedAge = (patient?.age_years !== undefined && patient?.age_years !== null)
        ? Number(patient.age_years)
        : ((patient?.age !== undefined && patient?.age !== null) ? Number(patient.age) : null);
      const resolvedGender = patient?.gender || null;
      const resolvedPhone = patient?.mobile || patient?.phone || null;

      let referralAiNote = aiRoadmap?.note || aiResult?.note || ashaNotes;
      if (isJsyClaim && !referralAiNote.includes('ASHA Accompanying')) {
        referralAiNote += " [ASHA Accompanying Patient - JSY Escort]";
      }
      if (aiRoadmap?.hospitalRoadmap && !referralAiNote.includes(aiRoadmap.hospitalRoadmap)) {
        referralAiNote += ` | FAST-TRACK ORDERS: ${aiRoadmap.hospitalRoadmap}`;
      }

      const payload = {
        patient_id: patientId,
        patient_name: patientName,
        age: resolvedAge,
        gender: resolvedGender,
        blood_group: patient?.blood_group || null,
        phone: resolvedPhone,
        abha_id: resolvedAbha || null,
        created_by: 'ASHA Worker (Priya Deshmukh)',
        destination_hospital: chosenHospital,
        destination_facility_id: destinationFacilityId,
        department: department || 'General Medicine',
        priority: finalPriority,
        reason: ashaNotes,
        asha_notes: ashaNotes,
        clinical_summary: aiRoadmap?.hospitalRoadmap || aiResult?.clinicalSummary || aiResult?.note || ashaNotes,
        ai_note: referralAiNote,
        vitals: patientVitals
      };

      const { data, error } = await createPhysicalReferral(payload);

      if (error || !data?.id) {
        console.error('[TriageForm] Referral dispatch error:', error);
        setRouteError(error?.message || 'Failed to dispatch referral to hospital database.');
        return;
      }

      console.log('[TriageForm] Verified Referral created with ID:', data.id);

      // Persist completed task status in localStorage
      try {
        const saved = localStorage.getItem("radvault_completed_tasks");
        const taskSet = saved ? new Set(JSON.parse(saved)) : new Set();
        taskSet.add(patientId);
        taskSet.add(`task-${patientId}`);
        localStorage.setItem("radvault_completed_tasks", JSON.stringify(Array.from(taskSet)));
      } catch (e) {
        console.error(e);
      }

      if (onSubmit) {
        onSubmit(data);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FBF9] flex flex-col font-sans text-slate-800 pb-24">
      
      {/* Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-[#16324F]">{t.title}</h1>
            <p className="text-xs font-bold text-teal-700">{patient ? patient.name : t.subtitle}</p>
          </div>
        </div>

        <span className="text-xs font-extrabold bg-[#E8F7F3] text-[#008F83] px-3 py-1 rounded-full border border-[#008F83]/20">
          {step === -1 ? '1/4' : step === 0 ? '2/4' : step === 1 ? '3/4' : '4/4'}
        </span>
      </header>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 w-full space-y-5">
        
        {/* STEP -1: Select Patient */}
        {step === -1 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
            <PatientSelectScreen onSelectPatient={handlePatientSelected} demoMode={demoMode} />
          </div>
        )}

        {/* STEP 0: Select Patient Type */}
        {step === 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
            <PatientTypeScreen
              patient={patient}
              onSelectType={(type) => { setPatientType(type); setStep(1); }}
            />
          </div>
        )}

        {/* STEP 1: Clinical Intake Assessment Screen (Voice Scribe Integrated Internally) */}
        {step === 1 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-xs">
            {patientType === 'pregnant' && (
              <PregnantScreen
                onComplete={handleIntakeSubmit}
                initialVoiceNotes={voiceNotes}
                initialAudioBlobUrl={audioBlobUrl}
              />
            )}
            {patientType === 'child' && (
              <ChildScreen
                onComplete={handleIntakeSubmit}
                initialVoiceNotes={voiceNotes}
                initialAudioBlobUrl={audioBlobUrl}
              />
            )}
            {patientType === 'elderly' && (
              <ElderlyScreen
                onComplete={handleIntakeSubmit}
                initialVoiceNotes={voiceNotes}
                initialAudioBlobUrl={audioBlobUrl}
              />
            )}
            {patientType === 'adult' && (
              <AdultScreen
                onComplete={handleIntakeSubmit}
                initialVoiceNotes={voiceNotes}
                initialAudioBlobUrl={audioBlobUrl}
              />
            )}
            {patientType === 'emergency' && (
              <EmergencyScreen
                onComplete={handleIntakeSubmit}
                initialVoiceNotes={voiceNotes}
                initialAudioBlobUrl={audioBlobUrl}
              />
            )}
          </div>
        )}

        {/* STEP 2: Triage Review Screen & On-Demand Kimi AI Clinical Roadmap */}
        {step === 2 && (
          <div className="space-y-4">
            {/* 1. On-Demand Kimi AI Care Roadmap Card (Token-Saver Teaser) */}
            {!aiRoadmap && !aiLoading && (
              <div className="bg-gradient-to-br from-teal-50/80 via-white to-indigo-50/80 border-2 border-teal-200/90 rounded-3xl p-6 shadow-sm text-left space-y-4 text-slate-900">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-[#008F83] border border-teal-200 flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles className="w-6 h-6 text-[#008F83]" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider">
                        AI Clinical Protocol & Care Roadmap
                      </h4>
                      <span className="text-[10px] font-extrabold bg-[#008F83] text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                        ⚡ Powered by Moonshot Kimi-K3
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border shadow-2xs inline-flex items-center gap-1.5 ${
                        aiResult?.priority === 'RED' ? 'bg-red-50 text-red-800 border-red-300' :
                        aiResult?.priority === 'ORANGE' ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          aiResult?.priority === 'RED' ? 'bg-red-600' : aiResult?.priority === 'ORANGE' ? 'bg-amber-500' : 'bg-[#008F83]'
                        }`} />
                        <span>{aiResult?.priority === 'RED' ? t.priorityRed : aiResult?.priority === 'ORANGE' ? t.priorityOrange : t.priorityGreen}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Patient: <strong className="text-slate-900">{patient?.name || 'Rekha Bai'}</strong> ({patientType}) • Destination: <strong className="text-teal-800">{hospital || 'Pune Sassoon General Hospital'}</strong>
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Deploy Kimi-K3 deep clinical reasoning to synthesize vitals, verify diagnostic differentials, prescribe frontline ASHA transit stabilization, and generate fast-track stat orders for Pune Sassoon Hospital.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-2.5">
                    <span className="text-[10px] font-black uppercase text-rose-700 block">Pillar 1</span>
                    <span className="text-[11px] font-bold text-rose-950">Clinical Differential</span>
                  </div>
                  <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-2.5">
                    <span className="text-[10px] font-black uppercase text-teal-700 block">Pillar 2</span>
                    <span className="text-[11px] font-bold text-teal-950">ASHA Ground Protocol</span>
                  </div>
                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-2.5">
                    <span className="text-[10px] font-black uppercase text-indigo-700 block">Pillar 3</span>
                    <span className="text-[11px] font-bold text-indigo-950">Sassoon Stat Orders</span>
                  </div>
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5">
                    <span className="text-[10px] font-black uppercase text-amber-700 block">Pillar 4</span>
                    <span className="text-[11px] font-bold text-amber-950">Govt Schemes (JSY)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiRoadmap}
                  className="w-full py-4 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-xs sm:text-sm rounded-2xl shadow-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Generate Full AI Clinical Roadmap & Fast-Track Orders</span>
                </button>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-1">
                  <span>⚡ On-demand execution · Zero tokens consumed until triggered</span>
                  <span>Available in English, मराठी, हिंदी</span>
                </div>
              </div>
            )}

            {/* AI Loading State with Live Telemetry Stepper */}
            {aiLoading && (
              <div className="bg-white border-2 border-dashed border-teal-300 rounded-3xl p-8 text-center space-y-4 shadow-sm text-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-[#008F83] flex items-center justify-center mx-auto shadow-inner">
                  <Loader2 className="w-8 h-8 text-[#008F83] animate-spin" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#008F83] animate-ping" />
                    <span>Moonshot Kimi-K3 Deep Reasoning Active</span>
                  </div>
                  <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider mt-2">
                    {KIMI_TELEMETRY_STEPS[loadingStep]?.title || "Consulting Kimi AI Clinical Engine..."}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                    {KIMI_TELEMETRY_STEPS[loadingStep]?.desc || "Synthesizing patient vitals, reported symptoms, and frontline observations into an action roadmap..."}
                  </p>
                </div>

                {/* Progress bar dots */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  {[0, 1, 2, 3].map((stepIdx) => (
                    <div
                      key={stepIdx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        loadingStep === stepIdx ? 'w-8 bg-[#008F83]' : 'w-2 bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tactical AI Clinical Command Deck — Clean Light 4-Box Executive UI */}
            {aiRoadmap && (() => {
              const catKey = getCategoryKey(patientType, patient);
              const langBundle = CLINICAL_TRANSLATIONS[catKey]?.[roadmapLang] || CLINICAL_TRANSLATIONS[catKey]?.en;
              const diag = (roadmapLang === 'en' && aiRoadmap?.clinicalDiagnosis) ? aiRoadmap.clinicalDiagnosis : langBundle.diagnosis;
              const reason = (roadmapLang === 'en' && aiRoadmap?.clinicalReasoning) ? aiRoadmap.clinicalReasoning : langBundle.reasoning;
              const dangerFlags = (roadmapLang === 'en' && aiRoadmap?.dangerFlags?.length) ? aiRoadmap.dangerFlags : langBundle.dangerFlags;
              const ashaProtocol = (roadmapLang === 'en' && aiRoadmap?.ashaGroundProtocol?.length) ? aiRoadmap.ashaGroundProtocol : langBundle.ashaProtocol;
              const hospitalOrders = (roadmapLang === 'en' && aiRoadmap?.hospitalStatOrders?.length) ? aiRoadmap.hospitalStatOrders : langBundle.hospitalOrders;
              const govtSchemes = (roadmapLang === 'en' && aiRoadmap?.govtSchemes?.length) ? aiRoadmap.govtSchemes : langBundle.govtSchemes;

              return (
                <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-5 sm:p-6 text-left space-y-5 shadow-sm animate-in fade-in duration-300 text-slate-900">
                  {/* Clean Header Bar: Patient Context, Model Telemetry & Language Toggle */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#008F83] border border-teal-200 flex items-center justify-center shadow-xs shrink-0">
                        <Sparkles className="w-5 h-5 text-[#008F83]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
                            {roadmapLang === 'mr' ? 'वैद्यकीय कृती आराखडा व प्रोटोकॉल' : roadmapLang === 'hi' ? 'नैदानिक कार्ययोजना एवं प्रोटोकॉल' : 'AI Clinical Care Protocol Deck'}
                          </h4>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-amber-500" />
                            <span>{aiRoadmap.model || 'Moonshot Kimi-K3'}</span>
                          </span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border shadow-2xs inline-flex items-center gap-1.5 ${
                            aiResult?.priority === 'RED' ? 'bg-red-50 text-red-800 border-red-300' :
                            aiResult?.priority === 'ORANGE' ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              aiResult?.priority === 'RED' ? 'bg-red-600' : aiResult?.priority === 'ORANGE' ? 'bg-amber-500' : 'bg-[#008F83]'
                            }`} />
                            <span>{aiResult?.priority === 'RED' ? t.priorityRed : aiResult?.priority === 'ORANGE' ? t.priorityOrange : t.priorityGreen}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Patient: <strong className="text-slate-900">{patient?.name || 'Rekha Bai'}</strong> ({patientType}) • Target: <strong className="text-teal-800">{hospital || 'Pune Sassoon General Hospital'}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Language Switcher & Re-analyze Button */}
                    <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                      {/* Language Segmented Control */}
                      <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setRoadmapLang('en')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            roadmapLang === 'en'
                              ? 'bg-[#008F83] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🇬🇧 English
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoadmapLang('mr')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            roadmapLang === 'mr'
                              ? 'bg-[#008F83] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🇮🇳 मराठी
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoadmapLang('hi')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            roadmapLang === 'hi'
                              ? 'bg-[#008F83] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🇮🇳 हिंदी
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateAiRoadmap}
                        disabled={aiLoading}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${aiLoading ? 'animate-spin' : ''}`} />
                        <span>Re-analyze</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Clean Light Boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Box 1: Rose Light Theme */}
                    <div className="bg-rose-50/70 border-2 border-rose-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                            {langBundle.box1Tag}
                          </span>
                          <h5 className="text-xs sm:text-sm font-black text-rose-950 leading-snug mt-0.5">
                            {diag}
                          </h5>
                        </div>
                      </div>

                      {reason && (
                        <p className="text-xs text-slate-700 leading-relaxed bg-white/90 p-3 rounded-xl border border-rose-200/70 font-medium">
                          {reason}
                        </p>
                      )}

                      {dangerFlags && dangerFlags.length > 0 && (
                        <div className="space-y-1.5 pt-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{langBundle.dangerTitle}</span>
                          </span>
                          <ul className="space-y-1.5 text-xs text-rose-950">
                            {dangerFlags.map((flag, idx) => (
                              <li key={idx} className="flex items-start gap-2 bg-rose-100/50 p-2 rounded-lg border border-rose-200/50 font-semibold">
                                <span className="text-rose-600 font-black">•</span>
                                <span className="leading-snug">{flag}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Box 2: Teal Light Theme */}
                    <div className="bg-teal-50/70 border-2 border-teal-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 border border-teal-200 flex items-center justify-center shrink-0">
                          <HeartPulse className="w-4 h-4 text-[#008F83]" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 block">
                            {langBundle.box2Tag}
                          </span>
                          <h5 className="text-xs sm:text-sm font-black text-teal-950 leading-snug mt-0.5">
                            {langBundle.box2Title}
                          </h5>
                        </div>
                      </div>

                      <ul className="space-y-2 pt-0.5">
                        {ashaProtocol.map((stepItem, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 bg-white/90 p-3 rounded-xl border border-teal-200/70 font-semibold leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-[#008F83] shrink-0 mt-0.5" />
                            <span>{stepItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Box 3: Indigo Light Theme */}
                    <div className="bg-indigo-50/70 border-2 border-indigo-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 block">
                            {langBundle.box3Tag}
                          </span>
                          <h5 className="text-xs sm:text-sm font-black text-indigo-950 leading-snug mt-0.5">
                            {langBundle.box3Title}
                          </h5>
                        </div>
                      </div>

                      <ul className="space-y-2 pt-0.5">
                        {hospitalOrders.map((order, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-indigo-950 bg-white/90 p-3 rounded-xl border border-indigo-200/70 font-semibold leading-relaxed">
                            <Activity className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <span>{order}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Box 4: Amber Light Theme */}
                    <div className="bg-amber-50/70 border-2 border-amber-200/90 rounded-2xl p-4.5 space-y-3 shadow-2xs hover:shadow-xs transition-shadow">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4 text-amber-700" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                            {langBundle.box4Tag}
                          </span>
                          <h5 className="text-xs sm:text-sm font-black text-amber-950 leading-snug mt-0.5">
                            {langBundle.box4Title}
                          </h5>
                        </div>
                      </div>

                      <ul className="space-y-2 pt-0.5">
                        {govtSchemes.map((scheme, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-amber-950 bg-white/90 p-3 rounded-xl border border-amber-200/70 font-semibold leading-relaxed">
                            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>{scheme}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Direct doctor handoff note banner */}
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-3 text-xs text-teal-900 font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#008F83] shrink-0" />
                      <span>
                        {roadmapLang === 'mr'
                          ? 'हा संपूर्ण वैद्यकीय कृती आराखडा ससून रुग्णालयातील डॉक्टरांच्या डिजिटल केसशीटला थेट जोडला जाईल.'
                          : roadmapLang === 'hi'
                          ? 'यह संपूर्ण नैदानिक कार्ययोजना ससून अस्पताल के डॉक्टरों की डिजिटल केसशीट में सीधे संलग्न होगी।'
                          : 'This complete clinical roadmap will be attached directly to the patient\'s digital referral docket for Sassoon Hospital doctors.'}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded bg-[#008F83] text-white shrink-0 shadow-2xs">
                      {roadmapLang === 'mr' ? 'रेफरल तयार' : roadmapLang === 'hi' ? 'तैयार' : 'Ready'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Primary Continue Button */}
            <div className="pt-2">
              <button
                onClick={() => setStep(3)}
                className="w-full py-4 bg-[#008F83] hover:bg-[#007A70] text-white font-black text-sm sm:text-base rounded-2xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue to Hospital Routing →</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Hospital & Department Routing */}
        {step === 3 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#16324F]">{t.routing}</h3>
                <p className="text-xs text-slate-400">{patient?.name}</p>
              </div>
            </div>

            {/* Destination Government Hospital Routing */}
            <div className="space-y-2.5">
              <label className="block text-xs font-black text-slate-800">
                {t.hospitalSelect} <span className="text-red-500">*</span>
              </label>

              {/* Status Header: Clean location status */}
              <div className="flex items-center justify-between bg-teal-50/60 border border-teal-100 rounded-xl px-3.5 py-2 text-xs">
                <span className="text-teal-900 font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#008F83] shrink-0 animate-pulse" />
                  <span>Showing government referral hospitals (Closest first)</span>
                </span>
                <button
                  type="button"
                  onClick={loadNearbyHospitals}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-teal-200 hover:border-teal-300 transition-colors"
                  title="Update location and distances"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingHospitals ? 'animate-spin' : ''}`} />
                  <span>{loadingHospitals ? 'Locating...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Hospital Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search hospital by name or district..."
                  value={hospSearch}
                  onChange={e => setHospSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#008F83] transition-colors"
                />
                {hospSearch && (
                  <button
                    type="button"
                    onClick={() => setHospSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Hospital Selection Cards */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {(() => {
                  const filtered = baseFacilities.filter(h =>
                    !hospSearch ||
                    h.name.toLowerCase().includes(hospSearch.toLowerCase()) ||
                    (h.typeLabel && h.typeLabel.toLowerCase().includes(hospSearch.toLowerCase()))
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs font-bold">No hospitals found matching "{hospSearch}".</p>
                        <button
                          type="button"
                          onClick={() => setHospSearch('')}
                          className="text-xs font-black text-[#008F83] underline mt-1 cursor-pointer"
                        >
                          Clear Search
                        </button>
                      </div>
                    );
                  }

                  return filtered.map((h, idx) => {
                    const isSelected = hospital === h.name || (selectedFacility && selectedFacility.id === h.id);
                    return (
                      <div
                        key={h.id || idx}
                        data-facility-id={h.id}
                        data-facility-name={h.name}
                        onClick={() => {
                          hasUserSelectedRef.current = true;
                          setHospital(h.name);
                          const matched = facilitiesList.find(f => f.name.toLowerCase() === h.name.toLowerCase()) ||
                                          facilitiesList.find(f => f.id === h.id) ||
                                          CONNECTED_FACILITIES.find(f => f.name.toLowerCase() === h.name.toLowerCase());
                          if (matched) setSelectedFacility(matched);
                          else setSelectedFacility(h);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-teal-50/70 border-[#008F83] ring-1 ring-[#008F83] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-teal-200 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#008F83] text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                              {h.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 flex-wrap font-medium">
                              <span>{h.typeLabel || 'Government Healthcare Facility'}</span>
                              <span>•</span>
                              <span className="text-slate-700 font-bold">
                                📍 {h.dist} km
                              </span>
                              {h.isIntegrated && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#008F83] font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#008F83]" />
                                    Live Reception
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'border-[#008F83] bg-[#008F83] text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Expandable regional centres toggle if not searching */}
              {!hospSearch && nearbyGovHospitals.length > 0 && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setShowMoreFacilities(!showMoreFacilities)}
                    className="text-[11px] font-extrabold text-[#008F83] hover:underline cursor-pointer"
                  >
                    {showMoreFacilities
                      ? '▲ Show only primary referral hospitals'
                      : `▼ View ${nearbyGovHospitals.length} more regional government centres`}
                  </button>
                </div>
              )}

              {/* Selected Hospital Confirmation Preview */}
              {hospital && (
                <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-xl flex items-center justify-between gap-2 mt-1">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                      Selected Hospital:
                    </span>
                    <p className="text-xs font-black text-teal-950 truncate">
                      {hospital}
                    </p>
                  </div>
                  <span className="text-[10px] font-black bg-[#008F83] text-white px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Confirmed
                  </span>
                </div>
              )}
            </div>

            {/* Simplified Clinical Department Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.deptSelect} <span className="text-red-500">*</span>
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm font-bold text-[#16324F] bg-white focus:outline-none focus:border-[#008F83] cursor-pointer"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* ASHA Escort / JSY Flag */}
            <div className="p-4 bg-[#E8F7F3] border border-teal-200 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="jsyClaim"
                checked={isJsyClaim}
                onChange={e => setIsJsyClaim(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-teal-300 mt-0.5 cursor-pointer"
              />
              <div>
                <label htmlFor="jsyClaim" className="text-xs font-black text-teal-950 block cursor-pointer">
                  {t.jsyLabel}
                </label>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  {t.jsySub}
                </p>
              </div>
            </div>

            {routeError && (
              <p className="text-xs font-bold text-red-600 text-center">{routeError}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {t.back}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex-[2] py-3.5 bg-[#008F83] hover:bg-[#007A70] disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isSubmitting ? t.submitting : t.submitReferral}</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}