module.exports = {
  roots: ['<rootDir>/'],
  setupFiles: ['./jest.setup.js'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)test)\\.ts?$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  reporters: ['default', 'jest-junit'],
  globals: {
    'ts-jest': {
      enableTsDiagnostics: true,
    },
  },
}
