import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPendingInvitations, acceptInvitation, declineInvitation } from '../api/invitations'

function DeclineModal({ orgName, onConfirm, onCancel, isPending }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface rounded-xl border border-line shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-base font-semibold text-fg mb-2">¿Rechazar invitación?</h3>
        <p className="text-sm text-fg-soft mb-6">
          Vas a rechazar la invitación de <span className="font-semibold text-fg">{orgName}</span>. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md border border-line text-fg-soft hover:bg-raised disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm rounded-md bg-danger text-white hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Rechazando...' : 'Sí, rechazar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InvitationsBanner() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmingId, setConfirmingId] = useState(null)

  const { data: invitations } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => getPendingInvitations().then(r => r.data.data),
  })

  const accept = useMutation({
    mutationFn: acceptInvitation,
    onSuccess: (res) => {
      login(res.data.data.token)
      qc.clear()
      navigate('/')
    }
  })

  const decline = useMutation({
    mutationFn: declineInvitation,
    onSuccess: () => {
      setConfirmingId(null)
      qc.invalidateQueries(['invitations'])
    }
  })

  if (!invitations?.length) return null

  const confirmingInv = invitations.find(inv => inv.membershipId === confirmingId)

  return (
    <>
      <div className="space-y-2 px-4 md:px-6 pt-3">
        {invitations.map(inv => (
          <div
            key={inv.membershipId}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-brand-subtle border border-brand rounded-lg px-4 py-3"
          >
            <p className="text-sm text-fg">
              <span className="font-semibold">{inv.organization.name}</span>
              {' '}te invitó a unirte como{' '}
              <span className="font-medium">{inv.role === 'member' ? 'Miembro' : 'Admin'}</span>.
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setConfirmingId(inv.membershipId)}
                disabled={accept.isPending}
                className="px-3 py-1.5 text-xs rounded-md border border-line text-fg-soft hover:bg-raised disabled:opacity-50 transition-colors"
              >
                Rechazar
              </button>
              <button
                onClick={() => accept.mutate(inv.membershipId)}
                disabled={accept.isPending || decline.isPending}
                className="px-3 py-1.5 text-xs rounded-md bg-brand text-white hover:bg-brand-hover disabled:opacity-50 transition-colors"
              >
                {accept.isPending ? 'Aceptando...' : 'Aceptar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmingInv && (
        <DeclineModal
          orgName={confirmingInv.organization.name}
          onConfirm={() => decline.mutate(confirmingId)}
          onCancel={() => setConfirmingId(null)}
          isPending={decline.isPending}
        />
      )}
    </>
  )
}
