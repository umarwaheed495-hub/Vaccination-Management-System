import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import Select from 'react-select';

// Comprehensive City Options for Pakistan
const cityOptions = [
  // --- PUNJAB ---
  { value: 'Rawalpindi', label: 'Rawalpindi (Punjab)' },
  { value: 'Islamabad', label: 'Islamabad (Capital)' },
  { value: 'Lahore', label: 'Lahore (Punjab)' },
  { value: 'Faisalabad', label: 'Faisalabad (Punjab)' },
  { value: 'Multan', label: 'Multan (Punjab)' },
  { value: 'Gujranwala', label: 'Gujranwala (Punjab)' },
  { value: 'Sialkot', label: 'Sialkot (Punjab)' },
  { value: 'Bahawalpur', label: 'Bahawalpur (Punjab)' },
  { value: 'Sargodha', label: 'Sargodha (Punjab)' },
  { value: 'Rahim Yar Khan', label: 'Rahim Yar Khan (Punjab)' },
  { value: 'Attock', label: 'Attock (Punjab)' },
  { value: 'Chakwal', label: 'Chakwal (Punjab)' },
  { value: 'Jhelum', label: 'Jhelum (Punjab)' },
  { value: 'Taxila', label: 'Taxila (Punjab)' },
  { value: 'Wah Cantt', label: 'Wah Cantt (Punjab)' },
  { value: 'Murree', label: 'Murree (Punjab)' },
  { value: 'Gujrat', label: 'Gujrat (Punjab)' },
  { value: 'Sahiwal', label: 'Sahiwal (Punjab)' },
  { value: 'Kasur', label: 'Kasur (Punjab)' },
  { value: 'Sheikhupura', label: 'Sheikhupura (Punjab)' },
  { value: 'Okara', label: 'Okara (Punjab)' },
  { value: 'Mianwali', label: 'Mianwali (Punjab)' },
  { value: 'Bhakkar', label: 'Bhakkar (Punjab)' },
  { value: 'Hassan Abdal', label: 'Hassan Abdal (Punjab)' },
  { value: 'Fateh Jang', label: 'Fateh Jang (Punjab)' },
  { value: 'Pind Dadan Khan', label: 'Pind Dadan Khan (Punjab)' },
  { value: 'Talagang', label: 'Talagang (Punjab)' },
  { value: 'Gujar Khan', label: 'Gujar Khan (Punjab)' },
  { value: 'Kahuta', label: 'Kahuta (Punjab)' },
  { value: 'Kallar Syedan', label: 'Kallar Syedan (Punjab)' },

  // --- SINDH ---
  { value: 'Karachi', label: 'Karachi (Sindh)' },
  { value: 'Hyderabad', label: 'Hyderabad (Sindh)' },
  { value: 'Sukkur', label: 'Sukkur (Sindh)' },
  { value: 'Larkana', label: 'Larkana (Sindh)' },
  { value: 'Nawabshah', label: 'Nawabshah / Benazirabad (Sindh)' },
  { value: 'Mirpur Khas', label: 'Mirpur Khas (Sindh)' },
  { value: 'Shikarpur', label: 'Shikarpur (Sindh)' },
  { value: 'Jacobabad', label: 'Jacobabad (Sindh)' },
  { value: 'Khairpur', label: 'Khairpur (Sindh)' },
  { value: 'Dadu', label: 'Dadu (Sindh)' },
  { value: 'Jamshoro', label: 'Jamshoro (Sindh)' },
  { value: 'Tando Adam', label: 'Tando Adam (Sindh)' },
  { value: 'Ghotki', label: 'Ghotki (Sindh)' },
  { value: 'Badin', label: 'Badin (Sindh)' },
  { value: 'Thatta', label: 'Thatta (Sindh)' },

  // --- KHYBER PAKHTUNKHWA (KPK) ---
  { value: 'Peshawar', label: 'Peshawar (KPK)' },
  { value: 'Abbottabad', label: 'Abbottabad (KPK)' },
  { value: 'Mardan', label: 'Mardan (KPK)' },
  { value: 'Mingora', label: 'Mingora / Swat (KPK)' },
  { value: 'Swabi', label: 'Swabi (KPK)' },
  { value: 'Nowshera', label: 'Nowshera (KPK)' },
  { value: 'Charsadda', label: 'Charsadda (KPK)' },
  { value: 'Mansehra', label: 'Mansehra (KPK)' },
  { value: 'Haripur', label: 'Haripur (KPK)' },
  { value: 'Kohat', label: 'Kohat (KPK)' },
  { value: 'Bannu', label: 'Bannu (KPK)' },
  { value: 'Dera Ismail Khan', label: 'Dera Ismail Khan (KPK)' },
  { value: 'Chitral', label: 'Chitral (KPK)' },
  { value: 'Timergara', label: 'Timergara / Dir (KPK)' },
  { value: 'Shangla', label: 'Shangla (KPK)' },
  { value: 'Battagram', label: 'Battagram (KPK)' },
  { value: 'Hangu', label: 'Hangu (KPK)' },
  { value: 'Karak', label: 'Karak (KPK)' },

  // --- BALOCHISTAN ---
  { value: 'Quetta', label: 'Quetta (Balochistan)' },
  { value: 'Gwadar', label: 'Gwadar (Balochistan)' },
  { value: 'Turbat', label: 'Turbat (Balochistan)' },
  { value: 'Khuzdar', label: 'Khuzdar (Balochistan)' },
  { value: 'Sibi', label: 'Sibi (Balochistan)' },
  { value: 'Loralai', label: 'Loralai (Balochistan)' },
  { value: 'Chaman', label: 'Chaman (Balochistan)' },
  { value: 'Zhob', label: 'Zhob (Balochistan)' },
  { value: 'Pishin', label: 'Pishin (Balochistan)' },
  { value: 'Kalat', label: 'Kalat (Balochistan)' },
  { value: 'Hub', label: 'Hub (Balochistan)' },
  { value: 'Naseerabad', label: 'Naseerabad (Balochistan)' },

  // --- AZAD KASHMIR (AJK) ---
  { value: 'Muzaffarabad', label: 'Muzaffarabad (AJK)' },
  { value: 'Mirpur AJK', label: 'Mirpur (AJK)' },
  { value: 'Rawalakot', label: 'Rawalakot (AJK)' },
  { value: 'Kotli', label: 'Kotli (AJK)' },
  { value: 'Bagh', label: 'Bagh (AJK)' },
  { value: 'Bhimber', label: 'Bhimber (AJK)' },
  { value: 'Hatian Bala', label: 'Hatian Bala (AJK)' },
  { value: 'Neelum', label: 'Neelum Valley (AJK)' },

  // --- GILGIT-BALTISTAN (GB) ---
  { value: 'Gilgit', label: 'Gilgit (GB)' },
  { value: 'Skardu', label: 'Skardu (GB)' },
  { value: 'Hunza', label: 'Hunza / Aliabad (GB)' },
  { value: 'Chilas', label: 'Chilas / Diamer (GB)' },
  { value: 'Ghizer', label: 'Ghizer (GB)' },
  { value: 'Ghanche', label: 'Ghanche (GB)' },
  { value: 'Astore', label: 'Astore (GB)' },
  { value: 'Nagar', label: 'Nagar (GB)' }
];

