import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import FormLayer from "../components/FormLayer";

const FormPage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='Form Page' />
        <FormLayer />
      </MasterLayout>
    </>
  );
};

export default FormPage;
