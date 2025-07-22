import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { ToastContainer } from 'react-toastify';
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import RouteScrollToTop from "./helper/RouteScrollToTop";

// Pages
import SignInPage from "./pages/Authentication/SignInPage";
import SignUpPage from "./pages/Authentication/SignUpPage";
import ForgotPasswordPage from "./pages/Authentication/ForgotPasswordPage";
import CheckResultPage from "./pages/Authentication/CheckResultPage";
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
import ViewStudents from './components/ViewStudents'
import DropoutStudents from './components/DropoutStudents'

import ManageResult from './components/Result/ManageResult';
import StudentResult from './components/Result/StudentResult';

const Loader = () => (
  <div id="preloader">
    <div id="loader"></div>
  </div>
);

const PageWrapper = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);

  return loading ? <Loader /> : children;
};

// Route configuration
const routeConfig = [
  // Public routes
  { path: '/', element: <LandingPage />, public: true },
  { path: '/sign-in', element: <SignInPage />, public: true },
  { path: '/sign-up', element: <SignUpPage />, public: true },
  { path: '/forgot-password', element: <ForgotPasswordPage />, public: true },
  { path: '/check-result', element: <CheckResultPage />, public: true },
  { path: '/student-results', element: <StudentResult />, public: true },
  { path: '/unauthorized', element: <AccessDeniedPage />, public: true },

  // Protected routes with role requirements
  { 
    path: '/dashboard', 
    element: <Dashboard />, 
    roles: ['Admin', 'HOD', 'Teacher', 'Data Operator'] 
  },
  { 
    path: '/admin-dashboard', 
    element: <AdminDashboard />, 
    roles: ['Admin'] 
  },
  { 
    path: '/hod-dashboard', 
    element: <HodDashboard />, 
    roles: ['HOD'] 
  },
  { 
    path: '/teacher-dashboard', 
    element: <TeacherDashboard />, 
    roles: ['Teacher'] 
  },
  { 
    path: '/departments', 
    element: <Departments />, 
    roles: ['Admin'] 
  },
  { 
    path: '/manage-requests', 
    element: <ManageRequests />, 
    roles: ['Admin'] 
  },
  { 
    path: '/batches', 
    element: <Batches />, 
    roles: ['Admin', 'HOD'] 
  },
  { 
    path: '/manage-users', 
    element: <Users />, 
    roles: ['Admin', 'HOD'] 
  },
  { 
    path: '/subjects', 
    element: <Subjects />, 
    roles: ['HOD', 'Data Operator'] 
  },
  { 
    path: '/view-students', 
    element: <ViewStudents />, 
    roles: ['HOD'] 
  },
  { 
    path: '/dropout-students', 
    element: <DropoutStudents />, 
    roles: ['HOD'] 
  },
  { 
    path: '/semesters', 
    element: <Semesters />, 
    roles: ['HOD'] 
  },
  { 
    path: '/leactures', 
    element: <TimeTable />, 
    roles: ['HOD'] 
  },
  { 
    path: '/profile', 
    element: <Profile />, 
    roles: ['Admin', 'HOD', 'Teacher', 'Data Operator'] 
  },
  { 
    path: '/add-students', 
    element: <AddStudent />, 
    roles: ['Data Operator', 'HOD'] 
  },
  { 
    path: '/manage-result', 
    element: <ManageResult />, 
    roles: ['Teacher', 'HOD'] 
  },

  // Catch-all route
  { path: '*', element: <ErrorPage />, public: true }
];

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageWrapper>
          <RouteScrollToTop />
          <ToastContainer />
          <Routes>
            {routeConfig.map((route, index) => {
              if (route.public) {
                return (
                  <Route 
                    key={index} 
                    exact 
                    path={route.path} 
                    element={route.element} 
                  />
                );
              } else {
                return (
                  <Route 
                    key={index} 
                    exact 
                    path={route.path} 
                    element={
                      <PrivateRoute allowedRoles={route.roles}>
                        {route.element}
                      </PrivateRoute>
                    } 
                  />
                );
              }
            })}
          </Routes>
        </PageWrapper>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;