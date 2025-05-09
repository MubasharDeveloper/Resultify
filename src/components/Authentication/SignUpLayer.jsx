import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, Slide } from 'react-toastify';
import { db } from '../../Firebase_config';
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

const initialStateSignUp = {
  email: '',
  password: '',
};

const SignUpLayer = () => {
  const navigate = useNavigate();
  const [signUpData, setSignUpData] = useState(initialStateSignUp);
  const [errors, setErrors] = useState(initialStateSignUp);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) =>
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);

  const handleChange = (e) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;
    let newErrors = { email: "", password: "" };

    if (!signUpData.email.trim()) {
      newErrors.email = "Please enter your email";
      valid = false;
    } else if (!validateEmail(signUpData.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }

    if (!signUpData.password.trim()) {
      newErrors.password = "Please enter your password";
      valid = false;
    } else if (!validatePassword(signUpData.password)) {
      newErrors.password =
        "Password must be at least 8 characters long and include letters, numbers, and special characters.";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    try {
      // Check if email already exists in Users collection
      const q = query(
        collection(db, "Users"),
        where("email", "==", signUpData.email)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        toast.error("This email is already registered!", {
          position: "top-right",
          autoClose: 2500,
          theme: "light",
          transition: Slide,
        });
        return;
      }

      // Add new user to Users collection
      await addDoc(collection(db, "Users"), {
        email: signUpData.email.toLowerCase(),
        password: signUpData.password,
        status: false,
      });

      toast.success("User registered successfully!", {
        position: "top-right",
        autoClose: 2500,
        theme: "light",
        transition: Slide,
        onClose: () => navigate('/sign-in')
      });

      setSignUpData(initialStateSignUp);
    } catch (error) {
      console.error("Firestore Error", error);
      toast.error("Something went wrong!", {
        position: "top-right",
        autoClose: 2500,
        theme: "light",
        transition: Slide,
      });
    }
  };

  return (
    <section className='auth bg-base d-flex flex-wrap'>
      <div className='auth-left d-lg-block d-none'>
        <div className='d-flex align-items-center flex-column h-100 justify-content-center'>
          <img src='assets/images/auth/auth-sign-up.jpg' alt='' />
        </div>
      </div>
      <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center'>
        <div className='max-w-464-px mx-auto w-100'>
          <div>
            <Link to='/' className='mb-40 max-w-220-px'>
              <img src='assets/images/logo.png' alt='' />
            </Link>
            <h4 className='mb-12'>Sign Up to your Account</h4>
            <p className='mb-32 text-secondary-light text-lg'>
              Welcome! Please enter your details
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            {/* Email */}
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
              <span className='mt-4 text-sm text-danger'>{errors.email}</span>
            </div>

            {/* Password */}
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
                    style={{ paddingInlineEnd: '2.5rem' }}
                  />
                  <span
                    className='icon-right top-50 translate-middle-y cursor-pointer'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <Icon icon={showPassword ? "charm:eye" : "charm:eye-slash"} />
                  </span>
                </div>
              </div>
              <span className='mt-4 text-sm text-danger'>{errors.password}</span>
            </div>

            {/* Terms */}
            <div className=''>
              <div className='form-check style-check d-flex align-items-start'>
                <input className='form-check-input border border-neutral-300 mt-4' type='checkbox' id='condition' />
                <label className='form-check-label text-md' htmlFor='condition'>
                  By creating an account, you agree to the{' '}
                  <Link to='#' className='text-primary-600 fw-semibold'>Terms & Conditions</Link> and our{' '}
                  <Link to='#' className='text-primary-600 fw-semibold'>Privacy Policy</Link>
                </label>
              </div>
            </div>

            <button type='submit' className='btn btn-primary px-12 py-12 w-100 radius-12 mt-32'>
              Sign Up
            </button>

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
