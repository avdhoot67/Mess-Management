import { useEffect, useState } from 'react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Clock3, Mail, ShieldCheck, Trash2, UserPlus, UsersRound } from 'lucide-react'
import {
  getAdminAccess,
  inviteAdministrator,
  revokeAdministratorInvitation,
} from '../../services/adminInvitationService'
import { formatDate } from '../../utils/dateUtils'

const AdminTeam = () => {
  const [administrators, setAdministrators] = useState([])
  const [invitations, setInvitations] = useState([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [revoking, setRevoking] = useState(null)
  const [revokeLoading, setRevokeLoading] = useState(false)
  const [revokeError, setRevokeError] = useState('')
  const shouldReduceMotion = useReducedMotion()

  const loadAccess = async () => {
    const response = await getAdminAccess()
    setAdministrators(response.administrators || [])
    setInvitations(response.invitations || [])
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        await loadAccess()
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load team access')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleInvite = async (event) => {
    event.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      setSuccess('')
      const response = await inviteAdministrator(email.trim())
      setEmail('')
      setSuccess(response.message || 'Administrator invitation sent')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send this invitation')
      return
    } finally {
      setSubmitting(false)
    }

    try {
      await loadAccess()
    } catch {
      setError('Invitation sent, but the team list could not refresh. Reload the page to see its latest state.')
    }
  }

  const handleRevoke = async () => {
    if (!revoking) return
    try {
      setRevokeLoading(true)
      setRevokeError('')
      await revokeAdministratorInvitation(revoking.invitation_id)
      setRevoking(null)
      setSuccess('Invitation revoked')
    } catch (requestError) {
      setRevokeError(requestError.response?.data?.message || 'Unable to revoke this invitation')
      return
    } finally {
      setRevokeLoading(false)
    }

    try {
      await loadAccess()
    } catch {
      setError('Invitation revoked, but the team list could not refresh. Reload the page to see its latest state.')
    }
  }

  if (loading) {
    return <div className="space-y-6" role="status" aria-label="Loading team access"><div className="h-20 animate-pulse rounded-2xl bg-slate-200/70" /><div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"><div className="h-64 animate-pulse rounded-2xl bg-white" /><div className="h-64 animate-pulse rounded-2xl bg-white" /></div></div>
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 sm:text-3xl">Team &amp; access</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Invite trusted administrators without creating accounts directly in the database.</p>
      </header>

      {error && <div role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
      {success && <div role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="surface-wash-warm rounded-2xl border border-slate-200 p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800"><UserPlus size={21} /></div>
            <div>
              <h2 className="font-semibold text-slate-950">Invite an administrator</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">The recipient gets a single-use link that expires after 48 hours.</p>
            </div>
          </div>
          <form onSubmit={handleInvite} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold text-slate-700">Administrator email</label>
              <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={100} required placeholder="admin@example.com" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm" />
            </div>
            <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
              <Mail size={17} /> {submitting ? 'Sending invitation…' : 'Send invitation'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm sm:p-6">
          <ShieldCheck className="text-emerald-300" size={24} />
          <h2 className="mt-4 text-lg font-semibold">Invitation-only access</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Public registration always creates a student. A new administrator must receive this email, use the matching invitation, and create a fresh account.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800 pt-5">
            <div><p className="text-2xl font-bold tabular-nums">{administrators.length}</p><p className="mt-1 text-xs text-slate-400">Active administrators</p></div>
            <div><p className="text-2xl font-bold tabular-nums">{invitations.length}</p><p className="mt-1 text-xs text-slate-400">Pending invitations</p></div>
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2"><UsersRound className="text-slate-500" size={20} /><h2 className="font-semibold text-slate-950">Current administrators</h2></div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Administrator</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Access</th></tr></thead>
            <tbody>
              {administrators.map((administrator) => (
                <tr key={administrator.user_id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3"><p className="font-semibold text-slate-900">{administrator.name}</p><p className="text-xs text-slate-500">{administrator.email}</p></td>
                  <td className="px-4 py-3 text-slate-600">{administrator.phone || 'Not provided'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(administrator.created_at?.slice(0, 10))}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Administrator</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2"><Clock3 className="text-slate-500" size={20} /><h2 className="font-semibold text-slate-950">Pending invitations</h2></div>
        {invitations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Mail className="mx-auto text-slate-400" size={25} /><p className="mt-3 font-semibold text-slate-900">No pending invitations</p><p className="mt-1 text-sm text-slate-500">New invitations will appear here until they are accepted, revoked, or expire.</p></div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Invited email</th><th className="px-4 py-3">Invited by</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {invitations.map((invitation) => (
                    <motion.tr key={invitation.invitation_id} layout initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: shouldReduceMotion ? 0 : 0.16 }} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3 font-semibold text-slate-900">{invitation.email}</td>
                      <td className="px-4 py-3 text-slate-600">{invitation.invited_by_name}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(invitation.expires_at?.slice(0, 10))}</td>
                      <td className="px-4 py-3 text-right"><button type="button" onClick={() => { setRevokeError(''); setRevoking(invitation) }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"><Trash2 size={15} /> Revoke</button></td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {revoking && (
        <AlertDialog.Root open onOpenChange={(open) => { if (!open && !revokeLoading) { setRevoking(null); setRevokeError('') } }}>
          <AlertDialog.Portal>
            <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/45" />
            <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <AlertDialog.Popup className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl outline-none">
                <Trash2 className="text-rose-600" size={23} />
                <AlertDialog.Title className="mt-3 text-lg font-bold text-slate-950">Revoke this invitation?</AlertDialog.Title>
                <AlertDialog.Description className="mt-2 text-sm leading-6 text-slate-600">The link sent to {revoking.email} will stop working immediately. You can send a new invitation later.</AlertDialog.Description>
                {revokeError && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{revokeError}</p>}
                <div className="mt-5 flex gap-3">
                  <AlertDialog.Close disabled={revokeLoading} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Keep invitation</AlertDialog.Close>
                  <button type="button" onClick={handleRevoke} disabled={revokeLoading} className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{revokeLoading ? 'Revoking…' : 'Revoke invitation'}</button>
                </div>
              </AlertDialog.Popup>
            </AlertDialog.Viewport>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )}
    </div>
  )
}

export default AdminTeam
