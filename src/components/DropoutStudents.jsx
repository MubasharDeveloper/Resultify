import React, { useEffect, useState, useMemo } from "react";
import { db, collection, getDocs, query, where } from '../Firebase_config';
import { Card, Button, Form } from 'react-bootstrap';
import { useAuth } from "../context/AuthContext";
import { toast } from 'react-toastify';
import DataTable from 'react-data-table-component';
import NoDataTable from './NoDataTable';
import MasterLayout from '../masterLayout/MasterLayout';
import Breadcrumb from './Breadcrumb';
import { CustomLoader } from './CustomLoader';

const ViewStudents = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [batchNames, setBatchNames] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  // Fetch students and their batch names
  const fetchData = async () => {
    if (!user?.departmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch inactive/dropped students
      const studentsQuery = query(
        collection(db, "Students"),
        where("departmentId", "==", user.departmentId),
        where("status", "in", ["dropped", "inactive"])
      );
      const studentsSnap = await getDocs(studentsQuery);
      const studentsData = studentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get unique batch IDs from students
      const batchIds = [...new Set(studentsData.map(s => s.batchId))].filter(Boolean);

      // Fetch batch names in chunks (Firebase limits "in" queries to 10 items)
      let batchesData = {};
      for (let i = 0; i < batchIds.length; i += 10) {
        const batchChunk = batchIds.slice(i, i + 10);
        const batchesQuery = query(
          collection(db, "Batches"),
          where("__name__", "in", batchChunk.length ? batchChunk : [''])
        );
        const batchesSnap = await getDocs(batchesQuery);
        batchesSnap.forEach(doc => {
          batchesData[doc.id] = doc.data().name;
        });
      }

      setBatchNames(batchesData);
      setStudents(studentsData);
    } catch (error) {
      console.error("Data fetch error:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.departmentId]);

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
      cell: row => row.name || 'N/A'
    },
    {
      name: 'Phone',
      selector: row => row.phone,
      sortable: true,
      cell: row => row.phone || 'N/A'
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
      name: 'Batch',
      selector: row => row.batchId,
      sortable: false,
      cell: row => batchNames[row.batchId] || 'N/A'
    },
    {
      name: 'Status',
      selector: row => row.status,
      sortable: false,
      cell: row => (
        <span className={`${row.status === "active" ? "bg-success-focus text-success-main border-success-main" : "bg-danger-focus text-danger-main border-danger-main"} text-capitalize border px-8 py-2 radius-4 fw-medium text-sm`}>
          {row.status || 'N/A'}
        </span>
      )
    },
    {
      name: 'Dropout Reason',
      selector: row => row.dropoutReason,
      sortable: false,
      cell: row => <span className="text-capitalize">{row.dropoutReason || 'N/A'}</span>
    }
  ];

  return (
    <MasterLayout>
      <Breadcrumb
        title="Dropout Students"
        items={[
          { title: 'Dashboard', path: '/dashboard' },
          { title: 'View Students', active: true }
        ]}
      />

      <Card className="mt-3 py-3">
        <Card.Header className="d-flex justify-content-between align-items-center px-3">
          <div>
            <h4 className="mb-0 fs-18 fw-500">
              Dropout Students
            </h4>
          </div>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <CustomLoader size={'80px'} />
          ) : students.length === 0 ? (
            <NoDataTable
              img="../assets/images/no-data.svg"
              text="No students found"
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

              {filteredStudents.length > 0 ? (
                <div className="mb-4">
                  <DataTable
                    columns={columns}
                    data={filteredStudents}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    highlightOnHover
                    pointerOnHover
                    defaultSortFieldId={1}
                    defaultSortAsc={true}
                    responsive
                    striped
                    noDataComponent={<NoDataTable text="No matching students found" />}
                  />
                </div>
              ) : (
                <NoDataTable text="No matching students found" />
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </MasterLayout>
  );
};

export default ViewStudents;