#!/usr/bin/env node

/**
 * 📋 Automated Change Tracking System
 * Sherlock Health → Patient HQ Development
 * 
 * This script automatically tracks changes, updates changelog,
 * and maintains version history for the medical dashboard system.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ChangeTracker {
  constructor() {
    this.changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
    this.versionPath = path.join(process.cwd(), 'package.json');
    this.changesPath = path.join(process.cwd(), '.changes');
    
    // Change categories with emojis
    this.categories = {
      'major': '🎯 Major Features',
      'feature': '✨ New Features', 
      'improvement': '🔧 Technical Improvements',
      'bugfix': '🐛 Bug Fixes',
      'security': '🔒 Security Updates',
      'docs': '📚 Documentation',
      'test': '🧪 Testing',
      'refactor': '♻️ Code Refactoring',
      'performance': '⚡ Performance',
      'ui': '🎨 UI/UX Improvements'
    };
  }

  /**
   * Initialize change tracking system
   */
  async initialize() {
    console.log('🚀 Initializing Change Tracking System...');
    
    try {
      // Create .changes directory if it doesn't exist
      await fs.mkdir(this.changesPath, { recursive: true });
      
      // Create initial changelog if it doesn't exist
      const changelogExists = await this.fileExists(this.changelogPath);
      if (!changelogExists) {
        await this.createInitialChangelog();
      }
      
      console.log('✅ Change tracking system initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize change tracking:', error.message);
      process.exit(1);
    }
  }

  /**
   * Add a new change entry
   */
  async addChange(category, description, details = {}) {
    console.log(`📝 Adding change: ${category} - ${description}`);
    
    try {
      const changeId = this.generateChangeId();
      const change = {
        id: changeId,
        timestamp: new Date().toISOString(),
        category,
        description,
        details,
        author: this.getGitAuthor(),
        branch: this.getGitBranch(),
        commit: this.getGitCommit()
      };
      
      // Save change to .changes directory
      const changeFile = path.join(this.changesPath, `${changeId}.json`);
      await fs.writeFile(changeFile, JSON.stringify(change, null, 2));
      
      console.log(`✅ Change recorded: ${changeId}`);
      return changeId;
    } catch (error) {
      console.error('❌ Failed to add change:', error.message);
      throw error;
    }
  }

  /**
   * Generate changelog from pending changes
   */
  async generateChangelog(version = null) {
    console.log('📋 Generating changelog...');
    
    try {
      // Get all pending changes
      const changes = await this.getPendingChanges();
      
      if (changes.length === 0) {
        console.log('ℹ️ No pending changes to add to changelog');
        return;
      }
      
      // Group changes by category
      const groupedChanges = this.groupChangesByCategory(changes);
      
      // Generate changelog entry
      const changelogEntry = this.formatChangelogEntry(version, groupedChanges);
      
      // Update changelog file
      await this.updateChangelog(changelogEntry);
      
      // Archive processed changes
      await this.archiveChanges(changes);
      
      console.log(`✅ Changelog updated with ${changes.length} changes`);
    } catch (error) {
      console.error('❌ Failed to generate changelog:', error.message);
      throw error;
    }
  }

  /**
   * Get all pending changes from .changes directory
   */
  async getPendingChanges() {
    try {
      const files = await fs.readdir(this.changesPath);
      const changeFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('archived_'));
      
      const changes = [];
      for (const file of changeFiles) {
        const filePath = path.join(this.changesPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        changes.push(JSON.parse(content));
      }
      
      // Sort by timestamp
      return changes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error('❌ Failed to get pending changes:', error.message);
      return [];
    }
  }

  /**
   * Group changes by category
   */
  groupChangesByCategory(changes) {
    const grouped = {};
    
    for (const change of changes) {
      const category = change.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(change);
    }
    
    return grouped;
  }

  /**
   * Format changelog entry
   */
  formatChangelogEntry(version, groupedChanges) {
    const currentDate = new Date().toISOString().split('T')[0];
    const versionHeader = version ? `[${version}]` : '[Unreleased]';
    
    let entry = `\n## 🚀 **${versionHeader} - ${currentDate}**\n\n`;
    
    // Add changes by category
    for (const [category, changes] of Object.entries(groupedChanges)) {
      const categoryTitle = this.categories[category] || `📝 ${category}`;
      entry += `### ${categoryTitle}\n`;
      
      for (const change of changes) {
        entry += `- **${change.description}**`;
        
        // Add details if available
        if (change.details.impact) {
          entry += `: ${change.details.impact}`;
        }
        
        // Add author and commit info
        if (change.author && change.commit) {
          entry += ` (${change.author} - ${change.commit.substring(0, 7)})`;
        }
        
        entry += '\n';
        
        // Add sub-details if available
        if (change.details.items && Array.isArray(change.details.items)) {
          for (const item of change.details.items) {
            entry += `  - ${item}\n`;
          }
        }
      }
      
      entry += '\n';
    }
    
    return entry;
  }

  /**
   * Update changelog file
   */
  async updateChangelog(newEntry) {
    try {
      const changelog = await fs.readFile(this.changelogPath, 'utf8');
      
      // Find the position to insert new entry (after the header)
      const lines = changelog.split('\n');
      const insertIndex = this.findInsertPosition(lines);
      
      // Insert new entry
      const newLines = [
        ...lines.slice(0, insertIndex),
        ...newEntry.split('\n'),
        ...lines.slice(insertIndex)
      ];
      
      await fs.writeFile(this.changelogPath, newLines.join('\n'));
    } catch (error) {
      console.error('❌ Failed to update changelog:', error.message);
      throw error;
    }
  }

  /**
   * Find position to insert new changelog entry
   */
  findInsertPosition(lines) {
    // Look for the first version entry or unreleased section
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## 🚀 **[')) {
        return i;
      }
    }
    
    // If no version entries found, insert after header
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('---') && i > 5) {
        return i + 1;
      }
    }
    
    return lines.length;
  }

  /**
   * Archive processed changes
   */
  async archiveChanges(changes) {
    const archiveDate = new Date().toISOString().split('T')[0];
    
    for (const change of changes) {
      const originalFile = path.join(this.changesPath, `${change.id}.json`);
      const archiveFile = path.join(this.changesPath, `archived_${archiveDate}_${change.id}.json`);
      
      try {
        await fs.rename(originalFile, archiveFile);
      } catch (error) {
        console.warn(`⚠️ Failed to archive change ${change.id}:`, error.message);
      }
    }
  }

  /**
   * Generate unique change ID
   */
  generateChangeId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `change_${timestamp}_${random}`;
  }

  /**
   * Get git author information
   */
  getGitAuthor() {
    try {
      return execSync('git config user.name', { encoding: 'utf8' }).trim();
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Get current git branch
   */
  getGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get current git commit hash
   */
  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create initial changelog
   */
  async createInitialChangelog() {
    const initialChangelog = `# 📋 Sherlock Health → Patient HQ - Changelog
## Comprehensive Change Tracking & Version History

---

## 🚀 **[Unreleased]**

### 🎯 **Major Features In Development**
- Initial changelog system implementation

---

**Last Updated**: ${new Date().toISOString().split('T')[0]}
**Maintained By**: Development Team
`;

    await fs.writeFile(this.changelogPath, initialChangelog);
  }
}

// CLI Interface
async function main() {
  const tracker = new ChangeTracker();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'init':
        await tracker.initialize();
        break;
        
      case 'add':
        const category = args[1];
        const description = args[2];
        const details = args[3] ? JSON.parse(args[3]) : {};
        
        if (!category || !description) {
          console.error('❌ Usage: node change-tracker.js add <category> <description> [details]');
          process.exit(1);
        }
        
        await tracker.addChange(category, description, details);
        break;
        
      case 'generate':
        const version = args[1];
        await tracker.generateChangelog(version);
        break;
        
      case 'status':
        const changes = await tracker.getPendingChanges();
        console.log(`📊 Pending changes: ${changes.length}`);
        for (const change of changes) {
          console.log(`  - ${change.category}: ${change.description}`);
        }
        break;
        
      default:
        console.log(`
📋 Change Tracker Commands:

  init                     Initialize change tracking system
  add <category> <desc>    Add a new change entry
  generate [version]       Generate changelog from pending changes
  status                   Show pending changes

Categories: ${Object.keys(tracker.categories).join(', ')}

Examples:
  node change-tracker.js add feature "Added QR code patient portal"
  node change-tracker.js add bugfix "Fixed grid layout issues"
  node change-tracker.js generate "v5.1.0"
        `);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ChangeTracker;
