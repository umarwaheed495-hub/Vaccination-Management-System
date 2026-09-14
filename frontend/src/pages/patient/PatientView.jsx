import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Users, UserCheck,
  Pencil, Trash2, Loader2, Building, ShieldAlert, Activity // Activity ya Syringe icon ke liye
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const PatientView = () => {
  const navigate = useNavigate();
  
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [patients, setPatients] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // 1. Sirf Active Clinic fetch karein
  const fetchActiveClinicAndPatients = async () => {
    try {
      setLoadingClinics(true);
      const token = localStorage.getItem('token');

      const response = await axios.get('/api/v1/clinics/my-clinics', {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (response.data?.data) {
        const fetchedClinics = response.data.data;
        
        // Sirf woh clinic uthayein jo explicitly active ho
        const activeOne = fetchedClinics.find(c => c.isActive);
        
        if (activeOne) {
          const activeId = activeOne._id || activeOne.id;
          setSelectedClinicId(activeId);
          fetchPatientsByClinic(activeId);
        } else {
          setSelectedClinicId('');
        }
      }
    } catch (error) {
      console.error("Failed to fetch clinics:", error);
      toast.error("Failed to load active clinic.");
    } finally {
      setLoadingClinics(false);
    }
  };

  useEffect(() => {
    fetchActiveClinicAndPatients();
  }, []);

  // 2. Clinic ID ke mutabiq Patients fetch karein
  const fetchPatientsByClinic = async (clinicId) => {
    if (!clinicId) return;
    try {
      setLoadingPatients(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(`/api/v1/patients/clinic/${clinicId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (response.data?.data) {
        setPatients(response.data.data);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  // 3. Delete Patient Logic
  const handleDelete = async (patientId) => {
    if (window.confirm("Are you sure you want to delete this patient record?")) {
      try {
        setDeletingId(patientId);
        const token = localStorage.getItem('token');

        await axios.delete(`/api/v1/patients/delete/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        toast.success("Patient record deleted successfully.");
        setPatients((prev) => prev.filter((p) => (p._id || p.id) !== patientId));
      } catch (error) {
        console.error("Failed to delete patient:", error);
        toast.error(error.response?.data?.message || "Failed to delete patient.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-500" />
            <span>Patients Management</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Manage and view registered patients for your active clinic
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/create-patient')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center gap-2 px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Main Content View */}
      {loadingClinics || loadingPatients ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#0b1329]/80 border border-slate-800/80 rounded-2xl p-4 h-[72px] animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-800/80 rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-800/80 rounded w-32"></div>
                  <div className="h-3 bg-slate-800/50 rounded w-24"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-slate-800/60 rounded-xl"></div>
                <div className="w-10 h-10 bg-slate-800/60 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !selectedClinicId ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 mt-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4 shadow-xl min-h-[350px]">
          <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-bold text-white">No Active Clinic Found</h3>
            <p className="text-slate-400 text-sm">
              Please activate a clinic first before adding or viewing patients.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/clinic')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center gap-2 px-6 py-2.5 rounded-xl transition shadow-md mt-2"
          >
            <Building className="w-5 h-5" />
            <span>Go to Clinic View</span>
          </button>
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 mt-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4 shadow-xl min-h-[350px]">
          <div className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20">
            <Users className="w-10 h-10" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-xl font-bold text-white">No Patients Registered</h3>
            <p className="text-slate-400 text-sm">
              There are no patients registered for your active clinic yet. Click below to add one.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/create-patient')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center gap-2 px-6 py-2.5 rounded-xl transition shadow-md mt-2"
          >
            <Plus className="w-5 h-5" />
            <span>Register Patient</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => {
            const patientId = patient._id || patient.id;
            const isDeleting = deletingId === patientId;

            return (
              <div
                key={patientId}
                className="bg-[#0b1329]/80 border border-slate-800/80 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl hover:border-slate-700/80 transition-all"
              >
                {/* Left side: Icon, Name & Father Name */}
                <div className="flex items-center gap-3.5 min-w-[200px]">
                  <div className="p-2.5 bg-blue-600/15 rounded-xl text-blue-400 border border-blue-500/20 shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                      {patient.patientName}
                    </h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      S/O: <span className="text-slate-300">{patient.fatherName}</span>
                    </p>
                  </div>
                </div>

                {/* Right side: Action Buttons (Vaccination Card, Edit, Delete) */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  {/* Naya Button: Vaccination Card View */}
                  <button
                    onClick={() => navigate(`/dashboard/patient-vaccination/${patientId}`)}
                    title="View Vaccination Card"
                    className="border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/70 p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium px-3 transition-all duration-200"
                  >
                    <Activity className="w-4 h-4" />
                    <span className="hidden sm:inline">Vaccination Card</span>
                  </button>

                  <button
                    onClick={() => navigate(`/dashboard/edit-patient/${patientId}`, { state: { patientData: patient } })}
                    title="Edit Patient"
                    className="border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/70 p-2 rounded-xl flex items-center justify-center transition-all duration-200"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(patientId)}
                    disabled={isDeleting}
                    title="Delete Patient"
                    className="border border-red-500/40 text-red-500 hover:bg-red-500/10 hover:border-red-500/70 p-2 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientView;