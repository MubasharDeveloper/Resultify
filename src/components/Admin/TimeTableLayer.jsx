import React, { useEffect, useState } from 'react';
import { db, collection, getDocs, addDoc, Timestamp, query, where, deleteDoc, doc } from '../../Firebase_config';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { useAuth } from "../../context/AuthContext";
import DataTable from 'react-data-table-component';
import NoDataTable from '../NoDataTable';
import { CustomLoader } from '../CustomLoader';
import { toast } from 'react-toastify'; // Import ToastContainer and toast
import 'react-toastify/dist/ReactToastify.css'; // Import toastify CSS
import Swal from 'sweetalert2'; // Import SweetAlert2
import { Icon } from '@iconify/react';

const SET_A_SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 5', 'Semester 6'];
const SET_B_SEMESTERS = ['Semester 3', 'Semester 4', 'Semester 7', 'Semester 8'];

const AssignSubjectsComponent = () => {
  const { user } = useAuth();
  const [setASemesters, setSetASemesters] = useState([]);
  const [setBSemesters, setSetBSemesters] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [roles, setRoles] = useState([]);
  const [existingAssignments, setExistingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // New state for processing status

  const fetchSubjects = async () => {
    try {
      const q = query(
        collection(db, "Subjects"),
        where("departmentId", "==", user.departmentId)
      );
      const subjectsSnapshot = await getDocs(q);
      const fetchedSubjects = subjectsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubjects(fetchedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  useEffect(() => {
    if (!user || !user.departmentId) return;

    const loadData = async () => {
      setLoading(true); // Set loading to true when data fetching starts
      const now = new Date();

      // Fetch Semesters
      const semSnap = await getDocs(collection(db, 'Semesters'));
      const currentSemesters = semSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(sem => {
          const start = sem.startDate.toDate();
          const end = sem.endDate.toDate();
          return (
            sem.departmentId === user.departmentId &&
            start <= now && now <= end
          );
        });

      const setA = currentSemesters.filter(sem => SET_A_SEMESTERS.includes(sem.name));
      const setB = currentSemesters.filter(sem => SET_B_SEMESTERS.includes(sem.name));

      setSetASemesters(setA);
      setSetBSemesters(setB);

      // Fetch Roles
      const allRolesSnap = await getDocs(collection(db, "Roles"));
      const rolesList = allRolesSnap.docs
        .filter(doc => ['HOD', 'Teacher'].includes(doc.data().name))
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setRoles(rolesList);

      // Fetch Teachers & HODs
      const allowedRoleIds = rolesList.filter(r => ['HOD', 'Teacher'].includes(r.name)).map(r => r.id);
      const usersQuery = query(
        collection(db, "Users"),
        where("departmentId", "==", user.departmentId),
        where("roleId", "in", allowedRoleIds)
      );
      const userSnapQuery = await getDocs(usersQuery);
      const usersList = userSnapQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(usersList);
      setLoading(false); // Set loading to false when data fetching completes
    };

    fetchSubjects();
    loadData();
  }, [user]);

  // New useEffect to fetch existing assignments
  useEffect(() => {
    const fetchExistingAssignments = async () => {
      if (!user || !user.departmentId || setASemesters.length === 0 && setBSemesters.length === 0) return;

      try {
        const allSemesters = [...setASemesters, ...setBSemesters];
        const lectureQueries = allSemesters.map(sem =>
          query(
            collection(db, 'Lectures'),
            where('departmentId', '==', user.departmentId),
            where('semesterId', '==', sem.id),
            where('batchId', '==', sem.batchId) // Assuming batchId is available on semester object
          )
        );

        const fetchedLectures = [];
        for (const q of lectureQueries) {
          const lectureSnap = await getDocs(q);
          lectureSnap.docs.forEach(doc => fetchedLectures.push({ id: doc.id, ...doc.data() }));
        }
        setExistingAssignments(fetchedLectures);
      } catch (error) {
        console.error('Error fetching existing assignments:', error);
      }
    };

    fetchExistingAssignments();
  }, [user, setASemesters, setBSemesters]); // Depend on semesters to ensure they are loaded

  const handleChange = (semesterId, rowIndex, type, value) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      if (!newAssignments[semesterId]) newAssignments[semesterId] = [];
      if (!newAssignments[semesterId][rowIndex]) newAssignments[semesterId][rowIndex] = {};
      newAssignments[semesterId][rowIndex][type] = value;
      return newAssignments;
    });
  };

  const getRoleName = (id) => {
    const role = roles.find(r => r.id === id);
    return role ? role.name : 'N/A';
  };

  const getSubjectName = (id) => {
    const subject = subjects.find(s => s.id === id);
    return subject ? subject.name : 'N/A';
  };

  const getTeacherName = (id) => {
    const teacher = teachers.find(t => t.id === id);
    return teacher ? teacher.name : 'N/A';
  };

  const handleDelete = async (assignmentId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, 'Lectures', assignmentId));
      toast.success('Assignment deleted successfully!'); // Use toast for success
      // Re-fetch existing assignments to update the UI
      setSetASemesters([...setASemesters]); // Trigger re-fetch
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment'); // Use toast for error
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (row, index) => {
    const semesterId = row.semesterId;
    const subjectId = row.subjectIds[index];
    const teacherId = assignments[semesterId]?.[index]?.teacher;

    if (!teacherId) {
      toast.error('Please select a teacher'); // Use toast for error
      return;
    }

    setIsProcessing(true);
    try {
      // Find the semester to get batchId
      const semester = [...setASemesters, ...setBSemesters].find(s => s.id === semesterId);

      if (!semester) {
        toast.error('Semester not found'); // Use toast for error
        return;
      }

      // Check if an assignment already exists for this subject, semester, and batch
      const existingAssignment = existingAssignments.find(assign =>
        assign.semesterId === semesterId &&
        assign.subjectId === subjectId &&
        assign.batchId === semester.batchId
      );

      if (existingAssignment) {
        Swal.fire({
          icon: 'warning',
          title: 'Assignment Exists',
          text: `Subject '${getSubjectName(subjectId)}' is already assigned to '${getTeacherName(existingAssignment.teacherId)}' for this semester and batch.`,
        });
        return;
      }

      // Check if the teacher is already assigned to 2 subjects in this semester
      const teacherAssignmentsInSemester = existingAssignments.filter(assign =>
        assign.semesterId === semesterId &&
        assign.teacherId === teacherId
      );

      if (teacherAssignmentsInSemester.length >= 2) {
        Swal.fire({
          icon: 'warning',
          title: 'Assignment Limit Reached',
          text: `${getTeacherName(teacherId)} is already assigned to 2 subjects in this semester. A teacher can be assigned a maximum of 2 subjects per semester.`,
        });
        return;
      }

      // Save to Firebase
      await addDoc(collection(db, 'Lectures'), {
        semesterId,
        batchId: semester.batchId,
        departmentId: user.departmentId,
        subjectId,
        teacherId,
        assignedDate: Timestamp.now(),
        status: 'active'
      });

      toast.success('Assignment saved successfully!'); // Use toast for success
      // Re-fetch existing assignments to update the UI
      // This will trigger the useEffect for existingAssignments
      setSetASemesters([...setASemesters]); // Trigger re-fetch by updating state that useEffect depends on
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast.error('Failed to save assignment'); // Use toast for error
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      name: '#',
      selector: (row, index) => index + 1,
      sortable: false,
      width: '40px',
    },
    {
      name: 'Subject',
      cell: (row, index) => (
        getSubjectName(row.subjectIds[index])
      ),
      sortable: false,
    },
    {
      name: 'Teacher',
      cell: (row, index) => {
        const semester = [...setASemesters, ...setBSemesters].find(s => s.id === row.semesterId);
        const assignedLecture = existingAssignments.find(assign =>
          assign.semesterId === row.semesterId &&
          assign.subjectId === row.subjectIds[index] &&
          assign.batchId === semester?.batchId // Check for batchId if semester is found
        );

        if (assignedLecture) {
          return (
            getTeacherName(assignedLecture.teacherId)
          );
        } else {
          return (
            <Form.Select
              className='form-select-sm'
              value={assignments[row.semesterId]?.[index]?.teacher || ''}
              onChange={e => handleChange(row.semesterId, index, 'teacher', e.target.value)}
            >
              <option value="">Select Teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {`${teacher.name} - ${getRoleName(teacher.roleId)}`}
                </option>
              ))}
            </Form.Select>
          );
        }
      },
      sortable: false,
    },
    {
      name: 'Action',
      cell: (row, index) => {
        const semester = [...setASemesters, ...setBSemesters].find(s => s.id === row.semesterId);
        const assignedLecture = existingAssignments.find(assign =>
          assign.semesterId === row.semesterId &&
          assign.subjectId === row.subjectIds[index] &&
          assign.batchId === semester?.batchId
        );

        if (assignedLecture) {
          return (
            <Button
              variant={'danger'}
              className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-danger-600 p-2"
              onClick={() => handleDelete(assignedLecture.id)}
              disabled={isProcessing} // Disable button while processing
            >
              <Icon icon="mingcute:delete-2-line" />
            </Button>
          );
        } else {
          return (
            <Button
              variant={'success'}
              className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-success-600 p-2"
              onClick={() => handleSave(row, index)}
              disabled={isProcessing} // Disable button while processing
            >
              <Icon icon="lucide:edit" />
            </Button>
          );
        }
      },
      sortable: false,
      width: '100px',
    },
  ];

  const renderSemesterTable = (sem, setType) => {
    const data = sem.subjectIds.map((subjectId, index) => ({
      semesterId: sem.id,
      subjectIds: sem.subjectIds,
      setType,
      semester: sem,
      index
    }));

    return (
      <Col lg={6}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0 h6 d-flex align-items-center gap-2" style={{ fontSize: '18px' }}>
            {sem.name}
          </h6>
          <small className="text-muted">
            {`Session: ${sem.batchStart} - ${sem.batchEnd}`}
          </small>
        </div>
        <DataTable
          columns={columns}
          data={data}
          pagination
          responsive
          striped
          highlightOnHover
          noDataComponent={
            <NoDataTable
              img={'../assets/images/no-data.svg'}
              text={'No Subjects Found!'}
            />
          }
        />
      </Col>
    );
  };

  return (
    <Row className='g-3'>
      <Col md={12}>
        <Card className="mb-4">
          <Card.Header className='fs-20 fw-500 text-center'>Set A (Mon-Wed)</Card.Header>
          <Card.Body>
            {loading ? (
              <CustomLoader size={'80px'} />
            ) : (
              <Row className='g-3'>
                {setASemesters.length === 0 ?
                  (<NoDataTable img={'../assets/images/no-data.svg'} text={'No Semesters Found!'} />) :
                  setASemesters.map(sem => renderSemesterTable(sem, 'A'))}
              </Row>
            )}
          </Card.Body>
        </Card>
      </Col>
      <Col md={12}>
        <Card className="mb-4">
          <Card.Header className='fs-20 fw-500 text-center'>Set B (Thu-Sat)</Card.Header>
          <Card.Body>
            {loading ? (
              <CustomLoader size={'80px'} />
            ) : (
              <Row className='g-3'>
                {setBSemesters.length === 0 ?
                  (<NoDataTable img={'../assets/images/no-data.svg'} text={'No Semesters Found!'} />) :
                  setBSemesters.map(sem => renderSemesterTable(sem, 'B'))
                }
              </Row>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default AssignSubjectsComponent;