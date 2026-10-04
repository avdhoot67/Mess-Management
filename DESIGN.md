---
name: MessMate
description: A calm operational workspace for mess customers and administrators.
colors:
  action-emerald: "#059669"
  action-emerald-hover: "#047857"
  action-emerald-soft: "#d1fae5"
  action-emerald-wash: "#ecfdf5"
  slate-950: "#020617"
  slate-900: "#0f172a"
  slate-700: "#334155"
  slate-600: "#475569"
  slate-500: "#64748b"
  slate-200: "#e2e8f0"
  slate-100: "#f1f5f9"
  slate-50: "#f8fafc"
  surface: "#ffffff"
  atmosphere-blue: "#f8fbff"
  atmosphere-violet: "#fbfaff"
  atmosphere-warm: "#fffaf3"
  warning-wash: "#fffbeb"
  warning-ink: "#92400e"
  danger-wash: "#fff1f2"
  danger-ink: "#be123c"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.025em"
rounded:
  control: "8px"
  group: "12px"
  surface: "16px"
  pill: "9999px"
spacing:
  compact: "8px"
  control: "12px"
  content: "16px"
  section: "24px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action-emerald}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.action-emerald-hover}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.slate-700}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  card-default:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "20px"
---

# Design System: MessMate

## Overview

**Creative North Star: "The Calm Operations Desk"**

MessMate is a composed working environment, not a food marketplace or a generic SaaS showcase. It makes daily mess operations legible through a cool slate workspace, crisp white surfaces, and a restrained emerald action signal. Information is allowed to be dense when the task calls for it, but hierarchy and whitespace keep the work calm.

Modernity comes from thoughtful interaction and useful operational components: clear status chips, refined tables, interactive calendar states, progress and contextual panels when backed by real data, and targeted motion that confirms a state change. It is never achieved through decoration, gradients, or a pile of unrelated cards.

**Key Characteristics:**

- Operational clarity before embellishment.
- Emerald action signals used sparingly against cool slate neutrals.
- Precise, low-elevation surfaces with compact controls and generous page rhythm.
- Data views that remain readable on mobile and purposeful motion that supports feedback.

## Colors

The palette is cool, grounded, and controlled: slate provides the operational frame; emerald identifies primary actions and confirmed states; amber and rose are reserved for genuine warning and failure states.

### Primary

- **Operational Emerald:** Primary actions, selected calendar days, active student navigation, links, positive highlights, and confirmed states.
- **Deep Operational Emerald:** Hover and pressed treatment for primary actions.
- **Emerald Wash:** Low-emphasis selected, informational, and supportive surfaces.

### Secondary

- **Midnight Slate:** Administrator navigation and the highest-contrast structural areas.
- **Slate Ink:** High-emphasis text and data that require confident scanning.

### Tertiary

- **Verification Amber:** Pending payment and attention-required states only.
- **Resolution Rose:** Failed, rejected, destructive, and error states only.

### Neutral

- **Paper Surface:** The primary card, form, table, and navigation surface.
- **Cool Workspace:** The application canvas and low-emphasis nested surface.
- **Slate Divider:** Quiet boundaries that organize dense information without visual noise.
- **Muted Slate:** Supporting copy, labels, and secondary table information.

### Atmospheric Surfaces

- **Mist Blue:** Low-emphasis filter, schedule, and meal surfaces that benefit from cooler separation.
- **Quiet Violet:** Secondary review and history surfaces used sparingly to distinguish adjacent workflows.
- **Warm Paper:** Form and account-detail surfaces that need a subtle human counterpoint to the cool workspace.

Atmospheric colors are pale surface treatments, not statuses or actions. They may appear as a solid wash with one softly blurred same-hue overlay; they must never replace emerald actions or reuse amber/rose status semantics decoratively.

### Named Rules

**The One Action Signal Rule.** Emerald is the only default action color. Use it for the one action or selection a user should notice first; do not turn it into a decorative fill across every component.

**The Truthful Status Rule.** Amber and rose communicate real backend-confirmed operational states. They must not be used merely to make an otherwise neutral screen more colorful.

## Typography

**Display Font:** System UI sans-serif stack

**Body Font:** System UI sans-serif stack

**Label/Mono Font:** System UI sans-serif stack; use monospace only for transaction references and other machine-readable values.

**Character:** Typography is direct, compact, and highly legible. Weight and spacing establish hierarchy rather than a decorative display face, keeping service information trustworthy and fast to scan.

### Hierarchy

- **Display** (700, 1.875rem, 1.2): Route-level page titles and key dashboard greetings.
- **Headline** (700, 1.5rem, 1.25): Major section and modal titles.
- **Title** (700, 1.125rem, 1.35): Cards, panels, and meaningful groups of data.
- **Body** (400, 0.875rem, 1.5): Supporting explanations, table cells, and form content.
- **Label** (600, 0.75rem, 0.025em tracking): Metadata, status labels, and concise contextual markers. Uppercase labels are reserved for short metadata, not page headings.

