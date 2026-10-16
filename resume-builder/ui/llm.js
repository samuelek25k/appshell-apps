// Multi-LLM provider completion client for Resume Builder.
// Supports OpenAI, Anthropic Claude, Google Gemini, Groq, and local Ollama.

export const PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'o1-mini'],
    endpoint: 'https://api.openai.com/v1/chat/completions',
    requiresKey: true,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    defaultModel: 'claude-3-5-sonnet-latest',
    models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
    endpoint: 'https://api.anthropic.com/v1/messages',
    requiresKey: true,
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModel: 'gemini-1.5-flash',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    requiresKey: true,
  },
  groq: {
    id: 'groq',
    name: 'Groq (Llama)',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    requiresKey: true,
  },
  ollama: {
    id: 'ollama',
    name: 'Local Ollama',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'mistral', 'qwen2.5'],
    endpoint: 'http://localhost:11434/api/chat',
    requiresKey: false,
  }
};

export async function generateCompletion({ providerId, model, apiKey, systemPrompt, userPrompt }) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  if (provider.requiresKey && !apiKey?.trim()) {
    throw new Error(`API key required for ${provider.name}. Please configure it in LLM Settings.`);
  }

  const selectedModel = model || provider.defaultModel;

  switch (providerId) {
    case 'openai':
    case 'groq': {
      const res = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status} from ${provider.name}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }

    case 'anthropic': {
      const res = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: selectedModel,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          max_tokens: 2000,
          temperature: 0.4
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status} from Anthropic`);
      }
      const data = await res.json();
      return data.content?.map(c => c.text).join('\n') || '';
    }

    case 'gemini': {
      const url = `${provider.endpoint}/${selectedModel}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nTask:\n${userPrompt}` }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2000 }
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status} from Gemini`);
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
    }

    case 'ollama': {
      const res = await fetch(provider.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          stream: false
        })
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from Ollama. Make sure Ollama is running at localhost:11434`);
      }
      const data = await res.json();
      return data.message?.content || '';
    }

    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
}
