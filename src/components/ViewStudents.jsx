import React, { useEffect, useState } from "react";
import { db, collection, getDocs, query, where, doc, updateDoc } from '../Firebase_config';
import { Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import { Icon } from '@iconify/react';

const ViewStudents = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [processing, setProcessing] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { semester } = location.state || {};
  const navigate = useNavigate();

  // Helper function to safely process Firestore documents
  const processFirestoreDocs = (snapshot) => {
    return snapshot.docs.map(doc => {
      try {
        const data = doc.data();
        if (!data) {
          console.warn(`Document ${doc.id} has no data`);
          return null;
        }
        return { id: doc.id, ...data };
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.departmentId || !semester?.batchId || !semester?.name) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 1. Fetch students
        const studentsQuery = query(
          collection(db, "Students"),
          where("departmentId", "==", user.departmentId),
          where("batchId", "==", semester.batchId),
          where("currentSemester", "==", semester.name)
        );

        const studentsSnap = await getDocs(studentsQuery);
        const studentsData = processFirestoreDocs(studentsSnap);
        
        if (!studentsData.length) {
          toast.info("No students found for this semester");
          setStudents([]);
          setResults({});
          return;
        }

        setStudents(studentsData);

        // 2. Fetch results for each student
        const resultsPromises = studentsData.map(async (student) => {
          if (!student.cnic) {
            console.warn(`Student ${student.id} missing CNIC`);
            return { cnic: student.cnic, results: [] };
          }

          const resultsQuery = query(
            collection(db, "Results"),
            where("studentCnic", "==", student.cnic),
            where("semesterId", "==", semester.id)
          );

          const resultsSnap = await getDocs(resultsQuery);
          return {
            cnic: student.cnic,
            results: processFirestoreDocs(resultsSnap)
          };
        });

        const resultsData = await Promise.all(resultsPromises);
        const resultsMap = resultsData.reduce((acc, { cnic, results }) => {
          if (cnic) acc[cnic] = results;
          return acc;
        }, {});

        setResults(resultsMap);
      } catch (error) {
        console.error("Data fetch error:", error);
        toast.error("Failed to load student data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, semester]);

  const handleViewResult = (studentCnic) => {
    const student = students.find(s => s.cnic === studentCnic);
    if (!student) {
      toast.error("Student data not found");
      return;
    }
    navigate('/student-result', { 
      state: { 
        student,
        results: results[studentCnic] || [],
        semester 
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

      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, status: "dropped" } 
          : student
      ));
      
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

  if (!semester) {
    return (
      <Card className="mt-3">
        <Card.Body className="text-center">
          <h5>No semester selected</h5>
          <Button 
            variant="primary" 
            onClick={() => navigate(-1)}
            className="mt-3"
          >
            <Icon icon="ion:arrow-back" className="me-2" />
            Return to Dashboard
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center bg-light">
        <div>
          <h4 className="mb-0">
            {semester.name} Students - {semester.batchName}
          </h4>
          <small className="text-muted">
            Department: {user?.departmentName || 'N/A'}
          </small>
        </div>
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate(-1)}
        >
          <Icon icon="ion:arrow-back" className="me-1" /> Back
        </Button>
      </Card.Header>

      <Card.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading student data...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-5">
            <Icon icon="mdi:account-group-off" width={48} className="text-muted mb-3" />
            <h5>No students found</h5>
            <p>There are no students enrolled in this semester.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Status</th>
                  <th>Academic Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <Icon 
                          icon="mdi:account-circle" 
                          width={24} 
                          className="me-2 text-primary" 
                        />
                        <div>
                          <strong>{student.name}</strong>
                          <div className="small text-muted">{student.cnic}</div>
                        </div>
                      </div>
                    </td>
                    <td>{student.rollNumber || 'N/A'}</td>
                    <td>
                      <Badge 
                        bg={student.status === "active" ? "success" : "danger"}
                        pill
                      >
                        {student.status?.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      {results[student.cnic]?.length > 0 ? (
                        <Badge bg={hasPassedAllSubjects(student.cnic) ? "success" : "warning"}>
                          {hasPassedAllSubjects(student.cnic) ? "Eligible" : "Not Eligible"}
                        </Badge>
                      ) : (
                        <Badge bg="secondary">No Results</Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleViewResult(student.cnic)}
                          disabled={!results[student.cnic]?.length}
                        >
                          <Icon icon="mdi:file-document-outline" className="me-1" />
                          View Results
                        </Button>

                        {student.status === "active" && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handlePromoteStudent(student.id, student.currentSemester)}
                              disabled={processing || !hasPassedAllSubjects(student.cnic)}
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
                              onClick={() => handleDropStudent(student.id)}
                              disabled={processing}
                            >
                              <Icon icon="mdi:account-remove" className="me-1" />
                              Drop
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ViewStudents;