import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import UsersLayer from "../../components/Admin/UsersLayer";

const Users = () => {
  return (
    <>

      <MasterLayout>
        <Breadcrumb title='Users' />
        <UsersLayer />
      </MasterLayout>

    </>
  );
};

export default Users; 
