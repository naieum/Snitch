const fs = require('fs');
const path = require('path');

/**
 * Cross-file correlation analysis for detecting coordinated threats
 * Analyzes relationships between files to identify complex attack patterns
 */
class CrossFileAnalyzer {
  constructor() {
    this.fileRelationships = new Map();
    this.importGraph = new Map();
    this.exportGraph = new Map();
    this.sharedPatterns = new Map();
  }

  /**
   * Analyze all files for cross-file correlations
   */
  async analyzeFiles(files, findings) {
    // Build import/export relationships
    this.buildDependencyGraph(files);
    
    // Group findings by file
    const findingsByFile = this.groupFindingsByFile(findings);
    
    // Analyze cross-file correlations
    const correlations = {
      suspiciousImports: this.analyzeSuspiciousImports(files),
      coordinatedAttacks: this.detectCoordinatedAttacks(findingsByFile),
      dataFlowChains: this.analyzeDataFlowChains(findingsByFile, files),
      persistenceChains: this.detectPersistenceChains(findingsByFile, files),
      configCodeInjection: this.detectConfigCodeInjection(findingsByFile, files)
    };

    return this.enhanceFindingsWithCorrelations(findings, correlations, files);
  }

  /**
   * Build dependency graph from all files
   */
  buildDependencyGraph(files) {
    for (const file of files) {
      const imports = this.extractImports(file.content);
      const exports = this.extractExports(file.content);
      
      this.importGraph.set(file.path, imports);
      this.exportGraph.set(file.path, exports);
      
      // Build relationships
      for (const imp of imports) {
        for (const otherFile of files) {
          if (otherFile.path !== file.path && 
              this.exportsMatch(imp, otherFile.path)) {
            if (!this.fileRelationships.has(file.path)) {
              this.fileRelationships.set(file.path, []);
            }
            this.fileRelationships.get(file.path).push({
              target: otherFile.path,
              type: 'imports',
              import: imp
            });
          }
        }
      }
    }
  }

