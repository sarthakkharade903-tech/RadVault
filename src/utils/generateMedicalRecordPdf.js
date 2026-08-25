/**
 * generateMedicalRecordPdf.js
 * RadVault — Step 4: Download a Medical Record
 *
 * Generates a clean, professional PDF of a medical record using jsPDF.
 * Uses only record data already present in the application.
 * Does NOT add AI diagnosis, invented information, or backend credentials.
 */

import { jsPDF } from "jspdf";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_W    = 210; // A4 mm
const PAGE_H    = 297; // A4 mm
const MARGIN    = 18;  // left/right margin
const CONTENT_W = PAGE_W - MARGIN * 2;

// Brand colours (hex without #)
const TEAL   = [0,   128, 128];
const MAROON = [128, 0,   0  ];
const DARK   = [33,  33,  33 ];
const MUTED  = [100, 100, 100];
const LIGHT  = [248, 250, 252];
const BORDER = [226, 232, 240];
const TEAL_TINT = [240, 249, 249];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sanitise a string to be safe as a filename segment. */
function sanitiseFilename(str = "") {
  return str
    .replace(/[^a-zA-Z0-9\s\-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .substring(0, 50);
}

/** Format "2026-07-22" → "22 Jul 2026". */
function formatDate(dateStr = "") {
  const months = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"];
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
}

/** Set font to one of jsPDF's built-in safe options. */
function font(doc, size, style = "normal", color = DARK) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

/** Draw a filled rectangle. */
function fillRect(doc, x, y, w, h, color) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, "F");
}

/** Draw a 1pt horizontal rule. */
function hRule(doc, y, color = BORDER) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
}

/**
 * Write wrapped text and return the new Y position.
 * Handles automatic page-break.
 */