### Named Rules

**The Heading Carries the Weight Rule.** Do not add an eyebrow or kicker above a page heading. The title and its supporting sentence must establish hierarchy on their own.

## Layout

The app uses a persistent 16rem desktop sidebar and a 4rem top bar, with a single content column that gains 16px, 24px, then 32px of page padding across small, medium, and large screens. The student navigation becomes an off-canvas drawer on small screens; the admin navigation becomes a horizontally scrollable compact rail.

Route pages use 24px vertical rhythm between major sections and 16px between related controls. Dashboard summaries use responsive two-to-four-column grids, while operational tables retain their columns inside an intentional horizontal overflow container on narrow screens. Calendar and context panels move from two columns to one rather than squeezing their content.

### Public Entry Surface

The public landing page is the expressive counterpart to the Calm Operations Desk. It uses a cinematic operational world inspired by authored full-page experiences: midnight depth, large editorial Onest typography, thin ledger rules, warm paper transitions, and a live field of connected service signals. Emerald remains the action and connection color; cool blue is a quiet supporting signal. The page must never become a generic SaaS card stack, food-delivery storefront, or unrelated 3D showcase.

The first viewport must state and demonstrate the product mechanism at full scale. A live operational field connects five truthful concepts—subscription, meals, individual booking, payment, and feedback—behind direct student registration and shared sign-in actions. WebGL responds subtly to pointer and scroll input but remains atmospheric; it never hides content or becomes a product control.

The landing page uses one GSAP-directed scroll chapter. On large screens the service-day sequence pins while five operational states replace one another through clipped editorial transitions. On small screens and for `prefers-reduced-motion`, all five states become a normal vertical reading flow and remain visible without animation. Motion uses one coordinated timeline, not repeated entrance effects across every section.

Public sections may alternate between midnight canvas, warm operational paper, and cool workspace surfaces. Their shared typography, one-pixel rules, restrained radii, and emerald signal keep them inside one system. Decorative cards, gradient text, glass panels, fabricated statistics, testimonials, prices, partner logos, and multi-mess claims remain prohibited.

Public content must not invent testimonials, adoption metrics, prices, partner logos, or multi-mess capabilities. Public administrator registration is never offered; the primary acquisition action is student registration, while existing customers and administrators share the sign-in route.

## Elevation & Depth

Depth is intentionally low and structural. White surfaces are separated from the slate workspace primarily by a 1px slate border; standard cards use a small neutral shadow, and hoverable cards add a slightly stronger soft lift. Large focused dialogs use a dark slate backdrop and a stronger shadow because they interrupt work. Subtle blurred emerald circles can orient a dashboard surface, but never substitute for content or become a decorative background treatment.

### Shadow Vocabulary

- **Resting surface** (`0 1px 2px rgba(15, 23, 42, 0.05)`): Standard cards and grouped workspace panels.
- **Interactive lift** (`0 4px 6px -1px rgba(15, 23, 42, 0.10), 0 2px 4px -2px rgba(15, 23, 42, 0.10)`): Hoverable summary cards and meals.
- **Focused dialog** (`0 10px 15px -3px rgba(15, 23, 42, 0.10), 0 4px 6px -4px rgba(15, 23, 42, 0.10)`): Confirmation and booking modals.

### Named Rules

**The Quiet Boundary Rule.** A surface may use a border and a very small resting shadow only when the shadow meaningfully separates it from the workspace. Avoid stacking conspicuous borders, heavy shadows, and colored fills on the same card.

## Shapes

Controls use gently curved 8px corners, grouped controls and chips use 12px, and primary surfaces use 16px. Pills are reserved for compact status indicators and circular identity markers, never for broad cards or full-width panels. Borders are thin, neutral, and consistent; high-radius, glass-like containers and excessive nested cards are out of character.

## Components

### Buttons

- **Shape:** Compact, gently rounded controls (8px radius).
- **Primary:** Emerald fill with white, semibold label; used for the most important available action in a region.
- **Hover / Focus:** Shift to deep emerald on hover; focus treatment uses the established emerald border/ring pattern on fields and a visible browser-safe focus state on buttons. Disabled actions reduce opacity and show no false affordance.
- **Secondary / Ghost:** White or transparent controls with slate text and a quiet slate border or hover wash. Destructive actions use rose only after their purpose is explicit.

### Chips

- **Style:** Small, semibold status labels with pill geometry and a tinted status background.
- **State:** Green for completed or confirmed, amber for pending, rose for failed/rejected, and slate for neutral or historical states. Text must state the status; color cannot carry it alone.

