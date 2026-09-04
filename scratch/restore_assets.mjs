import { execSync } from 'child_process';
import fs from 'fs';

['illus_asha.jpg', 'illus_family.jpg', 'illus_hospital.jpg'].forEach(file => {
  const buf = execSync(`git show sarthak_mvp2:src/assets/${file}`, { maxBuffer: 50 * 1024 * 1024 });
  fs.writeFileSync(`src/assets/${file}`, buf);
  console.log(`Saved src/assets/${file}, size:`, buf.length);
});
