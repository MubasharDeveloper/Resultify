import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import TableDataLayer from "../components/DepartmentsLayer";

const Departments = () => {
  return (
    <>

      <MasterLayout>
        <Breadcrumb title='Departments' />
        <TableDataLayer />
      </MasterLayout>

      {/* <button
        onClick={() => handleDelete(row.id)}
        className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
        disabled={deletingId === row.id} // 👈 disable while deleting
      >
        <Icon icon="mingcute:delete-2-line" />
      </button> */}

    </>
  );
};

export default Departments; 
