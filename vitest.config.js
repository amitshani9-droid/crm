import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}', 'api/**/*.test.{js,jsx}'],
    server: {
      deps: {
        inline: ['airtable'],
      },
    },
  },
});
