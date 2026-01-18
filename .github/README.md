# .github Directory

This directory contains all GitHub-specific configuration and automation for the ObjectOS repository.

## 📁 Structure

```
.github/
├── workflows/           # GitHub Actions workflow definitions
│   ├── test.yml        # CI/CD - Testing and building
│   ├── codeql.yml      # Security scanning
│   ├── lint.yml        # Code quality checks
│   ├── release.yml     # Package release automation
│   ├── deploy-docs.yml # Documentation deployment
│   ├── pr-*.yml        # PR automation workflows
│   ├── stale.yml       # Stale issue management
│   ├── greetings.yml   # Welcome first-time contributors
│   └── check-links.yml # Documentation link validation
├── dependabot.yml      # Automated dependency updates
├── labeler.yml         # PR labeling rules
└── WORKFLOWS.md        # Detailed workflow documentation
```

## 🤖 Automation Overview

### CI/CD
- **Continuous Integration:** Automated testing on every PR
- **Security Scanning:** CodeQL analysis for vulnerabilities
- **Documentation:** Auto-deploy to GitHub Pages

### Code Quality
- **Linting:** TypeScript compilation checks
- **PR Validation:** Title format and size checks
- **Link Checking:** Validate documentation links

### Dependency Management
- **Dependabot:** Weekly dependency updates
- **Security Alerts:** Automated vulnerability scanning

### Community
- **Auto-labeling:** PRs labeled by changed files and size
- **Greetings:** Welcome first-time contributors
- **Stale Management:** Auto-close inactive issues/PRs

## 📖 Documentation

For detailed information about each workflow, see [WORKFLOWS.md](./WORKFLOWS.md)

## 🔧 Configuration Files

### dependabot.yml
Configures automated dependency updates for:
- npm packages (weekly on Mondays)
- GitHub Actions (weekly on Mondays)

### labeler.yml
Defines rules for automatic PR labeling based on file paths:
- Package-specific labels (kernel, server, ui, presets)
- Content-type labels (documentation, tests, configuration)
- Change-type labels (dependencies, workflows)

### markdown-link-check-config.json
Configures the link checker for documentation:
- Timeout settings
- Retry behavior
- URL patterns to ignore

## 🚀 Quick Start

### For Contributors

Most automation happens automatically:
1. Open a PR → Auto-labeled by files and size
2. PR title validated → Must follow Conventional Commits
3. Tests run automatically → Must pass before merge
4. First contribution → Receive welcome message

### For Maintainers

Key workflows:
- **Release:** Manually trigger from Actions tab
- **Stale cleanup:** Runs daily, can be triggered manually
- **Security scan:** Runs weekly and on every PR

## 🛡️ Security

- All workflows use pinned action versions
- Minimum required permissions for each workflow
- Secrets properly configured for sensitive operations
- CodeQL scanning on schedule and PRs

## 📝 Modifying Workflows

1. Edit workflow files in `workflows/` directory
2. Validate YAML syntax before committing
3. Test changes in a fork if possible
4. Update WORKFLOWS.md documentation

## 🔍 Monitoring

View workflow runs:
- Go to the [Actions tab](https://github.com/objectstack-ai/objectos/actions)
- Filter by workflow name
- Check logs for failures

## ⚙️ Troubleshooting

Common issues:

**Workflow not triggering?**
- Check trigger conditions in workflow file
- Verify file path filters match your changes

**Workflow failing?**
- Check workflow logs in Actions tab
- Verify required secrets are configured
- Check for rate limits or API issues

**Dependabot not creating PRs?**
- Check dependabot.yml syntax
- Verify schedule configuration
- Check repository settings for Dependabot

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/docs/)

---

For more details, see [WORKFLOWS.md](./WORKFLOWS.md)
