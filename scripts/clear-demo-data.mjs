import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const storePath = path.join(root, 'data', 'store.json');
const mediaPath = path.join(root, 'public', 'media', 'demo');
const uploadDemoPath = path.join(root, 'public', 'uploads', 'products', 'demo');
const current = JSON.parse(await readFile(storePath, 'utf8'));

const clean = {
  version: Math.max(Number(current.version || 0), 3),
  meta: {
    demoData: false,
    seededAt: new Date().toISOString(),
    note: 'Demo catalogue removed. Store is ready for real production content.'
  },
  products: [],
  orders: [],
  customers: [],
  discounts: [],
  inventoryMovements: [],
  settings: current.settings
};

await writeFile(storePath, JSON.stringify(clean, null, 2), 'utf8');
if (process.argv.includes('--media')) {
  await rm(mediaPath, { recursive: true, force: true });
  await rm(uploadDemoPath, { recursive: true, force: true });
  console.log('Removed public/media/demo and the demo Media Library uploads.');
}
console.log('A² demo records cleared. Settings were preserved.');
