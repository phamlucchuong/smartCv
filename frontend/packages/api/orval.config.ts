import { defineConfig } from 'orval';

const MUTATOR = {
  path: './src/axios-instance.ts',
  name: 'customInstance',
} as const;

const OUTPUT_BASE = {
  mode: 'tags-split' as const,
  client: 'react-query' as const,
  clean: true,
  override: { mutator: MUTATOR },
};

export default defineConfig({
  userService: {
    input: {
      target: process.env.USER_SERVICE_URL ?? 'http://localhost:8081/user/v3/api-docs',
    },
    output: {
      ...OUTPUT_BASE,
      target: './src/generated/user',
      schemas: './src/generated/user/model',
    },
  },

  jobService: {
    input: {
      target: process.env.JOB_SERVICE_URL ?? 'http://localhost:8082/job/v3/api-docs',
    },
    output: {
      ...OUTPUT_BASE,
      target: './src/generated/job',
      schemas: './src/generated/job/model',
    },
  },

  applicationService: {
    input: {
      target: process.env.APP_SERVICE_URL ?? 'http://localhost:8083/application/v3/api-docs',
    },
    output: {
      ...OUTPUT_BASE,
      target: './src/generated/application',
      schemas: './src/generated/application/model',
    },
  },

  aiService: {
    input: {
      target: process.env.AI_SERVICE_URL ?? 'http://localhost:8085/ai/v3/api-docs',
    },
    output: {
      ...OUTPUT_BASE,
      target: './src/generated/ai',
      schemas: './src/generated/ai/model',
    },
  },
});
