import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads a fixture code sample from the __fixtures__ directory synchronously.
 * 
 * @param filename - The name of the file in the __fixtures__ directory
 * @returns The string content of the source code
 */
export function loadFixture(filename: string): string {
  const fixturePath = path.resolve(__dirname, '..', '__tests__', '__fixtures__', filename);
  return fs.readFileSync(fixturePath, 'utf-8');
}
