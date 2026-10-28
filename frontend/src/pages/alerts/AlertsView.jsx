import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BellOff, Building2, CalendarClock, Clock, Loader2, Mail, TriangleAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PAGE_LIMIT = 10;
const REFRESH_EVERY_MS = 60 * 1000;
const DATE_DEBOUNCE_MS = 350; // wait until the user stops typing a date before loading it
const MIN_DATE = '1900-01-01';
const MAX_DATE = '2100-12-31';
const DAY = 24 * 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const COOLDOWN_JITTER_MS = 5000; // a new server value replaces the local deadline only if it differs by more than this
const TICK_MARGIN_MS = 50; // the timer fires just after the boundary, never just before it

const EMPTY_VIEW = {
  key: '', // which date + page this data belongs to ('' = nothing loaded yet)
  alerts: [],
  pagination: { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 },
  hasActiveClinic: true, // false = the doctor has no active clinic, so there is nothing to list (see the empty state)
  error: '',
};

const dateInputClass =
  'block w-fit bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all cursor-pointer';

// Today's date as "YYYY-MM-DD" using the device's local date (not UTC, which can be yesterday early in the morning)
const getLocalToday = () => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

// A complete date inside the range the backend accepts ("YYYY-MM-DD" strings compare correctly as text)
const isUsableDate = (value) => Boolean(value) && value >= MIN_DATE && value <= MAX_DATE;

