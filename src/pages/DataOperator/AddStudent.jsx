import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import AddStudentLayer from "../../components/DataOperator/AddStudentLayer";

const Batches = () => {
    return (
        <>

            <MasterLayout>
                <Breadcrumb title={`Add Students`} />
                <AddStudentLayer />
            </MasterLayout>

        </>
    );
};

export default Batches; 
