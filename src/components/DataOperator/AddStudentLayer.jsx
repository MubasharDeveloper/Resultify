import React, { useState, useEffect } from 'react';
import {
    Form,
    Button,
    Row,
    Col,
    Spinner,
    Card
} from 'react-bootstrap';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../Firebase_config';
import { useAuth } from "../../context/AuthContext";
import { toast } from 'react-toastify';
import { Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StudentCreationForm = () => {
    // State management
    const [batches, setBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(true);
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cnic: '',
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
    const [currentSemester, setCurrentSemester] = useState(1);

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.departmentId) return;

            try {
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
                toast.error('Failed to load required data', {
                    position: "top-right",
                    autoClose: 3000,
                    theme: "light",
                    transition: Slide,
                });
            } finally {
                setLoadingBatches(false);
            }
        };

        fetchData();
    }, [user]);

    // Helper functions
    const formatName = (value) => {
        return value.replace(/[^a-zA-Z\s]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/(^\w|\s\w)/g, m => m.toUpperCase());
    };

    const formatPhone = (value) => {
        let cleaned = value.replace(/\D/g, '');

        if (cleaned.length > 0 && !cleaned.startsWith('03')) {
            cleaned = '03' + cleaned.substring(2);
        }

        cleaned = cleaned.substring(0, 11);

        if (cleaned.length > 4) {
            cleaned = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
        }

        return cleaned;
    };

    const formatCNIC = (value) => {
        let cleaned = value.replace(/\D/g, '');

        if (cleaned.length > 5) {
            cleaned = cleaned.substring(0, 5) + '-' + cleaned.substring(5);
        }

        if (cleaned.length > 13) {
            cleaned = cleaned.substring(0, 13) + '-' + cleaned.substring(13);
        }

        return cleaned.substring(0, 15);
    };

    const formatRollNumber = (value) => {
        return value.replace(/\D/g, '').substring(0, 4);
    };

    const validateEmail = async (email) => {
        if (!email) return 'Email is required';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return 'Invalid email format';

        const studentsQuery = query(collection(db, 'Students'), where('email', '==', email));
        const querySnapshot = await getDocs(studentsQuery);
        if (!querySnapshot.empty) return 'Email already exists';

        return '';
    };

    const validatePhoneNumber = (phone) => {
        if (!phone) return 'Phone number is required';

        const digitsOnly = phone.replace(/\D/g, '');

        if (digitsOnly.length !== 11) return 'Must be 11 digits (including 03 prefix)';
        if (!digitsOnly.startsWith('03')) return 'Must start with 03';

        return '';
    };

    const validateCNICNumber = async (cnic) => {
        if (!cnic) return 'CNIC is required';

        const cnicRegex = /^\d{5}-\d{7}-\d$/;
        if (!cnicRegex.test(cnic)) return 'Must be in XXXXX-XXXXXXX-X format';

        // Check if CNIC exists in database
        const studentsQuery = query(collection(db, 'Students'), where('cnic', '==', cnic));
        const querySnapshot = await getDocs(studentsQuery);
        if (!querySnapshot.empty) return 'CNIC already exists';

        return '';
    };

    const validateRollNumber = async (rollNumber, batchId) => {
        if (!rollNumber) return 'Roll number is required';
        if (!batchId) return 'Please select a batch first';

        // Check if roll number exists in the same batch
        const studentsQuery = query(
            collection(db, 'Students'),
            where('batchId', '==', batchId),
            where('rollNumber', '==', rollNumber)
        );
        const querySnapshot = await getDocs(studentsQuery);
        if (!querySnapshot.empty) return 'Roll number already exists in this batch';

        return '';
    };

    const validateRequiredField = (value, fieldName) => {
        if (!value || value.trim() === '') return `${fieldName} is required`;
        return '';
    };

    // Form handlers
    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        switch (name) {
            case 'name':
            case 'fatherName':
                processedValue = formatName(value);
                break;
            case 'phone':
                processedValue = formatPhone(value);
                break;
            case 'cnic':
                processedValue = formatCNIC(value);
                break;
            case 'rollNumber':
                processedValue = formatRollNumber(value);
                break;
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBatchChange = (e) => {
        const selectedIndex = e.target.selectedIndex - 1; // -1 to account for the default option
        if (selectedIndex >= 0) {
            // Set semester based on option index: 1st option = 1, 2nd = 3, 3rd = 5, 4th = 7
            setCurrentSemester(selectedIndex * 2 + 1);
        }
        handleChange(e);
    };

    const handleBlur = async (e) => {
        const { name, value } = e.target;
        let error = '';

        switch (name) {
            case 'name':
            case 'fatherName':
                error = validateRequiredField(value, name === 'name' ? 'Full name' : 'Father\'s name');
                break;
            case 'email':
                error = await validateEmail(value);
                break;
            case 'phone':
                error = validatePhoneNumber(value);
                break;
            case 'cnic':
                error = await validateCNICNumber(value);
                break;
            case 'batchId':
                error = validateRequiredField(value, 'Batch');
                break;
            case 'batchTime':
                error = validateRequiredField(value, 'Batch schedule');
                break;
            case 'rollNumber':
                error = await validateRollNumber(value, formData.batchId);
                break;
            case 'admissionDate':
                break;
        }

        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Validate all required fields
        const validationErrors = {};

        validationErrors.name = validateRequiredField(formData.name, 'Full name');
        validationErrors.fatherName = validateRequiredField(formData.fatherName, 'Father\'s name');
        validationErrors.email = await validateEmail(formData.email);
        validationErrors.phone = validatePhoneNumber(formData.phone);
        validationErrors.cnic = await validateCNICNumber(formData.cnic);
        validationErrors.batchId = validateRequiredField(formData.batchId, 'Batch');
        validationErrors.batchTime = validateRequiredField(formData.batchTime, 'Batch schedule');
        validationErrors.rollNumber = await validateRollNumber(formData.rollNumber, formData.batchId);

        setErrors(validationErrors);

        if (Object.values(validationErrors).some(error => error)) {
            setSubmitting(false);
            return;
        }

        try {
            const studentData = {
                ...formData,
                departmentId: user.departmentId,
                createdAt: serverTimestamp(),
                createdBy: user.id,
                updatedAt: serverTimestamp(),
                // currentSemester,
                // currentSemesterName: 'Semester ' + currentSemester,
            };

            const docRef = await addDoc(collection(db, 'Students'), studentData);

            toast.success('Student created successfully!', {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                cnic: '',
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
            setCurrentSemester(1);
            setErrors({});
        } catch (err) {
            console.error('Error creating student:', err);
            toast.error('Failed to create student: ' + err.message, {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });
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
            <Card className="mt-4">
                <Card.Body>
                    <h6 className="mb-0 h6 d-flex align-items-center gap- mb-3 mt-5" style={{ fontSize: '18px' }}>
                        BS Computer Science
                    </h6>

                    <Form onSubmit={handleSubmit} className='mb-5'>
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
                                        placeholder="John Doe"
                                    />
                                    {errors.name && (
                                        <div className="error-message">{errors.name}</div>
                                    )}
                                </Form.Group>
                            </Col>

                            {/* Father's Name */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Father's Name *</Form.Label>
                                    <Form.Control
                                        name="fatherName"
                                        value={formData.fatherName}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.fatherName ? 'error-field' : ''}
                                        placeholder="Father's Name"
                                    />
                                    {errors.fatherName && (
                                        <div className="error-message">{errors.fatherName}</div>
                                    )}
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
                                        className={errors.email ? 'error-field' : ''}
                                        placeholder="example@domain.com"
                                    />
                                    {errors.email && (
                                        <div className="error-message">{errors.email}</div>
                                    )}
                                </Form.Group>
                            </Col>

                            {/* Phone */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label className="d-flex align-items-center justify-content-between pe-2">
                                        <span>Phone*</span>
                                        <small className="text-muted">Format: 03XX-XXXXXXX</small>
                                    </Form.Label>
                                    <Form.Control
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.phone ? 'error-field' : ''}
                                        placeholder="0300-1234567"
                                    />
                                    {errors.phone && (
                                        <div className="error-message">{errors.phone}</div>
                                    )}
                                </Form.Group>
                            </Col>

                            {/* CNIC */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label className="d-flex align-items-center justify-content-between pe-2">
                                        <span>CNIC*</span>
                                        <small className="text-muted">Format: XXXXX-XXXXXXX-X</small>
                                    </Form.Label>
                                    <Form.Control
                                        name="cnic"
                                        value={formData.cnic}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.cnic ? 'error-field' : ''}
                                        placeholder="12345-1234567-1"
                                    />
                                    {errors.cnic && (
                                        <div className="error-message">{errors.cnic}</div>
                                    )}
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
                                        className={errors.batchTime ? 'error-field' : ''}
                                    >
                                        <option value="">Select Schedule</option>
                                        <option value="morning">Morning</option>
                                        <option value="evening">Evening</option>
                                    </Form.Select>
                                    {errors.batchTime && (
                                        <span className="error-message">{errors.batchTime}</span>
                                    )}
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
                                                onChange={handleBatchChange}
                                                onBlur={handleBlur}
                                                className={errors.batchId ? 'error-field' : ''}
                                            >
                                                <option value="">Select Batch</option>
                                                {batches.map((batch, index) => (
                                                    <option key={index} value={batch.id}>
                                                        {batch.name} ({batch.startYear}-{batch.endYear})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                            {errors.batchId && (
                                                <span className="error-message">{errors.batchId}</span>
                                            )}
                                        </>
                                    )}
                                </Form.Group>
                            </Col>

                            {/* Roll Number */}
                            <Col sm={6} md={4} lg={3}>
                                <Form.Group>
                                    <Form.Label>Roll Number *</Form.Label>
                                    <Form.Control
                                        name="rollNumber"
                                        value={formData.rollNumber}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={errors.rollNumber ? 'error-field' : ''}
                                        placeholder="1234"
                                    />
                                    {errors.rollNumber && (
                                        <div className="error-message">{errors.rollNumber}</div>
                                    )}
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
                                        {/* <option value="inactive">Inactive</option>
                                        <option value="graduated">Graduated</option>
                                        <option value="suspended">Suspended</option> */}
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
                                        max={new Date().toISOString().split('T')[0]}
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
                                        max={new Date().toISOString().split('T')[0]}
                                        required
                                    />
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
                                        placeholder="Full residential address"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="mt-3 d-flex justify-content-center">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={submitting}
                                className="px-3"
                            >
                                {submitting ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Creating...
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