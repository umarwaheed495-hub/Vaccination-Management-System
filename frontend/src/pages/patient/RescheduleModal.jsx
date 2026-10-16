import React, { useState, useEffect, useRef } from 'react';
import { CalendarClock, Calendar, ShieldCheck, X } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');

// Date -> "YYYY-MM-DD" using the local calendar day (the same day the card shows)
const toInputDate = (value) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// "YYYY-MM-DD" + days / months -> "YYYY-MM-DD". Adding a month to the 31st stops at the end of a shorter month.
const shiftDate = (inputDate, { days = 0, months = 0 }) => {
  const [y, m, d] = inputDate.split('-').map(Number);
  const firstOfMonth = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth() + 1, 0).getDate();
  return toInputDate(new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), Math.min(d, lastDay) + days));
};

const PRESETS = [
  { label: '+1 week', shift: { days: 7 } },
  { label: '+2 weeks', shift: { days: 14 } },
  { label: '+1 month', shift: { months: 1 } },
];

/**
 * Reschedule form for one due-date group. Same look as the "Update Vaccine Details" page:
 * header, info box, uppercase labels, rounded inputs, Cancel / primary action row.
 * Mounted only while it is open, so its date and selection always start from the card's current data.
 *
 * target = { items: [pending vaccines of the group], skipped: number of given ones left alone }
 * onConfirm(newDate, vaccineIds) - ids of the vaccines ticked in the list
 */
const RescheduleModal = ({ target, getName, submitting, onClose, onConfirm }) => {
  const today = toInputDate(new Date());
  const currentDate = toInputDate(target.items[0].dueDate);
  const { items, skipped } = target;

  // An overdue vaccine cannot go back in time: start from today instead
  const [date, setDate] = useState(currentDate >= today ? currentDate : today);
  const [selected, setSelected] = useState(() => new Set(items.map((item) => item._id)));
  const inputRef = useRef(null);

  const canPickVaccines = items.length > 1;
  const allSelected = selected.size === items.length;
  const canSubmit = selected.size > 0 && date >= today && date !== currentDate && !submitting;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [submitting, onClose]);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(items.map((item) => item._id)));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) onConfirm(date, items.filter((item) => selected.has(item._id)).map((item) => item._id));
  };

  // Presets count from the current due date, or from today when that date has already passed
  const presetBase = currentDate >= today ? currentDate : today;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-title"
        onSubmit={handleSubmit}
        className="w-full max-w-lg my-auto bg-[#0b1329] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6"
      >
        {/* Header (same pattern as the page headers) */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
          <div>
            <h2
              id="reschedule-title"
              className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2"
            >
              <CalendarClock className="w-6 h-6 text-blue-500" />
              <span>Reschedule Vaccines</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Choose a new recommended due date</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="p-2.5 bg-[#0b1329] border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current due date (same pattern as "Target Vaccine") */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider">Current Due Date</span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {new Date(target.items[0].dueDate).toLocaleDateString()}
            </h3>
          </div>
          <div className="p-3 bg-blue-600/15 text-blue-400 rounded-xl border border-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Vaccines of this group */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {canPickVaccines ? `Vaccines to Reschedule (${selected.size} of ${items.length})` : 'Vaccine'}
            </label>
            {canPickVaccines && (
              <button
                type="button"
                onClick={toggleAll}
                disabled={submitting}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 transition disabled:opacity-50"
              >
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            )}
          </div>

          <ul className="max-h-44 overflow-y-auto space-y-2 pr-1">
            {items.map((item) => {
              const isSelected = selected.has(item._id);
              return (
                <li key={item._id}>
                  <label
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition flex items-center gap-3 ${
                      canPickVaccines ? 'cursor-pointer' : ''
                    } ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500/50 text-white'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {canPickVaccines && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(item._id)}
                        disabled={submitting}
                        className="w-4 h-4 accent-blue-500"
                      />
                    )}
                    <span>{getName(item)}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          {skipped > 0 && (
            <p className="text-xs text-slate-400">
              {skipped} already given {skipped === 1 ? 'vaccine stays' : 'vaccines stay'} on the current date.
            </p>
          )}
        </div>

        {/* New due date */}
        <div className="space-y-2">
          <label
            htmlFor="reschedule-date"
            className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>New Due Date</span>
          </label>
          <input
            id="reschedule-date"
            ref={inputRef}
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            disabled={submitting}
            required
            className="w-full bg-slate-900/80 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition [color-scheme:dark]"
          />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                disabled={submitting}
                onClick={() => setDate(shiftDate(presetBase, preset.shift))}
                className="px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800/50 text-xs font-medium transition disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>
          {date && date < today && <p className="text-xs text-red-400">The new date cannot be in the past.</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800/50 text-sm font-medium transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Reschedule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RescheduleModal;
