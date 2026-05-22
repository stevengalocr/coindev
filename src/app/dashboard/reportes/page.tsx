'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useData } from '@/hooks/useData';
import { CAT, filterMovs, fmtMoney, aggregate, type Period } from '@/lib/data';
import { PeriodChips } from '@/components/shell/PeriodChips';
import { CategoryGlyph } from '@/components/shell/CategoryGlyph';
import { Donut, YearChart } from '@/components/shell/Charts';
import { MoneyText } from '@/components/shell/MoneyText';
import { Icon } from '@/components/ui/Icon';

function periodLabel(period: Period, lang: string): string {
  const now = new Date();
  if (period === 'month') return now.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { month: 'long', year: 'numeric' });
  if (period === 'week') return lang === 'es' ? 'Última semana' : 'Last week';
  if (period === 'quarter') return lang === 'es' ? 'Últimos 3 meses' : 'Last 3 months';
  return now.getFullYear().toString();
}

export default function ReportesPage() {
  const { t, lang } = useApp();
  const { movements, accounts, yearEvolution, loading, liveUsdRate } = useData();
  const [period, setPeriod] = useState<Period>('month');
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const movs = filterMovs(movements, period);
  const expByCat: Record<string, number> = {};
  movs.filter(m => m.type === 'expense').forEach(m => { expByCat[m.cat] = (expByCat[m.cat] || 0) + m.amount; });
  const donutData = Object.entries(expByCat)
    .map(([cat, value]) => ({ value, color: CAT[cat]?.color ?? '#888', cat }))
    .sort((a, b) => b.value - a.value);
  const totalExp = donutData.reduce((s, d) => s + d.value, 0);

  const byDesc: Record<string, number> = {};
  movs.filter(m => m.type === 'expense').forEach(m => { byDesc[m.desc] = (byDesc[m.desc] || 0) + m.amount; });
  const topMerchants = Object.entries(byDesc).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const income = movs.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
  const savings = income - totalExp;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const savingsBalance = accounts.find(a => a.kind === 'savings')?.balance ?? 0;
  const health = aggregate(movs, savingsBalance);
  const healthSavingsRate = health.savingsRate * 100;
  const healthFixedRatio = health.fixedRatio * 100;
  const healthEmergencyDays = health.emergencyDays;

  const now = new Date();
  const yearLabel = now.getFullYear().toString();
  const pLabel = periodLabel(period, lang);
  const exportDate = now.toLocaleDateString(lang === 'es' ? 'es-CR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── CSV Export ──────────────────────────────────────────────────────
  function handleExportCSV() {
    setExporting('csv');
    const fmt = (n: number) => fmtMoney(n, 'CRC');
    const rows: string[][] = [
      ['CoinDev - ' + (lang === 'es' ? 'Reporte Financiero' : 'Financial Report')],
      [lang === 'es' ? 'Período' : 'Period', pLabel],
      [lang === 'es' ? 'Generado' : 'Generated', exportDate],
      [lang === 'es' ? 'Tipo de cambio USD' : 'USD exchange rate', `1 USD = ${liveUsdRate} CRC`],
      [],
      [lang === 'es' ? '=== RESUMEN DEL PERÍODO ===' : '=== PERIOD SUMMARY ==='],
      [lang === 'es' ? 'Ingresos' : 'Income', lang === 'es' ? 'Gastos' : 'Expenses', lang === 'es' ? 'Ahorro' : 'Savings', lang === 'es' ? 'Tasa de ahorro' : 'Savings rate'],
      [fmt(income), fmt(totalExp), fmt(savings), Math.round(savingsRate) + '%'],
      [],
      [lang === 'es' ? '=== SALUD FINANCIERA ===' : '=== FINANCIAL HEALTH ==='],
      [lang === 'es' ? 'Tasa de ahorro' : 'Savings rate', lang === 'es' ? 'Gastos fijos / Ingresos' : 'Fixed costs / Income', lang === 'es' ? 'Días de cobertura' : 'Coverage days'],
      [Math.round(healthSavingsRate) + '%', Math.round(healthFixedRatio) + '%', String(healthEmergencyDays)],
      [],
      [lang === 'es' ? '=== DISTRIBUCIÓN POR CATEGORÍA ===' : '=== CATEGORY BREAKDOWN ==='],
      [lang === 'es' ? 'Categoría' : 'Category', lang === 'es' ? 'Monto' : 'Amount', lang === 'es' ? '% del total' : '% of total'],
      ...donutData.map(d => [
        CAT[d.cat]?.[`label_${lang}` as 'label_es'] ?? d.cat,
        fmt(d.value),
        totalExp > 0 ? Math.round((d.value / totalExp) * 100) + '%' : '0%',
      ]),
      [],
      [lang === 'es' ? '=== DONDE MÁS GASTAS ===' : '=== TOP MERCHANTS ==='],
      [lang === 'es' ? 'Comercio / Descripción' : 'Merchant / Description', lang === 'es' ? 'Monto' : 'Amount'],
      ...topMerchants.map(([desc, amt]) => [desc, fmt(amt)]),
      [],
      [lang === 'es' ? '=== EVOLUCIÓN ANUAL ===' : '=== YEAR EVOLUTION ==='],
      [lang === 'es' ? 'Mes' : 'Month', lang === 'es' ? 'Ingresos' : 'Income', lang === 'es' ? 'Gastos' : 'Expenses', lang === 'es' ? 'Balance' : 'Balance'],
      ...yearEvolution.filter(p => !p.future).map(p => [p.m, fmt(p.income), fmt(p.expense), fmt(p.income - p.expense)]),
    ];

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coindev-reporte-${pLabel.replace(/\s/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
  }

  // ── PDF Export ──────────────────────────────────────────────────────
  async function handleExportPDF() {
    setExporting('pdf');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const fmt = (n: number) => fmtMoney(n, 'CRC');
      const pageW = doc.internal.pageSize.getWidth();
      let y = 18;

      // Header
      doc.setFillColor(11, 17, 32);
      doc.rect(0, 0, pageW, 38, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(255, 220, 80);
      doc.text('CoinDev', 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(180, 190, 210);
      doc.setFont('helvetica', 'normal');
      doc.text(lang === 'es' ? 'Reporte Financiero' : 'Financial Report', 14, 24);
      doc.setFontSize(9);
      doc.setTextColor(130, 145, 170);
      doc.text(`${lang === 'es' ? 'Período' : 'Period'}: ${pLabel}   |   ${lang === 'es' ? 'Generado' : 'Generated'}: ${exportDate}   |   USD: ${liveUsdRate} CRC`, 14, 32);
      y = 48;

      // Section helper
      const section = (title: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(80, 100, 140);
        doc.text(title.toUpperCase(), 14, y);
        doc.setDrawColor(80, 100, 140);
        doc.setLineWidth(0.3);
        doc.line(14, y + 1.5, pageW - 14, y + 1.5);
        y += 7;
      };

      // Summary
      section(lang === 'es' ? 'Resumen del Período' : 'Period Summary');
      autoTable(doc, {
        startY: y,
        head: [[lang === 'es' ? 'Ingresos' : 'Income', lang === 'es' ? 'Gastos' : 'Expenses', lang === 'es' ? 'Ahorro' : 'Savings', lang === 'es' ? 'Tasa de ahorro' : 'Savings rate']],
        body: [[fmt(income), fmt(totalExp), fmt(savings), Math.round(savingsRate) + '%']],
        theme: 'grid',
        headStyles: { fillColor: [20, 30, 55], textColor: [180, 200, 230], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 10, fontStyle: 'bold', textColor: [30, 40, 60] },
        columnStyles: { 0: { textColor: [16, 185, 129] }, 1: { textColor: [239, 68, 68] }, 2: { textColor: [91, 155, 255] }, 3: { textColor: [100, 120, 160] } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

      // Health
      section(lang === 'es' ? 'Salud Financiera' : 'Financial Health');
      autoTable(doc, {
        startY: y,
        head: [[lang === 'es' ? 'Tasa de ahorro' : 'Savings rate', lang === 'es' ? 'Gastos fijos / Ingresos' : 'Fixed / Income', lang === 'es' ? 'Días de cobertura' : 'Coverage days']],
        body: [[Math.round(healthSavingsRate) + '%', Math.round(healthFixedRatio) + '%', String(healthEmergencyDays) + (lang === 'es' ? ' días' : ' days')]],
        theme: 'grid',
        headStyles: { fillColor: [20, 30, 55], textColor: [180, 200, 230], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 10, fontStyle: 'bold', textColor: [30, 40, 60] },
        margin: { left: 14, right: 14 },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

      // Category breakdown
      if (donutData.length > 0) {
        section(lang === 'es' ? 'Distribución por Categoría' : 'Category Breakdown');
        autoTable(doc, {
          startY: y,
          head: [['#', lang === 'es' ? 'Categoría' : 'Category', lang === 'es' ? 'Monto' : 'Amount', '% ' + (lang === 'es' ? 'del total' : 'of total')]],
          body: donutData.map((d, i) => [
            String(i + 1),
            CAT[d.cat]?.[`label_${lang}` as 'label_es'] ?? d.cat,
            fmt(d.value),
            totalExp > 0 ? Math.round((d.value / totalExp) * 100) + '%' : '0%',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [20, 30, 55], textColor: [180, 200, 230], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9, textColor: [30, 40, 60] },
          columnStyles: { 0: { cellWidth: 12 }, 3: { cellWidth: 22, fontStyle: 'bold' } },
          margin: { left: 14, right: 14 },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }

      // Top merchants
      if (topMerchants.length > 0) {
        if (y > 220) { doc.addPage(); y = 18; }
        section(lang === 'es' ? 'Donde Más Gastas' : 'Top Merchants');
        autoTable(doc, {
          startY: y,
          head: [['#', lang === 'es' ? 'Comercio / Descripción' : 'Merchant / Description', lang === 'es' ? 'Monto' : 'Amount']],
          body: topMerchants.map(([desc, amt], i) => [String(i + 1), desc, fmt(amt)]),
          theme: 'striped',
          headStyles: { fillColor: [20, 30, 55], textColor: [180, 200, 230], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9, textColor: [30, 40, 60] },
          columnStyles: { 0: { cellWidth: 12 }, 2: { fontStyle: 'bold', cellWidth: 32 } },
          margin: { left: 14, right: 14 },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }

      // Year evolution
      const yearData = yearEvolution.filter(p => !p.future);
      if (yearData.length > 0) {
        if (y > 220) { doc.addPage(); y = 18; }
        section(lang === 'es' ? 'Evolución Anual' : 'Year Evolution');
        autoTable(doc, {
          startY: y,
          head: [[lang === 'es' ? 'Mes' : 'Month', lang === 'es' ? 'Ingresos' : 'Income', lang === 'es' ? 'Gastos' : 'Expenses', 'Balance']],
          body: yearData.map(p => [p.m, fmt(p.income), fmt(p.expense), fmt(p.income - p.expense)]),
          theme: 'striped',
          headStyles: { fillColor: [20, 30, 55], textColor: [180, 200, 230], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9, textColor: [30, 40, 60] },
          columnStyles: { 1: { textColor: [16, 185, 129] }, 2: { textColor: [239, 68, 68] }, 3: { fontStyle: 'bold' } },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 160, 180);
        doc.text('CoinDev · coindev.app', 14, doc.internal.pageSize.getHeight() - 8);
        doc.text(`${i} / ${totalPages}`, pageW - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
      }

      doc.save(`coindev-reporte-${pLabel.replace(/\s/g, '-').toLowerCase()}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="page-enter">
      <style>{`
        @media (max-width: 640px) {
          .rep-summary { grid-template-columns: 1fr !important; }
          .rep-grid { grid-template-columns: 1fr !important; }
          .rep-health { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px) {
          .rep-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>{t.reportsTitle}</h1>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
            {yearLabel}
            {liveUsdRate !== 510 && (
              <span style={{ marginLeft: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(91,155,255,0.08)', border: '1px solid rgba(91,155,255,0.18)', fontSize: 11, color: '#5B9BFF', fontWeight: 500 }}>
                USD = {liveUsdRate} CRC
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <PeriodChips value={period} onChange={setPeriod} t={t} />

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleExportCSV}
              disabled={loading || exporting !== null}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, cursor: loading || exporting !== null ? 'default' : 'pointer', opacity: loading || exporting !== null ? 0.5 : 1 }}
            >
              <Icon name="download" size={13} stroke={1.8} />
              {exporting === 'csv' ? (lang === 'es' ? 'Exportando…' : 'Exporting…') : 'CSV'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={loading || exporting !== null}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, cursor: loading || exporting !== null ? 'default' : 'pointer', opacity: loading || exporting !== null ? 0.5 : 1 }}
            >
              <Icon name="download" size={13} stroke={1.8} />
              {exporting === 'pdf' ? (lang === 'es' ? 'Generando…' : 'Generating…') : 'PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Financial Health ──────────────────────────────────────────────── */}
      {!loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>{t.healthTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="rep-health">
            {/* Savings rate */}
            <div className="cd-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 8 }}>
                {t.savingsRateLabel}
              </div>
              <div className="mono" style={{
                fontSize: 28, fontWeight: 700, lineHeight: 1,
                color: healthSavingsRate >= 20 ? 'var(--income)' : healthSavingsRate >= 10 ? 'var(--warn)' : 'var(--expense)',
              }}>
                {Math.round(healthSavingsRate)}%
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>
                {lang === 'es' ? 'Ahorro sobre ingresos' : 'Savings over income'}
              </div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.min(100, Math.max(0, healthSavingsRate))}%`,
                  background: healthSavingsRate >= 20 ? 'var(--income)' : healthSavingsRate >= 10 ? 'var(--warn)' : 'var(--expense)',
                  transition: 'width 600ms ease',
                }} />
              </div>
            </div>

            {/* Fixed / Income ratio */}
            <div className="cd-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 8 }}>
                {t.fixedRatioLabel}
              </div>
              <div className="mono" style={{
                fontSize: 28, fontWeight: 700, lineHeight: 1,
                color: healthFixedRatio < 40 ? 'var(--income)' : healthFixedRatio < 60 ? 'var(--warn)' : 'var(--expense)',
              }}>
                {Math.round(healthFixedRatio)}%
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>
                {lang === 'es' ? 'Compromisos mensuales' : 'Monthly commitments'}
              </div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.min(100, Math.max(0, healthFixedRatio))}%`,
                  background: healthFixedRatio < 40 ? 'var(--income)' : healthFixedRatio < 60 ? 'var(--warn)' : 'var(--expense)',
                  transition: 'width 600ms ease',
                }} />
              </div>
            </div>

            {/* Emergency days */}
            <div className="cd-card" style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 8 }}>
                {t.emergencyDaysLabel}
              </div>
              <div className="mono" style={{
                fontSize: 28, fontWeight: 700, lineHeight: 1,
                color: healthEmergencyDays >= 90 ? 'var(--income)' : healthEmergencyDays >= 30 ? 'var(--warn)' : 'var(--expense)',
              }}>
                {healthEmergencyDays}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>
                {lang === 'es' ? 'Con gastos actuales' : 'At current spend'}
              </div>
              <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'var(--surface-2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.min(100, (healthEmergencyDays / 180) * 100)}%`,
                  background: healthEmergencyDays >= 90 ? 'var(--income)' : healthEmergencyDays >= 30 ? 'var(--warn)' : 'var(--expense)',
                  transition: 'width 600ms ease',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="stagger">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }} className="rep-summary">
            {[1,2,3].map(i => (
              <div key={i} className="cd-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="cd-skeleton" style={{ height: 11, width: '55%' }} />
                <div className="cd-skeleton" style={{ height: 28, width: '70%', borderRadius: 8 }} />
                <div className="cd-skeleton" style={{ height: 11, width: '40%' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="rep-grid">
            {[1,2].map(i => (
              <div key={i} className="cd-card" style={{ padding: '20px 22px', minHeight: 200, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="cd-skeleton" style={{ height: 15, width: '45%', borderRadius: 6 }} />
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div className="cd-skeleton" style={{ width: 120, height: 120, borderRadius: 60 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1,2,3,4].map(j => <div key={j} className="cd-skeleton" style={{ height: 12 }} />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="cd-card" style={{ padding: '20px 24px', minHeight: 180, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="cd-skeleton" style={{ height: 15, width: '30%', borderRadius: 6 }} />
            <div className="cd-skeleton" style={{ flex: 1, borderRadius: 8 }} />
          </div>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }} className="rep-summary">
            {[
              { label: t.income, amount: income, color: 'var(--income)', pct: null },
              { label: t.expense, amount: totalExp, color: 'var(--expense)', pct: null },
              { label: t.savings, amount: savings, color: 'var(--cyan)', pct: savingsRate },
            ].map(({ label, amount, color, pct }) => (
              <div key={label} className="cd-card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, marginBottom: 10 }}>{label}</div>
                <MoneyText amount={Math.abs(amount)} currency="CRC" size={22} weight={600} style={{ color }} />
                {pct !== null && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
                    <span style={{ color: pct >= 20 ? 'var(--income)' : pct >= 10 ? 'var(--warn)' : 'var(--expense)', fontWeight: 600 }}>
                      {Math.round(pct)}%
                    </span>{' '}
                    {lang === 'es' ? 'tasa de ahorro' : 'savings rate'}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="rep-grid">
            <div className="cd-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>{t.distribution}</div>
              {donutData.length > 0 ? (
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Donut data={donutData} size={160} stroke={22} centerLabel={t.expense} centerValue={fmtMoney(totalExp, 'CRC')} />
                  <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {donutData.slice(0, 6).map(d => (
                      <div key={d.cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CategoryGlyph id={d.cat} size={22} />
                        <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {CAT[d.cat]?.[`label_${lang}` as 'label_es'] ?? d.cat}
                        </span>
                        <span className="mono" style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{fmtMoney(d.value, 'CRC')}</span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', width: 32, textAlign: 'right' }}>
                          {Math.round((d.value / totalExp) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
                  {lang === 'es' ? 'Sin datos para este período.' : 'No data for this period.'}
                </div>
              )}
            </div>

            <div className="cd-card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>{t.topMerchants}</div>
              {topMerchants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
                  {lang === 'es' ? 'Sin datos.' : 'No data.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {topMerchants.map(([desc, amt], i) => (
                    <div key={desc} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: i < topMerchants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }} className="mono">{i + 1}</div>
                      <div style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</div>
                      <MoneyText amount={amt} currency="CRC" size={13} weight={600} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="cd-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{t.evolution}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{yearLabel}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                {[{ c: 'var(--income)', l: t.income }, { c: 'var(--expense)', l: t.expense }].map(({ c, l }) => (
                  <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                    <span style={{ width: 9, height: 9, borderRadius: 5, background: c }} />{l}
                  </span>
                ))}
              </div>
            </div>
            <YearChart data={yearEvolution} currency="CRC" big />
          </div>
        </>
      )}

    </div>
  );
}
