import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { ArrowLeft, UserRound, Loader2, AlertTriangle, XCircle, Lock, Save } from 'lucide-react';

const inputClass =
  'w-full bg-[#060b18] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition disabled:opacity-60 disabled:cursor-not-allowed';
const labelClass = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2';

const EMPTY_FORM = {
  // standard fields (given at signup)
  name: '',
  letterpad: '',
  countryCode: '+92',
  phoneNumber: '',
  // optional fields
  mobileNumberWhatsapp: '',
  specialization: '',
  qualifications: '',
  experienceYears: '',
  gender: '',
  city: '',
  address: '',
  bio: '',
  avatar: '',
};

const EDITABLE_KEYS = Object.keys(EMPTY_FORM);

// API document -> form values (null/undefined become empty strings so inputs stay controlled)
const toForm = (doc = {}) =>
  EDITABLE_KEYS.reduce((acc, key) => {
    const value = doc[key];
    acc[key] = value === undefined || value === null ? EMPTY_FORM[key] : String(value);
    return acc;
  }, {});

const authConfig = () => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    withCredentials: true,
  };
};

const DoctorProfile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null); // read-only data (email, PMDC, ...)
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState(EMPTY_FORM); // last version stored on the server
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await axios.get('/api/v1/doctors/profile', {
          ...authConfig(),
          signal: controller.signal,
        });
        const doc = res.data?.data;
        if (doc) {
          setProfile(doc);
          setFormData(toForm(doc));
          setSavedForm(toForm(doc));
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setErrorMessage(err.response?.data?.message || 'Failed to load your profile.');
      } finally {
        if (!controller.signal.aborted) setFetching(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const isDirty = useMemo(
    () => EDITABLE_KEYS.some((key) => formData[key] !== savedForm[key]),
    [formData, savedForm]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(savedForm);
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // quick checks (the server validates everything again)
    if (!formData.name.trim()) return setErrorMessage('Name is required.');
    if (!formData.letterpad.trim()) return setErrorMessage('Letterpad / Clinic name is required.');
    if (!/^\+\d{1,4}$/.test(formData.countryCode.trim())) {
      return setErrorMessage('Country code must look like +92.');
    }
    if (!/^\d{6,15}$/.test(formData.phoneNumber.trim())) {
      return setErrorMessage('Phone number must contain 6 to 15 digits only.');
    }
    if (formData.experienceYears !== '' && !/^\d{1,2}$/.test(formData.experienceYears.trim())) {
      return setErrorMessage('Experience must be a whole number of years.');
    }

    // send only what changed
    const changes = {};
    EDITABLE_KEYS.forEach((key) => {
      if (formData[key] !== savedForm[key]) changes[key] = formData[key];
    });
    if (Object.keys(changes).length === 0) return;

    setSaving(true);
    try {
      const res = await axios.patch('/api/v1/doctors/profile', changes, authConfig());
      const updated = res.data?.data;
      if (updated) {
        setProfile(updated);
        setFormData(toForm(updated));
        setSavedForm(toForm(updated));

        // keep the login cache in sync so the sidebar card shows the new name/picture at once
        try {
          const cached = JSON.parse(localStorage.getItem('doctor')) || {};
          localStorage.setItem('doctor', JSON.stringify({ ...cached, ...updated }));
          localStorage.setItem('doctorName', updated.name || 'Doctor');
        } catch {
          /* cache is optional */
        }
      }
      toast.success(res.data?.message || 'Profile updated successfully');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="bg-[#0b1329]/80 border border-slate-800/80 text-white rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800/80 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <UserRound className="w-6 h-6 text-blue-500" />
            My Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">Update your details. Fields marked * are required.</p>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-start gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1 text-xs sm:text-sm">
              <h4 className="font-semibold text-red-400 mb-0.5">Error Occurred</h4>
              <p className="text-red-300/90 leading-relaxed">{errorMessage}</p>
            </div>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {/* ---------- Account (cannot be changed here) ---------- */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" /> Account (locked)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" value={profile?.email || ''} disabled readOnly className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>PMDC Number</label>
                <input type="text" value={profile?.pmdcNumber || ''} disabled readOnly className={inputClass} />
              </div>
            </div>
          </section>

          {/* ---------- Standard fields ---------- */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200">Basic details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label htmlFor="name" className={labelClass}>Full Name *</label>
                <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} maxLength={100} className={inputClass} />
              </div>
              <div>
                <label htmlFor="letterpad" className={labelClass}>Letterpad / Clinic Name *</label>
                <input id="letterpad" name="letterpad" type="text" value={formData.letterpad} onChange={handleChange} maxLength={150} className={inputClass} />
              </div>
              <div>
                <label htmlFor="phoneNumber" className={labelClass}>Phone Number *</label>
                <div className="flex gap-2">
                  <input
                    id="countryCode"
                    name="countryCode"
                    type="text"
                    value={formData.countryCode}
                    onChange={handleChange}
                    maxLength={5}
                    aria-label="Country code"
                    className={`${inputClass} !w-20 shrink-0 text-center`}
                  />
                  <input id="phoneNumber" name="phoneNumber" type="tel" inputMode="numeric" value={formData.phoneNumber} onChange={handleChange} maxLength={15} className={inputClass} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">This number is also your login.</p>
              </div>
              <div>
                <label htmlFor="mobileNumberWhatsapp" className={labelClass}>WhatsApp Number</label>
                <input id="mobileNumberWhatsapp" name="mobileNumberWhatsapp" type="tel" value={formData.mobileNumberWhatsapp} onChange={handleChange} maxLength={20} placeholder="Optional" className={inputClass} />
              </div>
            </div>
          </section>

          {/* ---------- Optional fields ---------- */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-slate-200">Professional details <span className="text-slate-500 font-normal">(optional)</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label htmlFor="specialization" className={labelClass}>Specialization</label>
                <input id="specialization" name="specialization" type="text" value={formData.specialization} onChange={handleChange} maxLength={100} placeholder="e.g. Paediatrics" className={inputClass} />
              </div>
              <div>
                <label htmlFor="qualifications" className={labelClass}>Qualifications</label>
                <input id="qualifications" name="qualifications" type="text" value={formData.qualifications} onChange={handleChange} maxLength={200} placeholder="e.g. MBBS, FCPS" className={inputClass} />
              </div>
              <div>
                <label htmlFor="experienceYears" className={labelClass}>Experience (years)</label>
                <input id="experienceYears" name="experienceYears" type="number" min="0" max="70" value={formData.experienceYears} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="gender" className={labelClass}>Gender</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="city" className={labelClass}>City</label>
                <input id="city" name="city" type="text" value={formData.city} onChange={handleChange} maxLength={80} className={inputClass} />
              </div>
              <div>
                <label htmlFor="avatar" className={labelClass}>Profile Picture URL</label>
                <input id="avatar" name="avatar" type="url" value={formData.avatar} onChange={handleChange} maxLength={500} placeholder="https://..." className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="address" className={labelClass}>Address</label>
              <input id="address" name="address" type="text" value={formData.address} onChange={handleChange} maxLength={250} className={inputClass} />
            </div>
            <div>
              <label htmlFor="bio" className={labelClass}>About / Bio</label>
              <textarea id="bio" name="bio" rows={4} value={formData.bio} onChange={handleChange} maxLength={500} className={`${inputClass} resize-y`} />
              <p className="text-[11px] text-slate-500 mt-1.5 text-right">{formData.bio.length}/500</p>
            </div>
          </section>

          <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || saving}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 text-sm font-medium hover:bg-slate-800/50 disabled:opacity-40 transition text-center"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={!isDirty || saving}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorProfile;
