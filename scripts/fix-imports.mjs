import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../packages');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        arrayOfFiles.push(path.join(dirPath, '/', file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(rootDir);

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace import x from './y' with './y.js'
  // Regex to match relative imports
  // Matches: from './...' or from '../...'
  // exclude those that already have an extension (naive check, but .js shouldn't be there yet)

  const replacer = (match, quote, p1, quote2) => {
    if (p1.endsWith('.js') || p1.endsWith('.json')) return match;
    // If it points to a directory index, usually we can't easily know without checking fs
    // But in this project, it seems mostly file to file.
    // However, if it's 'dir', it might mean 'dir/index.js' in old node, but in Node16 ESM strictly requires full path or index.js

    // For now, let's append .js and see. Most of the errors were "Did you mean './types.js'?"
    return `from ${quote}${p1}.js${quote2}`;
  };

  // Handle "import ... from '...'"
  content = content.replace(/from\s+(['"])(\..*?)(['"])/g, replacer);

  // Handle "import '...'" (side effect imports)
  content = content.replace(/import\s+(['"])(\..*?)(['"])/g, (match, quote, p1, quote2) => {
    if (match.startsWith('import from')) return match; // handled above usually
    if (p1.endsWith('.js') || p1.endsWith('.json')) return match;
    return `import ${quote}${p1}.js${quote2}`;
  });

  // Handle "export ... from '...'"
  content = content.replace(/export\s+.*?\s+from\s+(['"])(\..*?)(['"])/g, replacer);

  // Specific fix for the double replacement bug (if any) or complex exports
  // actually replacer above handles the 'from' part.
  // The previous regex `from\s+...` handles both `import ... from` and `export ... from` BUT `export` might have stricter syntax.
  // Let's rely on `from\s+` capturing most.

  // Explicit export star
  content = content.replace(/export\s+\*\s+from\s+(['"])(\..*?)(['"])/g, replacer);

  if (content !== fs.readFileSync(file, 'utf8')) {
    console.log(`Updated ${file}`);
    fs.writeFileSync(file, content);
  }
});
