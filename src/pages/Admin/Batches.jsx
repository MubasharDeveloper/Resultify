import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import BatchesLayer from "../../components/Admin/BatchesLayer";

const Batches = () => {
  return (
    <>

      <MasterLayout>
        <Breadcrumb title='Batches' />
        <BatchesLayer />
      </MasterLayout>

    </>
  );
};

export default Batches; 
