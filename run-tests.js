// Simple script to run vitest directly with proper configuration
import { execa } from 'execa';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runTests() {
  try {
    const result = await execa('npx', ['vitest', 'run'], {
      cwd: __dirname,
      stdio: 'inherit',
      env: {
        NODE_OPTIONS: '--no-warnings'
      }
    });
    
    if (result.failed) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

runTests();
