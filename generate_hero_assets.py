"""
Generate vector SVG assets for the 4 Healthcare Heroes of RadVault.
Designed for high-impact insertion into PowerPoint or Canva.
"""

# Hero 1: ASHA Didi (Frontline Guardian)
svg_asha = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_asha" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e" />
      <stop offset="100%" stop-color="#042f2e" />
    </linearGradient>
    <linearGradient id="accent_teal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2dd4bf" />
      <stop offset="100%" stop-color="#14b8a6" />
    </linearGradient>
    <filter id="glow_teal" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#14b8a6" flood-opacity="0.3"/>
    </filter>
  </defs>

  <rect width="400" height="300" rx="16" fill="url(#bg_asha)"/>
  
  <!-- Decorative background rings -->
  <circle cx="200" cy="150" r="120" fill="none" stroke="#134e4a" stroke-width="2" stroke-dasharray="6 6"/>
  <circle cx="200" cy="150" r="85" fill="#115e59" opacity="0.4"/>

  <!-- Hero Character / Icon Silhouette: ASHA Frontline Health -->
  <!-- Stethoscope / Cross / Health Badge -->
  <circle cx="200" cy="115" r="45" fill="url(#accent_teal)" filter="url(#glow_teal)"/>
  
  <!-- Stylized Figure Head & Shoulders -->
  <circle cx="200" cy="102" r="16" fill="#042f2e"/>
  <path d="M176 142 C176 122, 224 122, 224 142 Z" fill="#042f2e"/>
  
  <!-- Voice Mic / Smart Mobile Overlay -->
  <rect x="230" y="75" width="46" height="65" rx="6" fill="#ffffff" filter="url(#glow_teal)"/>
  <rect x="235" y="80" width="36" height="42" rx="3" fill="#f0fdfa"/>
  <!-- Pulse wave inside phone -->
  <path d="M239 101 L245 101 L248 94 L252 108 L256 97 L260 103 L267 101" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round"/>
  <!-- Mic symbol -->
  <circle cx="253" cy="130" r="3" fill="#0d9488"/>

  <!-- Badge banner -->
  <rect x="50" y="195" width="300" height="75" rx="10" fill="#ffffff" filter="url(#glow_teal)"/>
  <text x="200" y="222" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="16" font-weight="900" fill="#0f172a" text-anchor="middle">HERO 1: ASHA DIDI</text>
  <text x="200" y="240" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="700" fill="#0d9488" text-anchor="middle">Frontline Vitals &amp; Marathi Voice Scribe</text>
  <text x="200" y="258" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="10.5" font-weight="600" fill="#64748b" text-anchor="middle">Eliminates 18 manual paper registers in village</text>
</svg>'''

# Hero 2: Hospital Reception (Smart Gatekeeper)
svg_reception = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_rec" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="accent_blue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa" />
      <stop offset="100%" stop-color="#3b82f6" />
    </linearGradient>
    <filter id="glow_blue" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#3b82f6" flood-opacity="0.3"/>
    </filter>
  </defs>

  <rect width="400" height="300" rx="16" fill="url(#bg_rec)"/>
  <circle cx="200" cy="150" r="120" fill="none" stroke="#312e81" stroke-width="2" stroke-dasharray="6 6"/>

  <!-- Hospital & Clock / Speed Symbol -->
  <circle cx="200" cy="115" r="45" fill="url(#accent_blue)" filter="url(#glow_blue)"/>
  
  <!-- Hospital Building Icon -->
  <rect x="180" y="90" width="40" height="42" fill="#0f172a" rx="3"/>
  <rect x="195" y="98" width="10" height="10" fill="#60a5fa"/>
  <rect x="186" y="98" width="5" height="6" fill="#ffffff"/>
  <rect x="209" y="98" width="5" height="6" fill="#ffffff"/>
  <rect x="186" y="112" width="5" height="6" fill="#ffffff"/>
  <rect x="209" y="112" width="5" height="6" fill="#ffffff"/>

  <!-- Token Badge flying in -->
  <rect x="135" y="60" width="130" height="28" rx="6" fill="#ffffff" filter="url(#glow_blue)"/>
  <text x="200" y="78" font-family="'Space Grotesk', Arial, sans-serif" font-size="12" font-weight="800" fill="#2563eb" text-anchor="middle">TOKEN: SHIR-OPD-025</text>

  <!-- Banner -->
  <rect x="50" y="195" width="300" height="75" rx="10" fill="#ffffff" filter="url(#glow_blue)"/>
  <text x="200" y="222" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="16" font-weight="900" fill="#0f172a" text-anchor="middle">HERO 2: HOSPITAL INTAKE</text>
  <text x="200" y="240" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="700" fill="#2563eb" text-anchor="middle">5-Second Digital Queue &amp; CAD Triage</text>
  <text x="200" y="258" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="10.5" font-weight="600" fill="#64748b" text-anchor="middle">Ends 3-hour waiting lines &amp; manual paper triage</text>
</svg>'''

