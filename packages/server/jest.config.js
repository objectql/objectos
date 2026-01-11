module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        allowJs: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }]
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  transformIgnorePatterns: [
    'node_modules/(?!better-auth)'
  ],
};
