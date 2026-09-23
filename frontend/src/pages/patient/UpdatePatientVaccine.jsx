import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Syringe, ArrowLeft, Calendar, ShieldCheck, CheckCircle2, Building2, Search } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const UpdatePatientVaccine = () => {
  const { patientId, vaccineId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vaccineName, setVaccineName] = useState('');

  // Form states
  const [status, setStatus] = useState('Pending');
  const [brandName, setBrandName] = useState('');
  const [givenDate, setGivenDate] = useState('');

  // Brands states for dropdown & search
  const [brandsList, setBrandsList] = useState([]);
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 1. Fetch patient card details and vaccine-specific brands list
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Fetch patient card details
        const res = await axios.get(`/api/v1/patients/vaccination-card/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        const patientRecord = res.data?.data;
        let fetchedVaccineName = '';

        if (patientRecord && patientRecord.patientVaccines) {
          const targetVaccine = patientRecord.patientVaccines.find(
            (v) => v._id.toString() === vaccineId || (v.scheduleId && v.scheduleId._id?.toString() === vaccineId)
          );

          if (targetVaccine) {
            fetchedVaccineName = targetVaccine.scheduleId?.name || targetVaccine.vaccineName || 'Vaccine';
            setVaccineName(fetchedVaccineName);
            setStatus(targetVaccine.status || 'Pending');
            setBrandName(targetVaccine.brandName || '');
            if (targetVaccine.givenDate) {
              setGivenDate(new Date(targetVaccine.givenDate).toISOString().split('T')[0]);
            }
          }
        }

        // Fetch vaccine brands specifically matching this vaccine name from backend
        if (fetchedVaccineName) {
          try {
            const brandsRes = await axios.get(`/api/v1/patients/brands-by-name/${encodeURIComponent(fetchedVaccineName)}`, {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            });
            const fetchedBrands = brandsRes.data?.data || brandsRes.data || [];
            setBrandsList(fetchedBrands);
          } catch (brandErr) {
            console.log("Could not fetch vaccine-specific brands list", brandErr);
          }
        }

      } catch (error) {
        console.error("Error fetching details:", error);
        toast.error("Failed to load vaccine details.");
      } finally {
        setLoading(false);
      }
    };

    if (patientId && vaccineId) {
      fetchData();
    }
  }, [patientId, vaccineId]);

  // Filter brands based on search query
  const filteredBrands = brandsList.filter((brand) => {
    const name = brand.brandName || brand.name || brand;
    return typeof name === 'string' && name.toLowerCase().includes(brandSearchQuery.toLowerCase());
  });

  // 2. Handle Update Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const payload = {
        status,
        brandName,
        givenDate: status === 'Given' ? (givenDate || new Date().toISOString()) : null,
      };

      const response = await axios.patch(
        `/api/v1/patients/vaccination-card/${patientId}/vaccine/${vaccineId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data) {
        toast.success("Vaccine details updated successfully!");
        navigate(-1);
      }
    } catch (error) {
      console.error("Failed to update vaccine:", error);
      toast.error(error.response?.data?.message || "Failed to update vaccine details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800/60">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-[#0b1329] border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Syringe className="w-6 h-6 text-blue-500" />
            <span>Update Vaccine Details</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Manage status, brand name, and administration date
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6 animate-pulse">
          {/* Skeleton Banner */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 bg-slate-800 rounded w-24"></div>
              <div className="h-6 bg-slate-800 rounded w-40"></div>
            </div>
            <div className="w-12 h-12 bg-slate-800 rounded-xl"></div>
          </div>

          {/* Skeleton Status Buttons */}
          <div className="space-y-2">
            <div className="h-3 bg-slate-800 rounded w-32"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-slate-900/60 border border-slate-800 rounded-xl"></div>
              <div className="h-12 bg-slate-900/60 border border-slate-800 rounded-xl"></div>
            </div>
          </div>

          {/* Skeleton Input Field */}
          <div className="space-y-2">
            <div className="h-3 bg-slate-800 rounded w-28"></div>
            <div className="h-12 bg-slate-900/60 border border-slate-800 rounded-xl"></div>
          </div>

          {/* Skeleton Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <div className="h-10 w-20 bg-slate-800 rounded-xl"></div>
            <div className="h-10 w-28 bg-slate-800 rounded-xl"></div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-6  shadow-xl space-y-6">
          {/* Vaccine Name Banner */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider">Target Vaccine</span>
              <h2 className="text-lg font-bold text-white mt-0.5">{vaccineName}</h2>
            </div>
            <div className="p-3 bg-blue-600/15 text-blue-400 rounded-xl border border-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Vaccination Status</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setStatus('Pending');
                  setGivenDate('');
                }}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2 ${status === 'Pending'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatus('Given');
                  if (!givenDate) {
                    setGivenDate(new Date().toISOString().split('T')[0]);
                  }
                }}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2 ${status === 'Given'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Given
              </button>
            </div>
          </div>

          {/* Given Date (Conditional based on status) */}
          {status === 'Given' && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Given Date</span>
              </label>
              <input
                type="date"
                value={givenDate}
                onChange={(e) => setGivenDate(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition"
                required={status === 'Given'}
              />
            </div>
          )}

          {/* Searchable Brand Name Dropdown */}
          <div className="space-y-2 relative">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Brand Name (Searchable Dropdown)</span>
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder="Search or select brand name..."
                value={brandName}
                onChange={(e) => {
                  setBrandName(e.target.value);
                  setBrandSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full bg-slate-900/80 border border-slate-800 text-white text-sm rounded-xl pl-4 pr-10 py-3 focus:border-blue-500 outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Dropdown Options List */}
            {isDropdownOpen && (
              <div className="absolute z-50 w-full bottom-full mb-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto">               {filteredBrands.length > 0 ? (
                filteredBrands.map((brand, idx) => {
                  const bName = brand.brandName || brand.name || brand;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setBrandName(bName);
                        setIsDropdownOpen(false);
                      }}
                      className="px-4 py-2.5 text-sm text-slate-300 hover:bg-blue-600/20 hover:text-white cursor-pointer transition border-b border-slate-800/50 last:border-none"
                    >
                      {bName}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-xs text-slate-500 text-center">
                  No matching brand found. You can type a custom name.
                </div>
              )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800/50 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UpdatePatientVaccine;