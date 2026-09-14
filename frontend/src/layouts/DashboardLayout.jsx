import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Syringe, Bell, LogOut, CalendarRange, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const DashboardLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/doctor/logout', {}, { withCredentials: true }).catch(() => {});
    } catch (error) {
      console.error("Logout API Error:", error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/25 rounded-xl text-blue-400 border border-blue-500/20">
            <Syringe className="w-5 h-5" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-white tracking-wide">
            Vax<span className="text-blue-500">Care</span>
          </span>
        </div>

        {/* Right Action Icons (Bell & Logout) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg relative h-9 w-9"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></span>
          </Button>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="border border-red-500/40 text-red-500 hover:bg-red-500/10 hover:border-red-500/70 text-xs font-medium h-9 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-xs font-medium hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Body Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Menu */}
        <aside className="hidden md:flex w-60 bg-slate-900 border-r border-slate-800 p-4 flex-col justify-between shrink-0">
          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">
              Menu
            </p>

            <nav className="space-y-1.5">
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/dashboard/clinic"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Building2 className="w-5 h-5" />
                <span>Clinic</span>
              </NavLink>

              <NavLink
                to="/dashboard/patients"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Users className="w-5 h-5" />
                <span>Patients</span>
              </NavLink>

              {/* Added Vaccine Brands NavLink */}
              <NavLink
                to="/dashboard/vaccine-brands"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Syringe className="w-5 h-5" />
                <span>Vaccine Brands</span>
              </NavLink>

              <NavLink
                to="/dashboard/schedule"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <CalendarRange className="w-5 h-5" />
                <span>Doctor Schedule</span>
              </NavLink>
            </nav>
          </div>
        </aside>

        {/* Dynamic Center Main Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;