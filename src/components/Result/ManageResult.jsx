import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Table, Form, Spinner } from 'react-bootstrap';
import { Icon } from '@iconify/react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MasterLayout from '../../masterLayout/MasterLayout';
import Breadcrumb from '../Breadcrumb';
import { useAuth } from "../../context/AuthContext";
import { db, collection, query, where, getDocs, doc, getDoc, setDoc } from '../../Firebase_config';
import DataTable from 'react-data-table-component';
import NoDataTable from '../NoDataTable';
import { CustomLoader } from '../CustomLoader';

const ManageResults = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { lecture } = location.state || {};

    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [subjectDetails, setSubjectDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [results, setResults] = useState({});
    const [editingStudent, setEditingStudent] = useState(null);
    const studentsPerPage = 15;

    useEffect(() => {
        if (!lecture) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch subject details
                const subjectRef = doc(db, "Subjects", lecture.subjectId);
                const subjectSnap = await getDoc(subjectRef);
                if (subjectSnap.exists()) {
                    const subjectData = subjectSnap.data();

                    console.log(subjectData)
                    
                    // Calculate marks distribution
                    const theoryMarks = subjectData.theory * 20;
                    const practicalMarks = subjectData.practical ? subjectData.practical * 20 : 0;
                    const totalMarks = theoryMarks + practicalMarks;
                    
                    setSubjectDetails({
                        ...subjectData,
                        theoryMarks,
                        practicalMarks,
                        totalMarks
                    });
                }

                // Fetch students
                const studentsQuery = query(
                    collection(db, "Students"),
                    where("departmentId", "==", user.departmentId),
                    where("batchId", "==", lecture.batchId),
                    where("batchTime", "==", lecture.sessionType)
                );

                const studentsSnap = await getDocs(studentsQuery);
                let studentsData = studentsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Filter active students and sort by roll number
                studentsData = studentsData
                    .filter(student => student.status === "active")
                    .sort((a, b) => {
                        const rollNoA = parseInt(a.rollNumber || '0', 10);
                        const rollNoB = parseInt(b.rollNumber || '0', 10);
                        return rollNoA - rollNoB;
                    });

                setStudents(studentsData);
                setFilteredStudents(studentsData);

                // Fetch existing results and initialize state
                const resultsQuery = query(
                    collection(db, "Results"),
                    where("subjectId", "==", lecture.subjectId),
                    where("batchId", "==", lecture.batchId)
                );

                const resultsSnap = await getDocs(resultsQuery);
                const existingResults = {};
                resultsSnap.forEach(doc => {
                    const data = doc.data();
                    existingResults[data.studentId] = {
                        presentationMarks: data.presentationMarks || 0,
                        midMarks: data.midMarks || 0,
                        finalMarks: data.finalMarks || 0,
                        practicalMarks: data.practicalMarks || 0,
                        totalObtained: data.totalObtained || 0,
                        percentage: data.percentage || 0,
                        grade: data.grade || '',
                        exists: true
                    };
                });

                // Initialize results state
                const initialResults = {};
                studentsData.forEach(student => {
                    initialResults[student.id] = existingResults[student.id] || {
                        presentationMarks: 0,
                        midMarks: 0,
                        finalMarks: 0,
                        practicalMarks: 0,
                        totalObtained: 0,
                        percentage: 0,
                        grade: '',
                        exists: false
                    };
                });

                setResults(initialResults);

            } catch (err) {
                console.error("Error fetching data:", err);
                toast.error("Failed to load data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [lecture, user.departmentId]);

    const handleMarksChange = (studentId, field, value) => {
        const numericValue = parseFloat(value) || 0;

        let maxLimit = 0;
        if (field === 'presentationMarks') maxLimit = subjectDetails.theoryMarks * 0.2;
        else if (field === 'midMarks') maxLimit = subjectDetails.theoryMarks * 0.2;
        else if (field === 'finalMarks') maxLimit = subjectDetails.theoryMarks * 0.6;
        else if (field === 'practicalMarks') maxLimit = subjectDetails.practicalMarks;

        if (numericValue < 0 || numericValue > maxLimit) return;

        setResults(prev => {
            const totalObtained = 
                (field === 'presentationMarks' ? numericValue : prev[studentId].presentationMarks || 0) +
                (field === 'midMarks' ? numericValue : prev[studentId].midMarks || 0) +
                (field === 'finalMarks' ? numericValue : prev[studentId].finalMarks || 0) +
                (field === 'practicalMarks' ? numericValue : prev[studentId].practicalMarks || 0);

            const percentage = (totalObtained / subjectDetails.totalMarks) * 100;
            const grade = calculateGrade(percentage);

            return {
                ...prev,
                [studentId]: {
                    ...prev[studentId],
                    [field]: numericValue,
                    totalObtained,
                    percentage,
                    grade
                }
            };
        });
    };

    const calculateGrade = (percentage) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 85) return 'A';
        if (percentage >= 80) return 'A-';
        if (percentage >= 75) return 'B+';
        if (percentage >= 70) return 'B';
        if (percentage >= 65) return 'B-';
        if (percentage >= 60) return 'C+';
        if (percentage >= 55) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    };

    const handleSubmitResult = async (studentId) => {
        if (!subjectDetails || !studentId) return;

        try {
            setSaving(true);

            const result = results[studentId];
            const percentage = (result.totalObtained / subjectDetails.totalMarks) * 100;
            const grade = calculateGrade(percentage);

            const resultDocRef = doc(db, "Results", `${studentId}_${lecture.subjectId}_${lecture.semesterId}`);

            await setDoc(resultDocRef, {
                studentId,
                studentCNIC: students.find(s => s.id === studentId)?.cnic || '',
                departmentId: user.departmentId,
                subjectId: lecture.subjectId,
                subjectName: lecture.subjectName,
                semesterId: lecture.semesterId,
                semesterName: lecture.semesterName,
                batchId: lecture.batchId,
                batchName: lecture.batchName,
                batchType: lecture.sessionType,
                totalMarks: subjectDetails.totalMarks,
                totalObtained: result.totalObtained,
                presentationMarks: subjectDetails.theory > 0 ? result.presentationMarks : 0,
                midMarks: subjectDetails.theory > 0 ? result.midMarks : 0,
                finalMarks: subjectDetails.theory > 0 ? result.finalMarks : 0,
                practicalMarks: subjectDetails.practical > 0 ? result.practicalMarks : 0,
                percentage,
                grade,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Update local state to mark as saved
            setResults(prev => ({
                ...prev,
                [studentId]: {
                    ...prev[studentId],
                    exists: true
                }
            }));

            toast.success("Result saved successfully!");
            setEditingStudent(null);
        } catch (err) {
            console.error("Error saving result:", err);
            toast.error(`Failed to save result for student. Please try again.`);
        } finally {
            setSaving(false);
        }
    };

    const baseColumns = [
        {
            name: 'Roll No',
            selector: row => row.rollNumber || '-',
            sortable: true,
            sorted: "asc",
            width: '100px'
        },
        {
            name: 'Student Name',
            selector: row => row.name,
            sortable: true
        },
        {
            name: 'CNIC',
            selector: row => row.cnic,
            sortable: true
        },
        {
            name: (
                <span>Total Marks - ({subjectDetails?.totalMarks || 0})</span>
            ),
            cell: row => subjectDetails?.totalMarks || '-'
        }
    ];

    const theoryColumns = subjectDetails?.theory > 0 ? [
        {
            name: (
                <span>
                    Presentation - ({subjectDetails ? Math.round(subjectDetails.theoryMarks * 0.2) : 0})
                </span>
            ),
            cell: row => (
                editingStudent === row.id ? (
                    <Form.Control
                        type="number"
                        min="0"
                        max={subjectDetails ? Math.round(subjectDetails.theoryMarks * 0.2) : 0}
                        value={results[row.id]?.presentationMarks || 0}
                        onChange={(e) => handleMarksChange(row.id, 'presentationMarks', e.target.value)}
                        disabled={!subjectDetails}
                        size="sm"
                    />
                ) : (
                    results[row.id]?.presentationMarks || '-'
                )
            )
        },
        {
            name: (
                <span>
                    Mid-Term - ({subjectDetails ? Math.round(subjectDetails.theoryMarks * 0.2) : 0})
                </span>
            ),
            cell: row => (
                editingStudent === row.id ? (
                    <Form.Control
                        type="number"
                        min="0"
                        max={subjectDetails ? Math.round(subjectDetails.theoryMarks * 0.2) : 0}
                        value={results[row.id]?.midMarks || 0}
                        onChange={(e) => handleMarksChange(row.id, 'midMarks', e.target.value)}
                        disabled={!subjectDetails}
                        size="sm"
                    />
                ) : (
                    results[row.id]?.midMarks || '-'
                )
            )
        },
        {
            name: (
                <span>
                    Final-Term - ({subjectDetails ? Math.round(subjectDetails.theoryMarks * 0.6) : 0})
                </span>
            ),
            cell: row => (
                editingStudent === row.id ? (
                    <Form.Control
                        type="number"
                        min="0"
                        max={subjectDetails ? Math.round(subjectDetails.theoryMarks * 0.6) : 0}
                        value={results[row.id]?.finalMarks || 0}
                        onChange={(e) => handleMarksChange(row.id, 'finalMarks', e.target.value)}
                        disabled={!subjectDetails}
                        size="sm"
                    />
                ) : (
                    results[row.id]?.finalMarks || '-'
                )
            )
        }
    ] : [];

    const practicalColumn = subjectDetails?.practical > 0 ? [
        {
            name: (
                <span>
                    Practical - ({subjectDetails?.practicalMarks || 0})
                </span>
            ),
            cell: row => (
                editingStudent === row.id ? (
                    <Form.Control
                        type="number"
                        min="0"
                        max={subjectDetails?.practicalMarks || 0}
                        value={results[row.id]?.practicalMarks || 0}
                        onChange={(e) => handleMarksChange(row.id, 'practicalMarks', e.target.value)}
                        disabled={!subjectDetails}
                        size="sm"
                    />
                ) : (
                    results[row.id]?.practicalMarks || '-'
                )
            )
        }
    ] : [];

    const resultColumns = [
        {
            name: 'Total Obtained',
            cell: row => results[row.id]?.totalObtained || '-'
        },
        {
            name: 'Percentage',
            cell: row => results[row.id]?.percentage ? `${results[row.id].percentage.toFixed(2)}%` : '-'
        },
        {
            name: 'Grade',
            cell: row => results[row.id]?.grade || '-',
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-1">
                    {editingStudent === row.id ? (
                        <>
                            <Button
                                variant="success"
                                className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-success-600 p-2"
                                onClick={() => handleSubmitResult(row.id)}
                                disabled={saving}
                                title="Save"
                            >
                                <Icon icon="lucide:edit" />
                            </Button>
                            <Button
                                variant="danger"
                                className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-danger-600 p-2"
                                onClick={() => setEditingStudent(null)}
                                disabled={saving}
                                title="Cancel"
                            >
                                <Icon icon="tabler:cancel" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                className={`w-32-px h-32-px me-8 rounded-circle d-inline-flex align-items-center justify-content-center border-0 p-2
                                    ${results[row.id]?.exists ? 'text-warning-600 bg-warning-focus text-warning-main' : 'text-success-600 bg-success-focus text-success-main'}`}
                                onClick={() => setEditingStudent(row.id)}
                                title={results[row.id]?.exists ? 'Edit' : 'Add'}
                            >
                                <Icon icon={results[row.id]?.exists ? 'lucide:edit' : 'tabler:plus'} />
                            </Button>
                        </>
                    )}
                </div>
            ),
            width: '120px'
        }
    ];

    const columns = [
        ...baseColumns,
        ...theoryColumns,
        ...practicalColumn,
        ...resultColumns
    ];

    if (!lecture) {
        return (
            <MasterLayout>
                <Breadcrumb title="Lecture Not Found" />
                <div className="py-4">
                    <Card>
                        <Card.Body className="text-center">
                            <Icon icon="mdi:alert-circle-outline" width={48} height={48} className="text-danger mb-3" />
                            <h4>No lecture data found</h4>
                            <p>Please go back and select a valid lecture</p>
                            <Button
                                variant="outline-secondary"
                                onClick={() => navigate(-1)}
                                size='sm'
                            >
                                Back to Dashboard
                            </Button>
                        </Card.Body>
                    </Card>
                </div>
            </MasterLayout>
        );
    }

    return (
        <MasterLayout>
            <Breadcrumb
                title={`Result`}
                items={[
                    { title: 'Dashboard', path: '/dashboard' },
                    { title: 'Manage Results', active: true }
                ]}
            />

            <div className="py-4">
                <Card>
                    <Card.Body>
                        <div className="margin-bottom-15">
                            <div className="d-flex justify-content-between">
                                <h5 className="margin-bottom-10 mt-3 modal-heading">
                                    {`Department of ${user.departmentName}`}
                                </h5>
                            </div>
                            <div className="d-flex justify-content-center">
                                <h5 className="margin-bottom-25 modal-heading">Manage Result</h5>
                            </div>
                            <div className="d-flex justify-content-between">
                                <h5 className="margin-bottom-10 modal-sub-heading text-capitalize">
                                    <strong>Subject:</strong> {lecture.subjectName} / <strong>Session:</strong> {lecture.sessionType}
                                </h5>
                                <span>
                                    <strong>Batch:</strong> {lecture.batchName} | 
                                    <strong> Theory:</strong> {subjectDetails?.theory || 0}hrs | 
                                    {subjectDetails?.practical > 0 && 
                                        <><strong> Practical:</strong> {subjectDetails.practical}hrs</>
                                    }
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <CustomLoader size={'80px'} />
                        ) : filteredStudents.length === 0 ? (
                            <NoDataTable
                                img={'../assets/images/no-data.svg'}
                                text={'No Students Found!'}
                            />
                        ) : (
                            <>
                                <DataTable
                                    columns={columns}
                                    data={filteredStudents}
                                    pagination
                                    paginationPerPage={studentsPerPage}
                                    paginationRowsPerPageOptions={[15, 30, 50]}
                                    customStyles={{
                                        headCells: {
                                            style: {
                                                fontWeight: 'bold',
                                                backgroundColor: '#f8f9fa'
                                            }
                                        },
                                        cells: {
                                            style: {
                                                verticalAlign: 'middle'
                                            }
                                        }
                                    }}
                                    highlightOnHover
                                    pointerOnHover
                                />
                                <div className="d-flex justify-content-end mt-3">
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => navigate(-1)}
                                        size='sm'
                                    >
                                        Back to Dashboard
                                    </Button>
                                </div>
                            </>
                        )}
                    </Card.Body>
                </Card>
            </div>
        </MasterLayout>
    );
};

export default ManageResults;