// Dark theme custom styles for react-select
const customStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#0f172a',
    borderColor: state.isFocused ? '#3b82f6' : '#334155',
    borderRadius: '0.75rem',
    padding: '4px',
    boxShadow: 'none',
    '&:hover': { borderColor: '#475569' }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    zIndex: 9999
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#1e293b' : '#0f172a',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px'
  }),
  singleValue: (provided) => ({ ...provided, color: '#ffffff', fontSize: '14px' }),
  input: (provided) => ({ ...provided, color: '#ffffff' }),
  placeholder: (provided) => ({ ...provided, color: '#64748b', fontSize: '14px' })
};

const CreatePatient = () => {
  const navigate = useNavigate();

  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    fatherName: '',
    dateOfBirth: '', 
    fatherCnic: '',
    city: '',
    phone: '',
    clinicId: '',
  });

  // 1. Doctor ki registered clinics fetch karein aur sirf ACTIVE clinic ki ID set karein
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoadingClinics(true);
        const token = localStorage.getItem('token');

        const response = await axios.get('http://localhost:8000/api/v1/clinics/my-clinics', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (response.data?.data) {
          const fetchedClinics = response.data.data;
          setClinics(fetchedClinics);

          // Sirf woh clinic dhoondhein jo ACTIVE ho
          const activeClinic = fetchedClinics.find(c => c.isActive === true);

          if (activeClinic) {
            setFormData((prev) => ({ ...prev, clinicId: activeClinic._id || activeClinic.id }));
          } else {
            setFormData((prev) => ({ ...prev, clinicId: '' }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch clinics:", error);
        toast.error("Failed to load clinic details.");
      } finally {
        setLoadingClinics(false);
      }
    };

    fetchClinics();
  }, []);

  // Handle Input Changes for standard text fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Submit Form to Add Patient
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check karein ke active clinic ID mojood hai ya nahi
    if (!formData.clinicId) {
      toast.error("Please activate a clinic first before registering a patient.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:8000/api/v1/patients/add',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data?.success || response.status === 200 || response.status === 201) {
        toast.success("Patient registered successfully!");
        navigate('/dashboard/patients');
      }
    } catch (error) {
      console.error("Failed to register patient:", error);
      toast.error(error.response?.data?.message || "Failed to register patient. Please check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  // Check karein ke aya koi active clinic mojood hai ya nahi UI ke liye
  const hasActiveClinic = clinics.some(c => c.isActive === true);

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
              <span>Register New Patient</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Fill in the details below to add a new patient record
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-[#0b1329]/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
        {loadingClinics ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-slate-400 text-sm">Loading clinic details...</p>
          </div>
        ) : !hasActiveClinic ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-amber-400 text-sm">
              {clinics.length === 0 
                ? "You must create a clinic before registering patients." 
                : "You must activate a clinic before registering patients."}
            </p>
            <button
              onClick={() => navigate(clinics.length === 0 ? '/dashboard/create-clinic' : '/dashboard/clinic')}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
            >
              {clinics.length === 0 ? "Create Clinic First" : "Activate a Clinic"}
            </button>
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
                  placeholder="Enter Patient Name"
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
                  placeholder="Enter Patient Father or Guardian Name"
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Age / Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Date Of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  placeholder="Enter Patient Date Of Birth "
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
                  placeholder="Enter Father CNIC No "
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* City Searchable Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  City <span className="text-red-500">*</span>
                </label>
                <Select
                  options={cityOptions}
                  styles={customStyles}
                  placeholder="Search city, town, or area..."
                  isSearchable={true}
                  value={cityOptions.find(option => option.value === formData.city) || null}
                  onChange={(selectedOption) => {
                    setFormData((prev) => ({
                      ...prev,
                      city: selectedOption ? selectedOption.value : ''
                    }));
                  }}
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
                  placeholder="Enter Your Phone Number"
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
                <span>Register Patient</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreatePatient;