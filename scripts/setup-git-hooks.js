#!/usr/bin/env node

/**
 * 🔗 Git Hooks Setup for Automated Change Tracking
 * Sherlock Health → Patient HQ Development
 * 
 * This script sets up Git hooks to automatically track changes
 * based on commit messages and file modifications.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class GitHooksSetup {
  constructor() {
    this.hooksDir = path.join(process.cwd(), '.git', 'hooks');
    this.scriptsDir = path.join(process.cwd(), 'scripts');
  }

  /**
   * Setup all Git hooks for change tracking
   */
  async setupHooks() {
    console.log('🔗 Setting up Git hooks for automated change tracking...');

    try {
      // Ensure hooks directory exists
      await fs.mkdir(this.hooksDir, { recursive: true });

      // Setup individual hooks
      await this.setupCommitMsgHook();
      await this.setupPreCommitHook();
      await this.setupPostCommitHook();

      console.log('✅ Git hooks setup completed successfully');
      console.log('📋 Automatic change tracking is now active');
    } catch (error) {
      console.error('❌ Failed to setup Git hooks:', error.message);
      throw error;
    }
  }

  /**
   * Setup commit-msg hook to parse commit messages
   */
  async setupCommitMsgHook() {
    const hookPath = path.join(this.hooksDir, 'commit-msg');
    const hookContent = `#!/bin/sh
#
# 📝 Commit Message Hook - Automated Change Tracking
# Parses commit messages and creates change entries
#

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat $COMMIT_MSG_FILE)

# Extract change information from commit message
node "${this.scriptsDir}/parse-commit-message.js" "$COMMIT_MSG"
`;

    await fs.writeFile(hookPath, hookContent);
    await this.makeExecutable(hookPath);
    console.log('✅ commit-msg hook installed');
  }

  /**
   * Setup pre-commit hook for validation
   */
  async setupPreCommitHook() {
    const hookPath = path.join(this.hooksDir, 'pre-commit');
    const hookContent = `#!/bin/sh
#
# 🔍 Pre-commit Hook - Change Validation
# Validates changes before commit
#

echo "🔍 Validating changes before commit..."

# Run change validation
node "${this.scriptsDir}/validate-changes.js"

if [ $? -ne 0 ]; then
  echo "❌ Change validation failed. Commit aborted."
  exit 1
fi

echo "✅ Change validation passed"
`;

    await fs.writeFile(hookPath, hookContent);
    await this.makeExecutable(hookPath);
    console.log('✅ pre-commit hook installed');
  }

  /**
   * Setup post-commit hook for automatic changelog updates
   */
  async setupPostCommitHook() {
    const hookPath = path.join(this.hooksDir, 'post-commit');
    const hookContent = `#!/bin/sh
#
# 📋 Post-commit Hook - Automatic Changelog
# Updates changelog after successful commit
#

echo "📋 Processing commit for changelog..."

# Get the latest commit message and hash
COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_HASH=$(git log -1 --pretty=%H)

# Process the commit for changelog
node "${this.scriptsDir}/process-commit.js" "$COMMIT_MSG" "$COMMIT_HASH"

echo "✅ Commit processed for changelog"
`;

    await fs.writeFile(hookPath, hookContent);
    await this.makeExecutable(hookPath);
    console.log('✅ post-commit hook installed');
  }

  /**
   * Make file executable
   */
  async makeExecutable(filePath) {
    try {
      execSync(`chmod +x "${filePath}"`);
    } catch (error) {
      // On Windows, chmod might not work, but that's okay
      console.warn(`⚠️ Could not make ${filePath} executable:`, error.message);
    }
  }

  /**
   * Remove all hooks
   */
  async removeHooks() {
    console.log('🗑️ Removing Git hooks...');

    const hooks = ['commit-msg', 'pre-commit', 'post-commit'];
    
    for (const hook of hooks) {
      const hookPath = path.join(this.hooksDir, hook);
      try {
        await fs.unlink(hookPath);
        console.log(`✅ Removed ${hook} hook`);
      } catch (error) {
        console.warn(`⚠️ Could not remove ${hook} hook:`, error.message);
      }
    }
  }
}

// CLI Interface
async function main() {
  const setup = new GitHooksSetup();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'install':
        await setup.setupHooks();
        break;
        
      case 'remove':
        await setup.removeHooks();
        break;
        
      default:
        console.log(`
🔗 Git Hooks Setup Commands:

  install    Install Git hooks for automated change tracking
  remove     Remove all installed Git hooks

Examples:
  node setup-git-hooks.js install
  node setup-git-hooks.js remove
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

module.exports = GitHooksSetup;
