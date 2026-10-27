let sdk = null;
try { sdk = await import('/__appshell/sdk.js'); } catch {}

// 5 Construction Jurisdictions
export const REGIONAL_PRESETS = {
  IN: {
    code: 'IN',
    countryName: 'India',
    currencyCode: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    tax: { taxLabel: 'GST', defaultRatePercent: 18, retentionStandardPercent: 5 },
    units: { cementUnit: 'bags (50kg)', steelUnit: 'metric tons', aggregateUnit: 'cu.ft' },
    complianceNotes: 'RERA milestone escrow & CGST/SGST/IGST tax invoicing format.'
  },
  AE: {
    code: 'AE',
    countryName: 'United Arab Emirates',
    currencyCode: 'AED',
    currencySymbol: 'AED ',
    locale: 'en-AE',
    tax: { taxLabel: 'VAT', defaultRatePercent: 5, retentionStandardPercent: 10 },
    units: { cementUnit: 'metric tons', steelUnit: 'metric tons', aggregateUnit: 'cu.m' },
    complianceNotes: 'FIDIC contract terms & FTA compliant 5% VAT invoicing.'
  },
  SA: {
    code: 'SA',
    countryName: 'Saudi Arabia',
    currencyCode: 'SAR',
    currencySymbol: 'SAR ',
    locale: 'ar-SA',
    tax: { taxLabel: 'VAT (ZATCA)', defaultRatePercent: 15, retentionStandardPercent: 10 },
    units: { cementUnit: 'metric tons', steelUnit: 'metric tons', aggregateUnit: 'cu.m' },
    complianceNotes: 'ZATCA Phase 2 Fatoora e-invoicing and GOSI contractor compliance.'
  },
  US: {
    code: 'US',
    countryName: 'United States',
    currencyCode: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    tax: { taxLabel: 'Sales Tax', defaultRatePercent: 8.25, retentionStandardPercent: 10 },
    units: { cementUnit: 'bags (94 lb)', steelUnit: 'short tons', aggregateUnit: 'cu.yd' },
    complianceNotes: 'AIA G702/G703 payment application format & lien waiver tracking.'
  },
  UK: {
    code: 'UK',
    countryName: 'United Kingdom',
    currencyCode: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    tax: { taxLabel: 'VAT (CIS)', defaultRatePercent: 20, retentionStandardPercent: 5 },
    units: { cementUnit: 'bags (25kg)', steelUnit: 'tonnes', aggregateUnit: 'tonnes' },
    complianceNotes: 'HMRC Construction Industry Scheme (CIS) & JCT contract standards.'
  }
};

