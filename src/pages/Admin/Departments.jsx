import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import DepartmentsLayer from "../../components/Admin/DepartmentsLayer";

const Departments = () => {
  return (
    <>

      <MasterLayout>
        <Breadcrumb title='Departments' />
        <DepartmentsLayer />
      </MasterLayout>

    </>
  );
};

export default Departments; 
