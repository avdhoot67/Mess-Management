import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  FileCheck2,
  House,
  MessageSquareText,
  NotebookTabs,
  ShieldCheck,
  SlidersHorizontal,
  Utensils,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const mealServices = [
  {
    type: 'Breakfast',
    time: '7:30 – 9:30',
    menu: 'Poha, banana and tea',
    state: 'Included in your plan',
    included: true,
  },
  {
    type: 'Lunch',
    time: '12:00 – 14:30',
    menu: 'Dal tadka, jeera rice and roti',
    state: 'Included in your plan',
    included: true,
  },
  {
    type: 'Dinner',
    time: '19:00 – 21:30',
    menu: 'Paneer masala, rice and roti',
    state: 'Included in your plan',
    included: true,
  },
]

const journey = [
  { icon: CreditCard, label: 'Subscription', state: 'Active', detail: 'Monthly plan · 24 days left' },
  { icon: Utensils, label: "Today’s meals", state: '3 included', detail: 'All meal types covered' },
  { icon: CalendarDays, label: 'Individual booking', state: 'Extra day booked', detail: 'Outside the plan duration' },
  { icon: CreditCard, label: 'Payment', state: 'Verified', detail: 'Reference and receipt saved' },
  { icon: MessageSquareText, label: 'Feedback', state: 'Next action', detail: 'Share after dinner service' },
]

const proofPoints = [
  { icon: CalendarDays, text: 'Live meal information and your plan' },
  { icon: SlidersHorizontal, text: 'Book, skip or add an individual meal' },
  { icon: CreditCard, text: 'Payments and entitlements stay in sync' },
  { icon: MessageSquareText, text: 'Feedback reaches the mess team' },
]

const operatingSequence = [
  {
    icon: NotebookTabs,
    title: 'Publish the daily service',
    audience: 'Mess team',
    description: 'The schedule begins with one trusted menu for breakfast, lunch and dinner. Students see the same service the team is operating.',
    action: 'Meal schedule published',
    detail: '3 services · Monday, 05 October',
  },
  {
    icon: ShieldCheck,
    title: 'Make coverage obvious',
    audience: 'Student',
    description: 'Subscription dates and skips remain visible beside the meal calendar, so students know what is included before taking action.',
    action: 'Monthly plan active',
    detail: '24 service days remaining',
  },
  {
    icon: SlidersHorizontal,
    title: 'Keep booking and skipping distinct',
    audience: 'Student',
    description: 'A subscription skip extends the plan. An individual booking is a separate paid meal. MessMate keeps both decisions clear instead of merging them.',
    action: 'Extra-day meal booked',
    detail: 'Subscription coverage stays unchanged',
  },
  {
    icon: FileCheck2,
    title: 'Verify before activating',
    audience: 'Mess team',
    description: 'Customer transaction references enter a review queue. Approval activates the correct subscription or confirms the individual booking.',
    action: 'Payment verified',
    detail: 'Reference and receipt retained',
  },
  {
    icon: MessageSquareText,
    title: 'Turn service into useful feedback',
    audience: 'Both sides',
    description: 'Eligible customers can respond after a meal, while the mess team sees ratings, written feedback and recurring themes together.',
    action: 'Feedback ready for review',
    detail: 'Operational learning closes the loop',
  },
]

