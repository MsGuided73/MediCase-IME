#!/usr/bin/env node

/**
 * 🔍 Change Validation System
 * Sherlock Health → Patient HQ Development
 * 
 * Validates changes before commit to ensure quality and compliance
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ChangeValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.criticalFiles = [
      'shared/schema.ts',
      'server/routes.ts',
      'client/src/components/MedicalDashboard/',
      'CHANGELOG.md',
      'package.json'
    ];
    
    this.medicalTerms = [
      'patient', 'diagnosis', 'symptom', 'lab', 'medical', 'clinical',
      'physician', 'doctor', 'healthcare', 'hipaa', 'treatment'
    ];
  }

  /**
   * Validate all changes before commit
   */
  async validateChanges() {
    console.log('🔍 Validating changes before commit...');

    const validations = [
      this.validateCommitMessage(),
      this.validateFileChanges(),
      this.validateMedicalCompliance(),
      this.validateDocumentation(),
      this.validateSecurity()
    ];

    try {
      const results = await Promise.all(validations);
      const failures = results.filter(result => !result.passed);

      if (failures.length > 0) {
        console.error('❌ Validation failed:');
        failures.forEach(failure => {
          console.error(`  - ${failure.message}`);
        });
        return false;
      }

      console.log('✅ All validations passed');
      return true;

    } catch (error) {
      console.error('❌ Validation error:', error.message);
      return false;
    }
  }

  /**
   * Validate commit message format
   */
  async validateCommitMessage() {
    try {
      // Get the commit message from git
      const commitMsg = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
      
      if (!commitMsg) {
        return { passed: false, message: 'Empty commit message' };
      }

      // Check minimum length
      if (commitMsg.length < 10) {
        return { passed: false, message: 'Commit message too short (minimum 10 characters)' };
      }

      // Check for conventional commit format or descriptive message
      const hasConventionalFormat = /^(feat|fix|docs|style|refactor|test|chore|security|major)(\(.+\))?\s*:\s*.+/.test(commitMsg);
      const hasDescriptiveFormat = commitMsg.split(' ').length >= 3;

      if (!hasConventionalFormat && !hasDescriptiveFormat) {
        return { 
          passed: false, 
          message: 'Commit message should follow conventional format or be descriptive' 
        };
      }

      return { passed: true, message: 'Commit message format valid' };

    } catch (error) {
      return { passed: false, message: `Failed to validate commit message: ${error.message}` };
    }
  }

  /**
   * Validate file changes
   */
  async validateFileChanges() {
    try {
      // Get list of changed files
      const changedFiles = this.getChangedFiles();
      
      if (changedFiles.length === 0) {
        return { passed: false, message: 'No files changed in commit' };
      }

      // Check for critical file changes
      const criticalChanges = changedFiles.filter(file => 
        this.criticalFiles.some(critical => file.includes(critical))
      );

      if (criticalChanges.length > 0) {
        console.log(`⚠️ Critical files changed: ${criticalChanges.join(', ')}`);
        
        // Additional validation for critical files
        for (const file of criticalChanges) {
          const validation = await this.validateCriticalFile(file);
          if (!validation.passed) {
            return validation;
          }
        }
      }

      return { passed: true, message: `${changedFiles.length} files validated` };

    } catch (error) {
      return { passed: false, message: `Failed to validate file changes: ${error.message}` };
    }
  }

  /**
   * Validate medical compliance
   */
  async validateMedicalCompliance() {
    try {
      const changedFiles = this.getChangedFiles();
      const medicalFiles = changedFiles.filter(file => 
        file.includes('medical') || 
        file.includes('patient') || 
        file.includes('diagnosis') ||
        file.includes('lab')
      );

      if (medicalFiles.length === 0) {
        return { passed: true, message: 'No medical files changed' };
      }

      // Check for HIPAA compliance keywords
      for (const file of medicalFiles) {
        const content = await this.getFileContent(file);
        if (content) {
          const hasSecurityConsiderations = this.checkSecurityKeywords(content);
          if (!hasSecurityConsiderations && this.containsSensitiveData(content)) {
            return { 
              passed: false, 
              message: `Medical file ${file} may contain sensitive data without proper security measures` 
            };
          }
        }
      }

      return { passed: true, message: 'Medical compliance validated' };

    } catch (error) {
      return { passed: false, message: `Failed to validate medical compliance: ${error.message}` };
    }
  }

  /**
   * Validate documentation updates
   */
  async validateDocumentation() {
    try {
      const changedFiles = this.getChangedFiles();
      const codeFiles = changedFiles.filter(file => 
        file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')
      );

      if (codeFiles.length === 0) {
        return { passed: true, message: 'No code files changed' };
      }

      // Check if major changes include documentation updates
      const hasDocChanges = changedFiles.some(file => 
        file.includes('README') || 
        file.includes('CHANGELOG') || 
        file.includes('.md')
      );

      const majorCodeChanges = codeFiles.length > 5;
      
      if (majorCodeChanges && !hasDocChanges) {
        return { 
          passed: false, 
          message: 'Major code changes should include documentation updates' 
        };
      }

      return { passed: true, message: 'Documentation requirements satisfied' };

    } catch (error) {
      return { passed: false, message: `Failed to validate documentation: ${error.message}` };
    }
  }

  /**
   * Validate security considerations
   */
  async validateSecurity() {
    try {
      const changedFiles = this.getChangedFiles();
      
      for (const file of changedFiles) {
        const content = await this.getFileContent(file);
        if (content) {
          // Check for potential security issues
          const securityIssues = this.checkSecurityIssues(content, file);
          if (securityIssues.length > 0) {
            return { 
              passed: false, 
              message: `Security issues found in ${file}: ${securityIssues.join(', ')}` 
            };
          }
        }
      }

      return { passed: true, message: 'Security validation passed' };

    } catch (error) {
      return { passed: false, message: `Failed to validate security: ${error.message}` };
    }
  }

  /**
   * Get list of changed files
   */
  getChangedFiles() {
    try {
      const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      return output.trim().split('\n').filter(file => file.length > 0);
    } catch (error) {
      console.warn('⚠️ Could not get changed files:', error.message);
      return [];
    }
  }

  /**
   * Validate critical file changes
   */
  async validateCriticalFile(filePath) {
    try {
      if (filePath.includes('schema.ts')) {
        return await this.validateSchemaChanges(filePath);
      }
      
      if (filePath.includes('package.json')) {
        return await this.validatePackageChanges(filePath);
      }
      
      if (filePath.includes('CHANGELOG.md')) {
        return await this.validateChangelogChanges(filePath);
      }

      return { passed: true, message: `Critical file ${filePath} validated` };

    } catch (error) {
      return { passed: false, message: `Failed to validate critical file ${filePath}: ${error.message}` };
    }
  }

  /**
   * Validate database schema changes
   */
  async validateSchemaChanges(filePath) {
    const content = await this.getFileContent(filePath);
    
    if (!content) {
      return { passed: false, message: 'Could not read schema file' };
    }

    // Check for breaking changes
    const hasDropTable = content.includes('DROP TABLE') || content.includes('drop table');
    const hasDropColumn = content.includes('DROP COLUMN') || content.includes('drop column');
    
    if (hasDropTable || hasDropColumn) {
      return { 
        passed: false, 
        message: 'Schema contains potentially breaking changes (DROP operations)' 
      };
    }

    return { passed: true, message: 'Schema changes validated' };
  }

  /**
   * Validate package.json changes
   */
  async validatePackageChanges(filePath) {
    try {
      const content = await this.getFileContent(filePath);
      const packageJson = JSON.parse(content);
      
      // Check for version changes
      if (packageJson.version) {
        const versionRegex = /^\d+\.\d+\.\d+$/;
        if (!versionRegex.test(packageJson.version)) {
          return { passed: false, message: 'Invalid version format in package.json' };
        }
      }

      return { passed: true, message: 'Package.json changes validated' };

    } catch (error) {
      return { passed: false, message: `Invalid package.json format: ${error.message}` };
    }
  }

  /**
   * Validate changelog changes
   */
  async validateChangelogChanges(filePath) {
    const content = await this.getFileContent(filePath);
    
    if (!content) {
      return { passed: false, message: 'Could not read changelog file' };
    }

    // Check for proper changelog format
    const hasVersionHeader = /## \[?\d+\.\d+\.\d+\]?/.test(content);
    const hasDateFormat = /\d{4}-\d{2}-\d{2}/.test(content);
    
    if (!hasVersionHeader && !hasDateFormat) {
      return { 
        passed: false, 
        message: 'Changelog should include version headers and dates' 
      };
    }

    return { passed: true, message: 'Changelog format validated' };
  }

  /**
   * Get file content
   */
  async getFileContent(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      return await fs.readFile(fullPath, 'utf8');
    } catch (error) {
      console.warn(`⚠️ Could not read file ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Check for security keywords
   */
  checkSecurityKeywords(content) {
    const securityKeywords = [
      'encrypt', 'decrypt', 'hash', 'secure', 'auth', 'token',
      'permission', 'access', 'validate', 'sanitize'
    ];
    
    return securityKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if content contains sensitive data
   */
  containsSensitiveData(content) {
    const sensitiveKeywords = [
      'ssn', 'social security', 'credit card', 'password',
      'medical record', 'diagnosis', 'treatment', 'medication'
    ];
    
    return sensitiveKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check for security issues in content
   */
  checkSecurityIssues(content, filePath) {
    const issues = [];
    
    // Check for hardcoded secrets
    if (/api[_-]?key\s*=\s*['"][^'"]+['"]/.test(content)) {
      issues.push('Potential hardcoded API key');
    }
    
    if (/password\s*=\s*['"][^'"]+['"]/.test(content)) {
      issues.push('Potential hardcoded password');
    }
    
    // Check for SQL injection vulnerabilities
    if (content.includes('SELECT') && content.includes('${') && !content.includes('sanitize')) {
      issues.push('Potential SQL injection vulnerability');
    }
    
    // Check for XSS vulnerabilities
    if (filePath.includes('.tsx') && content.includes('dangerouslySetInnerHTML')) {
      issues.push('Potential XSS vulnerability with dangerouslySetInnerHTML');
    }
    
    return issues;
  }
}

// CLI Interface
async function main() {
  const validator = new ChangeValidator();
  
  try {
    const isValid = await validator.validateChanges();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ChangeValidator;
