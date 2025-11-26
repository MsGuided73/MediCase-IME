# 🐙 GitHub Repository Setup Guide

## 🎯 Why Set Up GitHub?

- **Version Control**: Track all changes and collaborate safely
- **Backup**: Secure cloud backup of your code
- **Deployment**: Easy integration with hosting platforms
- **Collaboration**: Share with team members or contributors
- **Issue Tracking**: Manage bugs and feature requests
- **Documentation**: Host guides and wikis

## 🚀 Quick Setup Steps

### 1. Create GitHub Repository

#### Option A: GitHub Website
1. Go to [github.com](https://github.com)
2. Click **"New repository"**
3. Repository name: `sherlock-health` (or your preferred name)
4. Description: `AI-Powered Medical Symptom Tracker`
5. Set to **Public** or **Private** (your choice)
6. ✅ **DO NOT** initialize with README (we already have one)
7. Click **"Create repository"**

#### Option B: GitHub CLI (if installed)
```bash
gh repo create sherlock-health --public --description "AI-Powered Medical Symptom Tracker"
```

### 2. Initialize Local Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Sherlock Health AI Medical Tracker

- Complete React + TypeScript frontend
- Express + Node.js backend with Drizzle ORM
- Multi-AI integration (Claude, GPT-4o, Perplexity)
- Comprehensive medical database schema
- Supabase integration for database and auth
- Voice synthesis with ElevenLabs
- Mobile-first responsive design
- Secure API key management"
```

### 3. Connect to GitHub

```bash
# Add GitHub remote (replace with your actual repository URL)
git remote add origin https://github.com/yourusername/sherlock-health.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🔒 Security Checklist

Before pushing, verify these files are in `.gitignore`:

✅ `.env`
✅ `.env.local`
✅ `.env.production`
✅ `.env.development`
✅ `node_modules/`
✅ `dist/`
✅ `*.log`

**Double-check**: Your API keys should NEVER be in the repository!

## 📋 Repository Configuration

### 1. Repository Settings
- **Description**: Add a clear description
- **Topics**: Add relevant tags (medical, ai, healthcare, react, typescript)
- **Website**: Add your deployment URL when ready

### 2. Branch Protection (Recommended)
1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

### 3. Issues and Projects
1. Enable **Issues** for bug tracking
2. Create **Project** for roadmap management
3. Set up **Issue templates** for bugs and features

## 🏷️ Recommended Repository Structure

```
sherlock-health/
├── 📄 README.md              # Main documentation
├── 📄 LICENSE                # MIT License
├── 📄 .gitignore            # Git ignore rules
├── 📄 package.json          # Dependencies and scripts
├── 📄 todo.md               # Development roadmap
├── 📁 client/               # Frontend React app
├── 📁 server/               # Backend Express app
├── 📁 shared/               # Shared types and schemas
├── 📁 scripts/              # Utility scripts
├── 📁 docs/                 # Additional documentation
│   ├── setup-secrets.md
│   ├── database-setup.md
│   ├── supabase-setup.md
│   └── deployment.md
└── 📁 .github/              # GitHub workflows and templates
    ├── workflows/
    ├── ISSUE_TEMPLATE/
    └── pull_request_template.md
```

## 🔄 Git Workflow

### Daily Development
```bash
# Pull latest changes
git pull origin main

# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature: description"

# Push feature branch
git push origin feature/new-feature

# Create Pull Request on GitHub
```

### Commit Message Convention
```bash
# Format: type(scope): description

git commit -m "feat(auth): add Supabase authentication"
git commit -m "fix(api): resolve symptom entry validation"
git commit -m "docs(setup): update database configuration guide"
git commit -m "refactor(ui): improve mobile navigation"
```

## 🚀 Deployment Integration

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Auto-deploy on push to main

### Railway
1. Connect GitHub repository
2. Configure environment variables
3. Deploy with database included

### Netlify
1. Connect repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

## 📊 GitHub Features to Enable

### 1. GitHub Actions (CI/CD)
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run check
      - run: npm run test:keys
```

### 2. Issue Templates
Create templates for:
- 🐛 Bug reports
- ✨ Feature requests
- 📚 Documentation improvements
- 🔒 Security issues

### 3. Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tests pass
- [ ] Manual testing completed
- [ ] API keys tested

## Medical Disclaimer
- [ ] Changes maintain medical disclaimer compliance
```

## 🎯 Next Steps After GitHub Setup

1. **Set up deployment** (Vercel/Railway/Netlify)
2. **Configure CI/CD** with GitHub Actions
3. **Create project board** for task management
4. **Set up issue templates** for bug tracking
5. **Add collaborators** if working with a team
6. **Configure branch protection** for main branch

## 🆘 Troubleshooting

**Large file errors:**
```bash
# If you accidentally committed large files
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch path/to/large/file' --prune-empty --tag-name-filter cat -- --all
```

**API keys accidentally committed:**
1. **Immediately revoke** the compromised keys
2. **Generate new keys**
3. **Remove from git history** using git filter-branch
4. **Update environment configuration**

**Push rejected:**
```bash
# If remote has changes you don't have
git pull origin main --rebase
git push origin main
```

## 📞 Support

- **GitHub Docs**: [docs.github.com](https://docs.github.com)
- **Git Tutorial**: [git-scm.com/docs/gittutorial](https://git-scm.com/docs/gittutorial)
- **GitHub CLI**: [cli.github.com](https://cli.github.com)

Ready to push your code to GitHub? 🚀
