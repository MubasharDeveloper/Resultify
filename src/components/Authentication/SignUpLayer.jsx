import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '../../Firease_config';
import { right } from "@popperjs/core";
import { toast, Bounce } from 'react-toastify';
import { useNavigate } from "react-router-dom"; // Import useNavigate

const initialStateSignUp = {
  email: '',
  password: '',
};

const SignUpLayer = () => {
  const navigate = useNavigate();
  const [signUpData, setSignUpData] = useState(initialStateSignUp);
  const [errors, setErrors] = useState(initialStateSignUp);
  const [showPassword, setShowPassword] = useState(false);

  // Email validation regex
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Password validation regex
  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    return regex.test(password);
  };

  const handleChange = (e) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });

    // Clear errors as the user types
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let valid = true;
    let newErrors = { email: "", password: "" };

    if (signUpData.email.trim() === "") {
      newErrors.email = "Please enter your email";
      valid = false;
    } else if (!validateEmail(signUpData.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }

    if (signUpData.password.trim() === "") {
      newErrors.password = "Please enter your password";
      valid = false;
    } else if (!validatePassword(signUpData.password)) {
      newErrors.password =
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.";
      valid = false;
    }

    setErrors(newErrors);

    if (!valid) {
      return;
    }

    
    // Proceed with Firebase authentication
    const { email, password } = signUpData;
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.table(signUpData);
        setSignUpData(initialStateSignUp);
        toast.success('Register Successfully!', {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          transition: Bounce,
          onClose: () => {
            // Navigate to Sign-In page after toast disappears
            navigate('/sign-in');
          }
        });
        console.log("User Registration Successful", userCredential);
      })
      .catch((error) => {
        console.error("Signup Error", error);
        toast.error(error.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          transition: Bounce,
          });
      });
  };

  return (
    <section className='auth bg-base d-flex flex-wrap'>
      <div className='auth-left d-lg-block d-none'>
        <div className='d-flex align-items-center flex-column h-100 justify-content-center'>
          <img src='assets/images/auth/auth-img.png' alt='' />
        </div>
      </div>
      <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center'>
        <div className='max-w-464-px mx-auto w-100'>
          <div>
            <Link to='/' className='mb-40 max-w-290-px'>
              <img src='assets/images/logo.png' alt='' />
            </Link>
            <h4 className='mb-12'>Sign Up to your Account</h4>
            <p className='mb-32 text-secondary-light text-lg'>
              Welcome back! Please enter your details
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="mb-12">
              <div className="position-relative">
                <div className='icon-field'>
                  <span className='icon top-50 translate-middle-y'>
                    <Icon icon='mage:email' />
                  </span>
                  <input
                    type='text'
                    name='email'
                    value={signUpData.email}
                    onChange={handleChange}
                    className={`form-control h-56-px bg-neutral-50 radius-12 ${errors.email ? "border-danger" : ""}`}
                    placeholder='Enter Your Email'
                  />
                </div>
              </div>
              <span className='mt-4 text-sm text-danger' id="error-email">
                {errors.email}
              </span>
            </div>

            {/* Password Input */}
            <div className='mb-20'>
              <div className='position-relative'>
                <div className='icon-field'>
                  <span className='icon top-50 translate-middle-y'>
                    <Icon icon='solar:lock-password-outline' />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name='password'
                    value={signUpData.password}
                    onChange={handleChange}
                    className={`form-control h-56-px bg-neutral-50 radius-12 ${errors.password ? "border-danger" : ""}`}
                    placeholder='Enter Your Password'
                    style={{paddingInlineEnd: '2.5rem'}}
                  />
                  <span className='icon-right top-50 translate-middle-y cursor-pointer' onClick={() => setShowPassword(!showPassword)}>
                    <Icon icon={showPassword ? "charm:eye" : "charm:eye-slash"} />
                  </span>
                </div>
              </div>
              <span className='mt-4 text-sm text-danger' id="error-password">
                {errors.password}
              </span>
            </div>

            <div className=''>
              <div className='d-flex justify-content-between gap-2'>
                <div className='form-check style-check d-flex align-items-start'>
                  <input
                    className='form-check-input border border-neutral-300 mt-4'
                    type='checkbox'
                    id='condition'
                  />
                  <label
                    className='form-check-label text-md'
                    htmlFor='condition'
                  >
                    By creating an account, you agree to the {' '}
                    <Link to='#' className='text-primary-600 fw-semibold'> Terms & Conditions </Link>
                    {' '} and our {' '}
                    <Link to='#' className='text-primary-600 fw-semibold'> Privacy Policy</Link>
                  </label>
                </div>
              </div>
            </div>

            <button
              type='submit'
              className='btn btn-primary px-12 py-12 w-100 radius-12 mt-32'
            >
              Sign Up
            </button>

            {/* <div className='mt-32 center-border-horizontal text-center'>
              <span className='bg-base z-1 px-4'>Or sign up with</span>
            </div>

            <div className='mt-32 d-flex align-items-center gap-3'>
              <button
                type='button'
                className='fw-semibold text-primary-light py-16 px-18 w-100 border radius-12 text-md d-flex align-items-center justify-content-center gap-12 line-height-1 bg-hover-primary-50'
              >
                <Icon
                  icon='logos:google-icon'
                  className='text-primary-600 text-xl line-height-1'
                />
                Google
              </button>
            </div> */}

            <div className='mt-32 text-center text-sm'>
              <p className='mb-0'>
                Already have an account?{" "}
                <Link to='/sign-in' className='text-primary-600 fw-semibold'>
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignUpLayer;
