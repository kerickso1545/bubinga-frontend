import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function countLines(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

function findFiles(dir, extensions) {
  let results = [];
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.includes(extname(file))) {
      results.push(filePath);
    }
  }
  
  return results;
}

const tsFiles = findFiles('.', ['.ts', '.tsx']);
let total = 0;

console.log('\nLine count for TypeScript files:\n');

tsFiles.sort().forEach(file => {
  const count = countLines(file);
  total += count;
  console.log(`${file}: ${count} lines`);
});

console.log(`\nTotal: ${total} lines`);