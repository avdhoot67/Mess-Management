# Product

## Platform

web

## Current Product Scope

The implemented application operates one mess. Multi-mess tenancy, mess-owner onboarding, administrator invitations, and mess-to-MessMate platform billing are future capabilities documented in `docs/FUTURE_MULTI_MESS_SAAS_ROADMAP.md`; current screens and APIs must not imply that these capabilities already exist.

## Users

* Students and regular mess customers, especially people using monthly or duration-based meal subscriptions.
* Mess owners and administrators managing meals, subscriptions, bookings, payments, skips, feedback, and daily operations.

## Product Purpose

MessMate helps a mess and its customers manage their complete ongoing relationship rather than isolated meal orders.

Customers should quickly understand their subscription, available and upcoming meals, bookings, skipped days, payments, and next available actions.

Administrators should replace fragmented manual records with one operational system for managing meals, plans, subscriptions, bookings, payments, feedback, and daily customer activity.

## Positioning

MessMate is a simple operational platform for running and using a mess, not a food-delivery application.

Its main value comes from combining duration-based subscriptions, subscription day skips, individually bookable meals, payments, bookings, and mess operations in one system without conflating them.

A student with an active subscription may still make a separate paid individual meal booking when needed.

## Operating Context

Students use the service to:

* View current and upcoming meals.
* Review their active subscription and subscription duration.
* Track previously skipped subscription days.
* Skip an eligible subscription day.
* Book individual meals separately.
* Cancel eligible future individual meal bookings.
* Rebook a previously cancelled future meal.
* Submit transaction/payment references where required.
* Review booking and payment status.
* Provide feedback for meals they were eligible to consume.

Administrators use the service to:

* Create and manage mess plans.
* Publish and manage meals.
* Review subscriptions.
* Review and resolve pending payments.
* Manage bookings and customer activity.
* Review feedback.
* Understand day-to-day mess operations and demand.
* Invite additional administrators through expiring, single-use email invitations.

## Capabilities and Constraints

* Roles are `student` and `admin`.

* The system manages plans, subscriptions, meals, individual bookings, payments, subscription day skips, and meal feedback.

* A mess plan covers all meal types during its subscription duration. Plans do not maintain separate meal-type inclusions.

* Students with an active subscription may still make separate paid individual meal bookings.

### Subscription Day Skips

* A subscription day skip applies to the student's subscription rather than cancelling an individual meal booking.

* A valid skipped day extends the subscription `end_date` by one day.

* A subscription allows a maximum of 5 skipped days.

* Duplicate skips for the same subscription and date are prevented.

* Skipping a subscription day does not prevent the student from separately purchasing an individual meal for that same date.

* Subscription validity must respect both the subscription's state and applicable date range rather than relying only on a status label.

* Multiple simultaneously active subscriptions for one user are prevented through backend business logic.

### Individual Meal Bookings

* Individual bookings preserve one booking record per user and meal through `UNIQUE(user_id, meal_id)`.

* If an existing booking for the same user and meal is already confirmed, another booking is rejected.

* If a booking for a future meal was previously cancelled, rebooking reactivates the existing cancelled booking rather than creating another booking row.

* Rebooking creates a new payment record while previous payment records remain preserved as historical records.

* Rebooking is not allowed once the meal date has passed.

### Booking Cancellation and Refunds

* Individual meal bookings may only be cancelled when the meal is still eligible for cancellation according to the existing backend rules.

* A booking for a meal whose `meal_date` has already passed cannot be cancelled.

* Valid cancellation of an individually paid meal booking is refund-eligible.

* Refund eligibility for an individual booking does not depend on whether the student also has an active mess subscription.

* Therefore, both students with a subscription and students without a subscription may be refund-eligible when cancelling a separately paid individual meal booking.

* Refund processing remains manual in the MVP.

* Subscription-covered meals do not use the individual meal refund mechanism.

* When a student does not want to use their subscription for an eligible day, the subscription day-skip mechanism is used instead.

### Payments

* Subscription purchase payments use the manual verification flow.

* The payment amount for a subscription is automatically determined from the selected mess plan price. Students do not manually enter the payment amount.

* The student provides a transaction/reference number.

* The payment initially remains pending until reviewed by an administrator.

* Administrator approval marks the payment as completed and activates or creates the corresponding subscription according to the implemented subscription workflow.

* Administrator rejection marks the payment as failed and must not activate the subscription.

