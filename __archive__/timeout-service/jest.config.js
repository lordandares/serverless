module.exports = {
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleFileExtensions: ['js', 'ts'],
  reporters: ['default', 'jest-junit'],
  roots: ['<rootDir>/src'],
  setupFiles: ['./jest.setup.js'],
  testRegex: '(/__tests__/.*|(\\.|/)(test))\\.(ts)$',
  transform: { '^.+\\.ts$': 'ts-jest' },
}
