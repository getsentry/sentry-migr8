import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync } from 'fs';
import path from 'path';

/**
 * @returns {string}
 */
export function getCliPath() {
  return path.join(process.cwd(), './src/index.js');
}

/**
 *
 * @param {string} testAppName
 * @returns {string}
 */
export function getFixturePath(testAppName) {
  return path.resolve(path.join(process.cwd(), 'test-fixtures', testAppName));
}

/**
 *
 * @param {string} originalDir
 * @returns {string}
 */
export function makeTmpDir(originalDir) {
  if (!existsSync('tmp')) {
    mkdirSync('tmp');
  }

  const tmpPath = mkdtempSync(`tmp/${path.basename(originalDir)}`);
  cpSync(originalDir, tmpPath, { recursive: true });

  return tmpPath;
}

/**
 *
 * @param {string} dir
 * @param {string} fileName
 * @returns {string}
 */
export function getDirFileContent(dir, fileName) {
  const fullPath = path.join(dir, fileName);
  return readFileSync(fullPath, 'utf-8');
}
/**
 *
 *
 * @param {string} dir
 * @param {string} fileName
 * @returns {boolean}
 */
export function fileExists(dir, fileName) {
  const fullPath = path.join(dir, fileName);
  return existsSync(fullPath);
}
