import React, { useEffect, useState, useMemo } from "react";
import { db, collection, getDocs, query, where, doc, updateDoc } from '../Firebase_config';
import { Card, Button, Badge, Spinner } from 'react-bootstrap';
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';
import DataTable from 'react-data-table-component';
import NoDataTable from './NoDataTable';

const ViewStudents = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { semester } = location.state || {};
  const navigate = useNavigate();

  const fetchStudents = async () => {
    if (!user?.departmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all students in the department
      const studentsQuery = query(
        collection(db, "Students"),
        where("departmentId", "==", user.departmentId)
      );

      const studentsSnap = await getDocs(studentsQuery);
      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(student => student.status === "active");

      setStudents(studentsData);

      // Fetch results for all students
      const resultsQuery = query(
        collection(db, "Results"),
        where("departmentId", "==", user.departmentId)
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
  }, [user?.departmentId]);

  const handleViewResult = (studentCnic) => {
    const student = students.find(s => s.cnic === studentCnic);
    if (!student) {
      toast.error("Student data not found");
      return;
    }
    navigate('/student-result', { 
      state: { 
        student,
        results: results[studentCnic] || []
      } 
    });
  };

  const handlePromoteStudent = async (studentId, currentSemester) => {
    if (processing) return;
    
    try {
      setProcessing(true);
      
      // Validate current semester format
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

      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, currentSemester: nextSemester } 
          : student
      ));
      
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
      name: '#',
      selector: (row, index) => index + 1,
      width: '60px',
      sortable: true
    },
    {
      name: 'Student Info',
      cell: row => (
        <div className="d-flex align-items-center">
          <Icon 
            icon="mdi:account-circle" 
            width={24} 
            className="me-2 text-primary" 
          />
          <div>
            <strong>{row.name}</strong>
            <div className="small text-muted">{row.cnic}</div>
            <div className="small">Roll No: {row.rollNumber || 'N/A'}</div>
          </div>
        </div>
      ),
      sortable: true,
      sortField: 'name'
    },
    {
      name: 'Batch',
      selector: row => row.batchName || 'N/A',
      sortable: true
    },
    {
      name: 'Semester',
      selector: row => row.currentSemester || 'N/A',
      sortable: true
    },
    {
      name: 'Status',
      cell: row => (
        <Badge 
          bg={row.status === "active" ? "success" : "danger"}
          className="text-capitalize"
        >
          {row.status}
        </Badge>
      ),
      sortable: true
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

  return (
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center bg-light">
        <div>
          <h4 className="mb-0">
            Department Students
          </h4>
          <small className="text-muted">
            Department: {user?.departmentName || 'N/A'} | Total Students: {students.length}
          </small>
        </div>
        <div className="d-flex gap-2">
          <Button 
            variant="primary"
            size="sm"
            onClick={fetchStudents}
            disabled={loading}
          >
            <Icon icon="mdi:refresh" className="me-1" />
            Refresh
          </Button>
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate(-1)}
            size="sm"
          >
            <Icon icon="ion:arrow-back" className="me-1" /> Back
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
            text="No active students found in this department"
          />
        ) : (
          <DataTable
            columns={columns}
            data={students}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            customStyles={customStyles}
            highlightOnHover
            pointerOnHover
            defaultSortFieldId={1}
            defaultSortAsc={true}
            responsive
            striped
          />
        )}
      </Card.Body>
    </Card>
  );
};

export default ViewStudents;