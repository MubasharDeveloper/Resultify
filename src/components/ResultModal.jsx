import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { getFirestore, collection, doc, getDoc, query, where, getDocs } from "firebase/firestore";
import { Icon } from '@iconify/react';
import { BodyLoading } from './CustomLoader';

const ResultModal = ({ show, onHide, studentId, batchId, semesterId, departmentId, semesterName, studentName }) => {
    const [subjects, setSubjects] = useState([]);
    const [results, setResults] = useState([]);
    const [semester, setSemester] = useState(null);
    const [loading, setLoading] = useState(false);
    const db = getFirestore();

    useEffect(() => {
        if (!show) return;

        const fetchData = async () => {
            setLoading(true);
            setSubjects([]);
            setResults([]);
            setSemester(null);

            try {
                // First fetch the semester document
                const semesterRef = doc(db, "Semesters", semesterId);
                const semesterDoc = await getDoc(semesterRef);
                if (semesterDoc.exists()) {
                    const semesterData = {
                        id: semesterDoc.id,
                        ...semesterDoc.data()
                    };
                    setSemester(semesterData);

                    // Then fetch only subjects that are in this semester's subjectIds array
                    if (semesterData.subjectIds && semesterData.subjectIds.length > 0) {
                        const subjectsRef = collection(db, "Subjects");
                        const subjectsQuery = query(
                            subjectsRef,
                            where("__name__", "in", semesterData.subjectIds)
                        );
                        const subjectsSnapshot = await getDocs(subjectsQuery);
                        const subjectsData = subjectsSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                            theory: Number(doc.data().theory) || 0,
                            practical: Number(doc.data().practical) || 0
                        }));
                        setSubjects(subjectsData);
                    }

                    // Then fetch results for these subjects for this student
                    const resultsRef = collection(db, "Results");
                    const resultsQuery = query(
                        resultsRef,
                        where("batchId", "==", batchId),
                        where("studentId", "==", studentId),
                        where("semesterId", "==", semesterId)
                    );
                    const resultsSnapshot = await getDocs(resultsQuery);
                    const resultsData = resultsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        totalMarks: Number(doc.data().totalMarks) || 0,
                        totalObtained: Number(doc.data().totalObtained) || 0
                    }));
                    setResults(resultsData);
                }
            } catch (error) {
                console.error("Error fetching data:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [show, studentId, batchId, semesterId, departmentId, db]);

    const getResultForSubject = (subjectId) => {
        return results.find(result => result.subjectId === subjectId) || {};
    };

    const formatPracticalMarks = (marks) => {
        if (marks === 0 || marks === null || marks === undefined || marks === 'N/A') return '-';
        return marks;
    };

    const calculateGPA = (grade) => {
        if (!grade) return 0;
        const upperGrade = grade.toUpperCase();
        switch (upperGrade) {
            case 'A+': return 4.0;
            case 'A': return 4.0;
            case 'A-': return 3.7;
            case 'B+': return 3.3;
            case 'B': return 3.0;
            case 'B-': return 2.7;
            case 'C+': return 2.3;
            case 'C': return 2.0;
            case 'C-': return 1.7;
            case 'D+': return 1.3;
            case 'D': return 1.0;
            default: return 0; // F or any other grade
        }
    };

    const calculateSummary = () => {
        let totalMarks = 0;
        let totalObtained = 0;
        let totalGPA = 0;
        let totalCreditHours = 0;
        let totalTheoryHours = 0;
        let totalPracticalHours = 0;
        let count = 0;

        subjects.forEach(subject => {
            const result = getResultForSubject(subject.id);
            if (result && result.totalMarks > 0) {
                const creditHours = subject.theory + subject.practical;
                totalMarks += result.totalMarks;
                totalObtained += result.totalObtained;
                totalGPA += calculateGPA(result.grade) * creditHours;
                totalCreditHours += creditHours;
                totalTheoryHours += subject.theory;
                totalPracticalHours += subject.practical;
                count++;
            }
        });

        const percentage = count > 0 && totalMarks > 0 ? (totalObtained / totalMarks) * 100 : 0;
        const gpa = totalCreditHours > 0 ? totalGPA / totalCreditHours : 0;

        const getOverallGrade = (percentage) => {
            if (percentage >= 85) return 'A+';
            if (percentage >= 80) return 'A';
            if (percentage >= 75) return 'B+';
            if (percentage >= 70) return 'B';
            if (percentage >= 65) return 'C+';
            if (percentage >= 60) return 'C';
            if (percentage >= 55) return 'D+';
            if (percentage >= 50) return 'D';
            return 'F';
        };

        return {
            totalMarks,
            totalObtained,
            percentage: percentage.toFixed(2),
            grade: getOverallGrade(percentage),
            gpa: gpa.toFixed(2),
            creditHours: totalCreditHours,
            theoryHours: totalTheoryHours,
            practicalHours: totalPracticalHours,
            subjectCount: count,
            hasValidData: count > 0
        };
    };

    const summary = calculateSummary();

    return (
        loading ? (<BodyLoading />) : (
            <Modal show={show} onHide={onHide} size="xl" centered>
                <Modal.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="margin-bottom-10 m-0 modal-heading">
                            {studentName}'s Result - {semesterName}
                        </h5>
                        <Icon
                            icon="ci:close-circle"
                            color='#dc3545'
                            className="cursor-pointer"
                            style={{ fontSize: '24px' }}
                            onClick={onHide}
                        />
                    </div>

                    <div className="table-responsive">
                        <table className="table striped-table mb-0">
                            <thead>
                                <tr>
                                    <th>Subject Name</th>
                                    <th>Credit Hours</th>
                                    <th>T.M.</th>
                                    <th>Mid</th>
                                    <th>Sessional</th>
                                    <th>Final</th>
                                    <th>Practical</th>
                                    <th>Ob.M.</th>
                                    <th>Grade</th>
                                    <th>Per...(%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map((subject) => {
                                    const result = getResultForSubject(subject.id);
                                    const creditHours = subject.theory + subject.practical;
                                    return (
                                        <tr key={subject.id}>
                                            <td>{subject.name}</td>
                                            <td>{`${creditHours}(${subject.theory}-${subject.practical})`}</td>
                                            <td>{result.totalMarks || 'N/A'}</td>
                                            <td>{result.midMarks || 'N/A'}</td>
                                            <td>{result.presentationMarks || 'N/A'}</td>
                                            <td>{result.finalMarks || 'N/A'}</td>
                                            <td>{formatPracticalMarks(result?.practicalMarks)}</td>
                                            <td>{result.totalObtained || 'N/A'}</td>
                                            <td>{result.grade || 'N/A'}</td>
                                            <td>{result?.percentage ? `${result.percentage.toFixed(2)}%` : 'N/A'}</td>
                                        </tr>
                                    );
                                })}
                                {summary.hasValidData ? (
                                    <tr className="fw-bold bg-light">
                                        <td>Total / Average</td>
                                        <td>{`${summary.creditHours}(${summary.theoryHours}-${summary.practicalHours})`}</td>
                                        <td>{summary.totalMarks}</td>
                                        <td colSpan="4">GPA: {summary.gpa}</td>
                                        <td>{summary.totalObtained}</td>
                                        <td>{summary.grade}</td>
                                        <td>{summary.percentage}%</td>
                                    </tr>
                                ) : (
                                    <tr className="fw-bold bg-light">
                                        <td colSpan="10" className="text-center text-muted">
                                            No valid result data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Modal.Body>
            </Modal>
        )
    );
};

export default ResultModal;