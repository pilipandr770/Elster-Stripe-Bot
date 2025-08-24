import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Запускаем cleanup после каждого теста
afterEach(() => {
  cleanup();
});
