import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BellOff,
  CheckCheck,
  Clock,
  TriangleAlert,
  Syringe,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PAGE_LIMIT = 10;
const REFRESH_EVERY_MS = 60 * 1000;
const DATE_DEBOUNCE_MS = 350; // wait until the user stops typing a date before loading it
const MIN_DATE = '1900-01-01';
const MAX_DATE = '2100-12-31';
const DAY = 24 * 60 * 60 * 1000;

const EMPTY_VIEW = {
  key: '', // which date + page this data belongs to ('' = nothing loaded yet)
  alerts: [],
  pagination: { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 },
  error: '',
};

const dateInputClass =
  'block w-fit bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all cursor-pointer';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

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

const sameData = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const setAlertStatus = (view, id, status) => ({
  ...view,
  alerts: view.alerts.map((a) => (a._id === id ? { ...a, status } : a)),
});

// How urgent is this alert right now? Alerts exist from the start of the due day onwards.
const getUrgency = (dueIso, now) => {
  const daysLate = Math.round((startOfDay(now) - startOfDay(new Date(dueIso).getTime())) / DAY);

  if (daysLate > 0) {
    return {
      icon: TriangleAlert,
      label: `Overdue by ${plural(daysLate, 'day')}`,
      border: 'border-l-red-500',
      iconBox: 'bg-red-500/10 text-red-400 border-red-500/30',
      tag: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
  }

  return {
    icon: Clock,
    label: 'Due today',
    border: 'border-l-amber-500',
    iconBox: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    tag: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
};

const AlertsView = () => {
  const navigate = useNavigate();

  const [view, setView] = useState(EMPTY_VIEW);
  const [date, setDate] = useState(getLocalToday); // the date the list is loaded for
  const [dateInput, setDateInput] = useState(date); // what the date box shows (can be half-typed)
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Loading is derived: the data on screen belongs to another date/page until the new response arrives
  const loading = view.key !== `${date}|${page}`;
  const { alerts, pagination, error } = view;

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

        // Same data as before -> keep the old state, so React does not re-render for nothing
        const next = { key, alerts: data.alerts, pagination: data.pagination, error: '' };
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

  // Box left empty or half-typed when the user clicks away -> show the date that is really loaded
  const handleDateBlur = () => {
    if (!isUsableDate(dateInput)) setDateInput(date);
  };

  const reload = () => {
    setView(EMPTY_VIEW);
    setRefreshKey((k) => k + 1);
  };

  // 3. Mark as read: shown immediately, undone if the server says no
  const handleMarkAsRead = async (id) => {
    setView((prev) => setAlertStatus(prev, id, 'read'));
    try {
      await axios.patch(`/api/v1/alerts/${id}/read`, {}, { withCredentials: true });
    } catch (err) {
      console.error('Error marking alert as read:', err);
      setView((prev) => setAlertStatus(prev, id, 'unread'));
      toast.error(err.response?.data?.message || 'Failed to mark alert as read.');
    }
  };

  const isToday = date === getLocalToday();

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
              className="animate-pulse bg-slate-900 border border-slate-800 border-l-4 border-l-slate-700 rounded-2xl p-5 flex gap-4"
            >
              <div className="h-10 w-10 bg-slate-800 rounded-xl shrink-0"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                <div className="h-3 bg-slate-800 rounded w-1/4"></div>
              </div>
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
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 px-4 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <BellOff className="w-12 h-12 text-slate-600" />
          <p className="text-base font-semibold text-slate-300">
            {isToday ? 'No vaccines are due today.' : `No alerts for ${formatLongDate(date)}.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => {
            const urgency = getUrgency(alert.dueDate, now);
            const UrgencyIcon = urgency.icon;
            const isUnread = alert.status === 'unread';

            return (
              <li
                key={alert._id}
                className={`flex flex-col sm:flex-row sm:items-center gap-4 border border-slate-800 border-l-4 ${urgency.border} rounded-2xl p-5 shadow-xl ${
                  isUnread ? 'bg-slate-900' : 'bg-slate-900/50'
                }`}
              >
                {/* Urgency icon */}
                <div className={`p-2.5 rounded-xl border shrink-0 w-fit ${urgency.iconBox}`}>
                  <UrgencyIcon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {isUnread && (
                      <span
                        role="img"
                        aria-label="Unread"
                        title="Unread"
                        className="w-2 h-2 rounded-full bg-blue-500 shrink-0"
                      />
                    )}
                    <h3
                      className={`text-base break-words ${
                        isUnread ? 'font-bold text-white' : 'font-medium text-slate-400'
                      }`}
                    >
                      {alert.vaccineName}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${urgency.tag}`}>
                      {urgency.label}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {alert.patientName}
                    </span>
                    {alert.recommendedAge && (
                      <span className="flex items-center gap-1.5">
                        <Syringe className="w-3.5 h-3.5" />
                        Recommended at {alert.recommendedAge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions (wrap on very narrow phones instead of overflowing the card) */}
                <div className="flex flex-wrap sm:flex-nowrap sm:flex-col gap-2 shrink-0">
                  <Button
                    onClick={() => navigate(`/dashboard/patient-vaccination/${alert.patientId}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Syringe className="w-4 h-4" />
                    <span>Open vaccination card</span>
                  </Button>
                  {isUnread && (
                    <Button
                      variant="outline"
                      onClick={() => handleMarkAsRead(alert._id)}
                      className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-xs flex items-center gap-1.5 transition-all"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Mark as read</span>
                    </Button>
                  )}
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
