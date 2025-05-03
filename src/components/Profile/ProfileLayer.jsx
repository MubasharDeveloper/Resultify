import { Icon } from '@iconify/react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db, storage, doc, getDoc, updateDoc, ref } from '../../Firebase_config';
import { BodyLoading } from '../CustomLoader';

const ProfileLayer = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // User data states
  const [userData, setUserData] = useState(null);
  const [roleName, setRoleName] = useState("Loading...");
  const [departmentName, setDepartmentName] = useState("Loading...");

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: ''
  });

  // Password form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Form errors
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    general: ''
  });

  // Password form errors
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: ''
  });

  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('assets/images/user.jpg');

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user?.id) return;

        // Get user document
        const userDoc = await getDoc(doc(db, "Users", user.id));
        if (!userDoc.exists()) {
          throw new Error("User document not found");
        }

        const data = userDoc.data();
        setUserData(data);

        // Set image preview if exists
        if (data.img) {
          setImagePreview(data.img);
        }

        // Set form data
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          gender: data.gen || ''
        });

        // Fetch role name
        if (data.roleId) {
          const roleDoc = await getDoc(doc(db, "Roles", data.roleId));
          if (roleDoc.exists()) {
            setRoleName(roleDoc.data().name);

            // Fetch department if not admin
            if (roleDoc.data().name !== "Admin" && data.departmentId) {
              const deptDoc = await getDoc(doc(db, "Departments", data.departmentId));
              if (deptDoc.exists()) {
                setDepartmentName(deptDoc.data().name);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setFormErrors(prev => ({
          ...prev,
          general: "Failed to load user data"
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Handle file input change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setFormErrors(prev => ({
        ...prev,
        image: 'Please select an image file (JPEG, PNG)'
      }));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors(prev => ({
        ...prev,
        image: 'Image size should be less than 2MB'
      }));
      return;
    }

    setImageFile(file);
    setFormErrors(prev => ({ ...prev, image: '' }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setFormErrors(prev => ({ ...prev, [id]: '' }));
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { id, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [id]: value }));
    setPasswordErrors(prev => ({ ...prev, [id]: '' }));
  };

  // Handle phone number input with validation
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData(prev => ({
      ...prev,
      phone: value
    }));
    setFormErrors(prev => ({ ...prev, phone: '' }));
  };

  // Validation functions
  const validateName = (name) => {
    const regex = /^[a-zA-Z\s]{2,}$/;
    if (!regex.test(name)) {
      setFormErrors(prev => ({
        ...prev,
        name: 'Name should contain at least 2 letters and only alphabets'
      }));
      return false;
    }
    return true;
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!regex.test(email)) {
      setFormErrors(prev => ({
        ...prev,
        email: 'Please enter a valid email address'
      }));
      return false;
    }
    return true;
  };

  const validatePhone = (phone) => {
    const regex = /^[0-9]{11}$/;
    if (!regex.test(phone)) {
      setFormErrors(prev => ({
        ...prev,
        phone: 'Phone number must be exactly 11 digits'
      }));
      return false;
    }
    return true;
  };

  const validateGender = (gender) => {
    if (!gender) {
      setFormErrors(prev => ({
        ...prev,
        gender: 'Please select a gender'
      }));
      return false;
    }
    return true;
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: 'Password must be at least 8 characters long'
      }));
      return false;
    }

    if (!/[0-9]/.test(password)) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: 'Password must contain at least one number'
      }));
      return false;
    }

    if (!/[a-zA-Z]/.test(password)) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: 'Password must contain at least one letter'
      }));
      return false;
    }

    if (!/[!@#$%^&*]/.test(password)) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: 'Password must contain at least one special character (!@#$%^&*)'
      }));
      return false;
    }

    return true;
  };

  // Verify current password
  const verifyCurrentPassword = async () => {
    if (!passwordForm.currentPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        currentPassword: 'Current password is required'
      }));
      return false;
    }

    try {
      const userDoc = await getDoc(doc(db, "Users", user.id));
      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();

      // Compare passwords directly (in production, use hashing)
      if (passwordForm.currentPassword !== userData.password) {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying password:', error);
      setPasswordErrors(prev => ({
        ...prev,
        currentPassword: 'Error verifying password'
      }));
      return false;
    }
  };

  // Reset form to original values
  const handleCancel = () => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        gender: userData.gen || ''
      });
      setImagePreview(userData.img || 'assets/images/user.jpg');
      setImageFile(null);
      setFormErrors({
        name: '',
        email: '',
        phone: '',
        gender: '',
        general: ''
      });
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    // Validate all fields
    const isNameValid = validateName(formData.name);
    const isEmailValid = validateEmail(formData.email);
    const isPhoneValid = validatePhone(formData.phone);
    const isGenderValid = validateGender(formData.gender);

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isGenderValid) {
      return;
    }

    try {
      setProfileLoading(true);

      const updatedUserData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        gen: formData.gender
      };

      // Update in Firestore
      await updateDoc(doc(db, "Users", user.id), updatedUserData);

      // Update local state
      setUserData(prev => ({
        ...prev,
        ...updatedUserData
      }));

      // Update auth context
      updateUser({
        ...user,
        ...updatedUserData
      });

      // Clear errors
      setFormErrors({
        name: '',
        email: '',
        phone: '',
        gender: '',
        general: ''
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setFormErrors(prev => ({
        ...prev,
        general: error.message || 'Failed to update profile'
      }));
    } finally {
      setProfileLoading(false);
    }
  };

  // Update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    // First verify current password
    const isCurrentPasswordValid = await verifyCurrentPassword();
    if (!isCurrentPasswordValid) {
      return;
    }

    // Validate new password
    if (!validatePassword(passwordForm.newPassword)) {
      return;
    }

    // Check if passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
      return;
    }

    try {
      setPasswordLoading(true);

      // Update password in Firestore
      await updateDoc(doc(db, "Users", user.id), {
        password: passwordForm.newPassword // In production, hash this password
      });

      // Clear form and errors
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        general: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordErrors(prev => ({
        ...prev,
        general: error.message || 'Failed to update password'
      }));
    } finally {
      setPasswordLoading(false);
    }
  };



  return (loading ? (<BodyLoading />) : (
    <div className="row gy-4">
      <div className="col-lg-4">
        <div className="user-grid-card position-relative border radius-16 overflow-hidden bg-base h-100">
          <img
            src="assets/images/user-grid/user-grid-bg1.png"
            alt="Profile background"
            className="w-100 object-fit-cover"
          />
          <div className="pb-24 ms-16 mb-24 me-16 mt--100">
            <div className="text-center border border-top-0 border-start-0 border-end-0">
              <img
                src={imagePreview}
                alt={userData?.name || "Profile"}
                className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover"
              />
              <h6 className="mb-0 mt-16">{userData?.name || "User"}</h6>
              <span className="text-secondary-light mb-16">{userData?.email || "No email"}</span>
            </div>
            <div className="mt-24">
              <h6 className="text-xl mb-16">Personal Info</h6>
              <ul>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">Full Name</span>
                  <span className="w-70 text-secondary-light fw-medium">
                    : {userData?.name || "N/A"}
                  </span>
                </li>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">Email</span>
                  <span className="w-70 text-secondary-light fw-medium">
                    : {userData?.email || "N/A"}
                  </span>
                </li>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">Phone Number</span>
                  <span className="w-70 text-secondary-light fw-medium">
                    : {userData?.phone || "N/A"}
                  </span>
                </li>
                {roleName !== "Admin" && (
                  <li className="d-flex align-items-center gap-1 mb-12">
                    <span className="w-30 text-md fw-semibold text-primary-light">Department</span>
                    <span className="w-70 text-secondary-light fw-medium">
                      : {departmentName || "N/A"}
                    </span>
                  </li>
                )}
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">Role</span>
                  <span className="w-70 text-secondary-light fw-medium">
                    : {roleName || "N/A"}
                  </span>
                </li>
                <li className="d-flex align-items-center gap-1 mb-12">
                  <span className="w-30 text-md fw-semibold text-primary-light">Gender</span>
                  <span className="w-70 text-secondary-light fw-medium">
                    : {userData?.gen || "N/A"}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div >
      </div >

      <div className="col-lg-8">
        <div className="card h-100 border" style={{ borderRadius: '16px' }}>
          <div className="card-body p-24">
            <ul className="nav border-gradient-tab nav-pills mb-20 d-inline-flex" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className="nav-link d-flex align-items-center px-24 active"
                  id="edit-profile-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#edit-profile"
                  type="button"
                >
                  Edit Profile
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className="nav-link d-flex align-items-center px-24"
                  id="change-password-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#change-password"
                  type="button"
                >
                  Change Password
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className="nav-link d-flex align-items-center px-24"
                  id="notification-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#notification"
                  type="button"
                >
                  Notification Settings
                </button>
              </li>
            </ul>

            <div className="tab-content">
              {/* Edit Profile Tab */}
              <div className="tab-pane fade show active" id="edit-profile" role="tabpanel">
                <h6 className="text-md text-primary-light mb-16">Profile Image</h6>
                {formErrors.image && (
                  <div className="alert alert-danger mb-16">{formErrors.image}</div>
                )}
                <div className="mb-24 mt-16">
                  <div className="avatar-upload">
                    <div className="avatar-edit mt-16 z-1 cursor-pointer">
                      <input
                        type="file"
                        id="imageUpload"
                        accept=".png,.jpg,.jpeg"
                        hidden
                        onChange={handleImageChange}
                      />
                      <label
                        htmlFor="imageUpload"
                        className="w-32-px h-32-px index-99 position-absolute bottom-0 end-0 me-24 d-flex justify-content-center align-items-center bg-primary-50 text-primary-600 border border-primary-600 bg-hover-primary-100 text-lg rounded-circle"
                      >
                        <Icon icon="solar:camera-outline" />
                      </label>
                      {imageFile && (
                        <button
                          disabled={uploadLoading}
                          className="w-32-px h-32-px index-99 position-absolute bottom-0 start-0 ms-24 d-flex justify-content-center align-items-center bg-success-50 text-success-600 border border-success-600 bg-hover-success-100 text-lg rounded-circle"
                        >
                          {uploadLoading ? (
                            <Icon icon="line-md:uploading-loop" size={'22px'} />
                          ) : (
                            <Icon icon="line-md:uploading" size={'22px'} />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="avatar-preview">
                      <div
                        style={{
                          backgroundImage: `url(${imagePreview})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: '50%'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile}>
                  <div className="row">
                    <div className="col-sm-6">
                      <div className="mb-20">
                        <label htmlFor="name" className="form-label fw-semibold text-primary-light text-sm mb-8">
                          Full Name <span className="text-danger-600">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control radius-8 ${formErrors.name ? 'error-field' : ''}`}
                          id="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                        {formErrors.name && (
                          <div className="error-message text-danger-600 text-sm mt-4">
                            {formErrors.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="mb-20">
                        <label htmlFor="email" className="form-label fw-semibold text-primary-light text-sm mb-8">
                          Email <span className="text-danger-600">*</span>
                        </label>
                        <input
                          type="email"
                          className={`form-control radius-8 ${formErrors.email ? 'error-field' : ''}`}
                          id="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                        {formErrors.email && (
                          <div className="error-message text-danger-600 text-sm mt-4">
                            {formErrors.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="mb-20">
                        <label htmlFor="phone" className="form-label fw-semibold text-primary-light text-sm mb-8">
                          Phone <span className="text-danger-600">*</span>
                        </label>
                        <input
                          type="tel"
                          className={`form-control radius-8 ${formErrors.phone ? 'error-field' : ''}`}
                          id="phone"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          maxLength={11}
                        />
                        {formErrors.phone && (
                          <div className="error-message text-danger-600 text-sm mt-4">
                            {formErrors.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="mb-20">
                        <label htmlFor="gender" className="form-label fw-semibold text-primary-light text-sm mb-8">
                          Gender <span className="text-danger-600">*</span>
                        </label>
                        <select
                          className={`form-control radius-8 form-select ${formErrors.gender ? 'error-field' : ''}`}
                          id="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        {formErrors.gender && (
                          <div className="error-message text-danger-600 text-sm mt-4">
                            {formErrors.gender}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {formErrors.general && (
                    <div className="alert alert-danger mb-16">{formErrors.general}</div>
                  )}
                  <div className="d-flex align-items-center justify-content-center gap-3">
                    <button
                      type="button"
                      className="border border-danger-600 bg-hover-danger-200 text-danger-600 text-md px-56 py-11 radius-8"
                      onClick={handleCancel}
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary border border-primary-600 text-md px-56 py-12 radius-8"
                      disabled={profileLoading}
                    >
                      {profileLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : 'Save'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Change Password Tab */}
              <div className="tab-pane fade" id="change-password" role="tabpanel">
                {passwordErrors.general && (
                  <div className="alert alert-danger mb-16">{passwordErrors.general}</div>
                )}
                <form onSubmit={handleUpdatePassword}>
                  <div className="mb-20">
                    <label htmlFor="currentPassword" className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Current Password <span className="text-danger-600">*</span>
                    </label>
                    <div className="position-relative">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        className={`form-control radius-8 ${passwordErrors.currentPassword ? 'error-field' : ''}`}
                        id="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                      />
                      <span
                        className={`toggle-password ${passwordVisible ? "ri-eye-off-line" : "ri-eye-line"} cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light`}
                        onClick={() => setPasswordVisible(!passwordVisible)}
                      />
                    </div>
                    {passwordErrors.currentPassword && (
                      <div className="error-message text-danger-600 text-sm mt-4">
                        {passwordErrors.currentPassword}
                      </div>
                    )}
                  </div>

                  <div className="mb-20">
                    <label htmlFor="newPassword" className="form-label fw-semibold text-primary-light text-sm mb-8">
                      New Password <span className="text-danger-600">*</span>
                    </label>
                    <div className="position-relative">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        className={`form-control radius-8 ${passwordErrors.newPassword ? 'error-field' : ''}`}
                        id="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                      />
                      <span
                        className={`toggle-password ${passwordVisible ? "ri-eye-off-line" : "ri-eye-line"} cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light`}
                        onClick={() => setPasswordVisible(!passwordVisible)}
                      />
                    </div>
                    {passwordErrors.newPassword && (
                      <div className="error-message text-danger-600 text-sm mt-4">
                        {passwordErrors.newPassword}
                      </div>
                    )}
                  </div>

                  <div className="mb-20">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold text-primary-light text-sm mb-8">
                      Confirm Password <span className="text-danger-600">*</span>
                    </label>
                    <div className="position-relative">
                      <input
                        type={confirmPasswordVisible ? "text" : "password"}
                        className={`form-control radius-8 ${passwordErrors.confirmPassword ? 'error-field' : ''}`}
                        id="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                      />
                      <span
                        className={`toggle-password ${confirmPasswordVisible ? "ri-eye-off-line" : "ri-eye-line"} cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light`}
                        onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                      />
                    </div>
                    {passwordErrors.confirmPassword && (
                      <div className="error-message text-danger-600 text-sm mt-4">
                        {passwordErrors.confirmPassword}
                      </div>
                    )}
                  </div>

                  <div className="d-flex justify-content-center">
                    <button
                      type="submit"
                      className="btn btn-primary border border-primary-600 text-md px-56 py-12 radius-8"
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Notification Settings Tab */}
              <div className="tab-pane fade" id="notification" role="tabpanel">
                <div className="form-switch switch-primary py-12 px-16 border radius-8 position-relative mb-16">
                  <input className="form-check-input" type="checkbox" id="companyNews" />
                  <label htmlFor="companyNews" className="form-check-label line-height-1 fw-medium text-secondary-light ms-3">
                    Company News
                  </label>
                </div>

                <div className="form-switch switch-primary py-12 px-16 border radius-8 position-relative mb-16">
                  <input className="form-check-input" type="checkbox" id="pushNotifications" defaultChecked />
                  <label htmlFor="pushNotifications" className="form-check-label line-height-1 fw-medium text-secondary-light ms-3">
                    Push Notifications
                  </label>
                </div>

                <div className="form-switch switch-primary py-12 px-16 border radius-8 position-relative mb-16">
                  <input className="form-check-input" type="checkbox" id="weeklyNewsletters" defaultChecked />
                  <label htmlFor="weeklyNewsletters" className="form-check-label line-height-1 fw-medium text-secondary-light ms-3">
                    Weekly Newsletters
                  </label>
                </div>

                <div className="form-switch switch-primary py-12 px-16 border radius-8 position-relative mb-16">
                  <input className="form-check-input" type="checkbox" id="meetupsNearby" />
                  <label htmlFor="meetupsNearby" className="form-check-label line-height-1 fw-medium text-secondary-light ms-3">
                    Meetups Nearby
                  </label>
                </div>

                <div className="form-switch switch-primary py-12 px-16 border radius-8 position-relative mb-16">
                  <input className="form-check-input" type="checkbox" id="orderNotifications" defaultChecked />
                  <label htmlFor="orderNotifications" className="form-check-label line-height-1 fw-medium text-secondary-light ms-3">
                    Order Notifications
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
  );
};

export default ProfileLayer;