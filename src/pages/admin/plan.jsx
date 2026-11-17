/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateOrganizationPlan } from '../../api/admin'
import { useToast } from '../../components/Toast'
import { C, ReasonModal, PLAN_STYLE, apiError } from './ui'

/* Selector y cambio de plan de una empresa (lo usan la lista y el detalle de Empresas). */

const PLANS = Object.keys(PLAN_STYLE)

export function PlanSelect({ org, onChange, disabled }) {
  const st = PLAN_STYLE[org.plan] || PLAN_STYLE.free
  return (
    <select value={org.plan} disabled={disabled} onChange={e => onChange(org, e.target.value)} title="Cambiar plan"
      style={{ appearance: 'none', padding: '3px 10px', borderRadius: '0 6px 6px 0', border: `1px solid ${C.linea}`, background: st.bg, color: st.color, fontSize: 11, fontWeight: 600, fontFamily: 'inherit', cursor: disabled ? 'wait' : 'pointer' }}>
      {PLANS.map(p => <option key={p} value={p} style={{ background: C.s2, color: C.crema }}>{PLAN_STYLE[p].label}</option>)}
    </select>
  )
}

// Cambio de plan con confirmación (lo usan la lista y el detalle)
export function usePlanChange(invalidateKeys) {
  const qc = useQueryClient()
  const toast = useToast()
  const [pending, setPending] = useState(null)
  const mutation = useMutation({
    mutationFn: ({ id, plan }) => updateOrganizationPlan(id, plan),
    onSuccess: (_, { name, plan }) => {
      toast(`${name}: plan ${PLAN_STYLE[plan].label}`, 'success')
      invalidateKeys.forEach(k => qc.invalidateQueries({ queryKey: k }))
      setPending(null)
    },
    onError: err => toast(apiError(err, 'No se pudo cambiar el plan'), 'error'),
  })
  const request = (org, plan) => { if (plan !== org.plan) setPending({ org, plan }) }
  const modal = pending && (
    <ReasonModal title="Cambiar plan"
      message={`¿Cambiar el plan de ${pending.org.name} de ${PLAN_STYLE[pending.org.plan].label} a ${PLAN_STYLE[pending.plan].label}? Hoy el plan no habilita ni limita funciones; queda registrado en la auditoría.`}
      confirmLabel="Cambiar plan" busy={mutation.isPending}
      onClose={() => setPending(null)}
      onConfirm={() => mutation.mutate({ id: pending.org.id, plan: pending.plan, name: pending.org.name })} />
  )
  return { request, modal, busyId: mutation.isPending ? mutation.variables?.id : null }
}

