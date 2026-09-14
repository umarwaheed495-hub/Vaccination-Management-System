import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Syringe, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const CreateSchedule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form state updated to keep only name and recommendedAge
  const [formData, setFormData] = useState({
    name: '',
    recommendedAge: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const doctorInfo = JSON.parse(localStorage.getItem('doctor') || '{}');
      const doctorId = doctorInfo._id || doctorInfo.id;

      if (!doctorId) {
        toast.error('Doctor session not found. Please login again.');
        navigate('/login');
        return;
      }

      // Payload updated to only send doctorId, name, and recommendedAge
      const payload = {
        doctorId,
        name: formData.name,
        recommendedAge: formData.recommendedAge,
      };

      const response = await axios.post('/api/v1/vaccinations/add', payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (response.data.success || response.status === 201 || response.data.statusCode === 200) {
        toast.success(response.data.message || 'Vaccination schedule added successfully');
        navigate('/dashboard/schedule'); 
      }
    } catch (error) {
      console.error("Create Schedule Error:", error);
      toast.error(error.response?.data?.message || 'Failed to add vaccination schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/dashboard/schedule')}
          className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl h-10 w-10 p-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            Add Vaccination Schedule
          </h1>
          <p className="text-sm text-slate-400">
            Enter the vaccine name and recommended schedule age.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
        
        {/* Vaccine Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Vaccine Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Vaccine Name"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all"
            required
          />
        </div>

        {/* Schedule Date / Recommended Age */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Recommended Age</label>
          <input
            type="text"
            name="recommendedAge"
            placeholder="Enter A Recommended Age"
            value={formData.recommendedAge}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-blue-500 transition-all"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/dashboard/schedule')}
            className="text-slate-400 hover:text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-xl shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>

      </form>
    </div>
  );
};


export default CreateSchedule;