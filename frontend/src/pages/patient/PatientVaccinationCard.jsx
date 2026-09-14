import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Calendar, ShieldCheck, User, Phone, CheckCircle2, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const PatientVaccinationCard = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);
  const [vaccines, setVaccines] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  // 1. Fetch Patient Vaccination Card details from backend
  const fetchVaccinationCard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(`http://localhost:8000/api/v1/patients/vaccination-card/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      const patientRecord = response.data?.data;

      if (patientRecord) {
        setPatientData(patientRecord);
        setVaccines(patientRecord.patientVaccines || []);
      }
    } catch (error) {
      console.error("Failed to fetch vaccination card:", error);
      toast.error(error.response?.data?.message || "Failed to load vaccination card.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchVaccinationCard();
    }
  }, [patientId]);

  // 2. Update Vaccine Status or Given Date Function (With Error Handling for Out of Stock)
  const handleVaccineUpdate = async (vaccineSubDocId, updatedFields) => {
    try {
      setUpdatingId(vaccineSubDocId);
      const token = localStorage.getItem('token');

      const response = await axios.patch(
        `http://localhost:8000/api/v1/patients/vaccination-card/${patientId}/vaccine/${vaccineSubDocId}`,
        updatedFields,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      const updatedRecord = response.data?.data;
      if (updatedRecord) {
        setPatientData(updatedRecord);
        setVaccines(updatedRecord.patientVaccines || []);
        toast.success("Vaccine record and inventory updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update vaccine status:", error);
      // Backend se jo "Out of Stock" ya error message aayega woh yahan toast mein show ho jayega
      toast.error(error.response?.data?.message || "Failed to update vaccine status.");
      
      // Error aane par state ko dobara fetch kar ke sync kar lein taake UI theek rahe
      fetchVaccinationCard();
    } finally {
      setUpdatingId(null);
    }
  };

  // 3. Status Change Handler (Auto sets today's date if status becomes 'Given')
  const handleStatusChange = (item, newStatus) => {
    const payload = { status: newStatus };

    if (newStatus === "Given") {
      const todayDate = new Date().toISOString().split('T')[0];
      payload.givenDate = todayDate;
    } else if (newStatus === "Pending") {
      payload.givenDate = null;
    }

    handleVaccineUpdate(item._id, payload);
  };

  // Helper: Group vaccines by their Due Date
  const groupedVaccines = vaccines.reduce((groups, item) => {
    const dueDateKey = item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A';
    if (!groups[dueDateKey]) {
      groups[dueDateKey] = [];
    }
    groups[dueDateKey].push(item);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-[#0b1329] border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-7 h-7 text-emerald-500" />
              <span>Vaccination Card</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Detailed immunization schedule and tracking record
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        /* Skeleton Loading UI */
        <div className="space-y-6 animate-pulse">
          <div className="bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-11 h-11 bg-slate-800/80 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-4 bg-slate-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#0b1329]/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="h-5 bg-slate-800 rounded w-48" />
              <div className="h-6 bg-slate-800 rounded w-24" />
            </div>
            <div className="p-4 space-y-4">
              <div className="h-8 bg-slate-900/80 rounded-lg w-full" />
              <div className="space-y-2">
                <div className="h-10 bg-slate-900/40 rounded-lg w-full" />
                <div className="h-10 bg-slate-900/40 rounded-lg w-full" />
              </div>
            </div>
          </div>
        </div>
      ) : !patientData ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <p className="text-slate-400 text-sm">Patient record not found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Patient Info Summary Card */}
          <div className="bg-[#0b1329]/90 border border-slate-800/80 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/15 text-blue-400 rounded-xl border border-blue-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Patient Name</p>
                <p className="text-sm font-bold text-white">{patientData.patientName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/15 text-purple-400 rounded-xl border border-purple-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Father's Name</p>
                <p className="text-sm font-bold text-white">{patientData.fatherName || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600/15 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Date of Birth</p>
                <p className="text-sm font-bold text-white">
                  {patientData.dateOfBirth ? new Date(patientData.dateOfBirth).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-600/15 text-amber-400 rounded-xl border border-amber-500/20">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Contact Number</p>
                <p className="text-sm font-bold text-white">
                  {patientData.phone || patientData.contactNumber || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Vaccines Grouped View */}
          <div className="bg-[#0b1329]/80 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden p-4 sm:p-5">
            <div className="pb-4 mb-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Immunization Schedule List</span>
              </h3>
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg">
                Total Vaccines: {vaccines.length}
              </span>
            </div>

            <div>
              {vaccines.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No vaccines scheduled for this patient.
                </div>
              ) : (
                Object.entries(groupedVaccines).map(([dueDate, groupItems], groupIndex) => (
                  <div 
                    key={groupIndex} 
                    className="mb-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-lg overflow-hidden last:mb-0"
                  >
                    {/* Date Group Header - Shifted to Center */}
                    <div className="bg-slate-900/90 px-5 py-3 border-b border-slate-800/80 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold tracking-wider uppercase text-center relative">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Recommended Due Date: {dueDate}</span>
                        <span className="text-slate-400 font-normal">({groupItems.length} Vaccines)</span>
                      </div>
                    </div>

                    {/* Table for this specific Date Group */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800/40 bg-slate-900/30 text-xs text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-4 font-semibold">Vaccine Name</th>
                            <th className="py-3 px-4 font-semibold">Brand</th>
                            <th className="py-3 px-4 font-semibold">Status</th>
                            <th className="py-3 px-4 font-semibold">Given Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-sm">
                          {groupItems.map((item, index) => {
                            const vaccineName = item.scheduleId?.name || item.vaccineName || 'Unknown Vaccine';
                            const isUpdating = updatingId === item._id;

                            return (
                              <tr key={item._id || index} className="hover:bg-slate-900/45 transition">
                                {/* Vaccine Name */}
                                <td className="py-3.5 px-4 font-bold text-white">{vaccineName}</td>

                                {/* Brand Display */}
                                <td className="py-3.5 px-4 text-slate-300">
                                  <span className="px-2.5 py-1 bg-slate-800/60 border border-slate-700/60 rounded-lg text-xs font-medium">
                                    {item.brand || item.scheduleId?.brand || 'Standard'}
                                  </span>
                                </td>

                                {/* Status Toggle (Pending / Given) */}
                                <td className="py-3.5 px-4">
                                  <select
                                    disabled={isUpdating}
                                    value={item.status || "Pending"}
                                    onChange={(e) => handleStatusChange(item, e.target.value)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition outline-none cursor-pointer ${
                                      item.status === "Given"
                                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                        : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                    }`}
                                  >
                                    <option value="Pending" className="bg-[#0b1329] text-amber-400">Pending</option>
                                    <option value="Given" className="bg-[#0b1329] text-emerald-400">Given</option>
                                  </select>
                                </td>

                                {/* Given Date Picker */}
                                <td className="py-3.5 px-4">
                                  <input
                                    type="date"
                                    disabled={isUpdating}
                                    value={item.givenDate ? new Date(item.givenDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleVaccineUpdate(item._id, { givenDate: e.target.value })}
                                    className="bg-slate-900/80 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:border-emerald-500 outline-none transition"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientVaccinationCard;