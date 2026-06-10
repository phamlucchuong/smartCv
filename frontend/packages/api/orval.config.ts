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
      target: process.env.USER_SERVICE_URL ?? './openapi/live/user-service.json',
    },
    output: {
      ...OUTPUT_BASE,
      target: './src/generated/user',
      schemas: './src/generated/user/model',
    },
  },

  jobService: {
    input: {
      target: process.env.JOB_SERVICE_URL ?? './openapi/live/job-service.json',
    },
    output: {
      ...OUTPUT_BASE,
      target: './src/generated/job',
      schemas: './src/generated/job/model',
    },
  },

  applicationService: {
    input: {
      target: process.env.APP_SERVICE_URL ?? './openapi/live/application-service.json',
    },
    output: {
      ...OUTPUT_BASE,
      target: './src/generated/application',
      schemas: './src/generated/application/model',
    },
  },

  aiService: {
    input: {
      target: process.env.AI_SERVICE_URL ?? './openapi/live/ai-service.json',
    },
    output: {
      ...OUTPUT_BASE,
      target: './src/generated/ai',
      schemas: './src/generated/ai/model',
    },
  },
});
