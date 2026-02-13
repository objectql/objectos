/**
 * Plugin Registry (O.2.1)
 *
 * In-memory registry for plugin discovery, search, and metadata management.
 * Supports registration, keyword/author search, pagination, and statistics.
 */

import type {
  PluginManifest,
  PluginRegistryEntry,
  PluginSearchOptions,
  PluginSearchResult,
  PluginVersionInfo,
  RegistryStats,
} from './types.js';
import { validateManifest } from './manifest-validator.js';

/**
 * Plugin Registry — in-memory storage and search for plugin manifests
 */
export class PluginRegistry {
  /**
   * Map of plugin ID → array of registry entries (one per version, newest first)
   */
  private plugins: Map<string, PluginRegistryEntry[]> = new Map();

  /**
   * Register a plugin manifest in the registry
   *
   * @param manifest - The plugin manifest to register
   * @returns The created registry entry
   * @throws If the manifest is invalid or the exact version already exists
   */
  register(manifest: PluginManifest): PluginRegistryEntry {
    const errors = validateManifest(manifest);
    if (errors.length > 0) {
      throw new Error(`Invalid manifest: ${errors.join('; ')}`);
    }

    const existing = this.plugins.get(manifest.id) ?? [];

    // Check for duplicate version
    if (existing.some((e) => e.manifest.version === manifest.version)) {
      throw new Error(`Plugin "${manifest.id}" version ${manifest.version} is already registered`);
    }

    const now = new Date().toISOString();
    const entry: PluginRegistryEntry = {
      manifest: { ...manifest },
      downloads: 0,
      rating: 0,
      publishedAt: existing.length === 0 ? now : existing[existing.length - 1].publishedAt,
      updatedAt: now,
      verified: false,
      featured: false,
    };

    existing.push(entry);
    this.plugins.set(manifest.id, existing);

    return entry;
  }

  /**
   * Search the registry with optional filters and pagination
   */
  search(query?: string, options: PluginSearchOptions = {}): PluginSearchResult {
    const {
      keyword,
      author,
      page = 1,
      pageSize = 20,
      sortBy = 'downloads',
      sortOrder = 'desc',
    } = options;

    // Collect latest entry per plugin
    let results: PluginRegistryEntry[] = [];
    for (const entries of this.plugins.values()) {
      if (entries.length === 0) continue;
      const latest = entries[entries.length - 1];
      results.push(latest);
    }

    // Apply text query filter
    if (query) {
      const q = query.toLowerCase();
      results = results.filter((e) => {
        const m = e.manifest;
        return (
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          (m.keywords ?? []).some((k) => k.toLowerCase().includes(q))
        );
      });
    }

    // Filter by keyword
    if (keyword) {
      const kw = keyword.toLowerCase();
      results = results.filter((e) =>
        (e.manifest.keywords ?? []).some((k) => k.toLowerCase() === kw),
      );
    }

    // Filter by author
    if (author) {
      const a = author.toLowerCase();
      results = results.filter((e) => e.manifest.author.toLowerCase() === a);
    }

    // Sort
    results.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'downloads':
          cmp = a.downloads - b.downloads;
          break;
        case 'rating':
          cmp = a.rating - b.rating;
          break;
        case 'name':
          cmp = a.manifest.name.localeCompare(b.manifest.name);
          break;
        case 'updatedAt':
          cmp = a.updatedAt.localeCompare(b.updatedAt);
          break;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    // Paginate
    const total = results.length;
    const start = (page - 1) * pageSize;
    const paged = results.slice(start, start + pageSize);

    return {
      plugins: paged,
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
    };
  }

  /**
   * Get the latest version of a plugin by ID
   */
  getPlugin(id: string): PluginRegistryEntry | undefined {
    const entries = this.plugins.get(id);
    if (!entries || entries.length === 0) return undefined;
    return entries[entries.length - 1];
  }

  /**
   * Get a specific version of a plugin
   */
  getPluginVersion(id: string, version: string): PluginRegistryEntry | undefined {
    const entries = this.plugins.get(id);
    if (!entries) return undefined;
    return entries.find((e) => e.manifest.version === version);
  }

  /**
   * Get all registered versions of a plugin
   */
  getVersions(id: string): PluginVersionInfo[] {
    const entries = this.plugins.get(id);
    if (!entries) return [];

    return entries.map((e) => ({
      version: e.manifest.version,
      releasedAt: e.updatedAt,
      compatibility: e.manifest.engine,
    }));
  }

  /**
   * List all featured plugins
   */
  listFeatured(): PluginRegistryEntry[] {
    const featured: PluginRegistryEntry[] = [];
    for (const entries of this.plugins.values()) {
      if (entries.length === 0) continue;
      const latest = entries[entries.length - 1];
      if (latest.featured) {
        featured.push(latest);
      }
    }
    return featured;
  }

  /**
   * List plugins by category (keyword)
   */
  listByCategory(category: string): PluginRegistryEntry[] {
    const cat = category.toLowerCase();
    const results: PluginRegistryEntry[] = [];

    for (const entries of this.plugins.values()) {
      if (entries.length === 0) continue;
      const latest = entries[entries.length - 1];
      if ((latest.manifest.keywords ?? []).some((k) => k.toLowerCase() === cat)) {
        results.push(latest);
      }
    }

    return results;
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    let totalVersions = 0;
    let featuredCount = 0;
    let verifiedCount = 0;

    for (const entries of this.plugins.values()) {
      totalVersions += entries.length;
      if (entries.length > 0) {
        const latest = entries[entries.length - 1];
        if (latest.featured) featuredCount++;
        if (latest.verified) verifiedCount++;
      }
    }

    return {
      totalPlugins: this.plugins.size,
      totalVersions,
      featuredCount,
      verifiedCount,
    };
  }

  /**
   * Mark a plugin as featured
   */
  setFeatured(id: string, featured: boolean): void {
    const entries = this.plugins.get(id);
    if (entries && entries.length > 0) {
      entries[entries.length - 1].featured = featured;
    }
  }

  /**
   * Mark a plugin as verified
   */
  setVerified(id: string, verified: boolean): void {
    const entries = this.plugins.get(id);
    if (entries && entries.length > 0) {
      entries[entries.length - 1].verified = verified;
    }
  }

  /**
   * Increment the download counter for a plugin
   */
  incrementDownloads(id: string): void {
    const entries = this.plugins.get(id);
    if (entries && entries.length > 0) {
      entries[entries.length - 1].downloads++;
    }
  }
}
