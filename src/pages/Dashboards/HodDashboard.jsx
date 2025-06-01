import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import HodDashboardLayer from '../../components/Dashboards/HodDashboardLayer';
import { useAuth } from "../../context/AuthContext";

const HodDashboard = () => {
  const { user } = useAuth();
  return (
    <>
      <MasterLayout>
        <Breadcrumb title={`Head of Department (${user.departmentName})`} />
        <HodDashboardLayer />
      </MasterLayout>
    </>
  );
};

export default HodDashboard;
