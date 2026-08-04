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

// ── helpers ───────────────────────────────────────────────────────────────────
function periodLabel(year, month) {
  return new Date(year, month - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function nowLabel() {
  return new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
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
    styles:               { fontSize: 8, cellPadding: 3, textColor: C.dark, lineColor: C.line, lineWidth: 0.1 },
    headStyles:           { fillColor: C.brand, textColor: C.white, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles:   { fillColor: C.bg },
    margin:               { left: 14, right: 14 },
  }
}

function addFooter(doc, orgName) {
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setTextColor(...C.muted)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`${orgName} — SOFIAPP CRM`, 14, 290)
    doc.text(`${i} / ${total}`, 196, 290, { align: 'right' })
  }
}

// ── Finanzas ──────────────────────────────────────────────────────────────────
export function generateFinancesPDF({ data, year, month, currency, orgName }) {
  const doc = new jsPDF()
  let y = addHeader(doc, orgName, 'Reporte de Finanzas', `Periodo: ${periodLabel(year, month)}`)

  const income  = Number(data?.incomeMonth  ?? 0)
  const expense = Number(data?.expenseMonth ?? 0)

  y = addSection(doc, 'Resumen del periodo', y)
  y = addKpis(doc, [
    { label: 'Saldo disponible',     value: fmt(data?.totalBalance,  currency) },
    { label: 'Ingresos del mes',     value: fmt(income,              currency) },
    { label: 'Egresos del mes',      value: fmt(expense,             currency) },
    { label: 'Balance neto',         value: fmt(income - expense,    currency) },
    { label: 'A cobrar (pendiente)', value: fmt(data?.pendingIncome, currency) },
    { label: 'A pagar (pendiente)',  value: fmt(data?.pendingExpense,currency) },
  ], y)

  if (data?.categoryBreakdown?.length > 0) {
    y = addSection(doc, 'Egresos por categoria', y + 4)
    autoTable(doc, {
      startY: y,
      head:   [['Categoria', 'Total', '%']],
      body:   data.categoryBreakdown.map(c => [
        c.name,
        fmt(c.total, currency),
        expense ? `${((c.total / expense) * 100).toFixed(1)}%` : '—',
      ]),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 10
  }

  if (data?.recentMovements?.length > 0) {
    if (y > 220) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Ultimos movimientos', y + 2)
    const TYPE   = { income: 'Ingreso', expense: 'Egreso', transfer_out: 'Transf. salida', transfer_in: 'Transf. entrada', adjustment: 'Ajuste' }
    const STATUS = { confirmed: 'Confirmado', pending: 'Pendiente', annulled: 'Anulado' }
    autoTable(doc, {
      startY: y,
      head:   [['Fecha', 'Descripcion', 'Tipo', 'Estado', 'Monto']],
      body:   data.recentMovements.map(m => [
        new Date(m.date).toLocaleDateString('es-AR'),
        m.description || '—',
        TYPE[m.type]     ?? m.type,
        STATUS[m.status] ?? m.status,
        fmt(m.amount, currency),
      ]),
      columnStyles: { 4: { halign: 'right' } },
      ...tableStyle(),
    })
  }

  addFooter(doc, orgName)
  doc.save(`finanzas-${year}-${String(month).padStart(2, '0')}.pdf`)
}

// ── Presupuestos ──────────────────────────────────────────────────────────────
export function generateQuotesPDF({ data, topClients, currency, orgName }) {
  const doc = new jsPDF()
  let y = addHeader(doc, orgName, 'Reporte de Presupuestos', `Generado: ${nowLabel()}`)

  const summary  = data?.summary ?? {}
  const approved = Number(summary.approved  ?? 0)
  const sent     = Number(summary.sent      ?? 0)
  const draft    = Number(summary.draft     ?? 0)
  const rejected = Number(summary.rejected  ?? 0)
  const total    = approved + sent + draft + rejected
  const convRate = sent + approved > 0 ? `${((approved / (sent + approved)) * 100).toFixed(1)}%` : '0%'

  y = addSection(doc, 'Resumen general', y)
  y = addKpis(doc, [
    { label: 'Total presupuestado', value: fmt(summary.totalValue, currency) },
    { label: 'Aprobados',           value: fmt(approved, currency) },
    { label: 'Enviados',            value: fmt(sent, currency) },
    { label: 'Borradores',          value: String(draft) },
    { label: 'Rechazados',          value: String(rejected) },
    { label: 'Tasa de conversion',  value: convRate },
  ], y)

  if (total > 0) {
    y = addSection(doc, 'Distribucion por estado', y + 4)
    autoTable(doc, {
      startY: y,
      head: [['Estado', 'Cantidad', '%']],
      body: [
        ['Aprobados',   String(approved), total ? `${((approved / total) * 100).toFixed(1)}%` : '0%'],
        ['Enviados',    String(sent),     total ? `${((sent     / total) * 100).toFixed(1)}%` : '0%'],
        ['Borradores',  String(draft),    total ? `${((draft    / total) * 100).toFixed(1)}%` : '0%'],
        ['Rechazados',  String(rejected), total ? `${((rejected / total) * 100).toFixed(1)}%` : '0%'],
      ],
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      ...tableStyle(),
    })
    y = doc.lastAutoTable.finalY + 10
  }

  if (topClients?.length > 0) {
    if (y > 220) { doc.addPage(); y = 24 }
    y = addSection(doc, 'Top clientes por volumen', y + 2)
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
  }

  addFooter(doc, orgName)
  doc.save(`presupuestos-${new Date().getFullYear()}.pdf`)
}

// ── Proyectos ─────────────────────────────────────────────────────────────────
const STATUS_LABELS = {
  pending:     'Pendiente',
  approved:    'Aprobado',
  in_progress: 'En curso',
  finished:    'Finalizado',
  cancelled:   'Cancelado',
}

export function generateProjectsPDF({ data, orgName }) {
  const doc = new jsPDF()
  let y = addHeader(doc, orgName, 'Reporte de Proyectos', `Generado: ${nowLabel()}`)

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
        STATUS_LABELS[s._id] ?? s._id,
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
  }

  addFooter(doc, orgName)
  doc.save(`proyectos-${new Date().getFullYear()}.pdf`)
}

// ── Stock ─────────────────────────────────────────────────────────────────────
export function generateStockPDF({ summary, outOfStock, lowStock, orgName }) {
  const doc = new jsPDF()
  let y = addHeader(doc, orgName, 'Reporte de Stock', `Generado: ${nowLabel()}`)

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
  }

  addFooter(doc, orgName)
  doc.save(`stock-${new Date().getFullYear()}.pdf`)
}
