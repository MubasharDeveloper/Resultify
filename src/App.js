import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { ToastContainer } from 'react-toastify';
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";

// Used Pages

import RouteScrollToTop from "./helper/RouteScrollToTop";
import SignInPage from "./pages/Authentication/SignInPage";
import SignUpPage from "./pages/Authentication/SignUpPage";
import ForgotPasswordPage from "./pages/Authentication/ForgotPasswordPage";
import ErrorPage from "./pages/ErrorPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";

import AdminDashboard from "./pages/Dashboards/AdminDashboard";
import ManageRequests from "./pages/Admin/ManageRequests";
import HodDashboard from "./pages/Dashboards/HodDashboard";
import TeacherDashboard from "./pages/Dashboards/TeacherDashboard";
import Dashboard from "./pages/Dashboards/Dashboard";

import AddStudent from "./pages/DataOperator/AddStudent";

import LandingPage from "./pages/LandingPage/index";

import Departments from "./pages/Admin/Departments";
import Batches from "./pages/Admin/Batches";
import Subjects from "./pages/Admin/Subjects";
import Semesters from "./pages/Admin/Semesters";
import Users from "./pages/Admin/Users";
import TimeTable from "./pages/Admin/TimeTable";
import Profile from "./pages/Profile/Profile";


const Loader = () => (
  <div id="preloader">
    <div id="loader"></div>
  </div>
);

const PageWrapper = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setLoading(true); // Show loader on route change
    const timer = setTimeout(() => {
      setLoading(false); // Hide loader after 1.5 sec
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);

  return loading ? <Loader /> : children;
};


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageWrapper>
          <RouteScrollToTop />
          <ToastContainer />
          <Routes>

            <Route exact path='/' element={<LandingPage />} />

            <Route exact path='/sign-in' element={<SignInPage />} />
            <Route exact path='/sign-up' element={<SignUpPage />} />
            <Route exact path='/forgot-password' element={<ForgotPasswordPage />} />
            <Route exact path='/unauthorized' element={<AccessDeniedPage />} />

            <Route exact path='/admin-dashboard' element={
              <PrivateRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } />

            <Route exact path='/departments' element={
              <PrivateRoute allowedRoles={['Admin']}>
                <Departments />
              </PrivateRoute>
            } />

            <Route exact path='/manage-requests' element={
              <PrivateRoute allowedRoles={['Admin']}>
                <ManageRequests />
              </PrivateRoute>
            } />

            <Route exact path='/batches' element={
              <PrivateRoute allowedRoles={['Admin', 'HOD']}>
                <Batches />
              </PrivateRoute>
            } />

            <Route exact path='/manage-users' element={
              <PrivateRoute allowedRoles={['Admin', 'HOD']}>
                <Users />
              </PrivateRoute>
            } />

            <Route exact path='/hod-dashboard' element={
              <PrivateRoute allowedRoles={['HOD']}>
                <HodDashboard />
              </PrivateRoute>
            } />

            <Route exact path='/subjects' element={
              <PrivateRoute allowedRoles={['HOD', 'Data Operator']}>
                <Subjects />
              </PrivateRoute>
            } />

            <Route exact path='/semesters' element={
              <PrivateRoute allowedRoles={['HOD']}>
                <Semesters />
              </PrivateRoute>
            } />

            <Route exact path='/leactures' element={
              <PrivateRoute allowedRoles={['HOD']}>
                <TimeTable />
              </PrivateRoute>
            } />

            <Route exact path='/teacher-dashboard' element={
              <PrivateRoute allowedRoles={['Teacher']}>
                <TeacherDashboard />
              </PrivateRoute>
            } />

            <Route exact path='/profile' element={
              <PrivateRoute allowedRoles={['Admin', 'HOD', 'Teacher']}>
                <Profile />
              </PrivateRoute>
            } />

            <Route exact path='/dashboard' element={
              <PrivateRoute allowedRoles={['Data Operator']}>
                <Dashboard />
              </PrivateRoute>
            } />

            <Route exact path='/add-students' element={
              <PrivateRoute allowedRoles={['Data Operator']}>
                <AddStudent />
              </PrivateRoute>
            } />

            <Route exact path='*' element={<ErrorPage />} />

            {/* End Used Routes */}

          </Routes>
        </PageWrapper>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
