#!/usr/bin/env node

/**
 * 📋 Post-Commit Processor for Automated Changelog
 * Sherlock Health → Patient HQ Development
 * 
 * Processes commits after they're made and updates changelog automatically
 */

const ChangeTracker = require('./change-tracker');
const CommitMessageParser = require('./parse-commit-message');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class PostCommitProcessor {
  constructor() {
    this.tracker = new ChangeTracker();
    this.parser = new CommitMessageParser();
    this.projectRoot = process.cwd();
  }

  /**
   * Process a commit and update changelog
   */
  async processCommit(commitMessage, commitHash) {
    console.log(`📋 Processing commit ${commitHash.substring(0, 7)}...`);

    try {
      // Parse commit message and create change entry
      const changeId = await this.parser.parseCommitMessage(commitMessage);
      
      if (!changeId) {
        console.log('ℹ️ No trackable changes found in commit');
        return;
      }

      // Get commit details
      const commitDetails = await this.getCommitDetails(commitHash);
      
      // Update change entry with commit details
      await this.updateChangeWithCommitDetails(changeId, commitDetails);

      // Check if we should auto-generate changelog
      const shouldAutoGenerate = await this.shouldAutoGenerateChangelog();
      
      if (shouldAutoGenerate) {
        console.log('📋 Auto-generating changelog...');
        await this.tracker.generateChangelog();
        
        // Commit the changelog update
        await this.commitChangelogUpdate();
      }

      console.log('✅ Commit processed successfully');

    } catch (error) {
      console.error('❌ Failed to process commit:', error.message);
      // Don't fail the commit, just log the error
    }
  }

  /**
   * Get detailed commit information
   */
  async getCommitDetails(commitHash) {
    try {
      const author = execSync(`git show -s --format='%an' ${commitHash}`, { encoding: 'utf8' }).trim();
      const email = execSync(`git show -s --format='%ae' ${commitHash}`, { encoding: 'utf8' }).trim();
      const date = execSync(`git show -s --format='%ci' ${commitHash}`, { encoding: 'utf8' }).trim();
      const filesChanged = execSync(`git show --name-only --format='' ${commitHash}`, { encoding: 'utf8' })
        .trim().split('\n').filter(f => f.length > 0);

      return {
        hash: commitHash,
        author,
        email,
        date: new Date(date),
        filesChanged,
        shortHash: commitHash.substring(0, 7)
      };

    } catch (error) {
      console.warn('⚠️ Could not get commit details:', error.message);
      return {
        hash: commitHash,
        shortHash: commitHash.substring(0, 7),
        author: 'Unknown',
        email: '',
        date: new Date(),
        filesChanged: []
      };
    }
  }

  /**
   * Update change entry with commit details
   */
  async updateChangeWithCommitDetails(changeId, commitDetails) {
    try {
      const changeFile = path.join(this.projectRoot, '.changes', `${changeId}.json`);
      const changeContent = await fs.readFile(changeFile, 'utf8');
      const change = JSON.parse(changeContent);

      // Update with commit details
      change.commit = commitDetails.hash;
      change.shortCommit = commitDetails.shortHash;
      change.commitDate = commitDetails.date;
      change.filesChanged = commitDetails.filesChanged;
      
      // Add impact analysis based on files changed
      change.details.impact = this.analyzeImpact(commitDetails.filesChanged);
      
      // Add affected components
      change.details.affectedComponents = this.identifyAffectedComponents(commitDetails.filesChanged);

      await fs.writeFile(changeFile, JSON.stringify(change, null, 2));

    } catch (error) {
      console.warn('⚠️ Could not update change with commit details:', error.message);
    }
  }

  /**
   * Analyze impact based on changed files
   */
  analyzeImpact(filesChanged) {
    const impacts = [];

    // Database schema changes
    if (filesChanged.some(f => f.includes('schema.ts'))) {
      impacts.push('Database schema modifications');
    }

    // API changes
    if (filesChanged.some(f => f.includes('routes.ts') || f.includes('api/'))) {
      impacts.push('API endpoint modifications');
    }

    // Frontend changes
    if (filesChanged.some(f => f.includes('client/') || f.includes('.tsx'))) {
      impacts.push('User interface updates');
    }

    // Medical dashboard changes
    if (filesChanged.some(f => f.includes('MedicalDashboard'))) {
      impacts.push('Medical dashboard functionality');
    }

    // AI service changes
    if (filesChanged.some(f => f.includes('ai-service') || f.includes('anthropic') || f.includes('openai'))) {
      impacts.push('AI analysis system updates');
    }

    // Lab analytics changes
    if (filesChanged.some(f => f.includes('lab') && f.includes('service'))) {
      impacts.push('Laboratory analysis capabilities');
    }

    // Voice interface changes
    if (filesChanged.some(f => f.includes('voice') || f.includes('elevenlabs'))) {
      impacts.push('Voice interface functionality');
    }

    // Security/auth changes
    if (filesChanged.some(f => f.includes('auth') || f.includes('security'))) {
      impacts.push('Authentication and security systems');
    }

    return impacts.length > 0 ? impacts.join(', ') : 'General system improvements';
  }

  /**
   * Identify affected components
   */
  identifyAffectedComponents(filesChanged) {
    const components = new Set();

    filesChanged.forEach(file => {
      if (file.includes('client/')) {
        components.add('Frontend');
      }
      if (file.includes('server/')) {
        components.add('Backend');
      }
      if (file.includes('shared/')) {
        components.add('Shared');
      }
      if (file.includes('MedicalDashboard')) {
        components.add('Medical Dashboard');
      }
      if (file.includes('PhysicianDashboard')) {
        components.add('Physician Dashboard');
      }
      if (file.includes('ai-service')) {
        components.add('AI Services');
      }
      if (file.includes('lab')) {
        components.add('Lab Analytics');
      }
      if (file.includes('voice')) {
        components.add('Voice Interface');
      }
      if (file.includes('docs/')) {
        components.add('Documentation');
      }
      if (file.includes('scripts/')) {
        components.add('Build Scripts');
      }
    });

    return Array.from(components);
  }

  /**
   * Determine if changelog should be auto-generated
   */
  async shouldAutoGenerateChangelog() {
    try {
      // Check number of pending changes
      const changes = await this.tracker.getPendingChanges();
      
      // Auto-generate if we have 5 or more changes
      if (changes.length >= 5) {
        return true;
      }

      // Auto-generate if we have major changes
      const hasMajorChanges = changes.some(change => change.category === 'major');
      if (hasMajorChanges) {
        return true;
      }

      // Auto-generate if it's been more than a week since last changelog update
      const lastChangelogUpdate = await this.getLastChangelogUpdate();
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      if (lastChangelogUpdate < oneWeekAgo) {
        return true;
      }

      return false;

    } catch (error) {
      console.warn('⚠️ Could not determine if changelog should be auto-generated:', error.message);
      return false;
    }
  }

  /**
   * Get last changelog update date
   */
  async getLastChangelogUpdate() {
    try {
      const changelogPath = path.join(this.projectRoot, 'CHANGELOG.md');
      const stats = await fs.stat(changelogPath);
      return stats.mtime;
    } catch (error) {
      return new Date(0); // Very old date if changelog doesn't exist
    }
  }

  /**
   * Commit changelog update
   */
  async commitChangelogUpdate() {
    try {
      // Check if changelog was actually updated
      const status = execSync('git status --porcelain CHANGELOG.md', { encoding: 'utf8' });
      
      if (status.trim()) {
        execSync('git add CHANGELOG.md');
        execSync('git commit -m "docs: auto-update changelog with recent changes"');
        console.log('✅ Changelog update committed');
      }

    } catch (error) {
      console.warn('⚠️ Could not commit changelog update:', error.message);
    }
  }

  /**
   * Generate release notes for a version
   */
  async generateReleaseNotes(version) {
    console.log(`📋 Generating release notes for version ${version}...`);

    try {
      const changes = await this.tracker.getPendingChanges();
      
      if (changes.length === 0) {
        console.log('ℹ️ No changes to include in release notes');
        return;
      }

      const releaseNotes = this.formatReleaseNotes(version, changes);
      
      // Save release notes
      const releaseNotesPath = path.join(this.projectRoot, 'docs', `release-notes-${version}.md`);
      await fs.writeFile(releaseNotesPath, releaseNotes);

      console.log(`✅ Release notes generated: ${releaseNotesPath}`);

    } catch (error) {
      console.error('❌ Failed to generate release notes:', error.message);
      throw error;
    }
  }

  /**
   * Format release notes
   */
  formatReleaseNotes(version, changes) {
    const date = new Date().toISOString().split('T')[0];
    
    let notes = `# 🚀 Release Notes - Version ${version}\n`;
    notes += `**Release Date**: ${date}\n\n`;

    // Group changes by category
    const grouped = {};
    changes.forEach(change => {
      if (!grouped[change.category]) {
        grouped[change.category] = [];
      }
      grouped[change.category].push(change);
    });

    // Add summary
    notes += `## 📊 Release Summary\n\n`;
    notes += `This release includes ${changes.length} changes across multiple categories:\n\n`;
    
    Object.entries(grouped).forEach(([category, categoryChanges]) => {
      const categoryTitle = this.tracker.categories[category] || category;
      notes += `- **${categoryTitle}**: ${categoryChanges.length} changes\n`;
    });

    notes += `\n---\n\n`;

    // Add detailed changes
    Object.entries(grouped).forEach(([category, categoryChanges]) => {
      const categoryTitle = this.tracker.categories[category] || category;
      notes += `## ${categoryTitle}\n\n`;
      
      categoryChanges.forEach(change => {
        notes += `### ${change.description}\n`;
        
        if (change.details.impact) {
          notes += `**Impact**: ${change.details.impact}\n\n`;
        }
        
        if (change.details.affectedComponents) {
          notes += `**Components**: ${change.details.affectedComponents.join(', ')}\n\n`;
        }
        
        if (change.shortCommit) {
          notes += `**Commit**: ${change.shortCommit}\n\n`;
        }
        
        notes += `---\n\n`;
      });
    });

    return notes;
  }
}

// CLI Interface
async function main() {
  const processor = new PostCommitProcessor();
  const commitMessage = process.argv[2];
  const commitHash = process.argv[3];

  if (!commitMessage || !commitHash) {
    console.error('❌ Usage: node process-commit.js "<commit message>" "<commit hash>"');
    process.exit(1);
  }

  try {
    await processor.processCommit(commitMessage, commitHash);
  } catch (error) {
    console.error('❌ Failed to process commit:', error.message);
    // Don't exit with error code to avoid breaking the commit
  }
}

if (require.main === module) {
  main();
}

module.exports = PostCommitProcessor;
