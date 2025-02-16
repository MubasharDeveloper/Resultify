import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import ListLayer from "../components/listLayer";

const ListPage = () => {
  return (
    <>
      <MasterLayout>
        <Breadcrumb title='List Page' />
        <ListLayer />
      </MasterLayout>
    </>
  );
};

export default ListPage;
