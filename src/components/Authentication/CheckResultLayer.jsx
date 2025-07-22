import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, Bounce } from "react-toastify";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const CheckResultLayer = () => {
    const navigate = useNavigate();
    const db = getFirestore();
    const [cnic, setCnic] = useState("");
    const [errors, setErrors] = useState("");
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters

        // Format the CNIC with dashes after 5 and 12 digits
        if (value.length > 13) {
            value = value.substring(0, 13);
        }

        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5);
        }
        if (value.length > 13) {
            value = value.substring(0, 13) + '-' + value.substring(13);
        }

        setCnic(value);
        setErrors("");
    };

    const validateCNIC = (cnic) => {
        const regex = /^\d{5}-\d{7}-\d{1}$/;
        return regex.test(cnic);
    };

    const fetchSemestersForBatch = async (batchId) => {
        try {
            const semestersRef = collection(db, "Semesters");
            const q = query(semestersRef, where("batchId", "==", batchId));
            const querySnapshot = await getDocs(q);

            const fetchedSemesters = [];
            querySnapshot.forEach((doc) => {
                fetchedSemesters.push({ id: doc.id, ...doc.data() });
            });

            // Sort semesters by name
            return fetchedSemesters.sort((a, b) => {
                const nameA = a.name.toUpperCase();
                const nameB = b.name.toUpperCase();
                return nameA.localeCompare(nameB);
            });

        } catch (error) {
            console.error("Error fetching semesters:", error);
            throw error;
        }
    };

    const fetchBatches = async (batchId) => {
        try {
            const batchRef = doc(db, "Batches", batchId);
            const batchSnap = await getDoc(batchRef);

            if (batchSnap.exists()) {
                return [{ id: batchSnap.id, ...batchSnap.data() }];
            } else {
                return []; // No batch found
            }

        } catch (error) {
            console.error("Error fetching batch:", error);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors("");
        setStudentData(null);
        setLoading(true);

        // Input validation
        if (!cnic.trim()) {
            setErrors("Please enter your CNIC");
            setLoading(false);
            return;
        }
        if (!validateCNIC(cnic)) {
            setErrors("Invalid CNIC format (should be 13 digits like 12345-1234567-1)");
            setLoading(false);
            return;
        }

        try {
            // Check Firestore for student with this CNIC
            const studentsRef = collection(db, "Students");
            const q = query(studentsRef, where("cnic", "==", cnic));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error('No student found with this CNIC.', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "light",
                    transition: Bounce,
                });
                setLoading(false);
                return;
            }

            // Get the first student (assuming CNIC is unique)
            const studentDoc = querySnapshot.docs[0];
            const student = { id: studentDoc.id, ...studentDoc.data() };

            // Fetch and add sorted semesters to student object
            if (student.batchId) {
                const sortedSemesters = await fetchSemestersForBatch(student.batchId);
                student.semesters = sortedSemesters;

                const sortedBatches = await fetchBatches(student.batchId);
                student.batchInfo = sortedBatches;
            }

            setStudentData(student);

            toast.success('Student record found!', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
                transition: Bounce,
            });

            console.log(student);
            // Navigate to results page with student data
            navigate('/student-results', { state: { student } });

        } catch (error) {
            console.error("Error:", error.message);
            toast.error(error.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
                transition: Bounce,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <section className="auth forgot-password-page bg-base d-flex flex-wrap">
                <div className="auth-left d-lg-block d-none">
                    <div className="d-flex align-items-center flex-column h-100 justify-content-center">
                        <img src="assets/images/auth/card.svg" alt="" style={{maxWidth: 440}} />
                    </div>
                </div>
                <div className="auth-right py-32 px-24 d-flex flex-column justify-content-center">
                    <div className="max-w-464-px mx-auto w-100">
                        <div>
                            <h4 className="mb-12">Check Student Result</h4>
                            <p className="mb-32 text-secondary-light text-lg">
                                Enter your CNIC to check your result.
                            </p>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-12">
                                <div className="position-relative">
                                    <div className="icon-field">
                                        <span className="icon top-50 translate-middle-y">
                                            <Icon icon="tabler:id" />
                                        </span>
                                        <input
                                            type="text"
                                            name="cnic"
                                            value={cnic}
                                            onChange={handleChange}
                                            maxLength={15}
                                            className={`form-control h-56-px bg-neutral-50 radius-12 ${errors ? "error-filed" : ""}`}
                                            placeholder="Enter Your CNIC (e.g., 12345-1234567-1)"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                {errors && (
                                    <span className="mt-4 text-sm error-message" id="error-cnic">
                                        {errors}
                                    </span>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary px-12 py-12 w-100 radius-12 mt-32"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Searching...
                                    </>
                                ) : (
                                    "Check Result"
                                )}
                            </button>
                            <div className="text-center">
                                <Link to="/" className="text-primary-600 fw-500 mt-24">
                                    Back to Home
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </>
    );
};

export default CheckResultLayer;