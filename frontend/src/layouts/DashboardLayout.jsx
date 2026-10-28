import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Syringe, Bell, LogOut, CalendarRange, Users, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import DoctorProfileCard from '@/components/DoctorProfileCard';

// Single source of truth for the menu: the desktop sidebar and the mobile drawer are the SAME element,
// so a new page is added here once.
const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/clinic', label: 'Clinic', icon: Building2 },
  { to: '/dashboard/patients', label: 'Patients', icon: Users },
  { to: '/dashboard/vaccine-brands', label: 'Vaccine Brands', icon: Syringe },
  { to: '/dashboard/schedule', label: 'Doctor Schedule', icon: CalendarRange },
  { to: '/dashboard/alerts', label: 'Alerts', icon: Bell },
];

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${isActive
    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
  }`;

// Tailwind's "md" breakpoint: from here up the sidebar is always visible and the drawer is not needed
const DESKTOP_QUERY = '(min-width: 768px)';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false); // mobile drawer only; ignored on desktop
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const wasOpenRef = useRef(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  // Any navigation closes the drawer: menu links, the profile card at the bottom, or code calling navigate()
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Escape closes the drawer (listener only exists while it is open)
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  // Rotating a tablet / resizing the window to desktop width must not leave the drawer "open" behind the scenes
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => {
      if (e.matches) setIsMenuOpen(false);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  // Keyboard users: focus moves into the drawer when it opens and back to the hamburger button when it closes
  useEffect(() => {
    if (isMenuOpen) closeButtonRef.current?.focus();
    else if (wasOpenRef.current) menuButtonRef.current?.focus();
    wasOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/v1/doctors/logout', {}, { withCredentials: true }).catch(() => { });
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
        <div className="flex items-center gap-3">
          {/* Hamburger (mobile only): opens the sidebar drawer */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            aria-controls="app-sidebar"
            aria-expanded={isMenuOpen}
            className="md:hidden -ml-1 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/25 rounded-xl text-blue-400 border border-blue-500/20">
              <Syringe className="w-5 h-5" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Vax<span className="text-blue-500">Care</span>
            </span>
          </div>
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
        {/* Backdrop (mobile only): tap outside the drawer to close it */}
        <div
          aria-hidden="true"
          onClick={closeMenu}
          className={`fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none md:hidden ${isMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
        />

        {/* Left Sidebar Menu
            - below md: a drawer fixed to the left edge that slides in and out (closed = off-screen AND invisible,
              so its links are not reachable with the Tab key)
            - md and up: the normal static sidebar, always visible */}
        <aside
          id="app-sidebar"
          aria-label="Sidebar"
          className={`fixed inset-y-0 left-0 z-40 flex w-64 max-w-[85vw] flex-col justify-between overflow-y-auto bg-slate-900 border-r border-slate-800 p-4 shadow-2xl shrink-0 transition-[transform,translate,visibility] duration-300 ease-in-out motion-reduce:transition-none md:static md:z-auto md:w-60 md:max-w-none md:translate-x-0 md:visible md:shadow-none ${isMenuOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'
            }`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">
                Menu
              </p>

              {/* Close button (mobile only) */}
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={closeMenu} className={navLinkClass}>
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Signed-in doctor, pinned to the bottom of the menu (the aside is flex-col justify-between).
              Opening the profile changes the route, which closes the drawer. */}
          <DoctorProfileCard />
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