module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__test__/*.test.js'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  }
};