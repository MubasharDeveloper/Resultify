import React, { useEffect, useState } from "react";
import { db, collection, getDocs, query, where, doc, getDoc } from '../../Firebase_config';
import { Card, Row, Col } from 'react-bootstrap';
import { CustomLoader } from '../CustomLoader';
import { useAuth } from "../../context/AuthContext";
import { Icon } from '@iconify/react';
import NoDataTable from '../NoDataTable';

const HodDashboardLayer = () => {
  const [loading, setLoading] = useState(true);
  const [currentSemesters, setCurrentSemesters] = useState([]);
  const [assignedLectures, setAssignedLectures] = useState([]);
  const [totalTeachers, setTotalTeachers] = useState(0); // Define totalTeachers state
  const [totalStudents, setTotalStudents] = useState(0); // Define totalStudents state
  const { user } = useAuth();

  useEffect(() => {
    const fetchCurrentSemesters = async () => {
      if (!user || !user.departmentId) {
        setLoading(false);
        return;
      }

      try {
        const now = new Date();

        // Fetch Semesters
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
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentSemesters();
  }, [user]);

  // New useEffect to fetch assigned lectures
  useEffect(() => {
    const fetchAssignedLectures = async () => {
      if (!user || !user.id || currentSemesters.length === 0) { // Wait for currentSemesters to be populated
        // If no current semesters, or user not loaded, potentially clear lectures or do nothing
        setAssignedLectures([]); // Clear lectures if no current semesters or user
        setLoading(false); // Ensure loading is false if we return early
        return;
      }

      setLoading(true); // Set loading true at the start of data fetching
      try {
        const lecturesCollectionRef = collection(db, "Lectures");
        const q = query(
          lecturesCollectionRef,
          where("teacherId", "==", user.id)
        );
        const querySnapshot = await getDocs(q);
        const lecturesDataPromises = querySnapshot.docs.map(async (lectureDoc) => {
          const lectureData = { id: lectureDoc.id, ...lectureDoc.data() };

          // Fetch Subject Name
          if (lectureData.subjectId) {
            const subjectRef = doc(db, "Subjects", lectureData.subjectId);
            const subjectSnap = await getDoc(subjectRef);
            if (subjectSnap.exists()) {
              lectureData.subjectName = subjectSnap.data().name; // Assuming 'name' field in Subjects
            }
          }

          // Fetch Semester Name
          if (lectureData.semesterId) {
            const semesterRef = doc(db, "Semesters", lectureData.semesterId);
            const semesterSnap = await getDoc(semesterRef);
            if (semesterSnap.exists()) {
              lectureData.semesterName = semesterSnap.data().name; // Assuming 'name' field in Semesters
            }
          }

          // Fetch Batch Name
          if (lectureData.batchId) {
            const batchRef = doc(db, "Batches", lectureData.batchId);
            const batchSnap = await getDoc(batchRef);
            if (batchSnap.exists()) {
              lectureData.batchName = batchSnap.data().name; // Assuming 'name' field in Batches
            }
          }
          return lectureData;
        });

        const fetchedLectures = await Promise.all(lecturesDataPromises);

        // Filter lectures to include only those from current semesters
        const currentSemesterIds = currentSemesters.map(cs => cs.id);
        const filteredLectures = fetchedLectures.filter(lecture => 
          lecture.semesterId && currentSemesterIds.includes(lecture.semesterId)
        );

        setAssignedLectures(filteredLectures);
      } catch (error) {
        console.error("Error fetching assigned lectures or related data:", error);
        setAssignedLectures([]); // Clear lectures on error
      } finally {
        setLoading(false); // Set loading false after all operations complete
      }
    };

    if (user && user.id) { // Ensure user.id is available before fetching
      fetchAssignedLectures();
    }
  }, [user, currentSemesters]); // Add currentSemesters to dependency array

  // useEffect to fetch department stats (teachers and students)
  useEffect(() => {
    const fetchDepartmentStats = async () => {
      if (!user || !user.departmentId) {
        return;
      }

      // Consider a separate loading state for stats if needed
      // setLoading(true); 
      try {
        const usersRef = collection(db, "Users");

        // Fetch total teachers (assuming roleId '2' is for teachers)
        const teachersQuery = query(
          usersRef,
          where("departmentId", "==", user.departmentId),
          where("roleId", "==", "k1LBLXK6JLUlL7tblvMM") // Role ID for Teachers
        );
        const teachersSnap = await getDocs(teachersQuery);
        setTotalTeachers(teachersSnap.size);

        // Fetch total students (assuming roleId '3' is for students)
        const studentsQuery = query(
          usersRef,
          where("departmentId", "==", user.departmentId),
          where("roleId", "==", "3") // Role ID for Students
        );
        const studentsSnap = await getDocs(studentsQuery);
        setTotalStudents(studentsSnap.size);

      } catch (error) {
        console.error("Error fetching department stats:", error);
        setTotalTeachers(0);
        setTotalStudents(0);
      } finally {
        // setLoading(false); // Set to false if a separate loading state was used
      }
    };

    if (user && user.departmentId) {
      fetchDepartmentStats();
    }
  }, [user]); // Rerun if user object changes

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
          {currentSemesters.length > 0 &&
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
                                  <span className="mb-2 fw-medium text-secondary-light text-sm">Active Semesters</span>
                                  <h6 className="fw-semibold">{semester.name}</h6>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm mb-0">
                              Batch : <span className="fw-medium text-primary-main text-sm">
                                {semester.batchName}
                              </span>
                            </p>
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
                        <Card className={`p-3 shadow-none radius-8 border h-100 bg-gradient-end-${index + 3}`}>
                          <Card.Body className="p-0">
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-1 mb-8">
                              <div className="d-flex align-items-center gap-2">
                                <span className="mb-0 w-48-px h-48-px bg-primary-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0">
                                  <Icon icon="solar:book-bold" width="24" height="24" />
                                </span>
                                <div>
                                  <span className="mb-2 fw-medium text-secondary-light text-sm">{lecture.semesterName || 'Semester N/A'}</span>
                                  <h6 className="fw-semibold text-1">{lecture.subjectName || 'Subject N/A'}</h6>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm mb-0">
                              Batch: <span className="fw-medium text-primary-main text-sm">
                                {lecture.batchName || 'Batch N/A'}
                              </span>
                            </p>
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
                              <h6 className="fw-semibold">{totalTeachers}</h6>
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
                              <span className="mb-2 fw-medium text-secondary-light text-sm">Total Students</span>
                              <h6 className="fw-semibold">{totalStudents}</h6>
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
