import { vault } from './crypto.js';
import { generateCompletion, ollamaBase, PROVIDERS } from './llm.js';

let sdk = null;
try { sdk = await import('/__appshell/sdk.js'); } catch {}

const DEFAULT_DATA = {
  template: 'modern',
  personal: {
    name: 'Alex Rivera',
    title: 'Senior Full Stack Engineer',
    email: 'alex.rivera@example.com',
    phone: '+1 (555) 019-2834',
    location: 'San Francisco, CA',
    website: 'https://alexrivera.dev',
    linkedin: 'linkedin.com/in/alexrivera',
    github: 'github.com/alexrivera'
  },
  summary: 'Accomplished Full Stack Software Engineer with 7+ years of experience engineering resilient distributed cloud microservices, high-throughput backend APIs, and reactive web applications. Proven track record of reducing latency by 40% and mentoring high-performing engineering teams.',
  experience: [
    {
      company: 'Vanguard Systems',
      role: 'Staff Software Engineer',
      location: 'San Francisco, CA',
      period: '2022 – Present',
      bullets: [
        'Architected real-time WebSocket event streaming pipeline processing 12M events daily, reducing end-to-end sync latency by 42%.',
        'Led migration of legacy monolith to decoupled Node.js and Go microservices deployed on Kubernetes with 99.99% uptime.',
        'Mentored 6 engineers and standardized OpenAPI code-generation tooling across 4 product squads.'
      ]
    },
    {
      company: 'Aether Cloud',
      role: 'Senior Software Engineer',
      location: 'Austin, TX',
      period: '2019 – 2022',
      bullets: [
        'Designed high-availability PostgreSQL and Redis caching architecture, cutting P99 database query response times from 320ms to 45ms.',
        'Engineered full-stack developer CLI and dashboard using TypeScript, Tailwind, and React with end-to-end test coverage.'
      ]
    }
  ],
  education: [
    {
      school: 'University of Texas at Austin',
      degree: 'B.S. in Computer Science',
      year: '2015 – 2019'
    }
  ],
  skills: [
    'TypeScript / JavaScript', 'Go', 'Python', 'React / Next.js',
    'Node.js', 'PostgreSQL', 'Redis', 'Docker / Kubernetes', 'AWS / Cloud Architecture', 'System Design'
  ],
  projects: [
    {
      name: 'OmniStream Engine',
      description: 'Open-source distributed streaming proxy with zero-allocation buffer pooling.',
      link: 'github.com/alexrivera/omnistream'
    }
  ]
};

let resume = (sdk ? await sdk.storage?.get('active_resume') : null) ||
             JSON.parse(localStorage.getItem('__rb_resume_data') || 'null') ||
             DEFAULT_DATA;

let llmSettings = JSON.parse(localStorage.getItem('__rb_llm_settings') || 'null') || {
  provider: 'gemini',
  model: 'gemini-1.5-flash'
};
llmSettings.endpoint ??= '';

const $ = (id) => document.getElementById(id);

async function persist() {
  if (sdk?.storage?.set) {
    try { await sdk.storage.set('active_resume', resume); } catch {}
  }
  localStorage.setItem('__rb_resume_data', JSON.stringify(resume));

  if (sdk?.widgets?.update) {
    try {
      await sdk.widgets.update('active-resume', {
        blocks: [
          { type: 'metric', label: 'Resume', value: resume.personal.name || 'Untitled' },
          { type: 'text', text: `${resume.personal.title || 'Professional'} • ${resume.experience.length} roles` }
        ]
      });
    } catch {}
  }
}

function initEditor() {
  $('field-name').value = resume.personal.name || '';
  $('field-title').value = resume.personal.title || '';
  $('field-email').value = resume.personal.email || '';
  $('field-phone').value = resume.personal.phone || '';
  $('field-location').value = resume.personal.location || '';
  $('field-website').value = resume.personal.website || '';
  $('field-linkedin').value = resume.personal.linkedin || '';
  $('field-github').value = resume.personal.github || '';
  $('field-summary').value = resume.summary || '';
  $('field-skills').value = (resume.skills || []).join(', ');

  renderExperienceFields();
  renderEducationFields();
  renderProjectFields();
}

