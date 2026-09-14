import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, Syringe, Package, TrendingUp } from 'lucide-react';

const DashboardHome = () => {
  const doctorName = localStorage.getItem('doctorName') || 'Umarwaheed';

  const [stats] = useState({
    totalPatients: 124,
    todaysAppointments: 18,
    dosesGiven: 450,
    vaccinesInStock: 85,
  });

  return (
    <div className="space-y-6">
      {/* Fixed Top Header for Dark Theme */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Welcome, Dr. <span className="text-blue-400">{doctorName}</span>!
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Here is an overview of your clinic activities and vaccination stats.
        </p>
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">

        {/* Card 1: Total Patients */}
        <Card className="bg-slate-900 border border-slate-800 text-white shadow-lg hover:border-slate-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Total Patients
            </CardTitle>
            <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400 border border-blue-500/10">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +12% from last month
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Today's Appointments */}
        <Card className="bg-slate-900 border border-slate-800 text-white shadow-lg hover:border-slate-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Today's Appointments
            </CardTitle>
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-500/10">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{stats.todaysAppointments}</div>
            <p className="text-xs text-slate-400 mt-2">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Doses Given */}
        <Card className="bg-slate-900 border border-slate-800 text-white shadow-lg hover:border-slate-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Doses Given
            </CardTitle>
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 border border-emerald-500/10">
              <Syringe className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{stats.dosesGiven}</div>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Total vaccines administered
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Vaccines in Stock */}
        <Card className="bg-slate-900 border border-slate-800 text-white shadow-lg hover:border-slate-700 transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              Vaccines in Stock
            </CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 border border-purple-500/10">
              <Package className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{stats.vaccinesInStock}</div>
            <p className="text-xs text-slate-400 mt-2">
              Available doses in inventory
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DashboardHome;