* Payment records must retain the customer-entered transaction reference.

* A payment belongs to either a subscription or an individual booking, never both.

* Payment identity is derived through the associated Subscription or Booking rather than storing a redundant `user_id` directly in Payments.

### Account Recovery

* Password-based accounts may request a short-lived, single-use password-reset link by email.

* Password-reset requests always return the same public response so the system does not reveal whether an email is registered.

* Google-only accounts continue to authenticate with Google and do not receive password-reset email until a password-based sign-in method is explicitly supported for them.

### Administrator Access

* The current product operates one mess and requires one trusted bootstrap administrator.

* Authenticated administrators may invite a new administrator by email; public registration must always create a student.

* Administrator invitations expire after 48 hours, are single-use, may be revoked, and store only a token hash.

* An invitation cannot promote an existing account because the current single-mess model stores one global role per user.

### Feedback

* Feedback eligibility is backend-authoritative.

* A subscribed student is eligible to provide feedback when their subscription covered the meal date and that subscription day was not skipped.

* A student using an individual meal booking must have the qualifying confirmed booking for that meal.

* The frontend must not imply feedback eligibility unless it is supported by backend rules.

### Technical Constraints

* Existing MySQL schema, Express backend, React/Vite frontend, API contracts, and finalized business rules are constraints to preserve.

* Existing working functionality must not be redesigned, reimplemented, or have its business behavior changed merely as part of visual refinement.

* Backend logic remains authoritative for permissions, eligibility, state changes, payments, subscription validity, booking rules, skips, and feedback.

## Brand Commitments

* Product name: MessMate.

* The interface should feel clean, modern, professional, and operationally clear rather than resembling a generic food-delivery application or an inconsistent dashboard assembled from unrelated patterns.

* Visual hierarchy and usability should take priority over decorative effects.

* Use a consistent and restrained color palette.

* Do not use gradients as a default visual treatment.

* Subtle overlays, surface treatments, and purposeful motion are acceptable when they improve hierarchy, orientation, or interaction feedback.

* Avoid excessive glassmorphism, unnecessary nested cards, oversized rounded corners, decorative animations, random shadows, and unnecessary visual complexity.

* Student and administrator interfaces should clearly belong to the same design system while supporting their different workflows.

## Evidence on Hand

* The repository contains the existing React/Vite frontend, Express backend, MySQL schema, API implementation, and previous phase verification work.

* Existing implementation and finalized backend behavior are authoritative when design work encounters an implementation-specific question.

* No approved logo, customer testimonials, performance benchmarks, or external brand assets are currently available.

* Future work must not fabricate unsupported product claims, testimonials, statistics, or brand assets.

## Product Principles

1. **Convenience through clarity:** Every role should understand its current state and next available action quickly.

2. **Preserve operational truth:** Subscription dates, booking state, payment state, payment references, skips, refund eligibility, and other operational information must remain accurate and backend-authoritative.

3. **Support the complete mess relationship:** Subscriptions, skips, individual meals, bookings, payments, cancellations, refunds, and feedback work together without being conflated.

4. **Reduce manual administration:** Give mess operators useful daily visibility and clear workflows for operations requiring administrative action.

5. **Make common student tasks obvious:** Today's meals, subscription information, booked meals, selected-date information, skips, and relevant actions should require minimal navigation.

6. **Keep the product calm and professional:** Visual refinement should improve hierarchy, scanability, confidence, and task completion rather than exist purely for decoration.

7. **Preserve established functionality:** Design improvements should be incremental and must not silently change backend contracts or finalized business behavior.

## Date and Status Presentation

* Backend and API dates remain in `YYYY-MM-DD` format.

* User-facing dates should use the established reusable `formatDate()` utility and display in `DD-MM-YYYY` format.

* Status indicators should use clear human-readable labels and consistent visual treatment throughout the application.

* Backend state remains authoritative. Frontend styling must never imply a status or eligibility state that the backend does not confirm.

## Accessibility & Inclusion

* Use clear status language and sufficient visual contrast.

* Keep text and important numerical information legible across supported screen sizes.

* Interactive controls should provide clear hover, focus, disabled, loading, success, and error states where applicable.

* Important actions should be keyboard accessible.

* Touch targets should remain practical on mobile devices.

* Use appropriate date-selection affordances where they provide good usability.

* Do not rely on color alone to communicate booking, payment, subscription, skip, cancellation, or refund status.
