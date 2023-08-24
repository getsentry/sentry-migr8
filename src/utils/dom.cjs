const { parse } = require('node-html-parser');

/**
 * Parse the contents of <script> tags on the given page.
 *
 * @param {string} source
 * @returns {string[]}
 */
function parseScriptTagContents(source) {
  try {
    const root = parse(source);
    const scripts = root.querySelectorAll('script');
    return scripts.map(script => script.innerHTML);
  } catch (error) {
    return [];
  }
}

/**
 * Replace the contents of <script> tags on the given page.
 *
 * @param {string} source
 * @param {(string|undefined)[]} newContents
 * @returns {string | undefined}
 */
function replaceScriptTagContents(source, newContents) {
  try {
    const root = parse(source);
    const scripts = root.querySelectorAll('script');
    scripts.forEach(script => {
      const newContent = newContents.shift();
      if (typeof newContent === 'string') {
        script.innerHTML = newContent;
      }
    });
    return root.toString();
  } catch (error) {
    return undefined;
  }
}

/**
 * This is a wrapper for jscode shift, which makes sure to handle files like .vue or .svelte
 * which contain scripts inside of a `<script>` tag.
 * If we detect a file extension we need to handle this way, we try to parse out the script contents
 * of the file and run the transform on each script individually, stiching it back together at the end.
 *
 * @param {import('jscodeshift')} j
 * @param {string} source
 * @param {string|undefined} fileName
 * @param {(j: import('jscodeshift'), source: string) => string | undefined} callback
 * @returns
 */
function wrapJscodeshift(j, source, fileName, callback) {
  if (fileName && (fileName.endsWith('.vue') || fileName.endsWith('.svelte'))) {
    const scripts = parseScriptTagContents(source);
    const newScripts = scripts.map(scriptContent => callback(j, scriptContent));
    return replaceScriptTagContents(source, newScripts);
  }

  return callback(j, source);
}

module.exports = {
  wrapJscodeshift,
};
