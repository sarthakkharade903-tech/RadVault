import fs from 'fs';
import path from 'path';

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (/\.(jsx?|tsx?)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = walk('src');
console.log(`Auditing ${allFiles.length} files in src/...`);

const findings = [];

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const l = line.trim();

    // Check for hardcoded demo/mock datasets
    if (/DEMO_|MOCK_|FALLBACK_|defaultTasks|defaultItems|DEMO_DOCTORS|INITIAL_DEMO/i.test(l) && !l.startsWith('import')) {
      findings.push({ file, lineNum, type: 'HARDCODED_DATA', code: l });
    }

    // Check for silent catch blocks
    if (/catch\s*\([^\)]*\)\s*\{/i.test(l)) {
      // Look ahead up to 5 lines to see what catch does
      const block = lines.slice(idx, idx + 6).map(x => x.trim()).join(' ');
      if (/console\.(warn|error)|fallback|setDemo|setReferrals\(|setDoctor/i.test(block) && !/throw\s+/i.test(block)) {
        findings.push({ file, lineNum, type: 'SILENT_CATCH', code: block.slice(0, 150) });
      }
    }

    // Check for fallback assignments e.g. x = y || fallback
    if (/\|\|\s*('b6f81101|'d3333333|'pat-demo|'REF-DEMO|DEMO_|FALLBACK_)/i.test(l)) {
      findings.push({ file, lineNum, type: 'FALLBACK_OR', code: l });
    }
  });
});

console.log(`Found ${findings.length} items:`);
findings.forEach(f => {
  console.log(`[${f.type}] ${f.file}:${f.lineNum}\n  ${f.code}\n`);
});