const Home = () => {
  const { user, isAuthenticated } = useAuth()
  const workspacePath = user?.role === 'admin' ? '/admin' : '/student'
  const isReadOnlyDemo = import.meta.env.VITE_READ_ONLY_DEMO === 'true'
  const liveAppUrl = import.meta.env.VITE_LIVE_APP_URL || 'https://mess-management-ten-henna.vercel.app'

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950">
        <nav className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12" aria-label="Public navigation">
          <Link to="/" className="text-xl font-bold tracking-[-0.03em] text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 sm:text-2xl">
            Mess<span className="text-emerald-400">Mate</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#how-it-works" className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400">How it works</a>
            <a href="#mess-teams" className="transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400">For mess teams</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isReadOnlyDemo ? (
              <a href={`${liveAppUrl}/login`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                Open live app <ArrowRight size={16} aria-hidden="true" />
              </a>
            ) : isAuthenticated ? (
              <Link to={workspacePath} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                Open workspace <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-600 px-3 text-sm font-semibold text-white transition hover:border-slate-400 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:px-5">
                  Sign in
                </Link>
                <Link to="/register" className="hidden min-h-11 items-center justify-center rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:inline-flex">
                  Create student account
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {isReadOnlyDemo && (
        <div className="border-b border-emerald-400/20 bg-emerald-950 px-5 py-3 text-center text-sm text-emerald-100 sm:px-8">
          This cloud deployment is a read-only preview. Account actions are available in the live app.
        </div>
      )}

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-950/70 blur-3xl" aria-hidden="true" />
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1500px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-12 lg:py-14 xl:gap-16">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-balance text-5xl font-bold leading-[0.98] tracking-[-0.04em] text-white sm:text-6xl lg:text-[3.75rem] xl:text-[4rem]">
              Your mess,<br />
              <span className="text-emerald-400">in one clear system.</span>
            </h1>
            <p className="mt-7 max-w-[38rem] text-lg leading-8 text-slate-300 sm:text-xl">
              See what is served, what your subscription covers, what you booked or skipped, and what needs attention—without chasing separate records.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {isReadOnlyDemo ? (
                <>
                  <a href={`${liveAppUrl}/login`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                    Open live app <ArrowRight size={18} aria-hidden="true" />
                  </a>
                  <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-500 px-6 text-base font-semibold text-white transition hover:border-slate-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                    Explore the preview
                  </a>
                </>
              ) : isAuthenticated ? (
                <Link to={workspacePath} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                  Open your workspace <ArrowRight size={18} aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                    Create student account <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-500 px-6 text-base font-semibold text-white transition hover:border-slate-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                    Sign in
                  </Link>
                </>
              )}
            </div>

            <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-6 border-t border-white/10 pt-6 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {proofPoints.map(({ icon: Icon, text }) => (
                <div key={text} className="min-w-0 border-l border-white/15 pl-3 first:border-l-0 first:pl-0 sm:first:border-l sm:first:pl-3 lg:first:border-l-0 lg:first:pl-0 xl:first:border-l xl:first:pl-3">
                  <Icon size={18} className="text-slate-300" aria-hidden="true" />
                  <p className="mt-3 text-xs leading-5 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <IllustrativeWorkspace />
        </div>
      </section>

      <ConnectedOperationsStory />

      <section id="mess-teams" className="bg-slate-50 px-5 py-24 text-slate-950 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-12 border-b border-slate-200 pb-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <h2 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">
              Built for the relationship between a customer and a mess.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">
              MessMate does not treat every meal as a one-time order. It keeps recurring subscriptions, daily service, separate bookings, skips, verification and feedback in one operational record.
            </p>
          </div>

          <div className="grid lg:grid-cols-2">
            <article className="border-b border-slate-200 py-12 lg:border-b-0 lg:border-r lg:pr-14">
              <p className="text-sm font-semibold text-emerald-700">For students and regular customers</p>
              <h3 className="mt-4 text-3xl font-bold tracking-[-0.025em]">Know what applies today.</h3>
              <ul className="mt-8 space-y-5">
                {[
                  'See subscription duration, skipped days and the next useful action.',
                  'Review upcoming meals before booking or changing plans.',
                  'Keep individual paid bookings separate from subscription coverage.',
                  'Track verification status, receipts and eligible feedback in one place.',
                ].map((item) => <BenefitRow key={item}>{item}</BenefitRow>)}
              </ul>
            </article>

            <article className="py-12 lg:pl-14">
              <p className="text-sm font-semibold text-emerald-700">For mess teams</p>
              <h3 className="mt-4 text-3xl font-bold tracking-[-0.025em]">Operate from shared truth.</h3>
              <ul className="mt-8 space-y-5">
                {[
                  'Publish meals and duration-based plans without separate registers.',
                  'Review subscriptions, bookings and pending payments in context.',
                  'Understand daily demand and customer activity from real records.',
                  'Use ratings and written feedback to identify service patterns.',
                ].map((item) => <BenefitRow key={item}>{item}</BenefitRow>)}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950 px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div>
            <h2 className="max-w-4xl text-balance text-4xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl lg:text-6xl">
              Stop checking separate records just to understand today.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Open MessMate to see the service, your status and the action that comes next.</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            {isReadOnlyDemo ? (
              <a href={`${liveAppUrl}/login`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Open live app <ArrowRight size={18} aria-hidden="true" /></a>
            ) : isAuthenticated ? (
              <Link to={workspacePath} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Open workspace <ArrowRight size={18} aria-hidden="true" /></Link>
            ) : (
              <>
                <Link to="/register" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Create student account <ArrowRight size={18} aria-hidden="true" /></Link>
                <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-600 px-6 font-semibold text-white transition hover:border-slate-400 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 px-5 py-8 text-slate-400 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-4 border-t border-white/10 pt-8 text-sm sm:flex-row sm:items-center">
          <p className="font-semibold text-white">Mess<span className="text-emerald-400">Mate</span></p>
          <p>A single-mess operations platform for customers and teams.</p>
          <div className="flex gap-5">
            {isReadOnlyDemo ? (
              <a href={`${liveAppUrl}/login`} className="transition hover:text-white">Open live app</a>
            ) : (
              <>
                <Link to="/login" className="transition hover:text-white">Sign in</Link>
                <Link to="/register" className="transition hover:text-white">Student registration</Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </main>
  )
}

const ConnectedOperationsStory = () => {
  const sectionRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (shouldReduceMotion) return
    const nextIndex = Math.min(operatingSequence.length - 1, Math.floor(latest * operatingSequence.length))
    setActiveIndex((current) => current === nextIndex ? current : nextIndex)
  })

  const selectStage = (index) => {
    setActiveIndex(index)
    if (!sectionRef.current) return
    const sectionTop = sectionRef.current.offsetTop
    const availableScroll = sectionRef.current.offsetHeight - window.innerHeight
    window.scrollTo({
      top: sectionTop + availableScroll * (index / (operatingSequence.length - 1)),
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <section ref={sectionRef} id="how-it-works" className={`relative bg-white text-slate-950 ${shouldReduceMotion ? '' : 'lg:min-h-[360vh]'}`}>
      <div className={`px-5 py-24 sm:px-8 lg:px-12 lg:py-16 ${shouldReduceMotion ? '' : 'lg:sticky lg:top-0 lg:flex lg:min-h-screen lg:items-center'}`}>
        <div className="mx-auto grid w-full max-w-[1320px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <div>
            <h2 className="max-w-xl text-balance text-4xl font-bold leading-tight tracking-[-0.035em] sm:text-5xl">One service. Every decision connected.</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Follow one day through MessMate. Each step keeps its own rules while staying visible to the people who depend on it.</p>

            {!shouldReduceMotion && <div className="mt-10 hidden space-y-1 lg:block" aria-label="Connected operations stages">
              {operatingSequence.map((stage, index) => (
                <button
                  type="button"
                  aria-pressed={activeIndex === index}
                  key={stage.title}
                  onClick={() => selectStage(index)}
                  className={`group flex w-full items-center gap-4 border-t px-1 py-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${activeIndex === index ? 'border-emerald-600 text-slate-950' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums transition ${activeIndex === index ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100 text-emerald-800 group-hover:bg-slate-200'}`}>{index + 1}</span>
                  <span className="text-sm font-semibold">{stage.title}</span>
                </button>
              ))}
            </div>}
          </div>

          <div className="lg:flex lg:items-center">
            <div className="relative w-full overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)] sm:p-8 lg:min-h-[560px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <p className="font-bold">Connected service</p>
                <p className="text-xs font-medium text-slate-400">Illustrative workflow</p>
              </div>

              {!shouldReduceMotion && <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <motion.div className="h-full origin-left bg-emerald-500" style={{ scaleX: scrollYProgress }} />
              </div>}

              {shouldReduceMotion ? (
                <div className="mt-8 space-y-4">
                  {operatingSequence.map((stage, index) => <StagePanel key={stage.title} stage={stage} index={index} reduceMotion />)}
                </div>
              ) : (
                <>
                  <div className="mt-8 hidden lg:block">
                    <AnimatePresence mode="wait">
                      <StagePanel key={activeIndex} stage={operatingSequence[activeIndex]} index={activeIndex} />
                    </AnimatePresence>
                  </div>
                  <div className="space-y-4 lg:hidden">
                    {operatingSequence.map((stage, index) => <StagePanel key={stage.title} stage={stage} index={index} reduceMotion />)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const StagePanel = ({ stage, index, reduceMotion }) => {
  const Icon = stage.icon

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -18, filter: 'blur(6px)' }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className="flex min-h-[430px] flex-col rounded-xl border border-white/10 bg-slate-900 p-6 sm:p-8"
    >
      <div className="flex items-start justify-between gap-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-emerald-950"><Icon size={23} aria-hidden="true" /></span>
        <span className="text-sm font-semibold tabular-nums text-slate-500">{String(index + 1).padStart(2, '0')} / 05</span>
      </div>
      <p className="mt-10 text-sm font-semibold text-emerald-400">{stage.audience}</p>
      <h3 className="mt-3 max-w-xl text-3xl font-bold leading-tight tracking-[-0.025em] sm:text-4xl">{stage.title}</h3>
      <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">{stage.description}</p>
      <div className="mt-auto grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current state</p>
          <p className="mt-2 font-semibold text-white">{stage.action}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Operational record</p>
          <p className="mt-2 font-semibold text-white">{stage.detail}</p>
        </div>
      </div>
    </motion.article>
  )
}

const BenefitRow = ({ children }) => (
  <li className="flex gap-3 text-base leading-7 text-slate-700">
    <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check size={13} aria-hidden="true" /></span>
    <span>{children}</span>
  </li>
)

const IllustrativeWorkspace = () => (
  <div className="relative z-10 mx-auto w-full max-w-[860px] rounded-2xl bg-slate-900 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
    <div className="overflow-hidden rounded-xl bg-slate-50 text-slate-950">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
        <p className="text-base font-bold tracking-[-0.02em]">Mess<span className="text-emerald-600">Mate</span></p>
        <p className="text-xs font-medium text-slate-500">Illustrative workspace</p>
      </div>

      <div className="grid lg:grid-cols-[132px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white p-3 lg:block" aria-label="Illustrative student navigation">
          {[
            [House, 'Home', true],
            [Utensils, 'Meals'],
            [CalendarDays, 'Bookings'],
            [CreditCard, 'Subscription'],
            [MessageSquareText, 'Feedback'],
          ].map(([Icon, label, active]) => (
            <div key={label} className={`mb-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold ${active ? 'bg-emerald-100' : ''}`}>
              <Icon size={15} className={active ? 'text-emerald-800' : 'text-slate-500'} aria-hidden="true" />
              <span className={active ? 'text-emerald-800' : 'text-slate-500'}>{label}</span>
            </div>
          ))}
        </aside>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="text-base font-bold sm:text-lg">Today at your mess</p>
              <p className="mt-0.5 text-xs text-slate-500">Service and entitlement shown together</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Clock3 size={14} aria-hidden="true" /> Monday, 05 October
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {mealServices.map((meal) => (
              <article key={meal.type} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold">{meal.type}</h2>
                    <p className="mt-0.5 text-[11px] text-slate-500">{meal.time}</p>
                  </div>
                  <Utensils size={16} className={meal.included ? 'text-emerald-600' : 'text-slate-400'} aria-hidden="true" />
                </div>
                <p className="mt-4 min-h-10 text-xs leading-5 text-slate-700">{meal.menu}</p>
                <div className={`mt-3 flex min-h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold ${meal.included ? 'bg-emerald-50' : 'border border-slate-300'}`}>
                  {meal.included && <Check size={13} className="text-emerald-800" aria-hidden="true" />}
                  <span className={meal.included ? 'text-emerald-800' : 'text-slate-700'}>{meal.state}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5">
            <p className="text-sm font-bold">Your connected journey</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              {journey.map(({ icon: Icon, label, state, detail }, index) => (
                <div key={label} className="relative rounded-xl border border-slate-200 bg-white p-3">
                  {index < journey.length - 1 && <span className="absolute left-[calc(100%+1px)] top-6 z-10 hidden h-px w-2 bg-emerald-400 sm:block" aria-hidden="true" />}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Icon size={14} aria-hidden="true" /></span>
                  <h3 className="mt-3 text-xs font-bold leading-4">{label}</h3>
                  <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">{state}</p>
                  <p className="mt-2 text-[10px] leading-4 text-slate-500">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default Home
