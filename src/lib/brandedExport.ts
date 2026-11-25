'use client';

import type { Workbook, Worksheet } from 'exceljs';
import api from '@/lib/axios';

/**
 * Branded Excel (.xlsx) exports: logo, SUTURA colours, money as real numbers.
 * Built in the browser with ExcelJS (loaded only when someone downloads), so the
 * server needs no spreadsheet library. Data comes from the same sources as the
 * plain CSV downloads, which stay available alongside.
 */

// SUTURA palette (globals.css), as ARGB for Excel.
const INK = 'FF2D2A26';
const INK_MUTED = 'FF827A73';
const TAUPE = 'FF9A8073';
const TAUPE_DARK = 'FF6B4E3E';
const STRIPE = 'FFFAF6F3';
const LINE = 'FFEBE6E0';

export type Cell = string | number | null;
export interface ExportTable {
  heading?: string;
  columns: string[];
  rows: Cell[][];
  /** Column indexes holding peso amounts (formatted #,##0.00, right-aligned). */
  money?: number[];
  /** Bold closing row, e.g. ['TOTAL', null, 1234.5]. */
  total?: Cell[];
}
export interface BrandedSheet {
  fileName: string;
  sheetName: string;
  /** Shop name (or "SUTURA" for admin exports). */
  org: string;
  title: string;
  subtitle?: string;
  meta?: [string, Cell][];
  tables: ExportTable[];
}
export interface LogoImage { base64: string; width: number; height: number }

/** RFC 4180 CSV → rows. Handles quotes, escaped quotes, commas/newlines in fields and a UTF-8 BOM. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

/** "1,234.50" / "1234.5" → 1234.5; anything else → null. */
export function toNumber(v: Cell): number | null {
  if (typeof v === 'number') return v;
  if (v == null) return null;
  const n = Number(String(v).replaceAll(',', '').trim());
  return String(v).trim() !== '' && Number.isFinite(n) ? n : null;
}

/** Any image (URL or Blob, incl. SVG/WebP) → PNG base64 at a fixed height, for Excel. */
async function toPng(source: string | Blob, height = 64): Promise<LogoImage | null> {
  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const ratio = (img.naturalWidth || img.width || 1) / (img.naturalHeight || img.height || 1);
    const scale = 3; // crisp when zoomed
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(height * ratio * scale);
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { base64: canvas.toDataURL('image/png'), width: Math.round(height * ratio), height };
  } catch {
    return null;
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(url);
  }
}

export const SUTURA_LOGO_URL = '/images/logo.svg';

/** The shop's own logo (through the API, which allows the cross-site read), else the SUTURA logo. */
export async function shopOrSuturaLogo(storeId: number | null | undefined): Promise<LogoImage | null> {
  if (storeId) {
    try {
      const res = await api.get(`/stores/${storeId}/branding/logo`, { responseType: 'blob' });
      const png = await toPng(res.data as Blob);
      if (png) return png;
    } catch { /* no logo uploaded: use SUTURA's */ }
  }
  return toPng(SUTURA_LOGO_URL);
}

export const suturaLogo = () => toPng(SUTURA_LOGO_URL);

function widths(ws: Worksheet, sheet: BrandedSheet, colCount: number) {
  for (let c = 0; c < colCount; c++) {
    let max = 10;
    for (const t of sheet.tables) {
      max = Math.max(max, (t.columns[c] ?? '').length + 2);
      for (const r of t.rows) max = Math.max(max, String(r[c] ?? '').length + 2);
    }
    ws.getColumn(c + 1).width = Math.min(max, 42);
  }
}

/** Builds the themed workbook and downloads it. */
export async function downloadBrandedXlsx(sheet: BrandedSheet, logo: LogoImage | null): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = 'SUTURA';
  wb.created = new Date();
  const ws = wb.addWorksheet(sheet.sheetName.slice(0, 31), {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.2, footer: 0.25 } },
    headerFooter: { oddFooter: '&L&8Generated by SUTURA · suturaofficial.tech&R&8Page &P of &N' },
    views: [{ showGridLines: false }],
  });

  const colCount = Math.max(2, ...sheet.tables.map((t) => t.columns.length));
  widths(ws, sheet, colCount);
  const lastCol = ws.getColumn(colCount).letter;
  let r = 1;

  // Logo, then the shop name, title and period.
  if (logo) {
    const id = wb.addImage({ base64: logo.base64, extension: 'png' });
    ws.getRow(1).height = logo.height * 0.78;
    ws.addImage(id, { tl: { col: 0, row: 0 }, ext: { width: logo.width, height: logo.height }, editAs: 'oneCell' });
    r = 2;
  }
  const line = (text: string, font: Partial<import('exceljs').Font>, height?: number) => {
    const row = ws.getRow(r);
    row.getCell(1).value = text;
    row.getCell(1).font = { name: 'Calibri', ...font };
    if (height) row.height = height;
    ws.mergeCells(`A${r}:${lastCol}${r}`);
    r++;
  };
  line(sheet.org, { size: 16, bold: true, color: { argb: INK } }, 24);
  line(sheet.title, { size: 12, bold: true, color: { argb: TAUPE_DARK } }, 18);
  if (sheet.subtitle) line(sheet.subtitle, { size: 10, color: { argb: INK_MUTED } });
  // Taupe rule under the header.
  for (let c = 1; c <= colCount; c++) ws.getRow(r - 1).getCell(c).border = { bottom: { style: 'medium', color: { argb: TAUPE } } };
  r++;

  if (sheet.meta?.length) {
    for (const [label, value] of sheet.meta) {
      const row = ws.getRow(r++);
      row.getCell(1).value = label;
      row.getCell(1).font = { bold: true, color: { argb: INK_MUTED }, size: 10 };
      const n = toNumber(value);
      const cell = row.getCell(2);
      cell.value = n ?? value ?? '';
      cell.font = { bold: true, color: { argb: INK }, size: 11 };
      cell.alignment = { horizontal: 'left' };
      if (n !== null && /amount|total|revenue|balance|value|collected|paid|due/i.test(label)) cell.numFmt = '"₱"#,##0.00';
    }
    r++;
  }

  let frozen = false;
  for (const t of sheet.tables) {
    if (t.heading) {
      const h = ws.getRow(r++).getCell(1);
      h.value = t.heading;
      h.font = { bold: true, size: 12, color: { argb: TAUPE_DARK } };
    }
    const money = new Set(t.money ?? []);
    const headerRow = ws.getRow(r);
    t.columns.forEach((name, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = name;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TAUPE } };
      cell.alignment = { vertical: 'middle', horizontal: money.has(i) ? 'right' : 'left', wrapText: true };
      cell.border = { bottom: { style: 'thin', color: { argb: TAUPE_DARK } } };
    });
    headerRow.height = 22;
    const headerAt = r;
    if (!frozen) { ws.views = [{ state: 'frozen', ySplit: headerAt, showGridLines: false }]; frozen = true; }
    r++;

    t.rows.forEach((values, idx) => {
      const row = ws.getRow(r++);
      values.forEach((v, i) => {
        const cell = row.getCell(i + 1);
        const n = money.has(i) ? toNumber(v) : null;
        cell.value = n ?? v ?? '';
        if (money.has(i)) { cell.numFmt = '#,##0.00'; cell.alignment = { horizontal: 'right' }; }
        cell.font = { size: 10, color: { argb: INK } };
        cell.border = { bottom: { style: 'hair', color: { argb: LINE } } };
        if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STRIPE } };
      });
    });
    if (t.total) {
      const row = ws.getRow(r++);
      t.total.forEach((v, i) => {
        const cell = row.getCell(i + 1);
        const n = money.has(i) ? toNumber(v) : null;
        cell.value = n ?? v ?? '';
        cell.font = { bold: true, size: 11, color: { argb: INK } };
        cell.border = { top: { style: 'medium', color: { argb: TAUPE } } };
        if (money.has(i)) { cell.numFmt = '"₱"#,##0.00'; cell.alignment = { horizontal: 'right' }; }
      });
    }
    r++;
  }

  const foot = ws.getRow(r + 1).getCell(1);
  foot.value = `Generated by SUTURA · suturaofficial.tech · ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`;
  foot.font = { italic: true, size: 9, color: { argb: INK_MUTED } };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: sheet.fileName });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
