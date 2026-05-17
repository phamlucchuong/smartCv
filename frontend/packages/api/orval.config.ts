import { defineConfig } from 'orval';

export default defineConfig({
  smartCV: {
    input: {
      target: './swagger.json', // Placeholder, user should update this
    },
    output: {
      mode: 'tags-split',
      target: './src/generated',
      schemas: './src/generated/model',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
