import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Auth & Public Pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import VerifyOtp from './pages/auth/VerifyOtp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Protection Component
import ProtectedRoute from './components/ProtectedRoute';

// Dashboard & Clinic Pages
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import ClinicView from './pages/clinic/ClinicView';
import CreateClinic from './pages/clinic/CreateClinic';
import EditClinic from './pages/clinic/EditClinic';

// Schedule Pages
import ScheduleView from './pages/schedule/ScheduleView';
import CreateSchedule from './pages/schedule/CreateSchedule';
import UpdateSchedule from './pages/schedule/UpdateSchedule';

// Patient Pages & Vaccination Card
import PatientView from './pages/patient/PatientView';
import CreatePatient from './pages/patient/CreatePatient';
import EditPatient from './pages/patient/EditPatient';
import PatientVaccinationCard from './pages/patient/PatientVaccinationCard';

// Vaccine Brand Pages (Naya Import)
import VaccineBrandsView from './pages/vaccineBrand/VaccineBrandsView';
import CreateVaccineBrand from './pages/vaccineBrand/CreateVaccineBrand';
import EditVaccineBrand from './pages/vaccineBrand/EditVaccineBrand';
// Agar aapke paas Create/Edit ke liye alag components hain toh unhein yahan import kar sakte hain:
// import CreateVaccineBrand from './pages/vaccineBrand/CreateVaccineBrand';
// import EditVaccineBrand from './pages/vaccineBrand/EditVaccineBrand';

const router = createBrowserRouter([
  // Public Routes
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/verify-otp", element: <VerifyOtp /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },

  // Protected Dashboard Routes (Fully Secured via ProtectedRoute)
  {
    element: <ProtectedRoute />, 
    children: [
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <DashboardHome />,
          },
          {
            path: "clinic",
            element: <ClinicView />,
          },
          {
            path: "create-clinic",
            element: <CreateClinic />,
          },
          {
            path: "edit-clinic/:clinicId",
            element: <EditClinic />,
          },
          // Doctor Schedule Routes
          {
            path: "schedule",
            element: <ScheduleView />,
          },
          {
            path: "create-schedule",
            element: <CreateSchedule />,
          },
          {
            path: "update-schedule/:id",
            element: <UpdateSchedule />,
          },
          // Patient Management Routes
          {
            path: "patients",
            element: <PatientView />,
          },
          {
            path: "create-patient",
            element: <CreatePatient />,
          },
          {
            path: "edit-patient/:patientId",
            element: <EditPatient />,
          },
          {
            path: "patient-vaccination/:patientId",
            element: <PatientVaccinationCard />,
          },
          // ==========================================
          // Naye Vaccine Brand Routes (Added Successfully)
          // ==========================================
          {
            path: "vaccine-brands",
            element: <VaccineBrandsView />,
          },
          
          {
            path: "create-vaccine-brand",
            element: <CreateVaccineBrand />,
          },
          {
            path: "edit-vaccine-brand/:brandId",
            element: <EditVaccineBrand />,
          },
        ],
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;