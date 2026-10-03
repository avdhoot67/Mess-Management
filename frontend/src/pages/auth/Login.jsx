import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarCheck2, ShieldCheck } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import GoogleMark from '../../components/auth/GoogleMark'
import PasswordInput from '../../components/auth/PasswordInput'
import { API_BASE_URL } from '../../services/api'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const shouldReduceMotion = useReducedMotion()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const data = await login(formData.email, formData.password)

      if (data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/student')
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
        error.message ||
        'Unable to login'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-[minmax(22rem,0.9fr)_minmax(30rem,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative text-xl font-bold">Mess<span className="text-emerald-400">Mate</span></div>
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative my-auto max-w-lg"
        >
          <h1 className="text-4xl font-bold tracking-[-0.03em]">Your mess day, clear at a glance.</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-300">Subscriptions, meals, bookings, skips, and payments stay connected in one operational workspace.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <CalendarCheck2 size={20} className="text-emerald-300" />
              <span className="text-sm font-medium text-slate-200">See what happens next</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <ShieldCheck size={20} className="text-emerald-300" />
              <span className="text-sm font-medium text-slate-200">Secure account access</span>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="mb-7">
            <p className="mb-5 text-lg font-bold text-slate-950 lg:hidden">Mess<span className="text-emerald-600">Mate</span></p>
            <h2 className="text-3xl font-bold tracking-[-0.02em] text-slate-950">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Sign in to continue to your MessMate workspace.</p>
          </div>

          <a
            href={`${API_BASE_URL}/auth/google`}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <GoogleMark />
            Continue with Google
          </a>

          <div className="my-6 flex items-center gap-3 text-xs font-medium text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or use email</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

        {error && (
          <div role="alert" className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800">Forgot password?</Link>
            </div>

            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Register
          </Link>
        </p>
        </div>
      </section>
    </main>
  )
}

export default Login
