import fs from 'fs';
import path from 'path';

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (!f.includes('node_modules') && !f.includes('.git') && !f.includes('dist')) {
        searchDir(full);
      }
    } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes("from('referrals')") || content.includes('from("referrals")')) {
        console.log("Found from('referrals') in:", full);
      }
      if (content.includes('createEncounter')) {
        console.log("Found createEncounter in:", full);
      }
    }
  }
}

searchDir('./src');
