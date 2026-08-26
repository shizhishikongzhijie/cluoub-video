# Repository governance

## Protected branch

`master` is the release integration branch. Direct pushes, force pushes, and branch deletion are disabled for everyone, including administrators. Every change must come from another branch through a Pull Request.

Merge requirements:

- `CI / verify` succeeds.
- The source branch is up to date with `master`.
- All review conversations are resolved.
- Commit history remains linear.

The repository uses squash merge and deletes merged branches automatically. Approval count is currently zero so a single maintainer can merge their own validated Pull Request; CODEOWNERS still identifies the responsible reviewer. Increase the approval count when a second active maintainer is available.

## Releases

- Package versions and Git tags are immutable.
- Beta tags use `v<version>` and the npm `beta` dist-tag.
- `latest` changes only for a stable release.
- Release artifacts must pass CI, export checks, type fixtures, size budgets, and browser tests.
- Distributed packages retain `LICENSE` and `NOTICE`.

## Security and automation

- GitHub Actions receives read-only repository permissions by default; individual workflows declare only additional permissions they need.
- Dependabot monitors npm and GitHub Actions dependencies.
- Vulnerabilities use Private Vulnerability Reporting instead of public Issues.
- Secret scanning, push protection, vulnerability alerts, and automated security updates are enabled when supported by GitHub.

Repository settings are enforced on GitHub. This document records the intended policy so settings can be audited and restored, but it is not itself an enforcement mechanism.