# Hero 3: Specialist Doctor (Diagnostic Expert)
svg_doctor = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_doc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b0764" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
    <linearGradient id="accent_purple" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c084fc" />
      <stop offset="100%" stop-color="#9333ea" />
    </linearGradient>
    <filter id="glow_purple" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#9333ea" flood-opacity="0.3"/>
    </filter>
  </defs>

  <rect width="400" height="300" rx="16" fill="url(#bg_doc)"/>
  <circle cx="200" cy="150" r="120" fill="none" stroke="#581c87" stroke-width="2" stroke-dasharray="6 6"/>

  <!-- Tele-radiology screen simulation -->
  <rect x="135" y="70" width="130" height="85" rx="8" fill="#020617" stroke="#9333ea" stroke-width="2" filter="url(#glow_purple)"/>
  
  <!-- X-Ray silhouette -->
  <path d="M200 85 L200 135 M180 95 L220 95 M175 108 L225 108 M182 120 L218 120" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
  
  <!-- Live contrast / AI badge -->
  <rect x="145" y="130" width="45" height="16" rx="3" fill="#9333ea"/>
  <text x="167" y="141" font-family="Arial, sans-serif" font-size="8" font-weight="800" fill="#ffffff" text-anchor="middle">INVERT</text>

  <rect x="195" y="130" width="60" height="16" rx="3" fill="#0f172a" stroke="#475569" stroke-width="1"/>
  <text x="225" y="141" font-family="Arial, sans-serif" font-size="8" font-weight="800" fill="#38bdf8" text-anchor="middle">AI SUMMARY</text>

  <!-- Banner -->
  <rect x="50" y="195" width="300" height="75" rx="10" fill="#ffffff" filter="url(#glow_purple)"/>
  <text x="200" y="222" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="16" font-weight="900" fill="#0f172a" text-anchor="middle">HERO 3: SPECIALIST DOCTOR</text>
  <text x="200" y="240" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="700" fill="#7e22ce" text-anchor="middle">In-Browser Tele-Radiology Suite</text>
  <text x="200" y="258" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="10.5" font-weight="600" fill="#64748b" text-anchor="middle">Prevents ₹3,000 redundant repeat scans per family</text>
</svg>'''

# Hero 4: 108 Paramedic (Emergency Lifeline)
svg_paramedic = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="bg_para" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#991b1b" />
      <stop offset="100%" stop-color="#450a0a" />
    </linearGradient>
    <linearGradient id="accent_red" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f87171" />
      <stop offset="100%" stop-color="#dc2626" />
    </linearGradient>
    <filter id="glow_red" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#dc2626" flood-opacity="0.4"/>
    </filter>
  </defs>

  <rect width="400" height="300" rx="16" fill="url(#bg_para)"/>
  <circle cx="200" cy="150" r="120" fill="none" stroke="#7f1d1d" stroke-width="2" stroke-dasharray="6 6"/>

  <!-- Shield of Emergency Protection -->
  <path d="M200 65 L245 80 L245 115 C245 140, 200 155, 200 155 C200 155, 155 140, 155 115 L155 80 Z" fill="url(#accent_red)" filter="url(#glow_red)"/>
  
  <!-- Heart & Cross in Shield -->
  <path d="M192 105 L208 105 M200 97 L200 113" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>

  <!-- Zero-Login QR Badge overlay -->
  <rect x="75" y="75" width="60" height="60" rx="6" fill="#ffffff" filter="url(#glow_red)"/>
  <!-- QR Mini Pattern -->
  <rect x="80" y="80" width="16" height="16" fill="#0f172a"/>
  <rect x="83" y="83" width="10" height="10" fill="#ffffff"/>
  <rect x="85" y="85" width="6" height="6" fill="#dc2626"/>
  <rect x="113" y="80" width="16" height="16" fill="#0f172a"/>
  <rect x="116" y="83" width="10" height="10" fill="#ffffff"/>
  <rect x="118" y="85" width="6" height="6" fill="#dc2626"/>
  <rect x="80" y="113" width="16" height="16" fill="#0f172a"/>
  <rect x="100" y="100" width="10" height="10" fill="#dc2626"/>
  <rect x="115" y="115" width="14" height="14" fill="#0f172a"/>

  <!-- Critical Blood Group Callout -->
  <rect x="250" y="80" width="80" height="50" rx="8" fill="#ffffff" filter="url(#glow_red)"/>
  <text x="290" y="96" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="9" font-weight="800" fill="#64748b" text-anchor="middle">BLOOD GROUP</text>
  <text x="290" y="120" font-family="'Space Grotesk', Arial, sans-serif" font-size="20" font-weight="900" fill="#dc2626" text-anchor="middle">O+ (POS)</text>

  <!-- Banner -->
  <rect x="50" y="195" width="300" height="75" rx="10" fill="#ffffff" filter="url(#glow_red)"/>
  <text x="200" y="222" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="16" font-weight="900" fill="#991b1b" text-anchor="middle">HERO 4: 108 PARAMEDIC</text>
  <text x="200" y="240" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="12" font-weight="800" fill="#dc2626" text-anchor="middle">24x7 Break-Glass Emergency QR</text>
  <text x="200" y="258" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="10.5" font-weight="600" fill="#64748b" text-anchor="middle">Zero Login. Blood &amp; Allergy alert in &lt;3 seconds</text>
</svg>'''

with open("poster_assets/hero_1_asha.svg", "w", encoding="utf-8") as f:
    f.write(svg_asha)

with open("poster_assets/hero_2_reception.svg", "w", encoding="utf-8") as f:
    f.write(svg_reception)

with open("poster_assets/hero_3_doctor.svg", "w", encoding="utf-8") as f:
    f.write(svg_doctor)

with open("poster_assets/hero_4_paramedic.svg", "w", encoding="utf-8") as f:
    f.write(svg_paramedic)

print("Generated 4 Hero SVG assets successfully in poster_assets/!")
