import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button, Modal, Form, Card, Row, Col } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { db, collection, getDocs, addDoc, query, where, doc, updateDoc, orderBy, deleteDoc } from '../../Firebase_config';
import { toast, Slide } from 'react-toastify';
import Swal from 'sweetalert2';
import { CustomLoader } from '../CustomLoader';
import NoDataTable from '../NoDataTable';
import { useAuth } from "../../context/AuthContext";

const sanitizeAndValidateSubject = (subject) => {
    const sanitized = { ...subject };
    const errors = {};

    let rawSubCode = sanitized.subCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const letters = rawSubCode.substring(0, 3).replace(/[^A-Z]/g, "");
    const digits = rawSubCode.substring(3, 6).replace(/[^0-9]/g, "");
    sanitized.subCode = `${letters}${letters.length === 3 ? "-" : ""}${digits}`;

    if (!/^[A-Z]{3}-\d{3}$/.test(sanitized.subCode)) {
        errors.subCode = "Format must be ABC-123";
    }

    sanitized.theory = sanitized.theory.toString().replace(/[^0-6]/g, "");
    if (sanitized.theory === "" || Number(sanitized.theory) < 0 || Number(sanitized.theory) > 6) {
        errors.theory = "Theory hours must be between 0 and 6";
    }

    sanitized.practical = sanitized.practical.toString().replace(/[^0-6]/g, "");
    if (sanitized.practical === "" || Number(sanitized.practical) < 0 || Number(sanitized.practical) > 6) {
        errors.practical = "Practical hours must be between 0 and 6";
    }

    if (!sanitized.name || sanitized.name.trim() === "") {
        errors.name = "Subject name is required";
    }

    return { sanitized, errors };
};

