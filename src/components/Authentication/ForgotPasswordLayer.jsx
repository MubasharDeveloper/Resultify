import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../Firebase_config";
import { toast, Bounce } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const ForgotPasswordLayer = () => {
    const navigate = useNavigate();
    const db = getFirestore(); // Initialize Firestore
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState("");

    const handleChange = (e) => {
        setEmail(e.target.value);
        setErrors("");
    };

    // Email validation regex
    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors(""); // Clear previous errors

        if (!email.trim()) {
            setErrors("Please enter your email");
            return;
        }
        if (!validateEmail(email)) {
            setErrors("Invalid email format");
            return;
        }

        try {
            // Check Firestore if email exists
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setErrors("No account found with this email.");
                return;
            }

            // Send password reset email if the email exists in Firestore
            await sendPasswordResetEmail(auth, email);
            setEmail("");
            toast.success("Check Your Mailbox for reset instructions!", {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
                transition: Bounce,
                onClose: () => navigate("/sign-in"),
            });
        } catch (error) {
            console.error("Error:", error.message);
            setErrors("Something went wrong. Please try again later.");
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
        }
    };

    return (
        <>
            <section className="auth forgot-password-page bg-base d-flex flex-wrap">
                <div className="auth-left d-lg-block d-none">
                    <div className="d-flex align-items-center flex-column h-100 justify-content-center">
                        <img src="assets/images/auth/auth-forget-password.svg" alt="" style={{maxWidth: 440}} />
                    </div>
                </div>
                <div className="auth-right py-32 px-24 d-flex flex-column justify-content-center">
                    <div className="max-w-464-px mx-auto w-100">
                        <div>
                            <h4 className="mb-12">Forgot Password</h4>
                            <p className="mb-32 text-secondary-light text-lg">
                                Enter your email to get a password reset link.
                            </p>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-12">
                                <div className="position-relative">
                                    <div className="icon-field">
                                        <span className="icon top-50 translate-middle-y">
                                            <Icon icon="mage:email" />
                                        </span>
                                        <input
                                            type="text"
                                            name="email"
                                            value={email}
                                            onChange={handleChange}
                                            className={`form-control h-56-px bg-neutral-50 radius-12 ${
                                                errors ? "border-danger" : ""
                                            }`}
                                            placeholder="Enter Your Email"
                                        />
                                    </div>
                                </div>
                                <span className="mt-4 text-sm text-danger" id="error-email">
                                    {errors}
                                </span>
                            </div>
                            <button type="submit" className="btn btn-primary px-12 py-12 w-100 radius-12 mt-32">
                                Reset Password
                            </button>
                            <div className="text-center">
                                <Link to="/sign-in" className="text-primary-600 fw-500 mt-24">
                                    Back to Sign In
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </>
    );
};

export default ForgotPasswordLayer;
