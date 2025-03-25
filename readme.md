# pnpm-update-catalogs <!-- omit from toc -->

> pnpm update for `pnpm-workspace.yaml` [catalogs](https://pnpm.io/catalogs).

<p>
  <a href="https://github.com/transitive-bullshit/pnpm-update-catalogs/actions/workflows/main.yml"><img alt="Build Status" src="https://github.com/transitive-bullshit/pnpm-update-catalogs/actions/workflows/main.yml/badge.svg" /></a>
  <a href="https://www.npmjs.com/package/pnpm-update-catalogs"><img alt="NPM" src="https://img.shields.io/npm/v/pnpm-update-catalogs.svg" /></a>
  <a href="https://github.com/transitive-bullshit/pnpm-update-catalogs/blob/main/license"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue" /></a>
  <a href="https://prettier.io"><img alt="Prettier Code Formatting" src="https://img.shields.io/badge/code_style-prettier-brightgreen.svg" /></a>
</p>

- [Intro](#intro)
- [Features](#features)
- [Install](#install)
- [Usage](#usage)
  - [Example: Update specific packages to latest](#example-update-specific-packages-to-latest)
  - [Example: Update all packages to latest](#example-update-all-packages-to-latest)
- [Related utils](#related-utils)
- [License](#license)

## Intro

This CLI provides a temporary fix for: https://github.com/pnpm/pnpm/issues/8641

Namely, it allows you to run a command at the top of your `pnpm` workspaces monorepo which updates all of the [catalog](https://pnpm.io/catalogs) dependencies.

## Features

- Uses internal `pnpm` packages so config and dependency resolution are as close to the official `pnpm` version as possible
- Formatting and yaml comments are preserved
- By default, follows current version ranges but supports the `--latest` (`-L`) option as well
- Optionally target specific catalogs or specific packages (by default all catalogs and packages will be updated)

## Install

```sh
npm install -g pnpm-update-catalogs
```

Or you can just run it from `npm`:

```sh
npx pnpm-update-catalogs --help
```

## Usage

```sh
pnpm-update-catalogs

Usage:
  pnpm-update-catalogs [flags...] [pkg...]

Flags:
  -c, --catalogs <string>        Update specific catalogs (by default, all catalogs will be updated)
  -h, --help                     Show help
  -L, --latest                   Update all catalogs to the latest version
  -V, --verbose                  Verbose output
```

You can optionally pass an array of catalog packages to update.

> [!NOTE]
> Make sure you run `pnpm install` after updating your workspace file for the updated catalog packages to actually be installed.

### Example: Update specific packages to latest

```sh
npx pnpm-update-catalogs -L typescript tsx
pnpm install
git diff
```

### Example: Update all packages to latest

```sh
npx pnpm-update-catalogs -L
pnpm install
git diff
```

Example output after running on my [agentic repo](https://github.com/transitive-bullshit/agentic):

```diff
diff --git a/pnpm-workspace.yaml b/pnpm-workspace.yaml
index 4619573..6ce2aaa 100644
--- a/pnpm-workspace.yaml
+++ b/pnpm-workspace.yaml
@@ -34,35 +34,35 @@ catalog:
   execa: ^9.5.2
   exit-hook: ^4.0.0
   fast-xml-parser: ^5.0.9
-  genkit: ^1.2.0
-  genkitx-openai: ^0.20.1
+  genkit: ^1.3.0
+  genkitx-openai: ^0.20.2
   json-schema-to-zod: ^2.6.0
-  jsonrepair: ^3.9.0 # this comment will be preserved
+  jsonrepair: ^3.12.0 # this comment will be preserved
   jsrsasign: ^10.9.0
   ky: ^1.7.5 # this comment will also be preserved
-  langchain: ^0.3.3
+  langchain: ^0.3.19
   lint-staged: ^15.5.0
-  llamaindex: ^0.9.11
-  mathjs: ^13.0.3
+  llamaindex: ^0.9.12
+  mathjs: ^13.2.3
   npm-run-all2: ^7.0.2
-  octokit: ^4.0.2
+  octokit: ^4.1.2
   only-allow: ^1.2.1
-  openai: ^4.87.3
+  openai: ^4.89.0
   openai-fetch: ^3.4.2
   openai-zod-to-json-schema: ^1.0.3
   openapi-types: ^12.1.3
-  p-map: ^7.0.2
+  p-map: ^7.0.3
   p-throttle: ^6.2.0
   prettier: ^3.5.3
   restore-cursor: ^5.1.0
-  simple-git-hooks: ^2.11.1
+  simple-git-hooks: ^2.12.1
   string-strip-html: ^13.4.12
   syncpack: 14.0.0-alpha.10
   tsup: ^8.4.0
   tsx: ^4.19.3
   turbo: ^2.4.4
   twitter-api-sdk: ^1.2.1
-  type-fest: ^4.37.0
+  type-fest: ^4.38.0
   typescript: ^5.8.2
   vitest: ^3.0.9
   wikibase-sdk: ^10.2.2
```

## Related utils

`pnpm outdated -r` is useful to see all of the dependencies in your workspace that are out-of-date.

`npx codemod pnpm/catalog` is very helpful for converting project dependencies to use the changelog in the first place.

## License

MIT © [Travis Fischer](https://x.com/transitive_bs)

If you found this project interesting, [consider following me on Twitter](https://x.com/transitive_bs).
