# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and changelog management.

## Adding a Changeset

```bash
pnpm changeset
```

Follow the prompts to select packages and describe the change.

## Versioning

```bash
pnpm version
```

This updates package versions and generates `CHANGELOG.md` files.

## Publishing

```bash
pnpm release
```

This builds all packages and publishes them to the registry.
