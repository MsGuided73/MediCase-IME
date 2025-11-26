/**
 * GitHub Repository Setup Script
 * This script helps you set up and push your repository to GitHub
 */

import { execSync } from 'child_process';

function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

function checkGitStatus() {
  console.log('🔍 Checking Git Status...\n');

  try {
    // Check if git is initialized
    const gitStatus = runCommand('git status --porcelain');
    console.log('✅ Git repository is initialized');

    // Check for uncommitted changes
    if (gitStatus.trim()) {
      console.log('📝 Uncommitted changes found:');
      console.log(gitStatus);
      return false;
    } else {
      console.log('✅ Working directory is clean');
      return true;
    }
  } catch (error) {
    console.log('❌ Git not initialized or error occurred');
    return false;
  }
}

function checkRemotes() {
  console.log('\n🌐 Checking Remote Repositories...\n');

  try {
    const remotes = runCommand('git remote -v').trim();
    if (remotes) {
      console.log('📡 Current remotes:');
      console.log(remotes);
      return true;
    } else {
      console.log('❌ No remote repositories configured');
      return false;
    }
  } catch (error) {
    console.log('❌ No remote repositories configured');
    return false;
  }
}

function showRecentCommits() {
  console.log('\n📚 Recent Commits...\n');

  try {
    const commits = runCommand('git log --oneline -5');
    console.log(commits);
  } catch (error) {
    console.log('❌ No commits found');
  }
}

function checkSecurityFiles() {
  console.log('\n🔒 Security Check...\n');

  const securityFiles = [
    '.gitignore',
    '.env.local.example',
    'setup-secrets.md'
  ];

  let allGood = true;

  securityFiles.forEach(file => {
    try {
      // Use cross-platform file existence check
      const fs = require('fs');
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
      } else {
        console.log(`❌ ${file} missing`);
        allGood = false;
      }
    } catch (error) {
      console.log(`❌ ${file} missing`);
      allGood = false;
    }
  });

  // Check if sensitive files are ignored
  try {
    // Use cross-platform file reading
    const fs = require('fs');
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    const sensitivePatterns = ['.env', '.env.local', 'node_modules'];
    
    sensitivePatterns.forEach(pattern => {
      if (gitignore.includes(pattern)) {
        console.log(`✅ ${pattern} is in .gitignore`);
      } else {
        console.log(`⚠️  ${pattern} should be in .gitignore`);
        allGood = false;
      }
    });
  } catch (error) {
    console.log('❌ Could not read .gitignore');
    allGood = false;
  }

  return allGood;
}

function showGitHubInstructions() {
  console.log('\n🐙 GitHub Setup Instructions:\n');

  console.log('1. 🌐 Create GitHub Repository:');
  console.log('   - Go to https://github.com');
  console.log('   - Click "New repository"');
  console.log('   - Name: sherlock-health (or your preferred name)');
  console.log('   - Description: AI-Powered Medical Symptom Tracker');
  console.log('   - Set to Public or Private');
  console.log('   - DO NOT initialize with README (we have one)');
  console.log('   - Click "Create repository"');

  console.log('\n2. 🔗 Connect Local Repository:');
  console.log('   Replace "yourusername" with your GitHub username:');
  console.log('');
  console.log('   git remote add origin https://github.com/yourusername/sherlock-health.git');
  console.log('   git branch -M main');
  console.log('   git push -u origin main');

  console.log('\n3. 🚀 Alternative: Use GitHub CLI (if installed):');
  console.log('   gh repo create sherlock-health --public --source=. --remote=origin --push');

  console.log('\n4. ✅ Verify Setup:');
  console.log('   git remote -v');
  console.log('   git log --oneline -5');
}

function showNextSteps() {
  console.log('\n📋 After GitHub Setup:\n');

  console.log('1. 🔧 Repository Configuration:');
  console.log('   - Add description and topics');
  console.log('   - Enable Issues and Projects');
  console.log('   - Set up branch protection');

  console.log('\n2. 🚀 Deployment Options:');
  console.log('   - Vercel: Connect GitHub repo for auto-deploy');
  console.log('   - Railway: Deploy with database included');
  console.log('   - Netlify: Static site deployment');

  console.log('\n3. 🤝 Collaboration:');
  console.log('   - Add collaborators');
  console.log('   - Set up issue templates');
  console.log('   - Create project boards');

  console.log('\n4. 🔄 CI/CD:');
  console.log('   - Set up GitHub Actions');
  console.log('   - Add automated testing');
  console.log('   - Configure deployment workflows');
}

async function main() {
  console.log('🐙 GitHub Repository Setup Assistant\n');

  const isClean = checkGitStatus();
  const hasRemotes = checkRemotes();
  showRecentCommits();
  const isSecure = checkSecurityFiles();

  if (!isSecure) {
    console.log('\n⚠️  Security issues found. Please fix before pushing to GitHub.');
    return;
  }

  if (!isClean) {
    console.log('\n📝 You have uncommitted changes. Commit them first:');
    console.log('   git add .');
    console.log('   git commit -m "Add latest changes"');
    return;
  }

  if (hasRemotes) {
    console.log('\n✅ Remote repository already configured!');
    console.log('\n🚀 To push latest changes:');
    console.log('   git push origin main');
  } else {
    showGitHubInstructions();
  }

  showNextSteps();

  console.log('\n📖 Documentation:');
  console.log('   github-setup.md  - Complete GitHub setup guide');
  console.log('   README.md        - Project documentation');
  console.log('   LICENSE          - MIT License with medical disclaimer');
}

main().catch(console.error);
