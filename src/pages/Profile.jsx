import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ProfileLayer from "../components/ProfileLayer";


const Profile = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        {/* <Breadcrumb title="Student Profile" /> */}

        {/* ViewProfileLayer */}
        <ProfileLayer />

      </MasterLayout>

    </>
  );
};

export default Profile; 