const DEFAULT_STATE = {
  regionCode: 'IN',
  tenantName: 'Apex Commercial Builders',
  projects: [
    {
      id: 'proj_01',
      title: 'Downtown Commercial Plaza',
      client: 'Metro Infrastructure Corp',
      description: '12-storey commercial tower with subterranean parking and retail hub.',
      status: 'in_progress',
      startDate: '2026-01-10',
      endDate: '2026-12-20',
      estimatedBudget: 4500000,
      actualCost: 2450000,
      revenueBilled: 2600000,
      revenueCollected: 2130000
    },
    {
      id: 'proj_02',
      title: 'Green Valley Eco Villas',
      client: 'Highland Living Development',
      description: 'Luxury 8-villa riverfront residential project with solar microgrid.',
      status: 'in_progress',
      startDate: '2026-03-01',
      endDate: '2026-11-15',
      estimatedBudget: 2800000,
      actualCost: 1120000,
      revenueBilled: 1400000,
      revenueCollected: 1200000
    },
    {
      id: 'proj_03',
      title: 'St. Marys Auditorium & Campus',
      client: 'Apex Education Trust',
      description: '2000-seater modern auditorium and sports complex.',
      status: 'planned',
      startDate: '2026-05-01',
      endDate: '2027-02-28',
      estimatedBudget: 1500000,
      actualCost: 80000,
      revenueBilled: 100000,
      revenueCollected: 100000
    }
  ],
  variations: [
    {
      id: 'var_001',
      projectId: 'proj_01',
      title: 'Subterranean Sump Tank Reinforcement',
      type: 'Subcontractor',
      costImpact: 120000,
      delayDays: 4,
      status: 'Approved',
      date: '2026-03-12'
    },
    {
      id: 'var_002',
      projectId: 'proj_01',
      title: 'Double-Glazed Facade Acoustic Upgrade',
      type: 'Client',
      costImpact: 280000,
      delayDays: 10,
      status: 'Pending',
      date: '2026-04-02'
    },
    {
      id: 'var_003',
      projectId: 'proj_02',
      title: 'Solar Inverter Capacity Expansion to 40kW',
      type: 'Client',
      costImpact: 75000,
      delayDays: 2,
      status: 'Approved',
      date: '2026-03-25'
    }
  ],
  siteLogs: [
    {
      id: 'log_001',
      projectId: 'proj_01',
      date: '2026-04-14',
      workersCount: 38,
      weather: 'Clear Sky • 31°C',
      slumpMm: 115,
      workAccomplished: 'Completed concrete pour for 4th level transfer slab. Curing commenced for column sets A1-A6.',
      safetyNotes: '100% PPE compliance. Safety harness audit passed.'
    },
    {
      id: 'log_002',
      projectId: 'proj_02',
      date: '2026-04-14',
      workersCount: 22,
      weather: 'Humid • 29°C',
      slumpMm: 105,
      workAccomplished: 'Erecting roof trusses on Villa #3 and #4. Plumber rough-ins completed on Villa #1.',
      safetyNotes: 'Scaffolding anchor tags verified.'
    }
  ],
  invoices: [
    {
      id: 'inv_001',
      projectId: 'proj_01',
      milestone: 'Substructure Piling & Raft Foundation',
      customer: 'Metro Infrastructure Corp',
      subtotal: 1200000,
      taxRate: 18,
      taxAmount: 216000,
      retentionRate: 5,
      retentionAmount: 60000,
      netTotal: 1356000,
      status: 'Paid',
      issueDate: '2026-02-15'
    },
    {
      id: 'inv_002',
      projectId: 'proj_01',
      milestone: 'Superstructure Framing to Level 3',
      customer: 'Metro Infrastructure Corp',
      subtotal: 1400000,
      taxRate: 18,
      taxAmount: 252000,
      retentionRate: 5,
      retentionAmount: 70000,
      netTotal: 1582000,
      status: 'Sent',
      issueDate: '2026-04-01'
    },
    {
      id: 'inv_003',
      projectId: 'proj_02',
      milestone: 'Foundation & Ground Slab Pouring',
      customer: 'Highland Living Development',
      subtotal: 1400000,
      taxRate: 18,
      taxAmount: 252000,
      retentionRate: 5,
      retentionAmount: 70000,
      netTotal: 1582000,
      status: 'Paid',
      issueDate: '2026-03-20'
    }
  ],
  transactions: [
    {
      id: 'tx_001',
      date: '2026-04-12',
      fromAccount: 'State Bank Current A/C',
      toAccount: 'Downtown Plaza Petty Cash Box',
      category: 'Site Wages',
      type: 'debit',
      amount: 150000,
      remarks: 'Weekly daily-wage settlement for 38 workers'
    },
    {
      id: 'tx_002',
      date: '2026-04-10',
      fromAccount: 'Metro Infrastructure Corp',
      toAccount: 'State Bank Current A/C',
      category: 'Client Progress Payment',
      type: 'credit',
      amount: 1356000,
      remarks: 'RTGS clearance for Milestone Inv #001'
    },
    {
      id: 'tx_003',
      date: '2026-04-08',
      fromAccount: 'State Bank Current A/C',
      toAccount: 'Southern Steel Mills Ltd',
      category: 'Material Purchase',
      type: 'debit',
      amount: 420000,
      remarks: 'Payment for 25 MT Fe550D TMT rebar consignment'
    }
  ],
  inventory: [
    {
      id: 'item_01',
      name: 'OPC 53 Grade Cement',
      category: 'Cement & Concrete',
      unitKey: 'cementUnit',
      reorderLevel: 250,
      centralWarehouse: 650,
      site1: 1400,
      site2: 400
    },
    {
      id: 'item_02',
      name: 'Fe 550D TMT Steel 16mm',
      category: 'Steel & Rebar',
      unitKey: 'steelUnit',
      reorderLevel: 15,
      centralWarehouse: 12,
      site1: 22,
      site2: 8
    },
    {
      id: 'item_03',
      name: 'Manufactured M-Sand',
      category: 'Aggregates',
      unitKey: 'aggregateUnit',
      reorderLevel: 500,
      centralWarehouse: 850,
      site1: 2100,
      site2: 700
    }
  ]
};

// Global Reactive State
let appData = (sdk ? await sdk.storage?.get('mansion_data') : null) ||
              (typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem('mansion_data') || 'null') : null) ||
              DEFAULT_STATE;

const $ = (id) => document.getElementById(id);

function getRegion() {
  return REGIONAL_PRESETS[appData.regionCode] || REGIONAL_PRESETS.IN;
}

