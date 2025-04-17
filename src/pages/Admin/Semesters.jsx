import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import SemestersLayer from "../../components/Admin/SemestersLayer";

const Semesters = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Semesters' />
        <SemestersLayer />
      </MasterLayout>
    </>
  );
};

export default Semesters; 