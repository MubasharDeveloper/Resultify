import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button, Modal, Form, Card, Row, Col } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import Select from 'react-select';
import { db, collection, getDocs, getDoc, addDoc, Timestamp, query, where, doc, deleteDoc, updateDoc } from '../../Firebase_config';
import { toast, Slide } from 'react-toastify';
import Swal from 'sweetalert2';
import { CustomLoader, BodyLoading } from '../CustomLoader';
import NoDataTable from '../NoDataTable';
import { useAuth } from "../../context/AuthContext";

const Semesters = () => {
  const { user } = useAuth();

  const [semesters, setSemesters] = useState([]);
  const [filteredSemesters, setFilteredSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const currentYear = new Date().getFullYear();
  const [hasChanges, setHasChanges] = useState(false);

  const [newSemester, setNewSemester] = useState({
    name: '',
    batchId: '',
    startDate: '',
    endDate: '',
    subjectIds: [],
  });

  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [batches, setBatches] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  const [detailModalShow, setDetailModalShow] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semesterSubjects, setSemesterSubjects] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Update semester states
  const [editSemester, setEditSemester] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editAvailableSubjects, setEditAvailableSubjects] = useState([]);

  const handleModalClose = () => {
    if (hasChanges) {
      Swal.fire({
        title: 'Discard Changes?',
        text: 'You have unsaved changes. Are you sure you want to close?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, discard!',
        cancelButtonText: "No, keep it open",
      }).then((result) => {
        if (result.isConfirmed) {
          resetModal();
        }
      });
    } else {
      resetModal();
    }
  };

  const handleEditModalClose = () => {
    if (hasChanges) {
      Swal.fire({
        title: 'Discard Changes?',
        text: 'You have unsaved changes. Are you sure you want to close?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, discard!',
        cancelButtonText: "No, keep it open",
      }).then((result) => {
        if (result.isConfirmed) {
          resetEditModal();
        }
      });
    } else {
      resetEditModal();
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setErrors({});
    setNewSemester({
      name: '',
      batchId: '',
      startDate: '',
      endDate: '',
      subjectIds: [],
    });
    setAvailableSubjects([]);
    setHasChanges(false);
  };

  const resetEditModal = () => {
    setShowEditModal(false);
    setEditSemester(null);
    setErrors({});
    setEditAvailableSubjects([]);
    setHasChanges(false);
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return '-';

    if (dateInput.toDate) {
      const date = dateInput.toDate();
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }

    if (dateInput instanceof Date) {
      const date = dateInput.toDate();
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }

    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }

    return '-';
  };

  const sortSemesters = (semesters) => {
    return [...semesters].sort((a, b) => {

      // If dates are equal, sort by semester number
      const semesterA = parseInt(a.name.split(' ')[1]);
      const semesterB = parseInt(b.name.split(' ')[1]);
      return semesterA - semesterB; // Lower semester numbers first
    });
  };

  const fetchSemestersData = async () => {
    try {
      if (!user?.departmentId) return;

      const deptSnap = await getDoc(doc(db, "Departments", user.departmentId));
      let department = deptSnap.exists() ? { id: deptSnap.id, ...deptSnap.data() } : null;

      const semestersQuery = query(
        collection(db, "Semesters"),
        where("departmentId", "==", user.departmentId)
      );
      const semSnap = await getDocs(semestersQuery);

      const semestersList = await Promise.all(
        semSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();

          let batchName = "Unknown";
          let batchStart;
          let batchEnd;
          if (data.batchId) {
            const batchSnap = await getDoc(doc(db, "Batches", data.batchId));
            if (batchSnap.exists()) {
              const batchData = batchSnap.data();
              batchName = batchData.name;
              batchStart = batchData.startYear;
              batchEnd = batchData.endYear;
            }
          }

          return {
            id: docSnap.id,
            ...data,
            departmentName: department?.name || "Unknown",
            batchName,
            batchStart,
            batchEnd,
          };
        })
      );

      // Sort the semesters before setting state
      const sortedSemesters = sortSemesters(semestersList);
      setSemesters(sortedSemesters);
      setFilteredSemesters(sortedSemesters);
    } catch (error) {
      console.error("Error fetching semesters:", error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        if (!user?.departmentId) return;

        const deptSnap = await getDoc(doc(db, "Departments", user.departmentId));
        let department = deptSnap.exists() ? { id: deptSnap.id, ...deptSnap.data() } : null;

        const semestersQuery = query(
          collection(db, "Semesters"),
          where("departmentId", "==", user.departmentId)
        );
        const semSnap = await getDocs(semestersQuery);

        const semestersList = await Promise.all(
          semSnap.docs.map(async (docSnap) => {
            const data = docSnap.data();

            let batchName = "Unknown";
            let batchStart;
            let batchEnd;
            if (data.batchId) {
              const batchSnap = await getDoc(doc(db, "Batches", data.batchId));
              if (batchSnap.exists()) {
                const batchData = batchSnap.data();
                batchName = batchData.name;
                batchStart = batchData.startYear;
                batchEnd = batchData.endYear;
              }
            }

            return {
              id: docSnap.id,
              ...data,
              departmentName: department?.name || "Unknown",
              batchName,
              batchStart,
              batchEnd,
            };
          })
        );

        // Sort the semesters before setting state
        const sortedSemesters = sortSemesters(semestersList);
        setSemesters(sortedSemesters);
        setFilteredSemesters(sortedSemesters);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    const fetchBatchesAndSubjects = async () => {
      try {
        if (!user?.departmentId) return;

        const batchSnapshot = await getDocs(
          query(collection(db, "Batches"), where("departmentId", "==", user.departmentId))
        );
        const subjectSnapshot = await getDocs(
          query(collection(db, "Subjects"), where("departmentId", "==", user.departmentId))
        );

        const fetchedBatches = batchSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          ...doc.data()
        }));

        const fetchedSubjects = subjectSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          label: `(${doc.data().subCode}) ${doc.data().name}`,
          value: doc.id
        }));

        setBatches(fetchedBatches);
        setAllSubjects(fetchedSubjects);
      } catch (err) {
        console.error("Error fetching batches or subjects:", err);
        toast.error("Failed to fetch batches or subjects");
      }
    };

    fetchBatchesAndSubjects();
    fetchInitialData();
  }, [user?.departmentId]);

  useEffect(() => {
    const fetchAvailableSubjects = async () => {
      if (!newSemester.batchId) {
        setAvailableSubjects([]);
        return;
      }

      try {
        const batchSemestersQuery = query(
          collection(db, "Semesters"),
          where("batchId", "==", newSemester.batchId)
        );
        const semestersSnap = await getDocs(batchSemestersQuery);

        const usedSubjectIds = [];
        semestersSnap.forEach(doc => {
          const semester = doc.data();
          if (semester.subjectIds) {
            usedSubjectIds.push(...semester.subjectIds);
          }
        });

        const available = allSubjects.filter(
          subject => !usedSubjectIds.includes(subject.id)
        );

        setAvailableSubjects(available);
      } catch (error) {
        console.error("Error fetching available subjects:", error);
        toast.error("Failed to fetch available subjects");
      }
    };

    fetchAvailableSubjects();
  }, [newSemester.batchId, allSubjects]);

  useEffect(() => {
    const fetchEditAvailableSubjects = async () => {
      if (!editSemester?.batchId) {
        setEditAvailableSubjects([]);
        return;
      }

      try {
        const batchSemestersQuery = query(
          collection(db, "Semesters"),
          where("batchId", "==", editSemester.batchId)
        );
        const semestersSnap = await getDocs(batchSemestersQuery);

        const usedSubjectIds = [];
        semestersSnap.forEach(doc => {
          const semester = doc.data();
          if (semester.subjectIds && doc.id !== editSemester.id) {
            usedSubjectIds.push(...semester.subjectIds);
          }
        });

        const available = allSubjects.filter(
          subject => !usedSubjectIds.includes(subject.id) ||
            editSemester.subjectIds.includes(subject.id)
        );

        setEditAvailableSubjects(available);
      } catch (error) {
        console.error("Error fetching available subjects for edit:", error);
        toast.error("Failed to fetch available subjects");
      }
    };

    if (editSemester) {
      fetchEditAvailableSubjects();
    }
  }, [editSemester?.batchId, allSubjects, editSemester?.id, editSemester?.subjectIds]);

  useEffect(() => {
    if (!searchText) {
      setFilteredSemesters(sortSemesters(semesters));
    } else {
      const lowerSearch = searchText.toLowerCase();
      const filtered = semesters.filter((sem) => {
        const nameMatch = sem.name?.toLowerCase().includes(lowerSearch);
        const batchMatch = sem.batchName?.toLowerCase().includes(lowerSearch);
        const deptMatch = sem.departmentName?.toLowerCase().includes(lowerSearch);
        const startMatch = formatDate(sem.startDate).toLowerCase().includes(lowerSearch);
        const endMatch = formatDate(sem.endDate).toLowerCase().includes(lowerSearch);

        return (
          nameMatch ||
          batchMatch ||
          deptMatch ||
          startMatch ||
          endMatch
        );
      });

      setFilteredSemesters(sortSemesters(filtered));
    }
  }, [searchText, semesters]);

  const handleInputChange = (field, value) => {
    setNewSemester(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    setHasChanges(true);
  };

  const handleEditInputChange = (field, value) => {
    setEditSemester(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    setHasChanges(true);
  };

  const handleSubjectChange = (selectedOptions) => {
    const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
    handleInputChange('subjectIds', selectedIds);
  };

  const handleEditSubjectChange = (selectedOptions) => {
    const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
    handleEditInputChange('subjectIds', selectedIds);
  };

  const validateForm = (semesterData, isEdit = false) => {
    let isValid = true;
    const newErrors = {};

    if (!semesterData.batchId) {
      newErrors.batchId = "Batch is required";
      isValid = false;
    }

    if (!semesterData.name) {
      newErrors.name = "Semester name is required";
      isValid = false;
    }

    if (!semesterData.startDate) {
      newErrors.startDate = "Start date is required";
      isValid = false;
    }

    if (!semesterData.endDate) {
      newErrors.endDate = "End date is required";
      isValid = false;
    } else {
      const startDate = new Date(semesterData.startDate);
      const endDate = new Date(semesterData.endDate);

      if (endDate <= startDate) {
        newErrors.endDate = "End date must be after start date";
        isValid = false;
      } else {
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth());

        if (monthsDiff < 4) {
          newErrors.endDate = "Semester must be at least 4 months long";
          isValid = false;
        }
      }
    }

    if (semesterData.subjectIds.length === 0) {
      newErrors.subjectIds = "Please assign at least one subject";
      isValid = false;
    }

    if (!isEdit) {
      const duplicateSemester = semesters.find(
        s =>
          s.batchId === semesterData.batchId &&
          s.departmentId === user.departmentId &&
          s.name === semesterData.name
      );
      if (duplicateSemester) {
        newErrors.name = "Semester with this name already exists in selected batch";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCreateSemester = async () => {
    if (!validateForm(newSemester)) return;

    try {
      setCreating(true);

      const newSemesterData = {
        ...newSemester,
        departmentId: user.departmentId,
        startDate: Timestamp.fromDate(new Date(newSemester.startDate)),
        endDate: Timestamp.fromDate(new Date(newSemester.endDate)),
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "Semesters"), newSemesterData);

      toast.success("Semester created successfully!");
      resetModal();
      fetchSemestersData();
    } catch (error) {
      console.error("Error creating semester:", error);
      toast.error("Something went wrong!");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSemester = async () => {
    if (!validateForm(editSemester, true)) return;

    try {
      setUpdating(true);

      const updatedSemesterData = {
        ...editSemester,
        startDate: Timestamp.fromDate(new Date(editSemester.startDate)),
        endDate: Timestamp.fromDate(new Date(editSemester.endDate)),
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, "Semesters", editSemester.id), updatedSemesterData);

      toast.success("Semester updated successfully!");
      resetEditModal();
      fetchSemestersData();
    } catch (error) {
      console.error("Error updating semester:", error);
      toast.error("Something went wrong!");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSemester = async (id) => {
    const confirmResult = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
    });

    if (confirmResult.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'Semesters', id));
        toast.success("Semester deleted successfully!", { transition: Slide });
        setSemesters(prev => prev.filter(sem => sem.id !== id));
        setFilteredSemesters(prev => prev.filter(sem => sem.id !== id));
      } catch (error) {
        console.error("Error deleting semester:", error);
        toast.error("Failed to delete semester!");
      }
    }
  };

  const handleDetailView = async (semester) => {
    setIsLoadingDetails(true);
    setSelectedSemester(null);
    setSemesterSubjects([]);

    try {
      const subjectsList = [];
      for (const subjectId of semester.subjectIds) {
        const subjectDoc = await getDoc(doc(db, "Subjects", subjectId));
        if (subjectDoc.exists()) {
          subjectsList.push({
            id: subjectDoc.id,
            ...subjectDoc.data()
          });
        }
      }

      setSelectedSemester(semester);
      setSemesterSubjects(subjectsList);
      setDetailModalShow(true);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleEditView = async (semester) => {
    try {
      setLoading(true);

      const startDate = semester.startDate.toDate().toISOString().slice(0, 16);
      const endDate = semester.endDate.toDate().toISOString().slice(0, 16);

      setEditSemester({
        ...semester,
        startDate,
        endDate,
      });

      setShowEditModal(true);
    } catch (error) {
      console.error("Error preparing edit form:", error);
      toast.error("Failed to load semester data");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setDetailModalShow(false);
    setSelectedSemester(null);
    setSemesterSubjects([]);
    setIsLoadingDetails(false);
  };

  const columns = [
    {
      name: "#",
      selector: (_, index) => index + 1,
      width: "60px",
    },
    {
      name: "Semester #",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Start Date",
      selector: (row) => formatDate(row.startDate),
      sortable: true,
    },
    {
      name: "End Date",
      selector: (row) => formatDate(row.endDate),
      sortable: true,
    },
    {
      name: "Status",
      selector: (row) => {
        const currentDate = new Date();
        const startDate = row.startDate.toDate();
        const endDate = row.endDate.toDate();

        if (currentDate >= startDate && currentDate <= endDate) {
          return (
            <span className="bg-success-focus text-success-main border-success-main border px-8 py-2 radius-4 fw-medium text-sm">
              Current
            </span>
          );
        } else if (currentDate < startDate) {
          return (
            <span className="bg-warning-focus text-warning-main border-warning-main border px-8 py-2 radius-4 fw-medium text-sm">
              Upcoming
            </span>
          );
        } else {
          return (
            <span className="bg-danger-focus text-danger-main border-danger-main border px-8 py-2 radius-4 fw-medium text-sm">
              OutGoing
            </span>
          );
        }
      },
      sortable: false,
    },
    {
      name: "Department",
      selector: (row) => row.departmentName,
      sortable: true,
    },
    {
      name: "Batch",
      selector: (row) => (
        <span
          className={`${currentYear >= row.batchStart && currentYear <= row.batchEnd
            ? 'bg-success-focus text-success-main border-success-main'
            : 'bg-danger-focus text-danger-main border-danger-main'
            } border px-8 py-2 radius-4 fw-medium text-sm`
          }
        >
          {row.batchName}
        </span>
      ),
      sortable: true,
    },
    {
      name: 'Action',
      cell: row => (
        <div className="d-flex">
          <Button
            variant={'warning'}
            className="w-32-px h-32-px me-8 bg-warning-focus text-warning-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-warning-600 p-2"
            onClick={() => handleDetailView(row)}
          >
            <Icon icon="solar:document-text-outline" />
          </Button>
          <Button
            variant={'success'}
            className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-success-600 p-2"
            onClick={() => handleEditView(row)}
          >
            <Icon icon="lucide:edit" />
          </Button>
          {/* <Button
            variant="danger"
            className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-danger-600 p-2"
            onClick={() => handleDeleteSemester(row.id)}
          >
            <Icon icon="mingcute:delete-2-line" />
          </Button> */}
        </div>
      ),
    },
  ];


  const groupSemestersByBatch = (semesters) => {
    const sortedSemesters = sortSemesters(semesters);

    const grouped = sortedSemesters.reduce((acc, semester) => {
      const batchId = semester.batchId;
      if (!acc[batchId]) {
        acc[batchId] = {
          batchName: semester.batchName,
          batchStart: semester.batchStart,
          batchEnd: semester.batchEnd,
          departmentName: semester.departmentName,
          semesters: []
        };
      }
      acc[batchId].semesters.push(semester);
      return acc;
    }, {});

    // Convert to array and sort batches by their earliest semester's start date
    return Object.entries(grouped)
      .map(([batchId, batchData]) => ({
        batchId,
        ...batchData,
        earliestStart: batchData.semesters.reduce((min, sem) => {
          const date = sem.startDate.toDate ? sem.startDate.toDate() : new Date(sem.startDate);
          return date < min ? date : min;
        }, new Date())
      }))
      .sort((a, b) => b.earliestStart - a.earliestStart); // Newest batches first
  };



  return (
    <>
      <Card className="basic-data-table py-3">
        <Card.Body>
          {loading ? (
            <CustomLoader size={'80px'} />
          ) : (
            <>
              <div className="d-flex justify-content-end align-items-center mb-4">
                <div className="d-flex gap-3 align-items-center">
                  <Form.Control
                    type="text"
                    placeholder="Search Semesters..."
                    className="table-search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <Button variant="primary" size='sm' className='btn-primary-custom' onClick={() => setShowModal(true)}>
                    <Icon icon='tabler:plus' />
                    Add Semester
                  </Button>
                </div>
              </div>

              {Object.entries(groupSemestersByBatch(filteredSemesters)).map(([batchId, batchData]) => (
                <div key={batchId} className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 h6 d-flex align-items-center gap-2" style={{ fontSize: '18px' }}>
                      {`${batchData.departmentName} - ${batchData.batchName}  `}
                      <span className={`border px-8 py-2 radius-4 fw-medium text-md ${currentYear >= batchData.batchStart && currentYear <= batchData.batchEnd
                        ? 'bg-success-focus text-success-main border-success-main'
                        : 'bg-danger-focus text-danger-main border-danger-main'
                        }`}>
                        {currentYear >= batchData.batchStart && currentYear <= batchData.batchEnd
                          ? 'Current'
                          : 'Inactive'}
                      </span>
                    </h6>
                    <small className="text-muted">
                      {`Session: ${batchData.batchStart} - ${batchData.batchEnd}`}
                    </small>
                  </div>
                  <DataTable
                    columns={columns}
                    data={batchData.semesters}
                    pagination
                    paginationPerPage={15}
                    highlightOnHover
                    responsive
                    fixedHeader
                    striped
                    noDataComponent={
                      <NoDataTable
                        img={'../assets/images/no-data.svg'}
                        text={'No Semesters Found!'}
                      />
                    }
                  />
                </div>
              ))}

              {filteredSemesters.length === 0 && (
                <NoDataTable
                  img={'../assets/images/no-data.svg'}
                  text={'No Semesters Found!'}
                />
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Create Semester Modal */}
      <Modal show={showModal} onHide={handleModalClose} centered size="lg">
        <Modal.Body>
          <div className="margin-bottom-15">
            <div className="d-flex justify-content-between">
              <h5 className="margin-bottom-10 mt-3 modal-heading">{`Create Semester`}</h5>
              <Icon icon="ci:close-circle" color='#dc3545' className={`cursor-pointer`} style={{ fontSize: '24px' }} onClick={handleModalClose} />
            </div>
          </div>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Batch</Form.Label>
                  <Form.Select
                    value={newSemester.batchId}
                    onChange={(e) => {
                      handleInputChange('batchId', e.target.value);
                      handleInputChange('subjectIds', []);
                    }}
                    className={errors.batchId ? 'error-field' : ''}
                  >
                    <option value="">Select Batch</option>
                    {batches.map(batch => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.batchId && <span className="error-message">{errors.batchId}</span>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Semester Name</Form.Label>
                  <Form.Select
                    value={newSemester.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'error-field' : ''}
                  >
                    <option value="">Select Semester</option>
                    {[...Array(8)].map((_, i) => (
                      <option key={i} value={`Semester ${i + 1}`}>
                        Semester {i + 1}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={newSemester.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className={errors.startDate ? 'error-field' : ''}
                  />
                  {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={newSemester.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className={errors.endDate ? 'error-field' : ''}
                    min={newSemester.startDate ?
                      new Date(new Date(newSemester.startDate).getTime() + (5 * 30 * 24 * 60 * 60 * 1000))
                        .toISOString().slice(0, 16) : ''}
                  />
                  {errors.endDate && <span className="error-message">{errors.endDate}</span>}
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Assign Subjects</Form.Label>
                  <div className={errors.subjectIds ? 'error-field' : ''}>
                    <Select
                      isMulti
                      options={availableSubjects}
                      value={availableSubjects.filter(subject =>
                        newSemester.subjectIds.includes(subject.value)
                      )}
                      onChange={handleSubjectChange}
                      placeholder={
                        !newSemester.batchId ? "Select batch first" :
                          availableSubjects.length === 0 ? "No subjects available" :
                            "Select subjects..."
                      }
                      className="basic-multi-select"
                      classNamePrefix="select"
                      isDisabled={!newSemester.batchId || availableSubjects.length === 0}
                    />
                  </div>
                  {errors.subjectIds && <span className="error-message">{errors.subjectIds}</span>}
                  {newSemester.batchId && availableSubjects.length === 0 && (
                    <small className="text-muted">No subjects available for this batch</small>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" className='px-24' onClick={handleModalClose}>
                Cancel
              </Button>
              <Button variant="primary" className='px-24' onClick={handleCreateSemester} disabled={creating}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Semester Modal */}
      <Modal show={showEditModal} onHide={handleEditModalClose} centered size="lg">
        <Modal.Body>
          <div className="margin-bottom-15">
            <div className="d-flex justify-content-between">
              <h5 className="margin-bottom-10 mt-3 modal-heading">{`Edit Semester`}</h5>
              <Icon icon="ci:close-circle" color='#dc3545' className={`cursor-pointer`} style={{ fontSize: '24px' }} onClick={handleEditModalClose} />
            </div>
          </div>
          {editSemester && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Batch</Form.Label>
                    <Form.Select
                      value={editSemester.batchId}
                      onChange={(e) => {
                        handleEditInputChange('batchId', e.target.value);
                        handleEditInputChange('subjectIds', []);
                      }}
                      className={errors.batchId ? 'error-field' : ''}
                    >
                      <option value="">Select Batch</option>
                      {batches.map(batch => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name}
                        </option>
                      ))}
                    </Form.Select>
                    {errors.batchId && <span className="error-message">{errors.batchId}</span>}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Semester Name</Form.Label>
                    <Form.Select
                      value={editSemester.name}
                      onChange={(e) => handleEditInputChange('name', e.target.value)}
                      className={errors.name ? 'error-field' : ''}
                    >
                      <option value="">Select Semester</option>
                      {[...Array(8)].map((_, i) => (
                        <option key={i} value={`Semester ${i + 1}`}>
                          Semester {i + 1}
                        </option>
                      ))}
                    </Form.Select>
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={editSemester.startDate}
                      onChange={(e) => handleEditInputChange('startDate', e.target.value)}
                      className={errors.startDate ? 'error-field' : ''}
                    />
                    {errors.startDate && <span className="error-message">{errors.startDate}</span>}
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="datetime-local"
                      value={editSemester.endDate}
                      onChange={(e) => handleEditInputChange('endDate', e.target.value)}
                      className={errors.endDate ? 'error-field' : ''}
                      min={editSemester.startDate ?
                        new Date(new Date(editSemester.startDate).getTime() + (5 * 30 * 24 * 60 * 60 * 1000))
                          .toISOString().slice(0, 16) : ''}
                    />
                    {errors.endDate && <span className="error-message">{errors.endDate}</span>}
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>Assign Subjects</Form.Label>
                    <div className={errors.subjectIds ? 'error-field' : ''}>
                      <Select
                        isMulti
                        options={editAvailableSubjects}
                        value={editAvailableSubjects.filter(subject =>
                          editSemester.subjectIds.includes(subject.value)
                        )}
                        onChange={handleEditSubjectChange}
                        placeholder={
                          !editSemester.batchId ? "Select batch first" :
                            editAvailableSubjects.length === 0 ? "No subjects available" :
                              "Select subjects..."
                        }
                        className="basic-multi-select"
                        classNamePrefix="select"
                        isDisabled={!editSemester.batchId || editAvailableSubjects.length === 0}
                      />
                    </div>
                    {errors.subjectIds && <span className="error-message">{errors.subjectIds}</span>}
                    {editSemester.batchId && editAvailableSubjects.length === 0 && (
                      <small className="text-muted">No subjects available for this batch</small>
                    )}
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" className='px-24' onClick={handleEditModalClose}>
                  Cancel
                </Button>
                <Button variant="primary" className='px-24' onClick={handleUpdateSemester} disabled={updating}>
                  {updating ? "Updating..." : "Update"}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {isLoadingDetails ? (<BodyLoading />) : (
        <Modal show={detailModalShow} onHide={handleCloseModal} size="lg" centered>
          <Modal.Body>
            {selectedSemester && (
              <>
                {/* Header section remains the same */}
                <div className="margin-bottom-15">
                  <div className="d-flex justify-content-between">
                    <h5 className="margin-bottom-10 mt-3 modal-heading">
                      {`Department of ${selectedSemester.departmentName}`}
                    </h5>
                    <Icon
                      icon="ci:close-circle"
                      color='#dc3545'
                      className="cursor-pointer"
                      style={{ fontSize: '24px' }}
                      onClick={handleCloseModal}
                    />
                  </div>
                  <div className="d-flex justify-content-center">
                    <h5 className="margin-bottom-25 modal-heading">Road Map</h5>
                  </div>
                  <div className="d-flex justify-content-between">
                    <h5 className="margin-bottom-10 modal-sub-heading">
                      {`${selectedSemester.departmentName} Session ${selectedSemester.batchName}`}
                    </h5>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between">
                    <h5 className="margin-bottom-10 modal-sub-heading">
                      {selectedSemester.name}
                    </h5>
                    <h5 className="margin-bottom-10 modal-sub-heading">
                      {`(${formatDate(selectedSemester.startDate)} - ${formatDate(selectedSemester.endDate)})`}
                    </h5>
                  </div>
                  {semesterSubjects?.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table vertical-striped-table mb-0">
                        <thead>
                          <tr>
                            <th scope="col">Code</th>
                            <th scope="col">Name</th>
                            <th scope="col">Credit Hours</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semesterSubjects?.map((subject, index) => (
                            <tr key={subject.id}>
                              <td><h6 className="text-md mb-0 fw-normal">{subject.subCode}</h6></td>
                              <td>{subject.name}</td>
                              <td>{`${subject.creditHours} (${subject.theory}-${subject.practical})` || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <NoDataTable
                      img={'../assets/images/no-data.svg'}
                      text={'No Semesters Found!'}
                    />
                  )}
                </div>
              </>
            )}
          </Modal.Body>
        </Modal>
      )}
    </>
  );
};

export default Semesters;