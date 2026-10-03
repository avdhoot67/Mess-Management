import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'

const AuthRecoveryLayout = ({ icon: Icon, title, description, status, securityNote = 'Reset links expire after 30 minutes and stop working immediately after use.', children }) => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="absolute -left-28 top-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-24 bottom-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: 'easeOut' }}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8"
      >
        {status && <p role="status" aria-live="polite" className="sr-only">{status}</p>}
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600">
          <ArrowLeft size={17} />
          Back to login
        </Link>

        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon size={23} />
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-[-0.025em] text-slate-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>

        <div className="mt-7">{children}</div>

        <div className="mt-7 flex items-start gap-2.5 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
          <ShieldCheck className="mt-0.5 shrink-0 text-slate-400" size={16} />
          {securityNote}
        </div>
      </motion.section>
    </main>
  )
}

export default AuthRecoveryLayout
