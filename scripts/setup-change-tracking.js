#!/usr/bin/env node

/**
 * 🚀 Change Tracking System Setup
 * Sherlock Health → Patient HQ Development
 * 
 * Complete setup script for automated change tracking and changelog maintenance
 */

const ChangeTracker = require('./change-tracker');
const GitHooksSetup = require('./setup-git-hooks');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ChangeTrackingSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.scriptsDir = path.join(this.projectRoot, 'scripts');
  }

  /**
   * Complete setup of change tracking system
   */
  async setup() {
    console.log('🚀 Setting up Change Tracking System for Sherlock Health → Patient HQ');
    console.log('=' .repeat(70));

    try {
      // Step 1: Initialize change tracker
      console.log('\n📋 Step 1: Initializing Change Tracker...');
      const tracker = new ChangeTracker();
      await tracker.initialize();

      // Step 2: Setup Git hooks
      console.log('\n🔗 Step 2: Setting up Git Hooks...');
      const gitHooks = new GitHooksSetup();
      await gitHooks.setupHooks();

      // Step 3: Create package.json scripts
      console.log('\n📦 Step 3: Adding NPM Scripts...');
      await this.addNpmScripts();

      // Step 4: Create initial documentation
      console.log('\n📚 Step 4: Creating Documentation...');
      await this.createDocumentation();

      // Step 5: Validate setup
      console.log('\n✅ Step 5: Validating Setup...');
      await this.validateSetup();

      console.log('\n' + '=' .repeat(70));
      console.log('🎉 Change Tracking System Setup Complete!');
      console.log('\n📋 Available Commands:');
      console.log('  npm run changelog:add <category> <description>');
      console.log('  npm run changelog:generate [version]');
      console.log('  npm run changelog:status');
      console.log('  npm run changelog:validate');
      console.log('\n🔗 Git Hooks Active:');
      console.log('  ✅ commit-msg: Automatic change parsing');
      console.log('  ✅ pre-commit: Change validation');
      console.log('  ✅ post-commit: Automatic changelog updates');
      console.log('\n📚 Documentation:');
      console.log('  📄 CHANGELOG.md - Main changelog file');
      console.log('  📄 docs/change-tracking-guide.md - Usage guide');
      console.log('  📄 docs/dashboard_comparison_analysis.md - Updated analysis');

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Add NPM scripts for change tracking
   */
  async addNpmScripts() {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

      // Add change tracking scripts
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      const changeTrackingScripts = {
        'changelog:add': 'node scripts/change-tracker.js add',
        'changelog:generate': 'node scripts/change-tracker.js generate',
        'changelog:status': 'node scripts/change-tracker.js status',
        'changelog:validate': 'node scripts/validate-changes.js',
        'changelog:setup': 'node scripts/setup-change-tracking.js',
        'changelog:hooks:install': 'node scripts/setup-git-hooks.js install',
        'changelog:hooks:remove': 'node scripts/setup-git-hooks.js remove'
      };

      // Merge with existing scripts
      Object.assign(packageJson.scripts, changeTrackingScripts);

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ NPM scripts added to package.json');

    } catch (error) {
      console.warn('⚠️ Could not update package.json:', error.message);
    }
  }

  /**
   * Create documentation files
   */
  async createDocumentation() {
    try {
      // Ensure docs directory exists
      const docsDir = path.join(this.projectRoot, 'docs');
      await fs.mkdir(docsDir, { recursive: true });

      // Create change tracking guide
      await this.createChangeTrackingGuide();

      // Create commit message guide
      await this.createCommitMessageGuide();

      console.log('✅ Documentation created');

    } catch (error) {
      console.warn('⚠️ Could not create documentation:', error.message);
    }
  }

  /**
   * Create change tracking guide
   */
  async createChangeTrackingGuide() {
    const guidePath = path.join(this.projectRoot, 'docs', 'change-tracking-guide.md');
    
    const guide = `# 📋 Change Tracking System Guide
## Sherlock Health → Patient HQ Development

### 🎯 Overview

The automated change tracking system helps maintain a comprehensive changelog and ensures quality control for the Sherlock Health to Patient HQ transition.

---

## 🚀 Quick Start

### Adding Changes Manually
\`\`\`bash
# Add a new feature
npm run changelog:add feature "Added QR code patient portal"

# Add a bug fix
npm run changelog:add bugfix "Fixed grid layout issues in medical dashboard"

# Add documentation
npm run changelog:add docs "Updated API documentation"
\`\`\`

### Generating Changelog
\`\`\`bash
# Generate changelog from pending changes
npm run changelog:generate

# Generate changelog for specific version
npm run changelog:generate "v5.1.0"
\`\`\`

### Checking Status
\`\`\`bash
# View pending changes
npm run changelog:status

# Validate current changes
npm run changelog:validate
\`\`\`

---

## 🔗 Automatic Git Integration

### Git Hooks (Automatically Installed)

1. **commit-msg**: Parses commit messages and creates change entries
2. **pre-commit**: Validates changes before commit
3. **post-commit**: Updates changelog automatically

### Conventional Commit Format
\`\`\`
feat(auth): add user authentication system
fix(dashboard): resolve grid layout issues
docs(api): update endpoint documentation
refactor(ai): optimize analysis pipeline
\`\`\`

---

## 📊 Change Categories

| Category | Description | Example |
|----------|-------------|---------|
| \`major\` | Breaking changes, major features | Architecture changes |
| \`feature\` | New functionality | QR code portal |
| \`improvement\` | Technical improvements | Performance optimization |
| \`bugfix\` | Bug fixes | Layout issues |
| \`security\` | Security updates | HIPAA compliance |
| \`docs\` | Documentation | API guides |
| \`ui\` | UI/UX improvements | Dashboard redesign |
| \`test\` | Testing | Unit tests |

---

## 🔍 Validation Rules

### Commit Message Validation
- Minimum 10 characters
- Conventional format or descriptive message
- No empty commits

### File Change Validation
- Critical files require additional validation
- Medical files checked for HIPAA compliance
- Security issues automatically detected

### Documentation Requirements
- Major code changes should include documentation
- Schema changes require migration notes
- API changes need updated documentation

---

## 📈 Best Practices

### Writing Good Commit Messages
\`\`\`bash
# Good
feat(portal): add QR code patient access system
fix(dashboard): resolve mobile responsiveness issues
docs(api): add lab analytics integration guide

# Avoid
fix stuff
update files
changes
\`\`\`

### Change Descriptions
- Be specific and descriptive
- Include impact on users/system
- Reference related issues or PRs
- Use medical terminology appropriately

### Medical Compliance
- Always consider HIPAA implications
- Include security measures for sensitive data
- Document clinical workflow impacts
- Validate medical terminology accuracy

---

## 🛠️ Troubleshooting

### Git Hooks Not Working
\`\`\`bash
# Reinstall hooks
npm run changelog:hooks:install

# Check hook permissions
ls -la .git/hooks/
\`\`\`

### Validation Failures
\`\`\`bash
# Check what's failing
npm run changelog:validate

# View pending changes
npm run changelog:status
\`\`\`

### Manual Changelog Generation
\`\`\`bash
# Force generate changelog
npm run changelog:generate

# Add missing change manually
npm run changelog:add improvement "Manual change entry"
\`\`\`

---

## 📋 File Structure

\`\`\`
project/
├── CHANGELOG.md                    # Main changelog
├── .changes/                       # Pending changes
│   ├── change_123456_abc.json     # Individual changes
│   └── archived_2024-01-15_*.json # Archived changes
├── scripts/
│   ├── change-tracker.js          # Main tracker
│   ├── parse-commit-message.js    # Commit parser
│   ├── validate-changes.js        # Validation
│   └── process-commit.js          # Post-commit processor
└── docs/
    ├── change-tracking-guide.md   # This guide
    └── commit-message-guide.md    # Commit guidelines
\`\`\`

---

**Last Updated**: ${new Date().toISOString().split('T')[0]}
**Maintained By**: Development Team
`;

    await fs.writeFile(guidePath, guide);
  }

  /**
   * Create commit message guide
   */
  async createCommitMessageGuide() {
    const guidePath = path.join(this.projectRoot, 'docs', 'commit-message-guide.md');
    
    const guide = `# 📝 Commit Message Guidelines
## Sherlock Health → Patient HQ Development

### 🎯 Conventional Commit Format

\`\`\`
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
\`\`\`

---

## 🏷️ Commit Types

| Type | Description | Example |
|------|-------------|---------|
| \`feat\` | New feature | \`feat(portal): add QR code access\` |
| \`fix\` | Bug fix | \`fix(dashboard): resolve grid layout\` |
| \`docs\` | Documentation | \`docs(api): update endpoints\` |
| \`style\` | Code style | \`style(ui): improve button styling\` |
| \`refactor\` | Code refactoring | \`refactor(ai): optimize analysis\` |
| \`perf\` | Performance | \`perf(db): improve query speed\` |
| \`test\` | Testing | \`test(auth): add login tests\` |
| \`chore\` | Maintenance | \`chore(deps): update packages\` |
| \`security\` | Security | \`security(auth): fix vulnerability\` |
| \`major\` | Breaking change | \`major(api): redesign endpoints\` |

---

## 🏥 Medical Context Scopes

| Scope | Description | Example |
|-------|-------------|---------|
| \`patient\` | Patient interface | \`feat(patient): add symptom tracker\` |
| \`physician\` | Provider interface | \`feat(physician): add patient roster\` |
| \`diagnosis\` | Differential diagnosis | \`fix(diagnosis): improve AI accuracy\` |
| \`lab\` | Lab analytics | \`feat(lab): add temporal analysis\` |
| \`voice\` | Voice interface | \`fix(voice): improve recognition\` |
| \`ai\` | AI services | \`perf(ai): optimize response time\` |
| \`portal\` | Patient portal | \`feat(portal): add QR access\` |
| \`dashboard\` | Medical dashboard | \`fix(dashboard): mobile layout\` |
| \`auth\` | Authentication | \`security(auth): add 2FA\` |
| \`compliance\` | HIPAA/Security | \`security(compliance): audit logs\` |

---

## ✅ Good Examples

\`\`\`bash
# Feature additions
feat(portal): add QR code patient access system
feat(ai): integrate standalone lab analytics module
feat(physician): add patient search with AI insights

# Bug fixes
fix(dashboard): resolve mobile grid layout issues
fix(voice): improve medical terminology recognition
fix(auth): handle session timeout gracefully

# Documentation
docs(api): add lab analytics integration guide
docs(setup): update deployment instructions
docs(compliance): add HIPAA audit checklist

# Performance improvements
perf(ai): optimize triple-AI analysis pipeline
perf(db): improve symptom query performance
perf(ui): reduce dashboard load time

# Security updates
security(auth): implement rate limiting
security(data): encrypt sensitive patient data
security(api): add input validation
\`\`\`

---

## ❌ Avoid These

\`\`\`bash
# Too vague
fix stuff
update files
changes
improvements

# No context
fixed bug
added feature
updated docs

# Not descriptive
wip
temp
test commit
\`\`\`

---

## 🏥 Medical-Specific Guidelines

### HIPAA Compliance
- Always mention security implications
- Reference compliance requirements
- Document data handling changes

\`\`\`bash
security(patient): encrypt PHI in transit and at rest
compliance(audit): add patient data access logging
fix(privacy): remove PII from error messages
\`\`\`

### Clinical Workflow
- Describe impact on healthcare providers
- Mention patient safety considerations
- Reference clinical guidelines

\`\`\`bash
feat(workflow): streamline physician documentation process
fix(safety): add critical value alerts for lab results
improvement(clinical): optimize diagnostic workflow
\`\`\`

### AI/Medical Accuracy
- Specify AI model improvements
- Mention clinical validation
- Reference medical literature

\`\`\`bash
feat(ai): improve differential diagnosis accuracy to 94%
fix(analysis): correct lab value interpretation logic
improvement(medical): validate against clinical guidelines
\`\`\`

---

## 📋 Commit Body Guidelines

### Include When Relevant
- **Why**: Explain the reasoning behind the change
- **Impact**: Describe user/system impact
- **Testing**: Mention testing approach
- **References**: Link to issues, PRs, or documentation

### Example with Body
\`\`\`
feat(portal): add QR code patient access system

Implements secure 24-hour patient portal access via QR codes.
Patients can view their health insights without login credentials.

- Generates unique session tokens with 24-hour expiration
- Integrates with existing differential diagnosis system
- Includes patient-friendly health report formatting
- Maintains HIPAA compliance with audit logging

Closes #123
Refs: Patient HQ transition requirements
\`\`\`

---

**Last Updated**: ${new Date().toISOString().split('T')[0]}
**Maintained By**: Development Team
`;

    await fs.writeFile(guidePath, guide);
  }

  /**
   * Validate setup
   */
  async validateSetup() {
    const validations = [];

    // Check if change tracker is initialized
    try {
      const changesDir = path.join(this.projectRoot, '.changes');
      await fs.access(changesDir);
      validations.push('✅ Change tracker initialized');
    } catch {
      validations.push('❌ Change tracker not initialized');
    }

    // Check if Git hooks are installed
    try {
      const hooksDir = path.join(this.projectRoot, '.git', 'hooks');
      const commitMsgHook = path.join(hooksDir, 'commit-msg');
      await fs.access(commitMsgHook);
      validations.push('✅ Git hooks installed');
    } catch {
      validations.push('❌ Git hooks not installed');
    }

    // Check if changelog exists
    try {
      const changelogPath = path.join(this.projectRoot, 'CHANGELOG.md');
      await fs.access(changelogPath);
      validations.push('✅ Changelog file exists');
    } catch {
      validations.push('❌ Changelog file missing');
    }

    // Check if documentation exists
    try {
      const guidePath = path.join(this.projectRoot, 'docs', 'change-tracking-guide.md');
      await fs.access(guidePath);
      validations.push('✅ Documentation created');
    } catch {
      validations.push('❌ Documentation missing');
    }

    validations.forEach(validation => console.log(validation));

    const failures = validations.filter(v => v.startsWith('❌'));
    if (failures.length > 0) {
      throw new Error(\`Setup validation failed: \${failures.length} issues found\`);
    }
  }

  /**
   * Remove change tracking system
   */
  async remove() {
    console.log('🗑️ Removing Change Tracking System...');

    try {
      // Remove Git hooks
      const gitHooks = new GitHooksSetup();
      await gitHooks.removeHooks();

      // Remove .changes directory
      const changesDir = path.join(this.projectRoot, '.changes');
      await fs.rmdir(changesDir, { recursive: true });

      // Remove NPM scripts (optional - user choice)
      console.log('⚠️ NPM scripts left in package.json (remove manually if desired)');

      console.log('✅ Change tracking system removed');

    } catch (error) {
      console.error('❌ Failed to remove change tracking system:', error.message);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const setup = new ChangeTrackingSetup();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'setup':
      case 'install':
        await setup.setup();
        break;
        
      case 'remove':
      case 'uninstall':
        await setup.remove();
        break;
        
      default:
        console.log(\`
🚀 Change Tracking System Setup

Commands:
  setup     Complete setup of change tracking system
  remove    Remove change tracking system

Examples:
  node setup-change-tracking.js setup
  node setup-change-tracking.js remove
        \`);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ChangeTrackingSetup;