const Subjects = () => {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [loadingSwitchId, setLoadingSwitchId] = useState(null);
    const [creating, setCreating] = useState(false);


    // Create modal states
    const [showModal, setShowModal] = useState(false);
    const [newSubject, setNewSubject] = useState({ name: "", subCode: "", theory: "", practical: "" });
    const [errors, setErrors] = useState({});

    const isFormTouched = () => {
        return newSubject.name || newSubject.subCode || newSubject.theory || newSubject.practical;
    };

    const [showEditModal, setShowEditModal] = useState(false);
    const [editSubject, setEditSubject] = useState({
        name: "",
        subCode: "",
        theory: "",
        practical: "",
    });
    const [editErrors, setEditErrors] = useState({});
    const [updating, setUpdating] = useState(false);

    const handleEditModalOpen = (subject) => {
        setEditSubject(subject);
        setEditErrors({});
        setShowEditModal(true);
    };

    const handleEditModalClose = () => {
        const { name, subCode, theory, practical } = editSubject;
        if (name || subCode || theory || practical) {
            Swal.fire({
                title: "Are you sure?",
                text: "You have unsaved changes. Do you want to close?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, discard",
                cancelButtonText: "No, stay",
            }).then((result) => {
                if (result.isConfirmed) {
                    setEditSubject({ name: "", subCode: "", theory: "", practical: "" });
                    setShowEditModal(false);
                }
            });
        } else {
            setShowEditModal(false);
        }
    };

    const handleUpdateSubject = async () => {
        const { errors, sanitized } = sanitizeAndValidateSubject(editSubject);
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            setNewSubject(sanitized);
            return;
        }

        try {
            setUpdating(true);
            const subjectRef = doc(db, "Subjects", editSubject.id);

            await updateDoc(subjectRef, {
                name: editSubject.name,
                subCode: editSubject.subCode,
                creditHours: Number(editSubject.theory) + Number(editSubject.practical),
                theory: editSubject.theory,
                practical: editSubject.practical,
            });

            toast.success("Subject updated successfully!");
            fetchSubjects(); // Refresh data
            setShowEditModal(false);
        } catch (error) {
            console.error("Error updating subject:", error);
            toast.error("Failed to update subject!");
        } finally {
            setUpdating(false);
        }
    };

    const handleModalClose = () => {
        if (isFormTouched()) {
            Swal.fire({
                title: "Discard changes?",
                text: "You have unsaved changes. Are you sure you want to close?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, discard",
                cancelButtonText: "No, keep it open",
            }).then((result) => {
                if (result.isConfirmed) {
                    setShowModal(false);
                    setNewSubject({ name: "", subCode: "", theory: "", practical: "" });
                    setErrors({});
                }
            });
        } else {
            setShowModal(false);
            setErrors({});
        }
    };

    const validateSubject = () => {
        const errs = {};
        const subCodeRegex = /^[A-Z]{3}-\d{3}$/;

        if (!newSubject.name.trim()) {
            errs.name = "Subject name is required.";
        }

        if (!subCodeRegex.test(newSubject.subCode)) {
            errs.subCode = "SubCode must follow the format ABC-123.";
        }

        const theory = Number(newSubject.theory);
        if (isNaN(theory) || theory < 0 || theory > 6) {
            errs.theory = "Theory hours must be between 0 and 6.";
        }

        const practical = Number(newSubject.practical);
        if (isNaN(practical) || practical < 0 || practical > 6) {
            errs.practical = "Practical hours must be between 0 and 6.";
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleCreateSubject = async () => {
        const { errors, sanitized } = sanitizeAndValidateSubject(newSubject);
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            setNewSubject(sanitized);
            return;
        }

        try {
            setCreating(true); // 🔄 Start loading
            const subjectData = {
                ...newSubject,
                status: true,
                creditHours: Number(newSubject.theory) + Number(newSubject.practical),
                departmentId: user.departmentId,
            };

            const subjectQuery = query(
                collection(db, "Subjects"),
                where("subCode", "==", subjectData.subCode),
                where("departmentId", "==", user.departmentId)
            );

            const snapshot = await getDocs(subjectQuery);

            if (!snapshot.empty) {
                toast.error("This Course Code is already available!", {
                    position: "top-right",
                    autoClose: 2500,
                    theme: "light",
                    transition: Slide,
                });
                return;
            }

            await addDoc(collection(db, "Subjects"), subjectData);
            toast.success("Subject created successfully!");
            setShowModal(false);
            setNewSubject({ name: "", subCode: "", theory: "", practical: "" });
            fetchSubjects();
            setErrors({});
        } catch (error) {
            console.error("Error creating subject:", error);
            toast.error("Failed to create subject!");
        } finally {
            setCreating(false); // ✅ End loading
        }
    };

    // 🔁 Fetch subjects and resolve department names
    const fetchSubjects = async () => {
        try {
            const q = query(
                collection(db, "Subjects"),
                where("departmentId", "==", user.departmentId)
            );
            const subjectsSnapshot = await getDocs(q);

            // 🔁 Optional: Fetch departments if needed
            const departmentsSnapshot = await getDocs(collection(db, "Departments"));
            const departmentMap = {};
            departmentsSnapshot.forEach((doc) => {
                departmentMap[doc.id] = doc.data().name;
            });

            const fetchedSubjects = subjectsSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    departmentName: departmentMap[data.departmentId] || "N/A",
                };
            });

            setSubjects(fetchedSubjects);
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    useEffect(() => {
        const fetchSubjectsData = async () => {
            setLoading(true);
            try {
                // 🔍 Filter subjects based on user.departmentId
                const q = query(
                    collection(db, "Subjects"),
                    where("departmentId", "==", user.departmentId)
                );
                const subjectsSnapshot = await getDocs(q);

                // 🔁 Optional: Fetch departments if needed
                const departmentsSnapshot = await getDocs(collection(db, "Departments"));
                const departmentMap = {};
                departmentsSnapshot.forEach((doc) => {
                    departmentMap[doc.id] = doc.data().name;
                });

                const fetchedSubjects = subjectsSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        departmentName: departmentMap[data.departmentId] || "N/A",
                    };
                });

                setSubjects(fetchedSubjects);
            } catch (error) {
                console.error("Error fetching subjects:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.departmentId) {
            fetchSubjectsData();
        }
    }, [user?.departmentId]);

    const filteredSubjects = subjects.filter(sub =>
        sub.name.toLowerCase().includes(searchText.toLowerCase()) ||
        sub.subCode.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleStatusChange = async (subjectId, currentStatus) => {
        try {
            setLoadingSwitchId(subjectId);
            const subjectRef = doc(db, "Subjects", subjectId);
            await updateDoc(subjectRef, {
                status: !currentStatus,  // toggle status
            });

            // 🔁 Update local state
            setSubjects((prev) =>
                prev.map((subject) =>
                    subject.id === subjectId ? { ...subject, status: !currentStatus } : subject
                )
            );
            toast.success('Subject status updated successfully!', {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });
        } catch (error) {
            console.error("Error updating subject status:", error);
            toast.error('Failed to update subject status!', {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });
        } finally {
            setLoadingSwitchId(null);
        }
    };

    const handleDeleteSubject = async (subjectId) => {
        const confirm = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        });

        if (confirm.isConfirmed) {
            try {
                await deleteDoc(doc(db, "Subjects", subjectId));
                setSubjects((prev) => prev.filter((sub) => sub.id !== subjectId));

                toast.success("Subject deleted successfully!", {
                    position: "top-right",
                    autoClose: 3000,
                    theme: "light",
                    transition: Slide,
                });
            } catch (error) {
                console.error("Error deleting subject:", error);
                toast.error("Failed to delete subject!", {
                    position: "top-right",
                    autoClose: 3000,
                    theme: "light",
                    transition: Slide,
                });
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
            name: "Course Name",
            selector: (row) => row.name,
            sortable: true,
        },
        {
            name: "Course Code",
            selector: (row) => row.subCode,
            sortable: true,
        },
        {
            name: "Department",
            selector: (row) => row.departmentName,
            sortable: true,
        },
        {
            name: "Credit Hours",
            selector: (row) => `${row.creditHours}(${row.theory}-${row.practical})`,
            sortable: true,
        },
        {
            name: "Status",
            selector: (row) => (
                <Form.Check
                    type="switch"
                    id={`switch-${row.id}`}
                    checked={row.status === true}  // Check if the status is true
                    onChange={() => handleStatusChange(row.id, row.status)}  // Toggle the status
                    disabled={loadingSwitchId === row.id}  // Disable if the batch is being updated
                />
            ),
            sortable: false,
        },
        {
            name: 'Action',
            cell: row => (
                <div className="d-flex">
                    <Button
                        variant={'success'}
                        className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-success-600 p-2"
                        onClick={() => handleEditModalOpen(row)}
                    >
                        <Icon icon="lucide:edit" />
                    </Button>
                    {/* <Button
                        variant={'danger'}
                        className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-danger-600 p-2"
                        onClick={() => handleDeleteSubject(row.id)}
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
                    {loading ? (
                        <CustomLoader size={'80px'} />
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredSubjects}
                            pagination
                            paginationPerPage={15}
                            highlightOnHover
                            responsive
                            fixedHeader
                            striped
                            title={
                                <div className="d-flex justify-content-end align-items-center mb-4">
                                    <div className="d-flex gap-3 align-items-center">
                                        <Form.Control
                                            type="text"
                                            placeholder="Search subjects..."
                                            className="table-search"
                                            value={searchText}
                                            onChange={(e) => setSearchText(e.target.value)}
                                        />
                                        <Button variant="primary" size='sm' className='btn-primary-custom' onClick={() => setShowModal(true)}>
                                            <Icon icon='tabler:plus' />
                                            Add Subjects
                                        </Button>
                                    </div>
                                </div>
                            }
                            noDataComponent={
                                <NoDataTable
                                    img={'../assets/images/no-data.svg'}
                                    text={'No Subjects Found!'}
                                />
                            }
                        />
                    )}
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => handleModalClose()} centered size='lg'>
                <Modal.Body>
                    <div className="margin-bottom-15">
                        <div className="d-flex justify-content-between">
                            <h5 className="margin-bottom-10 mt-3 modal-heading">{`Creare Subject`}</h5>
                            <Icon icon="ci:close-circle" color='#dc3545' className={`cursor-pointer`} style={{ fontSize: '24px' }} onClick={() => handleModalClose()} />
                        </div>
                    </div>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Course Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newSubject.name}
                                        onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                        className={`${errors.name && 'error-field'}`}
                                    />
                                    {errors.name && <div className="error-message">{errors.name}</div>}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Course Code</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={newSubject.subCode}
                                        onChange={(e) => {
                                            let input = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

                                            const letters = input.slice(0, 3).replace(/[^A-Z]/g, '');
                                            const digits = input.slice(3).replace(/[^0-9]/g, '').slice(0, 3);
                                            const formatted = letters + (digits ? '-' + digits : '');

                                            setNewSubject({ ...newSubject, subCode: formatted });
                                        }}
                                        className={`${errors.subCode && 'error-field'}`}
                                    />
                                    {errors.subCode && <div className="error-message">{errors.subCode}</div>}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Theory Hours</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newSubject.theory}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || (Number(value) >= 0 && Number(value) <= 6)) {
                                                setNewSubject({ ...newSubject, theory: value });
                                            }
                                        }}
                                        className={`${errors.theory && 'error-field'}`}
                                    />
                                    {errors.theory && <div className="error-message">{errors.theory}</div>}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Practical Hours</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={newSubject.practical}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || (Number(value) >= 0 && Number(value) <= 6)) {
                                                setNewSubject({ ...newSubject, practical: value });
                                            }
                                        }}
                                        className={`${errors.practical && 'error-field'}`}
                                    />
                                    {errors.practical && <div className="error-message">{errors.practical}</div>}
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" className='px-24' onClick={() => handleModalClose()}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                className='px-24'
                                onClick={handleCreateSubject}
                                disabled={creating} // ✅ Button disabled while loading
                            >
                                {creating ? "Creating..." : "Create"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showEditModal} onHide={handleEditModalClose} centered size='lg'>
                <Modal.Body>
                    <div className="margin-bottom-15">
                        <div className="d-flex justify-content-between">
                            <h5 className="margin-bottom-10 mt-3 modal-heading">{`Update Subject`}</h5>
                            <Icon icon="ci:close-circle" color='#dc3545' className={`cursor-pointer`} style={{ fontSize: '24px' }} onClick={handleEditModalClose} />
                        </div>
                    </div>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Course Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editSubject.name}
                                        onChange={(e) => setEditSubject({ ...editSubject, name: e.target.value })}
                                        className={`${editErrors.name && 'error-field'}`}
                                    />
                                    {editErrors.name && <div className="error-message">{editErrors.name}</div>}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Course Code</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={editSubject.subCode}
                                        onChange={(e) => {
                                            let input = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

                                            const letters = input.slice(0, 3).replace(/[^A-Z]/g, '');
                                            const digits = input.slice(3).replace(/[^0-9]/g, '').slice(0, 3);
                                            const formatted = letters + (digits ? '-' + digits : '');

                                            setEditSubject({ ...editSubject, subCode: formatted });
                                        }}
                                        className={`${editErrors.subCode && 'error-field'}`}
                                    />
                                    {editErrors.subCode && <div className="error-message">{editErrors.subCode}</div>}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Theory Hours</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editSubject.theory}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || (Number(value) >= 0 && Number(value) <= 6)) {
                                                setEditSubject({ ...editSubject, theory: value });
                                            }
                                        }}
                                        className={`${editErrors.theory && 'error-field'}`}
                                    />
                                    {editErrors.theory && <div className="error-message">{editErrors.theory}</div>}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Practical Hours</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={editSubject.practical}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || (Number(value) >= 0 && Number(value) <= 6)) {
                                                setEditSubject({ ...editSubject, practical: value });
                                            }
                                        }}
                                        className={`${editErrors.practical && 'error-field'}`}
                                    />
                                    {editErrors.practical && <div className="error-message">{editErrors.practical}</div>}
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" className='px-24' onClick={handleEditModalClose}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleUpdateSubject}
                                className='px-24'
                                disabled={updating}
                            >
                                {updating ? "Updating..." : "Update"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

        </>
    );
};

export default Subjects;