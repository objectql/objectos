# ObjectOS Documentation Index

> Central hub for all ObjectOS microkernel and plugin system documentation

---

## 🚀 Getting Started

### For New Users

1. **[Quick Start (5 min)](./PLUGIN_QUICK_REFERENCE_EN.md)** - Get up and running fast
2. **[快速开始 (5 分钟)](./PLUGIN_QUICK_REFERENCE_CN.md)** - 快速上手指南

### For Developers

1. **[Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md)** - Complete guide with examples
2. **[Runtime API Reference](./packages/runtime/README.md)** - @objectstack/runtime documentation

---

## 📋 Planning Documents

### Development Plans

- **[Development Plan (English)](./MICROKERNEL_DEVELOPMENT_PLAN_EN.md)** - Complete 16-week plan
- **[开发方案 (中文)](./MICROKERNEL_DEVELOPMENT_PLAN_CN.md)** - 16周完整开发计划

### Implementation Summary

- **[Implementation Summary](./IMPLEMENTATION_SUMMARY_MICROKERNEL.md)** - Technical overview and progress

---

## 📖 Technical Documentation

### Architecture

- **[Architecture Guide](./ARCHITECTURE.md)** - System architecture deep dive
- **[Spec System Development](./SPEC_SYSTEM_DEVELOPMENT_PLAN.md)** - @objectstack/spec implementation

### Quick References

- **[Quick Reference (English)](./PLUGIN_QUICK_REFERENCE_EN.md)** - Cheat sheet for developers
- **[快速参考 (中文)](./PLUGIN_QUICK_REFERENCE_CN.md)** - 开发者速查手册

---

## 📦 Package Documentation

### Core Packages

| Package | Description | Docs |
|---------|-------------|------|
| `@objectstack/runtime` | Microkernel for plugin system | [README](./packages/runtime/README.md) |
| `@objectos/plugin-server` | NestJS HTTP server | [README](./packages/plugins/server/README.md) |
| `@objectos/plugin-better-auth` | Authentication | [README](./packages/plugins/better-auth/README.md) |
| `@objectos/plugin-audit-log` | Audit logging | [README](./packages/plugins/audit-log/README.md) |

### All Plugins

See [packages/plugins/](./packages/plugins/) for complete list.

---

## 🎓 Learning Resources

### By Experience Level

**Beginners**:
1. [Quick Start Guide](./PLUGIN_QUICK_REFERENCE_EN.md)
2. [Simple Plugin Example](./PLUGIN_DEVELOPMENT_GUIDE.md#complete-example)
3. [Testing Guide](./PLUGIN_DEVELOPMENT_GUIDE.md#testing)

**Intermediate**:
1. [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md)
2. [Architecture Guide](./ARCHITECTURE.md)
3. [Service Registry](./PLUGIN_DEVELOPMENT_GUIDE.md#service-registry)
4. [Event System](./PLUGIN_DEVELOPMENT_GUIDE.md#event-system)

**Advanced**:
1. [Development Plan](./MICROKERNEL_DEVELOPMENT_PLAN_EN.md)
2. [Implementation Summary](./IMPLEMENTATION_SUMMARY_MICROKERNEL.md)
3. [Spec System](./SPEC_SYSTEM_DEVELOPMENT_PLAN.md)

---

## 🔧 Development

### Setup

```bash
# Clone repository
git clone https://github.com/objectstack-ai/objectos.git
cd objectos

# Install dependencies
pnpm install

# Build runtime
cd packages/runtime
pnpm build

# Run tests
pnpm test
```

### Create a Plugin

```bash
# Create plugin directory
mkdir my-plugin && cd my-plugin

# Initialize
pnpm init

# Install runtime
pnpm add @objectstack/runtime
```

See [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md) for details.

---

## 📊 Project Status

### Phase 1: Foundation - ✅ COMPLETE

- ✅ @objectstack/runtime package
- ✅ 25 unit tests (100% passing)
- ✅ Comprehensive documentation

### Phase 2: Core Plugins - 🔄 IN PROGRESS

- [ ] @objectos/plugin-storage
- [ ] @objectos/plugin-cache
- [ ] @objectos/plugin-metrics
- [ ] @objectos/plugin-i18n
- [ ] @objectos/plugin-notification

### Future Phases

See [Development Plan](./MICROKERNEL_DEVELOPMENT_PLAN_EN.md) for complete roadmap.

---

## 🌐 Community

- **GitHub**: https://github.com/objectstack-ai/objectos
- **Issues**: https://github.com/objectstack-ai/objectos/issues
- **Discussions**: https://github.com/objectstack-ai/objectos/discussions

---

## 📝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the AGPL-3.0 License - see [LICENSE](./LICENSE) file.

---

## 🗂️ Document Structure

```
objectos/
├── README.md                              # Main README
├── DOCUMENTATION_INDEX.md                 # This file
│
├── Quick References/
│   ├── PLUGIN_QUICK_REFERENCE_EN.md      # English quick reference
│   └── PLUGIN_QUICK_REFERENCE_CN.md      # Chinese quick reference
│
├── Development Plans/
│   ├── MICROKERNEL_DEVELOPMENT_PLAN_EN.md # English development plan
│   ├── MICROKERNEL_DEVELOPMENT_PLAN_CN.md # Chinese development plan
│   └── SPEC_SYSTEM_DEVELOPMENT_PLAN.md    # Spec system plan
│
├── Guides/
│   ├── PLUGIN_DEVELOPMENT_GUIDE.md        # Complete plugin guide
│   ├── ARCHITECTURE.md                    # Architecture guide
│   └── CONTRIBUTING.md                    # Contributing guide
│
├── Implementation/
│   └── IMPLEMENTATION_SUMMARY_MICROKERNEL.md # Technical summary
│
└── packages/
    └── runtime/
        └── README.md                      # Runtime API docs
```

---

## 🔍 Search by Topic

### Plugin Development
- [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md)
- [Quick Reference](./PLUGIN_QUICK_REFERENCE_EN.md)
- [Runtime API](./packages/runtime/README.md)

### Architecture
- [Architecture Guide](./ARCHITECTURE.md)
- [Development Plan](./MICROKERNEL_DEVELOPMENT_PLAN_EN.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY_MICROKERNEL.md)

### Getting Started
- [Quick Start (EN)](./PLUGIN_QUICK_REFERENCE_EN.md)
- [快速开始 (CN)](./PLUGIN_QUICK_REFERENCE_CN.md)
- [Main README](./README.md)

### API Reference
- [Runtime API](./packages/runtime/README.md)
- [Service Registry](./PLUGIN_DEVELOPMENT_GUIDE.md#service-registry)
- [Event Bus](./PLUGIN_DEVELOPMENT_GUIDE.md#event-system)
- [Storage](./PLUGIN_DEVELOPMENT_GUIDE.md#storage)

---

## 📞 Support

Need help? Try these resources:

1. **Documentation**: Start with the [Quick Reference](./PLUGIN_QUICK_REFERENCE_EN.md)
2. **Examples**: Check [Plugin Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md#complete-example)
3. **Issues**: Open an [issue](https://github.com/objectstack-ai/objectos/issues)
4. **Discussions**: Join [discussions](https://github.com/objectstack-ai/objectos/discussions)

---

*Last updated: February 3, 2026*
