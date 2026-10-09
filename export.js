/* Arte, PNG, PDF e ZIP locais. Nenhuma captura do formulário interno. */
(function () {
  'use strict';
  const C = window.NexcellCore;
  const W = 1080, H = 1920, M = 72;
  const font = (ctx, size, weight = 400) => { ctx.font = `${weight} ${size}px Arial, sans-serif`; ctx.textBaseline = 'top'; };
  function lines(ctx, text, width) {
    const out = [];
    for (const paragraph of String(text).split('\n')) {
      if (!paragraph.trim()) { out.push(''); continue; }
      let current = '';
      for (const word of paragraph.trim().split(/\s+/)) {
        if (ctx.measureText(word).width > width) {
          if (current) { out.push(current); current = ''; }
          for (const char of Array.from(word)) {
            if (ctx.measureText(current + char).width > width) { out.push(current); current = ''; }
            current += char;
          }
        } else if (ctx.measureText(current ? current + ' ' + word : word).width > width) {
          out.push(current); current = word;
        } else current += (current ? ' ' : '') + word;
      }
      if (current) out.push(current);
    }
    return out;
  }
  function textLines(ctx, rows, x, y, lineHeight, color = '#ffffff') {
    ctx.fillStyle = color;
    rows.forEach((t, i) => ctx.fillText(t, x, y + i * lineHeight));
    return y + rows.length * lineHeight;
  }
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function measure(q) {
    const temp = document.createElement('canvas'), ctx = temp.getContext('2d');
    font(ctx, 60, 700); const device = lines(ctx, q.device || 'Seu aparelho', W - 2 * M);
    font(ctx, 31, 400); const service = lines(ctx, q.service || 'Selecione o serviço', W - 2 * M);
    font(ctx, 27); const client = q.client ? lines(ctx, 'Preparado para ' + q.client, W - 2 * M) : [];
    const start = 352 + device.length * 70 + 20 + service.length * 42 + (client.length ? 21 + client.length * 35 : 0) + 36;
    font(ctx, 29, 700); const tagline = q.tagline ? lines(ctx, q.tagline, W - 2 * M) : [];
    font(ctx, 25); const contacts = [...lines(ctx, 'WhatsApp: ' + q.whatsapp, W - 2 * M), ...lines(ctx, 'Instagram: ' + q.instagram, W - 2 * M)];
    const footer = 67 + contacts.length * 38 + tagline.length * 37 + (q.validity ? 39 : 0);
    const end = H - 68 - footer - 24;
    const blocks = q.options.map((o, index) => {
      const single = q.options.length === 1 && !q.notes && !q.warranty;
      const nameSize = single ? 54 : 39, nameLine = single ? 66 : 48;
      font(ctx, nameSize, 700); const name = lines(ctx, o.name, W - 2 * M - 64);
      font(ctx, 28); const description = o.description ? lines(ctx, o.description, W - 2 * M - 64) : [];
      return { type: 'option', option: o, index, name, nameSize, nameLine, description, single,
        height: (single ? 340 : 228) + name.length * nameLine + (description.length ? 12 + description.length * 36 : 0) };
    });
    for (const [label, value] of [['OBSERVAÇÕES', q.notes], ['GARANTIA CONFIRMADA', q.warranty]]) {
      if (value) { font(ctx, 28); const rows = lines(ctx, value, W - 2 * M - 64); blocks.push({ type: 'condition', label, rows, height: 99 + rows.length * 38 }); }
    }
    const pages = []; let page = [], used = 0;
    for (const block of blocks) {
      if (block.height > end - start) throw new Error('O texto é longo para a arte. Reduza o nome, a descrição ou os detalhes do aparelho.');
      const next = block.height + (page.length ? 24 : 0);
      if (used + next > end - start) { pages.push(page); page = []; used = 0; }
      used += block.height + (page.length ? 24 : 0); page.push(block);
    }
    if (page.length) pages.push(page);
    return { pages, device, service, client, tagline, contacts, start, end, footer };
  }
  function render(q, logo) {
    const layout = measure(q);
    const canvases = layout.pages.map((blocks, pageIndex) => {
      const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#100d27'; ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(1030, 200, 0, 1030, 200, 1100); glow.addColorStop(0, '#47205e'); glow.addColorStop(.6, '#241135'); glow.addColorStop(1, '#100d27');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      const accent = ctx.createLinearGradient(M, 0, W - M, 0); accent.addColorStop(0, '#9333ea'); accent.addColorStop(1, '#ed68ee');
      ctx.fillStyle = accent; ctx.fillRect(0, 0, W, 10);
      roundRect(ctx, M, 57, 204, 204, 30, '#100d27', '#594069');
      if (logo?.complete && logo.naturalWidth) {
        const ratio = Math.min(184 / logo.naturalWidth, 184 / logo.naturalHeight);
        const w = logo.naturalWidth * ratio, h = logo.naturalHeight * ratio;
        ctx.drawImage(logo, M + (204 - w) / 2, 57 + (204 - h) / 2, w, h);
      }
      font(ctx, 20, 700); ctx.fillStyle = '#dd9eea'; ctx.fillText('NEXCELL  /  ASSISTÊNCIA TÉCNICA', 320, 83);
      font(ctx, 49, 700); ctx.fillStyle = '#ffffff'; ctx.fillText('ORÇAMENTO', 320, 127);
      font(ctx, 36, 400); ctx.fillStyle = '#d8c1e5'; ctx.fillText('PERSONALIZADO', 320, 190);
      ctx.fillStyle = '#6a3f7855'; ctx.fillRect(M, 298, W - 2 * M, 2);
      font(ctx, 19, 700); ctx.fillStyle = '#c28ddd'; ctx.fillText('CUIDADO CERTO PARA O SEU', M, 318);
      font(ctx, 60, 700); let y = textLines(ctx, layout.device, M, 352, 70);
      font(ctx, 31); y = textLines(ctx, layout.service, M, y + 20, 42, '#d7c5e3');
      if (layout.client.length) { font(ctx, 27); textLines(ctx, layout.client, M, y + 21, 35, '#b89cc8'); }
      const baseHeight = blocks.reduce((n, b) => n + b.height, 0) + (blocks.length - 1) * 24;
      const spare = layout.end - layout.start - baseHeight;
      const optionCount = blocks.filter(b => b.type === 'option').length;
      const single = blocks.length === 1 && blocks[0].single;
      const extra = single ? Math.max(0, spare - 80) : optionCount ? Math.min(spare / optionCount, blocks.length === 1 ? 260 : 55) : 0;
      const totalHeight = baseHeight + extra * optionCount;
      y = layout.start + Math.max(0, (layout.end - layout.start - totalHeight) / 2);
      blocks.forEach(block => {
        const height = block.height + (block.type === 'option' ? extra : 0);
        if (block.type === 'option') {
          const fill = ctx.createLinearGradient(M, y, W - M, y + height); fill.addColorStop(0, '#352044'); fill.addColorStop(1, '#1b142c');
          roundRect(ctx, M, y, W - 2 * M, height, 28, fill, '#78548c');
          roundRect(ctx, M + 30, y + 25, 122, 31, 8, '#5c3274');
          font(ctx, 17, 700); ctx.fillStyle = '#f1d2ff'; ctx.fillText('OPÇÃO ' + String(block.index + 1).padStart(2, '0'), M + 45, y + 30);
          const x = M + 32;
          font(ctx, block.nameSize, 700); let contentY = textLines(ctx, block.name, x, y + (single ? 110 : 75), block.nameLine);
          if (block.description.length) { font(ctx, 28); contentY = textLines(ctx, block.description, x, contentY + 12, 36, '#c3b0d0'); }
          let priceSize = single ? 132 : blocks.length === 1 ? 94 : 74;
          const priceText = block.option.price === null ? 'R$ —' : C.money(block.option.price);
          font(ctx, priceSize, 700);
          while (ctx.measureText(priceText).width > W - 2 * M - 64 && priceSize > 38) font(ctx, --priceSize, 700);
          const priceY = y + height - priceSize - (single ? 114 : 57);
          if (single) {
            font(ctx, 22, 700); ctx.fillStyle = '#ce9fe7'; ctx.fillText('VALOR DO SERVIÇO', x, priceY - 51);
            ctx.fillStyle = '#79508c'; ctx.fillRect(x, priceY - 86, W - 2 * M - 64, 2);
            font(ctx, priceSize, 700);
          }
          ctx.fillStyle = '#ffffff'; ctx.fillText(priceText, x, priceY);
          font(ctx, single ? 30 : 24); ctx.fillStyle = '#d4a2e9'; ctx.fillText('com instalação incluída', x, y + height - (single ? 72 : 41));
        } else {
          roundRect(ctx, M, y, W - 2 * M, height, 22, '#20142f', '#53385f');
          font(ctx, 19, 700); ctx.fillStyle = '#d29be9'; ctx.fillText(block.label, M + 32, y + 25);
          font(ctx, 28); textLines(ctx, block.rows, M + 32, y + 66, 38, '#e1d2eb');
        }
        y += height + 24;
      });
      const footerTop = H - 68 - layout.footer;
      ctx.fillStyle = accent; ctx.fillRect(M, footerTop, W - 2 * M, 3);
      y = footerTop + 30;
      if (layout.tagline.length) { font(ctx, 29, 700); y = textLines(ctx, layout.tagline, M, y, 37); y += 15; }
      font(ctx, 25, 400); y = textLines(ctx, layout.contacts, M, y, 38, '#d6c2e0');
      if (q.validity) { font(ctx, 23); ctx.fillStyle = '#b496c4'; ctx.fillText('Orçamento válido até ' + C.dateBR(q.validity), M, y + 4); }
      if (layout.pages.length > 1) { font(ctx, 20); ctx.fillStyle = '#bba0cb'; ctx.textAlign = 'right'; ctx.fillText(`${pageIndex + 1} / ${layout.pages.length}`, W - M, H - 44); ctx.textAlign = 'left'; }
      return canvas;
    });
    return { canvases, layout };
  }
  const encoder = new TextEncoder();
  function bytes(text) { return encoder.encode(text); }
  function jpegBytes(canvas) {
    const raw = atob(canvas.toDataURL('image/jpeg', .97).split(',')[1]);
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }
  function pdf(canvases) {
    // PDF 1.4: cada página contém exclusivamente a arte pública em alta resolução.
    const chunks = [], offsets = [0]; let length = 0;
    const push = data => { const b = typeof data === 'string' ? bytes(data) : data; chunks.push(b); length += b.length; };
    const object = (id, content) => { offsets[id] = length; push(`${id} 0 obj\n`); push(content); push('\nendobj\n'); };
    push('%PDF-1.4\n%NEXCELL\n');
    const count = canvases.length;
    object(1, '<< /Type /Catalog /Pages 2 0 R >>');
    object(2, `<< /Type /Pages /Count ${count} /Kids [${canvases.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] >>`);
    canvases.forEach((canvas, i) => {
      const page = 3 + i * 3, img = page + 1, content = page + 2, data = jpegBytes(canvas);
      object(page, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 405 720] /Resources << /XObject << /Im0 ${img} 0 R >> >> /Contents ${content} 0 R >>`);
      offsets[img] = length;
      push(`${img} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${data.length} >>\nstream\n`);
      push(data); push('\nendstream\nendobj\n');
      const commands = 'q\n405 0 0 720 0 0 cm\n/Im0 Do\nQ\n';
      object(content, `<< /Length ${bytes(commands).length} >>\nstream\n${commands}endstream`);
    });
    const xref = length, total = 3 + count * 3;
    push(`xref\n0 ${total}\n0000000000 65535 f \n`);
    for (let i = 1; i < total; i++) push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(chunks, { type: 'application/pdf' });
  }
  function png(canvas) { return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Não foi possível gerar a imagem.')), 'image/png')); }
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = (n & 1) ? (0xedb88320 ^ (n >>> 1)) : (n >>> 1); return n >>> 0; });
  function crc32(data) { let c = 0xffffffff; for (const b of data) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  async function zip(files) {
    // ZIP STORE: evita dependências externas; adequado a PNGs já comprimidos.
    const local = [], central = []; let offset = 0, centralSize = 0;
    for (const file of files) {
      const data = new Uint8Array(await file.blob.arrayBuffer()), name = bytes(file.name), crc = crc32(data);
      const header = new Uint8Array(30 + name.length), h = new DataView(header.buffer);
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x800, true); h.setUint16(12, 33, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); header.set(name, 30);
      const entry = new Uint8Array(46 + name.length), d = new DataView(entry.buffer);
      d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(8, 0x800, true); d.setUint16(14, 33, true);
      d.setUint32(16, crc, true); d.setUint32(20, data.length, true); d.setUint32(24, data.length, true); d.setUint16(28, name.length, true); d.setUint32(42, offset, true); entry.set(name, 46);
      local.push(header, data); central.push(entry); offset += header.length + data.length; centralSize += entry.length;
    }
    const end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, centralSize, true); e.setUint32(16, offset, true);
    return new Blob([...local, ...central, end], { type: 'application/zip' });
  }
  window.NexcellExport = { render, pdf, png, zip, download, W, H };
})();
