import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CalendarDays,
  SkipForward,
} from "lucide-react";

import { formatDate } from "../utils/dateUtils";
import { getMeals } from "../services/mealService";
import { getMyDaySkips, createDaySkip } from "../services/daySkipService";
import BookingModal from "./BookingModal";

const getTodayString = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const dateToString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const stringToDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const isDateInRange = (date, startDate, endDate) => {
  if (!startDate || !endDate) return false;

  return date >= startDate && date <= endDate;
};

const CalendarSection = ({
  activeSubscription,
  bookings,
  onBookingsUpdated,
}) => {
  const today = getTodayString();

  const [selectedDate, setSelectedDate] = useState(today);

  const [displayMonth, setDisplayMonth] = useState(stringToDate(today));

  const [meals, setMeals] = useState([]);
  const [skips, setSkips] = useState([]);

  const [loadingMeals, setLoadingMeals] = useState(false);
  const [loadingSkips, setLoadingSkips] = useState(false);
  const [skipStateKnown, setSkipStateKnown] = useState(false);
  const [skipLoadError, setSkipLoadError] = useState("");
  const [skipLoading, setSkipLoading] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedMeal, setSelectedMeal] = useState(null);
  const [skipConfirmationOpen, setSkipConfirmationOpen] = useState(false);

  /*
   * Load all existing skipped dates.
   */
  useEffect(() => {
    const loadSkips = async () => {
      try {
        setLoadingSkips(true);
        setSkipLoadError("");

        const response = await getMyDaySkips();

        if (response.success) {
          setSkips(response.skips || []);
          setSkipStateKnown(true);
        }
      } catch (err) {
        console.error("Failed to load skipped days:", err);
        setSkipLoadError("Skipped-day information could not be loaded. Skip actions are unavailable until you refresh.");
        setSkipStateKnown(false);
      } finally {
        setLoadingSkips(false);
      }
    };

    loadSkips();
  }, []);

  /*
   * Load meals whenever the selected date changes.
   */
  useEffect(() => {
    const loadSelectedDateMeals = async () => {
      try {
        setLoadingMeals(true);
        setError("");
        setSuccessMessage("");

        const response = await getMeals(selectedDate);

        if (response.success) {
          setMeals(response.meals || []);
        }
      } catch (err) {
        console.error("Failed to load selected date meals:", err);

        setMeals([]);

        setError(
          err.response?.data?.message || "Failed to load meals for this date",
        );
      } finally {
        setLoadingMeals(false);
      }
    };

    loadSelectedDateMeals();
  }, [selectedDate]);

  /*
   * Build the calendar days for the currently displayed month.
   */
  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    /*
     * Convert Sunday = 0 into Monday = 0.
     */
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const daysInMonth = lastDay.getDate();

    const days = [];

    /*
     * Empty cells before the first day.
     */
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    /*
     * Actual month dates.
     */
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [displayMonth]);

  const monthName = displayMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const subscriptionStartDate = activeSubscription
    ? stringToDate(activeSubscription.start_date)
    : null;

  const subscriptionEndDate = activeSubscription
    ? stringToDate(activeSubscription.end_date)
    : null;

  const selectedDateObject = stringToDate(selectedDate);

  const selectedDateIsInSubscription = isDateInRange(
    selectedDateObject,
    subscriptionStartDate,
    subscriptionEndDate,
  );

  const selectedDateIsPast = selectedDate < today;

  const selectedDateIsSkipped = skips.some(
    (skip) =>
      skip.subscription_id === activeSubscription?.subscription_id &&
      skip.skip_date === selectedDate,
  );

  const subscriptionSkipCount = activeSubscription
    ? skips.filter(
        (skip) => skip.subscription_id === activeSubscription.subscription_id,
      ).length
    : 0;


  const getMealBooking = (mealId) =>
    bookings.find((booking) => booking.meal_id === mealId);

  const isMealCoveredBySubscription =
    Boolean(activeSubscription) &&
    skipStateKnown &&
    selectedDateIsInSubscription &&
    !selectedDateIsSkipped;

  const canSkipSelectedDate =
    Boolean(activeSubscription) &&
    !selectedDateIsPast &&
    selectedDateIsInSubscription &&
    !selectedDateIsSkipped &&
    subscriptionSkipCount < 5;

  const handlePreviousMonth = () => {
    setDisplayMonth(
      new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setDisplayMonth(
      new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1),
    );
  };

  const handleDateSelect = (date) => {
    if (!date) return;

    setSelectedDate(dateToString(date));
    setSuccessMessage("");
    setError("");
  };

  const handleDateInput = (event) => {
    const nextDate = event.target.value;
    if (!nextDate) return;

    setDisplayMonth(stringToDate(nextDate));
    setSelectedDate(nextDate);
    setSuccessMessage("");
    setError("");
  };

  const handleSkipDay = async () => {
    if (!activeSubscription || !canSkipSelectedDate) {
      return;
    }

    try {
      setSkipLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await createDaySkip(
        activeSubscription.subscription_id,
        selectedDate,
      );

      if (response.success) {
        /*
         * Add the newly skipped date locally.
         */
        setSkips((currentSkips) => [...currentSkips, response.skip]);

        /*
         * The backend has already extended the subscription.
         * Use the backend's returned end date rather than
         * calculating it ourselves.
         */
        if (response.subscription) {
          /*
           * The parent dashboard owns the subscription object.
           * A custom event is used here so the dashboard can
           * refresh its subscription data in the next step.
           */
          window.dispatchEvent(
            new CustomEvent("subscriptionUpdated", {
              detail: response.subscription,
            }),
          );
        }

        setSuccessMessage(
          "Day skipped successfully. Your subscription has been extended by one day.",
        );
      }
    } catch (err) {
      console.error("Skip day error:", err);

      setError(err.response?.data?.message || "Failed to skip this day");
    } finally {
      setSkipLoading(false);
    }
  };

  const openBookingModal = (meal) => {
    if (!meal) return;
    setError("");
    setSuccessMessage("");
    setSelectedMeal(meal);
  };

  return (
    <section id="meal-calendar" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
            <CalendarDays size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">Meal Calendar</h2>

            <p className="text-sm text-gray-500">
              Select a date to view meals and manage your subscription day.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="calendar-date" className="mb-1 block text-xs font-medium text-slate-600">
              Jump to a date
            </label>
            <input
              id="calendar-date"
              type="date"
              value={selectedDate}
              onChange={handleDateInput}
              onClick={(event) => event.currentTarget.showPicker?.()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <p className="pb-2 text-xs text-slate-500">Type a date or use the calendar to update the service details.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)]">
        {/* Calendar */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-white hover:text-gray-900"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>

            <h3 className="font-semibold text-gray-900">{monthName}</h3>

            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-white hover:text-gray-900"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateString = dateToString(date);

              const isSelected = dateString === selectedDate;

              const isToday = dateString === today;

              const isSubscriptionStart =
                activeSubscription &&
                dateString === activeSubscription.start_date;

              const isSubscriptionEnd =
                activeSubscription &&
                dateString === activeSubscription.end_date;

              const isSkipped = skips.some(
                (skip) =>
                  skip.subscription_id ===
                    activeSubscription?.subscription_id &&
                  skip.skip_date === dateString,
              );

              const isSubscriptionDate =
                activeSubscription &&
                isDateInRange(date, subscriptionStartDate, subscriptionEndDate);

              return (
                <button
                  type="button"
                  key={dateString}
                  onClick={() => handleDateSelect(date)}
                  aria-pressed={isSelected}
                  aria-label={`${formatDate(dateString)}${isToday ? ', today' : ''}${isSubscriptionStart ? ', subscription starts' : ''}${isSubscriptionEnd ? ', subscription ends' : ''}${isSkipped ? ', skipped subscription day' : ''}`}
                  className={`
                    relative aspect-square rounded-xl text-sm font-medium
                    transition
                    ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-white"
                    }
                    ${
                      isSubscriptionDate && !isSelected
                        ? "ring-1 ring-emerald-200"
                        : ""
                    }
                  `}
                >
                  {date.getDate()}

                  {/* Today indicator */}
                  {isToday && (
                    <span
                      className={`
                        absolute bottom-1 left-1/2 h-1 w-1
                        -translate-x-1/2 rounded-full
                        ${isSelected ? "border border-slate-950 bg-white" : "bg-slate-950"}
                      `}
                    />
                  )}

                  {/* Start marker */}
                  {isSubscriptionStart && (
                    <span
                      className={`
                        absolute right-1 top-1 h-1.5 w-1.5
                        rounded-full
                        ${isSelected ? "border border-emerald-200 bg-emerald-100" : "bg-emerald-600"}
                      `}
                    />
                  )}

                  {/* End marker */}
                  {isSubscriptionEnd && (
                    <span
                      className={`
                        absolute left-1 top-1 h-1.5 w-1.5
                        rounded-full
                        ${isSelected ? "bg-white" : "bg-slate-600"}
                      `}
                    />
                  )}

                  {/* Skipped marker */}
                  {isSkipped && (
                    <span
                      className={`
                        absolute bottom-1 right-1 h-1.5 w-1.5
                        rounded-full
                        ${isSelected ? "bg-white" : "bg-rose-600"}
                      `}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar legend */}
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-950" />
              Today
            </span>

            {activeSubscription && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  Subscription starts
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                  Subscription ends
                </span>

                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-600" />
                  Skipped day
                </span>
              </>
            )}
          </div>
        </div>

        {/* Selected date details */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Selected Date
            </p>

            <h3 className="mt-1 text-xl font-bold text-gray-900">
              {formatDate(selectedDate)}
            </h3>
          </div>

          {activeSubscription && (
            <div className="mt-5 rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-medium text-emerald-700">
                Subscription Period
              </p>

              <p className="mt-1 text-sm font-semibold text-emerald-900">
                {formatDate(activeSubscription.start_date)} →{" "}
                {formatDate(activeSubscription.end_date)}
              </p>
            </div>
          )}

          {loadingMeals ? (
            <div className="mt-6 flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-200 border-t-emerald-600" />
            </div>
          ) : meals.length === 0 ? (
            <div className="mt-6 rounded-xl bg-gray-50 p-5 text-center">
              <p className="font-medium text-gray-700">No meals scheduled</p>

              <p className="mt-1 text-sm text-gray-500">
                There are no meals scheduled for this date.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Meals</p>

              {meals.map((meal) => {
                const mealBooking = getMealBooking(meal.meal_id);
                const bookingStatus = mealBooking?.booking_status;

                return (
                  <div
                    key={meal.meal_id}
                    className="rounded-xl border border-gray-100 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                          {meal.meal_type}
                        </p>

                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {meal.menu}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-semibold text-gray-700">
                        ₹{meal.price}
                      </span>
                    </div>

                    <div className="mt-3">
                      {bookingStatus === "confirmed" ? (
                        <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 size={15} />
                            Already booked
                          </span>
                          <Link
                            to="/student/bookings"
                            className="font-semibold text-emerald-700 hover:text-emerald-800"
                          >
                            Manage Booking
                          </Link>
                        </div>
                      ) : bookingStatus === "pending" ? (
                        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                          Payment pending verification
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openBookingModal(meal)}
                          disabled={selectedDateIsPast}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {bookingStatus === "cancelled"
                            ? "Rebook Meal"
                            : isMealCoveredBySubscription
                              ? "Book Extra Meal"
                              : "Book Meal"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeSubscription && (
            <div className="mt-5 border-t border-gray-100 pt-5">
              {skipLoadError ? (
                <div role="alert" className="rounded-xl bg-amber-50 p-4"><p className="font-semibold text-amber-900">Skip information unavailable</p><p className="mt-1 text-xs text-amber-800">{skipLoadError}</p></div>
              ) : selectedDateIsSkipped ? (
                <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
                  <CheckCircle2 className="mt-0.5 text-red-600" size={19} />

                  <div>
                    <p className="font-semibold text-red-800">
                      This day has been skipped
                    </p>

                    <p className="mt-1 text-xs text-red-700">
                      Your subscription already accounts for this skipped day.
                    </p>
                  </div>
                </div>
              ) : selectedDateIsPast ? (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="font-semibold text-gray-700">Past date</p>

                  <p className="mt-1 text-xs text-gray-500">
                    Past dates cannot be skipped.
                  </p>
                </div>
              ) : !selectedDateIsInSubscription ? (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="font-semibold text-gray-700">
                    Outside subscription period
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    This date is outside your current subscription period.
                  </p>
                </div>
              ) : subscriptionSkipCount >= 5 ? (
                <div className="rounded-xl bg-amber-50 p-4">
                  <p className="font-semibold text-amber-800">
                    Skip limit reached
                  </p>

                  <p className="mt-1 text-xs text-amber-700">
                    You have already used all 5 skips for this subscription.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Skips used</p>

                    <p className="text-sm font-semibold text-gray-900">
                      {subscriptionSkipCount} / 5
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSkipConfirmationOpen(true)}
                    disabled={
                      skipLoading || loadingSkips || !canSkipSelectedDate
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <SkipForward size={18} />

                    {skipLoading ? "Skipping..." : "Skip This Day"}
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {successMessage && (
            <div role="status" aria-live="polite" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          )}
          </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AlertDialog.Root
        open={skipConfirmationOpen}
        onOpenChange={(open) => !skipLoading && setSkipConfirmationOpen(open)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/45" />
          <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <AlertDialog.Popup className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl outline-none">
              <AlertDialog.Title className="text-lg font-bold text-slate-950">Skip this subscription day?</AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-slate-600">
                Skip {formatDate(selectedDate)} using 1 of your 5 available skips. Your subscription end date will be extended by one day after the server confirms it.
              </AlertDialog.Description>
              <div className="mt-5 flex gap-3">
                <AlertDialog.Close disabled={skipLoading} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Keep this day</AlertDialog.Close>
                <button
                  type="button"
                  onClick={async () => {
                    await handleSkipDay();
                    setSkipConfirmationOpen(false);
                  }}
                  disabled={skipLoading}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {skipLoading ? "Skipping..." : "Confirm skip"}
                </button>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {selectedMeal && (
        <BookingModal
          meal={selectedMeal}
          isCoveredBySubscription={
            getMealBooking(selectedMeal.meal_id)?.booking_status !==
              "cancelled" && isMealCoveredBySubscription
          }
          onClose={() => setSelectedMeal(null)}
          onSuccess={(response) => {
            setSelectedMeal(null);
            setSuccessMessage(
              response.message ||
                "Meal booking submitted and is awaiting payment verification.",
            );
            if (onBookingsUpdated) {
              onBookingsUpdated();
            }
          }}
        />
      )}
    </section>
  );
};

export default CalendarSection;
