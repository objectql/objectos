# GitHub Workflows Documentation

This document describes all GitHub Actions workflows and automation configured for the ObjectOS repository.

## 📋 Table of Contents

- [CI/CD Workflows](#cicd-workflows)
- [Code Quality Workflows](#code-quality-workflows)
- [Automation Workflows](#automation-workflows)
- [Documentation Workflows](#documentation-workflows)
- [Dependency Management](#dependency-management)

---

## CI/CD Workflows

### 🧪 CI (test.yml)

**Triggers:** Push to `main`, Pull Requests

**Purpose:** Runs the full test suite to ensure code quality

**Features:**
- Matrix testing on Node.js 20.x and 22.x
- Frozen lockfile installation for reproducibility
- Code coverage upload to Codecov
- Build verification

**Jobs:**
1. Install dependencies
2. Build all packages
3. Run tests across all packages

---

### 📦 Release (release.yml)

**Triggers:** Manual workflow dispatch

**Purpose:** Manages package versioning and publishing to npm

**Features:**
- Uses Changesets for version management
- Creates release PRs automatically
- Publishes to npm when merged
- Requires `NPM_TOKEN` secret

---

### 📚 Deploy Docs (deploy-docs.yml)

**Triggers:** Push to `main` with changes in `docs/**` or dependencies

**Purpose:** Deploys VitePress documentation to GitHub Pages

**Features:**
- Builds VitePress documentation
- Deploys to GitHub Pages automatically
- Only runs when documentation changes

---

## Code Quality Workflows

### 🔒 CodeQL Security Scan (codeql.yml)

**Triggers:** 
- Push to `main`
- Pull Requests
- Weekly schedule (Monday 00:00 UTC)

**Purpose:** Automated security vulnerability scanning

**Features:**
- Scans JavaScript/TypeScript code
- Uses security-extended and security-and-quality query suites
- Creates security alerts for vulnerabilities
- Runs on a weekly schedule to catch new vulnerabilities

---

### ✨ Lint (lint.yml)

**Triggers:** Push to `main`, Pull Requests

**Purpose:** Code quality and style checks

**Current Features:**
- TypeScript compilation check
- Build verification

**Planned Features:**
- ESLint checks (when configured)
- Prettier formatting checks (when configured)

---

## Automation Workflows

### 🏷️ PR Auto Label (pr-labeler.yml)

**Triggers:** PR opened, edited, or synchronized

**Purpose:** Automatically labels PRs based on changed files

**Labels Applied:**
- `kernel` - Changes in `packages/kernel/**`
- `server` - Changes in `packages/server/**`
- `ui` - Changes in `packages/ui/**`
- `presets` - Changes in `packages/presets/**`
- `documentation` - Changes in docs or markdown files
- `workflows` - Changes in `.github/**`
- `dependencies` - Changes in package.json or lock files
- `tests` - Changes in test files
- `configuration` - Changes in config files

**Configuration:** `.github/labeler.yml`

---

### 📏 PR Size Labeler (pr-size.yml)

**Triggers:** PR opened or synchronized

**Purpose:** Labels PRs based on their size

**Size Categories:**
- `size/xs` - 0-10 lines changed
- `size/s` - 11-100 lines changed
- `size/m` - 101-500 lines changed
- `size/l` - 501-1000 lines changed
- `size/xl` - 1000+ lines changed

**Notes:** 
- Ignores lock files and markdown
- Warns if PR is XL size

---

### ✅ PR Title Check (pr-title-check.yml)

**Triggers:** PR opened, edited, or synchronized

**Purpose:** Enforces Conventional Commits format for PR titles

**Required Format:** `type(scope): subject`

**Valid Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Test changes
- `build` - Build system changes
- `ci` - CI/CD changes
- `chore` - Other changes
- `revert` - Revert previous changes

**Valid Scopes:** kernel, server, ui, presets, plugins, deps, release

**Examples:**
```
feat(kernel): add hook priority support
fix(server): handle null values in query
docs: update architecture guide
```

---

### 🧹 Stale Issues and PRs (stale.yml)

**Triggers:** 
- Daily schedule (00:00 UTC)
- Manual workflow dispatch

**Purpose:** Automatically manages stale issues and PRs

**Issue Settings:**
- Marked stale after 60 days of inactivity
- Closed 7 days after marked stale
- Exempt labels: `pinned`, `security`, `bug`, `enhancement`, `good first issue`

**PR Settings:**
- Marked stale after 30 days of inactivity
- Closed 7 days after marked stale
- Exempt labels: `pinned`, `security`, `in-progress`, `blocked`

**Features:**
- Removes stale label when updated
- Processes up to 100 items per run
- Posts friendly messages before closing

---

### 👋 Greetings (greetings.yml)

**Triggers:** First issue or PR from a contributor

**Purpose:** Welcomes first-time contributors

**Features:**
- Thanks users for their first issue
- Provides guidance for first PR
- Links to contributing guide and documentation
- Checklist for PR requirements

---

## Documentation Workflows

### 🔗 Check Links (check-links.yml)

**Triggers:**
- Push to `main` with markdown changes
- Pull requests with markdown changes
- Weekly schedule (Sunday 00:00 UTC)

**Purpose:** Validates all links in markdown files

**Features:**
- Checks all markdown files for broken links
- Configurable via `lychee.toml` in repository root
- Ignores localhost and internal anchors
- Retries on 429 errors

**Configuration:** `lychee.toml`

---

## Dependency Management

### 🤖 Dependabot (dependabot.yml)

**Schedule:** Weekly on Mondays at 02:00 UTC

**Purpose:** Automated dependency updates

**Ecosystems Monitored:**
1. **npm packages** - All package.json files
2. **GitHub Actions** - Workflow files

**Features:**
- Groups patch updates together
- Groups minor updates together
- Limits to 10 open PRs
- Automatic labeling with `dependencies`
- Conventional commit messages
- Reviews requested from maintainers team

**Labels Applied:**
- `dependencies` - All dependency updates
- `automated` - Auto-generated PRs
- `github-actions` - Action updates

---

## Workflow Permissions

All workflows follow the principle of least privilege:

- **Read permissions:** Most workflows only read repository contents
- **Write permissions:** Only granted where necessary (e.g., creating labels, comments)
- **Security-events:** Only for CodeQL scanning

---

## Required Secrets

Some workflows require repository secrets:

1. **NPM_TOKEN** - Required for `release.yml` to publish packages
2. **GITHUB_TOKEN** - Automatically provided by GitHub Actions

---

## Workflow Status

You can view the status of all workflows:

- **Actions tab:** [View workflows](https://github.com/objectstack-ai/objectos/actions)
- **Badge:** Add workflow badges to README for quick status overview

---

## Customization

To customize workflows:

1. Edit workflow files in `.github/workflows/`
2. Update configuration files:
   - `.github/labeler.yml` - Label rules
   - `.github/dependabot.yml` - Dependency update settings
   - `lychee.toml` - Link checker settings (in repository root)

---

## Troubleshooting

### Workflow not running?

1. Check if the trigger conditions are met
2. Verify workflow file syntax (use YAML validator)
3. Check Actions permissions in repository settings

### Workflow failing?

1. Check the workflow logs in the Actions tab
2. Verify all required secrets are configured
3. Check if any external actions have updated

### Need help?

- Check [GitHub Actions Documentation](https://docs.github.com/en/actions)
- Review workflow logs for error messages
- Open an issue for workflow-related problems

---

## Best Practices

1. **Keep workflows simple** - One job per workflow when possible
2. **Use caching** - Speed up workflows with dependency caching
3. **Fail fast** - Use `fail-fast: false` only when needed
4. **Security first** - Always use latest action versions
5. **Monitor costs** - Use workflow logs to optimize runtime

---

*Last updated: 2026-01-15*
