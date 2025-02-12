import { Icon } from '@iconify/react/dist/iconify.js'
import React from 'react'
import { Link } from 'react-router-dom'

const CheckIdCardLayer = () => {
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
                            <h4 className="mb-12">Check Result</h4>
                            <p className="mb-32 text-secondary-light text-md">
                                Please Enter Your Valid CNIC (Computerized National Identity Card) Number to Check Your Result
                            </p>
                        </div>
                        <form action="#">
                            <div className="icon-field">
                                <span className="icon top-50 translate-middle-y">
                                    <Icon icon="lucide-lab:card-credit" />
                                </span>
                                <input
                                    type="text"
                                    className="form-control h-56-px bg-neutral-50 radius-12"
                                    placeholder="Enter Your CNIC"
                                />
                            </div>
                            <div>
                                <p className="mb-16 text-secondary-light text-sm">
                                    <strong>Note:</strong> Please make sure to enter the correct 13-digit CNIC number without any dashes or spaces.
                                </p>
                            </div>
                            <Link to="/profile" className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32">
                                Check
                            </Link>
                        </form>
                    </div>
                </div>
            </section>
        </>

    )
}

export default CheckIdCardLayer;