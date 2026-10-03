import { useEffect, useState } from 'react'
import { CheckCircle2, Link2, Mail, Phone, ShieldCheck } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import api from '../../services/api'
import GoogleMark from '../../components/auth/GoogleMark'
import { useAuth } from '../../context/AuthContext'

const AccountSettings = () => {
  const { updateUser } = useAuth()
  const shouldReduceMotion = useReducedMotion()
  const [account, setAccount] = useState(null)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [message, setMessage] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const response = await api.get('/auth/account')
        setAccount(response.data.account)
        setPhone(response.data.account.phone || '')
      } catch (error) {
        setLoadError(error.response?.data?.message || 'Unable to load account settings')
      } finally {
        setLoading(false)
      }
    }

    loadAccount()
  }, [loadAttempt])

  const retryLoad = () => {
    setLoading(true)
    setLoadError('')
    setMessage(null)
    setLoadAttempt((attempt) => attempt + 1)
  }

  const savePhone = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const response = await api.patch('/auth/account/phone', { phone })
      setPhone(response.data.phone || '')
      setAccount((current) => ({ ...current, phone: response.data.phone }))
      updateUser({ phone: response.data.phone })
      setMessage({ type: 'success', text: response.data.message })
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to update phone number' })
    } finally {
      setSaving(false)
    }
  }

  const linkGoogle = async () => {
    setLinking(true)
    setMessage(null)

    try {
      const response = await api.post('/auth/google/link', {}, { withCredentials: true })
      window.location.assign(response.data.authorization_url)
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Unable to start Google linking' })
      setLinking(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-slate-950">Account settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage how MessMate can contact you and the sign-in methods connected to your account.</p>
      </header>

      {message && (
        <div role="status" className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
          {message.text}
        </div>
      )}

      {!loading && loadError && !account ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold text-slate-950">Account details could not be loaded</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{loadError}. Your settings have not been changed. Check the connection and try again.</p>
          <button type="button" onClick={retryLoad} className="mt-5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Try again
          </button>
        </section>
      ) : (

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="surface-wash-warm rounded-2xl p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700"><Phone size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Contact phone</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{account?.phone_optional ? 'Optional for this Google-created account.' : 'Required for password accounts.'} This number is stored for account and service contact.</p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 h-24 animate-pulse rounded-xl bg-slate-100" />
          ) : (
            <form onSubmit={savePhone} className="mt-6">
              <label htmlFor="account-phone" className="mb-2 block text-sm font-semibold text-slate-700">Phone number</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="account-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  inputMode="tel"
                  required={!account?.phone_optional}
                  placeholder="e.g. 9876543210"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
                <button disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save number'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Phone verification by SMS is not enabled yet, so this number is shown as unverified.</p>
            </form>
          )}
        </section>

        <motion.aside
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2.5 text-emerald-300"><ShieldCheck size={20} /></div>
            <h2 className="font-bold">Account identity</h2>
          </div>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex gap-3 text-slate-300"><Mail className="mt-0.5 shrink-0" size={17} /><span className="break-all">{account?.email || 'Loading…'}</span></div>
            <div className="flex gap-3 text-slate-300"><Link2 className="mt-0.5 shrink-0" size={17} /><span>{account?.google_linked ? 'Google connected' : 'Google not connected'}</span></div>
          </div>
          <button
            type="button"
            onClick={linkGoogle}
            disabled={loading || linking || account?.google_linked}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {account?.google_linked ? <CheckCircle2 size={18} className="text-emerald-600" /> : <GoogleMark />}
            {account?.google_linked ? 'Google connected' : linking ? 'Opening Google…' : 'Link Google account'}
          </button>
        </motion.aside>
      </div>
      )}
    </div>
  )
}

export default AccountSettings
