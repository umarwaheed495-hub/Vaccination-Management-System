import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Users, ArrowLeft, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const EditPatient = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const location = useLocation();

  const [loadingPatient, setLoadingPatient] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State (clinicId ko hata diya gaya hai)
  const [formData, setFormData] = useState({
    patientName: '',
    fatherName: '',
    dateOfBirth: '',
    fatherCnic: '',
    city: '',
    phone: '',
  });

  // 1. Agar location state mein patient data mojood hai toh form fill kar dein, warna API se fetch karein
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingPatient(true);
        const token = localStorage.getItem('token');

        // Agar PatientView se state ke zariye data pass hua hai toh wahan se utha lein
        if (location.state?.patientData) {
          const p = location.state.patientData;
          setFormData({
            patientName: p.patientName || '',
            fatherName: p.fatherName || '',
            dateOfBirth: p.dateOfBirth || '',
            fatherCnic: p.fatherCnic || '',
            city: p.city || '',
            phone: p.phone || '',
          });
        } else {
          // Agar direct URL se aya hai toh backend se patient data fetch karein
          const patientResponse = await axios.get(`http://localhost:8000/api/v1/patients/${patientId}`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          if (patientResponse.data?.data) {
            const p = patientResponse.data.data;
            setFormData({
              patientName: p.patientName || '',
              fatherName: p.fatherName || '',
              dateOfBirth: p.dateOfBirth || '',
              fatherCnic: p.fatherCnic || '',
              city: p.city || '',
              phone: p.phone || '',
            });
          }
        }
      } catch (error) {
        console.error("Failed to load patient data:", error);
        toast.error("Failed to load patient details.");
      } finally {
        setLoadingPatient(false);
      }
    };

    fetchData();
  }, [patientId, location]);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Update Patient Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await axios.put(
        `http://localhost:8000/api/v1/patients/update/${patientId}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data?.success || response.status === 200) {
        toast.success("Patient record updated successfully!");
        // Redirection set back to patients list
        navigate('/dashboard/patients');
      }
    } catch (error) {
      console.error("Failed to update patient:", error);
      toast.error(error.response?.data?.message || "Failed to update patient record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/patients')}
            className="p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-500" />
              <span>Edit Patient Record</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Update the patient's information below
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-[#0b1329]/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
        {loadingPatient ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-slate-400 text-sm">Loading patient details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Patient Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  placeholder="Patient Name"
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Father Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Father / Guardian Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  placeholder="Father Or Guardian Name"
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                   Date Of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  placeholder="Enter Date Of Birth"
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Father CNIC */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Father CNIC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fatherCnic"
                  value={formData.fatherCnic}
                  onChange={handleChange}
                  placeholder="Enter Patient Father CNIC"
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* City */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter Patient City"
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter Phone Number"
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => navigate('/dashboard/patients')}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Update Patient</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditPatient;