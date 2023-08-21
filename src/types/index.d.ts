export interface RunOptions {
  files: string[];
  debug: boolean;
}

/**
 * Options for the `transform` function
 */
export interface TransformerOptions {
  debug: boolean;
}

export interface Transformer {
  transform(files: string[], options: TransformerOptions): Promise<void>;
}
