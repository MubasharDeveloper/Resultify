import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import ViewProfileLayer from "../../components/Profile/ProfileLayer";


const ProfilePage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title="Profile" />
        <ViewProfileLayer />
      </MasterLayout>

    </>
  );
};

export default ProfilePage; 
