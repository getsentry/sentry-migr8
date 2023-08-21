import fs from 'fs';
import path from 'path';
import url from 'url';

/**
 * @returns {Promise<import('types').Transformer[]>}
 */
export function getTransformers() {
  const transformersPath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '../transformers');
  const transformers = fs.readdirSync(transformersPath);

  return Promise.all(transformers.map(transformer => getTransformer(path.join(transformersPath, transformer))));
}

/**
 * @param {string} filePath
 * @returns {Promise<import('types').Transformer>}
 */
async function getTransformer(filePath) {
  const file = await import(filePath);

  return file.default;
}
