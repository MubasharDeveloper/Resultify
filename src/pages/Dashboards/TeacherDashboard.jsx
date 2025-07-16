import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import HodDashboardLayer from '../../components/Dashboards/HodDashboardLayer';

const TeacherDashboard = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title="Teacher" />
        <HodDashboardLayer />
      </MasterLayout>
    </>
  );
};

export default TeacherDashboard;
