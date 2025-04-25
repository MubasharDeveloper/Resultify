import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { db, collection, getDocs, updateDoc, doc, deleteDoc, addDoc } from '../../Firebase_config';
import { toast, Slide } from 'react-toastify';
import Swal from 'sweetalert2';
import { Button, Modal, Form } from 'react-bootstrap';
import { Card } from 'react-bootstrap/esm';
import { CustomLoader } from '../CustomLoader';
import NoDataTable from '../NoDataTable';


const DepartmentsLayer = () => {
    const [departments, setDepartments] = useState([]);
    const [loadingSwitchId, setLoadingSwitchId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [departmentName, setDepartmentName] = useState('');
    const [nameError, setNameError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [updateDepartmentName, setUpdateDepartmentName] = useState('');
    const [updateNameError, setUpdateNameError] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [loading, setLoading] = useState(true);  // Loading for user data fetch
    const [filterText, setFilterText] = useState('');


    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(filterText.toLowerCase())
    );

    const SearchComponent = (
        <input
            type="text"
            placeholder="Search by department name..."
            className="form-control w-25"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
        />
    );


    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setLoading(true);
                const departmentsCollectionRef = collection(db, 'Departments');
                const querySnapshot = await getDocs(departmentsCollectionRef);
                const departmentList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setDepartments(departmentList);
            } catch (error) {
                console.log('Error fetching departments. Error: ', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    const handleStatusChange = async (departmentId, currentStatus) => {
        setLoadingSwitchId(departmentId);
        const newStatus = !currentStatus;
        const departmentRef = doc(db, 'Departments', departmentId);

        try {
            await updateDoc(departmentRef, { status: newStatus });
            setDepartments(prev =>
                prev.map(dep =>
                    dep.id === departmentId ? { ...dep, status: newStatus } : dep
                )
            );
            toast.success(`Department ${newStatus ? 'activated' : 'deactivated'} successfully`, {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });
        } catch (error) {
            toast.error('Failed to update status', {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });
        } finally {
            setLoadingSwitchId(null);
        }
    };

    const handleDelete = async (departmentId) => {
        if (!departmentId) {
            toast.error(`Failed to delete department: Invalid ID ${departmentId}`);
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            text: 'You will not be able to recover this department!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const departmentRef = doc(db, 'Departments', departmentId);
                    await deleteDoc(departmentRef);

                    setDepartments(prev => prev.filter(dep => dep.id !== departmentId));

                    toast.success('Department deleted successfully!', {
                        position: "top-right",
                        autoClose: 3000,
                        theme: "light",
                        transition: Slide,
                    });
                } catch (error) {
                    toast.error('Failed to delete department', {
                        position: "top-right",
                        autoClose: 3000,
                        theme: "light",
                        transition: Slide,
                    });
                }
            }
        });
    };

    const handleCreateDepartment = async () => {
        if (!departmentName.trim()) {
            setNameError("Department name is required");
            return;
        }

        const exists = departments.some(dep =>
            dep.name.trim().toLowerCase() === departmentName.trim().toLowerCase()
        );

        if (exists) {
            setNameError("A department with this name already exists");
            return;
        }

        setIsCreating(true);
        setNameError('');

        try {
            const docRef = await addDoc(collection(db, 'Departments'), {
                name: departmentName.trim(),
                status: true,
                createdAt: new Date(),
            });

            setDepartments(prev => [
                ...prev,
                { id: docRef.id, name: departmentName.trim(), status: true, createdAt: new Date() },
            ]);

            toast.success("Department created successfully", {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
            });

            setDepartmentName('');
            setShowCreateModal(false);
        } catch (error) {
            toast.error("Failed to create department", {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateDepartment = async () => {
        if (!updateDepartmentName.trim()) {
            setUpdateNameError("Department name is required");
            return;
        }

        const exists = departments.some(
            (dep) =>
                dep.name.trim().toLowerCase() === updateDepartmentName.trim().toLowerCase() &&
                dep.id !== editingDepartment?.id
        );

        if (exists) {
            setUpdateNameError("A department with this name already exists");
            return;
        }

        setIsUpdating(true);
        setUpdateNameError('');

        try {
            const departmentRef = doc(db, 'Departments', editingDepartment.id);
            await updateDoc(departmentRef, { name: updateDepartmentName.trim() });

            setDepartments((prev) =>
                prev.map((dep) =>
                    dep.id === editingDepartment.id ? { ...dep, name: updateDepartmentName.trim() } : dep
                )
            );

            toast.success("Department updated successfully", {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
            });

            setShowUpdateModal(false);
            setEditingDepartment(null);
            setUpdateDepartmentName('');
        } catch (error) {
            toast.error("Failed to update department", {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
            });
        } finally {
            setIsUpdating(false);
        }
    };

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
                    onChange={() => handleStatusChange(row.id, row.status)}
                    disabled={loadingSwitchId === row.id}
                />
            ),
        },
        {
            name: 'Action',
            cell: row => (
                <div className="d-flex">
                    <Button
                        onClick={() => {
                            setEditingDepartment(row);
                            setUpdateDepartmentName(row.name);
                            setShowUpdateModal(true);
                            setUpdateNameError('');
                        }}
                        variant={'success'}
                        className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-success-600 p-2"
                    >
                        <Icon icon="lucide:edit" />
                    </Button>
                    {/* <Button
                        onClick={() => handleDelete(row.id)}
                        variant={'danger'}
                        className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-danger-600 p-2"
                        disabled={deletingId === row.id}
                    >
                        <Icon icon="mingcute:delete-2-line" />
                    </Button> */}
                </div>
            ),
        },
    ];


    return (
        <>
            <Card className="basic-data-table py-3">
                <Card.Body>
                    {
                        loading ? (
                            <CustomLoader size={'80px'} />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredDepartments}
                                pagination
                                paginationPerPage={20}
                                highlightOnHover
                                responsive
                                striped
                                fixedHeader
                                subHeader
                                subHeaderComponent={SearchComponent}
                                title={
                                    <div className="d-flex justify-content-between align-items-center w-100 pe-2">
                                        <h5 className="mb-0 h6">Departments</h5>
                                        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                            Create Department
                                        </Button>
                                    </div>
                                }
                                noDataComponent={
                                    <NoDataTable img={'../assets/images/no-data.svg'} text={'No Departments Found!'} />
                                }
                            />
                        )
                    }
                </Card.Body>
            </Card>

            {/* Create Department Modal */}
            <Modal show={showCreateModal} centered onHide={() => setShowCreateModal(false)}>
                <Modal.Header className='d-flex justify-content-center'>
                    <Modal.Title className='h6'>Create New Department</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="departmentName" className="mb-3">
                        <Form.Label>Department Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter department name"
                            value={departmentName}
                            className={`${nameError && 'error-field'}`}
                            onChange={(e) => setDepartmentName(e.target.value)}
                        />
                        {nameError && (
                            <div className='error-message'>
                                {nameError}
                            </div>
                        )}
                    </Form.Group>
                    <div className='d-flex justify-content-end gap-2'>
                        <Button variant="secondary" onClick={() => {
                            setShowCreateModal(false);
                            setDepartmentName('');
                            setNameError('');
                        }}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreateDepartment}
                            disabled={isCreating}
                        >
                            {isCreating ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Update Department Modal */}
            <Modal show={showUpdateModal} centered onHide={() => setShowUpdateModal(false)}>
                <Modal.Header className='d-flex justify-content-center'>
                    <Modal.Title className='h6'>Update Department</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="updateDepartmentName" className="mb-3">
                        <Form.Label>Department Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter department name"
                            value={updateDepartmentName}
                            className={`${nameError && 'error-field'}`}
                            onChange={(e) => setUpdateDepartmentName(e.target.value)}
                        />
                        {updateNameError && (
                            <div className='error-message'>
                                {updateNameError}
                            </div>
                        )}
                    </Form.Group>
                    <div className='d-flex justify-content-end gap-2'>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowUpdateModal(false);
                                setUpdateDepartmentName('');
                                setUpdateNameError('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpdateDepartment}
                            disabled={isUpdating}
                        >
                            {isUpdating ? 'Updating...' : 'Update'}
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

        </>
    );
};

export default DepartmentsLayer;