export function formatMoney(amount, region = getRegion()) {
  const sym = region.currencySymbol;
  return `${sym}${Number(amount || 0).toLocaleString(region.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

async function persist() {
  if (sdk?.storage?.set) {
    try { await sdk.storage.set('mansion_data', appData); } catch {}
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('mansion_data', JSON.stringify(appData));
  }
  updateDashboardWidget();
}

async function updateDashboardWidget() {
  const region = getRegion();
  const totalBilled = appData.projects.reduce((s, p) => s + (p.revenueBilled || 0), 0);
  const totalCost = appData.projects.reduce((s, p) => s + (p.actualCost || 0), 0);
  const totalCollected = appData.projects.reduce((s, p) => s + (p.revenueCollected || 0), 0);
  const gap = totalCost - totalCollected;

  let score = 70;
  const netMargin = totalBilled > 0 ? ((totalBilled - totalCost) / totalBilled) * 100 : 0;
  if (netMargin > 20) score += 15;
  if (gap <= 0) score += 15; else score -= 10;
  const healthScore = Math.min(100, Math.max(0, score));

  if (sdk?.widgets?.update) {
    try {
      await sdk.widgets.update('portfolio-health', {
        blocks: [
          { type: 'metric', label: 'Health Radar', value: `${healthScore}/100` },
          { type: 'text', text: `${gap > 0 ? 'Self-Financed' : 'Surplus'}: ${formatMoney(Math.abs(gap), region)} • ${appData.projects.length} sites` }
        ]
      });
    } catch {}
  }
}

// Render Header & Active Jurisdiction Banner
function renderJurisdiction() {
  const reg = getRegion();
  $('badge-region').textContent = reg.code;
  $('select-jurisdiction').value = reg.code;
  $('label-tenant').textContent = appData.tenantName;

  $('banner-jurisdiction-name').textContent = `Active Jurisdiction: ${reg.countryName} Standard`;
  $('banner-jurisdiction-code').textContent = `${reg.code} Engine`;
  $('banner-jurisdiction-details').innerHTML = `
    Tax Model: <strong class="text-slate-200">${reg.tax.taxLabel} (${reg.tax.defaultRatePercent}%)</strong> &bull;
    Retainage Policy: <strong class="text-slate-200">${reg.tax.retentionStandardPercent}%</strong> &bull;
    Currency: <strong class="text-slate-200">${reg.currencyCode} (${reg.currencySymbol.trim()})</strong> &bull;
    Cement Unit: <strong class="text-slate-200">${reg.units.cementUnit}</strong>
  `;
  $('banner-compliance-notes').textContent = reg.complianceNotes;

  document.querySelectorAll('.unit-currency').forEach(el => {
    el.textContent = reg.currencySymbol.trim();
  });
}

// Render Executive Decision Radar (View 1)
function renderDashboard() {
  const reg = getRegion();
  const totalBudget = appData.projects.reduce((s, p) => s + (p.estimatedBudget || 0), 0);
  const totalBilled = appData.projects.reduce((s, p) => s + (p.revenueBilled || 0), 0);
  const totalCollected = appData.projects.reduce((s, p) => s + (p.revenueCollected || 0), 0);
  const totalActualCost = appData.projects.reduce((s, p) => s + (p.actualCost || 0), 0);
  const totalNetProfit = totalBilled - totalActualCost;
  const netMargin = totalBilled > 0 ? ((totalNetProfit / totalBilled) * 100).toFixed(1) : '0.0';

  // Contractor Cash Financing Gap
  const gap = totalActualCost - totalCollected;

  // Health Score Index (0-100)
  let score = 70;
  if (Number(netMargin) > 20) score += 15;
  if (gap <= 0) score += 15; else score -= 10;
  const healthScore = Math.min(100, Math.max(0, score));

  $('card-health-score').textContent = healthScore;
  $('card-health-desc').innerHTML = `Portfolio margin is robust at <strong class="text-emerald-400">+${netMargin}%</strong>.`;

  const gapBadge = $('badge-gap-status');
  if (gap > 0) {
    gapBadge.textContent = 'Self-Financed';
    gapBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800';
    $('card-gap-desc').textContent = 'Capital currently advanced before billing receipts';
  } else {
    gapBadge.textContent = 'Surplus';
    gapBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800';
    $('card-gap-desc').textContent = 'Client advances exceed incurred site costs';
  }
  $('card-gap-amount').textContent = formatMoney(Math.abs(gap), reg);
  const gapRatio = totalActualCost > 0 ? Math.min(100, (totalCollected / totalActualCost) * 100) : 100;
  $('card-gap-bar').style.width = `${gapRatio}%`;

  const billedPct = totalBudget > 0 ? ((totalBilled / totalBudget) * 100).toFixed(0) : '0';
  $('card-billed-percent').textContent = `${billedPct}% Billed`;
  $('card-total-billed').textContent = formatMoney(totalBilled, reg);
  $('card-target-budget').textContent = `Target Contract Value: ${formatMoney(totalBudget, reg)}`;
  $('card-billed-bar').style.width = `${Math.min(100, Number(billedPct))}%`;

  // Watchdog Project
  const sortedByRisk = [...appData.projects].sort((a, b) => (b.actualCost / b.estimatedBudget) - (a.actualCost / a.estimatedBudget));
  const watchdog = sortedByRisk[0];
  if (watchdog) {
    const consumedPct = ((watchdog.actualCost / watchdog.estimatedBudget) * 100).toFixed(0);
    $('card-watchdog-title').textContent = watchdog.title;
    $('card-watchdog-desc').innerHTML = `Consumed <strong>${consumedPct}%</strong> of overall allocated budget ceiling.`;
  }

  // Velocity Rails
  const railsContainer = $('container-velocity-rails');
  railsContainer.innerHTML = '';
  appData.projects.forEach(p => {
    const costPct = Math.min(100, (p.actualCost / p.estimatedBudget) * 100);
    const collectedPct = Math.min(100, (p.revenueCollected / p.estimatedBudget) * 100);
    const item = document.createElement('div');
    item.className = 'p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2';
    item.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <div>
          <span class="font-extrabold text-slate-900">${p.title}</span>
          <span class="text-slate-500 ml-1">(${p.client})</span>
        </div>
        <div class="font-mono font-bold text-slate-700">
          Ceiling: ${formatMoney(p.estimatedBudget, reg)}
        </div>
      </div>
      <!-- Dual Rail Bar -->
      <div class="space-y-1.5 pt-1">
        <div>
          <div class="flex justify-between text-[10px] text-slate-500 mb-0.5">
            <span>Incurred Actual Cost: ${formatMoney(p.actualCost, reg)}</span>
            <span class="font-mono font-bold text-blue-700">${costPct.toFixed(0)}%</span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div class="bg-blue-600 h-2 rounded-full" style="width: ${costPct}%"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-[10px] text-slate-500 mb-0.5">
            <span>Collected Client Revenue: ${formatMoney(p.revenueCollected, reg)}</span>
            <span class="font-mono font-bold text-emerald-700">${collectedPct.toFixed(0)}%</span>
          </div>
          <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div class="bg-emerald-500 h-2 rounded-full" style="width: ${collectedPct}%"></div>
          </div>
        </div>
      </div>
    `;
    railsContainer.appendChild(item);
  });

  // Recent Field Logs on Dashboard
  const recentLogsContainer = $('container-recent-logs');
  recentLogsContainer.innerHTML = '';
  appData.siteLogs.slice(0, 3).forEach(log => {
    const proj = appData.projects.find(p => p.id === log.projectId);
    const row = document.createElement('div');
    row.className = 'p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs';
    row.innerHTML = `
      <div class="flex items-center justify-between font-semibold mb-1">
        <span class="text-slate-900 font-bold">${proj ? proj.title : 'Site'}</span>
        <span class="text-[10px] text-slate-500">${log.date} &bull; ${log.weather}</span>
      </div>
      <p class="text-slate-600 text-[11px] leading-relaxed">${log.workAccomplished}</p>
      <div class="mt-1 flex items-center gap-3 text-[10px] text-slate-500 font-mono">
        <span>👷 Workers: ${log.workersCount}</span>
        <span>📐 Slump: ${log.slumpMm}mm</span>
      </div>
    `;
    recentLogsContainer.appendChild(row);
  });

  // Pending Variations on Dashboard
  const pendingVarsContainer = $('container-pending-variations');
  pendingVarsContainer.innerHTML = '';
  const pending = appData.variations.filter(v => v.status === 'Pending');
  if (pending.length === 0) {
    pendingVarsContainer.innerHTML = `<div class="text-xs text-slate-400 italic py-4 text-center">No pending change orders requiring sign-off.</div>`;
  } else {
    pending.forEach(v => {
      const proj = appData.projects.find(p => p.id === v.projectId);
      const row = document.createElement('div');
      row.className = 'p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-xs flex items-center justify-between gap-2';
      row.innerHTML = `
        <div>
          <div class="font-bold text-slate-900">${v.title}</div>
          <div class="text-[11px] text-slate-500">${proj?.title} &bull; Impact: <strong class="text-amber-800">${formatMoney(v.costImpact, reg)}</strong> (+${v.delayDays}d)</div>
        </div>
        <button type="button" class="btn-approve-var px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs" data-id="${v.id}">
          Approve
        </button>
      `;
      pendingVarsContainer.appendChild(row);
    });
  }
}

