#!/usr/bin/env node
import { satisfies } from "semver";
import * as clack from "@clack/prompts";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { run } from "./run.js";

const NODE_VERSION_RANGE = ">=18";

if (!satisfies(process.version, NODE_VERSION_RANGE)) {
  clack.log.error(
    `Sentry wizard requires Node.js ${NODE_VERSION_RANGE}. You are using Node.js ${process.version}. Please upgrade your Node.js version.`
  );
  process.exit(1);
}

const argv = yargs(hideBin(process.argv))
  .option("transformFiles", {
    alias: "t",
    default: false,
    describe: "Glob pattern which files should be transformed",
    default: "**/*.{js,jsx,ts,tsx,mjs,cjs,mts}",
    type: "boolean",
  })
  .option("debug", {
    default: false,
    describe: "Enable verbose logging",
    type: "boolean",
  })
  .parse();

void run(argv);
