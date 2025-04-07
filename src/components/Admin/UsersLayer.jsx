import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db, collection, getDocs, updateDoc, doc, deleteDoc, addDoc } from '../../Firebase_config';
import { toast, Slide } from 'react-toastify';
import Swal from 'sweetalert2';
import { Button, Modal, Form } from 'react-bootstrap';
import { Card } from 'react-bootstrap/esm';


const UsersLayer = () => {


    const columns = [
        {
            name: '#',
            selector: (row, index) => index + 1,
            width: "60px",
        },
        {
            name: 'Department Name',
            selector: row => row.name,
            sortable: true,
        },
        {
            name: 'Department id',
            selector: row => row.id,
            sortable: true,
        },
        {
            name: 'Status',
            cell: row => (
                <Form.Check
                    type="switch"
                    id={`switch-${row.id}`}
                    checked={row.status === true}
                />
            ),
        },
        {
            name: 'Action',
            cell: row => (
                <div className="d-flex">
                    <Button
                        variant={'success'}
                        className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-success-600 p-2"
                    >
                        <Icon icon="lucide:edit" />
                    </Button>
                    <Button
                        variant={'danger'}
                        className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-danger-600 p-2"
                        
                    >
                        <Icon icon="mingcute:delete-2-line" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Card className="basic-data-table py-3">
                <Card.Body>
                    <DataTable
                        columns={columns}
                        // data={}
                        pagination
                        paginationPerPage={10}
                        highlightOnHover
                        responsive
                        striped
                        fixedHeader
                        subHeader
                        // subHeaderComponent={SearchComponent}
                        title={
                            <div className="d-flex justify-content-between align-items-center w-100 pe-2">
                                <h5 className="mb-0 h6">Departments</h5>
                                <Button variant="primary">
                                    Create Department
                                </Button>
                            </div>
                        }
                        noDataComponent={
                            <div className="text-center py-4">
                                <img
                                    src='../assets/images/no-data.svg' // or use an imported image
                                    alt="No Data"
                                    style={{ width: '280px', marginBottom: '20px', marginTop: '50px', opacity: 0.7 }}
                                />
                                <div style={{ fontSize: '1rem', color: '#6c757d' }}>
                                    No Users Found!
                                </div>
                            </div>
                        }
                    />
                </Card.Body>
            </Card>
        </>
    );
};

export default UsersLayer;
