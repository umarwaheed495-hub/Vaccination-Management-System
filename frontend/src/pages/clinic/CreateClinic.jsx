import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

const CreateClinic = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [startPeriod, setStartPeriod] = useState('AM');

  const [endHour, setEndHour] = useState('05');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState('PM');

  const [formData, setFormData] = useState({
    clinicName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    consultationFee: '',
    totalBeds: '',
    workingDays: [],
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      startTime: `${startHour}:${startMinute} ${startPeriod}`,
      endTime: `${endHour}:${endMinute} ${endPeriod}`,
    }));
  }, [startHour, startMinute, startPeriod, endHour, endMinute, endPeriod]);

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
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/v1/clinics/create',
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

      if (response.data?.statusCode === 201 || response.data?.success) {
        navigate('/dashboard/clinic');
      }
    } catch (err) {
      const backendError = err.response?.data?.message || "Validation failed. Please verify your data and try again.";
      setErrorMessage(backendError);
    } finally {
      setLoading(false);
    }
  };

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
            Register New Clinic
          </h1>
        </div>

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-start gap-3 text-red-400 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1 text-xs sm:text-sm">
              <h4 className="font-semibold text-red-400 mb-0.5">Validation Failed</h4>
              <p className="text-red-300/90 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-slate-400 hover:text-white transition"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Working Days *</label>
            <p className="text-[11px] text-slate-400 mb-2">Select the working days for this clinic.</p>
            <div className="flex flex-wrap gap-2.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = formData.workingDays.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20'
                        : 'bg-[#060b18] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Clinic Name *</label>
              <input
                type="text"
                name="clinicName"
                required
                value={formData.clinicName}
                onChange={handleChange}
                placeholder="Enter Your Clinic Name"
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
                placeholder="Enter Your Clinic Phone Number"
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
                placeholder="Enter Your Clinic Email Address"
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
                placeholder="Enter Your Clinic City"
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
              placeholder="Enter clinic full street address"
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
                placeholder="Enter consultation fee"
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
                placeholder="Enter total number of beds"
                className="w-full bg-[#060b18] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Time Selectors */}
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
                    <option key={h} value={h} className="bg-[#0b1329] text-white">
                      {h} Hr
                    </option>
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
                    <option key={h} value={h} className="bg-[#0b1329] text-white">
                      {h} Hr
                    </option>
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
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-600/20 transition text-center flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Creating Clinic...' : 'Register Clinic'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateClinic.displayName = "CreateClinic";

export default CreateClinic;