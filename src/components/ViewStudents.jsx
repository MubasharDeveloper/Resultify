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
import { CustomLoader } from './CustomLoader';
import ResultModal from './ResultModal';

const ViewStudents = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [showDropoutModal, setShowDropoutModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropoutReason, setDropoutReason] = useState("");
  const [dropoutOtherReason, setDropoutOtherReason] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { semester } = location.state || {};
  const navigate = useNavigate();

  const dropoutReasons = [
    "Academic Failure",
    "Financial Issues",
    "Personal Reasons",
    "Health Issues",
    "Disciplinary Action",
    "Transfer to Another Institution",
    "Other"
  ];

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
        where("batchId", "==", semester.batchId),
        where("status", "==", "active")
      );

      const studentsSnap = await getDocs(studentsQuery);
      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        subjectIds: semester.subjectIds || []
      }));

      setStudents(studentsData);
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

  const handleViewResult = (student) => {
    setSelectedStudent(student);
    setShowResultModal(true);
  };

  const handleShowDropoutModal = (student) => {
    setSelectedStudent(student);
    setShowDropoutModal(true);
  };

  const handleDropStudent = async () => {
    if (processing || !selectedStudent || !dropoutReason) return;

    try {
      setProcessing(true);
      const studentRef = doc(db, "Students", selectedStudent.id);

      var reason = dropoutReason === 'Other' ? dropoutOtherReason : dropoutReason;

      await updateDoc(studentRef, {
        status: "dropped",
        dropoutReason: reason,
        dropoutDate: new Date(),
        lastUpdated: new Date()
      });

      setStudents(students.filter(student => student.id !== selectedStudent.id));
      setShowDropoutModal(false);
      toast.success("Student status updated to dropped");
    } catch (error) {
      console.error("Drop student error:", error);
      toast.error("Failed to update student status");
    } finally {
      setProcessing(false);
      setDropoutReason("");
      setDropoutOtherReason("");
    }
  };

  const closeDropoutModal = () => {
    setDropoutReason("");
    setDropoutOtherReason("");
    setShowDropoutModal(false);
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
      name: 'Phone',
      selector: row => row.phone,
      sortable: true,
      cell: row => row.phone
    },
    {
      name: 'CNIC',
      selector: row => row.cnic,
      sortable: false,
      cell: row => row.cnic || 'N/A'
    },
    {
      name: 'Gender',
      selector: row => row.gender,
      sortable: true,
      cell: row => (
        <span className="text-capitalize">{row.gender || 'N/A'}</span>
      )
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: false,
      cell: row => (
        <span className={`${row.status === "active" ? "bg-success-focus text-success-main border-success-main" : "bg-danger-focus text-danger-main border-danger-main"} border px-8 py-2 radius-4 fw-medium text-sm`}>
          {row.status}
        </span>
      )
    },
    {
      name: 'Actions',
      cell: row => (
        <div className="d-flex">
          <Button
            variant={'info'}
            className="w-32-px h-32-px me-8 bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-warning-600 p-2"
            onClick={() => handleViewResult(row)}
            title="View Result"
          >
            <Icon icon="solar:document-text-outline" />
          </Button>
          <Button
            variant={'danger'}
            className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-danger-600 p-2"
            onClick={() => handleShowDropoutModal(row)}
            disabled={processing}
            title="Drop Student"
          >
            <Icon icon="tabler:x" />
          </Button>
        </div>
      ),
    }
  ];

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
              className="d-flex justify-content-center align-items-center gap-1"
            >
              <Icon icon="tabler:chevron-left" className="fs-18" />
              Back to Dashboard
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <CustomLoader size={'80px'} />
          ) : students.length === 0 ? (
            <NoDataTable
              img="../assets/images/no-data.svg"
              text={`No active students found in ${semester?.name || 'this semester'}`}
            />
          ) : (
            <>
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
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    highlightOnHover
                    pointerOnHover
                    defaultSortFieldId={1}
                    defaultSortAsc={true}
                    responsive
                    striped
                  />
                </div>
              )}

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
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
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
        {selectedStudent && (
          <ResultModal
            show={showResultModal}
            onHide={() => setShowResultModal(false)}
            studentId={selectedStudent.id}
            batchId={selectedStudent.batchId}
            semesterId={semester?.id}
            departmentId={user?.departmentId}
            semesterName={semester?.name}
            studentName={selectedStudent.name}
          />
        )}

        {/* Dropout Reason Modal */}
        <Modal show={showDropoutModal} onHide={() => closeDropoutModal()} centered>
          <Modal.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="margin-bottom-10 m-0 modal-heading">
                Student DropOut
              </h5>
              <Icon
                icon="ci:close-circle"
                color='#dc3545'
                className="cursor-pointer"
                style={{ fontSize: '24px' }}
                onClick={() => closeDropoutModal()}
              />
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Select Reason for Dropout</Form.Label>
              <Form.Control
                as="select"
                value={dropoutReason}
                onChange={(e) => setDropoutReason(e.target.value)}
              >
                <option value="" disabled selected>Select a reason</option>
                {dropoutReasons.map((reason, index) => (
                  <option key={index} value={reason}>{reason}</option>
                ))}
              </Form.Control>
            </Form.Group>
            {dropoutReason === "Other" && (
              <Form.Group className="mb-3">
                <Form.Label>Specify Reason</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={dropoutOtherReason}
                  onChange={(e) => setDropoutOtherReason(e.target.value)}
                />
              </Form.Group>
            )}
            <div className="d-flex justify-content-end align-items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => closeDropoutModal()}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDropStudent}
                disabled={!dropoutReason || processing}
                size="sm"
              >
                {processing ? (
                  <>
                    <Spinner size="sm" className="me-1" />
                    <span>Confirm Dropout</span>
                  </>
                ) : 'Confirm Dropout'}
              </Button>
            </div>
          </Modal.Body>
        </Modal>
      </Card>
    </MasterLayout>
  );
};

export default ViewStudents;