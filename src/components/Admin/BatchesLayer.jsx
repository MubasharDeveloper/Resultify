import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button, Modal, Form, Card } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { db, collection, getDocs, addDoc, query, where, doc, updateDoc, orderBy, deleteDoc } from '../../Firebase_config';
import { toast, Slide } from 'react-toastify';
import Swal from 'sweetalert2';
import { CustomLoader } from '../CustomLoader';
import NoDataTable from '../NoDataTable';

const Batches = () => {
    const [departments, setDepartments] = useState([]);
    const [activeDepartments, setActiveDepartments] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);  // Loading for user data fetch
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 2; // 2 years backward
    const maxYear = currentYear + 4; // 4 years forward

    const [form, setForm] = useState({
        departmentId: "",
        startYear: currentYear, // Default to current year
        batchDuration: "",
        shift: "Morning",
    });
    const [showModal, setShowModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false); // Add this state to track loading
    const [selectedBatch, setSelectedBatch] = useState(null); // State to hold selected batch for update
    const [touchedFields, setTouchedFields] = useState({}); // Track touched fields

    const [loadingSwitchId, setLoadingSwitchId] = useState(null); // Track the ID of the batch being updated

    const [searchText, setSearchText] = useState('');


    // Fetch departments and batches
    const fetchData = async () => {
        const activeDeptQuery = query(
            collection(db, "Departments"),
            where("status", "==", true)
        );
        const activeDeptSnap = await getDocs(activeDeptQuery);
        const deptSnap = await getDocs(collection(db, "Departments"));

        const batchQuery = query(
            collection(db, "Batches"),
            orderBy("startYear", "desc")
        );
        const batchSnap = await getDocs(batchQuery);

        setActiveDepartments(activeDeptSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setDepartments(deptSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        setBatches(
            batchSnap.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    // First sort by startYear (descending)
                    if (b.startYear !== a.startYear) {
                        return b.startYear - a.startYear;
                    }

                    // If startYear is equal, sort by department name (ascending)
                    const deptA = getDeptName(a.departmentId);
                    const deptB = getDeptName(b.departmentId);
                    if (deptA < deptB) return -1;
                    if (deptA > deptB) return 1;

                    // If department is equal, sort by shift (Morning first)
                    if (a.shift === 'Morning' && b.shift !== 'Morning') return -1;
                    if (a.shift !== 'Morning' && b.shift === 'Morning') return 1;

                    // If all else is equal, maintain original order
                    return 0;
                })
        );
    }


    useEffect(() => {
        const fetchBatchData = async () => {
            setLoading(true);
            try {
                const activeDeptQuery = query(
                    collection(db, "Departments"),
                    where("status", "==", true)
                );
                const activeDeptSnap = await getDocs(activeDeptQuery);
                const deptSnap = await getDocs(collection(db, "Departments"));

                const batchQuery = query(
                    collection(db, "Batches"),
                    orderBy("startYear", "desc")
                );
                const batchSnap = await getDocs(batchQuery);

                setActiveDepartments(activeDeptSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
                setDepartments(deptSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

                setBatches(
                    batchSnap.docs
                        .map((doc) => ({ id: doc.id, ...doc.data() }))
                        .sort((a, b) => {
                            // First sort by startYear (descending)
                            if (b.startYear !== a.startYear) {
                                return b.startYear - a.startYear;
                            }

                            // If startYear is equal, sort by department name (ascending)
                            const deptA = getDeptName(a.departmentId);
                            const deptB = getDeptName(b.departmentId);
                            if (deptA < deptB) return -1;
                            if (deptA > deptB) return 1;

                            // If department is equal, sort by shift (Morning first)
                            if (a.shift === 'Morning' && b.shift !== 'Morning') return -1;
                            if (a.shift !== 'Morning' && b.shift === 'Morning') return 1;

                            // If all else is equal, maintain original order
                            return 0;
                        })
                );
            } catch (error) {
                console.log('Error fetching batches. Error: ', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBatchData();
    }, []);

    const getDeptName = (id) => {
        const dept = departments.find((d) => d.id === id);
        return dept ? dept.name : "Unknown";
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouchedFields({ ...touchedFields, [name]: true });

        // Validate individual field when it loses focus
        if (name === 'batchDuration') {
            const value = Number(form.batchDuration);
            if (value < 1 || value > 4) {
                setFormErrors({
                    ...formErrors,
                    batchDuration: "Batch Duration must be between 1 and 4 years"
                });
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        if (name === 'startYear') {
            processedValue = Number(value);
            if (processedValue < minYear) processedValue = minYear;
            if (processedValue > maxYear) processedValue = maxYear;
        }

        if (name === 'batchDuration') {
            processedValue = Number(value);
            if (processedValue < 1) processedValue = 1;
            if (processedValue > 4) processedValue = 4;

            // Clear error if user corrects it
            if (formErrors.batchDuration && processedValue >= 1 && processedValue <= 4) {
                const newErrors = { ...formErrors };
                delete newErrors.batchDuration;
                setFormErrors(newErrors);
            }
        }

        setForm({ ...form, [name]: processedValue });
    };

    // Calculate the end year based on start year and batch duration
    const calculateEndYear = (startYear, batchDuration) => {
        return Number(startYear) + Number(batchDuration);
    };

    // Validate form
    const validateForm = () => {
        const errors = {};
        let isValid = true;

        if (!form.departmentId) {
            errors.departmentId = "Department is required";
            isValid = false;
        }

        if (!form.startYear) {
            errors.startYear = "Start Year is required";
            isValid = false;
        }

        if (!form.batchDuration) {
            errors.batchDuration = "Batch Duration is required";
            isValid = false;
        } else if (form.batchDuration < 1 || form.batchDuration > 4) {
            errors.batchDuration = "Batch Duration must be between 1 and 4 years";
            isValid = false;
        }

        if (!form.shift) {
            errors.shift = "Shift is required";
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields at once
        const isValid = validateForm();
        if (!isValid) {
            // Mark all fields as touched to show errors
            setTouchedFields({
                departmentId: true,
                startYear: true,
                batchDuration: true,
                shift: true
            });
            return;
        }

        setIsLoading(true);

        const endYear = calculateEndYear(form.startYear, form.batchDuration);

        // Duplicate check logic
        const q = query(
            collection(db, "Batches"),
            where("departmentId", "==", form.departmentId),
            where("startYear", "==", Number(form.startYear)),
            where("endYear", "==", endYear),
            where("shift", "==", form.shift),
            where("status", "==", true)
        );

        const duplicate = await getDocs(q);
        if (!duplicate.empty) {
            toast.error('A batch with these details already exists.', {
                position: "top-right",
                autoClose: 3000,
                theme: "colored",
                transition: Slide,
            });
            setIsLoading(false);
            return;
        }

        const payload = {
            ...form,
            startYear: Number(form.startYear),
            endYear: endYear,
        };

        try {
            await addDoc(collection(db, "Batches"), payload);
            fetchData();
            setForm({
                departmentId: "",
                startYear: currentYear,
                batchDuration: "",
                shift: "Morning",
                status: true,
            });
            setFormErrors({});
            setTouchedFields({});
            setShowModal(false);
            toast.success('Batch created successfully!', {
                position: "top-right",
                autoClose: 3000,
                theme: "colored",
                transition: Slide,
            });
        } catch (error) {
            toast.error('Error creating batch. Please try again.', {
                position: "top-right",
                autoClose: 3000,
                theme: "colored",
                transition: Slide,
            });

        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseModal = () => {
        // Check if there are unsaved changes
        if (form.departmentId || form.batchDuration) {
            // Show confirmation alert if there are unsaved changes
            Swal.fire({
                title: 'Are you sure?',
                text: "You have unsaved changes. Are you sure you want to close the modal?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, discard',
                cancelButtonText: 'No, keep it open',
                customClass: {
                    popup: 'alert-popup' // Add custom class for styling
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    // Assign initial state directly to the form
                    setForm({
                        departmentId: "",
                        startYear: currentYear, // Set to current year
                        batchDuration: "",
                        shift: "Morning",
                    });
                    setFormErrors({}); // Reset form errors when closing modal
                    setShowModal(false);
                }
            });
        } else {
            // If no unsaved changes (all fields are empty or initial state), close modal directly
            setForm({
                departmentId: "",
                startYear: currentYear, // Set to current year
                batchDuration: "",
                shift: "Morning",
            });
            setFormErrors({});
            setShowModal(false);  // Close modal
        }
    };

    const handleCloseUpdateModal = () => {
        setForm({
            departmentId: "",
            startYear: currentYear,
            batchDuration: "",
            shift: "Morning",
        });
        setFormErrors({}); // Reset form errors
        setShowUpdateModal(false); // Close the update modal
    };

    const handleEditBatch = (batch) => {
        setForm({
            departmentId: batch.departmentId,
            startYear: batch.startYear,
            batchDuration: batch.batchDuration,
            shift: batch.shift,
        });
        setSelectedBatch(batch);
        setShowUpdateModal(true);
    };

    const handleUpdateBatch = async (e) => {
        e.preventDefault();

        // Validate all fields at once
        const isValid = validateForm();
        if (!isValid) {
            // Mark all fields as touched to show errors
            setTouchedFields({
                departmentId: true,
                startYear: true,
                batchDuration: true,
                shift: true
            });
            return;
        }

        setIsLoading(true);

        const endYear = calculateEndYear(form.startYear, form.batchDuration);

        // Duplicate check for updating a batch
        const q = query(
            collection(db, "Batches"),
            where("departmentId", "==", form.departmentId),
            where("startYear", "==", Number(form.startYear)),
            where("endYear", "==", endYear),
            where("shift", "==", form.shift)
        );

        // We need to exclude the current batch being updated
        const batchSnapshot = await getDocs(q);
        const duplicate = batchSnapshot.docs.find(doc => doc.id !== selectedBatch.id);

        if (duplicate) {
            toast.error('A similar batch already exists. Update failed.', {
                position: "top-right",
                autoClose: 3000,
                theme: "colored",
                transition: Slide,
            });
            setIsLoading(false);
            return;
        }

        try {
            await updateDoc(doc(db, "Batches", selectedBatch.id), {
                departmentId: form.departmentId,
                startYear: Number(form.startYear),
                endYear: endYear,
                batchDuration: form.batchDuration,
                shift: form.shift,
            });
            fetchData();
            handleCloseUpdateModal();
            toast.success('Batch updated successfully!', {
                position: "top-right",
                autoClose: 3000,
                theme: "colored",
                transition: Slide,
            });
        } catch (error) {
            toast.error('Error updating batch. Please try again.', {
                position: "top-right",
                autoClose: 3000,
                theme: "colored",
                transition: Slide,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to check if a field should show error
    const shouldShowError = (fieldName) => {
        return touchedFields[fieldName] && formErrors[fieldName];
    };

    const handleDeleteBatch = async (batchId) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this deletion!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, "Batches", batchId));
                    fetchData();
                    toast.success('Batch deleted successfully!.', {
                        position: "top-right",
                        autoClose: 3000,
                        theme: "colored",
                        transition: Slide,
                    });
                } catch (error) {
                    toast.error('Error deleting batch. Please try again.', {
                        position: "top-right",
                        autoClose: 3000,
                        theme: "colored",
                        transition: Slide,
                    });
                }
            }
        });
    };

    const handleStatusChange = async (batchId, currentStatus) => {
        setLoadingSwitchId(batchId); // Set loading state to true for the specific batch

        const newStatus = !currentStatus; // Toggle the current status

        // Optimistic update: Update the status in the local state immediately
        setBatches(prevBatches =>
            prevBatches.map(batch =>
                batch.id === batchId ? { ...batch, status: newStatus } : batch
            )
        );

        // Update the batch status in the database
        try {
            const batchRef = doc(db, "Batches", batchId); // Get the specific batch document
            await updateDoc(batchRef, {
                status: newStatus,
            });
            // After successful update, refetch the data
            toast.success('Status Update Successfully!', {
                position: "top-right",
                autoClose: 3000,
                theme: "colored",
                transition: Slide,
            });
            fetchData();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error(`Error updating status: ${error.message}`, {
                position: "top-right",
                autoClose: 3000,
                theme: "colored",
                transition: Slide,
            });
        } finally {
            setLoadingSwitchId(null); // Reset loading state after update
        }
    };

    const columns = [
        {
            name: "#",
            selector: (_, index) => index + 1,
            width: "60px",
        },
        {
            name: "Department",
            selector: (row) => getDeptName(row.departmentId),
            sortable: true,
        },
        {
            name: "Batches",
            selector: (row) => (
                <span
                    className={`${currentYear === row.startYear
                        ? 'bg-success-focus text-success-main'
                        : currentYear > row.startYear
                            ? 'bg-danger-focus text-danger-main'
                            : 'bg-warning-focus text-warning-main'
                        } px-24 py-6 rounded-pill fw-medium text-sm`
                    }
                >
                    {row.startYear} - {row.endYear}
                </span>
            ),
            sortable: false,
        },
        {
            name: "Batch Duration (Years)",
            selector: (row) => row.batchDuration,
            sortable: true,
        },
        {
            name: "Shift",
            selector: (row) => (
                <span
                    className={`${row.shift === 'Morning'
                        ? 'bg-success-focus text-success-main'
                        : 'bg-danger-focus text-danger-main'
                        } px-24 py-6 rounded-pill fw-medium text-sm`
                    }
                >
                    {row.shift}
                </span>
            ),
            sortable: false,
        },
        {
            name: 'Status',
            selector: 'status',
            cell: row => (
                <Form.Check
                    type="switch"
                    id={`switch-${row.id}`}
                    checked={row.status === true}  // Check if the status is true
                    onChange={() => handleStatusChange(row.id, row.status)}  // Toggle the status
                    disabled={loadingSwitchId === row.id}  // Disable if the batch is being updated
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
                        onClick={() => handleEditBatch(row)} // Edit batch
                    >
                        <Icon icon="lucide:edit" />
                    </Button>
                    <Button
                        variant={'danger'}
                        className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-danger-600 p-2"
                        onClick={() => handleDeleteBatch(row.id)} // Delete batch
                    >
                        <Icon icon="mingcute:delete-2-line" />
                    </Button>
                </div>
            ),
        },
    ];

    const filteredBatches = batches.filter((item) => {
        const query = searchText.trim().toLowerCase();
        return (
            getDeptName(item.departmentId).toLowerCase().includes(query) ||
            item.startYear.toString().includes(query) ||
            item.endYear.toString().includes(query) ||
            item.shift.toLowerCase().includes(query)
        );
    });

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
                                data={filteredBatches}
                                pagination
                                paginationPerPage={10}
                                highlightOnHover
                                responsive
                                fixedHeader
                                subHeader
                                striped
                                subHeaderComponent={
                                    <Form.Control
                                        type="text"
                                        placeholder="Search batches..."
                                        className="w-25"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                    />
                                }
                                title={
                                    <div className="d-flex justify-content-between align-items-center w-100 pe-2">
                                        <h5 className="mb-0 h6">Batches</h5>
                                        <Button variant="primary" onClick={() => setShowModal(true)}>
                                            Create Batch
                                        </Button>
                                    </div>
                                }
                                noDataComponent={
                                    <NoDataTable img={'../assets/images/no-data.svg'} text={'No Batches Found!'} />
                                }
                            />
                        )
                    }

                </Card.Body>
            </Card>

            {/* Create Modal */}
            <Modal show={showModal} centered onHide={handleCloseModal}>
                <Modal.Header className='d-flex justify-content-center'>
                    <Modal.Title className='h6'>Create Batch</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="department" className="mb-3">
                            <Form.Label>Department</Form.Label>
                            <Form.Control
                                as="select"
                                name="departmentId"
                                value={form.departmentId}
                                className={`${formErrors.departmentId && 'error-field'}`}
                                onChange={handleChange}
                            >
                                <option value="">Select Department</option>
                                {activeDepartments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </Form.Control>
                            {formErrors.departmentId && (
                                <div className="error-message">{formErrors.departmentId}</div>
                            )}
                        </Form.Group>
                        <Form.Group controlId="startYear" className="mb-3">
                            <Form.Label>Start Year</Form.Label>
                            <Form.Control
                                type="number"
                                name="startYear"
                                value={form.startYear}
                                onChange={handleChange}
                                className={`${formErrors.startYear && 'error-field'}`}
                                min={minYear}
                                max={maxYear}
                            />
                            {formErrors.startYear && (
                                <div className="error-message">{formErrors.startYear}</div>
                            )}
                        </Form.Group>
                        <Form.Group controlId="batchDuration" className="mb-3">
                            <Form.Label>Batch Duration (Years)</Form.Label>
                            <Form.Control
                                type="number"
                                name="batchDuration"
                                value={form.batchDuration}
                                onChange={handleChange}
                                className={`${formErrors.batchDuration && 'error-field'}`}
                                min="1"
                                max="4"
                            />
                            {formErrors.batchDuration && (
                                <div className="error-message">{formErrors.batchDuration}</div>
                            )}
                        </Form.Group>
                        <Form.Group controlId="shift" className="mb-3">
                            <Form.Label>Shift</Form.Label>
                            <Form.Control
                                as="select"
                                name="shift"
                                value={form.shift}
                                onChange={handleChange}
                                className={`${formErrors.shift && 'error-field'}`}
                            >
                                <option value="Morning">Morning</option>
                                <option value="Evening">Evening</option>
                            </Form.Control>
                            {formErrors.shift && (
                                <div className="error-message">{formErrors.shift}</div>
                            )}
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isLoading} // Disable submit when loading
                            >
                                {isLoading ? "Saving..." : "Save Batch"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Update Modal */}
            <Modal show={showUpdateModal} centered onHide={handleCloseUpdateModal}>
                <Modal.Header className='d-flex justify-content-center'>
                    <Modal.Title className='h6'>Update Batch</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleUpdateBatch}>
                        <Form.Group controlId="department" className="mb-3">
                            <Form.Label>Department</Form.Label>
                            {
                                activeDepartments.find((d) => d.id === form.departmentId) ? (
                                    <Form.Control
                                        as="select"
                                        name="departmentId"
                                        value={form.departmentId}
                                        onChange={handleChange}
                                        className={`${formErrors.departmentId && 'error-field'}`}
                                    >
                                        <option value="">Select Department</option>
                                        {activeDepartments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </Form.Control>
                                ) : (
                                    <>
                                        <Form.Control
                                            name="departmentId"
                                            value={getDeptName(form.departmentId)}
                                            readOnly
                                        />
                                        <div className="error-message">This department is currently disabled and cannot be updated.</div>
                                    </>
                                )
                            }
                            {formErrors.departmentId && (
                                <div className="error-message">{formErrors.departmentId}</div>
                            )}
                        </Form.Group>
                        <Form.Group controlId="startYear" className="mb-3">
                            <Form.Label>Start Year</Form.Label>
                            <Form.Control
                                type="number"
                                name="startYear"
                                value={form.startYear}
                                onChange={handleChange}
                                min={minYear}
                                max={maxYear}
                                className={`${formErrors.startYear && 'error-field'}`}
                            />
                            {formErrors.startYear && (
                                <div className="error-message">{formErrors.startYear}</div>
                            )}
                        </Form.Group>
                        <Form.Group controlId="batchDuration" className="mb-3">
                            <Form.Label>Batch Duration (Years)</Form.Label>
                            <Form.Control
                                type="number"
                                name="batchDuration"
                                value={form.batchDuration}
                                onChange={handleChange}
                                className={`${formErrors.batchDuration && 'error-field'}`}
                                min="1"
                                max="4"
                            />
                            {formErrors.batchDuration && (
                                <div className="error-message">{formErrors.batchDuration}</div>
                            )}
                        </Form.Group>
                        <Form.Group controlId="shift" className="mb-3">
                            <Form.Label>Shift</Form.Label>
                            <Form.Control
                                as="select"
                                name="shift"
                                value={form.shift}
                                onChange={handleChange}
                                className={`${formErrors.batchDuration && 'error-field'}`}
                            >
                                <option value="Morning">Morning</option>
                                <option value="Evening">Evening</option>
                            </Form.Control>
                            {formErrors.shift && (
                                <div className="error-message">{formErrors.shift}</div>
                            )}
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleCloseUpdateModal}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isLoading} // Disable submit when loading
                            >
                                {isLoading ? "Updating..." : "Update Batch"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default Batches;