  /**
   * Extract imports from file content
   */
  extractImports(content) {
    const imports = [];
    
    // ES6 imports
    const es6ImportRegex = /import\s+(?:\{([^}]+)\}|(\*\s+as\s+\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push({
        type: 'es6',
        specifiers: match[1] || match[2] || match[3],
        source: match[4],
        line: this.getLineNumber(content, match.index)
      });
    }

    // CommonJS imports
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push({
        type: 'commonjs',
        specifiers: '*',
        source: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    // Dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push({
        type: 'dynamic',
        specifiers: '*',
        source: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    return imports;
  }

  /**
   * Extract exports from file content
   */
  extractExports(content) {
    const exports = [];
    
    // ES6 exports
    const es6ExportRegex = /export\s+(?:\{([^}]+)\}|(?:default|class|function|const|let|var)\s+(\w+))/g;
    let match;
    while ((match = es6ExportRegex.exec(content)) !== null) {
      exports.push({
        type: 'es6',
        name: match[1] || match[2],
        line: this.getLineNumber(content, match.index)
      });
    }

    // CommonJS exports
    const moduleExportsRegex = /(?:module\.exports\s*=|exports\.)([^;]+)/g;
    while ((match = moduleExportsRegex.exec(content)) !== null) {
      exports.push({
        type: 'commonjs',
        name: match[1],
        line: this.getLineNumber(content, match.index)
      });
    }

    return exports;
  }

  /**
   * Check if exports match import
   */
  exportsMatch(imp, filePath) {
    const exports = this.exportGraph.get(filePath);
    if (!exports) return false;
    
    const impSource = imp.source.replace(/\.(js|ts|jsx|tsx)$/, '');
    const fileName = path.basename(filePath).replace(/\.(js|ts|jsx|tsx)$/, '');
    
    return exports.some(exp => 
      exp.name === '*' || 
      exp.name === impSource || 
      exp.name === fileName
    );
  }

  /**
   * Group findings by file
   */
  groupFindingsByFile(findings) {
    const grouped = new Map();
    
    for (const finding of findings) {
      if (!grouped.has(finding.file)) {
        grouped.set(finding.file, []);
      }
      grouped.get(finding.file).push(finding);
    }
    
    return grouped;
  }

  /**
   * Analyze suspicious import patterns
   */
  analyzeSuspiciousImports(files) {
    const suspiciousImports = [];
    
    for (const file of files) {
      const imports = this.importGraph.get(file.path) || [];
      
      for (const imp of imports) {
        const suspiciousPatterns = [
          // Dynamic imports with user input
          imp.type === 'dynamic' && /user|input|data|req/i.test(imp.source),
          // Imports from suspicious sources
          /http|https|ftp|data:text/i.test(imp.source),
          // Imports from temp directories
          /\/tmp\/|\/temp\/|\/var\/tmp\//i.test(imp.source),
          // Obfuscated imports
          /[a-fA-F0-9]{20,}/.test(imp.source) || /\\u[0-9a-fA-F]{4}/g.test(imp.source)
        ];

        const isSuspicious = suspiciousPatterns.some(pattern => pattern);
        if (isSuspicious) {
          suspiciousImports.push({
            file: file.path,
            import: imp,
            reason: this.getImportSuspicionReason(imp),
            severity: 'high'
          });
        }
      }
    }
    
    return suspiciousImports;
  }

  /**
   * Get reason for import suspicion
   */
  getImportSuspicionReason(imp) {
    if (imp.type === 'dynamic' && /user|input|data/i.test(imp.source)) {
      return 'Dynamic import with user input';
    }
    if (/http|https|ftp/i.test(imp.source)) {
      return 'Import from remote URL';
    }
    if (/\/tmp\/|\/temp\/|\/var\/tmp\//i.test(imp.source)) {
      return 'Import from temporary directory';
    }
    if (/[a-fA-F0-9]{20,}/.test(imp.source) || /\\u[0-9a-fA-F]{4}/g.test(imp.source)) {
      return 'Obfuscated import source';
    }
    return 'Unknown suspicious pattern';
  }

  /**
   * Detect coordinated attacks across files
   */
  detectCoordinatedAttacks(findingsByFile) {
    const coordinated = [];
    
    // Check for attack chains
    const attackChains = this.findAttackChains(findingsByFile);
    if (attackChains.length > 0) {
      coordinated.push({
        type: 'attack_chain',
        chains: attackChains,
        severity: 'critical',
        description: 'Multiple files implementing coordinated attack'
      });
    }

    // Check for distributed exfiltration
    const exfiltrationChains = this.findExfiltrationChains(findingsByFile);
    if (exfiltrationChains.length > 0) {
      coordinated.push({
        type: 'distributed_exfiltration',
        chains: exfiltrationChains,
        severity: 'critical',
        description: 'Data exfiltration distributed across multiple files'
      });
    }

    return coordinated;
  }

  /**
   * Find attack chains
   */
  findAttackChains(findingsByFile) {
    const chains = [];
    
    // Group by attack type
    const attacksByType = new Map();
    
    for (const [filePath, fileFindings] of findingsByFile) {
      for (const finding of fileFindings) {
        if (!attacksByType.has(finding.category)) {
          attacksByType.set(finding.category, []);
        }
        attacksByType.get(finding.category).push({
          file: filePath,
          finding: finding
        });
      }
    }

    // Find chains (same attack type in multiple related files)
    for (const [attackType, attacks] of attacksByType) {
      if (attacks.length >= 2) {
        // Check if files are related
        const relatedFiles = this.areFilesRelated(attacks.map(a => a.file));
        if (relatedFiles) {
          chains.push({
            type: attackType,
            files: attacks.map(a => ({ path: a.file, line: a.finding.line })),
            severity: 'critical'
          });
        }
      }
    }

    return chains;
  }

  /**
   * Find exfiltration chains
   */
  findExfiltrationChains(findingsByFile) {
    const chains = [];
    const exfiltrationFindings = [];
    
    // Collect all data exfiltration findings
    for (const [filePath, fileFindings] of findingsByFile) {
      const exfiltrationInFile = fileFindings.filter(f => 
        f.category.includes('Exfiltration') || 
        f.category.includes('Credential') ||
        f.evidence.includes('fetch') ||
        f.evidence.includes('process.env')
      );
      
      if (exfiltrationInFile.length > 0) {
        exfiltrationFindings.push({
          file: filePath,
          findings: exfiltrationInFile
        });
      }
    }

    // Check if exfiltration targets multiple destinations
    const destinations = new Set();
    for (const file of exfiltrationFindings) {
      for (const finding of file.findings) {
        const dest = this.extractDestination(finding.evidence);
        if (dest) destinations.add(dest);
      }
    }

    if (destinations.size >= 2) {
      chains.push({
        type: 'multi_destination_exfiltration',
        files: exfiltrationFindings.map(f => ({ path: f.file, count: f.findings.length })),
        destinations: Array.from(destinations),
        severity: 'critical'
      });
    }

    return chains;
  }

  /**
   * Extract destination from evidence
   */
  extractDestination(evidence) {
    // Extract URLs/domains from evidence
    const urlRegex = /https?:\/\/([^\/\s]+)/i;
    const match = evidence.match(urlRegex);
    return match ? match[1] : null;
  }

  /**
   * Check if files are related
   */
  areFilesRelated(filePaths) {
    if (filePaths.length < 2) return false;
    
    // Check direct imports/exports
    for (let i = 0; i < filePaths.length; i++) {
      const file1 = filePaths[i];
      const file2 = filePaths[(i + 1) % filePaths.length];
      
      if (this.fileRelationships.has(file1)) {
        const relations = this.fileRelationships.get(file1);
        const hasRelation = relations.some(rel => rel.target === file2);
        if (hasRelation) return true;
      }
    }

    // Check if files are in same directory/module
    const dirs = filePaths.map(fp => path.dirname(fp));
    const uniqueDirs = [...new Set(dirs)];
    if (uniqueDirs.length === 1 && uniqueDirs.length < filePaths.length) {
      return true; // Multiple files in same directory
    }

    // Check for naming patterns
    const baseNames = filePaths.map(fp => path.basename(fp));
    const namePatterns = baseNames.map(name => name.replace(/[\d_]+$/, '')); // Remove suffixes
    const uniquePatterns = [...new Set(namePatterns)];
    if (uniquePatterns.length < baseNames.length && uniquePatterns.length < baseNames.length / 2) {
      return true; // Similar naming patterns suggest coordination
    }

    return false;
  }

  /**
   * Analyze data flow chains
   */
  analyzeDataFlowChains(findingsByFile, files) {
    const chains = [];
    
    // Trace data flow from user input to external calls
    const dataFlowPaths = this.traceDataFlow(findingsByFile, files);
    
    for (const path of dataFlowPaths) {
      if (path.length >= 3) { // Input → Processing → External
        chains.push({
          type: 'data_flow_chain',
          path: path,
          severity: 'high'
        });
      }
    }

    return chains;
  }

  /**
   * Trace data flow through files
   */
  traceDataFlow(findingsByFile, files) {
    const paths = [];
    
    // This is a simplified implementation
    // In practice, this would build a full data flow graph
    
    for (const [filePath, fileFindings] of findingsByFile) {
      const userInputFindings = fileFindings.filter(f => 
        f.evidence.includes('req.') ||
        f.evidence.includes('request.') ||
        f.evidence.includes('user') ||
        f.evidence.includes('input')
      );
      
      const externalCallFindings = fileFindings.filter(f => 
        f.evidence.includes('fetch') ||
        f.evidence.includes('http') ||
        f.evidence.includes('axios') ||
        f.evidence.includes('webhook')
      );
      
      if (userInputFindings.length > 0 && externalCallFindings.length > 0) {
        // Build path through imports/exports
        const path = this.buildDataFlowPath(filePath, userInputFindings, externalCallFindings, files);
        if (path) {
          paths.push(path);
        }
      }
    }

    return paths;
  }

  /**
   * Build data flow path through related files
   */
  buildDataFlowPath(startFile, userInputFindings, externalCallFindings, allFiles) {
    // Simplified path building
    const path = [
      { file: startFile, type: 'input', findings: userInputFindings }
    ];
    
    // Follow imports to find processing files
    const imports = this.importGraph.get(startFile) || [];
    for (const imp of imports) {
      const targetFile = this.findFileByImport(imp.source, allFiles);
      if (targetFile) {
        path.push({ file: targetFile, type: 'processing', import: imp });
      }
    }
    
    // Add external calls
    if (externalCallFindings.length > 0) {
      path.push({ file: startFile, type: 'output', findings: externalCallFindings });
    }
    
    return path.length >= 2 ? path : null;
  }

  /**
   * Find file by import
   */
  findFileByImport(importSource, files) {
    const cleanSource = importSource.replace(/\.(js|ts|jsx|tsx)$/, '');
    return files.find(file => {
      const fileName = path.basename(file.path).replace(/\.(js|ts|jsx|tsx)$/, '');
      return fileName === cleanSource || path.basename(file.path) === importSource;
    });
  }

  /**
   * Detect persistence chains
   */
  detectPersistenceChains(findingsByFile, files) {
    const chains = [];
    
    // Look for persistence patterns across files
    const persistenceFindings = [];
    
    for (const [filePath, fileFindings] of findingsByFile) {
      const persistFindings = fileFindings.filter(f => 
        f.category.includes('Persistence') ||
        f.category.includes('Backdoor') ||
        f.evidence.includes('startup') ||
        f.evidence.includes('boot') ||
        f.evidence.includes('install')
      );
      
      if (persistFindings.length > 0) {
        persistenceFindings.push({
          file: filePath,
          findings: persistFindings
        });
      }
    }

    // Check for multi-file persistence strategies
    if (persistenceFindings.length >= 2) {
      chains.push({
        type: 'multi_file_persistence',
        strategies: persistenceFindings.map(p => ({
          file: p.file,
          techniques: p.findings.map(f => this.extractPersistenceTechnique(f.evidence))
        })),
        severity: 'critical'
      });
    }

    return chains;
  }

  /**
   * Extract persistence technique
   */
  extractPersistenceTechnique(evidence) {
    if (evidence.includes('startup') || evidence.includes('boot')) return 'startup_persistence';
    if (evidence.includes('install') || evidence.includes('deploy')) return 'installation_persistence';
    if (evidence.includes('registry') || evidence.includes('cron')) return 'system_persistence';
    if (evidence.includes('service') || evidence.includes('daemon')) return 'service_persistence';
    return 'unknown_persistence';
  }

  /**
   * Detect config file code injection
   */
  detectConfigCodeInjection(findingsByFile, files) {
    const injections = [];
    
    // Find config files with suspicious findings
    for (const [filePath, fileFindings] of findingsByFile) {
      if (this.isConfigFile(filePath) && fileFindings.length > 0) {
        injections.push({
          configFile: filePath,
          findings: fileFindings,
          severity: 'high'
        });
      }
    }

    // Check for config file manipulation
    const configManipulation = this.detectConfigManipulation(findingsByFile, files);
    if (configManipulation) {
      injections.push(configManipulation);
    }

    return injections;
  }

  /**
   * Check if file is configuration file
   */
  isConfigFile(filePath) {
    const configPatterns = [
      /config\./i,
      /\.env/i,
      /settings\./i,
      /\.config\./i,
      /\/etc\//i,
      /\.json$/i,
      /\.yml$/i,
      /\.yaml$/i,
      /\.ini$/i,
      /\.conf$/i
    ];

    return configPatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * Detect config file manipulation
   */
  detectConfigManipulation(findingsByFile, files) {
    // Look for code files that read/modify config files
    for (const [filePath, fileFindings] of findingsByFile) {
      if (!this.isConfigFile(filePath)) {
        for (const finding of fileFindings) {
          if (finding.evidence.includes('config') ||
              finding.evidence.includes('.env') ||
              finding.evidence.includes('settings')) {
            return {
              type: 'config_manipulation',
              sourceFile: filePath,
              targetConfig: this.extractConfigTarget(finding.evidence),
              finding: finding,
              severity: 'critical'
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract config target from evidence
   */
  extractConfigTarget(evidence) {
    const configRegex = /['"]([^'"]*\.(?:env|config|settings|json|yml|yaml|ini|conf))['"]/i;
    const match = evidence.match(configRegex);
    return match ? match[1] : null;
  }

  /**
   * Enhance findings with correlation data
   */
  enhanceFindingsWithCorrelations(findings, correlations, files) {
    return findings.map(finding => {
      const enhanced = { ...finding, correlations: [] };

      // Add suspicious import correlations
      for (const imp of correlations.suspiciousImports) {
        if (imp.file === finding.file) {
          enhanced.correlations.push({
            type: 'suspicious_import',
            details: imp,
            severity: imp.severity
          });
        }
      }

      // Add coordinated attack correlations
      for (const attack of correlations.coordinatedAttacks) {
        if (attack.chains.some(chain => chain.files.some(f => f.path === finding.file))) {
          enhanced.correlations.push({
            type: 'coordinated_attack',
            details: attack,
            severity: attack.severity
          });
        }
      }

      // Add data flow chain correlations
      for (const chain of correlations.dataFlowChains) {
        if (chain.path.some(step => step.file === finding.file)) {
          enhanced.correlations.push({
            type: 'data_flow_chain',
            details: chain,
            severity: chain.severity
          });
        }
      }

      // Add persistence chain correlations
      for (const persistence of correlations.persistenceChains) {
        if (persistence.strategies.some(strategy => strategy.file === finding.file)) {
          enhanced.correlations.push({
            type: 'persistence_chain',
            details: persistence,
            severity: persistence.severity
          });
        }
      }

      // Add config injection correlations
      for (const injection of correlations.configCodeInjection) {
        if (injection.sourceFile === finding.file || injection.configFile === finding.file) {
          enhanced.correlations.push({
            type: 'config_code_injection',
            details: injection,
            severity: injection.severity
          });
        }
      }

      return enhanced;
    });
  }

  /**
   * Get line number from index
   */
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }
}

module.exports = CrossFileAnalyzer;