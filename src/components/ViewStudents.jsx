import React, { useEffect, useState, useMemo } from "react";
import { db, collection, getDocs, query, where, doc, updateDoc } from '../Firebase_config';
import { Card, Button, Badge, Spinner, Modal, Table, Form } from 'react-bootstrap';
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import DataTable from 'react-data-table-component';
import NoDataTable from './NoDataTable';
import MasterLayout from '../masterLayout/MasterLayout';
import Breadcrumb from './Breadcrumb';

const ViewStudents = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [processing, setProcessing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [semesterResults, setSemesterResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const location = useLocation();
  const { semester } = location.state || {};
  const navigate = useNavigate();

  const fetchStudents = async () => {
    if (!user?.departmentId || !semester?.name) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const studentsQuery = query(
        collection(db, "Students"),
        where("departmentId", "==", user.departmentId),
        where("batchId", "==", semester.batchId)
      );

      const studentsSnap = await getDocs(studentsQuery);
      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setStudents(studentsData);

      const resultsQuery = query(
        collection(db, "Results"),
        where("departmentId", "==", user.departmentId),
        where("semester", "==", semester.name)
      );

      const resultsSnap = await getDocs(resultsQuery);
      const resultsMap = {};

      resultsSnap.docs.forEach(doc => {
        const result = doc.data();
        if (!resultsMap[result.studentCnic]) {
          resultsMap[result.studentCnic] = [];
        }
        resultsMap[result.studentCnic].push(result);
      });

      setResults(resultsMap);
    } catch (error) {
      console.error("Data fetch error:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user?.departmentId, semester?.name]);

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(student =>
      student.name?.toLowerCase().includes(term) ||
      student.cnic?.toLowerCase().includes(term) ||
      student.phoneNumber?.toLowerCase().includes(term) ||
      student.rollNumber?.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  const handleViewResult = (studentCnic) => {
    const student = students.find(s => s.cnic === studentCnic);
    if (!student) {
      toast.error("Student data not found");
      return;
    }

    const studentResults = results[studentCnic] || [];
    setSemesterResults(studentResults);
    setSelectedStudent(student);
    setShowResultModal(true);
  };

  const handlePromoteStudent = async (studentId, currentSemester) => {
    if (processing) return;

    try {
      setProcessing(true);

      const semesterMatch = currentSemester?.match(/Semester (\d+)/i);
      if (!semesterMatch) {
        throw new Error("Invalid semester format");
      }

      const nextSemester = `Semester ${parseInt(semesterMatch[1]) + 1}`;
      const studentRef = doc(db, "Students", studentId);

      await updateDoc(studentRef, {
        currentSemester: nextSemester,
        status: "active",
        lastUpdated: new Date()
      });

      setStudents(students.filter(student => student.id !== studentId));

      toast.success("Student promoted successfully!");
    } catch (error) {
      console.error("Promotion error:", error);
      toast.error(`Promotion failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDropStudent = async (studentId) => {
    if (processing) return;

    try {
      setProcessing(true);
      const studentRef = doc(db, "Students", studentId);

      await updateDoc(studentRef, {
        status: "dropped",
        lastUpdated: new Date()
      });

      setStudents(students.filter(student => student.id !== studentId));

      toast.success("Student status updated to dropped");
    } catch (error) {
      console.error("Drop student error:", error);
      toast.error("Failed to update student status");
    } finally {
      setProcessing(false);
    }
  };

  const hasPassedAllSubjects = (studentCnic) => {
    if (!studentCnic || !results[studentCnic]) return false;

    return results[studentCnic].every(result => {
      const grade = result.grade?.toUpperCase();
      return grade && !["F", "FAIL", "NG"].includes(grade);
    });
  };

  const columns = [
    {
      name: 'Roll No',
      selector: row => row.rollNumber,
      sortable: true,
      cell: row => row.rollNumber || 'N/A',
      width: '100px'
    },
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      cell: row => row.name
    },
    {
      name: 'CNIC',
      selector: row => row.cnic,
      sortable: false,
      cell: row => row.cnic || 'N/A'
    },
    {
      name: 'Phone',
      selector: row => row.phone,
      sortable: false,
      cell: row => row.phone || 'N/A'
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: false,
      cell: row => (
        <Badge bg={row.status === "active" ? "success" : "danger"} className="text-capitalize">
          {row.status}
        </Badge>
      )
    },
    {
      name: 'Progress',
      cell: row => (
        results[row.cnic]?.length > 0 ? (
          <Badge bg={hasPassedAllSubjects(row.cnic) ? "success" : "warning"}>
            {hasPassedAllSubjects(row.cnic) ? "Eligible" : "Not Eligible"}
          </Badge>
        ) : (
          <Badge bg="secondary">No Results</Badge>
        )
      )
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="d-flex gap-2">
          <Button
            variant="info"
            size="sm"
            onClick={() => handleViewResult(row.cnic)}
            disabled={!results[row.cnic]?.length}
            className="d-flex align-items-center"
          >
            <Icon icon="mdi:file-document-outline" className="me-1" />
            Results
          </Button>

          {row.status === "active" && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={() => handlePromoteStudent(row.id, row.currentSemester)}
                disabled={processing || !hasPassedAllSubjects(row.cnic)}
                className="d-flex align-items-center"
              >
                {processing ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  <>
                    <Icon icon="mdi:arrow-up" className="me-1" />
                    Promote
                  </>
                )}
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDropStudent(row.id)}
                disabled={processing}
                className="d-flex align-items-center"
              >
                <Icon icon="mdi:account-remove" className="me-1" />
                Drop
              </Button>
            </>
          )}
        </div>
      ),
      width: '300px'
    }
  ];

  const customStyles = {
    headCells: {
      style: {
        fontWeight: 'bold',
        backgroundColor: '#f8f9fa',
      },
    },
    cells: {
      style: {
        paddingTop: '8px',
        paddingBottom: '8px',
      },
    },
  };

  const morningStudents = useMemo(() =>
    filteredStudents.filter(student => student.batchTime === 'morning'),
    [filteredStudents]
  );

  const eveningStudents = useMemo(() =>
    filteredStudents.filter(student => student.batchTime === 'evening'),
    [filteredStudents]
  );

  return (
    <MasterLayout>
      <Breadcrumb
        title={`View Students`}
        items={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'View Students', active: true }
        ]}
      />

      <Card className="mt-3 py-3">
        <Card.Header className="d-flex justify-content-between align-items-center px-3">
          <div>
            <h4 className="mb-0 fs-18 fw-500">
              {semester?.name || 'Current Semester'}, Students 
            </h4>
            <small className="text-muted">
              Department: {user?.departmentName || 'N/A'} |
              Total Students: {students.length} |
              Morning: {morningStudents.length} |
              Evening: {eveningStudents.length}
            </small>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => navigate(-1)}
              size="sm"
            >
              Back to Dashboard
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading student data...</p>
            </div>
          ) : students.length === 0 ? (
            <NoDataTable
              img="../assets/images/no-data.svg"
              text={`No active students found in ${semester?.name || 'this semester'}`}
            />
          ) : (
            <>
              {/* Search Bar */}
              <div className="mb-4">
                <Form.Group controlId="searchStudents">
                  <div className="d-flex align-items-center justify-content-end">
                    <Form.Control
                      type="text"
                      placeholder="Search by name, CNIC, phone, or roll number..."
                      value={searchTerm}
                      style={{ maxWidth: '460px' }}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </Form.Group>
              </div>

              {/* Morning Batch Table */}
              {morningStudents.length > 0 && (
                <div className="mb-4">
                  <h5 className="mb-3 fs-18 fw-500">
                    Morning Batch Students ({morningStudents.length})
                  </h5>
                  <DataTable
                    columns={columns}
                    data={morningStudents}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[15, 25, 50, 100]}
                    customStyles={customStyles}
                    highlightOnHover
                    pointerOnHover
                    defaultSortFieldId={1}
                    defaultSortAsc={true}
                    responsive
                    striped
                  />
                </div>
              )}
              {console.log(morningStudents)}
              {/* Evening Batch Table */}
              {eveningStudents.length > 0 && (
                <div className="mb-4">
                  <h5 className="mb-3 fs-18 fw-500">
                    Evening Batch Students ({eveningStudents.length})
                  </h5>
                  <DataTable
                    columns={columns}
                    data={eveningStudents}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[15, 25, 50, 100]}
                    customStyles={customStyles}
                    highlightOnHover
                    pointerOnHover
                    defaultSortFieldId={1}
                    defaultSortAsc={true}
                    responsive
                    striped
                  />
                </div>
              )}
            </>
          )}
        </Card.Body>

        {/* Result Modal */}
        <Modal
          show={showResultModal}
          onHide={() => setShowResultModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <Icon icon="mdi:file-document-outline" className="me-2" />
              {selectedStudent?.name}'s Results - {semester?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {semesterResults.length > 0 ? (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {semesterResults.map((result, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{result.subjectName}</td>
                      <td>{result.obtainedMarks} / {result.totalMarks}</td>
                      <td>
                        <Badge
                          bg={
                            result.grade?.toUpperCase() === 'F' ||
                              result.grade?.toUpperCase() === 'FAIL' ?
                              'danger' : 'success'
                          }
                        >
                          {result.grade}
                        </Badge>
                      </td>
                      <td>
                        {result.grade?.toUpperCase() === 'F' ||
                          result.grade?.toUpperCase() === 'FAIL' ?
                          'Failed' : 'Passed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="text-center py-4">
                <Icon icon="mdi:file-remove" width={48} className="text-muted mb-3" />
                <h5>No results found for this semester</h5>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowResultModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Card>
    </MasterLayout>
  );
};

export default ViewStudents;