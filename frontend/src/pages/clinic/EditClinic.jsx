import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Building2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')); // 01 to 12
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')); // 00 to 59
const PERIODS = ['AM', 'PM'];

const EditClinic = () => {
  const { clinicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const preloadedClinic = location.state?.clinicData;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!preloadedClinic);
  const [errorMessage, setErrorMessage] = useState(null);

  // Time state variables
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');

  const [endHour, setEndHour] = useState('05');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState('PM');

  const mapDays = (daysArray = []) => {
    const dayMap = {
      Mon: 'Monday',
      Tue: 'Tuesday',
      Wed: 'Wednesday',
      Thu: 'Thursday',
      Fri: 'Friday',
      Sat: 'Saturday',
      Sun: 'Sunday',
    };
    return daysArray.map((day) => dayMap[day] || day);
  };

  // Helper to parse time string like "09:30 AM" into separate states
  const parseTimeString = (timeStr, defaultHour, defaultMinute, defaultPeriod) => {
    if (!timeStr) return { hour: defaultHour, minute: defaultMinute, period: defaultPeriod };
    try {
      const parts = timeStr.trim().split(' ');
      if (parts.length === 2) {
        const [timePart, periodPart] = parts;
        const [h, m] = timePart.split(':');
        return {
          hour: h ? h.padStart(2, '0') : defaultHour,
          minute: m ? m.padStart(2, '0') : defaultMinute,
          period: periodPart ? periodPart.toUpperCase() : defaultPeriod,
        };
      }
    } catch {
      // fallback if format differs
    }
    return { hour: defaultHour, minute: defaultMinute, period: defaultPeriod };
  };

  const [formData, setFormData] = useState({
    clinicName: preloadedClinic?.clinicName || preloadedClinic?.name || '',
    phone: preloadedClinic?.phone || preloadedClinic?.phoneNumber || '',
    email: preloadedClinic?.email || '',
    address: preloadedClinic?.address || '',
    city: preloadedClinic?.city || '',
    consultationFee: preloadedClinic?.consultationFee ?? '',
    totalBeds: preloadedClinic?.totalBeds ?? '',
    workingDays: mapDays(preloadedClinic?.workingDays || []),
    startTime: preloadedClinic?.startTime || '',
    endTime: preloadedClinic?.endTime || '',
  });

  // Initialize time states if preloaded data has start/end time
  useEffect(() => {
    if (preloadedClinic?.startTime) {
      const parsedStart = parseTimeString(preloadedClinic.startTime, '09', '00', 'AM');
      setStartHour(parsedStart.hour);
      setStartMinute(parsedStart.minute);
      setStartPeriod(parsedStart.period);
    }
    if (preloadedClinic?.endTime) {
      const parsedEnd = parseTimeString(preloadedClinic.endTime, '05', '00', 'PM');
      setEndHour(parsedEnd.hour);
      setEndMinute(parsedEnd.minute);
      setEndPeriod(parsedEnd.period);
    }
  }, [preloadedClinic]);

  // Update formData when time changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      startTime: `${startHour}:${startMinute} ${startPeriod}`,
      endTime: `${endHour}:${endMinute} ${endPeriod}`,
    }));
  }, [startHour, startMinute, startPeriod, endHour, endMinute, endPeriod]);

  // Backup Fetch: Agar direct URL se request aaye
  useEffect(() => {
    if (preloadedClinic) return;

    const fetchClinicDetails = async () => {
      try {
        setFetching(true);
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
        const response = await axios.get(`/api/v1/clinics/${clinicId}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        const clinicData = response.data?.data?.clinic || response.data?.data || response.data;

        if (clinicData) {
          setFormData({
            clinicName: clinicData.clinicName || clinicData.name || '',
            phone: clinicData.phone || clinicData.phoneNumber || '',
            email: clinicData.email || '',
            address: clinicData.address || '',
            city: clinicData.city || '',
            consultationFee: clinicData.consultationFee ?? '',
            totalBeds: clinicData.totalBeds ?? '',
            workingDays: mapDays(clinicData.workingDays || []),
            startTime: clinicData.startTime || '',
            endTime: clinicData.endTime || '',
          });

          if (clinicData.startTime) {
            const parsedStart = parseTimeString(clinicData.startTime, '09', '00', 'AM');
            setStartHour(parsedStart.hour);
            setStartMinute(parsedStart.minute);
            setStartPeriod(parsedStart.period);
          }
          if (clinicData.endTime) {
            const parsedEnd = parseTimeString(clinicData.endTime, '05', '00', 'PM');
            setEndHour(parsedEnd.hour);
            setEndMinute(parsedEnd.minute);
            setEndPeriod(parsedEnd.period);
          }
        }
      } catch (err) {
        setErrorMessage(err.response?.data?.message || "Failed to load clinic details.");
      } finally {
        setFetching(false);
      }
    };

    if (clinicId) {
      fetchClinicDetails();
    }
  }, [clinicId, preloadedClinic]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => {
      const exists = prev.workingDays.includes(day);
      const updatedDays = exists
        ? prev.workingDays.filter((d) => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: updatedDays };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.workingDays.length === 0) {
      setErrorMessage("Please select at least one working day.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const response = await axios.patch(
        `/api/v1/clinics/${clinicId}`,
        {
          ...formData,
          consultationFee: Number(formData.consultationFee),
          totalBeds: Number(formData.totalBeds),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data?.statusCode === 200 || response.data?.success || response.status === 200) {
        navigate('/dashboard/clinic');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to update clinic details.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Loading clinic details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard/clinic')}
          className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Clinics
        </button>
      </div>

      <div className="bg-[#0b1329]/80 border border-slate-800/80 text-white rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800/80 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            Edit Clinic Details
          </h1>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-start gap-3 text-red-400">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1 text-xs sm:text-sm">
              <h4 className="font-semibold text-red-400 mb-0.5">Error Occurred</h4>
              <p className="text-red-300/90 leading-relaxed">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Clinic Name *</label>
              <input
                type="text"
                name="clinicName"
                required
                value={formData.clinicName}
                onChange={handleChange}
                className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Phone Number *</label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">City *</label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Full Address *</label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Consultation Fee (PKR) *</label>
              <input
                type="number"
                name="consultationFee"
                required
                value={formData.consultationFee}
                onChange={handleChange}
                className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Total Beds *</label>
              <input
                type="number"
                name="totalBeds"
                required
                value={formData.totalBeds}
                onChange={handleChange}
                className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Time Selectors Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Start Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Start Time *</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="bg-[#060b18] border border-slate-800 rounded-xl px-2 sm:px-3 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h} className="bg-[#0b1329] text-white">{h} Hr</option>
                  ))}
                </select>

                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  className="bg-[#060b18] border border-slate-800 rounded-xl px-2 sm:px-3 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m} className="bg-[#0b1329] text-white">{m} Min</option>
                  ))}
                </select>

                <select
                  value={startPeriod}
                  onChange={(e) => setStartPeriod(e.target.value)}
                  className="bg-[#060b18] border border-slate-800 rounded-xl px-2 sm:px-3 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                >
                  {PERIODS.map((p) => (
                    <option key={p} value={p} className="bg-[#0b1329] text-white">{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">End Time *</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="bg-[#060b18] border border-slate-800 rounded-xl px-2 sm:px-3 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h} className="bg-[#0b1329] text-white">{h} Hr</option>
                  ))}
                </select>

                <select
                  value={endMinute}
                  onChange={(e) => setEndMinute(e.target.value)}
                  className="bg-[#060b18] border border-slate-800 rounded-xl px-2 sm:px-3 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m} className="bg-[#0b1329] text-white">{m} Min</option>
                  ))}
                </select>

                <select
                  value={endPeriod}
                  onChange={(e) => setEndPeriod(e.target.value)}
                  className="bg-[#060b18] border border-slate-800 rounded-xl px-2 sm:px-3 py-2.5 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                >
                  {PERIODS.map((p) => (
                    <option key={p} value={p} className="bg-[#0b1329] text-white">{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Working Days *</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = formData.workingDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-[#060b18] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => navigate('/dashboard/clinic')}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 text-sm font-medium hover:bg-slate-800/50 transition text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-600/20 transition text-center"
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClinic;