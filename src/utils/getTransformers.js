import path from 'path';
import url from 'url';
import { readdirSync } from 'fs';

/**
 * @returns {Promise<import('types').Transformer[]>}
 */
export function getTransformers() {
  const transformersPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '..', 'transformers');
  const transformers = readdirSync(transformersPath);

  return Promise.all(
    transformers.map(transformer => getTransformer(path.join(transformersPath, transformer, 'index.js')))
  );
}

/**
 * @param {string} filePath
 * @returns {Promise<import('types').Transformer>}
 */
async function getTransformer(filePath) {
  const file = await import(url.pathToFileURL(filePath).toString());

  return file.default;
}