// Render Site Operations (View 2)
function renderOperations() {
  const reg = getRegion();

  // Projects Cards
  const projContainer = $('container-projects-cards');
  projContainer.innerHTML = '';
  appData.projects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'p-5 bg-white rounded-3xl shadow-xs border border-slate-200 space-y-3 flex flex-col justify-between';
    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${p.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'}">
            ${p.status.replace('_', ' ')}
          </span>
          <span class="text-[11px] text-slate-400 font-mono">${p.startDate} to ${p.endDate}</span>
        </div>
        <h4 class="font-extrabold text-sm text-slate-900 mt-2">${p.title}</h4>
        <p class="text-xs text-slate-500 mt-0.5 font-medium">${p.client}</p>
        <p class="text-[11px] text-slate-600 mt-2 line-clamp-2">${p.description}</p>
      </div>
      <div class="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-500">Budget Ceiling:</span>
          <span class="font-mono font-bold text-slate-900">${formatMoney(p.estimatedBudget, reg)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Incurred Cost:</span>
          <span class="font-mono font-bold text-blue-700">${formatMoney(p.actualCost, reg)}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Billed Revenue:</span>
          <span class="font-mono font-bold text-emerald-700">${formatMoney(p.revenueBilled, reg)}</span>
        </div>
      </div>
    `;
    projContainer.appendChild(card);
  });

  // Variations Table
  const varTbody = $('table-variations-body');
  varTbody.innerHTML = '';
  appData.variations.forEach(v => {
    const proj = appData.projects.find(p => p.id === v.projectId);
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-slate-700">${v.id}</td>
      <td class="py-2.5 px-3 font-semibold text-slate-900">${proj?.title || 'Unknown'}</td>
      <td class="py-2.5 px-3 text-slate-800">${v.title}</td>
      <td class="py-2.5 px-3 text-slate-500">${v.type}</td>
      <td class="py-2.5 px-3 font-mono font-bold text-slate-900">${formatMoney(v.costImpact, reg)}</td>
      <td class="py-2.5 px-3 font-mono text-slate-600">+${v.delayDays} days</td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${v.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : v.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700'}">
          ${v.status}
        </span>
      </td>
      <td class="py-2.5 px-3 text-right">
        ${v.status === 'Pending' ? `
          <button type="button" class="btn-approve-var px-2 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg" data-id="${v.id}">Approve</button>
          <button type="button" class="btn-reject-var px-2 py-1 text-[11px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg ml-1" data-id="${v.id}">Reject</button>
        ` : `<span class="text-slate-400 font-mono text-[11px]">—</span>`}
      </td>
    `;
    varTbody.appendChild(tr);
  });

  // Daily Field Diary
  const logContainer = $('container-sitelogs-list');
  logContainer.innerHTML = '';
  appData.siteLogs.forEach(log => {
    const proj = appData.projects.find(p => p.id === log.projectId);
    const item = document.createElement('div');
    item.className = 'p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2';
    item.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <span class="font-extrabold text-slate-900 text-sm">${proj?.title}</span>
          <span class="text-slate-500 ml-2 font-mono text-[11px]">${log.date}</span>
        </div>
        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">${log.weather}</span>
      </div>
      <p class="text-slate-700 leading-relaxed font-medium">${log.workAccomplished}</p>
      <div class="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
        <span>👷 Worker Headcount: <strong>${log.workersCount}</strong></span>
        <span>📐 Concrete Slump Test: <strong>${log.slumpMm} mm</strong></span>
        <span>🛡️ Safety: <strong>${log.safetyNotes}</strong></span>
      </div>
    `;
    logContainer.appendChild(item);
  });
}

// Render Financials (View 3)
function renderFinancials() {
  const reg = getRegion();

  // Invoices Table
  const invTbody = $('table-invoices-body');
  invTbody.innerHTML = '';
  appData.invoices.forEach(inv => {
    const proj = appData.projects.find(p => p.id === inv.projectId);
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono font-bold text-slate-700">${inv.id}</td>
      <td class="py-2.5 px-3">
        <div class="font-bold text-slate-900">${inv.milestone}</div>
        <div class="text-[10px] text-slate-500">${proj?.title}</div>
      </td>
      <td class="py-2.5 px-3 text-slate-600">${inv.customer}</td>
      <td class="py-2.5 px-3 font-mono text-slate-700">${formatMoney(inv.subtotal, reg)}</td>
      <td class="py-2.5 px-3 font-mono text-slate-500">${formatMoney(inv.taxAmount, reg)}</td>
      <td class="py-2.5 px-3 font-mono text-amber-700">-${formatMoney(inv.retentionAmount, reg)}</td>
      <td class="py-2.5 px-3 font-mono font-black text-blue-700">${formatMoney(inv.netTotal, reg)}</td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}">
          ${inv.status}
        </span>
      </td>
      <td class="py-2.5 px-3 text-right">
        ${inv.status !== 'Paid' ? `
          <button type="button" class="btn-pay-inv px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs" data-id="${inv.id}">Mark Paid</button>
        ` : `<span class="text-emerald-600 text-xs font-bold">✓ Settled</span>`}
      </td>
    `;
    invTbody.appendChild(tr);
  });

  // Cashflow Table
  const txTbody = $('table-cashflow-body');
  txTbody.innerHTML = '';
  appData.transactions.forEach(tx => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-mono text-slate-500">${tx.date}</td>
      <td class="py-2.5 px-3 font-semibold text-slate-800">${tx.fromAccount}</td>
      <td class="py-2.5 px-3 font-semibold text-slate-800">${tx.toAccount}</td>
      <td class="py-2.5 px-3 text-slate-600">${tx.category}</td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${tx.type}
        </span>
      </td>
      <td class="py-2.5 px-3 font-mono font-bold ${tx.type === 'credit' ? 'text-emerald-700' : 'text-slate-900'}">
        ${tx.type === 'credit' ? '+' : '-'}${formatMoney(tx.amount, reg)}
      </td>
      <td class="py-2.5 px-3 text-slate-500">${tx.remarks}</td>
    `;
    txTbody.appendChild(tr);
  });
}

// Render Materials & Stock (View 4)
function renderStock() {
  const reg = getRegion();
  const stockTbody = $('table-stock-body');
  stockTbody.innerHTML = '';

  appData.inventory.forEach(item => {
    const unitLabel = reg.units[item.unitKey] || 'units';
    const total = item.centralWarehouse + item.site1 + item.site2;
    const isLow = total <= item.reorderLevel;

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="py-2.5 px-3 font-bold text-slate-900">${item.name}</td>
      <td class="py-2.5 px-3 text-slate-600">${item.category}</td>
      <td class="py-2.5 px-3 font-mono text-slate-500">${unitLabel}</td>
      <td class="py-2.5 px-3 font-mono font-bold text-slate-900">${total.toLocaleString()}</td>
      <td class="py-2.5 px-3 font-mono text-slate-700">${item.centralWarehouse.toLocaleString()}</td>
      <td class="py-2.5 px-3 font-mono text-slate-700">${item.site1.toLocaleString()}</td>
      <td class="py-2.5 px-3 font-mono text-slate-700">${item.site2.toLocaleString()}</td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
          ${isLow ? 'Reorder Alert' : 'Stock Optimal'}
        </span>
      </td>
    `;
    stockTbody.appendChild(tr);
  });
}

