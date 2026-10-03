import { useEffect, useState } from 'react'
import { CheckCircle2, KeyRound } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import AuthRecoveryLayout from '../../components/auth/AuthRecoveryLayout'
import PasswordInput from '../../components/auth/PasswordInput'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const [token] = useState(() => searchParams.get('token') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (token) window.history.replaceState({}, '', '/reset-password')
  }, [token])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setCompleted(true)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset your password right now')
    } finally {
      setLoading(false)
    }
  }

  if (completed) {
    return (
      <AuthRecoveryLayout icon={CheckCircle2} title="Password updated" description="Your new password is ready. You can now return to MessMate and sign in." status="Password updated successfully">
        <Link to="/login" className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Continue to login</Link>
      </AuthRecoveryLayout>
    )
  }

  return (
    <AuthRecoveryLayout icon={KeyRound} title="Choose a new password" description="Use at least 8 characters. After saving, this reset link cannot be used again.">
      {!token && <div role="alert" className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">This reset link is incomplete. Request a new link from the forgot-password page.</div>}
      {error && <div role="alert" className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">New password</label>
          <PasswordInput id="new-password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!token} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100" />
        </div>
        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</label>
          <PasswordInput id="confirm-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required disabled={!token} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100" />
        </div>
        <button type="submit" disabled={!token || loading} className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Updating password…' : 'Save new password'}
        </button>
      </form>
      {!token && <Link to="/forgot-password" className="mt-4 inline-flex w-full justify-center text-sm font-semibold text-emerald-700 hover:text-emerald-800">Request another reset link</Link>}
    </AuthRecoveryLayout>
  )
}

export default ResetPassword
