import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import TimeTableLayer from "../../components/Admin/TimeTableLayer";

const Subjects = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='TimeTable' />
        <TimeTableLayer />
      </MasterLayout>
    </>
  );
};

export default Subjects; 