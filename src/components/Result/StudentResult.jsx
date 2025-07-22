import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Card, Form, Row, Col } from "react-bootstrap";
import { Icon } from '@iconify/react';
import ResultModal from '../ResultModal';

const StudentResultsPage = () => {
    const { state } = useLocation();
    const { student } = state || {};
    const [showResultModal, setShowResultModal] = useState(false);
    const [selectedSemesterId, setSelectedSemesterId] = useState("");
    const [selectedSemester, setSelectedSemester] = useState(null);

    const handleSearch = () => {
        if (!selectedSemesterId) return;
        
        const semester = student.semesters?.find(s => s.id === selectedSemesterId);
        if (semester) {
            setSelectedSemester(semester);
            setShowResultModal(true);
        }
    };

    if (!student) return <p>No student data found.</p>;

    return (
        <div className="container py-4">
            <h2 className="mb-4">Student Result</h2>

            <Row className="mb-4">
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title>Student Information</Card.Title>
                            <Card.Text>
                                <div className="mb-2">
                                    <strong>Name:</strong> {student.name}
                                </div>
                                <div className="mb-2">
                                    <strong>Father's Name:</strong> {student.fatherName}
                                </div>
                                <div className="mb-2">
                                    <strong>Roll Number:</strong> {student.rollNumber}
                                </div>
                                <div className="mb-2">
                                    <strong>CNIC:</strong> {student.cnic}
                                </div>
                                <div className="mb-2">
                                    <strong>Email:</strong> {student.email}
                                </div>
                                <div className="mb-2">
                                    <strong>Phone:</strong> {student.phone}
                                </div>
                                <div className="mb-2">
                                    <strong>Batch:</strong> {student.batchInfo?.[0]?.name}
                                </div>
                                <div>
                                    <strong>Current Semester:</strong> {student.currentSemesterName}
                                </div>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title>View Results</Card.Title>
                            <Form.Group className="mb-3">
                                <Form.Label>Select Semester</Form.Label>
                                <Form.Select 
                                    value={selectedSemesterId}
                                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                                >
                                    <option value="">Choose semester...</option>
                                    {student.semesters?.map((semester) => (
                                        <option key={semester.id} value={semester.id}>
                                            {semester.name} ({new Date(semester.startDate?.seconds * 1000).toLocaleDateString()} - {new Date(semester.endDate?.seconds * 1000).toLocaleDateString()})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Button 
                                variant="primary" 
                                onClick={handleSearch}
                                disabled={!selectedSemesterId}
                            >
                                <Icon icon="bx:search" className="me-2" />
                                View Results
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Result Modal */}
            {selectedSemester && (
                <ResultModal
                    show={showResultModal}
                    onHide={() => setShowResultModal(false)}
                    studentId={student.id}
                    batchId={student.batchId}
                    semesterId={selectedSemester.id}
                    departmentId={student.departmentId}
                    semesterName={selectedSemester.name}
                    studentName={student.name}
                />
            )}
        </div>
    );
};

export default StudentResultsPage;