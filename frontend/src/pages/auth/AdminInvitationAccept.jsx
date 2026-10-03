import { useEffect, useState } from 'react'
import { CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import AuthRecoveryLayout from '../../components/auth/AuthRecoveryLayout'
import PasswordInput from '../../components/auth/PasswordInput'
import {
  acceptAdministratorInvitation,
  validateAdministratorInvitation,
} from '../../services/adminInvitationService'

const fieldClassName = 'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:text-sm'
const invitationSecurityNote = 'Administrator invitations expire after 48 hours and stop working immediately after use.'

const AdminInvitationAccept = () => {
  const [searchParams] = useSearchParams()
  const [token] = useState(() => searchParams.get('token') || '')
  const [invitation, setInvitation] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', password: '', confirmPassword: '' })
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (token) window.history.replaceState({}, '', '/admin-invitation')

    const validate = async () => {
      if (!token) {
        setError('This invitation link is incomplete. Ask an administrator to send a new invitation.')
        setChecking(false)
        return
      }

      try {
        const response = await validateAdministratorInvitation(token)
        setInvitation(response.invitation)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'This invitation is no longer available')
      } finally {
        setChecking(false)
      }
    }

    validate()
  }, [token])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setSubmitting(true)
      await acceptAdministratorInvitation({
        token,
        name: form.name,
        phone: form.phone,
        password: form.password,
      })
      setCompleted(true)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create your administrator account')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return <AuthRecoveryLayout icon={LoaderCircle} title="Checking invitation" description="Confirming that this administrator invitation is still available." securityNote={invitationSecurityNote}><div role="status" className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600"><LoaderCircle className="animate-spin text-emerald-600" size={18} /> Checking secure link…</div></AuthRecoveryLayout>
  }

  if (completed) {
    return <AuthRecoveryLayout icon={CheckCircle2} title="Administrator account ready" description="Your account has been created with administrator access." status="Administrator account created successfully" securityNote={invitationSecurityNote}><Link to="/login" className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Continue to login</Link></AuthRecoveryLayout>
  }

  if (!invitation) {
    return <AuthRecoveryLayout icon={ShieldCheck} title="Invitation unavailable" description="This link cannot be used to create an administrator account." securityNote={invitationSecurityNote}><div role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error}</div><Link to="/login" className="mt-5 inline-flex w-full justify-center text-sm font-semibold text-emerald-700 hover:text-emerald-800">Return to login</Link></AuthRecoveryLayout>
  }

  return (
    <AuthRecoveryLayout icon={ShieldCheck} title="Create your admin account" description={`Complete the invitation for ${invitation.email}. This access is for trusted mess administrators.`} securityNote={invitationSecurityNote}>
      {error && <div role="alert" className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="admin-name" className="mb-1.5 block text-sm font-semibold text-slate-700">Full name</label><input id="admin-name" name="name" value={form.name} onChange={handleChange} autoComplete="name" maxLength={100} required className={fieldClassName} /></div>
        <div><label htmlFor="admin-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">Phone number</label><input id="admin-phone" name="phone" value={form.phone} onChange={handleChange} autoComplete="tel" inputMode="tel" required className={fieldClassName} /></div>
        <div><label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold text-slate-700">Password</label><PasswordInput id="admin-password" name="password" value={form.password} onChange={handleChange} autoComplete="new-password" minLength={8} required className={fieldClassName} /></div>
        <div><label htmlFor="admin-confirm-password" className="mb-1.5 block text-sm font-semibold text-slate-700">Confirm password</label><PasswordInput id="admin-confirm-password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" minLength={8} required className={fieldClassName} /></div>
        <button type="submit" disabled={submitting} className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Creating account…' : 'Create administrator account'}</button>
      </form>
    </AuthRecoveryLayout>
  )
}

export default AdminInvitationAccept
