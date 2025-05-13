import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Card, Button, Table, Row, Col } from 'react-bootstrap';
import { db, collection, getDocs, query, where, Timestamp } from '../../Firebase_config';
import { useAuth } from "../../context/AuthContext";
import { CustomLoader } from '../CustomLoader';
import NoDataTable from '../NoDataTable';
import { toast, Slide } from 'react-toastify';

const Timetable = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentSemesters, setCurrentSemesters] = useState([]);
  const [group1Semesters, setGroup1Semesters] = useState([]);
  const [group2Semesters, setGroup2Semesters] = useState([]);

  // Fetch current semesters (where current date is between start and end date)
  useEffect(() => {
    const fetchCurrentSemesters = async () => {
      try {
        if (!user?.departmentId) return;

        const now = Timestamp.now();
        const semestersQuery = query(
          collection(db, "Semesters"),
          where("departmentId", "==", user.departmentId),
          where("startDate", "<=", now),
          where("endDate", ">=", now)
        );

        const semestersSnap = await getDocs(semestersQuery);
        const semestersList = semestersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Group semesters
        const group1 = semestersList.filter(sem => {
          const semNumber = parseInt(sem.name.split(' ')[1]);
          return [1, 2, 5, 6].includes(semNumber);
        });

        const group2 = semestersList.filter(sem => {
          const semNumber = parseInt(sem.name.split(' ')[1]);
          return [3, 4, 7, 8].includes(semNumber);
        });

        setCurrentSemesters(semestersList);
        setGroup1Semesters(group1);
        setGroup2Semesters(group2);
      } catch (error) {
        console.error("Error fetching current semesters:", error);
        toast.error("Failed to load current semesters");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentSemesters();
  }, [user?.departmentId]);

  // Sample timetable data - replace with your actual data structure
  const sampleTimetable = {
    "Monday": [
      { time: "08:00 - 09:30", subject: "Mathematics", room: "A101" },
      { time: "09:30 - 11:00", subject: "Physics", room: "A102" },
      { time: "11:30 - 13:00", subject: "Chemistry", room: "A103" }
    ],
    "Tuesday": [
      { time: "08:00 - 09:30", subject: "English", room: "A104" },
      { time: "09:30 - 11:00", subject: "Biology", room: "A105" }
    ],
    "Wednesday": [
      { time: "08:00 - 09:30", subject: "Computer Science", room: "Lab 1" },
      { time: "09:30 - 11:00", subject: "Mathematics", room: "A101" }
    ],
    "Thursday": [
      { time: "08:00 - 09:30", subject: "Physics", room: "A102" },
      { time: "09:30 - 11:00", subject: "Chemistry", room: "Lab 2" }
    ],
    "Friday": [
      { time: "08:00 - 09:30", subject: "English", room: "A104" },
      { time: "09:30 - 11:00", subject: "Biology", room: "A105" }
    ],
    "Saturday": [
      { time: "08:00 - 09:30", subject: "Computer Science", room: "Lab 1" }
    ]
  };

  const group1Days = ["Monday", "Tuesday", "Wednesday"];
  const group2Days = ["Thursday", "Friday", "Saturday"];

  const renderTimetable = (semester, days) => {
    return (
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{semester.name} - {semester.shift}</h5>
          <small className="text-muted">
            {formatDate(semester.startDate)} to {formatDate(semester.endDate)}
          </small>
        </Card.Header>
        <Card.Body>
          <Table striped bordered responsive>
            <thead>
              <tr>
                <th>Time</th>
                {days.map(day => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* This is a simplified example - you'll need to adjust based on your actual timetable structure */}
              <tr>
                <td>08:00 - 09:30</td>
                {days.map(day => (
                  <td key={day}>
                    {sampleTimetable[day]?.[0]?.subject || '-'}
                    <br />
                    <small>{sampleTimetable[day]?.[0]?.room || ''}</small>
                  </td>
                ))}
              </tr>
              <tr>
                <td>09:30 - 11:00</td>
                {days.map(day => (
                  <td key={day}>
                    {sampleTimetable[day]?.[1]?.subject || '-'}
                    <br />
                    <small>{sampleTimetable[day]?.[1]?.room || ''}</small>
                  </td>
                ))}
              </tr>
              <tr>
                <td>11:30 - 13:00</td>
                {days.map(day => (
                  <td key={day}>
                    {sampleTimetable[day]?.[2]?.subject || '-'}
                    <br />
                    <small>{sampleTimetable[day]?.[2]?.room || ''}</small>
                  </td>
                ))}
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) return '-';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return <CustomLoader size={'80px'} />;
  }

  if (currentSemesters.length === 0) {
    return (
      <NoDataTable
        img={'../assets/images/no-data.svg'}
        text={'No Current Semesters Found!'}
      />
    );
  }

  return (
    <div className="timetable-container">
      {/* Group 1 (Semesters 1,2,5,6) - Mon-Wed */}
      {group1Semesters.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-3">Group 1 (Monday - Wednesday)</h4>
          <Row>
            {group1Semesters.map(semester => (
              <Col key={semester.id} md={6} className="mb-4">
                {renderTimetable(semester, group1Days)}
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Group 2 (Semesters 3,4,7,8) - Thu-Sat */}
      {group2Semesters.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-3">Group 2 (Thursday - Saturday)</h4>
          <Row>
            {group2Semesters.map(semester => (
              <Col key={semester.id} md={6} className="mb-4">
                {renderTimetable(semester, group2Days)}
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default Timetable;