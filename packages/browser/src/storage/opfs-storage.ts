/**
 * OPFS (Origin Private File System) Storage Implementation
 *
 * This module provides a file storage backend using the browser's
 * Origin Private File System API for storing user files and attachments.
 */

import type { OPFSStorage, FileMetadata, StorageUsage } from '../types/index.js';

/**
 * OPFS Storage Configuration
 */
export interface OPFSStorageConfig {
  /**
   * Root directory name
   */
  rootDir?: string;

  /**
   * Maximum storage quota in bytes (default: 100MB)
   */
  maxQuota?: number;
}

/**
 * OPFS Storage Implementation
 * Provides file system operations using the Origin Private File System API
 */
export class OPFSStorageBackend implements OPFSStorage {
  private rootDir: string;
  private maxQuota: number;
  private rootHandle: FileSystemDirectoryHandle | null = null;

  constructor(config: OPFSStorageConfig = {}) {
    this.rootDir = config.rootDir || 'objectos-files';
    this.maxQuota = config.maxQuota || 100 * 1024 * 1024; // 100MB default
  }

  /**
   * Initialize OPFS storage
   */
  async init(): Promise<void> {
    if (typeof navigator === 'undefined' || !('storage' in navigator)) {
      throw new Error('OPFS is not supported in this environment');
    }

    try {
      const root = await navigator.storage.getDirectory();
      this.rootHandle = await root.getDirectoryHandle(this.rootDir, { create: true });
      console.log('[OPFS] Initialized successfully');
    } catch (error) {
      console.error('[OPFS] Failed to initialize:', error);
      throw new Error(`Failed to initialize OPFS: ${error}`);
    }
  }

  /**
   * Write a file to OPFS
   */
  async writeFile(path: string, data: Uint8Array | Blob): Promise<void> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized');
    }

    try {
      // Parse path and create directory structure
      const { dirHandle, fileName } = await this.ensureDirectoryPath(path);

      // Create or overwrite file
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();

      if (data instanceof Blob) {
        await writable.write(data);
      } else {
        // Convert Uint8Array to Blob
        await writable.write(new Blob([data.buffer as ArrayBuffer]));
      }
      await writable.close();

      console.log(`[OPFS] Wrote file: ${path}`);
    } catch (error) {
      console.error(`[OPFS] Failed to write file ${path}:`, error);
      throw error;
    }
  }

  /**
   * Read a file from OPFS
   */
  async readFile(path: string): Promise<Uint8Array> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized');
    }

    try {
      const { dirHandle, fileName } = await this.getDirectoryPath(path);
      const fileHandle = await dirHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();

      return new Uint8Array(buffer);
    } catch (error) {
      console.error(`[OPFS] Failed to read file ${path}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from OPFS
   */
  async deleteFile(path: string): Promise<void> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized');
    }

    try {
      const { dirHandle, fileName } = await this.getDirectoryPath(path);
      await dirHandle.removeEntry(fileName);

      console.log(`[OPFS] Deleted file: ${path}`);
    } catch (error) {
      console.error(`[OPFS] Failed to delete file ${path}:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async exists(path: string): Promise<boolean> {
    if (!this.rootHandle) {
      return false;
    }

    try {
      const { dirHandle, fileName } = await this.getDirectoryPath(path);
      await dirHandle.getFileHandle(fileName);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string = ''): Promise<string[]> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized');
    }

    try {
      const dirHandle = path ? await this.getDirectoryHandle(path) : this.rootHandle;

      const files: string[] = [];

      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          files.push(entry.name);
        }
      }

      return files;
    } catch (error) {
      console.error(`[OPFS] Failed to list files in ${path}:`, error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(path: string): Promise<FileMetadata> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized');
    }

    try {
      const { dirHandle, fileName } = await this.getDirectoryPath(path);
      const fileHandle = await dirHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();

      return {
        name: file.name,
        path: path,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
      };
    } catch (error) {
      console.error(`[OPFS] Failed to get metadata for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Get storage usage information
   */
  async getStorageUsage(): Promise<StorageUsage> {
    if (typeof navigator === 'undefined' || !('storage' in navigator)) {
      return {
        used: 0,
        quota: this.maxQuota,
        available: this.maxQuota,
      };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || this.maxQuota;

      return {
        used,
        quota,
        available: quota - used,
      };
    } catch (error) {
      console.error('[OPFS] Failed to get storage usage:', error);
      return {
        used: 0,
        quota: this.maxQuota,
        available: this.maxQuota,
      };
    }
  }

  /**
   * Get directory handle for a path, creating directories as needed
   */
  private async ensureDirectoryPath(path: string): Promise<{
    dirHandle: FileSystemDirectoryHandle;
    fileName: string;
  }> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized');
    }

    const parts = path.split('/').filter((p) => p.length > 0);
    const fileName = parts.pop() || '';

    let currentHandle = this.rootHandle;

    // Create directory structure
    for (const part of parts) {
      currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
    }

    return { dirHandle: currentHandle, fileName };
  }

  /**
   * Get directory handle for a path (without creating)
   */
  private async getDirectoryPath(path: string): Promise<{
    dirHandle: FileSystemDirectoryHandle;
    fileName: string;
  }> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized');
    }

    const parts = path.split('/').filter((p) => p.length > 0);
    const fileName = parts.pop() || '';

    let currentHandle = this.rootHandle;

    // Navigate to directory
    for (const part of parts) {
      currentHandle = await currentHandle.getDirectoryHandle(part);
    }

    return { dirHandle: currentHandle, fileName };
  }

  /**
   * Get directory handle by path
   */
  private async getDirectoryHandle(path: string): Promise<FileSystemDirectoryHandle> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized');
    }

    const parts = path.split('/').filter((p) => p.length > 0);
    let currentHandle = this.rootHandle;

    for (const part of parts) {
      currentHandle = await currentHandle.getDirectoryHandle(part);
    }

    return currentHandle;
  }

  /**
   * Clear all files in storage (use with caution!)
   */
  async clear(): Promise<void> {
    if (!this.rootHandle) {
      throw new Error('OPFS not initialized');
    }

    try {
      // Remove all entries
      for await (const entry of this.rootHandle.values()) {
        await this.rootHandle.removeEntry(entry.name, { recursive: true });
      }

      console.log('[OPFS] Cleared all files');
    } catch (error) {
      console.error('[OPFS] Failed to clear storage:', error);
      throw error;
    }
  }
}
