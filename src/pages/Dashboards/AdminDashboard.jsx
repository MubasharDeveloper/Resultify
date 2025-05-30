import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import AdminDashboardLayer from "../../components/Dashboards/AdminDashbardLayer"

const AdminDashboard = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title="Admin" />
        <AdminDashboardLayer />
      </MasterLayout>
    </>
  );
};

export default AdminDashboard;