function renderAll() {
  renderJurisdiction();
  renderDashboard();
  renderOperations();
  renderFinancials();
  renderStock();
  populateModalProjectSelects();
  updateDashboardWidget();
}

function populateModalProjectSelects() {
  const selects = [$('var-input-project'), $('log-input-project'), $('inv-input-project')];
  selects.forEach(sel => {
    if (!sel) return;
    sel.innerHTML = appData.projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
  });
}

// Tab Switching
function bindNavigation() {
  const tabs = document.querySelectorAll('.nav-tab, .mobile-nav-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.target;
      ['view-dashboard', 'view-operations', 'view-financials', 'view-stock'].forEach(id => {
        $(id).classList.add('hidden');
      });
      $(targetId).classList.remove('hidden');

      // Update Desktop Nav styles
      document.querySelectorAll('.nav-tab').forEach(t => {
        if (t.dataset.target === targetId) {
          t.className = 'nav-tab px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 bg-white text-blue-700 shadow-xs';
        } else {
          t.className = 'nav-tab px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-slate-600 hover:text-slate-900';
        }
      });

      // Update Mobile Nav styles
      document.querySelectorAll('.mobile-nav-btn').forEach(t => {
        if (t.dataset.target === targetId) {
          t.className = 'mobile-nav-btn px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white whitespace-nowrap';
        } else {
          t.className = 'mobile-nav-btn px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 whitespace-nowrap';
        }
      });
    });
  });

  // Operations Subtabs
  $('subtab-projects').addEventListener('click', () => {
    $('ops-subview-projects').classList.remove('hidden');
    $('ops-subview-variations').classList.add('hidden');
    $('ops-subview-sitelogs').classList.add('hidden');
    $('subtab-projects').className = 'ops-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs';
    $('subtab-variations').className = 'ops-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200';
    $('subtab-sitelogs').className = 'ops-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200';
  });

  $('subtab-variations').addEventListener('click', () => {
    $('ops-subview-projects').classList.add('hidden');
    $('ops-subview-variations').classList.remove('hidden');
    $('ops-subview-sitelogs').classList.add('hidden');
    $('subtab-variations').className = 'ops-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs';
    $('subtab-projects').className = 'ops-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200';
    $('subtab-sitelogs').className = 'ops-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200';
  });

  $('subtab-sitelogs').addEventListener('click', () => {
    $('ops-subview-projects').classList.add('hidden');
    $('ops-subview-variations').classList.add('hidden');
    $('ops-subview-sitelogs').classList.remove('hidden');
    $('subtab-sitelogs').className = 'ops-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs';
    $('subtab-projects').className = 'ops-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200';
    $('subtab-variations').className = 'ops-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200';
  });

  // Financials Subtabs
  $('subtab-invoices').addEventListener('click', () => {
    $('fin-subview-invoices').classList.remove('hidden');
    $('fin-subview-cashflow').classList.add('hidden');
    $('subtab-invoices').className = 'fin-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs';
    $('subtab-cashflow').className = 'fin-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200';
  });

  $('subtab-cashflow').addEventListener('click', () => {
    $('fin-subview-invoices').classList.add('hidden');
    $('fin-subview-cashflow').classList.remove('hidden');
    $('subtab-cashflow').className = 'fin-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs';
    $('subtab-invoices').className = 'fin-subtab px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200';
  });
}

