export interface RunOptions {
  filePatterns: string[];
  debug: boolean;
  skipGitChecks: boolean;
  sdk: string | undefined;
}

export interface TransformerOptions extends RunOptions {
  sdk: string;
}

export interface Transformer {
  /**
   * The name of the transformer
   * Will be used in the selection menu or when printing transformer-specific log messages.
   */
  name: string;

  /**
   * Takes a list of files and applies whatever transformation/modification is necessary
   *
   * @param files
   * @param options
   */
  transform(files: string[], options: TransformerOptions): Promise<void>;
}

export type PackageDotJson = {
  scripts?: Record<string, string | undefined>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type NpmPackage = {
  name: string;
  version: string;
};
