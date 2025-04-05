import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { toast, Slide } from 'react-toastify';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db, collection, query, where, getDocs } from '../../Firebase_config';

const initialStateSignUp = {
  email: '',
  password: '',
};

const SignInLayer = () => {
  const navigate = useNavigate();
  const [signUpData, setSignUpData] = useState(initialStateSignUp);
  const [errors, setErrors] = useState(initialStateSignUp);
  const [logInError, setLogInError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Email validation regex
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleChange = (e) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });

    // Clear errors as the user types
    setErrors({ ...errors, [e.target.name]: "" });
    setLogInError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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
    }
  
    setErrors(newErrors);
    if (!valid) {
      setLoading(false); // enable button again
      return;
    }
  
    const { email, password } = signUpData;
  
    try {
      // Check if user with this email exists
      const usersCollectionRef = collection(db, "Users"); // Capital 'U' as per your collection
      const q = query(usersCollectionRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        toast.error("User not found. Please check your email address and try again.",{
          position: "top-right",
          autoClose: 3000,
          theme: "colored",
          transition: Slide,
        });
        setLoading(false);
        return;
      }
  
      // Check user status
      let userBlocked = false;
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (!userData.Status) {
          userBlocked = true;
        }
      });
  
      if (userBlocked) {
        toast.error("User is blocked with this email address. Please contact the administrator for assistance.", {
          position: "top-right",
          autoClose: 5000,
          theme: "colored",
          transition: Slide,
        });
        setLoading(false);
        return;
      }
  
      // Proceed with login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setSignUpData(initialStateSignUp);
  
      toast.success("Login Successfully!", {
        position: "top-right",
        autoClose: 2500,
        theme: "colored",
        transition: Slide,
        onClose: () => navigate("/"), // Redirect after success
      });
  
      console.log("User login successful", userCredential);
  
    } catch (error) {
      console.error("Login Error", error);
      setLogInError("Invalid Email or Password");
      toast.error('Invalid Email or Password', {
        position: "top-right",
        autoClose: 5000,
        theme: "colored",
        transition: Slide,
      });
    } finally {
      setLoading(false); // enable button after everything
    }
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
            <Link to='/' className='mb-40 max-w-220-px'>
              <img src='assets/images/logo.png' alt='' />
            </Link>
            <h4 className='mb-12'>Sign In to your Account</h4>
            <p className='mb-32 text-secondary-colored text-lg'>
              Welcome back! please enter your detail
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
                    className={`form-control h-56-px bg-neutral-50 radius-12 ${errors.email || logInError ? "border-danger" : ""}`}
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
                    className={`form-control h-56-px bg-neutral-50 radius-12 ${errors.password || logInError ? "border-danger" : ""}`}
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
                <div className='form-check style-check d-flex align-items-center'>
                  <input
                    className='form-check-input border border-neutral-300'
                    type='checkbox'
                    defaultValue=''
                    id='remeber'
                  />
                  <label className='form-check-label' htmlFor='remeber'>
                    Remember me{" "}
                  </label>
                </div>
                <Link to='/forgot-password' className='text-primary-600 fw-medium'>
                  Forgot Password?
                </Link>
              </div>
            </div>
            <button
              type='submit'
              className='btn btn-primary px-12 py-12 w-100 radius-12 mt-32'
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
            {/* <div className='mt-32 center-border-horizontal text-center'>
              <span className='bg-base z-1 px-4'>Or sign in with</span>
            </div>
            <div className='mt-32 d-flex align-items-center gap-3'>
              <button
                type='button'
                className='fw-semibold text-primary-colored py-16 px-18 w-100 border radius-12 text-md d-flex align-items-center justify-content-center gap-12 line-height-1 bg-hover-primary-50'
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
                Don’t have an account?{" "}
                <Link to='/sign-up' className='text-primary-600 fw-semibold'>
                  Sign Up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignInLayer;