function bindModals() {
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('dialog').close();
    });
  });

  $('btn-quick-create').addEventListener('click', () => $('modal-quick-action').showModal());
  $('btn-open-backup').addEventListener('click', () => $('modal-backup').showModal());

  $('action-opt-project').addEventListener('click', () => {
    $('modal-quick-action').close();
    $('modal-project').showModal();
  });
  $('btn-create-in-ops').addEventListener('click', () => $('modal-project').showModal());

  $('action-opt-variation').addEventListener('click', () => {
    $('modal-quick-action').close();
    $('modal-variation').showModal();
  });
  $('btn-new-variation').addEventListener('click', () => $('modal-variation').showModal());

  $('action-opt-sitelog').addEventListener('click', () => {
    $('modal-quick-action').close();
    $('modal-sitelog').showModal();
  });
  $('btn-new-sitelog').addEventListener('click', () => $('modal-sitelog').showModal());

  $('action-opt-invoice').addEventListener('click', () => {
    $('modal-quick-action').close();
    $('modal-invoice').showModal();
  });
  $('btn-create-in-fin').addEventListener('click', () => $('modal-invoice').showModal());
  $('btn-new-invoice').addEventListener('click', () => $('modal-invoice').showModal());

  $('action-opt-transaction').addEventListener('click', () => {
    $('modal-quick-action').close();
    $('modal-transaction').showModal();
  });
  $('btn-new-transaction').addEventListener('click', () => $('modal-transaction').showModal());
}

