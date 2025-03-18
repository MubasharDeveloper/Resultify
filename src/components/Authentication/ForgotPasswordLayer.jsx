import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../../Firease_config';
import { right } from "@popperjs/core";
import { toast, Bounce } from 'react-toastify';
import { useNavigate } from "react-router-dom"; // Import useNavigate

const ForgotPasswordLayer = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('')
    const [errors, setErrors] = useState('');

    const handleChange = e =>{
        setEmail(e.target.value)
        setErrors('');
    }

    // Email validation regex
    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubmit = e => {
        e.preventDefault();
        let valid = true;
        let newErrors = '';
  
        if (email.trim() === "") {
            newErrors = "Please enter your email";
            valid = false;
        } else if (!validateEmail(email)) {
            newErrors = "Invalid email format";
            valid = false;
        }

        setErrors(newErrors);

        if (!valid) {
            return;
        }
  
        sendPasswordResetEmail(auth, email)
            .then(() => {
                console.log("Password reset email sent!");
                setEmail('');
                toast.success('Check Your Mail Box!', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                    transition: Bounce,
                    onClose: () => {
                        navigate('/sign-in');
                    }
                });
            })
            .catch((error) => {
                console.error("Error sending email:", error.message);
                toast.error(error.message, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "light",
                    transition: Bounce,
                });
            });
  
    }


    return (
        <>
            <section className="auth forgot-password-page bg-base d-flex flex-wrap">
                <div className="auth-left d-lg-block d-none">
                    <div className="d-flex align-items-center flex-column h-100 justify-content-center">
                        <img src="assets/images/auth/forgot-pass-img.png" alt="" />
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
                                    <div className='icon-field'>
                                        <span className='icon top-50 translate-middle-y'>
                                        <Icon icon='mage:email' />
                                        </span>
                                        <input
                                        type='text'
                                        name='email'
                                        value={email}
                                        onChange={handleChange}
                                        className={`form-control h-56-px bg-neutral-50 radius-12 ${errors ? "border-danger" : ""}`}
                                        placeholder='Enter Your Email'
                                        />
                                    </div>
                                </div>
                                <span className='mt-4 text-sm text-danger' id="error-email">
                                    {errors}
                                </span>
                            </div>
                            <button
                            type='submit'
                            className='btn btn-primary px-12 py-12 w-100 radius-12 mt-32'
                            >
                                Sign Up
                            </button>
                            <div className="text-center">
                                <Link to="/sign-in" className="text-primary-600 fw-bold mt-24">
                                    Back to Sign In
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
            {/* Modal */}
            <div
                className="modal fade"
                id="exampleModal"
                tabIndex={-1}
                aria-hidden="true"
            >
                <div className="modal-dialog modal-dialog modal-dialog-centered">
                    <div className="modal-content radius-16 bg-base">
                        <div className="modal-body p-40 text-center">
                            <div className="mb-32">
                                <img src="assets/images/auth/envelop-icon.png" alt="" />
                            </div>
                            <h6 className="mb-12">Verify your Email</h6>
                            <p className="text-secondary-light text-sm mb-0">
                                Thank you, check your email for instructions to reset your password
                            </p>
                            <button
                                type="button"
                                className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32"
                            >
                                Skip
                            </button>
                            <div className="mt-32 text-sm">
                                <p className="mb-0">
                                    Don’t receive an email?{" "}
                                    <Link to="/resend" className="text-primary-600 fw-semibold">
                                        Resend
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>

    )
}

export default ForgotPasswordLayer