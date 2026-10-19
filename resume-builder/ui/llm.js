
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
    models: ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'qwen2.5', 'phi3', 'gemma2'],
    endpoint: 'http://localhost:11434/api/chat',
    requiresKey: false,
  },
  custom: {
    id: 'custom',
    name: 'Custom AI Provider / Gateway',
    defaultModel: 'llama3.3',
    models: ['llama3.3', 'llama3.2', 'mistral', 'qwen2.5', 'deepseek-chat', 'gpt-4o', 'gpt-4o-mini'],
    endpoint: 'http://localhost:11434/v1/chat/completions',
    requiresKey: false,
  }
};

export const DEFAULT_OLLAMA = 'http://localhost:11434';

export function ollamaBase(value) {
  return (value || DEFAULT_OLLAMA).trim().replace(/\/+$/, '');
}

export function resolveCustomEndpoint(rawEndpoint) {
  let urlStr = (rawEndpoint || '').trim();
  if (!urlStr) {
    urlStr = 'http://localhost:11434/v1/chat/completions';
  }
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `http://${urlStr}`;
  }
  try {
    const u = new URL(urlStr);
    if (!u.pathname || u.pathname === '/') {
      u.pathname = '/v1/chat/completions';
    } else if (!u.pathname.endsWith('/chat/completions') && !u.pathname.endsWith('/chat')) {
      u.pathname = u.pathname.replace(/\/+$/, '') + '/chat/completions';
    }
    return u.toString();
  } catch {
    return urlStr;
  }
}

export async function generateCompletion({ providerId, model, apiKey, systemPrompt, userPrompt, endpoint, customEndpoint, sdk }) {
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
      let res;
      try {
        res = await fetch(provider.endpoint, {
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
      } catch (err) {
        throw new Error(`Cannot connect to Ollama at localhost:11434. Make sure Ollama is running ('ollama serve' or start the Ollama desktop app).`);
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status} from Ollama. Make sure the model "${selectedModel}" is downloaded ('ollama run ${selectedModel}')`);
      }
      const data = await res.json();
      return data.message?.content || '';
    }

    case 'custom': {
      const targetUrl = resolveCustomEndpoint(customEndpoint || provider.endpoint);
      if (sdk?.network?.requestEndpoint) {
        try {
          await sdk.network.requestEndpoint(targetUrl);
        } catch (err) {
          console.warn('Network endpoint request warning:', err);
        }
      }

      const isOllamaChat = targetUrl.endsWith('/api/chat');
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey?.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const bodyPayload = isOllamaChat
        ? {
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            stream: false
          }
        : {
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.4
          };

      let res;
      try {
        res = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload)
        });
      } catch (err) {
        throw new Error(`Failed to connect to ${targetUrl}: ${err.message}. Verify that the server or gateway is running and accessible.`);
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const errMsg = errJson.error?.message || errJson.error || errJson.message || `HTTP ${res.status} from ${targetUrl}`;
        throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ??
                      data.message?.content ??
                      data.candidates?.[0]?.content?.parts?.[0]?.text ??
                      (typeof data.response === 'string' ? data.response : '');

      if (!content && typeof data === 'string') return data;
      return content || '';
    }

    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
}
