export interface RunOptions {
  filePatterns: string[];
  ignoreFilePatterns?: string[];
  debug?: boolean;
  skipGitChecks?: boolean;
  dry?: boolean;
  sdk?: string;
  currentVersion?: string;
  cwd?: string;
  disableTelemetry?: boolean;
}

export interface Transformer {
  /**
   * The name of the transformer
   * Will be used in the selection menu or when printing transformer-specific log messages.
   */
  name: string;

  /**
   * Whether the transformer requires user input to run
   * If true, the transformer won't show a spinner to avoid cluttering the spinner with user prompts.
   */
  requiresUserInput?: boolean;

  /**
   * Takes a list of files and applies whatever transformation/modification is necessary
   *
   * @param files
   * @param options
   */
  transform(files: string[], options: RunOptions): Promise<void>;
}

export type PackageDotJson = {
  scripts?: Record<string, string | undefined>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  workspaces?: string[];
};

export type NpmPackage = {
  name: string;
  version: string;
};
