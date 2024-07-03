# Publishing a Release

_These steps are only relevant to Sentry employees when preparing and publishing a new release._

1. Run `pnpm changelog` on the `main` branch and determine what version will be released (we use
   [semver](https://semver.org))
2. Create a branch `prepare-release/VERSION`, e.g. `prepare-release/1.4.8`, off of main
3. Update [`CHANGELOG.md`](https://github.com/getsentry/sentry-migr8/edit/main/CHANGELOG.md) to add an entry for
   the next release number and a list of changes since the last release. (See details below.)
4. Open a PR with the title `meta(changelog): Update changelog for VERSION` against the `main` branch.
5. **Be cautious!** The PR against `master` should be merged via "Merge Commit"
6. When the PR is merged, it will automatically trigger the
   [Auto Release](https://github.com/getsentry/sentry-migr8/actions/workflows/auto-release.yml) on main.

## Updating the Changelog

1. Run `pnpm changelog` and copy everything.
2. Create a new section in the changelog with the previously determined version number.
3. Paste in the logs you copied earlier.
4. Highlight any important changes with subheadings.
5. If any of the PRs are from external contributors, include underneath the commits
   `Work in this release contributed by <list of external contributors' GitHub usernames>. Thank you for your contributions!`.
   If there's only one external PR, don't forget to remove the final `s`. If there are three or more, use an Oxford
   comma. (It's in the Sentry styleguide!)
6. Commit, push, and continue with step 4 from the previous section with the general instructions (above).
 