function bindForms() {
  // Jurisdiction change
  $('select-jurisdiction').addEventListener('change', () => {
    appData.regionCode = $('select-jurisdiction').value;
    persist();
    renderAll();
  });

  // New Project Form
  $('form-new-project').addEventListener('submit', (e) => {
    e.preventDefault();
    const newProj = {
      id: `proj_${Date.now().toString().slice(-4)}`,
      title: $('proj-input-title').value.trim(),
      client: $('proj-input-client').value.trim(),
      estimatedBudget: Number($('proj-input-budget').value) || 1000000,
      actualCost: 0,
      revenueBilled: 0,
      revenueCollected: 0,
      status: $('proj-input-status').value,
      startDate: $('proj-input-start').value,
      endDate: $('proj-input-end').value,
      description: $('proj-input-desc').value.trim()
    };
    appData.projects.unshift(newProj);
    persist();
    renderAll();
    $('modal-project').close();
    $('form-new-project').reset();
  });

  // New Variation Form
  $('form-new-variation').addEventListener('submit', (e) => {
    e.preventDefault();
    const newVar = {
      id: `var_${Date.now().toString().slice(-3)}`,
      projectId: $('var-input-project').value,
      title: $('var-input-title').value.trim(),
      type: $('var-input-type').value,
      costImpact: Number($('var-input-cost').value) || 0,
      delayDays: Number($('var-input-delay').value) || 0,
      status: $('var-input-status').value,
      date: new Date().toISOString().split('T')[0]
    };
    appData.variations.unshift(newVar);
    persist();
    renderAll();
    $('modal-variation').close();
    $('form-new-variation').reset();
  });

  // New Site Log Form
  $('form-new-sitelog').addEventListener('submit', (e) => {
    e.preventDefault();
    const newLog = {
      id: `log_${Date.now().toString().slice(-3)}`,
      projectId: $('log-input-project').value,
      date: $('log-input-date').value,
      workersCount: Number($('log-input-workers').value) || 10,
      weather: $('log-input-weather').value.trim(),
      slumpMm: Number($('log-input-slump').value) || 100,
      workAccomplished: $('log-input-work').value.trim(),
      safetyNotes: $('log-input-safety').value.trim() || 'All standard safety protocols observed.'
    };
    appData.siteLogs.unshift(newLog);
    persist();
    renderAll();
    $('modal-sitelog').close();
    $('form-new-sitelog').reset();
  });

  // Dynamic invoice calculation on input
  $('inv-input-amount').addEventListener('input', () => {
    const reg = getRegion();
    const subtotal = Number($('inv-input-amount').value) || 0;
    const tax = (subtotal * reg.tax.defaultRatePercent) / 100;
    const retention = (subtotal * reg.tax.retentionStandardPercent) / 100;
    const net = subtotal + tax - retention;

    $('calc-tax-label').textContent = `${reg.tax.taxLabel} ${reg.tax.defaultRatePercent}%`;
    $('calc-tax-val').textContent = formatMoney(tax, reg);
    $('calc-ret-label').textContent = `${reg.tax.retentionStandardPercent}%`;
    $('calc-ret-val').textContent = `-${formatMoney(retention, reg)}`;
    $('calc-net-val').textContent = formatMoney(net, reg);
  });

  // New Invoice Form
  $('form-new-invoice').addEventListener('submit', (e) => {
    e.preventDefault();
    const reg = getRegion();
    const subtotal = Number($('inv-input-amount').value) || 0;
    const tax = (subtotal * reg.tax.defaultRatePercent) / 100;
    const retention = (subtotal * reg.tax.retentionStandardPercent) / 100;
    const net = subtotal + tax - retention;

    const proj = appData.projects.find(p => p.id === $('inv-input-project').value);

    const newInv = {
      id: `inv_${Date.now().toString().slice(-3)}`,
      projectId: $('inv-input-project').value,
      milestone: $('inv-input-milestone').value.trim(),
      customer: proj?.client || 'Client Group',
      subtotal,
      taxRate: reg.tax.defaultRatePercent,
      taxAmount: tax,
      retentionRate: reg.tax.retentionStandardPercent,
      retentionAmount: retention,
      netTotal: net,
      status: 'Sent',
      issueDate: new Date().toISOString().split('T')[0]
    };

    if (proj) {
      proj.revenueBilled = (proj.revenueBilled || 0) + subtotal;
    }

    appData.invoices.unshift(newInv);
    persist();
    renderAll();
    $('modal-invoice').close();
    $('form-new-invoice').reset();
  });

  // New Transaction Form
  $('form-new-tx').addEventListener('submit', (e) => {
    e.preventDefault();
    const newTx = {
      id: `tx_${Date.now().toString().slice(-3)}`,
      date: new Date().toISOString().split('T')[0],
      fromAccount: $('tx-input-from').value.trim(),
      toAccount: $('tx-input-to').value.trim(),
      category: $('tx-input-category').value.trim(),
      type: $('tx-input-type').value,
      amount: Number($('tx-input-amount').value) || 0,
      remarks: $('tx-input-remarks').value.trim()
    };
    appData.transactions.unshift(newTx);
    persist();
    renderAll();
    $('modal-transaction').close();
    $('form-new-tx').reset();
  });

  // Table action delegations
  document.addEventListener('click', (e) => {
    // Approve Variation
    if (e.target.matches('.btn-approve-var')) {
      const id = e.target.dataset.id;
      const v = appData.variations.find(item => item.id === id);
      if (v) {
        v.status = 'Approved';
        const proj = appData.projects.find(p => p.id === v.projectId);
        if (proj) {
          proj.actualCost = (proj.actualCost || 0) + v.costImpact;
        }
        persist();
        renderAll();
      }
    }
    // Reject Variation
    if (e.target.matches('.btn-reject-var')) {
      const id = e.target.dataset.id;
      const v = appData.variations.find(item => item.id === id);
      if (v) {
        v.status = 'Rejected';
        persist();
        renderAll();
      }
    }
    // Pay Invoice
    if (e.target.matches('.btn-pay-inv')) {
      const id = e.target.dataset.id;
      const inv = appData.invoices.find(item => item.id === id);
      if (inv) {
        inv.status = 'Paid';
        const proj = appData.projects.find(p => p.id === inv.projectId);
        if (proj) {
          proj.revenueCollected = (proj.revenueCollected || 0) + inv.subtotal;
        }
        persist();
        renderAll();
      }
    }
  });

  // Backup & Export JSON
  $('btn-export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mansion-pms-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import JSON
  $('input-import-json').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (parsed.projects && parsed.variations) {
          appData = parsed;
          persist();
          renderAll();
          alert('Mansion backup successfully restored!');
          $('modal-backup').close();
        } else {
          alert('Invalid Mansion backup file structure.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  });

  // Reset Demo
  $('btn-reset-demo').addEventListener('click', () => {
    if (confirm('Reset all records to initial commercial demo data?')) {
      appData = JSON.parse(JSON.stringify(DEFAULT_STATE));
      persist();
      renderAll();
      $('modal-backup').close();
    }
  });
}

// Initial Boot
if (typeof document !== 'undefined') {
  bindNavigation();
  bindModals();
  bindForms();
  renderAll();
}
