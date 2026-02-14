const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * AST-based semantic analysis for enhanced false positive reduction
 * Understands code structure, data flow, and execution context
 */
class SemanticAnalyzer {
  constructor() {
    this.cache = new Map();
    this.supportedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs'];
  }

  /**
   * Analyze file semantically to determine if patterns are actual threats
   */
  async analyzeFile(filePath, content, findings) {
    if (!this.isSupportedFile(filePath)) {
      return findings;
    }

    try {
      const ast = this.parseCode(content, filePath);
      if (!ast) return findings;

      const analysis = {
        imports: this.extractImports(ast),
        exports: this.extractExports(ast),
        functions: this.extractFunctions(ast),
        variables: this.extractVariables(ast),
        calls: this.extractFunctionCalls(ast),
        dataFlow: this.analyzeDataFlow(ast)
      };

      return this.enhanceFindingsWithSemantics(findings, analysis, filePath);
    } catch (error) {
      // If AST parsing fails, return original findings
      return findings;
    }
  }

  /**
   * Parse code into AST based on file type
   */
  parseCode(content, filePath) {
    const ext = path.extname(filePath);
    const isTypeScript = ['.ts', '.tsx'].includes(ext);
    const isJSX = ['.jsx', '.tsx'].includes(ext);

    try {
      return parse(content, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'jsx',
          'typescript',
          'classProperties',
          'objectRestSpread',
          'asyncGenerators',
          'functionBind',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining'
        ].filter(plugin => {
          if (!isTypeScript && plugin === 'typescript') return false;
          if (!isJSX && plugin === 'jsx') return false;
          return true;
        })
      });
    } catch (error) {
      // Fallback for simpler parsing
      try {
        return parse(content, {
          sourceType: 'module',
          allowImportExportEverywhere: true,
          plugins: ['classProperties', 'objectRestSpread']
        });
      } catch (fallbackError) {
        return null;
      }
    }
  }

  /**
   * Extract all imports from AST
   */
  extractImports(ast) {
    const imports = [];
    
    traverse(ast, {
      ImportDeclaration: (path) => {
        imports.push({
          source: path.node.source.value,
          specifiers: path.node.specifiers.map(spec => ({
            name: spec.local.name,
            type: spec.type
          })),
          line: path.node.loc?.start?.line
        });
      },
      CallExpression: (path) => {
        if (
          path.node.callee.name === 'require' &&
          path.node.arguments &&
          path.node.arguments[0]
        ) {
          imports.push({
            source: path.node.arguments[0].value,
            specifiers: [],
            line: path.node.loc?.start?.line,
            type: 'require'
          });
        }
      }
    });

    return imports;
  }

  /**
   * Extract all exports from AST
   */
  extractExports(ast) {
    const exports = [];
    
    traverse(ast, {
      ExportNamedDeclaration: (path) => {
        exports.push({
          type: 'named',
          specifiers: path.node.specifiers || [],
          line: path.node.loc?.start?.line
        });
      },
      ExportDefaultDeclaration: (path) => {
        exports.push({
          type: 'default',
          name: path.node.declaration?.id?.name || 'default',
          line: path.node.loc?.start?.line
        });
      }
    });

    return exports;
  }

  /**
   * Extract function definitions
   */
  extractFunctions(ast) {
    const functions = [];
    
    traverse(ast, {
      FunctionDeclaration: (path) => {
        functions.push({
          name: path.node.id?.name || 'anonymous',
          params: path.node.params.map(p => p.name || p.type),
          body: path.node.body,
          line: path.node.loc?.start?.line,
          type: 'declaration'
        });
      },
      FunctionExpression: (path) => {
        functions.push({
          name: path.node.id?.name || 'anonymous',
          params: path.node.params.map(p => p.name || p.type),
          body: path.node.body,
          line: path.node.loc?.start?.line,
          type: 'expression'
        });
      },
      ArrowFunctionExpression: (path) => {
        functions.push({
          name: 'arrow',
          params: path.node.params.map(p => p.name || p.type),
          body: path.node.body,
          line: path.node.loc?.start?.line,
          type: 'arrow'
        });
      }
    });

    return functions;
  }

  /**
   * Extract variable declarations
   */
  extractVariables(ast) {
    const variables = [];
    
    traverse(ast, {
      VariableDeclarator: (path) => {
        if (path.node.id) {
          variables.push({
            name: path.node.id.name,
            type: path.parent.kind || 'var',
            line: path.node.loc?.start?.line,
            init: path.node.init
          });
        }
      }
    });

    return variables;
  }

  /**
   * Extract function calls
   */
  extractFunctionCalls(ast) {
    const calls = [];
    
    traverse(ast, {
      CallExpression: (path) => {
        const callee = path.node.callee;
        let functionName = '';
        
        if (callee.type === 'Identifier') {
          functionName = callee.name;
        } else if (callee.type === 'MemberExpression') {
          functionName = callee.property.name;
        } else if (callee.type === 'FunctionExpression') {
          functionName = 'anonymous';
        }

        calls.push({
          name: functionName,
          args: path.node.arguments,
          line: path.node.loc?.start?.line,
          type: callee.type
        });
      }
    });

    return calls;
  }

  /**
   * Analyze data flow patterns
   */
  analyzeDataFlow(ast) {
    const dataFlow = {
      userInputSources: [],
      externalCalls: [],
      sensitiveOperations: []
    };

    traverse(ast, {
      // Identify potential user input sources
      MemberExpression: (path) => {
        const obj = path.node.object;
        const prop = path.node.property;

        if (obj.name === 'req' || obj.name === 'request') {
          dataFlow.userInputSources.push({
            source: `${obj.name}.${prop.name}`,
            line: path.node.loc?.start?.line
          });
        }
      },

      // Identify external network calls AND sensitive operations
      CallExpression: (path) => {
        const callee = path.node.callee;
        const functionName = callee.name || callee.property?.name;

        const networkFunctions = ['fetch', 'axios', 'request', 'http', 'https', 'ws', 'websocket'];
        if (networkFunctions.includes(functionName)) {
          dataFlow.externalCalls.push({
            function: functionName,
            line: path.node.loc?.start?.line,
            args: path.node.arguments.length
          });
        }

        const sensitiveFunctions = ['eval', 'Function', 'exec', 'spawn', 'child_process'];
        if (sensitiveFunctions.includes(functionName)) {
          dataFlow.sensitiveOperations.push({
            function: functionName,
            line: path.node.loc?.start?.line,
            args: path.node.arguments
          });
        }
      }
    });

    return dataFlow;
  }

  /**
   * Enhance findings with semantic analysis
   */
  enhanceFindingsWithSemantics(findings, analysis, filePath) {
    return findings.map(finding => {
      const enhanced = { ...finding };
      
      // Analyze if pattern is in test code
      enhanced.isTestCode = this.isInTestCode(analysis, finding.line);
      
      // Analyze if pattern involves user input
      enhanced.involvesUserInput = this.involvesUserInput(analysis, finding);
      
      // Analyze if pattern is in exported function
      enhanced.isExported = this.isInExportedFunction(analysis, finding.line);
      
      // Analyze if pattern has data flow to external sources
      enhanced.hasExternalDataFlow = this.hasExternalDataFlow(analysis, finding);
      
      // Calculate semantic confidence score
      enhanced.semanticScore = this.calculateSemanticScore(enhanced, analysis);
      
      // Adjust severity based on semantic analysis
      enhanced.adjustedSeverity = this.adjustSeverity(enhanced);
      
      return enhanced;
    });
  }

  /**
   * Check if finding is in test code
   */
  isInTestCode(analysis, line) {
    // Check if line is inside a test function body
    const testFunctions = analysis.functions.filter(fn =>
      fn.name && /test|spec|it|describe|before|after/i.test(fn.name)
    );

    const insideTestFn = testFunctions.some(fn => {
      const fnStart = fn.line;
      const fnEnd = fn.body?.loc?.end?.line;
      return fnEnd ? (line >= fnStart && line <= fnEnd) : false;
    });

    if (insideTestFn) return true;

    // Fallback: check if file imports test libraries
    const testImports = analysis.imports.filter(imp =>
      /jest|mocha|chai|vitest|@testing-library/i.test(imp.source)
    );

    return testImports.length > 0;
  }

  /**
   * Check if finding involves user input
   */
  involvesUserInput(analysis, finding) {
    const userInputVars = analysis.dataFlow.userInputSources.map(src => src.source);
    if (userInputVars.length === 0) return false;

    // Check if any nearby function calls reference user input variables
    const nearbyCalls = analysis.calls.filter(call =>
      Math.abs(call.line - finding.line) <= 3
    );

    const nearbyCallNames = nearbyCalls.map(c => c.name);
    const nearbyCallArgs = nearbyCalls.flatMap(c =>
      (c.args || []).flatMap(arg => this.extractArgTokens(arg))
    );
    const allNearbyTokens = [...nearbyCallNames, ...nearbyCallArgs];

    return userInputVars.some(input => {
      const parts = input.split('.');
      return parts.some(part => allNearbyTokens.some(token => token.includes(part)));
    });
  }

  /**
   * Check if finding is in exported function
   */
  isInExportedFunction(analysis, line) {
    // Check if finding is inside any function
    const containingFn = analysis.functions.find(fn => {
      const fnStart = fn.line;
      const fnEnd = fn.body?.loc?.end?.line;
      return fnEnd ? (line >= fnStart && line <= fnEnd) : false;
    });

    if (!containingFn) return false;

    // Check if that function is exported (by name or by line proximity)
    return analysis.exports.some(exp =>
      exp.name === containingFn.name ||
      exp.line === containingFn.line ||
      Math.abs(exp.line - containingFn.line) <= 1
    );
  }

  /**
   * Recursively extract identifier tokens from an AST argument node
   */
  extractArgTokens(node) {
    if (!node) return [];
    if (node.name) return [node.name];
    if (node.value != null) return [String(node.value)];
    if (node.type === 'MemberExpression') {
      return [...this.extractArgTokens(node.object), ...this.extractArgTokens(node.property)];
    }
    return [];
  }

  /**
   * Check if finding has external data flow
   */
  hasExternalDataFlow(analysis, finding) {
    return analysis.dataFlow.externalCalls.length > 0 || 
           analysis.dataFlow.sensitiveOperations.length > 0;
  }

  /**
   * Get context around finding line
   */
  getFindingContext(analysis, line) {
    const nearbyFunctions = analysis.functions.filter(fn => 
      Math.abs(fn.line - line) <= 5
    );
    
    const nearbyCalls = analysis.calls.filter(call => 
      Math.abs(call.line - line) <= 3
    );
    
    return {
      functions: nearbyFunctions,
      calls: nearbyCalls
    };
  }

  /**
   * Calculate semantic confidence score
   */
  calculateSemanticScore(enhanced, analysis) {
    let score = enhanced.threatScore || 0.5;
    
    // Reduce score for test code
    if (enhanced.isTestCode) score *= 0.3;
    
    // Increase score for user input involvement
    if (enhanced.involvesUserInput) score *= 1.5;
    
    // Reduce score for non-exported internal functions
    if (!enhanced.isExported) score *= 0.7;
    
    // Increase score for external data flow
    if (enhanced.hasExternalDataFlow) score *= 1.3;
    
    return Math.min(score, 2.0);
  }

  /**
   * Adjust severity based on semantic analysis
   */
  adjustSeverity(enhanced) {
    const score = enhanced.semanticScore;
    
    if (enhanced.isTestCode && score < 0.8) {
      return 'low';
    }
    
    if (score >= 1.5) return 'critical';
    if (score >= 1.0) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Check if file is supported for AST analysis
   */
  isSupportedFile(filePath) {
    return this.supportedExtensions.includes(path.extname(filePath));
  }
}

module.exports = SemanticAnalyzer;