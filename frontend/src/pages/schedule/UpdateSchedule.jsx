import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Syringe, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const UpdateSchedule = () => {
  const navigate = useNavigate();
  const location = useLocation(); // State pass-through ke liye
  const { id } = useParams(); 
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form state updated to keep only name and recommendedAge
  const [formData, setFormData] = useState({
    name: '',
    recommendedAge: '',
  });

  useEffect(() => {
    // 1. Sab se pehle check karein ke kya route state mein data mojood hai (Fast loading)
    const passedData = location.state?.scheduleData;

    if (passedData) {
      setFormData({
        name: passedData.name || '',
        recommendedAge: passedData.recommendedAge || passedData.date || '',
      });
      setFetching(false);
    } else if (id) {
      // 2. Agar state nahi milti (direct URL / page refresh), toh backend se API call karein
      const fetchScheduleDetails = async () => {
        try {
          setFetching(true);
          const response = await axios.get(`/api/v1/vaccinations/single/${id}`, {
            withCredentials: true,
          });

          if (response.data.success || response.data.statusCode === 200) {
            const item = response.data.data;
            setFormData({
              name: item.name || '',
              recommendedAge: item.recommendedAge || item.date || '',
            });
          }
        } catch (error) {
          console.error("Fetch Single Schedule Error:", error);
          toast.error('Failed to load schedule details for editing');
        } finally {
          setFetching(false);
        }
      };

      fetchScheduleDetails();
    }
  }, [id, location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Payload updated to only send name and recommendedAge
      const payload = {
        name: formData.name,
        recommendedAge: formData.recommendedAge,
      };

      const response = await axios.put(`/api/v1/vaccinations/update/${id}`, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (response.data.success || response.status === 200 || response.data.statusCode === 200) {
        toast.success(response.data.message || 'Vaccination schedule updated successfully');
        navigate('/dashboard/schedule');
      }
    } catch (error) {
      console.error("Update Schedule Error:", error);
      toast.error(error.response?.data?.message || 'Failed to update vaccination schedule');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400 min-h-[400px] flex items-center justify-center">
        Loading schedule details...
      </div>
    );
  }

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
            Update Vaccination Schedule
          </h1>
          <p className="text-sm text-slate-400">
            Modify the vaccine name and recommended schedule age.
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
          <label className="text-sm font-semibold text-slate-350">Schedule Date (Recommended Age)</label>
          <input
            type="text"
            name="recommendedAge"
            placeholder="e.g., At Birth, 6 Weeks, 10 Weeks"
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
            {loading ? 'Updating...' : 'Update Schedule'}
          </Button>
        </div>

      </form>
    </div>
  );
};

export default UpdateSchedule;