### Cards / Containers

- **Corner Style:** Surface radius (16px); inner operational group radius (12px).
- **Background:** Paper Surface with a Slate Divider border; low-emphasis inner groups may use Cool Workspace.
- **Shadow Strategy:** Resting surface shadow by default; interactive lift only for genuinely clickable or hoverable cards.
- **Internal Padding:** 20px for cards, 16px for contextual inner groups, with 24px or more between separate page sections.

### Inputs / Fields

- **Style:** White fill, 1px neutral border, 8px radius, 12px vertical and 16px horizontal padding for standard fields.
- **Focus:** Emerald border with a soft emerald focus ring.
- **Error / Disabled:** Errors pair rose text with clear recovery copy; disabled fields/actions visibly reduce emphasis and remain readable.

### Navigation

- **Student:** A white, bordered sidebar with icon-led items; active routes use a pale emerald surface and dark emerald type.
- **Admin:** A midnight slate sidebar with white/slate text; active routes use a solid emerald selection for unambiguous operational context.
- **Mobile:** Student navigation becomes a dismissible overlay drawer; admin navigation remains a compact horizontal rail. Both preserve visible route labels.

### Calendar and Operational Tables

- **Calendar:** Selected dates use the primary emerald fill; subscription-range and lifecycle markers remain small, labeled through a legend, and never rely on color alone. Date selection updates a neighboring context panel rather than hiding operational detail in a tooltip.
- **Tables:** Use a cool slate header, quiet row dividers, tabular-friendly numeric alignment, and a restrained emerald hover wash. On small screens, preserve full information through horizontal scrolling rather than deleting critical columns.

  ## Modern Interaction & Data Visualization

MessMate should feel contemporary and technically polished without becoming visually noisy.

Modernity should come from useful interaction and data presentation, including:

* Responsive charts when they help users understand demand, booking patterns, payment activity, subscription usage, or other operational trends.
* Animated statistics and number transitions for meaningful dashboard metrics.
* Progress indicators for subscription duration, payment workflows, or other multi-state processes.
* Interactive calendars and date-driven contextual panels.
* Refined tables with sorting, filtering, contextual actions, and responsive behavior where appropriate.
* Contextual drawers, sheets, dialogs, and popovers for focused workflows.
* Subtle page, panel, state, and list transitions using purposeful motion.
* Timeline or activity-style components when chronological information is important.
* High-quality empty, loading, success, and error states.

Motion must confirm hierarchy, navigation, state changes, or user actions. Avoid animation that exists only for visual novelty.

Charts must communicate real backend-derived information and should never be added merely to make a dashboard appear more sophisticated.

### Approved UI Sources

External component libraries may be used selectively when they materially improve usability or implementation quality.

Before creating a new frontend component or interaction, review the existing project components and this design system. Do not install or use an external library automatically; introduce one only for a concrete UI requirement and restyle every imported component to match MessMate.

* **shadcn/ui** — preferred source for accessible structural primitives such as dialogs, sheets, dropdowns, tooltips, tabs, forms, selects, popovers, and tables.
* **Motion** — preferred for restrained transitions, micro-interactions, state changes, and animation.
* **React Bits** — individual interaction or visual components may be adapted when a page benefits from a distinctive treatment.
* **Magic UI** — may be used selectively for statistics, number animation, subtle visual emphasis, and specialized dashboard elements.
* **Aceternity UI** — use sparingly for isolated high-quality effects; it must never define the overall application aesthetic.

External components must be adapted to the MessMate design system rather than retaining their default appearance.

Prefer existing MessMate components before introducing new dependencies. Do not mix several external visual styles on one screen merely because they are available.


## Do's and Don'ts

### Do:

- **Do** lead every route with a clear page title and one concise sentence that explains the current operational task.
- **Do** use compact status chips, labels, and contextual panels to make current state scannable.
- **Do** reserve visual emphasis, richer components, charts, and animation for information that changes a decision or next action.
- **Do** use responsive grids for summaries and preserve operational data in mobile-friendly tables and calendar layouts.
- **Do** apply `formatDate()` for every user-facing date and present user-visible statuses in clear language.
- Do allow selected dashboards and operational screens to feel visually sophisticated through meaningful data visualization, rich interaction, and purposeful motion

### Don't:

- **Don't** use gradients, decorative glassmorphism, random shadows, oversized rounded cards, or generic SaaS ornamentation.
- **Don't** introduce a new accent color or status color without a concrete semantic role.
- **Don't** add a visual component merely to fill whitespace; empty states must explain the operational reality and the available next step.
- **Don't** let frontend styling imply eligibility, approval, payment outcome, subscription validity, or booking state that the backend has not confirmed.
