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
      if (file === 'jest.config.cjs') {
        arrayOfFiles.push(path.join(dirPath, '/', file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(rootDir);

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes("'^(\\.{1,2}/.*)\\.js$': '$1'")) {
    if (content.includes('moduleNameMapper: {')) {
      content = content.replace(
        'moduleNameMapper: {',
        "moduleNameMapper: {\n    '^(\\.{1,2}/.*)\\.js$': '$1',",
      );
    } else {
      content = content.replace(
        'module.exports = {',
        "module.exports = {\n  moduleNameMapper: {\n    '^(\\.{1,2}/.*)\\.js$': '$1',\n  },",
      );
    }

    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