function renderExperienceFields() {
  const container = $('experience-container');
  container.innerHTML = '';
  resume.experience.forEach((exp, idx) => {
    const card = document.createElement('div');
    card.className = 'p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Experience #${idx + 1}</span>
        <button type="button" class="text-xs text-rose-500 hover:underline remove-exp" data-idx="${idx}">Remove</button>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <input type="text" placeholder="Company" value="${exp.company}" class="exp-company px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" data-idx="${idx}">
        <input type="text" placeholder="Role / Title" value="${exp.role}" class="exp-role px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" data-idx="${idx}">
        <input type="text" placeholder="Location" value="${exp.location || ''}" class="exp-location px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" data-idx="${idx}">
        <input type="text" placeholder="Period (e.g. 2021 – Present)" value="${exp.period || ''}" class="exp-period px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" data-idx="${idx}">
      </div>
      <div>
        <label class="block text-[11px] text-slate-400 mb-1">Key Achievements & Bullet Points (one per line)</label>
        <textarea rows="3" class="exp-bullets w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono" data-idx="${idx}">${(exp.bullets || []).join('\n')}</textarea>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderEducationFields() {
  const container = $('education-container');
  container.innerHTML = '';
  resume.education.forEach((edu, idx) => {
    const card = document.createElement('div');
    card.className = 'p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Education #${idx + 1}</span>
        <button type="button" class="text-xs text-rose-500 hover:underline remove-edu" data-idx="${idx}">Remove</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input type="text" placeholder="Institution / University" value="${edu.school}" class="edu-school px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" data-idx="${idx}">
        <input type="text" placeholder="Degree / Field" value="${edu.degree}" class="edu-degree px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" data-idx="${idx}">
        <input type="text" placeholder="Year(s)" value="${edu.year}" class="edu-year px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" data-idx="${idx}">
      </div>
    `;
    container.appendChild(card);
  });
}

function renderProjectFields() {
  const container = $('projects-container');
  container.innerHTML = '';
  (resume.projects || []).forEach((proj, idx) => {
    const card = document.createElement('div');
    card.className = 'p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Project #${idx + 1}</span>
        <button type="button" class="text-xs text-rose-500 hover:underline remove-proj" data-idx="${idx}">Remove</button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <input type="text" placeholder="Project Name" value="${proj.name}" class="proj-name px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" data-idx="${idx}">
        <input type="text" placeholder="Link / URL" value="${proj.link || ''}" class="proj-link px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" data-idx="${idx}">
      </div>
      <input type="text" placeholder="One-line summary" value="${proj.description || ''}" class="proj-desc w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" data-idx="${idx}">
    `;
    container.appendChild(card);
  });
}

function renderPreview() {
  const sheet = $('resume-sheet');
  const tplClass = `tpl-${resume.template || 'modern'}`;
  sheet.className = `resume-sheet ${tplClass} p-8 sm:p-10 bg-white text-slate-900 min-h-[900px] shadow-sm`;

  const p = resume.personal;
  const contacts = [
    p.email && `<span>✉ ${p.email}</span>`,
    p.phone && `<span>☎ ${p.phone}</span>`,
    p.location && `<span>📍 ${p.location}</span>`,
    p.website && `<span>🌐 ${p.website}</span>`,
    p.linkedin && `<span>in/${p.linkedin.replace(/^.*linkedin\.com\/in\//, '')}</span>`,
    p.github && `<span>gh/${p.github.replace(/^.*github\.com\//, '')}</span>`
  ].filter(Boolean).join(' • ');

  sheet.innerHTML = `
    <!-- Header -->
    <header class="resume-header">
      <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">${p.name || 'Your Name'}</h1>
      <p class="text-sm font-semibold text-sky-700 tracking-wide mt-1">${p.title || 'Professional Title'}</p>
      <div class="text-xs text-slate-500 mt-2 flex flex-wrap gap-x-2 gap-y-1">
        ${contacts}
      </div>
    </header>

    <!-- Professional Summary -->
    ${resume.summary ? `
      <section>
        <h2 class="section-title">Summary</h2>
        <p class="text-xs sm:text-[13px] text-slate-700 leading-relaxed">${resume.summary}</p>
      </section>
    ` : ''}

    <!-- Experience -->
    ${resume.experience?.length ? `
      <section>
        <h2 class="section-title">Professional Experience</h2>
        <div class="space-y-4">
          ${resume.experience.map(exp => `
            <div>
              <div class="flex items-baseline justify-between text-xs sm:text-sm">
                <span class="font-bold text-slate-900">${exp.role} <span class="font-normal text-slate-600">at</span> ${exp.company}</span>
                <span class="text-xs font-mono text-slate-500">${exp.period || ''}</span>
              </div>
              ${exp.location ? `<div class="text-[11px] text-slate-400">${exp.location}</div>` : ''}
              <ul class="list-disc list-outside ml-4 mt-1.5 space-y-1 text-xs text-slate-700">
                ${(exp.bullets || []).map(b => `<li>${b}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </section>
    ` : ''}

    <!-- Skills -->
    ${resume.skills?.length ? `
      <section>
        <h2 class="section-title">Core Competencies & Technologies</h2>
        <div class="flex flex-wrap gap-1.5">
          ${resume.skills.map(s => `
            <span class="inline-block px-2 py-0.5 text-xs bg-slate-100 text-slate-800 border border-slate-200 font-medium">${s}</span>
          `).join('')}
        </div>
      </section>
    ` : ''}

    <!-- Projects -->
    ${resume.projects?.length ? `
      <section>
        <h2 class="section-title">Key Projects</h2>
        <div class="space-y-2">
          ${resume.projects.map(proj => `
            <div class="text-xs">
              <span class="font-bold text-slate-900">${proj.name}</span>
              ${proj.link ? `<span class="text-sky-600 ml-1 font-mono text-[11px]">${proj.link}</span>` : ''}
              <p class="text-slate-600 mt-0.5">${proj.description}</p>
            </div>
          `).join('')}
        </div>
      </section>
    ` : ''}

    <!-- Education -->
    ${resume.education?.length ? `
      <section>
        <h2 class="section-title">Education</h2>
        <div class="space-y-2">
          ${resume.education.map(edu => `
            <div class="flex items-baseline justify-between text-xs">
              <div>
                <span class="font-bold text-slate-900">${edu.school}</span>
                <span class="text-slate-600 ml-1.5">${edu.degree}</span>
              </div>
              <span class="font-mono text-slate-400 text-[11px]">${edu.year}</span>
            </div>
          `).join('')}
        </div>
      </section>
    ` : ''}
  `;
}

function bindEvents() {
  const syncPersonal = () => {
    resume.personal = {
      name: $('field-name').value,
      title: $('field-title').value,
      email: $('field-email').value,
      phone: $('field-phone').value,
      location: $('field-location').value,
      website: $('field-website').value,
      linkedin: $('field-linkedin').value,
      github: $('field-github').value
    };
    renderPreview();
    persist();
  };

  ['field-name', 'field-title', 'field-email', 'field-phone', 'field-location', 'field-website', 'field-linkedin', 'field-github']
    .forEach(id => $(id)?.addEventListener('input', syncPersonal));

  $('field-summary')?.addEventListener('input', (e) => {
    resume.summary = e.target.value;
    renderPreview();
    persist();
  });

  $('field-skills')?.addEventListener('input', (e) => {
    resume.skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    renderPreview();
    persist();
  });

  $('experience-container').addEventListener('input', (e) => {
    const idx = Number(e.target.dataset.idx);
    if (isNaN(idx) || !resume.experience[idx]) return;
    if (e.target.classList.contains('exp-company')) resume.experience[idx].company = e.target.value;
    if (e.target.classList.contains('exp-role')) resume.experience[idx].role = e.target.value;
    if (e.target.classList.contains('exp-location')) resume.experience[idx].location = e.target.value;
    if (e.target.classList.contains('exp-period')) resume.experience[idx].period = e.target.value;
    if (e.target.classList.contains('exp-bullets')) {
      resume.experience[idx].bullets = e.target.value.split('\n').filter(b => b.trim());
    }
    renderPreview();
    persist();
  });

  $('experience-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-exp')) {
      const idx = Number(e.target.dataset.idx);
      resume.experience.splice(idx, 1);
      renderExperienceFields();
      renderPreview();
      persist();
    }
  });

  $('btn-add-experience').addEventListener('click', () => {
    resume.experience.push({ company: 'New Company', role: 'Role', location: '', period: '2024', bullets: ['Engineered key feature...'] });
    renderExperienceFields();
    renderPreview();
    persist();
  });

  $('education-container').addEventListener('input', (e) => {
    const idx = Number(e.target.dataset.idx);
    if (isNaN(idx) || !resume.education[idx]) return;
    if (e.target.classList.contains('edu-school')) resume.education[idx].school = e.target.value;
    if (e.target.classList.contains('edu-degree')) resume.education[idx].degree = e.target.value;
    if (e.target.classList.contains('edu-year')) resume.education[idx].year = e.target.value;
    renderPreview();
    persist();
  });

  $('education-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-edu')) {
      const idx = Number(e.target.dataset.idx);
      resume.education.splice(idx, 1);
      renderEducationFields();
      renderPreview();
      persist();
    }
  });

  $('btn-add-education').addEventListener('click', () => {
    resume.education.push({ school: 'University Name', degree: 'Degree', year: '2020 – 2024' });
    renderEducationFields();
    renderPreview();
    persist();
  });

  $('projects-container').addEventListener('input', (e) => {
    const idx = Number(e.target.dataset.idx);
    if (isNaN(idx) || !resume.projects[idx]) return;
    if (e.target.classList.contains('proj-name')) resume.projects[idx].name = e.target.value;
    if (e.target.classList.contains('proj-link')) resume.projects[idx].link = e.target.value;
    if (e.target.classList.contains('proj-desc')) resume.projects[idx].description = e.target.value;
    renderPreview();
    persist();
  });

  $('projects-container').addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-proj')) {
      const idx = Number(e.target.dataset.idx);
      resume.projects.splice(idx, 1);
      renderProjectFields();
      renderPreview();
      persist();
    }
  });

  $('btn-add-project').addEventListener('click', () => {
    resume.projects = resume.projects || [];
    resume.projects.push({ name: 'Project Name', link: '', description: 'Summary of project.' });
    renderProjectFields();
    renderPreview();
    persist();
  });

  $('template-select').addEventListener('change', (e) => {
    resume.template = e.target.value;
    renderPreview();
    persist();
  });

  $('btn-print').addEventListener('click', () => window.print());

  $('btn-export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(resume.personal.name || 'resume').toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  $('input-import-json').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      resume = JSON.parse(text);
      initEditor();
      renderPreview();
      persist();
    } catch (err) {
      alert('Invalid resume JSON file: ' + err.message);
    }
  });

  $('btn-sample').addEventListener('click', () => {
    if (confirm('Load sample developer resume? This replaces current unsaved data.')) {
      resume = JSON.parse(JSON.stringify(DEFAULT_DATA));
      initEditor();
      renderPreview();
      persist();
    }
  });
}

