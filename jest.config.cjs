const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  transform: tsjPreset.transform,
  preset: '@shelf/jest-mongodb',
  modulePathIgnorePatterns: [
    '<rootDir>/dist/'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/test/setupTests.ts',
  ],
};