#!/usr/bin/env ts-node
/**
 * Audit Script for @objectstack/spec Compliance
 * 
 * This script scans all packages in the monorepo to ensure they comply
 * with @objectstack/spec protocol requirements.
 */

import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  name: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface ComplianceIssue {
  package: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
}

interface AuditResult {
  package: string;
  packagePath: string;
  issues: ComplianceIssue[];
  hasSpecDependency: boolean;
  hasRuntimeDependency: boolean;
  hasPluginImplementation: boolean;
  specImports: string[];
}

class SpecComplianceAuditor {
  private packagesDir: string;
  private results: AuditResult[] = [];
  private issues: ComplianceIssue[] = [];

  constructor(rootDir: string) {
    this.packagesDir = path.join(rootDir, 'packages');
  }

  /**
   * Find all package.json files in the packages directory
   */
  private findPackages(): string[] {
    const packages: string[] = [];
    
    const scanDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
          scanDir(fullPath);
        } else if (entry.name === 'package.json') {
          packages.push(fullPath);
        }
      }
    };
    
    scanDir(this.packagesDir);
    return packages;
  }

  /**
   * Read and parse package.json
   */
  private readPackageJson(packagePath: string): PackageJson | null {
    try {
      const content = fs.readFileSync(packagePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error reading ${packagePath}:`, error);
      return null;
    }
  }

  /**
   * Check if package has @objectstack/spec dependency
   */
  private hasSpecDependency(pkg: PackageJson): boolean {
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    return '@objectstack/spec' in allDeps;
  }

  /**
   * Check if package has @objectstack/runtime dependency
   */
  private hasRuntimeDependency(pkg: PackageJson): boolean {
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    return '@objectstack/runtime' in allDeps;
  }

  /**
   * Find all TypeScript files in package directory
   */
  private findTypeScriptFiles(packageDir: string): string[] {
    const tsFiles: string[] = [];
    
    const scanDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
          scanDir(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          tsFiles.push(fullPath);
        }
      }
    };
    
    const srcDir = path.join(packageDir, 'src');
    scanDir(srcDir);
    return tsFiles;
  }

  /**
   * Extract @objectstack/spec imports from TypeScript file
   */
  private extractSpecImports(filePath: string): string[] {
    const imports: string[] = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const importRegex = /import\s+.*?from\s+['"]@objectstack\/spec[^'"]*['"]/g;
      const matches = content.match(importRegex);
      
      if (matches) {
        imports.push(...matches);
      }
    } catch (error) {
      // Ignore read errors
    }
    
    return imports;
  }

  /**
   * Check if package has Plugin implementation
   */
  private hasPluginImplementation(packageDir: string): boolean {
    const tsFiles = this.findTypeScriptFiles(packageDir);
    
    for (const file of tsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Check for Plugin interface implementation
        if (content.includes('implements Plugin')) {
          return true;
        }
        
        // Check for Plugin class or type import
        if (content.includes('Plugin') && 
            (content.includes('from \'@objectstack/runtime\'') || 
             content.includes('from "@objectstack/runtime"'))) {
          return true;
        }
      } catch (error) {
        // Ignore read errors
      }
    }
    
    return false;
  }

  /**
   * Audit a single package
   */
  private auditPackage(packagePath: string): AuditResult {
    const packageDir = path.dirname(packagePath);
    const pkg = this.readPackageJson(packagePath);
    
    if (!pkg) {
      return {
        package: 'unknown',
        packagePath,
        issues: [{
          package: packagePath,
          severity: 'error',
          category: 'parsing',
          message: 'Failed to parse package.json'
        }],
        hasSpecDependency: false,
        hasRuntimeDependency: false,
        hasPluginImplementation: false,
        specImports: []
      };
    }

    const result: AuditResult = {
      package: pkg.name,
      packagePath,
      issues: [],
      hasSpecDependency: this.hasSpecDependency(pkg),
      hasRuntimeDependency: this.hasRuntimeDependency(pkg),
      hasPluginImplementation: this.hasPluginImplementation(packageDir),
      specImports: []
    };

    // Collect all spec imports
    const tsFiles = this.findTypeScriptFiles(packageDir);
    for (const file of tsFiles) {
      const imports = this.extractSpecImports(file);
      result.specImports.push(...imports);
    }

    // Check compliance rules
    this.checkCompliance(result, pkg);

    return result;
  }

  /**
   * Check compliance rules for a package
   */
  private checkCompliance(result: AuditResult, pkg: PackageJson): void {
    const isPlugin = result.package.includes('plugin-') || result.hasPluginImplementation;
    const isAdapter = result.package.includes('adapter-');
    
    // Rule 1: Plugins should have @objectstack/runtime dependency
    if (isPlugin && !result.hasRuntimeDependency) {
      result.issues.push({
        package: result.package,
        severity: 'error',
        category: 'dependencies',
        message: 'Plugin package must declare @objectstack/runtime dependency'
      });
    }

    // Rule 2: Packages using spec imports should declare spec dependency
    if (result.specImports.length > 0 && !result.hasSpecDependency) {
      result.issues.push({
        package: result.package,
        severity: 'warning',
        category: 'dependencies',
        message: `Package imports from @objectstack/spec but doesn't declare it as dependency. Found ${result.specImports.length} import(s)`
      });
    }

    // Rule 3: Plugin packages should have Plugin implementation
    if (isPlugin && !result.hasPluginImplementation) {
      result.issues.push({
        package: result.package,
        severity: 'warning',
        category: 'implementation',
        message: 'Plugin package should implement Plugin interface'
      });
    }

    // Rule 4: Check version consistency
    if (result.hasSpecDependency) {
      const specVersion = pkg.dependencies?.['@objectstack/spec'] || 
                          pkg.devDependencies?.['@objectstack/spec'] ||
                          pkg.peerDependencies?.['@objectstack/spec'];
      
      if (specVersion !== '1.0.0' && specVersion !== '^1.0.0') {
        result.issues.push({
          package: result.package,
          severity: 'info',
          category: 'dependencies',
          message: `@objectstack/spec version is ${specVersion}, expected 1.0.0 or ^1.0.0`
        });
      }
    }

    // Rule 5: Check runtime version consistency
    if (result.hasRuntimeDependency) {
      const runtimeVersion = pkg.dependencies?.['@objectstack/runtime'] || 
                             pkg.devDependencies?.['@objectstack/runtime'] ||
                             pkg.peerDependencies?.['@objectstack/runtime'];
      
      if (runtimeVersion !== '^1.0.0' && runtimeVersion !== '1.0.0') {
        result.issues.push({
          package: result.package,
          severity: 'info',
          category: 'dependencies',
          message: `@objectstack/runtime version is ${runtimeVersion}, expected ^1.0.0`
        });
      }
    }
  }

  /**
   * Run the audit
   */
  public async audit(): Promise<void> {
    console.log('🔍 Scanning packages for @objectstack/spec compliance...\n');
    
    const packages = this.findPackages();
    console.log(`Found ${packages.length} packages to audit\n`);

    for (const packagePath of packages) {
      const result = this.auditPackage(packagePath);
      this.results.push(result);
      this.issues.push(...result.issues);
    }

    this.printResults();
  }

  /**
   * Print audit results
   */
  private printResults(): void {
    console.log('='.repeat(80));
    console.log('AUDIT RESULTS');
    console.log('='.repeat(80));
    console.log();

    // Summary
    const totalPackages = this.results.length;
    const packagesWithIssues = this.results.filter(r => r.issues.length > 0).length;
    const totalIssues = this.issues.length;
    const errors = this.issues.filter(i => i.severity === 'error').length;
    const warnings = this.issues.filter(i => i.severity === 'warning').length;
    const infos = this.issues.filter(i => i.severity === 'info').length;

    console.log('📊 Summary:');
    console.log(`   Total packages: ${totalPackages}`);
    console.log(`   Packages with issues: ${packagesWithIssues}`);
    console.log(`   Total issues: ${totalIssues}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Warnings: ${warnings}`);
    console.log(`   - Info: ${infos}`);
    console.log();

    // Package details
    console.log('📦 Package Details:');
    console.log();

    for (const result of this.results) {
      const hasIssues = result.issues.length > 0;
      const icon = hasIssues ? '❌' : '✅';
      
      console.log(`${icon} ${result.package}`);
      console.log(`   Path: ${path.relative(process.cwd(), result.packagePath)}`);
      console.log(`   Has @objectstack/spec: ${result.hasSpecDependency ? '✓' : '✗'}`);
      console.log(`   Has @objectstack/runtime: ${result.hasRuntimeDependency ? '✓' : '✗'}`);
      console.log(`   Has Plugin implementation: ${result.hasPluginImplementation ? '✓' : '✗'}`);
      console.log(`   Spec imports: ${result.specImports.length}`);
      
      if (result.issues.length > 0) {
        console.log('   Issues:');
        for (const issue of result.issues) {
          const severityIcon = issue.severity === 'error' ? '🔴' : 
                              issue.severity === 'warning' ? '🟡' : '🔵';
          console.log(`      ${severityIcon} [${issue.category}] ${issue.message}`);
        }
      }
      console.log();
    }

    // Exit code based on errors
    if (errors > 0) {
      console.log(`\n❌ Audit failed with ${errors} error(s)\n`);
      process.exit(1);
    } else if (warnings > 0) {
      console.log(`\n⚠️  Audit completed with ${warnings} warning(s)\n`);
    } else {
      console.log('\n✅ All packages are compliant!\n');
    }
  }
}

// Run the auditor
const rootDir = process.cwd();
const auditor = new SpecComplianceAuditor(rootDir);
auditor.audit().catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});
