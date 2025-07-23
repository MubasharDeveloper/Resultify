import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
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
            <h2 className="fs-28 fw-500 pt-5 pb-3 mb-0">Welcome To Resultify</h2>

            <Card className="mb-5">
                <Card.Body className="d-flex flex-column">
                    <img src='assets/images/student.svg' alt="" style={{ maxWidth: '360px', margin: '16px auto 36px' }} />
                    <div className="table-responsive" style={{ maxWidth: 540, margin: '0 auto', width: '100%' }}>
                        <table className="table vertical-striped-table mb-0">
                            <thead>
                                <tr>
                                    <th colspan='2' className="text-center">Student Info</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Name</td>
                                    <td>{student.name}</td>
                                </tr>
                                <tr>
                                    <td>Fatder's Name</td>
                                    <td>{student.fatherName}</td>
                                </tr>
                                <tr>
                                    <td>Roll No</td>
                                    <td>{student.rollNumber}</td>
                                </tr>
                                <tr>
                                    <td>CNIC</td>
                                    <td>{student.cnic}</td>
                                </tr>
                                <tr>
                                    <td>Phone No</td>
                                    <td>{student.phone}</td>
                                </tr>
                                <tr>
                                    <td>Email</td>
                                    <td>{student.email}</td>
                                </tr>
                                <tr>
                                    <td>Batch</td>
                                    <td>{student.batchInfo?.[0]?.name}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div style={{ maxWidth: 540, margin: '24px auto 0', width: '100%' }}>
                        <h4 className="fs-18 fw-500 my-3 text-center">View Result</h4>
                        <Form.Group className="mb-3">
                            <Form.Label>Select Semester</Form.Label>
                            <Form.Select
                                value={selectedSemesterId}
                                onChange={(e) => setSelectedSemesterId(e.target.value)}
                                className="table-search-2"
                            >
                                <option value="">Choose semester...</option>
                                {student.semesters?.map((semester) => (
                                    <option key={semester.id} value={semester.id}>
                                        {semester.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Button
                            variant="primary" size='sm'
                            onClick={handleSearch}
                            disabled={!selectedSemesterId}
                            className="btn-primary-custom mx-auto mb-3"
                        >
                            <Icon icon="bx:search" className="me-2" />
                            View Results
                        </Button>
                        <hr />
                        <div className="d-flex justify-content-center align-items-center mt-3 mb-3 gap-2">
                            <Link to='/' className='btn btn-sm btn-outline-secondary btn-primary-custom'>
                                <Icon icon='tabler:chevron-left' className="fs-18" />
                                Back to Home
                            </Link>
                            <Link to='/check-result' className='btn btn-sm btn-primary btn-primary-custom'>
                                <Icon icon='tabler:zoom-reset' className="fs-18" />
                                Search Other Result
                            </Link>
                        </div>
                    </div>
                </Card.Body>
            </Card>

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