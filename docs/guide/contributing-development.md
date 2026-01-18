# Contributing to Development

Welcome to the ObjectOS development effort! This guide helps you understand how to contribute to the project's ongoing development.

## Quick Links

- **[Development Plan (Q1 2026)](./development-plan.md)** - Current quarter's detailed implementation roadmap
- **[Architecture Guide](./architecture.md)** - System design and architectural principles
- **[Security Guide](./security-guide.md)** - Security best practices and guidelines

## How to Get Involved

### 1. Choose Your Area

ObjectOS development is organized into several key areas:

**🔐 Permission System** (High Priority)
- Object-level permissions (CRUD)
- Field-level security
- Record-level security (RLS)
- See: [Development Plan § 3.1-3.3](./development-plan.md#phase-1-permission-system-implementation-2-3-weeks)

**🪝 Lifecycle Hooks** (High Priority)
- Standard hooks implementation
- Hook debugging tools
- See: [Development Plan § 3.4-3.5](./development-plan.md#phase-2-lifecycle-hooks-system-1-2-weeks)

**🔗 Relationship Fields** (High Priority)
- Lookup fields (many-to-one)
- Master-Detail relationships
- Many-to-many relationships
- See: [Development Plan § 3.6-3.8](./development-plan.md#phase-3-relationship-fields-implementation-2-3-weeks)

**🧪 Testing & Quality** (Ongoing)
- Unit tests (target: 90% Kernel, 80% Server, 70% UI)
- Integration tests
- E2E tests
- See: [Development Plan § 3.9-3.11](./development-plan.md#phase-4-testing--documentation-ongoing)

### 2. Understand the Standards

Before contributing code, please review:

- **[Architecture Principles](./architecture.md)** - Understand the kernel/driver/server separation
- **[SDK Reference](./sdk-reference.md)** - Learn the ObjectOS API
- **[Contributing Guide](../../CONTRIBUTING.md)** - Code style and workflow

### 3. Set Up Your Environment

```bash
# Clone the repository
git clone https://github.com/objectstack-ai/objectos.git
cd objectos

# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test

# Start development server
pnpm run dev
```

### 4. Pick a Task

Tasks are organized in the [Development Plan](./development-plan.md) with:
- **Task Lists** - Specific implementation steps
- **Acceptance Criteria** - What "done" looks like
- **Estimated Time** - How long it should take

Look for:
- Tasks marked as high-priority
- Tasks in the current week (see [Timeline](./development-plan.md#4-timeline--milestones))
- Tasks that match your skills and interests

### 5. Submit Your Work

1. **Create a feature branch**
   ```bash
   git checkout -b feature/permission-checker
   ```

2. **Implement the feature**
   - Follow the task list in the development plan
   - Write tests as you go (TDD recommended)
   - Add JSDoc comments for public APIs

3. **Test thoroughly**
   ```bash
   # Run unit tests
   pnpm --filter @objectos/kernel test
   
   # Run integration tests
   pnpm --filter @objectos/server test
   
   # Check coverage
   pnpm run test --coverage
   ```

4. **Submit a pull request**
   - Reference the development plan section
   - Include before/after examples
   - Note any breaking changes
   - Request review from maintainers

## Development Workflow

### Weekly Cycle

Each week follows this pattern:

**Monday-Wednesday: Implementation**
- Work on assigned tasks
- Write tests alongside code
- Document as you go

**Thursday: Code Review**
- Submit PRs for review
- Review others' PRs
- Address feedback

**Friday: Integration**
- Merge approved PRs
- Update development plan status
- Plan next week's tasks

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and general discussion
- **Pull Requests** - Code review and technical discussion

## Quality Standards

All contributions must meet these standards:

### Code Quality
- ✅ TypeScript strict mode enabled
- ✅ No `any` types (use `unknown` with guards)
- ✅ All public APIs have JSDoc comments
- ✅ Consistent naming conventions (see [Contributing Guide](../../CONTRIBUTING.md))

### Test Coverage
- ✅ Kernel: ≥ 90% coverage
- ✅ Server: ≥ 80% coverage
- ✅ UI: ≥ 70% coverage
- ✅ All edge cases tested

### Performance
- ✅ API response time P95 < 100ms
- ✅ Permission check overhead < 10ms
- ✅ No N+1 queries in relationships

### Documentation
- ✅ README updated if behavior changes
- ✅ Guide updated for new features
- ✅ Migration notes for breaking changes
- ✅ Examples provided for complex features

## Current Priorities (Q1 2026)

### Week 1-2: Permission System Foundation
Focus on object-level and field-level permissions. This is the foundation for enterprise security.

**Key Tasks:**
- Implement `PermissionChecker` class
- Add `PermissionGuard` to server
- Create field visibility filters

**Success Metrics:**
- All CRUD operations check permissions
- 95%+ test coverage
- < 5ms permission check overhead

### Week 3-4: RLS & Hooks
Complete the permission system with record-level security, then move to lifecycle hooks.

**Key Tasks:**
- Implement `RLSInjector`
- Complete `HookManager`
- Add hook debugging tools

**Success Metrics:**
- Sharing rules work correctly
- All 8 hook types functional
- Hook execution traceable

### Week 5-7: Relationships
Implement full relationship support, the most complex feature set.

**Key Tasks:**
- Lookup field resolver
- Master-Detail cascade delete
- Many-to-many junction tables

**Success Metrics:**
- No N+1 queries
- Cascade operations work
- Related records query correctly

## Getting Help

### For Contributors

**Not sure where to start?**
- Look for issues labeled `good first issue`
- Start with documentation improvements
- Review the [Architecture Guide](./architecture.md) to understand the system

**Stuck on implementation?**
- Check the [Development Plan](./development-plan.md) for code examples
- Review the [SDK Reference](./sdk-reference.md)
- Ask in GitHub Discussions

**Tests failing?**
- Check the [Testing Guide](../../CONTRIBUTING.md#testing)
- Look at existing tests for examples
- Run tests in watch mode: `pnpm test --watch`

### For Maintainers

**Reviewing PRs?**
- Check against acceptance criteria in development plan
- Verify test coverage meets standards
- Ensure documentation is updated

**Planning next sprint?**
- Review [Timeline & Milestones](./development-plan.md#4-timeline--milestones)
- Assess completion status
- Adjust priorities based on progress

## Recognition

Contributors who make significant progress on the development plan will be:
- Listed in release notes
- Acknowledged in documentation
- Invited to join the core team

Thank you for helping build the future of ObjectOS! 🚀
