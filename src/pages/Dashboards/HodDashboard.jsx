import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import DashBoardLayerOne from "../../components/DashBoardLayerOne";

const HomePageOne = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title="Head of Department" />
        <DashBoardLayerOne />
      </MasterLayout>
    </>
  );
};

export default HomePageOne;
