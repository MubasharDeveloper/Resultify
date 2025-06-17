import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
// import DataTable from 'react-data-table-component'; // Not used yet
import { db, collection, getDocs, addDoc, query, where, doc /*, updateDoc, deleteDoc */ } from '../../Firebase_config';
import { toast, Slide } from 'react-toastify';
// import Swal from 'sweetalert2'; // Not used yet
import { Button, Modal, Form, Row, Col, Card } from 'react-bootstrap';
import { CustomLoader } from '../CustomLoader';
import NoDataTable from '../NoDataTable'; // May not be needed for a form-only page
import { useAuth } from "../../context/AuthContext";

const AddStudentLayer = () => {
    const { user } = useAuth(); // Get the logged-in user (Data Operator)

    const [studentForm, setStudentForm] = useState({
        firstName: '',
        lastName: '',
        batchId: '',
        phone: '',
        email: '',
        cnic: '',
        // Add other student-specific fields if any, e.g., registrationNo
    });
    const [formErrors, setFormErrors] = useState({});
    const [batches, setBatches] = useState([]);
    const [departmentName, setDepartmentName] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user && user.departmentId) {
            setStudentForm(prevForm => ({ ...prevForm, departmentId: user.departmentId }));
            fetchBatchesAndDepartment(user.departmentId);
        }
    }, [user]);

    const fetchBatchesAndDepartment = async (deptId) => {
        setLoading(true);
        try {
            // Fetch department name
            const deptDocRef = doc(db, "Departments", deptId);
            const deptDocSnap = await getDocs(query(collection(db, "Departments"), where("__name__", "==", deptId))); // A bit verbose way to get a single doc by ID if not using getDoc directly
            if (!deptDocSnap.empty) {
                setDepartmentName(deptDocSnap.docs[0].data().name);
            }

            // Fetch active batches for the department
            const batchesQuery = query(
                collection(db, "Batches"),
                where("departmentId", "==", deptId),
                where("status", "==", true) // Assuming batches have a status field
            );
            const batchesSnapshot = await getDocs(batchesQuery);
            const batchesList = batchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBatches(batchesList);

        } catch (error) {
            console.error("Error fetching data: ", error);
            toast.error("Failed to load necessary data.", { theme: "light", transition: Slide });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setStudentForm(prevForm => ({
            ...prevForm,
            [name]: value,
        }));
        if (formErrors[name]) {
            setFormErrors(prevErrors => ({
                ...prevErrors,
                [name]: null,
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!studentForm.firstName.trim()) errors.firstName = "First name is required.";
        if (!studentForm.lastName.trim()) errors.lastName = "Last name is required.";
        if (!studentForm.batchId) errors.batchId = "Batch is required.";
        if (!studentForm.phone.trim()) {
            errors.phone = "Phone number is required.";
        } else if (!/^03\d{9}$/.test(studentForm.phone.replace(/\D/g, ''))) {
            errors.phone = "Enter a valid 11-digit 03XXXXXXXXX number.";
        }
        if (!studentForm.email.trim()) {
            errors.email = "Email is required.";
        } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(studentForm.email)) {
            errors.email = "Invalid email format.";
        }
        // Add more validations as needed (e.g., check for existing email/phone if they should be unique for students)
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // Check if student with the same email or phone already exists in this department/batch (optional)
            // For simplicity, this check is omitted here but recommended for production

            await addDoc(collection(db, "Users"), {
                firstName: studentForm.firstName.trim(),
                lastName: studentForm.lastName.trim(),
                email: studentForm.email.trim(),
                phone: studentForm.phone.trim(),
                departmentId: user.departmentId,
                batchId: studentForm.batchId,
                cnic: studentForm.cnic,
                status: true, // Default status for new student
                // Add any other necessary fields, e.g., password (how will this be handled? Auto-generated?)
                // gen: studentForm.gender, // If you add gender to the form
            });

            toast.success("Student added successfully!", { theme: "light", transition: Slide });
            setStudentForm({
                firstName: '',
                lastName: '',
                cnic: '',
                batchId: '',
                phone: '',
                email: '',
            });
            setFormErrors({});
        } catch (error) {
            console.error("Error adding student: ", error);
            toast.error(`Failed to add student: ${error.message}`, { theme: "light", transition: Slide });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <CustomLoader />;
    }

    return (
        <Card>
            <Card.Header>
                <Card.Title as="h5">Add New Student</Card.Title>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="firstName">
                                <Form.Label>First Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="firstName"
                                    value={studentForm.firstName}
                                    onChange={handleInputChange}
                                    isInvalid={!!formErrors.firstName}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {formErrors.firstName}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="lastName">
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="lastName"
                                    value={studentForm.lastName}
                                    onChange={handleInputChange}
                                    isInvalid={!!formErrors.lastName}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {formErrors.lastName}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="departmentId">
                                <Form.Label>CNIC</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="cnic"
                                    value={studentForm.cnic} // Display name, submit ID
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="batchId">
                                <Form.Label>Batch</Form.Label>
                                <Form.Select
                                    name="batchId"
                                    value={studentForm.batchId}
                                    onChange={handleInputChange}
                                    isInvalid={!!formErrors.batchId}
                                >
                                    <option value="">Select Batch</option>
                                    {batches.map(batch => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.name} {/* Assuming batch object has a 'name' field */}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">
                                    {formErrors.batchId}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="phone">
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control
                                    type="tel"
                                    name="phone"
                                    value={studentForm.phone}
                                    onChange={handleInputChange}
                                    placeholder="03XXXXXXXXX"
                                    isInvalid={!!formErrors.phone}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {formErrors.phone}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="email">
                                <Form.Label>Email Address</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={studentForm.email}
                                    onChange={handleInputChange}
                                    isInvalid={!!formErrors.email}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {formErrors.email}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>

                    {/* Add other fields like Gender if needed */}

                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <CustomLoader size="sm" /> : 'Add Student'}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default AddStudentLayer;