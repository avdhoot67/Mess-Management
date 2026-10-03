import { useState } from 'react'
import { Mail, MailCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import AuthRecoveryLayout from '../../components/auth/AuthRecoveryLayout'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to request a reset link right now')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <AuthRecoveryLayout icon={MailCheck} title="Check your inbox" description="If that email belongs to a password account, a reset link will arrive shortly.">
        <div role="status" className="surface-wash-cool rounded-xl border border-blue-100 p-4 text-sm leading-6 text-slate-700">
          For security, MessMate does not confirm whether an email is registered. If you created your account with Google, return to login and choose <strong>Continue with Google</strong>.
        </div>
        <Link to="/login" className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">Return to login</Link>
      </AuthRecoveryLayout>
    )
  }

  return (
    <AuthRecoveryLayout icon={Mail} title="Reset your password" description="Enter the email used for your MessMate password account. We’ll send a secure reset link if it matches an account.">
      {error && <div role="alert" className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
          <input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Sending securely…' : 'Send reset link'}
        </button>
      </form>
    </AuthRecoveryLayout>
  )
}

export default ForgotPassword
