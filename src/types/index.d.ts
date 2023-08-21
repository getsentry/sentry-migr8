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
   * Can be used to e.g. prefix log stmts, or to identify the transformer for other purposes
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
