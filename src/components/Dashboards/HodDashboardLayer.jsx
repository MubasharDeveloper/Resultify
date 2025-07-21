import React, { useEffect, useState } from "react";
import { db, collection, getDocs, query, where, doc, getDoc } from '../../Firebase_config';
import { Card, Row, Col } from 'react-bootstrap';
import { CustomLoader } from '../CustomLoader';
import { useAuth } from "../../context/AuthContext";
import { Icon } from '@iconify/react';
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

const HodDashboardLayer = () => {
  const [loading, setLoading] = useState(true);
  const [currentSemesters, setCurrentSemesters] = useState([]);
  const [assignedLectures, setAssignedLectures] = useState([]);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentSemesters = async () => {
      if (!user || !user.departmentId) {
        setLoading(false);
        return;
      }

      try {
        const now = new Date();
        const semSnap = await getDocs(collection(db, 'Semesters'));
        const currentSem = semSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(sem => {
            const start = sem.startDate.toDate();
            const end = sem.endDate.toDate();
            return (
              sem.departmentId === user.departmentId &&
              start <= now && now <= end
            );
          });

        setCurrentSemesters(currentSem);
      } catch (error) {
        console.error("Error fetching current semesters:", error);
        toast.error("Failed to load current semesters");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentSemesters();
  }, [user]);

  useEffect(() => {
    const fetchAssignedLectures = async () => {
      if (!user || !user.id || currentSemesters.length === 0) {
        setAssignedLectures([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const lecturesCollectionRef = collection(db, "Lectures");
        const q = query(
          lecturesCollectionRef,
          where("teacherId", "==", user.id)
        );
        const querySnapshot = await getDocs(q);
        const lecturesDataPromises = querySnapshot.docs.map(async (lectureDoc) => {
          const lectureData = { id: lectureDoc.id, ...lectureDoc.data() };

          // Fetch related data
          if (lectureData.subjectId) {
            const subjectRef = doc(db, "Subjects", lectureData.subjectId);
            const subjectSnap = await getDoc(subjectRef);
            if (subjectSnap.exists()) {
              lectureData.subjectName = subjectSnap.data().name;
            }
          }

          if (lectureData.semesterId) {
            const semesterRef = doc(db, "Semesters", lectureData.semesterId);
            const semesterSnap = await getDoc(semesterRef);
            if (semesterSnap.exists()) {
              lectureData.semesterName = semesterSnap.data().name;
            }
          }

          if (lectureData.batchId) {
            const batchRef = doc(db, "Batches", lectureData.batchId);
            const batchSnap = await getDoc(batchRef);
            if (batchSnap.exists()) {
              lectureData.batchName = batchSnap.data().name;
            }
          }
          return lectureData;
        });

        const fetchedLectures = await Promise.all(lecturesDataPromises);
        const currentSemesterIds = currentSemesters.map(cs => cs.id);
        const filteredLectures = fetchedLectures.filter(lecture =>
          lecture.semesterId && currentSemesterIds.includes(lecture.semesterId)
        );

        setAssignedLectures(filteredLectures);
      } catch (error) {
        console.error("Error fetching assigned lectures:", error);
        toast.error("Failed to load assigned lectures");
        setAssignedLectures([]);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) {
      fetchAssignedLectures();
    }
  }, [user, currentSemesters]);

  useEffect(() => {
    const fetchDepartmentStats = async () => {
      if (!user || !user.departmentId) return;

      try {
        // Fetch total teachers
        const teachersQuery = query(
          collection(db, "Users"),
          where("departmentId", "==", user.departmentId),
          where("roleId", "==", "k1LBLXK6JLUlL7tblvMM")
        );
        const teachersSnap = await getDocs(teachersQuery);
        setTotalTeachers(teachersSnap.size);

        // Fetch total students
        const studentsQuery = query(
          collection(db, "Students"),
          where("departmentId", "==", user.departmentId),
        );
        const studentsSnap = await getDocs(studentsQuery);
        setTotalStudents(studentsSnap.size);
      } catch (error) {
        console.error("Error fetching department stats:", error);
        toast.error("Failed to load department statistics");
      }
    };

    if (user && user.departmentId) {
      fetchDepartmentStats();
    }
  }, [user]);

  const handleViewDetails = (lecture) => {
    navigate('/manage-result', { state: { lecture } });
  };

  const handleViewStudents = (semester) => {
    navigate('/view-students', { state: { semester } });
  };

  return (
    <div className="admin-dashboard">
      {loading ? (
        <Card>
          <Card.Body>
            <CustomLoader size={'80px'} />
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {user.roleName == 'HOD' && currentSemesters.length > 0 &&
            <Col md={12}>
              <Card>
                <Card.Body>
                  <h5 className="my-3 h6" style={{ fontSize: '18px' }}>Current Semesters</h5>
                  <Row className="g-3">
                    {currentSemesters.map((semester, index) => (
                      <Col xxl={3} sm={6} key={semester.id}>
                        <Card className={`p-3 shadow-none radius-8 border h-100 bg-gradient-end-${index + 1}`}>
                          <Card.Body className="p-0">
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8">
                              <div className="d-flex align-items-center gap-2">
                                <span className="mb-0 w-48-px h-48-px bg-primary-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0">
                                  <Icon icon="solar:calendar-bold" width="24" height="24" />
                                </span>
                                <div>
                                  <span className="mb-2 fw-medium text-secondary-light text-sm">Active Semester</span>
                                  <h6 className="fw-500 fs-18">{semester.name}</h6>
                                </div>
                              </div>
                            </div>
                            <div className="d-flex justify-content-between gap-3 align-items-center">
                              <p className="text-sm mb-0">
                                Batch: <span className="fw-medium text-primary-main text-sm">
                                  {semester.batchName}
                                </span>
                              </p>
                              <button
                                className="btn btn-sm btn-link"
                                onClick={() => handleViewStudents(semester)}
                              >
                                View Students
                              </button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          }
          {assignedLectures.length > 0 &&
            <Col md={12}>
              <Card>
                <Card.Body>
                  <h5 className="my-3 h6" style={{ fontSize: '18px' }}>Assigned Subjects ({user.name})</h5>
                  <Row className="g-3">
                    {assignedLectures.map((lecture, index) => (
                      <Col xxl={3} sm={6} key={lecture.id}>
                        <Card className={`p-3 shadow-none radius-8 border h-100 bg-gradient-end-${((index + 1) % 6) + 1}`}>
                          <Card.Body className="p-0">
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8">
                              <div className="d-flex align-items-center gap-2">
                                <span className="mb-0 w-48-px h-48-px bg-primary-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0">
                                  <Icon icon="solar:book-bold" width="24" height="24" />
                                </span>
                                <div>
                                  <span className="mb-2 fw-medium text-secondary-light text-sm">{lecture.semesterName || 'Semester N/A'}</span>
                                  <h6 className="fw-500 fs-18 text-1">{lecture.subjectName || 'Subject N/A'}</h6>
                                </div>
                              </div>
                            </div>
                            <div className="d-flex justify-content-between">
                              <p className="text-sm mb-0">
                                Batch: <span className="fw-medium text-primary-main text-sm">
                                  {lecture.batchName || 'Batch N/A'}
                                </span>
                              </p>
                              <p className="text-sm mb-0">
                                Batch Time: <span className="fw-medium text-primary-main text-sm text-capitalize">
                                  {lecture.sessionType || 'Batch N/A'}
                                </span>
                              </p>
                            </div>
                            <div className="d-flex justify-content-center mt-3">
                              <button
                                className="btn btn-sm btn-link"
                                onClick={() => handleViewDetails(lecture)}
                              >
                                Manage Result
                              </button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          }
          <Col md={12}>
            <Card>
              <Card.Body>
                <h5 className="my-3 h6" style={{ fontSize: '18px' }}>Department Stats ({user.departmentName || 'Department'})</h5>
                <Row className="g-3">
                  <Col xxl={3} sm={6}>
                    <Card className="p-3 shadow-none radius-8 border h-100 bg-gradient-end-4">
                      <Card.Body className="p-0">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8">
                          <div className="d-flex align-items-center gap-2">
                            <span className="mb-0 w-48-px h-48-px bg-info-main flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0">
                              <Icon icon="clarity:users-solid" width="24" height="24" />
                            </span>
                            <div>
                              <span className="mb-2 fw-medium text-secondary-light text-sm">Total Teachers</span>
                              <h6 className="fw-500 fs-18">{totalTeachers}</h6>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xxl={3} sm={6}>
                    <Card className="p-3 shadow-none radius-8 border h-100 bg-gradient-end-5">
                      <Card.Body className="p-0">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8">
                          <div className="d-flex align-items-center gap-2">
                            <span className="mb-0 w-48-px h-48-px bg-success-main flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0">
                              <Icon icon="fa-solid:user-graduate" width="24" height="24" />
                            </span>
                            <div>
                              <span className="mb-2 fw-medium text-secondary-light text-sm">Total Students (All Batches)</span>
                              <h6 className="fw-500 fs-18">{totalStudents}</h6>
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default HodDashboardLayer;