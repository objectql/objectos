import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../packages');

const packages = [
  'audit',
  'auth',
  'cache',
  'i18n',
  'jobs',
  'metrics',
  'notification',
  'permissions',
  'storage',
  'workflow', // workflow wasn't in the list but checking if it has one
];
// browser is separate

const nodeConfig = `module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\\\.{1,2}/.*)\\\\.js$': '$1',
  },
  transform: {
    '^.+\\\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ]
};
`;

const browserConfig = `module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\\\.{1,2}/.*)\\\\.js$': '$1',
  },
  transform: {
    '^.+\\\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ]
};
`;

// Helper to write
function writeConfig(pkgName, config) {
  const filePath = path.join(rootDir, pkgName, 'jest.config.cjs');
  fs.writeFileSync(filePath, config);
  console.log(`Wrote ${filePath}`);
}

// Write node configs
packages.forEach((pkg) => {
  // Only if directory exists
  if (fs.existsSync(path.join(rootDir, pkg))) {
    writeConfig(pkg, nodeConfig);
  }
});

// Write browser config
writeConfig('browser', browserConfig);