async function initLLM() {
  const providerSelect = $('llm-provider');
  const modelSelect = $('llm-model');
  const apiKeyInput = $('llm-api-key');

  const populateModels = async (pId) => {
    const p = PROVIDERS[pId];
    let models = [...p.models];
    if (pId === 'ollama') {
      try {
        const res = await fetch('http://localhost:11434/api/tags');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            const installed = data.models.map((m) => m.name.replace(/:latest$/, ''));
            models = Array.from(new Set([...installed, ...models]));
          }
        }
      } catch {}
    }
    modelSelect.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
    modelSelect.value = models.includes(llmSettings.model) ? llmSettings.model : (models[0] || p.defaultModel);
    apiKeyInput.disabled = !p.requiresKey;
    apiKeyInput.placeholder = p.requiresKey ? `Enter ${p.name} API Key` : 'Local model (no key required)';
  };

  const endpointRow = $('endpoint-row');
  const endpointInput = $('llm-endpoint');
  const endpointStatus = $('endpoint-status');
  const showEndpoint = (pId) => { endpointRow.hidden = pId !== 'ollama'; };

  async function allowEndpoint() {
    const base = ollamaBase(endpointInput.value);
    if (!sdk?.network) throw new Error('This version of Appshell cannot use a custom address. Update Appshell.');
    const grant = await sdk.network.requestEndpoint(base);
    if (!grant.approved) throw new Error('Not allowed. Approve the address to use it.');
    return base;
  }

  $('btn-test-endpoint').addEventListener('click', async () => {
    endpointStatus.textContent = 'Checking…';
    try {
      const base = await allowEndpoint();
      const res = await fetch(`${base}/api/tags`);
      if (!res.ok) throw new Error(`The server answered HTTP ${res.status}.`);
      const { models = [] } = await res.json();
      endpointStatus.textContent = `Connected. ${models.length} model${models.length === 1 ? '' : 's'} available.`;
    } catch (error) {
      endpointStatus.textContent = error instanceof TypeError ? 'Cannot reach that address. Is Ollama running and allowed to accept connections?' : error.message;
    }
  });

  providerSelect.value = llmSettings.provider;
  endpointInput.value = llmSettings.endpoint;
  showEndpoint(llmSettings.provider);
  populateModels(llmSettings.provider);

  const currentKey = await vault.getKey(llmSettings.provider, sdk);
  apiKeyInput.value = currentKey || '';

  providerSelect.addEventListener('change', async () => {
    const pId = providerSelect.value;
    populateModels(pId);
    showEndpoint(pId);
    const key = await vault.getKey(pId, sdk);
    apiKeyInput.value = key || '';
    llmSettings.provider = pId;
    llmSettings.model = modelSelect.value;
    localStorage.setItem('__rb_llm_settings', JSON.stringify(llmSettings));
  });

  modelSelect.addEventListener('change', () => {
    llmSettings.model = modelSelect.value;
    localStorage.setItem('__rb_llm_settings', JSON.stringify(llmSettings));
  });

  $('btn-save-llm').addEventListener('click', async () => {
    const pId = providerSelect.value;
    const key = apiKeyInput.value.trim();
    if (key) {
      await vault.setKey(pId, key, sdk);
    } else {
      await vault.clearKey(pId, sdk);
    }
    llmSettings.provider = pId;
    llmSettings.model = modelSelect.value;
    if (pId === 'ollama') {
      try {
        llmSettings.endpoint = await allowEndpoint();
      } catch (error) {
        endpointStatus.textContent = error.message;
        return;
      }
    }
    localStorage.setItem('__rb_llm_settings', JSON.stringify(llmSettings));
    $('modal-llm').close();
    showAiStatus(`Configured ${PROVIDERS[pId].name} (${llmSettings.model})`);
  });

  $('btn-ai-tailor').addEventListener('click', async () => {
    const jd = $('ai-job-desc').value.trim();
    if (!jd) {
      alert('Please paste a job description first.');
      return;
    }
    runAiTask('tailor', 'Tailoring Resume to Job Description...', async (key) => {
      const prompt = `Here is my current resume in JSON format:\n${JSON.stringify(resume, null, 2)}\n\nHere is the target job description:\n${jd}\n\nPlease tailor my resume to maximize match and ATS score. Return a valid JSON object matching the exact resume schema.`;
      const res = await generateCompletion({
        providerId: llmSettings.provider,
        endpoint: llmSettings.endpoint,
        model: llmSettings.model,
        apiKey: key,
        systemPrompt: 'You are an elite executive career coach and ATS optimization specialist. Output ONLY pure valid JSON without markdown fences.',
        userPrompt: prompt
      });
      const cleaned = res.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      const updated = JSON.parse(cleaned);
      resume = { ...resume, ...updated };
      initEditor();
      renderPreview();
      persist();
    });
  });

  $('btn-ai-bullets').addEventListener('click', async () => {
    runAiTask('bullets', 'Polishing achievements with action verbs & metrics...', async (key) => {
      const prompt = `Current experiences:\n${JSON.stringify(resume.experience, null, 2)}\n\nRewrite and strengthen all bullet points using strong action verbs, quantifiable metrics, and Google "XYZ formula" (Accomplished X, measured by Y, by doing Z). Return ONLY a JSON array of updated experience objects.`;
      const res = await generateCompletion({
        providerId: llmSettings.provider,
        endpoint: llmSettings.endpoint,
        model: llmSettings.model,
        apiKey: key,
        systemPrompt: 'You are an expert resume editor. Output ONLY a pure valid JSON array of experience objects without markdown fences.',
        userPrompt: prompt
      });
      const cleaned = res.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
      resume.experience = JSON.parse(cleaned);
      renderExperienceFields();
      renderPreview();
      persist();
    });
  });

  $('btn-ai-summary').addEventListener('click', async () => {
    runAiTask('summary', 'Generating high-impact summary...', async (key) => {
      const prompt = `Candidate profile: ${resume.personal.title}, Skills: ${resume.skills.join(', ')}, Recent roles: ${resume.experience.map(e => e.role + ' at ' + e.company).join(', ')}.\n\nWrite a compelling 3-4 sentence professional executive summary highlighting engineering leadership, problem-solving, and quantifiable impact. Output ONLY the summary text.`;
      const res = await generateCompletion({
        providerId: llmSettings.provider,
        endpoint: llmSettings.endpoint,
        model: llmSettings.model,
        apiKey: key,
        systemPrompt: 'You are a professional resume consultant. Return only the summary paragraph.',
        userPrompt: prompt
      });
      resume.summary = res.trim();
      $('field-summary').value = resume.summary;
      renderPreview();
      persist();
    });
  });
}

async function runAiTask(taskId, statusMsg, executor) {
  const statusEl = $('ai-status');
  statusEl.textContent = statusMsg;
  statusEl.className = 'text-xs text-sky-500 font-semibold animate-pulse';

  try {
    const key = await vault.getKey(llmSettings.provider, sdk);
    await executor(key);
    statusEl.textContent = 'Done!';
    statusEl.className = 'text-xs text-emerald-500 font-bold';
    setTimeout(() => { statusEl.textContent = ''; }, 3000);
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Error: ' + err.message;
    statusEl.className = 'text-xs text-rose-500 font-medium';
  }
}

function showAiStatus(msg) {
  const el = $('ai-status');
  if (el) {
    el.textContent = msg;
    el.className = 'text-xs text-slate-400';
  }
}

$('btn-open-settings').addEventListener('click', () => $('modal-llm').showModal());
$('btn-close-llm').addEventListener('click', () => $('modal-llm').close());

initEditor();
renderPreview();
bindEvents();
initLLM();
