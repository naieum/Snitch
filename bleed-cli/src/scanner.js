const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Load enhanced signatures from external file
const signatures = require('./signatures.json');

// Load new analysis modules
const SemanticAnalyzer = require('./semantic-analyzer');
const FeedbackSystem = require('./feedback-system');
const CrossFileAnalyzer = require('./cross-file-analyzer');

// Convert signatures to internal pattern format
const MALICIOUS_PATTERNS = [];

// Helper function to convert signature patterns to regex
function convertSignaturesToPatterns() {
  const categories = signatures.categories;
  
  for (const [categoryName, categoryData] of Object.entries(categories)) {
    const patternObj = {
      name: categoryName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      severity: categoryData.severity,
      patterns: []
    };
    
    for (const [patternName, patternData] of Object.entries(categoryData.patterns)) {
      try {
        const regex = new RegExp(patternData.regex, 'gi');
        patternObj.patterns.push(regex); // Just store the regex directly
      } catch (e) {
        console.warn(`Invalid regex in pattern ${patternName}: ${e.message}`);
      }
    }
    
    MALICIOUS_PATTERNS.push(patternObj);
  }
}

// Convert signatures on load
convertSignaturesToPatterns();

// Legacy patterns for backward compatibility
const LEGACY_PATTERNS = [
  {
    name: 'Crypto Drainer',
    severity: 'critical',
    patterns: [
      // Wallet draining functions with actual ETH addresses
      /const\s+\w*drain\w*\s*=\s*["']0x[a-fA-F0-9]{40}["']/i,
      /sendTransaction\s*\(\s*\{[^}]*to\s*:\s*["']0x[a-fA-F0-9]{40}["'][^}]*value[^}]*\}/i,
      /approve\s*\(\s*["']0x[a-fA-F0-9]{40}["']\s*,\s*(?:max|MAX|unlimited|0x[fF]{40})/i,
      // Hardcoded wallet addresses with transfer/sending context
      /to\s*:\s*["']0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb["']/i, // Known malicious
      /to\s*:\s*["']0x[dD][eE][aA][dD][^"']*["']/i, // Dead address but in transfer
    ]
  },
  {
    name: 'Credential Exfiltration',
    severity: 'critical',
    patterns: [
      // POST to suspicious domains with env vars
      /fetch\s*\(\s*["']https:\/\/(?:webhook\.site|requestbin|ngrok|termbin|0x0\.st)[^"']*["'][^)]*process\.env/s,
      /axios\.post\s*\(\s*["']https:\/\/(?:webhook\.site|requestbin|ngrok)[^"']*["'][^)]*process\.env/s,
      // Sending all env vars to external domain
      /body[^:]*:\s*JSON\.stringify\s*\(\s*process\.env\s*\)/,
      // Hardcoded API keys in actual code (not comments)
      /const\s+\w*(?:api[_-]?key|secret|token)\w*\s*=\s*["']sk-[a-zA-Z0-9]{20,}["']/i,
    ]
  },
  {
    name: 'Backdoor - Remote Code Execution',
    severity: 'critical',
    patterns: [
      // eval with user input or dynamic content
      /eval\s*\(\s*(?:req\.|request\.|userInput|input|data\[|atob|Buffer\.from)/i,
      // new Function with dynamic content
      /new\s+Function\s*\(\s*(?:req\.|request\.|userInput|input|atob)/i,
      // Reverse shell patterns
      /(?:spawn|exec)\s*\(\s*["']\/(?:bin\/sh|bin\/bash)["']/i,
      /net\.createConnection\s*\(\s*\d+\s*,\s*["']\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}["']/i,
      // Child process execution with user input
      /(?:spawn|exec|execSync)\s*\([^)]*\+\s*(?:req\.|request\.|userInput|input)/i,
    ]
  },
  {
    name: 'Suspicious Network',
    severity: 'high',
    patterns: [
      // Requests to .onion or dark web
      /["']https?:\/\/[^"']+\.onion["']/i,
      // Suspicious file extensions being downloaded
      /fetch\s*\(\s*["']https?:\/\/[^"']+\.(?:exe|dll|bin|sh)\??["']/i,
    ]
  },
  {
    name: 'Obfuscated Code',
    severity: 'high',
    patterns: [
      // Hex encoded strings > 100 chars (likely payload)
      /["']0x([0-9a-fA-F]{2}){100,}["']/,
      // Multiple layers of encoding
      /atob\s*\(\s*atob\s*\(/i,
      /eval\s*\(\s*atob\s*\(\s*atob/s,
    ]
  }
];

// Combine all patterns
const ALL_PATTERNS = [...MALICIOUS_PATTERNS, ...LEGACY_PATTERNS];

// Safe contexts that reduce or eliminate matches
const SAFE_CONTEXTS = [
  { pattern: /\/\/.*$/m, reason: 'in_comment' },
  { pattern: /#.*$/m, reason: 'in_comment' },
  { pattern: /^\s*\*.*$/m, reason: 'in_doc' },
  { pattern: /^\s*<!--.*$/m, reason: 'in_html_comment' },
  { pattern: /```[\s\S]*?```/, reason: 'in_code_block' },
  { pattern: /`[^`]*`/, reason: 'in_inline_code' },
];

// Enhanced context analysis for agentic threats
class AgenticThreatAnalyzer {
  constructor() {
    this.threatWeights = signatures.agenticThreatWeights || {};
    this.contextModifiers = signatures.contextualModifiers || {};
  }

  analyzeContext(filePath, content, matchIndex) {
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    
    let contextScore = 1.0;
    
    // File type context
    if (fileName.includes('system') || fileName.includes('kernel')) {
      contextScore *= this.contextModifiers.system_file || 1.5;
    }
    if (fileName.includes('config') || fileName.includes('settings')) {
      contextScore *= this.contextModifiers.configuration || 1.3;
    }
    if (fileName.includes('init') || fileName.includes('startup') || fileName.includes('boot')) {
      contextScore *= this.contextModifiers.startup_script || 1.8;
    }
    if (dirName.includes('core') || dirName.includes('lib')) {
      contextScore *= this.contextModifiers.core_module || 1.6;
    }
    if (fileName.includes('network') || fileName.includes('http') || fileName.includes('api')) {
      contextScore *= this.contextModifiers.network_handler || 1.4;
    }
    
    // Check for safe patterns in content
    const safePatterns = signatures.safePatterns || [];
    for (const safePattern of safePatterns) {
      if (content.toLowerCase().includes(safePattern.toLowerCase())) {
        contextScore *= 0.5; // Reduce score if safe patterns found
        break;
      }
    }
    
    return contextScore;
  }

  calculateThreatScore(category, match, contextScore) {
    let baseScore = match.weight || 0.5;
    
    // Apply threat-specific weights
    if (this.threatWeights[category]) {
      baseScore *= this.threatWeights[category];
    }
    
    // Apply context modifier
    baseScore *= contextScore;
    
    return Math.min(baseScore, 2.0); // Cap at 2.0
  }

  detectMultiThreatPatterns(content) {
    const threats = [];
    
    // Detect multiple instruction override attempts
    const overrideMatches = content.match(/ignore.*?instruction/gi) || [];
    if (overrideMatches.length > 2) {
      threats.push({
        type: 'repeated_instruction_override',
        severity: 'critical',
        evidence: `Found ${overrideMatches.length} instruction override attempts`,
        score: 1.8
      });
    }
    
    // Detect encoding chains
    const encodingChains = content.match(/(atob|Buffer\.from|fromCharCode)/gi) || [];
    if (encodingChains.length > 3) {
      threats.push({
        type: 'complex_encoding_chain',
        severity: 'high',
        evidence: `Found ${encodingChains.length} encoding/decoding operations`,
        score: 1.5
      });
    }
    
    // Detect privilege escalation patterns
    const escalationKeywords = ['escalate', 'elevate', 'privilege', 'admin', 'root'];
    const escalationCount = escalationKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    ).length;
    
    if (escalationCount >= 2) {
      threats.push({
        type: 'privilege_escalation_indicators',
        severity: 'critical',
        evidence: `Found ${escalationCount} privilege escalation keywords`,
        score: 1.7
      });
    }
    
    return threats;
  }
}

class Scanner {
  constructor(ui, options = {}) {
    this.ui = ui;
    this.findings = [];
    this.filesScanned = 0;
    this.threatAnalyzer = new AgenticThreatAnalyzer();
    this.semanticAnalyzer = new SemanticAnalyzer();
    this.feedbackSystem = new FeedbackSystem();
    this.crossFileAnalyzer = new CrossFileAnalyzer();
    this.options = {
      enableSemanticAnalysis: options.semantic !== false,
      enableFeedback: options.feedback !== false,
      enableCrossFileAnalysis: options.crossFile !== false,
      sensitivity: options.sensitivity || 'medium',
      ...options
    };
  }

  async scan(targetPath, options = {}) {
    this.ui.header('Initializing Security Scan');
    
    const resolvedPath = path.resolve(targetPath);
    
    if (!fs.existsSync(resolvedPath)) {
      this.ui.error(`Path not found: ${resolvedPath}`);
      process.exit(1);
    }

    const stats = fs.statSync(resolvedPath);
    this.ui.info(`Target: ${resolvedPath}`);
    
    if (!options.quiet) {
      const confirmed = await this.ui.confirm('Proceed with scan?');
      if (!confirmed) {
        this.ui.info('Scan cancelled');
        return;
      }
    }

    this.ui.header('Scanning Files');
    const startTime = Date.now();

    if (stats.isDirectory()) {
      await this.scanDirectory(resolvedPath, options);
    } else {
      await this.scanFile(resolvedPath, []);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const riskScore = this.calculateRiskScore();

    if (options.output === 'json') {
      this.outputJson(duration, riskScore, resolvedPath);
    } else if (options.output === 'markdown') {
      this.outputMarkdown(duration, riskScore, resolvedPath);
    } else {
      this.ui.verdict(riskScore);
      this.ui.info(`Scanned ${this.filesScanned} files in ${duration}s`);
      this.ui.info(`Found ${this.findings.length} issues`);
    }

    // Exit codes
    const critical = this.findings.filter(f => f.severity === 'critical').length;
    const high = this.findings.filter(f => f.severity === 'high').length;
    process.exit(critical > 0 ? 2 : high > 0 ? 1 : 0);
  }

  async scanDirectory(dirPath) {
    const spinner = this.ui.startSpinner('Discovering files...');
    
    const patterns = ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.py', '**/*.sh'];
    const exclude = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'];
    
    let files = [];
    for (const p of patterns) {
      const matches = glob.sync(p, { cwd: dirPath, absolute: true, ignore: exclude });
      files.push(...matches);
    }
    files = [...new Set(files)];
    
    this.ui.stopSpinner(`Found ${files.length} files`);
    
    // Read all file contents for cross-file analysis
    const fileContents = files.map(filePath => {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return { path: filePath, content, size: content.length };
      } catch (err) {
        return { path: filePath, content: '', size: 0, error: true };
      }
    }).filter(f => !f.error);

    // Perform cross-file analysis first
    let crossFileCorrelations = {};
    if (this.options.enableCrossFileAnalysis && this.crossFileAnalyzer) {
      crossFileCorrelations = await this.crossFileAnalyzer.analyzeFiles(fileContents, this.findings);
    }

    for (let i = 0; i < files.length; i++) {
      this.ui.progress(i + 1, files.length, path.basename(files[i]));
      await this.scanFile(files[i], fileContents);
    }

    // Apply cross-file correlations to all findings
    if (this.options.enableCrossFileAnalysis && Object.keys(crossFileCorrelations).length > 0) {
      this.findings = this.findings.map(finding => 
        this.enhanceWithCrossFileCorrelations(finding, crossFileCorrelations)
      );
    }
  }

  async scanFile(filePath, allFiles = []) {
    try {
      // Skip large files (>1MB)
      const stats = fs.statSync(filePath);
      if (stats.size > 1024 * 1024) return;

      const content = fs.readFileSync(filePath, 'utf-8');
      this.filesScanned++;

      // Store content for cross-file analysis
      this.currentFile = {
        path: filePath,
        content: content,
        size: stats.size
      };

      // Skip if it's mostly documentation
      if (this.isMostlyDocumentation(content)) return;

      // Enhanced scanning with all patterns
      for (const category of ALL_PATTERNS) {
        for (const pattern of category.patterns) {
          const matches = content.match(pattern);

          if (matches) {
            for (const match of matches) {
              const index = content.indexOf(match);

              // Skip if in safe context
              if (this.isInSafeContext(content, index)) continue;

              // Skip if in test/example file
              if (this.isTestOrExample(filePath, content)) continue;

              // Enhanced context analysis
              const contextScore = this.threatAnalyzer.analyzeContext(filePath, content, index);
              const threatScore = this.threatAnalyzer.calculateThreatScore(
                category.name.toLowerCase().replace(/\s+/g, '_'),
                { weight: 0.5 },
                contextScore
              );

              const finding = {
                severity: this.adjustSeverity(category.severity, threatScore),
                category: category.name,
                pattern: pattern.toString().slice(0, 50) + '...',
                file: filePath,
                line: this.getLineNumber(content, index),
                evidence: match.slice(0, 100),
                match: match,
                threatScore: threatScore,
                contextScore: contextScore
              };

              this.findings.push(finding);
              this.ui.displayFinding(finding, this.findings.length);
            }
          }
        }
      }

      // Multi-threat pattern detection
      const multiThreats = this.threatAnalyzer.detectMultiThreatPatterns(content);
      for (const threat of multiThreats) {
        const finding = {
          severity: threat.severity,
          category: 'Multi-Threat Pattern',
          pattern: threat.type,
          file: filePath,
          line: 1,
          evidence: threat.evidence,
          match: threat.evidence,
          threatScore: threat.score,
          contextScore: 1.0
        };

        this.findings.push(finding);
        this.ui.displayFinding(finding, this.findings.length);
      }

      // Enhanced semantic analysis
      if (this.options.enableSemanticAnalysis) {
        const fileFindings = this.findings.filter(f => f.file === filePath);
        const enhancedFindings = await this.semanticAnalyzer.analyzeFile(filePath, content, fileFindings);
        // Replace file's findings with semantically enhanced versions
        this.findings = this.findings.filter(f => f.file !== filePath).concat(enhancedFindings);
      }

    } catch (err) {
      // Skip unreadable files
    }
  }

  adjustSeverity(baseSeverity, threatScore) {
    if (threatScore >= 1.8) return 'critical';
    if (threatScore >= 1.3) return 'high';
    if (threatScore >= 0.8) return 'medium';
    return baseSeverity;
  }

  isMostlyDocumentation(content) {
    const codeBlockMatches = content.match(/```[\s\S]*?```/g) || [];
    const codeLength = codeBlockMatches.reduce((sum, b) => sum + b.length, 0);
    return (codeLength / content.length) < 0.2 && content.length > 1000;
  }

  isInSafeContext(content, matchIndex) {
    const lines = content.substring(0, matchIndex).split('\n');
    const currentLine = lines[lines.length - 1] || '';
    
    // In comment
    if (currentLine.trim().startsWith('//') || 
        currentLine.trim().startsWith('#') ||
        currentLine.trim().startsWith('*')) {
      return true;
    }

    // Check multi-line comments
    const before = content.substring(0, matchIndex);
    const openComments = (before.match(/\/\*/g) || []).length;
    const closeComments = (before.match(/\*\//g) || []).length;
    if (openComments > closeComments) return true;

    return false;
  }

  isTestOrExample(filePath, content) {
    const lowerPath = filePath.toLowerCase();

    // Never suppress findings in directories with intentionally malicious fixtures
    if (/test-evil|test-malicious|fixtures-evil|fixtures-malicious/.test(lowerPath)) {
      return false;
    }

    if (/test|spec|example|demo|sample|mock|\.test\.|\.spec\./.test(lowerPath)) {
      return true;
    }
    if (/\b(example|demo|sample|mock|placeholder|test case)\b/i.test(content)) {
      return true;
    }
    return false;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  calculateRiskScore() {
    let score = 0;
    for (const f of this.findings) {
      if (f.severity === 'critical') score += 100;
      else if (f.severity === 'high') score += 50;
      else if (f.severity === 'medium') score += 20;
    }
    return Math.min(score, 100);
  }

  outputJson(duration, riskScore, target) {
    console.log(JSON.stringify({
      scanInfo: { duration: `${duration}s`, filesScanned: this.filesScanned, target },
      summary: {
        riskScore,
        verdict: riskScore > 80 ? 'DO NOT INSTALL' : riskScore > 40 ? 'REVIEW' : 'SAFE',
        critical: this.findings.filter(f => f.severity === 'critical').length,
        high: this.findings.filter(f => f.severity === 'high').length,
        medium: this.findings.filter(f => f.severity === 'medium').length
      },
      findings: this.findings
    }, null, 2));
  }

  outputMarkdown(duration, riskScore, target) {
    console.log(`# bleed. Security Report\n\n**Target:** ${target}\n**Duration:** ${duration}s\n\n## Summary\n\nRisk Score: ${riskScore}/100\n\n## Findings\n\n${this.findings.map(f => `### ${f.severity.toUpperCase()}: ${f.category}\n- File: \`${f.file}:${f.line}\`\n- Evidence: \`${f.evidence}\`\n`).join('\n')}`);
  }

  async scanInstalled(options) {
    const homeDir = require('os').homedir();
    const paths = [
      path.join(homeDir, '.claude', 'plugins'),
      path.join(homeDir, '.claude-plugins'),
      path.join(homeDir, '.config', 'claude', 'plugins')
    ];
    
    let pluginsPath = paths.find(p => fs.existsSync(p));
    
    if (!pluginsPath) {
      this.ui.warning('Claude plugins directory not found');
      return;
    }
    
    await this.scan(pluginsPath, options);
  }

  /**
   * Enhance finding with cross-file correlations
   */
  enhanceWithCrossFileCorrelations(finding, correlations) {
    const enhanced = { ...finding, correlations: [] };

    // Add suspicious import correlations
    for (const imp of correlations.suspiciousImports || []) {
      if (imp.file === finding.file) {
        enhanced.correlations.push({
          type: 'suspicious_import',
          details: imp,
          severity: imp.severity
        });
      }
    }

    // Add coordinated attack correlations
    for (const attack of correlations.coordinatedAttacks || []) {
      if (attack.chains.some(chain => chain.files.some(f => f.path === finding.file))) {
        enhanced.correlations.push({
          type: 'coordinated_attack',
          details: attack,
          severity: attack.severity
        });
      }
    }

    return enhanced;
  }

  /**
   * Filter findings using feedback system
   */
  filterWithFeedback(findings) {
    if (!this.options.enableFeedback) {
      return findings;
    }

    // Apply feedback-based filtering
    const filteredFindings = this.feedbackSystem.filterFindings(findings);
    
    // Generate feedback suggestions for remaining findings
    const suggestions = this.feedbackSystem.suggestFeedback(findings);
    
    return {
      findings: filteredFindings,
      suggestions: suggestions,
      feedbackSummary: this.feedbackSystem.getFeedbackSummary()
    };
  }

  /**
   * Record user feedback
   */
  recordUserFeedback(findingId, isFalsePositive, userNotes = '') {
    const finding = this.findings.find(f => f.id === findingId);
    if (!finding) return false;

    return this.feedbackSystem.recordFeedback(finding, isFalsePositive, userNotes);
  }
}

module.exports = Scanner;
