import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to check TypeScript errors in a file
function checkTsErrors(filePath) {
  const projectRoot = __dirname;
  try {
    const command = `npx tsc --jsx react --esModuleInterop --noEmit "${filePath}"`;
    
    console.log(`Checking TypeScript errors in ${path.relative(projectRoot, filePath)}`);
    
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ No TypeScript errors found in ${path.relative(projectRoot, filePath)}`);
    return true;
  } catch (error) {
    console.error(`❌ TypeScript errors found in ${path.relative(projectRoot, filePath)}`);
    return false;
  }
}

// Files to check
const filesToCheck = [
  path.join(__dirname, 'tests/frontend/Header.test.tsx'),
  path.join(__dirname, 'vitest.config.ts'),
  path.join(__dirname, 'tests/frontend/Button.test.tsx'),
  path.join(__dirname, 'tests/frontend/Input.test.tsx')
];

// Check each file
let allPassed = true;
for (const file of filesToCheck) {
  const passed = checkTsErrors(file);
  if (!passed) {
    allPassed = false;
  }
}

// Print final result
if (allPassed) {
  console.log('🎉 All TypeScript files passed validation!');
  process.exit(0);
} else {
  console.error('❌ Some TypeScript files have errors.');
  process.exit(1);
}
