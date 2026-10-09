(function () {
  'use strict';
  const C = window.NexcellCore, E = window.NexcellExport, $ = id => document.getElementById(id);
  const KEY = 'nexcell.smart.settings.v1';
  let settings = C.defaults(), options = [], nextId = 1, canvases = [], currentPage = 0;
  let publicQuote = null, validation = [], renderError = '', logo = new Image(), logoReady = false, updateFrame = 0;
  let pendingLogo = null, toastTimeout = 0, shareFiles = [], settingsLogoBusy = false;
  let startupWarning = '';
  const toInput = n => Number(n).toFixed(2).replace('.', ',');
  function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { $('toast').hidden = true; }, 4500); }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) settings = C.validateSettings(JSON.parse(raw));
  } catch (_) { startupWarning = 'Não foi possível ler as configurações locais. Os valores originais foram carregados.'; }
  function readNumber(input, required = false) {
    const text = input.value.trim(), n = !text && !required ? 0 : C.parseMoney(text);
    input.setAttribute('aria-invalid', String(!C.validMoney(n)));
    return n;
  }
  function serviceName() { return $('service').value === 'custom' ? $('customName').value : C.SERVICES.find(s => s[0] === $('service').value)?.[1] || ''; }
  function laborValue() { return $('service').value === 'custom' ? readNumber($('customLabor'), true) : settings.labor[$('service').value]; }
  function populateServices() {
    const old = $('service').value || 'display'; $('service').replaceChildren();
    for (const [id, name] of C.SERVICES) { const option = document.createElement('option'); option.value = id; option.textContent = name; $('service').append(option); }
    const custom = document.createElement('option'); custom.value = 'custom'; custom.textContent = 'Serviço personalizado'; $('service').append(custom); $('service').value = old;
    $('commissionBadge').textContent = settings.commissionPercent + '%';
  }
  function makeOption(source) {
    const id = nextId++;
    return { id, name: source?.name || '', description: source?.description || '', cost: source?.cost ?? '', manual: source?.manual ?? false, manualPrice: source?.manualPrice ?? '' };
  }
  function createOptionCard(o) {
    const card = document.createElement('article'); card.className = 'option-card'; card.dataset.id = o.id;
    // Template estritamente estático; texto digitado só é atribuído em .value/.textContent.
    card.innerHTML = `<div class="option-top"><span class="option-number"></span><div class="option-tools"><button type="button" data-action="duplicate">Duplicar</button><button type="button" data-action="remove">Remover</button></div></div>
      <div class="field"><label for="name-${o.id}">Qualidade / tipo da peça <span>Opcional</span></label><input id="name-${o.id}" data-field="name" maxlength="70" placeholder="Ex.: Tela OLED compatível"></div>
      <div class="field"><label for="description-${o.id}">Descrição curta <span>Opcional</span></label><textarea id="description-${o.id}" data-field="description" rows="2" maxlength="180" placeholder="Somente características confirmadas da peça."></textarea></div>
      <div class="field"><label for="cost-${o.id}">Custo da peça (R$) *</label><input id="cost-${o.id}" data-field="cost" inputmode="decimal" placeholder="0,00" required></div>
      <div class="price-area"><div><span class="price-caption">Preço para o cliente</span><strong class="price-value">R$ —</strong></div><button type="button" data-action="manual" aria-expanded="false">Ajustar preço</button></div>
      <div class="field manual-field" hidden><label for="manualPrice-${o.id}">Preço final manual (R$)</label><input id="manualPrice-${o.id}" data-field="manualPrice" inputmode="decimal"><p class="helper suggested-price"></p></div>
      <div class="price-warning" hidden></div><details class="result-details"><summary>Ver cálculo interno</summary><dl class="result-grid"></dl></details>`;
    for (const field of ['name', 'description', 'cost', 'manualPrice']) card.querySelector(`[data-field="${field}"]`).value = o[field];
    $('options').append(card); return card;
  }
  function refreshOptionLabels() {
    $('optionCount').textContent = options.length + (options.length === 1 ? ' opção' : ' opções');
    [...$('options').children].forEach((card, i) => { card.querySelector('.option-number').textContent = 'OPÇÃO ' + String(i + 1).padStart(2, '0'); card.querySelector('[data-action="remove"]').disabled = options.length === 1; card.querySelector('[data-action="remove"]').setAttribute('aria-label', 'Remover opção ' + (i + 1)); card.querySelector('[data-action="duplicate"]').setAttribute('aria-label', 'Duplicar opção ' + (i + 1)); });
  }
  function addOption(source) { const o = makeOption(source); options.push(o); const card = createOptionCard(o); refreshOptionLabels(); update(); return card; }
  function updateInternal(card, o, result, cost, labor, transport, materials, reserve) {
    card.querySelector('.price-value').textContent = result ? C.money(result.price) : 'R$ —';
    card.querySelector('.price-caption').textContent = o.manual ? 'Preço manual para o cliente' : 'Preço para o cliente';
    card.querySelector('.manual-field').hidden = !o.manual;
    const manualButton = card.querySelector('[data-action="manual"]'); manualButton.textContent = o.manual ? 'Usar automático' : 'Ajustar preço'; manualButton.setAttribute('aria-expanded', String(o.manual));
    card.querySelector('.suggested-price').textContent = result ? `Preço automático: ${C.money(result.suggested)}` : '';
    const warning = card.querySelector('.price-warning'); warning.hidden = !result?.belowTarget;
    warning.textContent = result?.belowTarget ? `Abaixo da meta de mão de obra (${C.money(labor)}). Resultado antes do dízimo: ${C.money(result.beforeTithe)}.` : '';
    const dl = card.querySelector('.result-grid'); dl.replaceChildren();
    if (!result) return;
    const values = [['Custo da peça', cost], ['Mão de obra-base (meta)', labor], ['Transporte', transport], ['Materiais adicionais', materials], ['Reserva de risco (provisão)', reserve], ['Preço antes de arredondar', result.calculated], ['Preço sugerido', result.suggested], ['Comissão Instagram', result.commission], ['Resultado antes do dízimo', result.beforeTithe], [`Dízimo (${settings.tithePercent}%)`, result.tithe], ['Resultado após dízimo', result.afterTithe]];
    values.forEach(([label, value], i) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = label; dd.textContent = C.money(value); if (i === values.length - 1) dt.className = dd.className = 'net'; dl.append(dt, dd); });
  }
  function update() {
    cancelAnimationFrame(updateFrame);
    validation = []; renderError = '';
    $('customServiceFields').hidden = $('service').value !== 'custom';
    const labor = laborValue(), transport = readNumber($('transport')), materials = readNumber($('materials')), reserve = readNumber($('reserve'));
    if (!$('brand').value.trim()) validation.push('marca');
    if (!$('model').value.trim()) validation.push('modelo');
    if (!serviceName().trim()) validation.push('nome do serviço');
    if (!C.validMoney(labor)) validation.push('mão de obra');
    if (![transport, materials, reserve].every(C.validMoney)) validation.push('custos adicionais válidos');
    if ($('validity').validity.badInput) validation.push('data de validade válida');
    const instagram = document.querySelector('[name="origin"]:checked').value === 'instagram';
    const results = options.map((o, i) => {
      const card = document.querySelector(`.option-card[data-id="${o.id}"]`);
      const cost = readNumber(card.querySelector('[data-field="cost"]'), true);
      const manualPrice = o.manual ? readNumber(card.querySelector('[data-field="manualPrice"]'), true) : null;
      if (!C.validMoney(cost)) validation.push(`custo da opção ${i + 1}`);
      if (o.manual && !C.validMoney(manualPrice)) validation.push(`preço manual da opção ${i + 1}`);
      let result = null;
      try { result = C.calculate({ cost, labor, transport, materials, reserve, instagram, manualPrice }, settings); } catch (_) { /* Campo incompleto: sem preço exportável. */ }
      updateInternal(card, o, result, cost, labor, transport, materials, reserve); return result;
    });
    const draft = { brand: $('brand').value, model: $('model').value, serviceName: serviceName(), client: $('client').value,
      validity: $('validity').value, notes: $('notes').value, warranty: $('warranty').value, warrantyConfirmed: $('warrantyConfirmed').checked, options };
    publicQuote = C.customerQuote(draft, results, settings);
    $('quoteText').textContent = validation.length ? 'Preencha os campos obrigatórios para conferir a mensagem completa.' : C.message(publicQuote);
    $('validationMessage').classList.remove('invalid');
    $('validationMessage').textContent = validation.length ? 'Para exportar, preencha: ' + validation.join(', ') + '.' : '';
    if ($('warranty').value.trim() && !$('warrantyConfirmed').checked) $('validationMessage').textContent += ' A garantia só aparece após sua confirmação.';
    if (logoReady) {
      try { const result = E.render(publicQuote, logo); canvases = result.canvases; currentPage = Math.min(currentPage, canvases.length - 1); showPage(); }
      catch (error) { renderError = error.message; $('validationMessage').textContent = renderError; $('validationMessage').classList.add('invalid'); }
    }
  }
  function scheduleUpdate() { cancelAnimationFrame(updateFrame); updateFrame = requestAnimationFrame(update); }
  function showPage() {
    if (!canvases.length) return;
    const ctx = $('quoteCanvas').getContext('2d'); ctx.clearRect(0, 0, E.W, E.H); ctx.drawImage(canvases[currentPage], 0, 0);
    $('pageNavigation').hidden = canvases.length <= 1; $('pageHint').hidden = canvases.length <= 1;
    $('pageLabel').textContent = `Página ${currentPage + 1} de ${canvases.length}`;
    $('prevPage').disabled = currentPage === 0; $('nextPage').disabled = currentPage === canvases.length - 1;
  }
  function ready() {
    update();
    if (!logoReady) { toast('Aguarde o carregamento da logo.'); return false; }
    if (validation.length || renderError) {
      const msg = renderError || 'Preencha: ' + validation.join(', ') + '.';
      $('validationMessage').textContent = msg; $('validationMessage').classList.add('invalid'); toast(msg);
      const first = [...$('quoteForm').querySelectorAll('input,select,textarea')].find(el => !el.closest('[hidden]') && (el.getAttribute('aria-invalid') === 'true' || (el.required && !el.value.trim())));
      first?.focus(); return false;
    }
    return true;
  }
  async function loadLogo(src) {
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('A logo não pôde ser aberta. Use um PNG, JPEG ou WebP válido.')); image.src = src; });
    if (!image.naturalWidth || image.naturalWidth > 10000 || image.naturalHeight > 10000) throw new Error('Dimensões da logo inválidas (máximo 10.000 × 10.000).');
    return image;
  }
  async function activateLogo() { logoReady = false; try { logo = await loadLogo(settings.logo || window.NEXCELL_DEFAULT_LOGO); logoReady = true; $('headerLogo').src = logo.src; update(); } catch (error) { toast(error.message); } }
  async function pngFiles() {
    const name = C.filename(publicQuote.device), snapshot = [...canvases];
    return Promise.all(snapshot.map(async (canvas, i) => ({ blob: await E.png(canvas), name: name + (snapshot.length > 1 ? '_' + String(i + 1).padStart(2, '0') : '') + '.png' })));
  }
  async function downloadPng() {
    if (!ready()) return;
    const button = $('downloadPng'); button.disabled = true;
    try { const files = await pngFiles(); if (files.length === 1) E.download(files[0].blob, files[0].name); else E.download(await E.zip(files), C.filename(publicQuote.device) + '_Imagens.zip'); toast(files.length === 1 ? 'Imagem pronta para salvar.' : `${files.length} imagens reunidas em um ZIP.`); }
    catch (_) { toast('Não foi possível baixar. Tente novamente ou use o PDF.'); } finally { button.disabled = false; }
  }
  async function copyMessage() {
    if (!ready()) return;
    const text = C.message(publicQuote);
    try { if (!navigator.clipboard?.writeText) throw new Error('clipboard indisponível'); await navigator.clipboard.writeText(text); toast('Mensagem copiada!'); }
    catch (_) { $('copyFallback').value = text; $('copyDialog').showModal(); $('copyFallback').focus(); $('copyFallback').select(); }
  }
  async function prepareShare() {
    if (!ready()) return;
    const text = C.message(publicQuote);
    $('shareQuote').disabled = true;
    try {
      shareFiles = (await pngFiles()).map(f => new File([f.blob], f.name, { type: 'image/png' }));
      let canShare = false;
      try { canShare = !!navigator.share && !!navigator.canShare?.({ files: shareFiles }); } catch (_) { /* Sem compartilhamento de arquivos. */ }
      $('nativeShare').hidden = !canShare;
      $('whatsappLink').href = 'https://wa.me/?text=' + encodeURIComponent(text);
      $('shareHelp').textContent = canShare ? 'Compartilhe a imagem pelo aparelho e escolha o WhatsApp. Se o aplicativo não incluir o texto junto, use “Copiar mensagem”.' : 'Baixe a imagem e abra o WhatsApp com a mensagem. Anexe a imagem manualmente na conversa. Nenhum arquivo é enviado automaticamente.';
      $('shareDialog').showModal();
    } catch (_) { toast('Não foi possível preparar o compartilhamento. Tente baixar a imagem.'); }
    finally { $('shareQuote').disabled = false; }
  }
  function fillSettings(s) {
    $('laborSettings').replaceChildren();
    for (const [id, name] of C.SERVICES) {
      const field = document.createElement('div'); field.className = 'field';
      const label = document.createElement('label'); label.htmlFor = 'labor-' + id; label.textContent = name + ' (R$)';
      const input = document.createElement('input'); input.id = 'labor-' + id; input.dataset.labor = id; input.inputMode = 'decimal'; input.value = toInput(s.labor[id]); field.append(label, input); $('laborSettings').append(field);
    }
    $('settingsCommission').value = String(s.commissionPercent).replace('.', ','); $('settingsTithe').value = String(s.tithePercent).replace('.', ','); $('settingsRounding').value = s.rounding; $('settingsTransport').value = toInput(s.transport);
    $('settingsWhatsapp').value = s.whatsapp; $('settingsInstagram').value = s.instagram; $('settingsTagline').value = s.tagline; pendingLogo = s.logo;
    $('settingsLogoPreview').src = s.logo || window.NEXCELL_DEFAULT_LOGO; $('settingsError').textContent = '';
  }
  function collectSettings() {
    return C.validateSettings({ version: 1, labor: Object.fromEntries([...$('laborSettings').querySelectorAll('input')].map(input => [input.dataset.labor, C.parseMoney(input.value)])), commissionPercent: C.parseMoney($('settingsCommission').value), tithePercent: C.parseMoney($('settingsTithe').value), rounding: Number($('settingsRounding').value), transport: C.parseMoney($('settingsTransport').value), whatsapp: $('settingsWhatsapp').value, instagram: $('settingsInstagram').value, tagline: $('settingsTagline').value, logo: pendingLogo });
  }
  function saveSettings(next) {
    settings = next;
    try { localStorage.setItem(KEY, JSON.stringify(settings)); toast('Configurações salvas neste navegador.'); }
    catch (_) { toast('Aplicadas nesta sessão. O navegador não permitiu salvar; exporte um backup JSON.'); }
    populateServices(); activateLogo();
  }
  $('quoteForm').addEventListener('submit', event => event.preventDefault());
  $('quoteForm').addEventListener('input', event => {
    const card = event.target.closest('.option-card');
    if (card && event.target.dataset.field) options.find(o => o.id === Number(card.dataset.id))[event.target.dataset.field] = event.target.value;
    if (event.target.id === 'warranty') $('warrantyConfirmed').checked = false;
    scheduleUpdate();
  });
  $('quoteForm').addEventListener('change', scheduleUpdate);
  $('addOption').addEventListener('click', () => { const card = addOption(); card.querySelector('input').focus(); });
  $('options').addEventListener('click', event => {
    const button = event.target.closest('[data-action]'); if (!button) return;
    const card = button.closest('.option-card'), index = options.findIndex(o => o.id === Number(card.dataset.id)), o = options[index];
    if (button.dataset.action === 'duplicate') { const added = addOption(o); added.querySelector('input').focus(); toast('Opção duplicada. Ajuste o custo e a qualidade.'); }
    if (button.dataset.action === 'remove' && options.length > 1) { options.splice(index, 1); card.remove(); refreshOptionLabels(); update(); $('addOption').focus(); }
    if (button.dataset.action === 'manual') {
      if (!o.manual) {
        const price = publicQuote.options[index]?.price;
        o.manualPrice = price === null ? '' : toInput(price); card.querySelector('[data-field="manualPrice"]').value = o.manualPrice;
      }
      o.manual = !o.manual; update(); if (o.manual) card.querySelector('[data-field="manualPrice"]').focus();
    }
  });
  $('prevPage').addEventListener('click', () => { currentPage--; showPage(); }); $('nextPage').addEventListener('click', () => { currentPage++; showPage(); });
  $('mobilePreview').addEventListener('click', () => { $('previewPanel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { $('mobilePreview').hidden = entries[0].isIntersecting; }, { threshold: 0.06 }).observe($('previewPanel'));
  }
  $('downloadPng').addEventListener('click', downloadPng);
  $('downloadPdf').addEventListener('click', () => { if (!ready()) return; try { E.download(E.pdf(canvases), C.filename(publicQuote.device) + '.pdf'); toast('PDF pronto para salvar.'); } catch (_) { toast('Não foi possível gerar o PDF. Tente novamente.'); } });
  $('copyMessage').addEventListener('click', copyMessage); $('shareQuote').addEventListener('click', prepareShare);
  $('shareClose').addEventListener('click', () => $('shareDialog').close()); $('shareDownload').addEventListener('click', downloadPng);
  $('nativeShare').addEventListener('click', async () => {
    try { await navigator.share({ files: shareFiles, title: 'Orçamento Nexcell', text: C.message(publicQuote) }); $('shareDialog').close(); }
    catch (error) { if (error.name !== 'AbortError') { $('shareHelp').textContent = 'O aparelho não concluiu o compartilhamento. Baixe a imagem e anexe na conversa do WhatsApp.'; } }
  });
  $('copyClose').addEventListener('click', () => $('copyDialog').close()); $('selectMessage').addEventListener('click', () => { $('copyFallback').focus(); $('copyFallback').select(); $('copyFallback').setSelectionRange(0, $('copyFallback').value.length); });
  $('settingsOpen').addEventListener('click', () => { fillSettings(settings); $('settingsDialog').showModal(); });
  $('settingsClose').addEventListener('click', () => $('settingsDialog').close()); $('settingsCancel').addEventListener('click', () => $('settingsDialog').close());
  $('settingsForm').addEventListener('submit', async event => {
    event.preventDefault(); if (settingsLogoBusy) { $('settingsError').textContent = 'Aguarde o carregamento da logo.'; return; }
    try { const next = collectSettings(); await loadLogo(next.logo || window.NEXCELL_DEFAULT_LOGO); saveSettings(next); $('settingsDialog').close(); }
    catch (error) { $('settingsError').textContent = error.message; }
  });
  $('logoUpload').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    settingsLogoBusy = true;
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error('Use uma imagem PNG, JPEG ou WebP de até 2 MB.');
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      await loadLogo(data); pendingLogo = data; $('settingsLogoPreview').src = data; $('settingsError').textContent = '';
    } catch (error) { $('settingsError').textContent = error.message || 'Não foi possível ler a imagem.'; }
    finally { settingsLogoBusy = false; event.target.value = ''; }
  });
  $('exportSettings').addEventListener('click', () => { try { if (settingsLogoBusy) throw new Error('Aguarde o carregamento da logo.'); const next = collectSettings(); E.download(new Blob([JSON.stringify(next, null, 2)], { type: 'application/json' }), 'Nexcell_Configuracoes.json'); toast('Backup das configurações pronto.'); } catch (error) { $('settingsError').textContent = error.message; } });
  $('importSettings').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    settingsLogoBusy = true;
    try { if (file.size > 3 * 1024 * 1024) throw new Error('Arquivo muito grande. Use um backup JSON de até 3 MB.'); const next = C.validateSettings(JSON.parse(await file.text())); await loadLogo(next.logo || window.NEXCELL_DEFAULT_LOGO); fillSettings(next); toast('Backup carregado. Confira e salve as configurações.'); }
    catch (error) { $('settingsError').textContent = 'Importação não aplicada: ' + error.message; }
    finally { settingsLogoBusy = false; event.target.value = ''; }
  });
  $('restoreSettings').addEventListener('click', () => { if (confirm('Carregar os valores e a logo originais? A alteração só será aplicada ao salvar.')) fillSettings(C.defaults()); });
  populateServices(); $('transport').value = toInput(settings.transport); addOption(); activateLogo();
  // Melhoria progressiva: leitura do orçamento público por agentes compatíveis.
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    try { Promise.resolve(document.modelContext.registerTool({
      name: 'read_customer_quote', title: 'Ler orçamento do cliente',
      description: 'Retorna os dados públicos do orçamento atual, sem custos ou resultados internos.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute(input) {
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) throw new Error('Este comando não recebe parâmetros.');
        update();
        if (validation.length || renderError) return { ready: false, missing: validation, error: renderError };
        return { ready: true, quote: JSON.parse(JSON.stringify(publicQuote)) };
      }
    }, { signal: lifecycle.signal })).catch(() => {}); } catch (_) { /* API opcional. */ }
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  }
  if (startupWarning) toast(startupWarning);
})();