function writeText(doc, text, x, y, maxWidth, lineHeight = 5.5) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  for (const line of lines) {
    if (y > PAGE_H - MARGIN - 10) {
      doc.addPage();
      y = MARGIN + 10;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

/**
 * Draw a section heading (uppercase teal label + small divider).
 * Returns new Y.
 */
function sectionHeading(doc, label, y) {
  if (y > PAGE_H - MARGIN - 20) { doc.addPage(); y = MARGIN + 10; }
  font(doc, 8, "bold", TEAL);
  doc.text(label.toUpperCase(), MARGIN, y);
  y += 3;
  hRule(doc, y, TEAL);
  return y + 4;
}

/**
 * Draw a labelled field row: "LABEL   value"
 * Returns new Y.
 */
function field(doc, label, value, y) {
  if (!value) return y; // skip missing/undefined fields
  if (y > PAGE_H - MARGIN - 10) { doc.addPage(); y = MARGIN + 10; }
  font(doc, 8.5, "bold", MUTED);
  doc.text(label, MARGIN, y);
  font(doc, 8.5, "normal", DARK);
  y = writeText(doc, value, MARGIN + 34, y, CONTENT_W - 34, 5);
  return y + 1;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * @param {object} record   — the full record object from mockPatientData
 * @param {object} patient  — { name, id } from PatientContext or fallback
 */
export async function generateMedicalRecordPdf(record, patient = {}) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let y = 0;

  const patientName = patient.name || "Patient";
  const patientId   = patient.id   || "";
  const recDate     = formatDate(record.date);
  const modalityLabel = record.modality || "Document";

  // ── Header band ────────────────────────────────────────────────────────────
  fillRect(doc, 0, 0, PAGE_W, 28, TEAL);

  // App name
  font(doc, 16, "bold", [255, 255, 255]);
  doc.text("RadVault", MARGIN, 13);

  // Tagline
  font(doc, 7.5, "normal", [200, 235, 235]);
  doc.text("Medical Record — Personal Health Document", MARGIN, 20);

  // Record type chip (top-right)
  font(doc, 8, "bold", [255, 255, 255]);
  const chipLabel = modalityLabel.toUpperCase();
  doc.text(chipLabel, PAGE_W - MARGIN, 20, { align: "right" });

  y = 36;

  // ── Patient identity block ─────────────────────────────────────────────────
  fillRect(doc, MARGIN, y - 4, CONTENT_W, 18, LIGHT);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y - 4, CONTENT_W, 18);

  font(doc, 11, "bold", MAROON);
  doc.text(patientName, MARGIN + 4, y + 3);

  if (patientId) {
    font(doc, 8, "normal", MUTED);
    doc.text(`Patient ID: ${patientId}`, MARGIN + 4, y + 9);
  }

  // Date on the right
  font(doc, 8, "normal", MUTED);
  doc.text(`Record Date: ${recDate}`, PAGE_W - MARGIN - 2, y + 3, { align: "right" });
  if (record.facility) {
    doc.text(record.facility, PAGE_W - MARGIN - 2, y + 9, { align: "right" });
  }

  y += 22;

  // ── Record title ───────────────────────────────────────────────────────────
  font(doc, 13, "bold", MAROON);
  y = writeText(doc, record.title, MARGIN, y, CONTENT_W, 7);
  y += 1;

  // Subtitle: modality · bodyRegion
  const subtitle = [modalityLabel, record.bodyRegion].filter(Boolean).join("  ·  ");
  font(doc, 8.5, "normal", MUTED);
  y = writeText(doc, subtitle, MARGIN, y, CONTENT_W);
  y += 3;

  hRule(doc, y);
  y += 6;

  // ── Metadata fields ────────────────────────────────────────────────────────
  y = field(doc, "Date",     recDate,              y);
  y = field(doc, "Facility", record.facility,      y);
  y = field(doc, "Doctor",   record.doctor,        y);
  if (record.radiologistLicense) {
    y = field(doc, "Reg. No.", record.radiologistLicense, y);
  }
  y += 4;

  // ── Patient-friendly explanation ───────────────────────────────────────────
  if (record.patientFriendlySummary) {
    y = sectionHeading(doc, "In Simple Words", y);

    // Teal-tinted background box
    const summaryLines = doc.splitTextToSize(record.patientFriendlySummary, CONTENT_W - 6);
    const boxH = summaryLines.length * 5.5 + 12;
    if (y + boxH > PAGE_H - MARGIN) { doc.addPage(); y = MARGIN + 10; }
    fillRect(doc, MARGIN, y - 3, CONTENT_W, boxH, TEAL_TINT);
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y - 3, MARGIN, y - 3 + boxH); // left accent bar

    font(doc, 9, "normal", DARK);
    y = writeText(doc, record.patientFriendlySummary, MARGIN + 4, y + 2, CONTENT_W - 6);
    y += 3;

    // Disclaimer
    font(doc, 7.5, "italic", MUTED);
    y = writeText(
      doc,
      "This explanation is based on the official report. It is not a medical diagnosis or medical advice.",
      MARGIN + 4, y, CONTENT_W - 6, 4.5
    );
    y += 6;
  }

  // ── Official report section ────────────────────────────────────────────────
  y = sectionHeading(doc, "Official Medical Report", y);

  if (record.report?.clinicalIndication) {
    font(doc, 8, "bold", DARK);
    doc.text("Clinical Indication", MARGIN, y);
    y += 5;
    font(doc, 8.5, "normal", DARK);
    y = writeText(doc, record.report.clinicalIndication, MARGIN + 2, y, CONTENT_W - 2);
    y += 3;
  }

  if (record.report?.technique) {
    font(doc, 8, "bold", DARK);
    doc.text("Examination Technique", MARGIN, y);
    y += 5;
    font(doc, 8.5, "normal", DARK);
    y = writeText(doc, record.report.technique, MARGIN + 2, y, CONTENT_W - 2);
    y += 3;
  }

  if (record.report?.findings?.length > 0) {
    const findingsLabel =
      record.modality === "Lab Report"    ? "Test Results"         :
      record.modality === "Cardiology"    ? "Cardiology Findings"  :
      record.modality === "Prescription"  ? "Prescription Details" :
      "Findings";

    font(doc, 8, "bold", DARK);
    doc.text(findingsLabel, MARGIN, y);
    y += 5;
    font(doc, 8.5, "normal", DARK);
    for (const finding of record.report.findings) {
      if (y > PAGE_H - MARGIN - 10) { doc.addPage(); y = MARGIN + 10; }
      doc.text("•", MARGIN + 1, y);
      y = writeText(doc, finding, MARGIN + 5, y, CONTENT_W - 5);
      y += 1;
    }
    y += 3;
  }

  // ── Impression / conclusion ────────────────────────────────────────────────
  if (record.report?.impression) {
    if (y > PAGE_H - MARGIN - 30) { doc.addPage(); y = MARGIN + 10; }

    // Highlighted impression box
    const impLines = doc.splitTextToSize(record.report.impression, CONTENT_W - 6);
    const impBoxH  = impLines.length * 5.5 + 14;
    fillRect(doc, MARGIN, y - 3, CONTENT_W, impBoxH, [240, 249, 249]);
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(1);
    doc.line(MARGIN, y - 3, MARGIN, y - 3 + impBoxH);
    doc.setLineWidth(0.3);

    font(doc, 8, "bold", TEAL);
    doc.text("IMPRESSION / CONCLUSION", MARGIN + 4, y + 3);
    y += 8;

    font(doc, 9, "bold", DARK);
    y = writeText(doc, record.report.impression, MARGIN + 4, y, CONTENT_W - 6, 5.5);
    y += 8;
  }

  // ── Doctor / verifier block ────────────────────────────────────────────────
  const verifier = record.report?.verifiedBy || record.doctor;
  if (verifier || record.radiologistLicense) {
    hRule(doc, y);
    y += 5;
    font(doc, 9, "bold", DARK);
    if (verifier) doc.text(verifier, MARGIN, y);
    y += 5;
    if (record.radiologistLicense) {
      font(doc, 8, "normal", MUTED);
      doc.text(`Registration No: ${record.radiologistLicense}`, MARGIN, y);
      y += 5;
    }
  }

  // ── Footer on every page ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = PAGE_H - 8;
    hRule(doc, footerY - 2, BORDER);
    font(doc, 7, "normal", MUTED);
    doc.text(
      "This document is an export from RadVault. For clinical decisions, refer to original records and consult your healthcare provider.",
      MARGIN, footerY, { maxWidth: CONTENT_W - 30 }
    );
    doc.text(`Page ${i} of ${totalPages}`, PAGE_W - MARGIN, footerY, { align: "right" });
  }

  // ── Build filename ─────────────────────────────────────────────────────────
  const titleSlug = sanitiseFilename(record.title);
  const dateSlug  = recDate.replace(/\s/g, "-");
  const filename  = `RadVault_${modalityLabel.replace(/\s/g, "_")}_${titleSlug}_${dateSlug}.pdf`;

  doc.save(filename);
}
