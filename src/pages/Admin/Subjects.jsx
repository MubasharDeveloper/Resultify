import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import SubjectsLayer from "../../components/Admin/SubjectsLayer";

const Subjects = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Subjects' />
        <SubjectsLayer />
      </MasterLayout>
    </>
  );
};

export default Subjects; 