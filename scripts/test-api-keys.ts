/**
 * API Key Testing Script
 * This script tests all configured API keys to ensure they're working
 */

import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

async function testAnthropicKey() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('❌ Anthropic API key not configured');
    return false;
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hello' }]
    });

    console.log('✅ Anthropic Claude API key is working');
    return true;
  } catch (error: any) {
    console.log('❌ Anthropic API key failed:', error.message);
    return false;
  }
}

async function testOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OpenAI API key not configured');
    return false;
  }

  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10,
    });

    console.log('✅ OpenAI GPT API key is working');
    return true;
  } catch (error: any) {
    console.log('❌ OpenAI API key failed:', error.message);
    return false;
  }
}

async function testPerplexityKey() {
  if (!process.env.PERPLEXITY_API_KEY) {
    console.log('❌ Perplexity API key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{ role: 'user', content: 'Test medical query' }],
        max_tokens: 10,
        temperature: 0.1,
      }),
    });

    if (response.ok) {
      console.log('✅ Perplexity API key is working');
      return true;
    } else {
      console.log('❌ Perplexity API key failed:', response.status, response.statusText);
      return false;
    }
  } catch (error: any) {
    console.log('❌ Perplexity API key failed:', error.message);
    return false;
  }
}

async function testElevenLabsKey() {
  if (!process.env.ELEVENLABS_API_KEY) {
    console.log('❌ ElevenLabs API key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
      },
    });

    if (response.ok) {
      console.log('✅ ElevenLabs API key is working');
      return true;
    } else {
      console.log('❌ ElevenLabs API key failed:', response.status, response.statusText);
      return false;
    }
  } catch (error: any) {
    console.log('❌ ElevenLabs API key failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing API Keys...\n');

  const results = await Promise.all([
    testAnthropicKey(),
    testOpenAIKey(),
    testPerplexityKey(),
    testElevenLabsKey(),
  ]);

  const workingKeys = results.filter(Boolean).length;
  const totalKeys = results.length;

  console.log(`\n📊 Results: ${workingKeys}/${totalKeys} API keys are working`);

  if (workingKeys === 0) {
    console.log('\n⚠️  No API keys are working. Please check your configuration.');
    console.log('   See setup-secrets.md for instructions on how to set up your API keys.');
  } else if (workingKeys < totalKeys) {
    console.log('\n⚠️  Some API keys are not working. Some features may be disabled.');
  } else {
    console.log('\n🎉 All API keys are working! You\'re ready to go.');
  }
}

main().catch(console.error);
