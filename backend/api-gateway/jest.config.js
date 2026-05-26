/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^ipfs-http-client$': '<rootDir>/src/__mocks__/ipfs-http-client.ts',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
};
