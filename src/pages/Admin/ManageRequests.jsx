import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import ManageRequestLayer from "../../components/Admin/ManageRequestLayer";

const Users = () => {
  return (
    <>

      <MasterLayout>
        <Breadcrumb title='Manage Requests' />
        <ManageRequestLayer />
      </MasterLayout>

    </>
  );
};

export default Users; 
