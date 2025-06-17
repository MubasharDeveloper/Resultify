import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import DashboardLayer from '../../components/Dashboards/DashboardLayer';
import { useAuth } from "../../context/AuthContext";

const HodDashboard = () => {
  const { user } = useAuth();
  return (
    <>
      <MasterLayout>
        <Breadcrumb title={`Data Operator (${user.departmentName})`} />
        <DashboardLayer />
      </MasterLayout>
    </>
  );
};

export default HodDashboard;
