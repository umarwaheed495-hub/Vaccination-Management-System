import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Building2, MapPin, Phone, Mail, Clock,
  Calendar, DollarSign, Bed, Pencil, Trash2, Loader2, Users
} from 'lucide-react';
import axios from 'axios';

const ClinicView = () => {
  const navigate = useNavigate();
  
  const [doctorName, setDoctorName] = useState(() => localStorage.getItem('doctorName') || '');
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  // 1. Fetch Clinics & Sync Doctor Name
  const fetchClinics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const savedName = localStorage.getItem('doctorName');
      if (savedName) {
        setDoctorName(savedName);
      }

      const response = await axios.get('http://localhost:8000/api/v1/clinics/my-clinics', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (response.data?.data) {
        setClinics(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch clinics from API:", error);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // 2. Toggle Status Logic (Single Active Rule)
  const handleToggleStatus = async (clinicId) => {
    try {
      setTogglingId(clinicId);
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(
        `http://localhost:8000/api/v1/clinics/toggle-status/${clinicId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        await fetchClinics();
      }
    } catch (error) {
      console.error("Failed to toggle clinic status:", error);
      alert(error.response?.data?.message || "Failed to update status. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  // 3. Delete Clinic
  const handleDelete = async (id, isClinicActive) => {
    if (isClinicActive) {
      alert("Active clinic cannot be deleted! Please switch or activate another clinic first.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this clinic?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8000/api/v1/clinics/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        setClinics((prev) => prev.filter((c) => (c._id || c.id) !== id));
      } catch (error) {
        console.error("Failed to delete clinic:", error);
        alert(error.response?.data?.message || "Failed to delete clinic. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome Dr. <span className="text-blue-500">{doctorName}</span>!
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            You have {clinics.length} registered clinic(s)
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/create-clinic')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center gap-2 px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Clinic</span>
        </button>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#0b1329]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 h-[340px] animate-pulse space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-slate-800/80 rounded-xl"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-800/80 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-800/50 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="h-16 bg-slate-900/60 rounded-xl"></div>
                <div className="h-4 bg-slate-800/50 rounded w-1/3"></div>
              </div>
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="h-9 bg-slate-800/60 rounded-xl w-full"></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-9 bg-slate-800/60 rounded-xl"></div>
                  <div className="h-9 bg-slate-800/60 rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : clinics.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 mt-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4 shadow-xl min-h-[380px]">
          <div className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20">
            <Building2 className="w-10 h-10" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-bold text-white">No Registered Clinics Found</h3>
            <p className="text-slate-400 text-sm">
              You haven't added any clinics yet. Click the button below to register your first clinic.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/create-clinic')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center gap-2 px-6 py-2.5 rounded-xl transition shadow-md mt-2"
          >
            <Plus className="w-5 h-5" />
            <span>Register First Clinic</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {clinics.map((clinic) => {
            const clinicId = clinic._id || clinic.id;
            const shortDays = (clinic.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
              .map((d) => d.slice(0, 3));
            const isClinicActive = clinic.isActive ?? false;
            const isToggling = togglingId === clinicId;
            
            // Backend se aane wala totalPatients count yahan use ho raha hai
            const totalPatientsCount = clinic.totalPatients ?? 0;

            return (
              <div
                key={clinicId}
                className="bg-[#0b1329]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-white flex flex-col justify-between gap-4 shadow-xl hover:border-slate-700/80 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2.5 sm:p-3 bg-blue-600/15 rounded-xl text-blue-400 border border-blue-500/20 shrink-0 mt-0.5">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-white leading-snug truncate">
                          {clinic.clinicName || clinic.name || 'Clinic'}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{clinic.address}{clinic.city ? `, ${clinic.city}` : ''}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleStatus(clinicId)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                          isClinicActive ? 'bg-emerald-500' : 'bg-slate-700'
                        } ${isToggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                      >
                        {isToggling ? (
                          <span className="w-full flex justify-center items-center text-white">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          </span>
                        ) : (
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ${
                              isClinicActive ? 'translate-x-5' : 'translate-x-0.5'
                            }`}
                          />
                        )}
                      </button>
                      <span className={`text-[10px] font-semibold uppercase ${isClinicActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {isClinicActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#060b18]/60 border border-slate-800/50 rounded-xl p-3 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-slate-300 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{clinic.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{clinic.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                    <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-slate-400">Timing:</span>
                    <span className="font-semibold text-slate-100">
                      {clinic.startTime && clinic.endTime
                        ? `${clinic.startTime} - ${clinic.endTime}`
                        : '09:00 AM - 05:00 PM'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0 mr-1" />
                    {shortDays.map((day, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-800/70 text-slate-300 text-[11px] font-medium rounded border border-slate-700/50"
                      >
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* Total Patients Badge (Backend Aggregation Result) */}
                  <div className="flex items-center justify-between pt-1 text-xs bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-slate-400">Total Patients:</span>
                    </div>
                    <span className="font-bold text-blue-400">{totalPatientsCount}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-1 font-medium">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-400">Fee:</span>
                      <span className="text-emerald-400 font-bold">PKR {clinic.consultationFee || 1000}</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-300">
                      <Bed className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-slate-400">Beds:</span>
                      <span className="font-bold text-slate-100">{clinic.totalBeds || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <button
                    onClick={() => navigate(`/dashboard/clinic/${clinicId}`)}
                    className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 font-medium text-xs h-9 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <span>View Details & Appointments</span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate(`/dashboard/edit-clinic/${clinicId}`, { state: { clinicData: clinic } })}
                      className="border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/70 text-xs font-medium h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDelete(clinicId, isClinicActive)}
                      title={isClinicActive ? "Active clinic cannot be deleted" : "Delete clinic"}
                      className={`border text-xs font-medium h-9 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 ${
                        isClinicActive
                          ? "border-slate-700/40 text-slate-500 bg-slate-800/30 cursor-not-allowed opacity-60"
                          : "border-red-500/40 text-red-500 hover:bg-red-500/10 hover:border-red-500/70"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClinicView;