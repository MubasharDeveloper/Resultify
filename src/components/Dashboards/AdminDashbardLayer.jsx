import React, { useEffect, useState } from "react";
import { db, collection, getDocs, query, where } from '../../Firebase_config';
import { Card, Row, Col } from 'react-bootstrap';
import { CustomLoader } from '../CustomLoader';
import { useAuth } from "../../context/AuthContext";
import DataTable from 'react-data-table-component';
import Chart from 'react-apexcharts'; // Import Chart
import { Icon } from '@iconify/react';
import NoDataTable from '../NoDataTable';

const AdminDashboardLayer = () => {
  const { user } = useAuth();
  const [totalStaff, setTotalStaff] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState([]); // New state for department statistics

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Total Staff (Users with roles other than Admin)
        const usersRef = collection(db, "Users");
        const rolesRef = collection(db, "Roles");
        const departmentsRef = collection(db, "Departments"); // Reference to departments collection

        const adminRoleQuery = query(rolesRef, where("name", "==", "Admin"));
        const adminRoleSnap = await getDocs(adminRoleQuery);
        const adminRoleId = adminRoleSnap.docs.length > 0 ? adminRoleSnap.docs[0].id : null;

        let staffCount = 0;
        if (adminRoleId) {
          const staffQuery = query(usersRef, where("roleId", "!=", adminRoleId));
          const staffSnap = await getDocs(staffQuery);
          staffCount = staffSnap.size;
        } else {
          const allUsersSnap = await getDocs(usersRef);
          staffCount = allUsersSnap.size; // If no admin role, count all users as staff for now
        }
        setTotalStaff(staffCount);

        // Fetch Pending Requests (Users with status 'pending' or 'unlisted')
        const pendingUsersQuery = query(usersRef, where("status", "==", "pending")); // Assuming a 'status' field
        const pendingUsersSnap = await getDocs(pendingUsersQuery);
        setPendingRequests(pendingUsersSnap.size);

        // Fetch Total Departments
        const departmentsSnap = await getDocs(departmentsRef);
        setTotalDepartments(departmentsSnap.size);

        // Fetch Total Batches
        const batchesSnap = await getDocs(collection(db, "Batches"));
        setTotalBatches(batchesSnap.size);

        // Fetch Total Students (assuming students are users with a specific role or status)
        const studentRoleQuery = query(rolesRef, where("name", "==", "Student"));
        const studentRoleSnap = await getDocs(studentRoleQuery);
        const studentRoleId = studentRoleSnap.docs.length > 0 ? studentRoleSnap.docs[0].id : null;

        let studentCount = 0;
        if (studentRoleId) {
          const studentsQuery = query(usersRef, where("roleId", "==", studentRoleId));
          const studentsSnap = await getDocs(studentsQuery);
          studentCount = studentsSnap.size;
        }
        setTotalStudents(studentCount);

        // Fetch Department-wise statistics
        const departmentData = [];
        for (const doc of departmentsSnap.docs) {
          const department = { id: doc.id, ...doc.data() };

          // Count students in this department
          let studentsInDeptCount = 0;
          if (studentRoleId && department.id) { // Ensure studentRoleId and department.id are valid
            try {
              const studentsInDeptQuery = query(
                usersRef,
                where("departmentId", "==", department.id),
                where("roleId", "==", studentRoleId)
              );
              const studentsInDeptSnap = await getDocs(studentsInDeptQuery);
              studentsInDeptCount = studentsInDeptSnap.size;
            } catch (studentError) {
              console.error(`Error fetching students for department ${department.name} (ID: ${department.id}):`, studentError);
            }
          }

          // Count staff in this department (excluding admins)
          let staffInDeptCount = 0;
          if (adminRoleId && department.id) { // Ensure adminRoleId and department.id are valid
            try {
              const staffInDeptQuery = query(
                usersRef,
                where("departmentId", "==", department.id)
              );
              const staffInDeptSnap = await getDocs(staffInDeptQuery);
              staffInDeptCount = staffInDeptSnap.size;
            } catch (staffError) {
              console.error(`Error fetching staff for department ${department.name} (ID: ${department.id}):`, staffError);
            }
          } else if (!adminRoleId && department.id) { // Fallback if admin role not found, count all users in department as staff
            try {
              const allUsersInDeptQuery = query(
                usersRef,
                where("departmentId", "==", department.id)
              );
              const allUsersInDeptSnap = await getDocs(allUsersInDeptQuery);
              staffInDeptCount = allUsersInDeptSnap.size;
            } catch (allUsersError) {
              console.error(`Error fetching all users for department ${department.name} (ID: ${department.id}):`, allUsersError);
            }
          }

          departmentData.push({
            id: department.id,
            name: department.name,
            students: studentsInDeptCount,
            staff: staffInDeptCount,
          });
        }
        setDepartmentStats(departmentData);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const columns = [
    {
      name: 'Department ID',
      selector: row => row.id,
      sortable: true,
    },
    {
      name: 'Department Name',
      selector: row => row.name,
      sortable: true,
    },
    {
      name: 'Total Students',
      selector: row => row.students,
      sortable: true,
    },
    {
      name: 'Total Staff',
      selector: row => row.staff,
      sortable: true,
    },
  ];

  // Chart options and series
  const chartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false // Hide toolbar for a cleaner look
      },
      zoom: {
        enabled: false // Disable zoom
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
        colors: {
          ranges: [{
            from: 0,
            to: 1000000, // A large enough number to cover all student counts
            color: '#4e73df' // A shade of blue similar to the example
          }]
        }
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: departmentStats.map(dept => dept.name),
      title: {
        text: 'Department',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#333'
        }
      },
      labels: {
        style: {
          fontSize: '12px',
          colors: '#555'
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      title: {
        text: 'Number of Students',
        style: {
          fontSize: '14px',
          fontWeight: 600,
          color: '#333'
        }
      },
      labels: {
        style: {
          fontSize: '12px',
          colors: '#555'
        }
      },
      grid: {
        show: true,
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: false // Hide vertical grid lines
          }
        },
        yaxis: {
          lines: {
            show: true // Show horizontal grid lines
          }
        }
      }
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " students"
        }
      }
    },
    grid: {
      show: true,
      xaxis: {
        lines: {
          show: false // Ensure no vertical grid lines from global grid settings
        }
      },
      yaxis: {
        lines: {
          show: true // Ensure horizontal grid lines from global grid settings
        }
      }
    }
  };

  const chartSeries = [{
    name: 'Students',
    data: departmentStats.map(dept => dept.students)
  }];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Total Staff (Users with roles other than Admin)
        const usersRef = collection(db, "Users");
        const rolesRef = collection(db, "Roles");
        const departmentsRef = collection(db, "Departments"); // Reference to departments collection

        const adminRoleQuery = query(rolesRef, where("name", "==", "Admin"));
        const adminRoleSnap = await getDocs(adminRoleQuery);
        const adminRoleId = adminRoleSnap.docs.length > 0 ? adminRoleSnap.docs[0].id : null;

        let staffCount = 0;
        if (adminRoleId) {
          const staffQuery = query(usersRef, where("roleId", "!=", adminRoleId));
          const staffSnap = await getDocs(staffQuery);
          staffCount = staffSnap.size;
        } else {
          const allUsersSnap = await getDocs(usersRef);
          staffCount = allUsersSnap.size; // If no admin role, count all users as staff for now
        }
        setTotalStaff(staffCount);

        // Fetch Pending Requests (Users with status 'pending' or 'unlisted')
        const pendingUsersQuery = query(usersRef, where("status", "==", "pending")); // Assuming a 'status' field
        const pendingUsersSnap = await getDocs(pendingUsersQuery);
        setPendingRequests(pendingUsersSnap.size);

        // Fetch Total Departments
        const departmentsSnap = await getDocs(departmentsRef);
        setTotalDepartments(departmentsSnap.size);

        // Fetch Total Batches
        const batchesSnap = await getDocs(collection(db, "Batches"));
        setTotalBatches(batchesSnap.size);

        // Fetch Total Students (assuming students are users with a specific role or status)
        const studentRoleQuery = query(rolesRef, where("name", "==", "Student"));
        const studentRoleSnap = await getDocs(studentRoleQuery);
        const studentRoleId = studentRoleSnap.docs.length > 0 ? studentRoleSnap.docs[0].id : null;

        let studentCount = 0;
        if (studentRoleId) {
          const studentsQuery = query(usersRef, where("roleId", "==", studentRoleId));
          const studentsSnap = await getDocs(studentsQuery);
          studentCount = studentsSnap.size;
        }
        setTotalStudents(studentCount);

        // Fetch Department-wise statistics
        const departmentData = [];
        for (const doc of departmentsSnap.docs) {
          const department = { id: doc.id, ...doc.data() };

          // Count students in this department
          let studentsInDeptCount = 0;
          if (studentRoleId && department.id) { // Ensure studentRoleId and department.id are valid
            try {
              const studentsInDeptQuery = query(
                usersRef,
                where("departmentId", "==", department.id),
                where("roleId", "==", studentRoleId)
              );
              const studentsInDeptSnap = await getDocs(studentsInDeptQuery);
              studentsInDeptCount = studentsInDeptSnap.size;
            } catch (studentError) {
              console.error(`Error fetching students for department ${department.name} (ID: ${department.id}):`, studentError);
            }
          }

          // Count staff in this department (excluding admins)
          let staffInDeptCount = 0;
          if (adminRoleId && department.id) { // Ensure adminRoleId and department.id are valid
            try {
              const staffInDeptQuery = query(
                usersRef,
                where("departmentId", "==", department.id)
              );
              const staffInDeptSnap = await getDocs(staffInDeptQuery);
              staffInDeptCount = staffInDeptSnap.size;
            } catch (staffError) {
              console.error(`Error fetching staff for department ${department.name} (ID: ${department.id}):`, staffError);
            }
          } else if (!adminRoleId && department.id) { // Fallback if admin role not found, count all users in department as staff
            try {
              const allUsersInDeptQuery = query(
                usersRef,
                where("departmentId", "==", department.id)
              );
              const allUsersInDeptSnap = await getDocs(allUsersInDeptQuery);
              staffInDeptCount = allUsersInDeptSnap.size;
            } catch (allUsersError) {
              console.error(`Error fetching all users for department ${department.name} (ID: ${department.id}):`, allUsersError);
            }
          }

          departmentData.push({
            id: department.id,
            name: department.name,
            students: studentsInDeptCount,
            staff: staffInDeptCount,
          });
        }
        setDepartmentStats(departmentData);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="admin-dashboard">
      {loading ? (
        <CustomLoader size={'80px'} />
      ) : (
        <Row className="g-3">
          <Col md={12}>
            <Card>
              <Card.Body>
                <div className="row row-cols-xxxl-5 row-cols-lg-3 row-cols-sm-2 row-cols-1 g-3">
                  <div className="col">
                    <div className="card shadow-none border bg-gradient-start-1">
                      <div className="card-body p-20">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                          <div>
                            <p className="fw-medium text-primary-light mb-1">
                              Total Staff
                            </p>
                            <h6 className="mb-0">{totalStaff}</h6>
                          </div>
                          <div className="w-50-px h-50-px bg-cyan rounded-circle d-flex justify-content-center align-items-center">
                            <Icon
                              icon="gridicons:multiple-users"
                              className="text-base text-2xl mb-0"
                            />
                          </div>
                        </div>
                        <p className="fw-medium text-sm text-primary-light mt-12 mb-0">
                          <span className="text-success-main">
                            <Icon icon="bxs:up-arrow" className="text-xs d-block" />
                            +5000
                          </span>
                          {" "} Last 30 days users
                        </p>
                      </div>
                    </div>
                    {/* card end */}
                  </div>
                  <div className="col">
                    <div className="card shadow-none border bg-gradient-start-2">
                      <div className="card-body p-20">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                          <div>
                            <p className="fw-medium text-primary-light mb-1">
                              Pending Requests
                            </p>
                            <h6 className="mb-0">{pendingRequests}</h6>
                          </div>
                          <div className="w-50-px h-50-px bg-purple rounded-circle d-flex justify-content-center align-items-center">
                            <Icon
                              icon="fa-solid:award"
                              className="text-base text-2xl mb-0"
                            />
                          </div>
                        </div>
                        <p className="fw-medium text-sm text-primary-light mt-12 mb-0">
                          <span className="text-danger-main">
                            <Icon icon="bxs:down-arrow" className="text-xs d-block" />
                            -800
                          </span>
                          {" "} Last 30 days subscription
                        </p>
                      </div>
                    </div>
                    {/* card end */}
                  </div>
                  <div className="col">
                    <div className="card shadow-none border bg-gradient-start-3">
                      <div className="card-body p-20">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                          <div>
                            <p className="fw-medium text-primary-light mb-1">
                              Departments
                            </p>
                            <h6 className="mb-0">{totalDepartments}</h6>
                          </div>
                          <div className="w-50-px h-50-px bg-info rounded-circle d-flex justify-content-center align-items-center">
                            <Icon
                              icon="fluent:people-20-filled"
                              className="text-base text-2xl mb-0"
                            />
                          </div>
                        </div>
                        <p className="fw-medium text-sm text-primary-light mt-12 mb-0">
                          <span className="text-success-main">
                            <Icon icon="bxs:up-arrow" className="text-xs d-block" />
                            +200
                          </span>
                          {" "} Last 30 days users
                        </p>
                      </div>
                    </div>
                    {/* card end */}
                  </div>
                  <div className="col">
                    <div className="card shadow-none border bg-gradient-start-4">
                      <div className="card-body p-20">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                          <div>
                            <p className="fw-medium text-primary-light mb-1">
                              Total Batches
                            </p>
                            <h6 className="mb-0">{totalBatches}</h6>
                          </div>
                          <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                            <Icon
                              icon="solar:wallet-bold"
                              className="text-base text-2xl mb-0"
                            />
                          </div>
                        </div>
                        <p className="fw-medium text-sm text-primary-light mt-12 mb-0">
                          <span className="text-success-main">
                            <Icon icon="bxs:up-arrow" className="text-xs d-block" />
                            +$20,000
                          </span>
                          {" "} Last 30 days income
                        </p>
                      </div>
                    </div>
                    {/* card end */}
                  </div>
                  <div className="col">
                    <div className="card shadow-none border bg-gradient-start-5">
                      <div className="card-body p-20">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                          <div>
                            <p className="fw-medium text-primary-light mb-1">
                              Total Students
                            </p>
                            <h6 className="mb-0">{totalStudents}</h6>
                          </div>
                          <div className="w-50-px h-50-px bg-red rounded-circle d-flex justify-content-center align-items-center">
                            <Icon
                              icon="fa6-solid:file-invoice-dollar"
                              className="text-base text-2xl mb-0"
                            />
                          </div>
                        </div>
                        <p className="fw-medium text-sm text-primary-light mt-12 mb-0">
                          <span className="text-success-main">
                            <Icon icon="bxs:up-arrow" className="text-xs d-block" />
                            +$5,000
                          </span>
                          {" "} Last 30 days expense
                        </p>
                      </div>
                    </div>
                    {/* card end */}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          {/* Placeholder for Graphs */}
          <Col md={12}>
            <Card className="p-3">
              <Card.Body>
                <Card.Title>Total Students per Department</Card.Title>
                <Chart
                  options={chartOptions}
                  series={chartSeries}
                  type="bar"
                  height={350}
                />
              </Card.Body>
            </Card>
          </Col>
          {/* Department-wise Statistics Table */}
          <Col md={12}>
            <Card className="p-3">
              <Card.Body>
                <Card.Title>Department Statistics</Card.Title>
                <DataTable
                  columns={columns}
                  data={departmentStats}
                  pagination
                  highlightOnHover
                  pointerOnHover
                  noDataComponent={<NoDataTable />}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default AdminDashboardLayer;
