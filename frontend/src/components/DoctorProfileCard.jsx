import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Like the contact avatars of chat apps: the colour comes from the name, so a doctor always gets the same one
const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-teal-600',
];

const getAvatarColor = (name) => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

// "Dr. Umar Waheed" -> "UW", "Umar" -> "U"
const getInitials = (name) =>
  name
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

// Same rule as the PDF report: "Dr." is added unless the name already starts with it
const withTitle = (name) => (/^dr\.?\s/i.test(name) ? name : `Dr. ${name}`);

// The login already saved the doctor in localStorage: the card can show it at once, before the request answers
const readCachedDoctor = () => {
  try {
    return JSON.parse(localStorage.getItem('doctor')) || null;
  } catch {
    return null;
  }
};

/**
 * Compact "signed in as" card for the bottom of the sidebar (avatar, name, email), like a chat app's profile row.
 * Loads GET /api/v1/doctors/me once, when the dashboard opens.
 */
const DoctorProfileCard = () => {
  const [doctor, setDoctor] = useState(readCachedDoctor);
  const [loadFailed, setLoadFailed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('accessToken'); // the cookie is used first; the header is the fallback

    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/v1/doctors/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
          signal: controller.signal,
        });
        const profile = response.data?.data;
        if (profile) {
          setDoctor(profile);
          setImageFailed(false);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to load doctor profile:', error);
        setLoadFailed(true); // the cached doctor (if any) stays on screen
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, []);

  // Nothing known yet, request still running -> placeholder (not shown when the cached doctor is there)
  if (!doctor && !loadFailed) {
    return (
      <div className="pt-3 border-t border-slate-800" aria-hidden="true">
        <div className="flex items-center gap-3 p-2 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-800 rounded w-3/4" />
            <div className="h-2.5 bg-slate-800 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const name = doctor?.name?.trim() || '';
  const displayName = name ? withTitle(name) : 'Doctor';
  const email = doctor?.email || 'Signed in';
  const showImage = Boolean(doctor?.avatar) && !imageFailed;

  return (
    <div className="pt-3 border-t border-slate-800" role="group" aria-label="Signed in doctor">
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate('/doctor/profile')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate('/doctor/profile');
          }
        }}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors cursor-pointer"
        title={`${email === 'Signed in' ? displayName : `${displayName} - ${email}`} (open profile)`}
      >
        {/* Avatar: the picture if there is one, otherwise the initials on a colour; the green dot = signed in */}
        <div className="relative shrink-0">
          {showImage ? (
            <img
              src={doctor.avatar}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${getAvatarColor(name || 'Doctor')}`}
              aria-hidden="true"
            >
              {name ? getInitials(name) : 'Dr'}
            </div>
          )}
          <span
            className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"
            title="Signed in"
          />
        </div>

        {/* Name + email (the "about" line of a chat contact) */}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
          <p className="text-xs text-slate-400 truncate">{email}</p>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileCard;
