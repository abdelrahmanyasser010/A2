import { copyFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'data', 'demo-seed.json');
const target = path.join(root, 'data', 'store.json');
await copyFile(source, target);
console.log('A² demo data restored from data/demo-seed.json');
