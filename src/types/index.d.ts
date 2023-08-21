export interface RunOptions {
  filePatterns: string[];
  debug: boolean;
}

/**
 * Options for the `transform` function
 */
export interface TransformerOptions {
  debug: boolean;
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
