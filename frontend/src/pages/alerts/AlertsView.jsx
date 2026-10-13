import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Bell,
  BellOff,
  CheckCheck,
  Clock,
  TriangleAlert,
  Syringe,
  User,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PAGE_LIMIT = 10;
const REFRESH_EVERY_MS = 60 * 1000; // new alerts appear on their own, no page reload needed
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const selectClass =
  'bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-100 text-sm outline-none transition-all';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// Today / Tomorrow / Yesterday label for the date group heading
const dayLabel = (iso, now) => {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date(iso)) - startOfDay(new Date(now))) / DAY);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return null;
};

// How urgent is this alert right now?
const getUrgency = (dueIso, now) => {
  const diff = new Date(dueIso).getTime() - now;

  if (diff <= 0) {
    const over = -diff;
    let label = 'Due now';
    if (over >= DAY) label = `Overdue by ${plural(Math.floor(over / DAY), 'day')}`;
    else if (over >= HOUR) label = `Overdue by ${plural(Math.floor(over / HOUR), 'hour')}`;

    return {
      icon: TriangleAlert,
      label,
      border: 'border-l-red-500',
      iconBox: 'bg-red-500/10 text-red-400 border-red-500/30',
      tag: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
  }

  const label =
    diff >= DAY
      ? `Due in ${plural(Math.ceil(diff / DAY), 'day')}`
      : `Due in ${plural(Math.max(1, Math.ceil(diff / HOUR)), 'hour')}`;

  return {
    icon: Clock,
    label,
    border: 'border-l-amber-500',
    iconBox: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    tag: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
};

// The list arrives already sorted by due date. Put alerts with the same date under one heading.
const groupByDate = (alerts) => {
  const groups = [];
  alerts.forEach((alert) => {
    const key = new Date(alert.dueDate).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(alert);
    else groups.push({ key, dueDate: alert.dueDate, items: [alert] });
  });
  return groups;
};

const AlertsView = () => {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 });

  const [status, setStatus] = useState(''); // '' | 'unread' | 'read'
  const [sort, setSort] = useState('asc'); // asc = earliest due date first (overdue on top)
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Background refreshes should not flash the loading skeleton or spam error toasts
  const silentRef = useRef(false);

  // 1. Fetch alerts from backend (status / sort / page change, or refresh)
  useEffect(() => {
    let ignore = false;
    const silent = silentRef.current;
    silentRef.current = false;

    const fetchAlerts = async () => {
      try {
        if (!silent) setLoading(true);
        setError('');

        const params = { page, limit: PAGE_LIMIT, sort };
        if (status) params.status = status;

        const response = await axios.get('/api/v1/alerts', { params, withCredentials: true });
        if (ignore) return;

        const data = response.data?.data;

        // Page became empty (e.g. last alert disappeared) -> go back one page
        if (data.alerts.length === 0 && page > 1) {
          setPage(page - 1);
          return;
        }

        setAlerts(data.alerts);
        setUnreadCount(data.unreadCount);
        setPagination(data.pagination);
        setNow(Date.now());
      } catch (err) {
        if (ignore || silent) return;
        console.error('Error fetching alerts:', err);
        const message = err.response?.data?.message || 'Failed to fetch alerts.';
        setError(message);
        toast.error(message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchAlerts();
    return () => {
      ignore = true;
    };
  }, [status, sort, page, refreshKey]);

  // 2. Auto refresh every minute so newly created alerts show up by themselves
  useEffect(() => {
    const timer = setInterval(() => {
      silentRef.current = true;
      setRefreshKey((k) => k + 1);
    }, REFRESH_EVERY_MS);
    return () => clearInterval(timer);
  }, []);

  const reload = () => setRefreshKey((k) => k + 1);

  const changeStatus = (value) => {
    setStatus(value);
    setPage(1);
  };

  const changeSort = (value) => {
    setSort(value);
    setPage(1);
  };

  // 3. Mark as read - PATCH /api/v1/alerts/:id/read (alert stays until the vaccine is given)
  const handleMarkAsRead = async (id) => {
    try {
      setBusyId(id);
      await axios.patch(`/api/v1/alerts/${id}/read`, {}, { withCredentials: true });
      silentRef.current = true;
      reload();
    } catch (err) {
      console.error('Error marking alert as read:', err);
      toast.error(err.response?.data?.message || 'Failed to mark alert as read.');
    } finally {
      setBusyId(null);
    }
  };

  const groups = groupByDate(alerts);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative p-3 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Vaccine Alerts</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Appear 12 hours before a patient's vaccine is due and stay until it is given.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-400">
          {unreadCount > 0
            ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}`
            : 'No unread alerts'}
        </p>
      </div>

      {/* Filter & Sort */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value)}
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="">All alerts</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-500" />
          <select
            value={sort}
            onChange={(e) => changeSort(e.target.value)}
            className={selectClass}
            aria-label="Sort by due date"
          >
            <option value="asc">Due date: earliest first</option>
            <option value="desc">Due date: latest first</option>
          </select>
        </div>

        {status && (
          <Button
            variant="ghost"
            onClick={() => changeStatus('')}
            className="text-slate-400 hover:text-white hover:bg-slate-800 text-sm rounded-xl"
          >
            Clear filter
          </Button>
        )}
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
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-slate-900 border border-slate-800 rounded-2xl text-center px-4">
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
            {status ? 'No alerts match this filter.' : 'No vaccines are due right now.'}
          </p>
          <p className="text-xs text-slate-500 max-w-sm">
            {status
              ? 'Try clearing the filter.'
              : "An alert appears here 12 hours before a patient's vaccine is due, and stays until you mark that vaccine as given."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const relative = dayLabel(group.dueDate, now);

            return (
              <section key={group.key} className="space-y-3">
                {/* Date heading */}
                <div className="flex items-baseline gap-2 px-1">
                  {relative && <h2 className="text-sm font-bold text-white">{relative}</h2>}
                  <h2 className={relative ? 'text-sm text-slate-400' : 'text-sm font-bold text-white'}>
                    {formatDate(group.dueDate)}
                  </h2>
                  <span className="text-xs text-slate-500">
                    {plural(group.items.length, 'vaccine')}
                  </span>
                </div>

                <ul className="space-y-3">
                  {group.items.map((alert) => {
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
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Unread" />
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

                        {/* Actions */}
                        <div className="flex sm:flex-col gap-2 shrink-0">
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
                              disabled={busyId === alert._id}
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
              </section>
            );
          })}
        </div>
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
