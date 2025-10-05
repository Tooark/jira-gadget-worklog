import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 90,
      statements: 90
    },
  },
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
  },
  modulePathIgnorePatterns: ['<rootDir>/src/env'],
  preset: 'ts-jest',
  reporters:
    process.env.CI === 'true'
      ? [['github-actions', { silent: false }], 'summary']
      : undefined,
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.ts'],
  testEnvironment: 'jsdom',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};

export default config;
