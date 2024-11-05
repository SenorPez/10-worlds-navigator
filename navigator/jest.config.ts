// jest.config.ts
import type { Config } from 'jest';

const jestConfig: Config = {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/app/**/*.ts'
  ],
  coveragePathIgnorePatterns: [
    '.module.ts'
  ],
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  transformIgnorePatterns: [
    'node_modules/three/examples/jsm/(?!(controls|renderers))'
  ],
  verbose: false
};

export default jestConfig;
