import React, { useEffect, useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Button, Modal, Form, Card, Row, Col, Table } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { db, collection, getDocs, getDoc, addDoc, query, where, doc, updateDoc, orderBy, deleteDoc } from '../../Firebase_config';
import { toast, Slide } from 'react-toastify';
import Swal from 'sweetalert2';
import { CustomLoader, BodyLoading } from '../CustomLoader';
import NoDataTable from '../NoDataTable';
import { useAuth } from "../../context/AuthContext";

const Batches = () => {
    const { user } = useAuth();

    // State variables
    const [departments, setDepartments] = useState([]);
    const [activeDepartments, setActiveDepartments] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 1;
    const maxYear = currentYear + 1;


    // Form state
    const [form, setForm] = useState({
        departmentId: "",
        startYear: currentYear,
        status: true,
    });

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showSubjectsModal, setShowSubjectsModal] = useState(false);

    // Error and loading states
    const [formErrors, setFormErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [loadingSwitchId, setLoadingSwitchId] = useState(null);

    // Selected items
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedBatchSubjects, setSelectedBatchSubjects] = useState([]);
    const [touchedFields, setTouchedFields] = useState({});

    // Search
    const [searchText, setSearchText] = useState('');

    // Helper function to format dates
    const formatDate = (dateInput) => {
        if (!dateInput) return '-';
        if (dateInput.toDate) {
            const date = dateInput.toDate();
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        }
        return '-';
    };

    // Fetch all necessary data
    const fetchData = async () => {
        setLoading(true);
        try {
            let activeDeptQuery;
            let batchQuery;

            // Set up queries based on user role
            if (user.roleName === 'Admin') {
                activeDeptQuery = query(
                    collection(db, "Departments"),
                    where("status", "==", true)
                );
                batchQuery = query(
                    collection(db, "Batches"),
                    orderBy("startYear", "desc")
                );
            } else if (user.roleName === 'HOD') {
                activeDeptQuery = query(
                    collection(db, "Departments"),
                    where("status", "==", true)
                );
                batchQuery = query(
                    collection(db, "Batches"),
                    where("departmentId", "==", user.departmentId),
                    orderBy("startYear", "desc")
                );
            }

            // Fetch departments
            const [activeDeptSnap, deptSnap] = await Promise.all([
                getDocs(activeDeptQuery),
                getDocs(collection(db, "Departments"))
            ]);

            // Filter departments for HOD
            let filteredActiveDepartments = activeDeptSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            if (user.roleName === 'HOD') {
                filteredActiveDepartments = filteredActiveDepartments.filter(
                    (dept) => dept.id === user.departmentId
                );
            }

            // Set departments
            setActiveDepartments(filteredActiveDepartments);
            setDepartments(deptSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            // Fetch batches
            const batchSnap = await getDocs(batchQuery);
            setBatches(batchSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // Fetch subjects for a specific batch
    const fetchBatchSubjects = async (batchId) => {
        setIsLoadingSubjects(true);
        try {
            // Get all semesters for this batch
            const semestersQuery = query(
                collection(db, "Semesters"),
                where("batchId", "==", batchId)
            );
            const semestersSnap = await getDocs(semestersQuery);

            // Get subjects for each semester
            const semestersWithSubjects = await Promise.all(
                semestersSnap.docs.map(async (semesterDoc) => {
                    const semester = semesterDoc.data();
                    const subjects = [];

                    // Check if subjectIds exists and is an array
                    if (semester.subjectIds && Array.isArray(semester.subjectIds)) {
                        // Fetch each subject
                        for (const subjectId of semester.subjectIds) {
                            try {
                                const subjectRef = doc(db, "Subjects", subjectId);
                                const subjectDoc = await getDoc(subjectRef);

                                if (subjectDoc.exists()) {
                                    subjects.push({
                                        id: subjectDoc.id,
                                        ...subjectDoc.data()
                                    });
                                }
                            } catch (error) {
                                console.error(`Error fetching subject ${subjectId}:`, error);
                            }
                        }
                    }

                    return {
                        id: semesterDoc.id,
                        ...semester,
                        subjects
                    };
                })
            );

            setSelectedBatchSubjects(semestersWithSubjects);
        } catch (error) {
            console.error("Error fetching batch subjects:", error);
            toast.error("Failed to load subjects");
        } finally {
            setIsLoadingSubjects(false);
        }
    };

    // Get department name by ID
    const getDeptName = (id) => {
        const dept = departments.find((d) => d.id === id);
        return dept ? dept.name : "Unknown";
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        if (name === 'startYear') {
            processedValue = Number(value);
            if (processedValue < minYear) processedValue = minYear;
            if (processedValue > maxYear) processedValue = maxYear;
        }

        setForm({ ...form, [name]: processedValue });
        setTouchedFields({ ...touchedFields, [name]: true });
    };

    // Calculate end year based on start year
    const calculateEndYear = (startYear) => {
        return Number(startYear) + 4;
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

        setFormErrors(errors);
        return isValid;
    };

    // Create new batch
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setTouchedFields({
                departmentId: true,
                startYear: true,
            });
            return;
        }

        setIsLoading(true);

        const endYear = calculateEndYear(form.startYear);

        // Check for duplicate batch
        const q = query(
            collection(db, "Batches"),
            where("departmentId", "==", form.departmentId),
            where("startYear", "==", Number(form.startYear)),
            where("endYear", "==", endYear),
            where("status", "==", true)
        );

        const duplicate = await getDocs(q);
        if (!duplicate.empty) {
            toast.error('A batch with these details already exists.', {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });
            setIsLoading(false);
            return;
        }

        const payload = {
            ...form,
            startYear: Number(form.startYear),
            endYear: endYear,
            batchDuration: 4,
            name: `${form.startYear} - ${endYear}`,
        };

        try {
            await addDoc(collection(db, "Batches"), payload);
            fetchData();
            resetForm();
            setShowModal(false);
            toast.success('Batch created successfully!');
        } catch (error) {
            toast.error('Error creating batch. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setForm({
            departmentId: "",
            startYear: currentYear,
            status: true,
        });
        setFormErrors({});
        setTouchedFields({});
    };

    // Close create modal with confirmation
    const handleCloseModal = () => {
        if (form.departmentId || form.startYear !== currentYear) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You have unsaved changes. Are you sure you want to close?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, discard',
                cancelButtonText: 'No, keep it open',
            }).then((result) => {
                if (result.isConfirmed) {
                    resetForm();
                    setShowModal(false);
                }
            });
        } else {
            resetForm();
            setShowModal(false);
        }
    };

    // Close update modal
    const handleCloseUpdateModal = () => {
        setShowUpdateModal(false);
        resetForm();
    };

    // Edit batch
    const handleEditBatch = (batch) => {
        setForm({
            departmentId: batch.departmentId,
            startYear: batch.startYear,
            status: batch.status,
        });
        setSelectedBatch(batch);
        setShowUpdateModal(true);
    };

    // Update batch
    const handleUpdateBatch = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setTouchedFields({
                departmentId: true,
                startYear: true,
            });
            return;
        }

        setIsLoading(true);

        const endYear = calculateEndYear(form.startYear);

        // Check for duplicate batch (excluding current one)
        const q = query(
            collection(db, "Batches"),
            where("departmentId", "==", form.departmentId),
            where("startYear", "==", Number(form.startYear)),
            where("endYear", "==", endYear),
        );

        const batchSnapshot = await getDocs(q);
        const duplicate = batchSnapshot.docs.find(doc => doc.id !== selectedBatch.id);

        if (duplicate) {
            toast.error('A similar batch already exists. Update failed.');
            setIsLoading(false);
            return;
        }

        try {
            await updateDoc(doc(db, "Batches", selectedBatch.id), {
                departmentId: form.departmentId,
                startYear: Number(form.startYear),
                endYear: endYear,
                batchDuration: 4,
                name: `${form.startYear} - ${endYear}`,
                status: form.status
            });
            fetchData();
            handleCloseUpdateModal();
            toast.success('Batch updated successfully!');
        } catch (error) {
            toast.error('Error updating batch. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Delete batch
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
                    toast.success('Batch deleted successfully!.');
                } catch (error) {
                    toast.error('Error deleting batch. Please try again.');
                }
            }
        });
    };

    // Toggle batch status
    const handleStatusChange = async (batchId, currentStatus) => {
        setLoadingSwitchId(batchId);

        // Optimistic update
        setBatches(prevBatches =>
            prevBatches.map(batch =>
                batch.id === batchId ? { ...batch, status: !currentStatus } : batch
            )
        );

        try {
            await updateDoc(doc(db, "Batches", batchId), {
                status: !currentStatus,
            });
            toast.success('Status updated successfully!');
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error(`Error updating status: ${error.message}`);
            // Revert optimistic update on error
            setBatches(prevBatches =>
                prevBatches.map(batch =>
                    batch.id === batchId ? { ...batch, status: currentStatus } : batch
                )
            );
        } finally {
            setLoadingSwitchId(null);
        }
    };

    // View subjects for a batch
    const handleViewSubjects = async (batch) => {
        setSelectedBatch(batch);
        await fetchBatchSubjects(batch.id);
        setShowSubjectsModal(true);
    };

    // Filter batches based on search text
    const filteredBatches = useMemo(() => {
        return batches.filter((batch) => {
            const query = searchText.trim().toLowerCase();
            return (
                getDeptName(batch.departmentId).toLowerCase().includes(query) ||
                batch.startYear.toString().includes(query) ||
                batch.endYear.toString().includes(query) ||
                batch.name.toLowerCase().includes(query)
            );
        });
    }, [batches, searchText, departments]);

    // Table columns
    const columns = useMemo(() => [
        {
            name: "#",
            selector: (_, index) => index + 1,
            width: "60px",
        },
        {
            name: "Department",
            selector: row => getDeptName(row.departmentId),
            sortable: true,
        },
        {
            name: "Batches",
            selector: row => row.name,
            cell: row => (
                <span
                    className={`${currentYear === row.startYear
                        ? 'bg-success-focus text-success-main border-success-main'
                        : currentYear > row.startYear
                            ? 'bg-danger-focus text-danger-main border-danger-main'
                            : 'bg-warning-focus text-warning-main border-warning-main'
                        } border px-8 py-2 radius-4 fw-medium text-sm`
                    }
                >
                    {row.name}
                </span>
            ),
            sortable: false,
        },
        {
            name: "Batch Duration (Years)",
            selector: row => row.batchDuration,
            sortable: true,
        },
        {
            name: 'Status',
            selector: row => row.status,
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
            selector: row => row.id,
            cell: row => (
                <div className="d-flex">
                    <Button
                        variant={'info'}
                        className="w-32-px h-32-px me-8 bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-warning-600 p-2"
                        onClick={() => handleViewSubjects(row)}
                        title="View Subjects"
                    >
                        <Icon icon="solar:document-text-outline" />
                    </Button>
                    <Button
                        variant={'success'}
                        className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-success-600 p-2"
                        onClick={() => handleEditBatch(row)}
                        title="Edit Batch"
                    >
                        <Icon icon="lucide:edit" />
                    </Button>
                    {/* <Button
                        variant={'danger'}
                        className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-danger-600 p-2"
                        onClick={() => handleDeleteBatch(row.id)}
                        title="Delete Batch"
                    >
                        <Icon icon="mingcute:delete-2-line" />
                    </Button> */}
                </div>
            ),
        },
    ], [departments, loadingSwitchId, currentYear]);

    // Initialize data
    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            <Card className="basic-data-table py-3">
                <Card.Body>
                    {loading ? (
                        <CustomLoader size={'80px'} />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredBatches}
                            pagination
                            paginationPerPage={15}
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
                                <NoDataTable
                                    img={'../assets/images/no-data.svg'}
                                    text={'No Batches Found!'}
                                />
                            }
                        />
                    )}
                </Card.Body>
            </Card>

            {/* Create Batch Modal */}
            <Modal show={showModal} centered onHide={handleCloseModal} size='lg'>
                <Modal.Body>
                    <div className="margin-bottom-15">
                        <div className="d-flex justify-content-between">
                            <h5 className="margin-bottom-10 mt-3 modal-heading">Create Batch</h5>
                            <Icon
                                icon="ci:close-circle"
                                color='#dc3545'
                                className="cursor-pointer"
                                style={{ fontSize: '24px' }}
                                onClick={handleCloseModal}
                            />
                        </div>
                    </div>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <Form.Group controlId="department" className="mb-3">
                                    <Form.Label>Department</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="departmentId"
                                        value={form.departmentId}
                                        className={formErrors.departmentId ? 'error-field' : ''}
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
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="startYear" className="mb-3">
                                    <Form.Label>Start Year (4 Years Semester System)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="startYear"
                                        value={form.startYear}
                                        onChange={handleChange}
                                        className={formErrors.startYear ? 'error-field' : ''}
                                        min={minYear}
                                        max={maxYear}
                                    />
                                    {formErrors.startYear && (
                                        <div className="error-message">{formErrors.startYear}</div>
                                    )}
                                    <Form.Text muted>
                                        End year will be {calculateEndYear(form.startYear)}
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? "Saving..." : "Save Batch"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Update Batch Modal */}
            <Modal show={showUpdateModal} centered onHide={handleCloseUpdateModal} size='lg'>
                <Modal.Body>
                    <div className="margin-bottom-15">
                        <div className="d-flex justify-content-between">
                            <h5 className="margin-bottom-10 mt-3 modal-heading">Update Batch</h5>
                            <Icon
                                icon="ci:close-circle"
                                color='#dc3545'
                                className="cursor-pointer"
                                style={{ fontSize: '24px' }}
                                onClick={handleCloseUpdateModal}
                            />
                        </div>
                    </div>
                    <Form onSubmit={handleUpdateBatch}>
                        <Row>
                            <Col md={6}>
                                <Form.Group controlId="department" className="mb-3">
                                    <Form.Label>Department</Form.Label>
                                    {activeDepartments.find((d) => d.id === form.departmentId) ? (
                                        <Form.Control
                                            as="select"
                                            name="departmentId"
                                            value={form.departmentId}
                                            onChange={handleChange}
                                            className={formErrors.departmentId ? 'error-field' : ''}
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
                                    )}
                                    {formErrors.departmentId && (
                                        <div className="error-message">{formErrors.departmentId}</div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="startYear" className="mb-3">
                                    <Form.Label>Start Year</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="startYear"
                                        value={form.startYear}
                                        onChange={handleChange}
                                        min={minYear}
                                        max={maxYear}
                                        className={formErrors.startYear ? 'error-field' : ''}
                                    />
                                    {formErrors.startYear && (
                                        <div className="error-message">{formErrors.startYear}</div>
                                    )}
                                    <Form.Text muted>
                                        End year will be {calculateEndYear(form.startYear)}
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleCloseUpdateModal}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? "Updating..." : "Update Batch"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Subjects Modal */}
            {isLoadingSubjects ? (
                <BodyLoading />
            ) : (
                <Modal show={showSubjectsModal} onHide={() => setShowSubjectsModal(false)} size="xl" centered>
                    <Modal.Body>
                        {selectedBatch && (
                            <>
                                <div className="margin-bottom-15">
                                    <div className="d-flex justify-content-between">
                                        <h5 className="margin-bottom-10 mt-3 modal-heading">
                                            {`Department of ${getDeptName(selectedBatch.departmentId)}`}
                                        </h5>
                                        <Icon
                                            icon="ci:close-circle"
                                            color='#dc3545'
                                            className="cursor-pointer"
                                            style={{ fontSize: '24px' }}
                                            onClick={() => setShowSubjectsModal(false)}
                                        />
                                    </div>
                                    <div className="d-flex justify-content-center">
                                        <h5 className="margin-bottom-25 modal-heading">Road Map</h5>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <h5 className="margin-bottom-10 modal-sub-heading">
                                            {`${getDeptName(selectedBatch.departmentId)} Session ${selectedBatch.name}`}
                                        </h5>
                                    </div>
                                </div>
                                
                                {selectedBatchSubjects?.length > 0 ? (
                                    <Row className='gy-4 gx-3'>
                                        {[...selectedBatchSubjects]
                                            .sort((a, b) => {
                                                // Extract semester numbers (e.g., "Semester 1" -> 1)
                                                const numA = parseInt(a.name.replace(/\D/g, ''));
                                                const numB = parseInt(b.name.replace(/\D/g, ''));
                                                return numA - numB;
                                            })
                                            .map((semester) => {
                                                // Calculate totals for this semester
                                                const totalCreditHours = semester.subjects?.reduce(
                                                    (sum, sub) => sum + (sub.creditHours || 0), 0
                                                ) || 0;
                                                const totalTheory = semester.subjects?.reduce(
                                                    (sum, sub) => sum + (Number(sub.theory) || 0), 0
                                                ) || 0;
                                                const totalPractical = semester.subjects?.reduce(
                                                    (sum, sub) => sum + (Number(sub.practical) || 0), 0
                                                ) || 0;

                                                return (
                                                    <Col key={semester.id} md={6}>
                                                        <div className="mb-4">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <h5 className="margin-bottom-10 modal-sub-heading">
                                                                    {semester.name}
                                                                </h5>
                                                                <h5 className="margin-bottom-10 modal-sub-heading">
                                                                    {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
                                                                </h5>
                                                            </div>
                                                            <div className="table-responsive">
                                                                <table className="table vertical-striped-table mb-0">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Code</th>
                                                                            <th>Course Title</th>
                                                                            <th>Credit Hours</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {semester.subjects && semester.subjects.length > 0 ? (
                                                                            <>
                                                                                {semester.subjects.map((subject) => (
                                                                                    <tr key={subject.id}>
                                                                                        <td><h6 className="text-md mb-0 fw-normal">{subject.subCode || 'N/A'}</h6></td>
                                                                                        <td>{subject.name || 'N/A'}</td>
                                                                                        <td>
                                                                                            {subject.creditHours || '0'}
                                                                                            ({subject.theory || '0'}-{subject.practical || '0'})
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                                <tr className="fw-bold">
                                                                                    <td colSpan="2">Total</td>
                                                                                    <td>
                                                                                        {totalCreditHours} ({totalTheory}-{totalPractical})
                                                                                    </td>
                                                                                </tr>
                                                                            </>
                                                                        ) : (
                                                                            <tr>
                                                                                <td colSpan="3" className="text-center">No subjects found</td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                );
                                            })
                                        }
                                    </Row>
                                ):(
                                    <NoDataTable
                                        img={'../assets/images/no-data.svg'}
                                        text={'No Road Map Found!'}
                                    />
                                )}
                            </>
                        )}
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
};

export default Batches;