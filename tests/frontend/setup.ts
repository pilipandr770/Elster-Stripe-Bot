import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Добавляем пользовательские матчеры для jest-dom
expect.extend(matchers);

// Запускаем cleanup после каждого теста
afterEach(() => {
  cleanup();
});
