#!/usr/bin/env node

/**
 * 📝 Commit Message Parser for Automated Change Tracking
 * Sherlock Health → Patient HQ Development
 * 
 * Parses conventional commit messages and creates change entries
 * Supports: feat, fix, docs, style, refactor, test, chore, etc.
 */

const ChangeTracker = require('./change-tracker');

class CommitMessageParser {
  constructor() {
    this.tracker = new ChangeTracker();
    
    // Conventional commit type mappings
    this.typeMapping = {
      'feat': 'feature',
      'feature': 'feature',
      'fix': 'bugfix',
      'bugfix': 'bugfix',
      'docs': 'docs',
      'doc': 'docs',
      'style': 'ui',
      'ui': 'ui',
      'ux': 'ui',
      'refactor': 'refactor',
      'perf': 'performance',
      'performance': 'performance',
      'test': 'test',
      'tests': 'test',
      'chore': 'improvement',
      'build': 'improvement',
      'ci': 'improvement',
      'security': 'security',
      'sec': 'security',
      'major': 'major',
      'breaking': 'major'
    };

    // Keywords that indicate major changes
    this.majorKeywords = [
      'breaking change',
      'breaking',
      'major',
      'architecture',
      'migration',
      'incompatible'
    ];

    // Medical/healthcare specific keywords
    this.medicalKeywords = {
      'diagnosis': 'Enhanced differential diagnosis functionality',
      'lab': 'Laboratory analysis improvements',
      'patient': 'Patient interface enhancements',
      'physician': 'Healthcare provider features',
      'ai': 'AI analysis system updates',
      'voice': 'Voice interface improvements',
      'wearable': 'Wearable device integration',
      'portal': 'Patient portal functionality',
      'qr': 'QR code access system',
      'hipaa': 'HIPAA compliance updates',
      'security': 'Security and privacy enhancements'
    };
  }

  /**
   * Parse commit message and create change entry
   */
  async parseCommitMessage(commitMessage) {
    console.log('📝 Parsing commit message for change tracking...');

    try {
      const parsed = this.parseMessage(commitMessage);
      
      if (!parsed) {
        console.log('ℹ️ No trackable changes found in commit message');
        return null;
      }

      // Create change entry
      const changeId = await this.tracker.addChange(
        parsed.category,
        parsed.description,
        parsed.details
      );

      console.log(`✅ Change tracked: ${changeId}`);
      return changeId;

    } catch (error) {
      console.error('❌ Failed to parse commit message:', error.message);
      throw error;
    }
  }

  /**
   * Parse commit message into structured data
   */
  parseMessage(message) {
    const lines = message.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return null;
    }

    const firstLine = lines[0];
    const bodyLines = lines.slice(1);

    // Try to parse conventional commit format
    const conventional = this.parseConventionalCommit(firstLine);
    if (conventional) {
      return {
        category: conventional.category,
        description: conventional.description,
        details: {
          scope: conventional.scope,
          body: bodyLines.join('\n'),
          impact: this.extractImpact(message),
          medicalContext: this.extractMedicalContext(message),
          breakingChange: this.isBreakingChange(message)
        }
      };
    }

    // Try to parse from keywords
    const keywordBased = this.parseFromKeywords(message);
    if (keywordBased) {
      return keywordBased;
    }

    // Default parsing
    return {
      category: 'improvement',
      description: firstLine,
      details: {
        body: bodyLines.join('\n'),
        impact: this.extractImpact(message),
        medicalContext: this.extractMedicalContext(message)
      }
    };
  }

  /**
   * Parse conventional commit format
   * Examples: feat(auth): add user authentication
   *          fix: resolve login issue
   *          docs(api): update API documentation
   */
  parseConventionalCommit(line) {
    const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?\s*:\s*(.+)$/;
    const match = line.match(conventionalRegex);

    if (!match) {
      return null;
    }

    const [, type, scope, description] = match;
    const category = this.typeMapping[type.toLowerCase()] || 'improvement';

    return {
      category,
      scope,
      description: description.trim()
    };
  }

  /**
   * Parse based on keywords in the message
   */
  parseFromKeywords(message) {
    const lowerMessage = message.toLowerCase();

    // Check for major changes
    if (this.majorKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return {
        category: 'major',
        description: this.extractDescription(message),
        details: {
          impact: 'Major architectural or breaking change',
          medicalContext: this.extractMedicalContext(message)
        }
      };
    }

    // Check for specific categories
    for (const [keyword, category] of Object.entries(this.typeMapping)) {
      if (lowerMessage.includes(keyword)) {
        return {
          category,
          description: this.extractDescription(message),
          details: {
            medicalContext: this.extractMedicalContext(message)
          }
        };
      }
    }

    return null;
  }

  /**
   * Extract description from message
   */
  extractDescription(message) {
    const firstLine = message.split('\n')[0];
    
    // Remove common prefixes
    const prefixes = ['add', 'fix', 'update', 'remove', 'implement', 'create'];
    let description = firstLine.trim();
    
    for (const prefix of prefixes) {
      const regex = new RegExp(`^${prefix}\\s+`, 'i');
      if (regex.test(description)) {
        description = description.replace(regex, '').trim();
        break;
      }
    }

    // Capitalize first letter
    return description.charAt(0).toUpperCase() + description.slice(1);
  }

  /**
   * Extract impact information
   */
  extractImpact(message) {
    const lowerMessage = message.toLowerCase();
    
    const impactKeywords = {
      'critical': 'Critical system functionality',
      'urgent': 'Urgent fix required',
      'security': 'Security-related change',
      'performance': 'Performance improvement',
      'user experience': 'User experience enhancement',
      'workflow': 'Clinical workflow improvement',
      'integration': 'System integration enhancement'
    };

    for (const [keyword, impact] of Object.entries(impactKeywords)) {
      if (lowerMessage.includes(keyword)) {
        return impact;
      }
    }

    return null;
  }

  /**
   * Extract medical context
   */
  extractMedicalContext(message) {
    const lowerMessage = message.toLowerCase();
    const contexts = [];

    for (const [keyword, context] of Object.entries(this.medicalKeywords)) {
      if (lowerMessage.includes(keyword)) {
        contexts.push(context);
      }
    }

    return contexts.length > 0 ? contexts.join(', ') : null;
  }

  /**
   * Check if this is a breaking change
   */
  isBreakingChange(message) {
    const lowerMessage = message.toLowerCase();
    return this.majorKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

// CLI Interface
async function main() {
  const parser = new CommitMessageParser();
  const commitMessage = process.argv[2];

  if (!commitMessage) {
    console.error('❌ Usage: node parse-commit-message.js "<commit message>"');
    process.exit(1);
  }

  try {
    await parser.parseCommitMessage(commitMessage);
  } catch (error) {
    console.error('❌ Failed to parse commit message:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CommitMessageParser;
