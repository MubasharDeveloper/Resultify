import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { db, collection, getDocs, updateDoc, doc, deleteDoc, addDoc } from '../Firebase_config';
import { toast, Slide } from 'react-toastify';
import Swal from 'sweetalert2';
import { Button, Modal, Form } from 'react-bootstrap';
import { Card } from 'react-bootstrap/esm';

const DepartmentsLayer = () => {
    const [departments, setDepartments] = useState([]);
    const [loadingSwitchId, setLoadingSwitchId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [departmentName, setDepartmentName] = useState('');
    const [nameError, setNameError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchDepartments = async () => {
            const departmentsCollectionRef = collection(db, 'Departments');
            const querySnapshot = await getDocs(departmentsCollectionRef);
            const departmentList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setDepartments(departmentList);
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
                autoClose: 5000,
                theme: "colored",
                transition: Slide,
            });
        } catch (error) {
            toast.error('Failed to update status', {
                position: "top-right",
                autoClose: 5000,
                theme: "colored",
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
                        autoClose: 5000,
                        theme: "colored",
                        transition: Slide,
                    });
                } catch (error) {
                    toast.error('Failed to delete department', {
                        position: "top-right",
                        autoClose: 5000,
                        theme: "colored",
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
                autoClose: 5000,
                theme: "colored",
            });

            setDepartmentName('');
            setShowCreateModal(false);
        } catch (error) {
            toast.error("Failed to create department", {
                position: "top-right",
                autoClose: 5000,
                theme: "colored",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const columns = [
        {
            name: 'S.L',
            selector: (row, index) => index + 1,
        },
        {
            name: 'Department Name',
            selector: row => row.name,
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
                        variant={'primary'}
                        className="w-32-px h-32-px me-8 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-primary-600 p-2"
                    >
                        <Icon icon="charm:eye" />
                    </Button>
                    <Button
                        variant={'success'}
                        className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-success-600 p-2"
                    >
                        <Icon icon="lucide:edit" />
                    </Button>
                    <Button
                        onClick={() => handleDelete(row.id)}
                        variant={'danger'}
                        className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-danger-600 p-2"
                        disabled={deletingId === row.id}
                    >
                        <Icon icon="mingcute:delete-2-line" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Card className="basic-data-table">
                <Card.Header className="d-flex justify-content-end">
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>Create Department</Button>
                </Card.Header>
                <Card.Body>
                    <DataTable
                        columns={columns}
                        data={departments}
                        title='Departments'
                        pagination
                        paginationPerPage={10}
                        noDataComponent="No departments available"
                        highlightOnHover
                        responsive
                        fixedHeader
                        subHeader
                    />
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
                            onChange={(e) => setDepartmentName(e.target.value)}
                            style={{ borderColor: nameError ? '#dc3545' : undefined }}
                        />
                        {nameError && (
                            <div style={{ color: '#dc3545', fontSize: '0.875em', marginTop: '0.25rem' }}>
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
        </>
    );
};

export default DepartmentsLayer;
