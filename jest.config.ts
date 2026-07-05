import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'mjs'],
  moduleNameMapper: {
    '^@actions/core$': '<rootDir>/__tests__/__mocks__/actionsCore.ts',
    '^@actions/github$': '<rootDir>/__tests__/__mocks__/actionsGithub.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          types: ['jest', 'node'],
          esModuleInterop: true,
        },
      },
    ],
    '^.+\\.mjs$': '<rootDir>/jest.mjs-transformer.cjs',
  },
};

export default config;
