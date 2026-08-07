import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { fmt } from './fmt'

// ── palette ───────────────────────────────────────────────────────────────────
const C = {
  brand: [79, 70, 229],
  dark:  [20, 20, 30],
  muted: [115, 115, 130],
  line:  [218, 218, 228],
  bg:    [247, 247, 252],
  white: [255, 255, 255],
}

// ── constants ─────────────────────────────────────────────────────────────────
const QUOTE_STATUS_LABELS = {
  draft: 'Borrador', sent: 'Enviado', approved: 'Aprobado',
  signed: 'Firmado', rejected: 'Rechazado', cancelled: 'Cancelado',
}

const PROJECT_STATUS_LABELS = {
  pending: 'Pendiente', approved: 'Aprobado', in_progress: 'En curso',
  finished: 'Finalizado', cancelled: 'Cancelado',
}

// ── helpers ───────────────────────────────────────────────────────────────────
function periodLabel(year, month) {
  return new Date(year, month - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function nowLabel() {
  return new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtMonth(key) {
  const [y, m] = key.split('-')
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
}

function addHeader(doc, orgName, title, subtitle) {
  doc.setFillColor(...C.brand)
  doc.rect(0, 0, 210, 22, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...C.white)
  doc.text(orgName, 14, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(nowLabel(), 196, 14, { align: 'right' })

  doc.setTextColor(...C.dark)
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 36)

  doc.setTextColor(...C.muted)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(subtitle, 14, 43)

  doc.setDrawColor(...C.line)
  doc.setLineWidth(0.3)
  doc.line(14, 47, 196, 47)

  return 55
}

function addSection(doc, title, y) {
  doc.setTextColor(...C.muted)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text(title.toUpperCase(), 14, y)
  doc.setDrawColor(...C.line)
  doc.setLineWidth(0.2)
  doc.line(14, y + 2, 196, y + 2)
  return y + 8
}

function addKpis(doc, kpis, y) {
  const cols = 3
  const boxW = 56
  const boxH = 18
  const gapX = 5
  const gapY = 4

  kpis.forEach((kpi, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x   = 14 + col * (boxW + gapX)
    const top = y + row * (boxH + gapY)

    doc.setFillColor(...C.bg)
    doc.setDrawColor(...C.line)
    doc.setLineWidth(0.2)
    doc.roundedRect(x, top, boxW, boxH, 2, 2, 'FD')

    doc.setTextColor(...C.muted)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.text(kpi.label.toUpperCase(), x + 4, top + 6)

    doc.setTextColor(...C.dark)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(String(kpi.value ?? '—'), x + 4, top + 14)
  })

  const rows = Math.ceil(kpis.length / cols)
  return y + rows * (boxH + gapY) + 4
}

function tableStyle() {
  return {
    styles:             { fontSize: 8, cellPadding: 3, textColor: C.dark, lineColor: C.line, lineWidth: 0.1 },
    headStyles:         { fillColor: C.brand, textColor: C.white, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: C.bg },
    margin:             { left: 14, right: 14 },
  }
}

function addCoverPage(doc, orgName, userName, year, month, fullReport = false) {
  const W = 210

  doc.setFillColor(...C.brand)
  doc.rect(0, 0, W, 80, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...C.white)
  doc.text(orgName, W / 2, 38, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(190, 190, 220)
  doc.text('SISTEMA DE GESTIÓN EMPRESARIAL', W / 2, 52, { align: 'center' })

  doc.setTextColor(...C.dark)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  if (fullReport) {
    doc.text('Informe Mensual', W / 2, 118, { align: 'center' })
    doc.text('Completo', W / 2, 134, { align: 'center' })
  } else {
    doc.text('Reporte Financiero', W / 2, 118, { align: 'center' })
    doc.text('Mensual', W / 2, 134, { align: 'center' })
  }

  const pLabel = new Date(year, month - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.brand)
  doc.text(pLabel.charAt(0).toUpperCase() + pLabel.slice(1), W / 2, 152, { align: 'center' })

  doc.setDrawColor(...C.line)
  doc.setLineWidth(0.5)
  doc.line(55, 162, 155, 162)

  doc.setTextColor(...C.muted)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado el: ${nowLabel()}`, W / 2, 176, { align: 'center' })
  doc.text(`Por: ${userName}`, W / 2, 186, { align: 'center' })

  doc.setFillColor(...C.brand)
  doc.rect(0, 265, W, 32, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...C.white)
  doc.text('Reporte generado automáticamente por SOFIAPP CRM', W / 2, 282, { align: 'center' })
}

function addFooter(doc, orgName, { hasCover = false } = {}) {
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    if (hasCover && i === 1) continue
    doc.setPage(i)
    doc.setTextColor(...C.muted)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    const pageNum  = hasCover ? i - 1 : i
    const totalNum = hasCover ? total - 1 : total
    doc.text(`${orgName} — SOFIAPP CRM`, 14, 290)
    doc.text(`${pageNum} / ${totalNum}`, 196, 290, { align: 'right' })
  }
}

// ── content renderers (internal) ──────────────────────────────────────────────

function drawFinancesContent(doc, y, { data, year, month, currency }) {
  const income     = Number(data?.incomeMonth  ?? 0)
  const expense    = Number(data?.expenseMonth ?? 0)
  const balance    = Number(data?.totalBalance ?? 0)
  const pendingIn  = Number(data?.pendingIncome  ?? 0)
  const pendingOut = Number(data?.pendingExpense ?? 0)
  const incomeCount  = data?.incomeCount  ?? 0
  const expenseCount = data?.expenseCount ?? 0
  const monthly    = data?.monthlyEvolution  ?? []
  const categories = data?.categoryBreakdown ?? []
  const topMovs    = data?.topMovementsMonth ?? []
  const cashFlow   = data?.cashFlowMovements ?? []
  const pending    = data?.pendingMovements  ?? []

  const netMonth   = income - expense
  const saldoInit  = balance - netMonth
  const margin     = income > 0 ? ((netMonth / income) * 100).toFixed(1) : null
  const coverage   = expense > 0 ? (income / expense).toFixed(2) : null
  const pendingNet = pendingIn - pendingOut

  const avgIncome  = monthly.length ? monthly.reduce((s, m) => s + Number(m.income  || 0), 0) / monthly.length : 0
  const avgExpense = monthly.length ? monthly.reduce((s, m) => s + Number(m.expense || 0), 0) / monthly.length : 0
  const runway     = avgExpense > 0 ? (balance / avgExpense).toFixed(1) : null

  const bestIncMon    = monthly.length ? monthly.reduce((b, m) => Number(m.income  || 0) > Number(b.income  || 0) ? m : b, monthly[0]) : null
  const worstExpMon   = monthly.length ? monthly.reduce((w, m) => Number(m.expense || 0) > Number(w.expense || 0) ? m : w, monthly[0]) : null
  const surplusMonths = monthly.filter(m => Number(m.income || 0) > Number(m.expense || 0)).length

  let trend = 'Sin datos'
  if (monthly.length >= 3) {
    const recent = monthly.slice(-2)
    const older  = monthly.slice(-4, -2)
    const avgR = recent.reduce((s, m) => s + Number(m.income || 0), 0) / recent.length
    const avgO = older.length ? older.reduce((s, m) => s + Number(m.income || 0), 0) / older.length : 0
    if (avgO > 0) {
      const delta = ((avgR - avgO) / avgO) * 100
      trend = delta > 5 ? 'Creciente' : delta < -5 ? 'Decreciente' : 'Estable'
    }
  }

  const topIncome  = topMovs.find(m => m.type === 'income')
  const topExpense = topMovs.find(m => m.type === 'expense')
  const topCat     = categories[0]?.name ?? '—'

  // 1. Resumen ejecutivo
  y = addSection(doc, 'Resumen ejecutivo del periodo', y)
  y = addKpis(doc, [
    { label: 'Saldo inicial (estimado)',  value: fmt(saldoInit, currency) },
    { label: 'Saldo final en caja',       value: fmt(balance,   currency) },
    { label: 'Resultado del mes',         value: fmt(netMonth,  currency) },
    { label: 'Ingresos confirmados',      value: fmt(income,    currency) },
    { label: 'Egresos confirmados',       value: fmt(expense,   currency) },
    { label: 'Margen operativo',          value: margin   !== null ? `${margin}%`   : '—' },
    { label: 'Ratio de cobertura',        value: coverage !== null ? `${coverage}x` : '—' },
    { label: 'Movimientos del mes',       value: `${incomeCount + expenseCount} ops` },
    { label: 'Categoria con mayor gasto', value: topCat },
  ], y)

  // 2. Liquidez y proyecciones
  if (y > 200) { doc.addPage(); y = 24 }
  y = addSection(doc, 'Liquidez y proyecciones', y + 4)
  y = addKpis(doc, [
    { label: 'A cobrar (pendiente)', value: fmt(pendingIn,            currency) },
    { label: 'A pagar (pendiente)',  value: fmt(pendingOut,           currency) },
    { label: 'Resultado pendiente',  value: fmt(pendingNet,           currency) },
    { label: 'Saldo proyectado',     value: fmt(balance + pendingNet, currency) },
    { label: 'Cash runway',          value: runway !== null ? `${runway} meses` : '—' },
    { label: 'Eficiencia de cobro',  value: (income + pendingIn) > 0 ? `${((income / (income + pendingIn)) * 100).toFixed(1)}%` : '—' },
  ], y)

  // 3. Indicadores del mes
  if (y > 200) { doc.addPage(); y = 24 }
  y = addSection(doc, 'Indicadores del mes', y + 4)
  y = addKpis(doc, [
    { label: 'Ingresos — cantidad',     value: `${incomeCount} movimientos` },
    { label: 'Egresos — cantidad',      value: `${expenseCount} movimientos` },
    { label: 'Ticket promedio ingreso', value: incomeCount  > 0 ? fmt(income  / incomeCount,  currency) : '—' },
    { label: 'Ticket promedio egreso',  value: expenseCount > 0 ? fmt(expense / expenseCount, currency) : '—' },
    { label: 'Mayor ingreso del mes',   value: topIncome  ? fmt(topIncome.amount,  currency) : '—' },
    { label: 'Mayor egreso del mes',    value: topExpense ? fmt(topExpense.amount, currency) : '—' },
  ], y)

  // 4. Evolución mensual
  if (monthly.length > 0) {
    if (y > 200) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Evolucion mensual — ultimos 6 meses', y + 4)
    autoTable(doc, {
      startY: y,
      head: [['Mes', 'Ingresos', 'Egresos', 'Neto', 'Var. MoM']],
      body: monthly.map((m, i) => {
        const inc = Number(m.income  || 0)
        const exp = Number(m.expense || 0)
        let mom = '—'
        if (i > 0) {
          const prev = Number(monthly[i - 1].income || 0)
          if (prev > 0) {
            const d = ((inc - prev) / prev) * 100
            mom = `${d >= 0 ? '+' : ''}${d.toFixed(1)}%`
          }
        }
        return [fmtMonth(m.month), fmt(inc, currency), fmt(exp, currency), fmt(inc - exp, currency), mom]
      }),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // 5. Análisis de tendencia
  if (monthly.length > 0) {
    if (y > 210) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Analisis de tendencia (6 meses)', y + 2)
    y = addKpis(doc, [
      { label: 'Ingreso promedio mensual', value: fmt(avgIncome,  currency) },
      { label: 'Egreso promedio mensual',  value: fmt(avgExpense, currency) },
      { label: 'Mejor mes (ingresos)',     value: bestIncMon  ? fmtMonth(bestIncMon.month)  : '—' },
      { label: 'Mayor egreso en mes',      value: worstExpMon ? fmtMonth(worstExpMon.month) : '—' },
      { label: 'Meses superavitarios',     value: `${surplusMonths} de ${monthly.length}` },
      { label: 'Tendencia de ingresos',    value: trend },
    ], y)
  }

  // 6. Egresos por categoría
  if (categories.length > 0) {
    if (y > 200) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Egresos por categoria', y + 4)
    autoTable(doc, {
      startY: y,
      head: [['Categoria', 'Monto', '% del egreso']],
      body: categories.map(c => [
        c.name,
        fmt(c.total, currency),
        expense ? `${((c.total / expense) * 100).toFixed(1)}%` : '—',
      ]),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // 7. Flujo de caja
  if (cashFlow.length > 0) {
    if (y > 200) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Flujo de caja del mes', y + 2)
    let running = saldoInit
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Descripcion', 'Cuenta', 'Ingreso', 'Egreso', 'Saldo']],
      body: cashFlow.map(m => {
        const amt   = Number(m.amount)
        const isInc = m.type === 'income'
        if (isInc) running += amt; else running -= amt
        return [
          new Date(m.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
          m.description || '—',
          m.account?.name ?? '—',
          isInc  ? fmt(amt, currency) : '',
          !isInc ? fmt(amt, currency) : '',
          fmt(running, currency),
        ]
      }),
      columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right', fontStyle: 'bold' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // 8. Cuentas por cobrar
  const cobrar = pending.filter(m => m.type === 'income')
  if (cobrar.length > 0) {
    if (y > 210) { doc.addPage(); y = 24 }
    y = addSection(doc, `Cuentas por cobrar (${cobrar.length})`, y + 2)
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Descripcion', 'Cliente', 'Categoria', 'Monto']],
      body: cobrar.map(m => [
        new Date(m.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        m.description || '—',
        m.client?.name   ?? '—',
        m.category?.name ?? '—',
        fmt(m.amount, currency),
      ]),
      columnStyles: { 4: { halign: 'right' } },
      foot: [[{ content: `Total a cobrar: ${fmt(cobrar.reduce((s, m) => s + Number(m.amount), 0), currency)}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }]],
      showFoot: 'lastPage',
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // 9. Cuentas por pagar
  const pagar = pending.filter(m => m.type === 'expense')
  if (pagar.length > 0) {
    if (y > 210) { doc.addPage(); y = 24 }
    y = addSection(doc, `Cuentas por pagar (${pagar.length})`, y + 2)
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Descripcion', 'Categoria', 'Cuenta', 'Monto']],
      body: pagar.map(m => [
        new Date(m.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        m.description || '—',
        m.category?.name ?? '—',
        m.account?.name  ?? '—',
        fmt(m.amount, currency),
      ]),
      columnStyles: { 4: { halign: 'right' } },
      foot: [[{ content: `Total a pagar: ${fmt(pagar.reduce((s, m) => s + Number(m.amount), 0), currency)}`, colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }]],
      showFoot: 'lastPage',
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 8
  }

  // 10. Mayores movimientos del mes
  if (topMovs.length > 0) {
    if (y > 210) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Mayores movimientos del mes (top 10)', y + 2)
    const TYPE = { income: 'Ingreso', expense: 'Egreso' }
    autoTable(doc, {
      startY: y,
      head: [['Descripcion', 'Tipo', 'Cuenta', 'Categoria', 'Monto']],
      body: topMovs.map(m => [
        m.description || '—',
        TYPE[m.type] ?? m.type,
        m.account?.name  ?? '—',
        m.category?.name ?? '—',
        fmt(m.amount, currency),
      ]),
      columnStyles: { 4: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY
  }

  return y
}

function drawQuotesContent(doc, y, { data, topClients, currency }) {
  const summary  = data?.summary         ?? {}
  const byStatus = data?.byStatus        ?? []
  const monthly  = data?.monthly         ?? []
  const reasons  = data?.rejectionReasons ?? []

  const totalCount    = summary.totalQuotes   || 0
  const approvedCount = summary.approvedCount || 0
  const sentCount     = summary.sentCount     || 0
  const rejectedCount = summary.rejectedCount || 0

  const approvalRate  = (sentCount + approvedCount) > 0
    ? `${((approvedCount / (sentCount + approvedCount)) * 100).toFixed(1)}%` : '—'
  const rejectionRate = totalCount > 0
    ? `${((rejectedCount / totalCount) * 100).toFixed(1)}%` : '—'

  y = addSection(doc, 'Resumen general', y)
  y = addKpis(doc, [
    { label: 'Total emitidos',          value: `${totalCount} presupuestos` },
    { label: 'Monto total',             value: fmt(summary.totalValue, currency) },
    { label: 'Tasa de aprobacion',      value: approvalRate },
    { label: 'Aprobados',               value: `${approvedCount} — ${fmt(summary.approved, currency)}` },
    { label: 'Rechazados',              value: `${rejectedCount} (${rejectionRate})` },
    { label: 'Enviados / Pendientes',   value: `${sentCount} en espera` },
  ], y)

  if (byStatus.length > 0) {
    y = addSection(doc, 'Distribucion por estado', y + 4)
    autoTable(doc, {
      startY: y,
      head: [['Estado', 'Cant.', 'Monto', '% del total']],
      body: [...byStatus]
        .sort((a, b) => b.count - a.count)
        .map(s => [
          QUOTE_STATUS_LABELS[s.status] ?? s.status,
          String(s.count),
          fmt(s.total, currency),
          totalCount ? `${((s.count / totalCount) * 100).toFixed(1)}%` : '—',
        ]),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 8
  }

  if (reasons.length > 0) {
    if (y > 210) { doc.addPage(); y = 24 }
    y = addSection(doc, `Causas de rechazo (${rejectedCount} rechazados)`, y + 2)
    autoTable(doc, {
      startY: y,
      head: [['Motivo de rechazo', 'Cantidad', '% del total rechazado']],
      body: reasons.map(r => [
        r.reason,
        String(r.count),
        rejectedCount ? `${((r.count / rejectedCount) * 100).toFixed(1)}%` : '—',
      ]),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 8
  }

  const monthlyWithData = monthly.filter(m => m.issuedCount > 0)
  if (monthlyWithData.length > 0) {
    if (y > 200) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Evolucion mensual — ultimos 12 meses', y + 2)
    autoTable(doc, {
      startY: y,
      head: [['Mes', 'Emitidos', 'Aprobados', 'Rechazados', '% Aprobacion']],
      body: monthly.map(m => {
        const issued   = m.issuedCount   || 0
        const approved = m.approvedCount || 0
        const rejected = m.rejectedCount || 0
        const pct      = issued > 0 ? `${((approved / issued) * 100).toFixed(0)}%` : '—'
        return [fmtMonth(m.key), String(issued), String(approved), String(rejected), pct]
      }),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 8
  }

  if (data?.expiringSoon?.length > 0) {
    if (y > 210) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Proximos a vencer (7 dias)', y + 2)
    autoTable(doc, {
      startY: y,
      head: [['#', 'Titulo', 'Cliente', 'Vence', 'Monto']],
      body: data.expiringSoon.map(q => [
        `#${q.number}`,
        q.title || '—',
        q.client?.name ?? '—',
        new Date(q.validUntil).toLocaleDateString('es-AR'),
        fmt(q.total, currency),
      ]),
      columnStyles: { 4: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 8
  }

  if (topClients?.length > 0) {
    if (y > 210) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Top clientes por volumen aprobado', y + 2)
    autoTable(doc, {
      startY: y,
      head: [['#', 'Cliente', 'Empresa', 'Total aprobado']],
      body: topClients.map((entry, i) => [
        `#${i + 1}`,
        entry.client.name,
        entry.client.company || '—',
        fmt(entry.total, currency),
      ]),
      columnStyles: { 3: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY
  }

  return y
}

function drawProjectsContent(doc, y, { data }) {
  const byStatus   = data?.byStatus ?? []
  const total      = Number(data?.summary?.totalProjects ?? 0)
  const inProgress = byStatus.find(s => s._id === 'in_progress')?.totalProjects ?? 0
  const finished   = byStatus.find(s => s._id === 'finished')?.totalProjects   ?? 0
  const pending    = byStatus.find(s => s._id === 'pending')?.totalProjects    ?? 0
  const cancelled  = byStatus.find(s => s._id === 'cancelled')?.totalProjects  ?? 0

  y = addSection(doc, 'Resumen general', y)
  y = addKpis(doc, [
    { label: 'Total proyectos', value: String(total) },
    { label: 'En curso',        value: String(inProgress) },
    { label: 'Finalizados',     value: String(finished) },
    { label: 'Pendientes',      value: String(pending) },
    { label: 'Cancelados',      value: String(cancelled) },
  ], y)

  if (byStatus.length > 0) {
    y = addSection(doc, 'Distribucion por estado', y + 4)
    autoTable(doc, {
      startY: y,
      head: [['Estado', 'Cantidad', '%']],
      body: byStatus.map(s => [
        PROJECT_STATUS_LABELS[s._id] ?? s._id,
        String(s.totalProjects),
        total ? `${((s.totalProjects / total) * 100).toFixed(1)}%` : '—',
      ]),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 10
  }

  if (data?.upcomingProjects?.length > 0) {
    if (y > 220) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Proyectos proximos a vencer', y + 2)
    autoTable(doc, {
      startY: y,
      head: [['Proyecto', 'Cliente', 'Vencimiento']],
      body: data.upcomingProjects.map(p => [
        p.title,
        p.client?.name ?? '—',
        new Date(p.endDate).toLocaleDateString('es-AR'),
      ]),
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY
  }

  return y
}

function drawStockContent(doc, y, { summary, outOfStock, lowStock }) {
  y = addSection(doc, 'Resumen del inventario', y)
  y = addKpis(doc, [
    { label: 'Total productos',   value: String(summary?.totalProducts  ?? 0) },
    { label: 'Productos activos', value: String(summary?.activeProducts ?? 0) },
    { label: 'Sin stock',         value: String(summary?.outOfStock     ?? 0) },
    { label: 'Stock bajo',        value: String(summary?.lowStock       ?? 0) },
  ], y)

  if (outOfStock?.length > 0) {
    y = addSection(doc, 'Productos sin stock', y + 4)
    autoTable(doc, {
      startY: y,
      head: [['SKU', 'Producto', 'Categoria', 'Stock']],
      body: outOfStock.map(p => [p.sku, p.name, p.category?.name ?? '—', `${p.stock} ${p.unit}`]),
      columnStyles: { 3: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 10
  }

  if (lowStock?.length > 0) {
    if (y > 220) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Productos con stock bajo', y + 2)
    autoTable(doc, {
      startY: y,
      head: [['SKU', 'Producto', 'Stock actual', 'Stock minimo']],
      body: lowStock.map(p => [p.sku, p.name, `${p.stock} ${p.unit}`, `${p.minStock} ${p.unit}`]),
      columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY
  }

  return y
}

// ── exports ───────────────────────────────────────────────────────────────────

export function generateFinancesPDF({ data, year, month, currency, orgName, userName = 'Administrador' }) {
  const doc = new jsPDF()
  addCoverPage(doc, orgName, userName, year, month)
  doc.addPage()
  const y = addHeader(doc, orgName, 'Reporte de Finanzas', `Periodo: ${periodLabel(year, month)}`)
  drawFinancesContent(doc, y, { data, year, month, currency })
  addFooter(doc, orgName, { hasCover: true })
  doc.save(`finanzas-${year}-${String(month).padStart(2, '0')}.pdf`)
}

export function generateQuotesPDF({ data, topClients, currency, orgName }) {
  const doc = new jsPDF()
  const y = addHeader(doc, orgName, 'Reporte de Presupuestos', `Generado: ${nowLabel()}`)
  drawQuotesContent(doc, y, { data, topClients, currency })
  addFooter(doc, orgName)
  doc.save(`presupuestos-${new Date().getFullYear()}.pdf`)
}

export function generateProjectsPDF({ data, orgName }) {
  const doc = new jsPDF()
  const y = addHeader(doc, orgName, 'Reporte de Proyectos', `Generado: ${nowLabel()}`)
  drawProjectsContent(doc, y, { data })
  addFooter(doc, orgName)
  doc.save(`proyectos-${new Date().getFullYear()}.pdf`)
}

export function generateStockPDF({ summary, outOfStock, lowStock, orgName }) {
  const doc = new jsPDF()
  const y = addHeader(doc, orgName, 'Reporte de Stock', `Generado: ${nowLabel()}`)
  drawStockContent(doc, y, { summary, outOfStock, lowStock })
  addFooter(doc, orgName)
  doc.save(`stock-${new Date().getFullYear()}.pdf`)
}

export function generateFullReportPDF({
  finData, quotesData, topClients, projectsData,
  stockSummary, outOfStock, lowStock,
  year, month, currency, orgName, userName = 'Administrador',
}) {
  const doc = new jsPDF()

  // Portada general
  addCoverPage(doc, orgName, userName, year, month, true)

  // ── Sección 1: Finanzas ──
  doc.addPage()
  let y = addHeader(doc, orgName, 'Finanzas', `Periodo: ${periodLabel(year, month)}`)
  drawFinancesContent(doc, y, { data: finData, year, month, currency })

  // ── Sección 2: Presupuestos ──
  doc.addPage()
  y = addHeader(doc, orgName, 'Presupuestos', `Generado: ${nowLabel()}`)
  drawQuotesContent(doc, y, { data: quotesData, topClients, currency })

  // ── Sección 3: Proyectos ──
  doc.addPage()
  y = addHeader(doc, orgName, 'Proyectos', `Generado: ${nowLabel()}`)
  drawProjectsContent(doc, y, { data: projectsData })

  // ── Sección 4: Stock ──
  doc.addPage()
  y = addHeader(doc, orgName, 'Stock e Inventario', `Generado: ${nowLabel()}`)
  drawStockContent(doc, y, { summary: stockSummary, outOfStock, lowStock })

  addFooter(doc, orgName, { hasCover: true })
  doc.save(`informe-completo-${year}-${String(month).padStart(2, '0')}.pdf`)
}
