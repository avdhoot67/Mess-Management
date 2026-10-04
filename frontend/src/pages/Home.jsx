import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  CircleCheck,
  Clock3,
  CreditCard,
  MessageSquareText,
  NotebookTabs,
  ShieldCheck,
  Sparkles,
  Utensils,
} from 'lucide-react'
import OperationsField from '../components/landing/OperationsField'
import { useAuth } from '../context/AuthContext'
import './Home.css'

gsap.registerPlugin(ScrollTrigger)

const chapters = [
  {
    title: 'The menu becomes the source of truth.',
    summary: 'The mess team publishes breakfast, lunch and dinner once. Every customer sees the same service the kitchen is preparing.',
    signal: 'Daily service',
    value: '3 meals published',
    detail: 'Monday, 05 October',
    icon: NotebookTabs,
  },
  {
    title: 'Coverage is visible before action.',
    summary: 'Students see the active plan, remaining duration and skipped days beside the meal calendar—not in a separate register.',
    signal: 'Subscription',
    value: '24 days remaining',
    detail: 'All meal types covered',
    icon: ShieldCheck,
  },
  {
    title: 'A skip and a booking stay different.',
    summary: 'Skipping an eligible subscription day extends the plan. An individual meal remains a separate paid booking when needed.',
    signal: 'Customer choice',
    value: '1 day skipped',
    detail: 'Plan extended automatically',
    icon: CalendarDays,
  },
  {
    title: 'Payment becomes an entitlement.',
    summary: 'Transaction references enter one verification queue. Approval activates the correct subscription or confirms the individual meal.',
    signal: 'Verification',
    value: 'Payment confirmed',
    detail: 'Reference retained',
    icon: CreditCard,
  },
  {
    title: 'Service closes with useful feedback.',
    summary: 'Eligible customers respond after service. Ratings, written feedback and recurring themes return to the team that can act on them.',
    signal: 'Feedback loop',
    value: 'Insight ready',
    detail: 'Real service data only',
    icon: MessageSquareText,
  },
]

const relationshipRows = [
  ['Plan', 'Duration and coverage'],
  ['Meal', 'What the mess serves'],
  ['Skip', 'An eligible day moved'],
  ['Booking', 'A separate paid meal'],
  ['Payment', 'Verification and receipt'],
  ['Feedback', 'A response after service'],
]

const Home = () => {
  const rootRef = useRef(null)
  const heroRef = useRef(null)
  const storyRef = useRef(null)
  const chapterRefs = useRef([])
  const [activeChapter, setActiveChapter] = useState(0)
  const { user, isAuthenticated } = useAuth()
  const workspacePath = user?.role === 'admin' ? '/admin' : '/student'

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo('[data-hero-line]',
          { yPercent: 110, rotate: 1.2 },
          { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out' },
        )
        gsap.fromTo('[data-hero-reveal]',
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.85, stagger: 0.1, delay: 0.55, ease: 'power3.out' },
        )
        gsap.to('[data-hero-content]', {
          yPercent: -12,
          opacity: 0.22,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8,
          },
        })
      })

      media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const items = chapterRefs.current.filter(Boolean)
        if (!items.length) return undefined

        gsap.set(items, { autoAlpha: 0, y: 42, clipPath: 'inset(12% 0 0 0)' })
        gsap.set(items[0], { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0 0 0)' })

        const timeline = gsap.timeline({
          defaults: { ease: 'power3.inOut' },
          scrollTrigger: {
            trigger: storyRef.current,
            start: 'top top',
            end: `+=${chapters.length * 90}%`,
            pin: true,
            scrub: 0.85,
            anticipatePin: 1,
            onUpdate: (self) => {
              const next = Math.min(chapters.length - 1, Math.round(self.progress * (chapters.length - 1)))
              setActiveChapter((current) => current === next ? current : next)
            },
          },
        })

        items.slice(1).forEach((item, index) => {
          const previous = items[index]
          timeline
            .to(previous, { autoAlpha: 0, y: -34, clipPath: 'inset(0 0 14% 0)', duration: 0.4 }, index + 0.6)
            .fromTo(item,
              { autoAlpha: 0, y: 44, clipPath: 'inset(14% 0 0 0)' },
              { autoAlpha: 1, y: 0, clipPath: 'inset(0% 0 0 0)', duration: 0.55 },
              index + 0.86,
            )
        })

        return () => timeline.kill()
      })
    }, root)

    return () => {
      media.revert()
      context.revert()
    }
  }, [])

  return (
    <main ref={rootRef} className="kage-landing">
      <OperationsField />

      <header className="landing-nav">
        <nav className="landing-shell flex min-h-20 items-center justify-between gap-6" aria-label="Public navigation">
          <Link to="/" className="landing-logo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300">
            Mess<span>Mate</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#connected-day" className="landing-link">A connected day</a>
            <a href="#relationship" className="landing-link">Why it works</a>
          </div>
          {isAuthenticated ? (
            <Link to={workspacePath} className="landing-button landing-button--primary">
              Open workspace <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/login" className="landing-button landing-button--quiet">Sign in</Link>
              <Link to="/register" className="landing-button landing-button--primary landing-nav__join">
                Join as student <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          )}
        </nav>
      </header>

      <section ref={heroRef} className="landing-hero">
        <div className="landing-hero__veil" aria-hidden="true" />
        <div data-hero-content className="landing-shell landing-hero__content">
          <h1 className="landing-hero__headline" aria-label="One mess. Every signal in sync.">
            <span className="landing-line-mask"><span data-hero-line>One mess.</span></span>
            <span className="landing-line-mask landing-line-mask--accent"><span data-hero-line>Every signal</span></span>
            <span className="landing-line-mask"><span data-hero-line>in sync.</span></span>
          </h1>

          <div className="landing-hero__footer">
            <p data-hero-reveal className="landing-hero__copy">
              MessMate connects subscriptions, daily meals, individual bookings, payments, skips and feedback into one operational view.
            </p>
            <div data-hero-reveal className="landing-hero__actions">
              {isAuthenticated ? (
                <Link to={workspacePath} className="landing-button landing-button--primary landing-button--large">Open your workspace <ArrowRight size={19} aria-hidden="true" /></Link>
              ) : (
                <>
                  <Link to="/register" className="landing-button landing-button--primary landing-button--large">Create student account <ArrowRight size={19} aria-hidden="true" /></Link>
                  <Link to="/login" className="landing-button landing-button--quiet landing-button--large">Use an existing account</Link>
                </>
              )}
            </div>
          </div>

          <div data-hero-reveal className="landing-hero__signals" aria-label="Illustrative connected operational signals">
            <Signal label="Subscription" value="Active" />
            <Signal label="Today" value="3 meals" />
            <Signal label="Booking" value="Separate" />
            <Signal label="Payment" value="Verified" />
            <Signal label="Feedback" value="Eligible" />
          </div>
        </div>

        <a href="#connected-day" className="landing-scroll-cue" aria-label="Scroll to see a connected service day">
          <span>Follow a service day</span><ArrowDown size={17} aria-hidden="true" />
        </a>
      </section>

      <section ref={storyRef} id="connected-day" className="landing-story">
        <div className="landing-shell landing-story__frame">
          <div className="landing-story__rail" aria-hidden="true">
            <p>A connected service day</p>
            <div className="landing-story__ticks">
              {chapters.map((chapter, index) => (
                <span key={chapter.signal} className={activeChapter === index ? 'is-active' : ''}>{String(index + 1).padStart(2, '0')}</span>
              ))}
            </div>
          </div>

          <div className="landing-story__chapters">
            {chapters.map((chapter, index) => (
              <Chapter
                key={chapter.title}
                chapter={chapter}
                index={index}
                ref={(node) => { chapterRefs.current[index] = node }}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="relationship" className="landing-relationship">
        <div className="landing-shell">
          <div className="landing-relationship__intro">
            <h2>Not another meal-ordering app.</h2>
            <p>MessMate keeps the whole customer–mess relationship legible. Each action has its own meaning, but every record stays connected to the same day of service.</p>
          </div>

          <div className="landing-relationship__ledger" aria-label="How MessMate keeps operational records distinct">
            {relationshipRows.map(([name, meaning], index) => (
              <div className="landing-ledger-row" key={name}>
                <span className="landing-ledger-row__index">{String(index + 1).padStart(2, '0')}</span>
                <strong>{name}</strong>
                <span>{meaning}</span>
                <CircleCheck size={20} aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-two-sides">
        <div className="landing-shell landing-two-sides__grid">
          <article>
            <div className="landing-two-sides__icon"><Utensils size={23} aria-hidden="true" /></div>
            <h2>For the person asking, “What applies to me today?”</h2>
            <p>See your plan, remaining duration, skipped days, meals, separate bookings, payment status and next available action without searching across pages.</p>
            <ul>
              <Benefit>Plan coverage and skips stay visible</Benefit>
              <Benefit>Past and upcoming meals stay distinct</Benefit>
              <Benefit>Receipts and verification remain traceable</Benefit>
            </ul>
          </article>
          <article>
            <div className="landing-two-sides__icon"><Clock3 size={23} aria-hidden="true" /></div>
            <h2>For the team asking, “What needs attention today?”</h2>
            <p>Publish service, review demand, verify payments and understand customer activity from one operational system instead of separate registers.</p>
            <ul>
              <Benefit>Daily service and bookings share context</Benefit>
              <Benefit>Pending work remains easy to identify</Benefit>
              <Benefit>Feedback returns to real meal records</Benefit>
            </ul>
          </article>
        </div>
      </section>

      <section className="landing-close">
        <div className="landing-close__orbit" aria-hidden="true"><Sparkles size={36} /></div>
        <div className="landing-shell landing-close__content">
          <h2>Make today<br />easy to read.</h2>
          <p>One place for the service, the customer’s status and the next action that matters.</p>
          <div className="landing-close__actions">
            {isAuthenticated ? (
              <Link to={workspacePath} className="landing-button landing-button--primary landing-button--large">Open workspace <ArrowRight size={19} aria-hidden="true" /></Link>
            ) : (
              <>
                <Link to="/register" className="landing-button landing-button--primary landing-button--large">Create student account <ArrowRight size={19} aria-hidden="true" /></Link>
                <Link to="/login" className="landing-button landing-button--quiet landing-button--large">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer__inner">
          <p className="landing-logo">Mess<span>Mate</span></p>
          <p>A single-mess operations platform for customers and teams.</p>
          <div><Link to="/login">Sign in</Link><Link to="/register">Student registration</Link></div>
        </div>
      </footer>
    </main>
  )
}

const Signal = ({ label, value }) => (
  <div className="landing-signal">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
)

const Chapter = ({ chapter, index, ref }) => {
  const Icon = chapter.icon
  return (
    <article ref={ref} className="landing-chapter">
      <div className="landing-chapter__number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
      <div className="landing-chapter__copy">
        <Icon size={30} aria-hidden="true" />
        <h2>{chapter.title}</h2>
        <p>{chapter.summary}</p>
      </div>
      <div className="landing-chapter__readout">
        <span>{chapter.signal}</span>
        <strong>{chapter.value}</strong>
        <p>{chapter.detail}</p>
      </div>
    </article>
  )
}

const Benefit = ({ children }) => (
  <li><span><Check size={14} aria-hidden="true" /></span>{children}</li>
)

export default Home
