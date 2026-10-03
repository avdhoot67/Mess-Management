import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const errorMessages = {
  cancelled: 'Google sign-in was cancelled. You can try again whenever you are ready.',
  account_exists: 'An account already uses this email. Sign in with your password, then link Google from Account settings.',
  google_account_in_use: 'That Google account is already connected to another MessMate account.',
  account_not_found: 'Your MessMate account could not be found. Please sign in again.',
  not_configured: 'Google sign-in is not available right now. Use your email and password instead.',
  verification_failed: 'Google could not verify this sign-in. Please try again.'
}

const GoogleAuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { completeLogin, user } = useAuth()
  const started = useRef(false)
  const errorCode = searchParams.get('error')
  const flow = searchParams.get('flow')
  const errorMessage = errorCode === 'cancelled' && flow === 'link'
    ? 'Google linking was cancelled. Your existing MessMate session is unchanged.'
    : errorMessages[errorCode] || 'Google sign-in could not be completed.'
  const [status, setStatus] = useState(() => errorCode
    ? { type: 'error', message: errorMessage }
    : { type: 'loading', message: 'Securing your MessMate session…' })

  useEffect(() => {
    if (started.current) return
    started.current = true

    if (errorCode) return

    const finishLogin = async () => {
      try {
        const response = await api.post('/auth/google/session', { code: searchParams.get('code') })
        completeLogin(response.data)
        setStatus({
          type: 'success',
          message: searchParams.get('linked') ? 'Google is now connected to your account.' : 'You are signed in.'
        })
        window.setTimeout(() => {
          const roleRoot = response.data.user.role === 'admin' ? '/admin' : '/student'
          navigate(flow === 'link' ? `${roleRoot}/account` : roleRoot, { replace: true })
        }, 500)
      } catch (error) {
        setStatus({
          type: 'error',
          message: error.response?.data?.message || 'Your sign-in session expired. Please try again.'
        })
      }
    }

    finishLogin()
  }, [completeLogin, errorCode, flow, navigate, searchParams])

  const StatusIcon = status.type === 'loading' ? LoaderCircle : status.type === 'success' ? CheckCircle2 : CircleAlert

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section role={status.type === 'error' ? 'alert' : 'status'} aria-live={status.type === 'error' ? 'assertive' : 'polite'} className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${status.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
          <StatusIcon className={status.type === 'loading' ? 'animate-spin' : ''} size={24} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          {status.type === 'loading'
            ? flow === 'link' ? 'Connecting Google' : 'Completing sign-in'
            : status.type === 'success'
              ? 'All set'
              : flow === 'link' ? 'Connection needs attention' : 'Sign-in needs attention'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{status.message}</p>
        {status.type === 'error' && (
          <Link to={flow === 'link' && user ? `/${user.role}/account` : '/login'} className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
            {flow === 'link' && user ? 'Return to account' : 'Return to login'}
          </Link>
        )}
      </section>
    </main>
  )
}

export default GoogleAuthCallback
