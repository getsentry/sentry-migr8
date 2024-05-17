# Changelog

## 0.2.2

- feat: Ask for SDK selection if auto-detection fails (#53)
- ref: Reword intro section (#53)
- telemetry: Fix missing telemetry tags (#53)
- telemetry: Enable metrics collection (#53)

## 0.2.1

- ref: Use latest Sentry v7 SDK for telemetry collection (#47)
- fix: Fix migr8 crashing on windows due to Unix path delimiters (#50)

## 0.2.0

- feat: Add transform to extract node config into separate file (#41)

## 0.1.0

- feat: Add transform for hub methods (#35)
- fix: Avoid adding comments multiple times & touching unchanged files (#34)
- fix: Ensure we are properly type safe (#33)
- feat: Add comment for `getActiveTransaction()` (#30)
- build: Bump all deps to latest (#31)
- fix: Fix false positives for comment lookup (#32)
- feat: Add transform to remove `@sentry/integrations` (#23)
- feat: Add migration comment transform (#27)
- feat: Transform class integrations into functional integrations (#21)

## 0.0.4

- feat: Add configureScope transformer (#19) by @mydea
- feat: add Svelte Config rewrite transformer (dfa126e) by @Lms24
- fix incorrect deduping of named to namespace imports (2d48de4) by @Lms24
- Add ignoreFilePatters option (a6801ac) by @mydea

## 0.0.3

- Handle _.vue and _.svelte files
- Apply prettier after modifications
- Minor fixes & improvements

## 0.0.2

- Initial release

## 0.0.1

- Unreleased

## 0.0.0

- Unreleased
