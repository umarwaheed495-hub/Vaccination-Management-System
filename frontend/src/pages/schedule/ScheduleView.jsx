import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarRange, Plus, Calendar, Edit3, Trash2, Syringe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const ScheduleView = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const doctorInfo = JSON.parse(localStorage.getItem('doctor') || '{}');
      const doctorId = doctorInfo._id || doctorInfo.id;

      if (!doctorId) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      const response = await axios.get(`/api/v1/vaccinations/${doctorId}`, {
        withCredentials: true,
      });

      if (response.data.success || response.data.statusCode === 200) {
        setSchedules(response.data.data || []);
      }
    } catch (error) {
      console.error("Fetch Schedules Error:", error);
      toast.error(error.response?.data?.message || 'Failed to load vaccination schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Delete Schedule Handler
  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`/api/v1/vaccinations/delete/${id}`, {
        withCredentials: true,
      });

      if (response.data.success || response.status === 200 || response.data.statusCode === 200) {
        setSchedules(schedules.filter(item => item._id !== id));
        toast.success('Vaccination schedule deleted successfully');
      }
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error(error.response?.data?.message || 'Failed to delete schedule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2.5">
            <CalendarRange className="w-6 h-6 text-blue-500" />
            Vaccination Schedule Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            View and manage your active vaccination schedules and recommended ages.
          </p>
        </div>

        <Button
          onClick={() => navigate('/dashboard/create-schedule')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Schedule</span>
        </Button>
      </div>

      {/* Content Area */}
      {loading ? (
        /* Skeleton Loading for Table */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-6 space-y-4 animate-pulse">
          <div className="h-10 bg-slate-800 rounded-xl w-full" />
          <div className="h-12 bg-slate-800/80 rounded-xl w-full" />
          <div className="h-12 bg-slate-800/80 rounded-xl w-full" />
          <div className="h-12 bg-slate-800/80 rounded-xl w-full" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-400 border border-blue-500/20 mb-4">
            <CalendarRange className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Schedules Found</h3>
          <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6">
            You haven't added any vaccination schedules yet. Click the button below to add your first entry.
          </p>

          <Button
            onClick={() => navigate('/dashboard/create-schedule')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Schedule</span>
          </Button>
        </div>
      ) : (
        /* Modern Polished Table Layout */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold">Vaccine Name</th>
                  <th className="py-4 px-6 font-semibold">Recommended Age</th>
                  <th className="py-4 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {schedules.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/40 transition-colors group">

                    {/* Vaccine Name & Icon */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-400 border border-blue-500/20 shrink-0">
                          <Syringe className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-white tracking-wide">{item.name}</span>
                      </div>
                    </td>

                    {/* Recommended Age */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl text-slate-300 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{item.recommendedAge || item.date}</span>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/dashboard/update-schedule/${item._id}`, { state: { scheduleData: item } })}
                          className="bg-transparent border-slate-700 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl h-9 px-3 text-xs flex items-center gap-1.5 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleDelete(item._id)}
                          className="bg-transparent border-red-900/50 hover:bg-red-950/30 text-red-400 hover:text-red-300 rounded-xl h-9 px-3 text-xs flex items-center gap-1.5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;