const formatLongDate = (dateString) => {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const startOfDay = (ms) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const sameData = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const setAlertStatus = (view, id, status) => ({
  ...view,
  alerts: view.alerts.map((a) => (a._id === id ? { ...a, status } : a)),
});

// How urgent is this alert right now? Alerts exist for every vaccine that is not given, so the date filter can
// show past, today and future days.
// Overdue -> red warning icon, due today -> amber clock icon, upcoming -> blue calendar icon.
const getUrgency = (dueIso, now) => {
  const daysLate = Math.round((startOfDay(now) - startOfDay(new Date(dueIso).getTime())) / DAY);

  if (daysLate > 0) {
    return {
      icon: TriangleAlert,
      label: `Overdue by ${plural(daysLate, 'day')}`,
      border: 'border-l-red-500',
      iconBox: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
  }

  if (daysLate < 0) {
    const daysAhead = -daysLate;
    return {
      icon: CalendarClock,
      label: daysAhead === 1 ? 'Due tomorrow' : `Due in ${plural(daysAhead, 'day')}`,
      border: 'border-l-blue-500',
      iconBox: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    };
  }

  return {
    icon: Clock,
    label: 'Due today',
    border: 'border-l-amber-500',
    iconBox: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };
};

// Registered phone number -> WhatsApp format (country code + number, digits only).
// Numbers are stored as typed at registration, e.g. 0300 1234567, +92 300 1234567, 03001234567.
// A number without a country code is treated as a Pakistan number. Returns '' if it cannot be used.
const toWhatsAppNumber = (phone) => {
  let digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `92${digits.slice(1)}`;
  else if (digits.length === 10 && digits.startsWith('3')) digits = `92${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : '';
};

// Default message that is pre-filled in WhatsApp
const buildWhatsAppMessage = (alert) =>
  `Assalam o Alaikum! This is a reminder from your doctor's clinic that the ${alert.vaccineName} vaccine ` +
  `for ${alert.patientName} is due. Please visit the clinic at your earliest convenience to get the vaccine. Thank you.`;

// ---- Email cooldown -------------------------------------------------------------------------------
// The server sends "emailRetryAfterSeconds" (relative seconds, so a wrong device clock cannot break it).
// It is turned into a local deadline once. state = { deadlines: { [alertId]: epoch ms }, clock: epoch ms }.

// "emailRetryAfterSeconds" counts down on every refresh, so it is removed before comparing old and new data
const withoutRetry = (alert) => {
  const copy = { ...alert };
  delete copy.emailRetryAfterSeconds;
  return copy;
};

// Take the deadlines from a server response. Returns the SAME state when nothing really changed,
// so a silent background refresh does not re-render the page.
const syncCooldowns = (state, alerts, receivedAt) => {
  const deadlines = { ...state.deadlines };
  let changed = false;

  alerts.forEach((a) => {
    const local = deadlines[a._id];
    if (a.emailRetryAfterSeconds > 0) {
      const fromServer = receivedAt + a.emailRetryAfterSeconds * 1000;
      if (local === undefined || Math.abs(local - fromServer) > COOLDOWN_JITTER_MS) {
        deadlines[a._id] = fromServer;
        changed = true;
      }
    } else if (local !== undefined) {
      delete deadlines[a._id];
      changed = true;
    }
  });

  return changed ? { deadlines, clock: receivedAt } : state;
};

const withCooldown = (state, id, seconds) => {
  const nowMs = Date.now();
  return { deadlines: { ...state.deadlines, [id]: nowMs + seconds * 1000 }, clock: nowMs };
};

const tickClock = (state) => ({ ...state, clock: Date.now() });

// Milliseconds until the screen must be refreshed next: when a deadline passes, or when the "N min" text of a
// running cooldown changes. One timer is enough: it is always set for the nearest of these moments.
const getNextTickDelay = (deadlines, nowMs) => {
  let delay = null;
  Object.values(deadlines).forEach((deadline) => {
    const remaining = deadline - nowMs;
    if (remaining <= 0) return;
    const untilChange = ((remaining - 1) % MINUTE) + 1;
    if (delay === null || untilChange < delay) delay = untilChange;
  });
  return delay === null ? null : delay + TICK_MARGIN_MS;
};

// Why the Email button is not available ('' = it is available)
const getEmailBlockedReason = (alert, deadline, clock) => {
  if (!alert.hasEmail) return 'No email saved for this patient';
  if (deadline > clock) return `Available again in ${Math.ceil((deadline - clock) / MINUTE)} min`;
  return '';
};

const getWhatsAppLink = (alert) => {
  const number = toWhatsAppNumber(alert.patientPhone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(buildWhatsAppMessage(alert))}` : '';
};

// WhatsApp logo (lucide has no brand icons)
const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.04 21.8c-1.75 0-3.46-.47-4.96-1.36l-.36-.21-3.69.97.99-3.6-.23-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.99 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.49-8.41" />
  </svg>
);

const AlertsView = () => {
  const navigate = useNavigate();

  const [view, setView] = useState(EMPTY_VIEW);
  const [date, setDate] = useState(getLocalToday); // the date the list is loaded for
  const [dateInput, setDateInput] = useState(date); // what the date box shows (can be half-typed)
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [cooldowns, setCooldowns] = useState(() => ({ deadlines: {}, clock: Date.now() }));
  const [sendingIds, setSendingIds] = useState({}); // alert ids whose email request is running

  // Loading is derived: the data on screen belongs to another date/page until the new response arrives
  const loading = view.key !== `${date}|${page}`;
  const { alerts, pagination, hasActiveClinic, error } = view;

  // 1. Load the alerts of the selected date + page, and keep them fresh in the background
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const key = `${date}|${page}`;

    const fetchAlerts = async (silent) => {
      if (inFlight) return; // a slow request is still running, do not stack another one
      inFlight = true;
      try {
        const response = await axios.get('/api/v1/alerts', {
          params: { date, page, limit: PAGE_LIMIT },
          withCredentials: true,
        });
        if (cancelled) return;

        const data = response.data?.data;

        // This page no longer exists (alerts were given meanwhile) -> go straight to the last page that does
        if (data.alerts.length === 0 && page > 1) {
          setPage(Math.max(1, data.pagination.totalPages));
          return;
        }

        setCooldowns((prev) => syncCooldowns(prev, data.alerts, Date.now()));

        // Same data as before -> keep the old state, so React does not re-render for nothing
        // The server only returns alerts of the active clinic; hasActiveClinic === false explains an empty list
        const next = {
          key,
          alerts: data.alerts.map(withoutRetry),
          pagination: data.pagination,
          hasActiveClinic: data.hasActiveClinic !== false,
          error: '',
        };
        setView((prev) => (sameData(prev, next) ? prev : next));
        setNow((prev) => (startOfDay(prev) === startOfDay(Date.now()) ? prev : Date.now()));
      } catch (err) {
        if (cancelled || silent) return; // background refresh failures stay quiet; the next one retries
        console.error('Error fetching alerts:', err);
        const message = err.response?.data?.message || 'Failed to fetch alerts.';
        setView({ ...EMPTY_VIEW, key, error: message });
        toast.error(message, { id: 'alerts-load-error' });
      } finally {
        inFlight = false;
      }
    };

    fetchAlerts(false);

    // Background refresh: only while the tab is visible, and straight away when the user comes back to it
    const timer = setInterval(() => {
      if (!document.hidden) fetchAlerts(true);
    }, REFRESH_EVERY_MS);
    const onVisibilityChange = () => {
      if (!document.hidden) fetchAlerts(true);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [date, page, refreshKey]);

  // 2. Apply the date box only after typing stops (typing 10/14/2025 would otherwise load 8 other dates on the way)
  useEffect(() => {
    if (dateInput === date || !isUsableDate(dateInput)) return;
    const timer = setTimeout(() => {
      setDate(dateInput);
      setPage(1);
    }, DATE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [dateInput, date]);

  // 3. ONE timer, set for the nearest moment the Email buttons need a refresh (cleaned up on unmount)
  useEffect(() => {
    const delay = getNextTickDelay(cooldowns.deadlines, Date.now());
    if (delay === null) return;
    const timer = setTimeout(() => setCooldowns(tickClock), delay);
    return () => clearTimeout(timer);
  }, [cooldowns]);

  // Timers are slowed down in a hidden tab, so check the time again as soon as the tab is visible
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) setCooldowns(tickClock);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Box left empty or half-typed when the user clicks away -> show the date that is really loaded
  const handleDateBlur = () => {
    if (!isUsableDate(dateInput)) setDateInput(date);
  };

  const reload = () => {
    setView(EMPTY_VIEW);
    setRefreshKey((k) => k + 1);
  };

  // 4. Open the patient's vaccination card. The alert is marked as read at the same time
  //    (shown immediately, undone if the server says no). The mark-as-read call never blocks the navigation.
  const openPatientCard = (alert) => {
    if (alert.status === 'unread') {
      setView((prev) => setAlertStatus(prev, alert._id, 'read'));
      axios.patch(`/api/v1/alerts/${alert._id}/read`, {}, { withCredentials: true }).catch((err) => {
        console.error('Error marking alert as read:', err);
      });
    }
    navigate(`/dashboard/patient-vaccination/${alert.patientId}`);
  };

  // Keyboard support for the clickable card (ignore keys pressed on the Email / WhatsApp buttons inside it)
  const handleCardKeyDown = (e, alert) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPatientCard(alert);
    }
  };

  // Icon clicks must never open the vaccination card
  const stop = (e) => e.stopPropagation();

  const setSending = (id, isSending) =>
    setSendingIds((prev) => {
      const next = { ...prev };
      if (isSending) next[id] = true;
      else delete next[id];
      return next;
    });

  const startCooldown = (id, seconds) => {
    if (seconds > 0) setCooldowns((prev) => withCooldown(prev, id, seconds));
  };

  // Send the reminder email from the server. Never opens the patient card and never leaves the page.
  const handleSendEmail = async (e, alert, disabled) => {
    e.stopPropagation();
    if (disabled) return;

    setSending(alert._id, true);
    try {
      const response = await axios.post(`/api/v1/alerts/${alert._id}/email`, {}, { withCredentials: true });
      startCooldown(alert._id, response.data?.data?.retryAfterSeconds);
      toast.success(`Email sent to ${alert.patientName}`);
    } catch (err) {
      // 429 = another tab / click already sent it: follow the server's remaining time
      if (err.response?.status === 429) startCooldown(alert._id, err.response.data?.data?.retryAfterSeconds);
      toast.error(err.response?.data?.message || 'Failed to send the email.', { id: `alert-email-${alert._id}` });
    } finally {
      setSending(alert._id, false);
    }
  };

  const handleWhatsAppClick = (e, link) => {
    e.stopPropagation();
    if (!link) {
      e.preventDefault();
      toast.error('This patient has no valid phone number for WhatsApp.', { id: 'alert-wa-error' });
    }
  };

  const today = getLocalToday();
  const isToday = date === today;
  const isFuture = date > today;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Date filter (the only control on this page) */}
      <div className="flex justify-end items-center">
        <input
          type="date"
          value={dateInput}
          min={MIN_DATE}
          max={MAX_DATE}
          onChange={(e) => setDateInput(e.target.value)}
          onBlur={handleDateBlur}
          aria-label="Filter alerts by date"
          className={dateInputClass}
          style={{ colorScheme: 'dark' }}
        />
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="animate-pulse bg-slate-900 border border-slate-800 border-l-4 border-l-slate-700 rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="h-10 w-10 bg-slate-800 rounded-xl shrink-0"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-3 bg-slate-800 rounded w-1/2"></div>
              </div>
              <div className="h-10 w-10 bg-slate-800 rounded-xl shrink-0"></div>
              <div className="h-10 w-10 bg-slate-800 rounded-xl shrink-0"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center py-16 gap-3 bg-slate-900 border border-slate-800 rounded-2xl text-center px-4"
        >
          <TriangleAlert className="w-10 h-10 text-red-400" />
          <p className="text-base font-semibold text-slate-200">Could not load alerts</p>
          <p className="text-sm text-slate-400 max-w-sm">{error}</p>
          <Button
            variant="outline"
            onClick={reload}
            className="border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl"
          >
            Try again
          </Button>
        </div>
      ) : !hasActiveClinic ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 px-4 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Building2 className="w-12 h-12 text-slate-600" />
          <p className="text-base font-semibold text-slate-300">No active clinic</p>
          <p className="text-sm text-slate-400 max-w-sm">
            Alerts are shown only for your active clinic. Activate a clinic to see its vaccine alerts.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/clinic')}
            className="border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl"
          >
            Go to clinics
          </Button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 px-4 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <BellOff className="w-12 h-12 text-slate-600" />
          <p className="text-base font-semibold text-slate-300">
            {isToday
              ? 'No vaccines are due today.'
              : isFuture
                ? `No vaccines are scheduled for ${formatLongDate(date)}.`
                : `No alerts for ${formatLongDate(date)}.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => {
            const urgency = getUrgency(alert.dueDate, now);
            const UrgencyIcon = urgency.icon;
            const isUnread = alert.status === 'unread';
            const emailBlockedReason = getEmailBlockedReason(alert, cooldowns.deadlines[alert._id] ?? 0, cooldowns.clock);
            const isSendingEmail = Boolean(sendingIds[alert._id]);
            const emailDisabled = isSendingEmail || Boolean(emailBlockedReason);
            const whatsAppLink = getWhatsAppLink(alert);

            return (
              <li
                key={alert._id}
                role="link"
                tabIndex={0}
                aria-label={`Open vaccination card of ${alert.patientName}`}
                onClick={() => openPatientCard(alert)}
                onKeyDown={(e) => handleCardKeyDown(e, alert)}
                className={`flex items-center gap-4 border border-slate-800 border-l-4 ${urgency.border} rounded-2xl p-4 sm:p-5 shadow-xl cursor-pointer transition-colors hover:border-slate-700 hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isUnread ? 'bg-slate-900' : 'bg-slate-900/50'
                }`}
              >
                {/* Urgency icon: red warning = overdue, amber clock = due today, blue calendar = upcoming */}
                <div
                  role="img"
                  aria-label={urgency.label}
                  title={urgency.label}
                  className={`p-2.5 rounded-xl border shrink-0 ${urgency.iconBox}`}
                >
                  <UrgencyIcon className="w-5 h-5" />
                </div>

                {/* Patient name + due vaccine */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-base break-words ${
                      isUnread ? 'font-bold text-white' : 'font-medium text-slate-300'
                    }`}
                  >
                    {alert.patientName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400 break-words">{alert.vaccineName}</p>
                </div>

                {/* Email (sent by the server) + WhatsApp (right side, do not open the card) */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleSendEmail(e, alert, emailDisabled)}
                    aria-label={
                      emailBlockedReason
                        ? `Email ${alert.patientName}: ${emailBlockedReason}`
                        : `Send email to ${alert.patientName}`
                    }
                    aria-disabled={emailDisabled}
                    aria-busy={isSendingEmail}
                    title={isSendingEmail ? 'Sending email...' : emailBlockedReason || 'Send email'}
                    className={`p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 transition-colors ${
                      emailDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-blue-500/20 hover:text-blue-300 cursor-pointer'
                    }`}
                  >
                    {isSendingEmail ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                  </button>
                  <a
                    href={whatsAppLink || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleWhatsAppClick(e, whatsAppLink)}
                    onKeyDown={stop}
                    aria-label={`Send WhatsApp message to ${alert.patientName}`}
                    title="WhatsApp"
                    className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {!loading && !error && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-sm flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <span className="text-xs sm:text-sm text-slate-400 text-center">
            Page {pagination.page} of {pagination.totalPages}
            <span className="hidden sm:inline"> ({pagination.total} alerts)</span>
          </span>

          <Button
            variant="outline"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-sm flex items-center gap-1.5"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AlertsView;
