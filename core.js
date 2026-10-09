/* Regras de cálculo e dados públicos. Sem dependências e sem acesso à interface. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NexcellCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SERVICES = [
    ['camera-clean', 'Limpeza de câmera', 25],
    ['external-buttons', 'Troca de botões externos', 30],
    ['camera-lens', 'Troca de lente da câmera', 35],
    ['battery', 'Troca de bateria', 40],
    ['charge-board', 'Troca de plaquinha de carga', 40],
    ['screen-glue', 'Colagem completa de tela', 40],
    ['back-cover', 'Troca de tampa traseira', 50],
    ['camera', 'Troca de câmera', 60],
    ['button-flex', 'Troca de flex dos botões', 60],
    ['display', 'Troca de tela/display', 100],
    ['solder-dock', 'Troca de dock de carga com solda', 100]
  ];
  const MAX_MONEY = 1000000;
  function defaults() {
    return { version: 1, labor: Object.fromEntries(SERVICES.map(([id, , value]) => [id, value])),
      commissionPercent: 10, tithePercent: 10, rounding: 5, transport: 0,
      whatsapp: '(99) 98493-3805', instagram: '@nexcellassistec',
      tagline: 'Seu celular em boas mãos.', logo: null };
  }
  // Aceita 1234,56, 1.234,56 ou 1234.56. Valores vazios são tratados pelo formulário.
  function parseMoney(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    let s = String(value ?? '').trim().replace(/^R\$\s*/, '').replace(/\s/g, '');
    if (!s) return NaN;
    if (s.includes(',')) {
      if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(s)) return NaN;
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (!/^\d+(?:\.\d{1,2})?$/.test(s)) return NaN;
    return Number(s);
  }
  function validMoney(n) { return Number.isFinite(n) && n >= 0 && n <= MAX_MONEY; }
  function roundUp(n, step) {
    // O epsilon remove apenas ruído binário, preservando múltiplos exatos.
    return Math.max(0, Math.round(Math.ceil(n / step - 1e-9) * step * 100) / 100);
  }
  function calculate({ cost, labor, transport = 0, materials = 0, reserve = 0,
    instagram = false, manualPrice = null }, settings = defaults()) {
    if (![cost, labor, transport, materials, reserve].every(validMoney)) throw new Error('Informe valores válidos, de zero a R$ 1.000.000,00.');
    const i = instagram ? settings.commissionPercent / 100 : 0;
    if (!(i >= 0 && i < 1) || !(settings.rounding > 0)) throw new Error('Configuração de cálculo inválida.');
    const calculated = (cost + labor + transport + materials + reserve) / (1 - i);
    const suggested = roundUp(calculated, settings.rounding);
    if (manualPrice !== null && !validMoney(manualPrice)) throw new Error('Preço manual inválido.');
    const price = manualPrice === null ? suggested : manualPrice;
    const commission = price * i;
    const beforeTithe = price - cost - transport - materials - reserve - commission;
    const tithe = Math.max(0, beforeTithe) * settings.tithePercent / 100;
    return { calculated, suggested, price, commission, beforeTithe, tithe,
      afterTithe: beforeTithe - tithe, belowTarget: beforeTithe < labor - 1e-7 };
  }
  function cleanText(v, max) {
    if (typeof v !== 'string' || v.length > max) throw new Error('Texto ausente ou acima do limite no arquivo.');
    return v.trim();
  }
  function validateSettings(input) {
    if (!input || typeof input !== 'object' || input.version !== 1) throw new Error('Formato de configurações incompatível (versão 1 esperada).');
    const out = defaults();
    for (const [id] of SERVICES) {
      const n = input.labor?.[id];
      if (typeof n !== 'number' || !validMoney(n)) throw new Error('Tabela de mão de obra inválida.');
      out.labor[id] = n;
    }
    for (const key of ['commissionPercent', 'tithePercent']) {
      const n = input[key];
      if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > (key === 'commissionPercent' ? 99 : 100)) throw new Error('Percentuais inválidos. Comissão: 0 a 99%; dízimo: 0 a 100%.');
      out[key] = n;
    }
    if (!validMoney(input.transport)) throw new Error('Transporte padrão inválido.');
    out.transport = input.transport;
    if (![0.01, 1, 5, 10, 20, 50].includes(input.rounding)) throw new Error('Arredondamento inválido.');
    out.rounding = input.rounding;
    out.whatsapp = cleanText(input.whatsapp, 40);
    out.instagram = cleanText(input.instagram, 50);
    out.tagline = cleanText(input.tagline, 100);
    if (!out.whatsapp || !out.instagram) throw new Error('Preencha os contatos da Nexcell.');
    if (input.logo !== null && (typeof input.logo !== 'string' || input.logo.length > 2800000 || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(input.logo))) throw new Error('Logo inválida. Use PNG, JPEG ou WebP (até 2 MB).');
    out.logo = input.logo;
    return out;
  }
  // Lista explícita de campos permitidos. Dados internos nunca chegam ao renderizador.
  function customerQuote(draft, results, settings) {
    return { device: [draft.brand.trim(), draft.model.trim()].filter(Boolean).join(' '),
      service: draft.serviceName.trim(), client: draft.client.trim(), validity: draft.validity,
      notes: draft.notes.trim(), warranty: draft.warrantyConfirmed ? draft.warranty.trim() : '',
      options: draft.options.map((o, i) => ({ name: o.name.trim() || 'Opção de serviço',
        description: o.description.trim(), price: results[i]?.price ?? null })),
      whatsapp: settings.whatsapp, instagram: settings.instagram, tagline: settings.tagline };
  }
  const money = n => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  function dateBR(date) { return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.split('-').reverse().join('/') : ''; }
  function message(q) {
    const lines = [q.client ? `Olá, ${q.client}! 💜` : 'Olá! 💜', '', 'Preparamos seu orçamento na Nexcell.', '',
      `📱 Aparelho: ${q.device}`, `🔧 Serviço: ${q.service}`, '', 'Opções de orçamento:', '',
      ...q.options.map((o, i) => `${i + 1}. ${o.name} — ${money(o.price)}${o.description ? '\n   ' + o.description : ''}`),
      '', 'Os valores já incluem a instalação.'];
    if (q.validity) lines.push('', `Validade do orçamento: ${dateBR(q.validity)}.`);
    if (q.warranty) lines.push('', `Garantia: ${q.warranty}`);
    if (q.notes) lines.push('', `Observações: ${q.notes}`);
    lines.push('', 'Se quiser prosseguir, é só nos avisar! 😊', '', 'NEXCELL');
    if (q.tagline) lines.push(q.tagline);
    lines.push(`WhatsApp: ${q.whatsapp}`, `Instagram: ${q.instagram}`);
    return lines.join('\n');
  }
  function filename(device) { return 'Nexcell_Orcamento_' + (device.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]/g, '') || 'Aparelho').slice(0, 100); }
  return { SERVICES, MAX_MONEY, defaults, parseMoney, validMoney, roundUp, calculate, validateSettings, customerQuote, money, dateBR, message, filename };
});
