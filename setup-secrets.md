# 🔐 Secure API Key Setup Guide

## Option 1: Using .env.local (Recommended for Local Development)

1. **Copy the template:**

   **Windows PowerShell:**
   ```powershell
   Copy-Item .env.local.example .env.local
   ```

   **Linux/Mac:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit .env.local with your actual API keys:**
   ```bash
   # Replace these with your actual keys:
   DATABASE_URL=your-database-url-here
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key
   OPENAI_API_KEY=sk-your-actual-openai-key
   PERPLEXITY_API_KEY=pplx-your-actual-perplexity-key
   ELEVENLABS_API_KEY=your-actual-elevenlabs-key
   ```

3. **The .env.local file is already in .gitignore and will never be committed!**

## Option 2: Using Environment Variables (Recommended for Production)

### Windows PowerShell:
```powershell
$env:ANTHROPIC_API_KEY="your-key-here"
$env:OPENAI_API_KEY="your-key-here"
$env:PERPLEXITY_API_KEY="your-key-here"
$env:ELEVENLABS_API_KEY="your-key-here"
```

### Windows Command Prompt:
```cmd
set ANTHROPIC_API_KEY=your-key-here
set OPENAI_API_KEY=your-key-here
set PERPLEXITY_API_KEY=your-key-here
set ELEVENLABS_API_KEY=your-key-here
```

### Linux/Mac:
```bash
export ANTHROPIC_API_KEY="your-key-here"
export OPENAI_API_KEY="your-key-here"
export PERPLEXITY_API_KEY="your-key-here"
export ELEVENLABS_API_KEY="your-key-here"
```

## Option 3: Using Replit Secrets (If deploying on Replit)

1. Go to your Replit project
2. Click on "Secrets" in the left sidebar
3. Add each key as a separate secret:
   - Key: `ANTHROPIC_API_KEY`, Value: `your-actual-key`
   - Key: `OPENAI_API_KEY`, Value: `your-actual-key`
   - Key: `PERPLEXITY_API_KEY`, Value: `your-actual-key`
   - Key: `ELEVENLABS_API_KEY`, Value: `your-actual-key`

## Option 4: Using Vercel/Netlify Environment Variables

1. Go to your deployment dashboard
2. Navigate to Environment Variables section
3. Add each API key as a separate environment variable

## 🔒 Security Best Practices

1. **Never commit API keys to version control**
2. **Use different keys for development and production**
3. **Rotate keys regularly**
4. **Monitor API usage for unusual activity**
5. **Use the principle of least privilege**

## 🧪 Testing Your Setup

After setting up your keys, you can test them by running:
```bash
npm run dev
```

The application will log which AI services are available based on your configured keys.

## 🚨 If You Accidentally Commit Keys

1. **Immediately revoke the compromised keys**
2. **Generate new keys**
3. **Update your environment configuration**
4. **Consider using git-secrets or similar tools**

## 📞 Getting API Keys

- **Anthropic Claude**: https://console.anthropic.com/
- **OpenAI**: https://platform.openai.com/api-keys
- **Perplexity**: https://www.perplexity.ai/settings/api
- **ElevenLabs**: https://elevenlabs.io/app/speech-synthesis
