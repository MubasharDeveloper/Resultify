import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import BlankPageLayer from "../components/BlankPageLayer";

const BlankPagePage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Blank Page' />
        <BlankPageLayer />
      </MasterLayout>
    </>
  );
};

export default BlankPagePage;
