module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/dist/**/*.test.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  reporters: [
    //'<rootDir>/CustomReporter.js',
    
  ],
  collectCoverage: true,
  coverageReporters: ["lcov"],

};
