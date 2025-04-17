import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button, Modal, Form, Card } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import Select from 'react-select';
import { db, collection, getDocs, getDoc, addDoc, Timestamp, query, where, doc, deleteDoc } from '../../Firebase_config';
import { toast, Slide } from 'react-toastify';
import Swal from 'sweetalert2';
import { CustomLoader } from '../CustomLoader';
import NoDataTable from '../NoDataTable';
import { useAuth } from "../../context/AuthContext";

const Semesters = () => {
    const { user } = useAuth();

    const [semesters, setSemesters] = useState([]);
    const [filteredSemesters, setFilteredSemesters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const currentYear = new Date().getFullYear();
    const [hasChanges, setHasChanges] = useState(false);

    const [newSemester, setNewSemester] = useState({
        name: '',
        batchId: '',
        startDate: '',
        endDate: '',
        subjectIds: [],
    });

    const [errors, setErrors] = useState({});
    const [creating, setCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const [batches, setBatches] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);

    const handleModalClose = () => {
        if (hasChanges) {
            Swal.fire({
                title: 'Discard Changes?',
                text: 'You have unsaved changes. Are you sure you want to close?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, discard!',
            }).then((result) => {
                if (result.isConfirmed) {
                    resetModal();
                }
            });
        } else {
            resetModal();
        }
    };

    const resetModal = () => {
        setShowModal(false);
        setErrors({});
        setNewSemester({
            name: '',
            batchId: '',
            startDate: '',
            endDate: '',
            subjectIds: [],
        });
        setAvailableSubjects([]);
        setHasChanges(false);
    };

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
        
        if (dateInput instanceof Date) {
            return dateInput.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        }
        
        if (typeof dateInput === 'string') {
            const date = new Date(dateInput);
            return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        }
        
        return '-';
    };

    const fetchSemestersData = async () => {
        setLoading(true);
        try {
            if (!user?.departmentId) return;
            
            const deptSnap = await getDoc(doc(db, "Departments", user.departmentId));
            let department = deptSnap.exists() ? { id: deptSnap.id, ...deptSnap.data() } : null;

            const semestersQuery = query(
                collection(db, "Semesters"),
                where("departmentId", "==", user.departmentId)
            );
            const semSnap = await getDocs(semestersQuery);

            const semestersList = await Promise.all(
                semSnap.docs.map(async (docSnap) => {
                    const data = docSnap.data();

                    let batchName = "Unknown";
                    let shift = "Unknown";
                    let batchStart;
                    let batchEnd;
                    if (data.batchId) {
                        const batchSnap = await getDoc(doc(db, "Batches", data.batchId));
                        if (batchSnap.exists()) {
                            const batchData = batchSnap.data();
                            batchName = batchData.name;
                            shift = batchData.shift;
                            batchStart = batchData.startYear;
                            batchEnd = batchData.endYear;
                        }
                    }

                    return {
                        id: docSnap.id,
                        ...data,
                        departmentName: department?.name || "Unknown",
                        batchName,
                        shift,
                        batchStart,
                        batchEnd,
                    };
                })
            );

            setSemesters(semestersList);
            setFilteredSemesters(semestersList);
        } catch (error) {
            console.error("Error fetching semesters:", error);
            toast.error("Failed to fetch semesters");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSemestersData();
    }, [user?.departmentId]);

    useEffect(() => {
        const fetchBatchesAndSubjects = async () => {
            try {
                if (!user?.departmentId) return;
                
                const batchSnapshot = await getDocs(
                    query(collection(db, "Batches"), where("departmentId", "==", user.departmentId))
                );
                const subjectSnapshot = await getDocs(
                    query(collection(db, "Subjects"), where("departmentId", "==", user.departmentId))
                );

                const fetchedBatches = batchSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const fetchedSubjects = subjectSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    label: `${doc.data().name} (${doc.data().subCode})`,
                    value: doc.id
                }));

                setBatches(fetchedBatches);
                setAllSubjects(fetchedSubjects);
            } catch (err) {
                console.error("Error fetching batches or subjects:", err);
                toast.error("Failed to fetch batches or subjects");
            }
        };

        fetchBatchesAndSubjects();
    }, [user?.departmentId]);

    useEffect(() => {
        const fetchAvailableSubjects = async () => {
            if (!newSemester.batchId) {
                setAvailableSubjects(allSubjects);
                return;
            }

            try {
                // Get all semesters for this batch
                const batchSemestersQuery = query(
                    collection(db, "Semesters"),
                    where("batchId", "==", newSemester.batchId)
                );
                const semestersSnap = await getDocs(batchSemestersQuery);
                
                // Get all subject IDs already used in this batch
                const usedSubjectIds = [];
                semestersSnap.forEach(doc => {
                    const semester = doc.data();
                    if (semester.subjectIds) {
                        usedSubjectIds.push(...semester.subjectIds);
                    }
                });

                // Filter out already used subjects
                const available = allSubjects.filter(
                    subject => !usedSubjectIds.includes(subject.id)
                );

                setAvailableSubjects(available);
            } catch (error) {
                console.error("Error fetching available subjects:", error);
                toast.error("Failed to fetch available subjects");
            }
        };

        fetchAvailableSubjects();
    }, [newSemester.batchId, allSubjects]);

    useEffect(() => {
        if (!searchText) {
            setFilteredSemesters(semesters);
        } else {
            const lowerSearch = searchText.toLowerCase();
            const filtered = semesters.filter((sem) => {
                const nameMatch = sem.name?.toLowerCase().includes(lowerSearch);
                const batchMatch = sem.batchName?.toLowerCase().includes(lowerSearch);
                const deptMatch = sem.departmentName?.toLowerCase().includes(lowerSearch);
                const shiftMatch = sem.shift?.toLowerCase().includes(lowerSearch);
                const startMatch = formatDate(sem.startDate).toLowerCase().includes(lowerSearch);
                const endMatch = formatDate(sem.endDate).toLowerCase().includes(lowerSearch);

                return (
                    nameMatch ||
                    batchMatch ||
                    deptMatch ||
                    shiftMatch ||
                    startMatch ||
                    endMatch
                );
            });

            setFilteredSemesters(filtered);
        }
    }, [searchText, semesters]);

    const handleInputChange = (field, value) => {
        setNewSemester(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Remove error for this field when user types
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
        
        setHasChanges(true);
    };

    const handleSubjectChange = (selectedOptions) => {
        const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
        handleInputChange('subjectIds', selectedIds);
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = {};

        if (!newSemester.batchId) {
            newErrors.batchId = "Batch is required";
            isValid = false;
        }

        if (!newSemester.name) {
            newErrors.name = "Semester name is required";
            isValid = false;
        }

        if (!newSemester.startDate) {
            newErrors.startDate = "Start date is required";
            isValid = false;
        }

        if (!newSemester.endDate) {
            newErrors.endDate = "End date is required";
            isValid = false;
        } else {
            const startDate = new Date(newSemester.startDate);
            const endDate = new Date(newSemester.endDate);
            
            if (endDate <= startDate) {
                newErrors.endDate = "End date must be after start date";
                isValid = false;
            } else {
                // Calculate difference in months (minimum 4 months)
                const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                 (endDate.getMonth() - startDate.getMonth());
                
                if (monthsDiff < 4) {
                    newErrors.endDate = "Semester must be at least 4 months long";
                    isValid = false;
                }
            }
        }

        if (newSemester.subjectIds.length === 0) {
            newErrors.subjectIds = "Please assign at least one subject";
            isValid = false;
        }

        // Check for duplicate semester
        const duplicateSemester = semesters.find(
            s =>
                s.batchId === newSemester.batchId &&
                s.departmentId === user.departmentId &&
                s.name === newSemester.name
        );
        if (duplicateSemester) {
            newErrors.name = "Semester with this name already exists in selected batch";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleCreateSemester = async () => {
        if (!validateForm()) return;

        try {
            setCreating(true);

            const newSemesterData = {
                ...newSemester,
                departmentId: user.departmentId,
                startDate: Timestamp.fromDate(new Date(newSemester.startDate)),
                endDate: Timestamp.fromDate(new Date(newSemester.endDate)),
                createdAt: Timestamp.now(),
            };

            await addDoc(collection(db, "Semesters"), newSemesterData);

            toast.success("Semester created successfully!");
            resetModal();
            fetchSemestersData();
        } catch (error) {
            console.error("Error creating semester:", error);
            toast.error("Something went wrong!");
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteSemester = async (id) => {
        const confirmResult = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it!',
        });

        if (confirmResult.isConfirmed) {
            try {
                await deleteDoc(doc(db, 'Semesters', id));
                toast.success("Semester deleted successfully!", { transition: Slide });
                setSemesters(prev => prev.filter(sem => sem.id !== id));
                setFilteredSemesters(prev => prev.filter(sem => sem.id !== id));
            } catch (error) {
                console.error("Error deleting semester:", error);
                toast.error("Failed to delete semester!");
            }
        }
    };

    const columns = [
        {
            name: "#",
            selector: (_, index) => index + 1,
            width: "60px",
        },
        {
            name: "Semester",
            selector: (row) => row.name,
            sortable: true,
        },
        {
            name: "Start Date",
            selector: (row) => formatDate(row.startDate),
            sortable: true,
        },
        {
            name: "End Date",
            selector: (row) => formatDate(row.endDate),
            sortable: true,
        },
        {
            name: "Department",
            selector: (row) => row.departmentName,
            sortable: true,
        },
        {
            name: "Batch",
            selector: (row) => (
                <span
                    className={`${currentYear >= row.batchStart && currentYear <= row.batchEnd
                        ? 'bg-success-focus text-success-main border-success-main'
                        : 'bg-danger-focus text-danger-main border-danger-main'
                        } border px-8 py-2 radius-4 fw-medium text-sm`
                    }
                >
                    {row.batchName}
                </span>
            ),
            sortable: true,
        },
        {
            name: "Shift",
            selector: (row) => (
                <span
                    className={`${row.shift === 'Morning'
                        ? 'bg-success-focus text-success-main border-success-main'
                        : 'bg-warning-focus text-warning-main border-warning-main'
                        } border px-8 py-2 radius-4 fw-medium text-sm`
                    }
                >
                    {row.shift}
                </span>
            ),
            sortable: true,
        },
        {
            name: 'Action',
            cell: row => (
                <div className="d-flex">
                    <Button
                        variant="danger"
                        className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 p-2"
                        onClick={() => handleDeleteSemester(row.id)}
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
                    {loading ? (
                        <CustomLoader size={'80px'} />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredSemesters}
                            pagination
                            paginationPerPage={20}
                            highlightOnHover
                            responsive
                            fixedHeader
                            subHeader
                            striped
                            subHeaderComponent={
                                <Form.Control
                                    type="text"
                                    placeholder="Search Semesters..."
                                    className="w-25"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            }
                            title={
                                <div className="d-flex justify-content-between align-items-center w-100 pe-2">
                                    <h5 className="mb-0 h6">Semesters</h5>
                                    <Button variant="primary" onClick={() => setShowModal(true)}>
                                        Add Semester
                                    </Button>
                                </div>
                            }
                            noDataComponent={
                                <NoDataTable
                                    img={'../assets/images/no-data.svg'}
                                    text={'No Semesters Found!'}
                                />
                            }
                        />
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={handleModalClose} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="h6">Create Semester</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Select Batch</Form.Label>
                            <Form.Select
                                value={newSemester.batchId}
                                onChange={(e) => handleInputChange('batchId', e.target.value)}
                                className={errors.batchId ? 'error-field' : ''}
                            >
                                <option value="">Select Batch</option>
                                {batches.map(batch => (
                                    <option key={batch.id} value={batch.id}>
                                        {batch.name} ({batch.shift})
                                    </option>
                                ))}
                            </Form.Select>
                            {errors.batchId && <span className="error-message">{errors.batchId}</span>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Semester Name</Form.Label>
                            <Form.Select
                                value={newSemester.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={errors.name ? 'error-field' : ''}
                            >
                                <option value="">Select Semester</option>
                                {[...Array(8)].map((_, i) => (
                                    <option key={i} value={`Semester ${i + 1}`}>
                                        Semester {i + 1}
                                    </option>
                                ))}
                            </Form.Select>
                            {errors.name && <span className="error-message">{errors.name}</span>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Start Date</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={newSemester.startDate}
                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                                className={errors.startDate ? 'error-field' : ''}
                            />
                            {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>End Date</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                value={newSemester.endDate}
                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                                className={errors.endDate ? 'error-field' : ''}
                                min={newSemester.startDate ? 
                                    new Date(new Date(newSemester.startDate).getTime() + (4 * 30 * 24 * 60 * 60 * 1000))
                                    .toISOString().slice(0, 16) : ''}
                            />
                            {errors.endDate && <span className="error-message">{errors.endDate}</span>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Assign Subjects</Form.Label>
                            <div className={errors.subjectIds ? 'error-field' : ''}>
                                <Select
                                    isMulti
                                    options={availableSubjects}
                                    value={availableSubjects.filter(subject => 
                                        newSemester.subjectIds.includes(subject.value)
                                    )}
                                    onChange={handleSubjectChange}
                                    placeholder="Select subjects..."
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    isDisabled={!newSemester.batchId}
                                />
                            </div>
                            {errors.subjectIds && <span className="error-message">{errors.subjectIds}</span>}
                            {!newSemester.batchId && (
                                <small className="text-muted">Please select a batch first</small>
                            )}
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleModalClose}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleCreateSemester} disabled={creating}>
                                {creating ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default Semesters;