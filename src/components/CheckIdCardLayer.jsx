import { Icon } from '@iconify/react/dist/iconify.js'
import React from 'react'
// import { Link } from 'react-router-dom'

import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const CheckIdCardLayer = () => {
    const [cnic, setCnic] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate(); // Initialize navigation

    const handleChange = (e) => {
        let value = e.target.value;
        value = value.replace(/\D/g, ""); // Remove non-numeric characters

        // Auto-format CNIC as XXXXX-XXXXXXX-X
        if (value.length > 5) {
            value = value.slice(0, 5) + "-" + value.slice(5);
        }
        if (value.length > 13) {
            value = value.slice(0, 13) + "-" + value.slice(13);
        }


        setCnic(value);
        if (value.length === 15) {
            setError("");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent form submission

        if (cnic.length === 0) {
            setError("Please make sure to enter the correct 13-digit CNIC number (-) will add automatically.");
        }
        else if (cnic.length !== 15) {
            setError("CNIC must be exactly 13 digits (-) will add automatically.");
        } else {
            setError(""); // No error
            setTimeout(() => {
                navigate("/profile"); // Redirect to another page
            }, 1000)
        }
    };

    return (
        <>
            <section className="auth forgot-password-page bg-base d-flex flex-wrap">
                <div className="auth-left d-lg-block d-none">
                    <div className="d-flex align-items-center flex-column h-100 justify-content-center">
                        <img src="assets/images/auth/forgot-pass-img.svg" alt="" />
                    </div>
                </div>
                <div className="auth-right py-32 px-24 d-flex flex-column justify-content-center">
                    <div className="max-w-464-px mx-auto w-100">
                        <div>
                            <h4 className="mb-12">Check Result</h4>
                            <p className="mb-16 text-secondary-light text-md">
                                Please Enter Your Valid CNIC (Computerized National Identity Card) Number to Check Your Result
                            </p>
                            <p className="mb-32 text-secondary-light text-sm">
                                <strong>Note:</strong> <br/> 
                                Please make sure to enter the correct 13-digit CNIC number.
                                <br/>
                                (-) will add automatically.
                            </p>
                        </div>
                        <div className="icon-field">
                            <span className="icon top-50 translate-middle-y">
                                <Icon icon="lucide-lab:card-credit" />
                            </span>
                            <input
                                type="text"
                                value={cnic}
                                onChange={handleChange}
                                maxLength="15"
                                className={`form-control h-56-px bg-neutral-50 radius-12 ${error ? "border-danger-500" : "border-primary-500"}`}
                                placeholder="Enter Your CNIC XXXXX-XXXXXXX-X"
                            />
                        </div>
                        <div>
                            {error && <p className="mb-0 text-sm text-danger-500">{error}</p>}
                        </div>
                        <button
                            onClick={handleSubmit}
                            className="btn btn-primary px-12 py-12 w-100 radius-12 mt-32"
                        >
                            Check
                        </button>
                    </div>
                </div>
            </section>
        </>

    )
}

export default CheckIdCardLayer;