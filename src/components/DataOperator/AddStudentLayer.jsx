import React, { useState, useEffect } from 'react';
import {
    Form,
    Button,
    Row,
    Col,
    Spinner,
    Card,
    Toast,
    ToastContainer
} from 'react-bootstrap';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db, doc, getDoc } from '../../Firebase_config';
import { useAuth } from "../../context/AuthContext";

const StudentCreationForm = () => {
    // State management
    const [batches, setBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [departmentName, setDepartmentName] = useState('');
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cnic: '',
        departmentId: user?.departmentId || '',
        batchId: '',
        batchTime: '',
        rollNumber: '',
        fatherName: '',
        address: '',
        gender: 'male',
        dateOfBirth: '',
        admissionDate: new Date().toISOString().split('T')[0],
        status: 'active'
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [showToast, setShowToast] = useState({
        show: false,
        message: '',
        variant: 'success'
    });

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.departmentId) return;

            try {
                // Fetch department name
                const deptDocRef = doc(db, "Departments", user.departmentId);
                const deptDocSnap = await getDoc(deptDocRef);
                setDepartmentName(deptDocSnap.exists() ? deptDocSnap.data().name : 'Unknown Department');

                // Fetch batches
                const currentYear = new Date().getFullYear();
                const batchesQuery = query(
                    collection(db, 'Batches'),
                    where('departmentId', '==', user.departmentId)
                );
                const querySnapshot = await getDocs(batchesQuery);

                const processedBatches = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        startYear: Number(doc.data().startYear),
                        endYear: Number(doc.data().endYear)
                    }))
                    .filter(batch =>
                        !isNaN(batch.startYear) &&
                        !isNaN(batch.endYear) &&
                        currentYear >= batch.startYear &&
                        currentYear <= batch.endYear
                    )
                    .sort((a, b) => b.startYear - a.startYear);

                setBatches(processedBatches);
            } catch (err) {
                console.error('Error fetching data:', err);
                showNotification('Failed to load required data', 'danger');
            } finally {
                setLoadingBatches(false);
            }
        };

        fetchData();
    }, [user]);

    // Helper functions
    const showNotification = (message, variant = 'success') => {
        setShowToast({ show: true, message, variant });
        setTimeout(() => setShowToast(prev => ({ ...prev, show: false })), 5000);
    };

    const validateName = (name) => name.replace(/[^a-zA-Z\s]/g, '');

    const validatePhone = (phone) => {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.length > 0 && !cleaned.startsWith('03')) {
            cleaned = '03' + cleaned.substring(2);
        }
        return cleaned.substring(0, 11);
    };

    const validateCNIC = (cnic) => {
        let cleaned = cnic.replace(/\D/g, '');
        if (cleaned.length > 5) cleaned = cleaned.substring(0, 5) + '-' + cleaned.substring(5);
        if (cleaned.length > 13) cleaned = cleaned.substring(0, 13) + '-' + cleaned.substring(13);
        return cleaned.substring(0, 15);
    };

    const checkEmailExists = async (email) => {
        if (!email.includes('@')) return false;
        const studentsQuery = query(collection(db, 'Students'), where('email', '==', email));
        const querySnapshot = await getDocs(studentsQuery);
        return !querySnapshot.empty;
    };

    // Form handlers
    const handleChange = async (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        switch (name) {
            case 'name':
            case 'fatherName':
                processedValue = validateName(value);
                break;
            case 'phone':
                processedValue = validatePhone(value);
                break;
            case 'cnic':
                processedValue = validateCNIC(value);
                break;
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateField = async (name, value) => {
        let error = '';

        switch (name) {
            case 'name':
                if (!value.trim()) error = 'Full name is required';
                else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Only letters allowed';
                break;
            case 'email':
                if (!value.trim()) error = 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
                else if (await checkEmailExists(value)) error = 'Email already exists';
                break;
            case 'phone':
                if (!value) error = 'Phone is required';
                else if (value.length !== 11) error = 'Must be 11 digits starting with 03';
                break;
            case 'cnic':
                if (!value) error = 'CNIC is required';
                else if (value.length !== 15) error = 'Must be in XXXXX-XXXXXXX-X format';
                break;
            case 'admissionDate':
                if (!value) error = 'Admission date is required';
                break;
            case 'batchId':
                if (!value) error = 'Batch selection is required';
                break;
            case 'batchTime':
                if (!value) error = 'Batch schedule is required';
                break;
        }

        return error;
    };

    const handleBlur = async (e) => {
        const { name, value } = e.target;
        const error = await validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Validate all fields
        const validationErrors = {};
        for (const field in formData) {
            if (['name', 'email', 'phone', 'cnic', 'admissionDate', 'batchId', 'batchTime'].includes(field)) {
                validationErrors[field] = await validateField(field, formData[field]);
            }
        }

        setErrors(validationErrors);

        // Check if any errors exist
        if (Object.values(validationErrors).some(error => error)) {
            setSubmitting(false);
            showNotification('Please fix the errors in the form', 'danger');
            return;
        }

        try {
            await addDoc(collection(db, 'Students'), {
                ...formData,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
                updatedAt: serverTimestamp(),
            });

            showNotification('Student created successfully!');
            setFormData({
                name: '',
                email: '',
                phone: '',
                cnic: '',
                departmentId: user.departmentId,
                batchId: '',
                batchTime: '',
                rollNumber: '',
                fatherName: '',
                address: '',
                gender: 'male',
                dateOfBirth: '',
                admissionDate: new Date().toISOString().split('T')[0],
                status: 'active'
            });
            setErrors({});
        } catch (err) {
            console.error('Error creating student:', err);
            showNotification('Failed to create student: ' + err.message, 'danger');
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) {
        return (
            <Card className="mt-4">
                <Card.Body>
                    <div className="alert alert-warning">
                        Please sign in to create students
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <>
            <ToastContainer position="top-end" className="p-3">
                <Toast
                    show={showToast.show}
                    onClose={() => setShowToast(prev => ({ ...prev, show: false }))}
                    delay={5000}
                    autohide
                    bg={showToast.variant}
                >
                    <Toast.Header>
                        <strong className="me-auto">Notification</strong>
                    </Toast.Header>
                    <Toast.Body className="text-white">
                        {showToast.message}
                    </Toast.Body>
                </Toast>
            </ToastContainer>

            <Card className="mt-4">
                <Card.Body>
                    <Card.Title className="mb-4">Create New Student</Card.Title>

                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                            {/* Name */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Full Name *</Form.Label>
                                    <Form.Control
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.name ? 'error-field' : ''}
                                    />
                                    {errors.name && (
                                        <div className="error-message">{errors.name}</div>
                                    )}
                                </Form.Group>
                            </Col>

                            {/* Father's Name */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Father's Name</Form.Label>
                                    <Form.Control
                                        name="fatherName"
                                        value={formData.fatherName}
                                        onChange={handleChange}
                                        className={errors.fatherName ? 'error-field' : ''}
                                    />
                                </Form.Group>
                            </Col>

                            {/* Email */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Email *</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={!!errors.email}
                                        required
                                    />
                                    <div className="invalid-feedback" style={{ display: errors.email ? 'block' : 'none' }}>
                                        {errors.email}
                                    </div>
                                </Form.Group>
                            </Col>

                            {/* Phone */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Phone *</Form.Label>
                                    <Form.Control
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={!!errors.phone}
                                        required
                                    />
                                    <div className="invalid-feedback" style={{ display: errors.phone ? 'block' : 'none' }}>
                                        {errors.phone}
                                    </div>
                                </Form.Group>
                            </Col>

                            {/* CNIC */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>CNIC *</Form.Label>
                                    <Form.Control
                                        name="cnic"
                                        value={formData.cnic}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={!!errors.cnic}
                                        required
                                    />
                                    <div className="invalid-feedback" style={{ display: errors.cnic ? 'block' : 'none' }}>
                                        {errors.cnic}
                                    </div>
                                </Form.Group>
                            </Col>

                            {/* Department */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Department</Form.Label>
                                    <Form.Control readOnly value={user.departmentId} />
                                </Form.Group>
                            </Col>

                            {/* Batch Schedule */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Batch Schedule *</Form.Label>
                                    <Form.Select
                                        name="batchTime"
                                        value={formData.batchTime}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={!!errors.batchTime}
                                        required
                                    >
                                        <option value="">Select Schedule</option>
                                        <option value="morning">Morning</option>
                                        <option value="evening">Evening</option>
                                    </Form.Select>
                                    <div className="invalid-feedback" style={{ display: errors.batchTime ? 'block' : 'none' }}>
                                        {errors.batchTime}
                                    </div>
                                </Form.Group>
                            </Col>

                            {/* Batch */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Batch *</Form.Label>
                                    {loadingBatches ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        <>
                                            <Form.Select
                                                name="batchId"
                                                value={formData.batchId}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                isInvalid={!!errors.batchId}
                                                required
                                            >
                                                <option value="">Select Batch</option>
                                                {batches.map(batch => (
                                                    <option key={batch.id} value={batch.id}>
                                                        {batch.name} ({batch.startYear}-{batch.endYear})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            <div className="invalid-feedback" style={{ display: errors.batchId ? 'block' : 'none' }}>
                                                {errors.batchId}
                                            </div>
                                        </>
                                    )}
                                </Form.Group>
                            </Col>

                            {/* Roll Number */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Roll Number</Form.Label>
                                    <Form.Control
                                        name="rollNumber"
                                        value={formData.rollNumber}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            {/* Gender */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Gender</Form.Label>
                                    <Form.Select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Status */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Status</Form.Label>
                                    <Form.Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="graduated">Graduated</option>
                                        <option value="suspended">Suspended</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Date of Birth */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Date of Birth</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            {/* Admission Date */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Admission Date *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="admissionDate"
                                        value={formData.admissionDate}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        isInvalid={!!errors.admissionDate}
                                        required
                                    />
                                    <div className="invalid-feedback" style={{ display: errors.admissionDate ? 'block' : 'none' }}>
                                        {errors.admissionDate}
                                    </div>
                                </Form.Group>
                            </Col>

                            {/* Address */}
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="mt-3">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Creating Student...
                                    </>
                                ) : (
                                    'Create Student'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </>
    );
};

export default StudentCreationForm;