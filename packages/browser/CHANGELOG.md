# Changelog

All notable changes to the Browser Runtime Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-04

### Added

#### Core Features
- **SQLite WASM Database Driver** - Full SQL database running in WebAssembly
  - Auto-save to OPFS every 5 seconds
  - Save on page unload
  - Transaction support (BEGIN, COMMIT, ROLLBACK)
  - Query and mutation execution
  - Connection management
  
- **OPFS File Storage Backend** - File system operations using Origin Private File System
  - File read/write operations
  - Directory management
  - File metadata retrieval
  - Storage quota monitoring
  - Pattern-based file listing
  
- **Service Worker Manager** - API request interception and routing
  - MSW-like request/response pattern
  - Pattern-based handler registration
  - GraphQL and REST endpoint support
  - Message-based communication between SW and main thread
  - 30-second timeout for requests
  
- **Web Worker Manager** - Business logic isolation
  - Query execution in worker thread
  - Mutation execution in worker thread
  - Plugin loading/unloading
  - Hook invocation
  - Message-based communication

#### Plugin Infrastructure
- Standard ObjectOS plugin interface implementation
- PluginContext integration
- Service registration system
- Lifecycle hooks (init, start, stop, destroy)
- Browser compatibility checks

#### Developer Experience
- Full TypeScript support with strict mode
- Comprehensive type definitions
- Source maps for debugging
- JSDoc documentation
- Example code and demos

#### Documentation
- Comprehensive README with usage examples
- Integration guide for React and vanilla JS
- Migration guide from server to browser
- API reference documentation
- Browser compatibility matrix

### Technical Details

#### Dependencies
- `sql.js` ^1.11.0 - SQLite compiled to WebAssembly
- `idb` ^8.0.0 - IndexedDB wrapper (future use)
- `comlink` ^4.4.1 - Web Worker communication
- `@objectstack/runtime` ^1.0.0 - ObjectOS runtime
- `@objectstack/spec` 1.0.0 - ObjectStack protocol

#### Browser Requirements
- WebAssembly support
- Origin Private File System (OPFS)
- Service Worker API
- Web Worker API
- Modern JavaScript (ES2020+)

#### Supported Browsers
- Chrome/Edge 102+
- Firefox 111+
- Safari 15.2+

### Known Limitations

1. **Database Size**: Limited by browser storage quota (typically 10-100GB)
2. **File Size**: Individual files limited by browser memory (recommended max: 100MB)
3. **SQL Features**: Some PostgreSQL-specific features not available
4. **Performance**: Slower than native server-side databases
5. **Persistence**: Data can be cleared when user clears browser data

### Development

#### Build System
- TypeScript compiler with strict mode
- Output to `dist/` directory
- Declaration files (.d.ts) generated
- Source maps included

#### Testing
- Jest test framework configured
- jsdom test environment
- Test coverage reporting
- Example test suite included

### Files Added

```
packages/plugins/browser/
├── src/
│   ├── database/
│   │   └── sqlite-wasm-driver.ts
│   ├── storage/
│   │   └── opfs-storage.ts
│   ├── service-worker/
│   │   └── manager.ts
│   ├── worker/
│   │   └── manager.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── file-system.d.ts
│   ├── plugin.ts
│   └── index.ts
├── test/
│   └── plugin.test.ts
├── examples/
│   └── basic-usage.ts
├── README.md
├── INTEGRATION_GUIDE.md
├── CHANGELOG.md
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Security Considerations

- All data stored locally in browser storage
- OPFS provides origin-isolated storage
- Service Worker runs in isolated context
- Web Worker provides additional isolation for business logic
- No network access required after initial load

### Performance Characteristics

- **Database Operations**: 10-100x slower than native PostgreSQL
- **File Operations**: Limited by browser I/O performance
- **Memory Usage**: Entire database loaded in memory
- **Storage I/O**: OPFS provides near-native file system performance

### Future Enhancements

Planned for future releases:

- [ ] IndexedDB integration for larger datasets
- [ ] Incremental database loading
- [ ] Compression support for database files
- [ ] Background sync with server
- [ ] Conflict resolution strategies
- [ ] Import/export functionality
- [ ] Database encryption
- [ ] GraphQL query execution
- [ ] RESTful API helpers
- [ ] Authentication integration
- [ ] Real-time sync capabilities

## [Unreleased]

No unreleased changes yet.

---

## Version History

- **0.1.0** (2026-02-04) - Initial release

## Links

- [Repository](https://github.com/objectstack-ai/objectos)
- [Issues](https://github.com/objectstack-ai/objectos/issues)
- [Pull Requests](https://github.com/objectstack-ai/objectos/pulls)
- [Documentation](https://docs.objectos.dev)
