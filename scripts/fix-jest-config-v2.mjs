
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../packages');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file === 'jest.config.cjs') {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(rootDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  const lines = content.split('\n');
  let changed = false;
  const newLines = lines.map(line => {
    if (line.includes("js$': '$1'")) {
       // If it is the line we added, replace it with correct escaping
       // We want: '^(\\.{1,2}/.*)\\.js$'
       return "    '^(\\\\.{1,2}/.*)\\\\.js$': '$1',";
    }
    return line;
  });
  
  if (lines.join('\n') !== newLines.join('\n')) {
      fs.writeFileSync(file, newLines.join('\n'));
      console.log(`Fixed ${file}`);
  }
});
