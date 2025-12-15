import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/**/*.spec.ts'],
    },
    resolve: {
        alias: {
            '@core': path.resolve(process.cwd(), './src/app/core'),
            '@features': path.resolve(process.cwd(), './src/app/features'),
            '@env': path.resolve(process.cwd(), './src/environments'),
            '@app': path.resolve(process.cwd(), './src/app'),
            '@shared': path.resolve(process.cwd(), './src/app/shared'),
        },
    },
});
