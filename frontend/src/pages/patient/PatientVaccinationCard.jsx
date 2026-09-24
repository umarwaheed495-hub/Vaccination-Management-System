import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Syringe, ArrowLeft, Calendar, ShieldCheck, User, Phone } from 'lucide-react';
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

      const response = await axios.get(`/api/v1/patients/vaccination-card/${patientId}`, {
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

  // 2. Update Vaccine Given Date Function (Direct quick update)
  const handleVaccineUpdate = async (vaccineSubDocId, updatedFields) => {
    try {
      setUpdatingId(vaccineSubDocId);
      const token = localStorage.getItem('token');

      const response = await axios.patch(
        `/api/v1/patients/vaccination-card/${patientId}/vaccine/${vaccineSubDocId}`,
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
        toast.success("Vaccine record updated successfully!");
      }
    } catch (error) {
      console.error("Failed to update vaccine status:", error);
      toast.error(error.response?.data?.message || "Failed to update vaccine status.");
      fetchVaccinationCard();
    } finally {
      setUpdatingId(null);
    }
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
              {/* <Activity className="w-7 h-7 text-emerald-500" /> */}
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
                    <div className="bg-slate-900/90 px-5 py-3 border-b border-slate-800/80 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold tracking-wider uppercase text-center">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Recommended Due Date: {dueDate}</span>
                        <span className="text-slate-400 font-normal">({groupItems.length} Vaccines)</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800/40 bg-slate-900/30 text-xs text-slate-400 uppercase tracking-wider">
                            <th className="py-3 px-4 font-semibold">Given Date</th>
                            <th className="py-3 px-4 font-semibold">Vaccine Name</th>
                            <th className="py-3 px-4 font-semibold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-sm">
                          {groupItems.map((item, index) => {
                            const vaccineName = item.scheduleId?.name || item.vaccineName || 'Unknown Vaccine';
                            const isUpdating = updatingId === item._id;
                            const isGiven = item.status === "Given"; // 🟢 Added requirement check

                            return (
                              <tr
                                key={item._id || index}
                                className={`transition ${isGiven
                                    ? "bg-emerald-900/20 hover:bg-emerald-900/30 border-l-4 border-emerald-500" // Row turns green when given
                                    : "hover:bg-slate-900/45" // Normal state when pending
                                  }`}
                              >
                                <td className="py-3.5 px-4">
                                  <span className={`text-xs ${isGiven ? "text-emerald-400 font-medium" : "text-slate-300"}`}>
                                    {item.givenDate ? new Date(item.givenDate).toISOString().split('T')[0] : 'Pending'}
                                  </span>
                                </td>

                                <td className={`py-3.5 px-4 font-bold ${isGiven ? "text-emerald-200" : "text-white"}`}>
                                  {vaccineName}
                                </td>

                                {/* Action Column with Syringe Icon opening Update Page */}
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    onClick={() => navigate(`/dashboard/update-vaccine/${patientId}/${item._id}`)}
                                    title="Manage Status & Brand Name on New Page"
                                    className="p-2 bg-blue-600/15 text-blue-400 hover:bg-blue-600/30 rounded-xl transition border border-blue-500/30 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3.5"
                                  >
                                    <Syringe className="w-4 h-4 text-blue-400" />
                                  </button>
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