import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import DataTable from 'react-data-table-component';
import { db, collection, getDocs, addDoc, query, where, doc, updateDoc, deleteDoc } from '../../Firebase_config';
import { toast, Slide } from 'react-toastify';
import Swal from 'sweetalert2';
import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { Card } from 'react-bootstrap/esm';
import { CustomLoader } from '../CustomLoader';
import NoDataTable from '../NoDataTable';
import { useAuth } from "../../context/AuthContext";

const UsersLayer = () => {
    const { user } = useAuth();

    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [activeDepartments, setActiveDepartments] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(true);
    const [loadingSwitchId, setLoadingSwitchId] = useState(null);

    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [isUserLoading, setIsUserLoading] = useState(false);
    const [userFormErrors, setUserFormErrors] = useState({});
    const [updateFormErrors, setUpdateFormErrors] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);

    const isAdmin = user?.roleName === 'Admin';
    const isHOD = user?.roleName === 'HOD';

    const [userForm, setUserForm] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        departmentId: "",
        roleId: "",
        gen: ''
    });

    const [updateForm, setUpdateForm] = useState({
        name: "",
        email: "",
        phone: "",
        departmentId: "",
        roleId: "",
        gen: ''
    });

    const resetFormFields = () => {
        setUserForm({
            name: "",
            email: "",
            password: "",
            phone: "",
            departmentId: "",
            roleId: "",
            gen: ''
        });
        setUserFormErrors({});
    };

    const resetUpdateForm = () => {
        setUpdateForm({
            name: "",
            email: "",
            phone: "",
            departmentId: "",
            roleId: "",
            gen: ''
        });
        setUpdateFormErrors({});
        setSelectedUserId(null);
    };

    const handleCloseModal = () => {
        const isFormModified = Object.keys(userForm).some(key => userForm[key] !== "");

        if (isFormModified) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You have unsaved changes. Do you really want to close the modal?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, close it',
                cancelButtonText: 'No, keep it open',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    resetFormFields();
                    setShowModal(false);
                }
            });
        } else {
            setShowModal(false);
            resetFormFields();
        }
    };

    const handleCloseUpdateModal = () => {
        const isFormModified = Object.keys(updateForm).some(key => {
            const originalUser = users.find(user => user.id === selectedUserId);
            return originalUser && updateForm[key] !== originalUser[key];
        });

        if (isFormModified) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You have unsaved changes. Do you really want to close the modal?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, close it',
                cancelButtonText: 'No, keep it open',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    resetUpdateForm();
                    setShowUpdateModal(false);
                }
            });
        } else {
            resetUpdateForm();
            setShowUpdateModal(false);
        }
    };

    const getDeptName = (id) => {
        const dept = departments.find(dep => dep.id === id);
        return dept ? dept.name : 'N/A';
    };

    const getRoleName = (id) => {
        const role = roles.find(r => r.id === id);
        return role ? role.name : 'N/A';
    };

    const fetchUsers = async () => {
        try {
            let activeDeptQuery;
            let activeDeptSnap;
            let deptSnap;
            let roleSnap;
            let userSnap;

            if (isAdmin) {
                // Admin: fetch all departments, roles, users
                activeDeptQuery = query(
                    collection(db, "Departments"),
                    where("status", "==", true)
                );

                activeDeptSnap = await getDocs(activeDeptQuery);
                deptSnap = await getDocs(collection(db, "Departments"));


                // ✅ Fetch all roles and filter only HOD and Teacher
                const allRolesSnap = await getDocs(collection(db, "Roles"));
                roleSnap = {
                    docs: allRolesSnap.docs.filter(doc =>
                        ['HOD', 'Teacher'].includes(doc.data().name)
                    ),
                };

                // ✅ Fetch users with matching departmentId and allowed roleIds
                const allowedRoleIds = ['odZ0FFPyMdvbXNFmrIfn', 'k1LBLXK6JLUlL7tblvMM']; // HOD & Teacher Role IDs
                const usersQuery = query(
                    collection(db, "Users"),
                    where("roleId", "in", allowedRoleIds)
                );
                const userSnapQuery = await getDocs(usersQuery);
                userSnap = {
                    docs: userSnapQuery.docs,
                };

            } else if (isHOD) {
                const allActiveDeptsSnap = await getDocs(
                    query(collection(db, "Departments"), where("status", "==", true))
                );
                activeDeptSnap = {
                    docs: allActiveDeptsSnap.docs.filter(doc => doc.id === user.departmentId),
                };

                // ✅ Fetch all departments and filter by the user's departmentId
                const allDeptSnap = await getDocs(collection(db, "Departments"));
                deptSnap = {
                    docs: allDeptSnap.docs.filter(doc => doc.id === user.departmentId),
                };

                // ✅ Fetch all roles and filter only HOD and Teacher
                const allRolesSnap = await getDocs(collection(db, "Roles"));
                roleSnap = {
                    docs: allRolesSnap.docs.filter(doc =>
                        ['Teacher'].includes(doc.data().name)
                    ),
                };

                // ✅ Fetch users with matching departmentId and allowed roleIds
                const allowedRoleIds = ['k1LBLXK6JLUlL7tblvMM']; // HOD & Teacher Role IDs
                const usersQuery = query(
                    collection(db, "Users"),
                    where("departmentId", "==", user.departmentId),
                    where("roleId", "in", allowedRoleIds)
                );
                const userSnapQuery = await getDocs(usersQuery);
                userSnap = {
                    docs: userSnapQuery.docs,
                };
            }

            // ✅ Build final lists
            const departmentsList = deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const activeDepartmentsList = activeDeptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const rolesList = roleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const usersList = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // ✅ Set into state
            setDepartments(departmentsList);
            setActiveDepartments(activeDepartmentsList);
            setRoles(rolesList);
            setUsers(usersList);
            setFilteredUsers(usersList);

        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        const fetchUsersData = async () => {
            setLoading(true);
            try {
                let activeDeptQuery;
                let activeDeptSnap;
                let deptSnap;
                let roleSnap;
                let userSnap;

                if (isAdmin) {
                    // Admin: fetch all departments, roles, users
                    activeDeptQuery = query(
                        collection(db, "Departments"),
                        where("status", "==", true)
                    );

                    activeDeptSnap = await getDocs(activeDeptQuery);
                    deptSnap = await getDocs(collection(db, "Departments"));


                    // ✅ Fetch all roles and filter only HOD and Teacher
                    const allRolesSnap = await getDocs(collection(db, "Roles"));
                    roleSnap = {
                        docs: allRolesSnap.docs.filter(doc =>
                            ['HOD', 'Teacher'].includes(doc.data().name)
                        ),
                    };

                    // ✅ Fetch users with matching departmentId and allowed roleIds
                    const allowedRoleIds = ['odZ0FFPyMdvbXNFmrIfn', 'k1LBLXK6JLUlL7tblvMM']; // HOD & Teacher Role IDs
                    const usersQuery = query(
                        collection(db, "Users"),
                        where("roleId", "in", allowedRoleIds)
                    );
                    const userSnapQuery = await getDocs(usersQuery);
                    userSnap = {
                        docs: userSnapQuery.docs,
                    };

                } else if (isHOD) {
                    const allActiveDeptsSnap = await getDocs(
                        query(collection(db, "Departments"), where("status", "==", true))
                    );
                    activeDeptSnap = {
                        docs: allActiveDeptsSnap.docs.filter(doc => doc.id === user.departmentId),
                    };

                    // ✅ Fetch all departments and filter by the user's departmentId
                    const allDeptSnap = await getDocs(collection(db, "Departments"));
                    deptSnap = {
                        docs: allDeptSnap.docs.filter(doc => doc.id === user.departmentId),
                    };

                    // ✅ Fetch all roles and filter only HOD and Teacher
                    const allRolesSnap = await getDocs(collection(db, "Roles"));
                    roleSnap = {
                        docs: allRolesSnap.docs.filter(doc =>
                            ['Teacher'].includes(doc.data().name)
                        ),
                    };

                    // ✅ Fetch users with matching departmentId and allowed roleIds
                    const allowedRoleIds = ['k1LBLXK6JLUlL7tblvMM']; // HOD & Teacher Role IDs
                    const usersQuery = query(
                        collection(db, "Users"),
                        where("departmentId", "==", user.departmentId),
                        where("roleId", "in", allowedRoleIds)
                    );
                    const userSnapQuery = await getDocs(usersQuery);
                    userSnap = {
                        docs: userSnapQuery.docs,
                    };
                }

                // ✅ Build final lists
                const departmentsList = deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const activeDepartmentsList = activeDeptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const rolesList = roleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const usersList = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // ✅ Set into state
                setDepartments(departmentsList);
                setActiveDepartments(activeDepartmentsList);
                setRoles(rolesList);
                setUsers(usersList);
                setFilteredUsers(usersList);

            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsersData();
    }, []);

    useEffect(() => {
        if (searchText.trim() === "") {
            setFilteredUsers(users);
        } else {
            const lowercased = searchText.toLowerCase();
            const filtered = users.filter(user =>
                user.name.toLowerCase().includes(lowercased) ||
                user.email.toLowerCase().includes(lowercased) ||
                user.phone.includes(lowercased) ||
                getDeptName(user.departmentId).toLowerCase().includes(lowercased) ||
                getRoleName(user.roleId).toLowerCase().includes(lowercased)
            );
            setFilteredUsers(filtered);
        }
    }, [searchText, users]);

    const searchComponent = (
        <input
            type="text"
            placeholder="Search users..."
            className="form-control w-auto"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
        />
    );

    const handleUserInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "phone") {
            const cleanedValue = value.replace(/\D/g, '').slice(0, 11);
            setUserForm({
                ...userForm,
                [name]: cleanedValue,
            });
        } else {
            setUserForm({
                ...userForm,
                [name]: value,
            });
        }
    };

    const handleUpdateInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "phone") {
            const cleanedValue = value.replace(/\D/g, '').slice(0, 11);
            setUpdateForm({
                ...updateForm,
                [name]: cleanedValue,
            });
        } else {
            setUpdateForm({
                ...updateForm,
                [name]: value,
            });
        }
    };

    const handleStatusChange = async (userId, currentStatus) => {
        try {
            setLoadingSwitchId(userId);
            const userRef = doc(db, "Users", userId);
            await updateDoc(userRef, {
                status: !currentStatus
            });

            toast.success("Status updated successfully", {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });

            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userId ? { ...user, status: !currentStatus } : user
                )
            );

            setFilteredUsers(prev =>
                prev.map(user =>
                    user.id === userId ? { ...user, status: !currentStatus } : user
                )
            );
        } catch (error) {
            console.error("Error updating user status:", error);
            toast.error(`Error updating user status: ${error.message}`, {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });
        } finally {
            setLoadingSwitchId(null);
        }
    };

    const validateUserForm = (form) => {
        const errors = {};

        if (!form.name) {
            errors.name = "Name is required";
        } else if (form.name.length < 3) {
            errors.name = "Name must be at least 3 characters long";
        }

        if (!form.email) {
            errors.email = "Email is required";
        } else if (users.some((user) => user.email === form.email && user.id !== selectedUserId)) {
            errors.email = "Email is already taken";
        }

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!form.password && !selectedUserId) { // Only validate password for new users
            errors.password = "Password is required";
        } else if (form.password && !passwordRegex.test(form.password) && !selectedUserId) {
            errors.password = "Min 8 chars: letters, numbers & symbols";
        }

        if (!form.phone) {
            errors.phone = "Phone number is required";
        } else if (!/^03\d{9}$/.test(form.phone.replace(/\D/g, ''))) {
            errors.phone = "Enter a valid 11-digit 03XXXXXXXXX number";
        }

        if (!form.departmentId) errors.departmentId = "Department is required";
        if (!form.roleId) errors.roleId = "Role is required";
        if (!form.gen) errors.gen = "Gender is required";

        return errors;
    };

    const validateUpdateForm = (form) => {
        const errors = {};

        if (!form.name) {
            errors.name = "Name is required";
        } else if (form.name.length < 3) {
            errors.name = "Name must be at least 3 characters long";
        }

        if (!form.email) {
            errors.email = "Email is required";
        } else if (users.some((user) => user.email === form.email && user.id !== selectedUserId)) {
            errors.email = "Email is already taken";
        }

        if (!form.phone) {
            errors.phone = "Phone number is required";
        } else if (!/^03\d{9}$/.test(form.phone.replace(/\D/g, ''))) {
            errors.phone = "Enter a valid 11-digit 03XXXXXXXXX number";
        }

        if (!form.departmentId) errors.departmentId = "Department is required";
        if (!form.roleId) errors.roleId = "Role is required";
        if (!form.gen) errors.gen = "Gender is required";

        return errors;
    };

    const handleCreateUserSubmit = async (e) => {
        e.preventDefault();
        const errors = validateUserForm(userForm);
        if (Object.keys(errors).length > 0) {
            setUserFormErrors(errors);
            return;
        }

        // Check if the department already has an HOD
        if (userForm.roleId === roles.find(role => role.name === 'HOD')?.id) {
            const existingHOD = users.find(
                user => user.departmentId === userForm.departmentId && user.roleId === roles.find(role => role.name === 'HOD')?.id
            );

            if (existingHOD) {
                toast.error('This department already has an HOD!', {
                    position: "top-right",
                    autoClose: 3000,
                    theme: "light",
                    transition: Slide,
                });
                return;
            }
        }

        setIsUserLoading(true);

        try {
            // Use addDoc which automatically generates an ID
            await addDoc(collection(db, "Users"), {
                name: userForm.name,
                email: userForm.email,
                password: userForm.password,
                phone: userForm.phone,
                departmentId: userForm.departmentId,
                roleId: userForm.roleId,
                status: true,
                gen: userForm.gen
            });

            console.log("User data saved to Firestore");
            resetFormFields();
            setShowModal(false);
            fetchUsers(); // Refresh the user list
            toast.success('User created successfully!', {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });
        } catch (error) {
            console.error("Error creating user:", error);
            toast.error(`Error creating user: ${error.message}`, {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });
        } finally {
            setIsUserLoading(false);
        }
    };

    const handleUpdateUserSubmit = async (e) => {
        e.preventDefault();
        const errors = validateUpdateForm(updateForm);
        if (Object.keys(errors).length > 0) {
            setUpdateFormErrors(errors);
            return;
        }

        setIsUserLoading(true);

        try {
            const userRef = doc(db, "Users", selectedUserId);
            await updateDoc(userRef, {
                name: updateForm.name,
                email: updateForm.email,
                phone: updateForm.phone,
                departmentId: updateForm.departmentId,
                roleId: updateForm.roleId,
                gen: updateForm.gen,
            });

            console.log("User data updated in Firestore");
            setShowUpdateModal(false);
            setUpdateFormErrors({});
            fetchUsers(); // Refresh the user list
            toast.success('User updated successfully!', {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error(`Error updating user: ${error.message}`, {
                position: "top-right",
                autoClose: 3000,
                theme: "light",
                transition: Slide,
            });
        } finally {
            setIsUserLoading(false);
        }
    };

    const handleEditUser = (userId) => {
        const userToEdit = users.find(user => user.id === userId);
        if (userToEdit) {
            setSelectedUserId(userId);
            setUpdateForm({
                name: userToEdit.name,
                email: userToEdit.email,
                phone: userToEdit.phone,
                departmentId: userToEdit.departmentId,
                roleId: userToEdit.roleId,
                gen: userToEdit.gen,
            });
            setShowUpdateModal(true);
        }
    };

    const handleDeleteUser = (userId) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, "Users", userId));
                    fetchUsers(); // Refresh the user list
                    toast.success('User deleted successfully!', {
                        position: "top-right",
                        autoClose: 3000,
                        theme: "light",
                        transition: Slide,
                    });
                } catch (error) {
                    console.error("Error deleting user:", error);
                    toast.error(`Error deleting user: ${error.message}`, {
                        position: "top-right",
                        autoClose: 3000,
                        theme: "light",
                        transition: Slide,
                    });
                }
            }
        });
    };

    const columns = [
        {
            name: '#',
            selector: (row, index) => index + 1,
            width: "60px",
        },
        {
            name: 'Name',
            selector: row => row.name,
            sortable: true,
        },
        {
            name: 'Email',
            selector: row => row.email,
            sortable: true,
        },
        {
            name: 'Phone',
            selector: row => row.phone,
            sortable: true,
        },
        {
            name: 'Department',
            selector: row => getDeptName(row.departmentId),
            sortable: true,
        },
        {
            name: 'Gender',
            selector: row => row.gen,
            sortable: true,
        },
        {
            name: 'Role',
            selector: (row) => (
                <span
                    className={`${getRoleName(row.roleId) === 'Admin'
                        ? 'bg-success-focus text-success-main border-success-main'
                        : getRoleName(row.roleId) === 'HOD'
                            ? 'bg-info-focus text-info-main border-info-main'
                            : getRoleName(row.roleId) === 'Teacher'
                                ? 'bg-warning-focus text-warning-main border-warning-main'
                                : 'bg-danger-focus text-danger-main border-danger-main'
                        } border px-8 py-2 radius-4 fw-medium text-sm`
                    }
                >
                    {getRoleName(row.roleId)}
                </span>
            ),
            sortable: false,
        },
        ...(
            isAdmin ? [
                {
                    name: 'Status',
                    cell: row => (
                        <Form.Check
                            type="switch"
                            id={`switch-${row.id}`}
                            checked={row.status === true}
                            onChange={() => handleStatusChange(row.id, row.status)}
                            disabled={loadingSwitchId === row.id}
                        />
                    ),
                },
                {
                    name: 'Action',
                    cell: row => (
                        <div className="d-flex">
                            <Button
                                variant={'success'}
                                className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-success-600 p-2"
                                onClick={() => handleEditUser(row.id)}
                            >
                                <Icon icon="lucide:edit" />
                            </Button>
                            <Button
                                variant={'danger'}
                                className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-danger-600 p-2"
                                onClick={() => handleDeleteUser(row.id)}
                            >
                                <Icon icon="mingcute:delete-2-line" />
                            </Button>
                        </div>
                    ),
                },
            ] : [
                {
                    name: 'Action',
                    cell: row => (
                        <div className="d-flex">
                            <Button
                                variant={'success'}
                                className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center border-0 text-success-600 p-2"
                                onClick={() => handleEditUser(row.id)}
                            >
                                <Icon icon="lucide:edit" />
                            </Button>
                        </div>
                    ),
                },
            ]
        )

    ];

    const usersByDepartment = departments.reduce((acc, department) => {
        const deptUsers = filteredUsers
            .filter(user => user.departmentId === department.id)
            .sort((a, b) => a.name.localeCompare(b.name));  // Sort by name

        if (deptUsers.length > 0) {
            acc.push({
                departmentId: department.id,
                departmentName: department.name,
                users: deptUsers
            });
        }
        return acc;
    }, []);

    return (
        <>
            <Card className="basic-data-table py-3">
                <Card.Body>
                    {loading ? (
                        <CustomLoader size={'80px'} />
                    ) : (
                        <>
                            <div className="d-flex justify-content-end align-items-center mb-4">
                                <div className="d-flex gap-3 align-items-center">
                                    {searchComponent}
                                    {isAdmin && (
                                        <Button variant="primary" onClick={() => setShowModal(true)}>
                                            Add Staff
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {usersByDepartment.length === 0 ? (
                                <NoDataTable img={'../assets/images/no-data.svg'} text={'No Users Found!'} />
                            ) : (
                                usersByDepartment.map((deptGroup) => (
                                    <div key={deptGroup.departmentId} className="mb-5">
                                        <h5 className="mb-3 h6" style={{ fontSize: '18px' }}>{deptGroup.departmentName}</h5>
                                        <DataTable
                                            columns={columns}
                                            data={deptGroup.users}
                                            pagination
                                            paginationPerPage={15}
                                            highlightOnHover
                                            responsive
                                            striped
                                            fixedHeader
                                        />
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Create User Modal */}
            <Modal show={showModal} size='lg' centered onHide={handleCloseModal}>
                <Modal.Body>
                    <div className="margin-bottom-15">
                        <div className="d-flex justify-content-between">
                            <h5 className="margin-bottom-10 mt-3 modal-heading">{`Add User`}</h5>
                            <Icon icon="ci:close-circle" color='#dc3545' className={`cursor-pointer`} style={{ fontSize: '24px' }} onClick={handleCloseModal} />
                        </div>
                    </div>
                    <Form onSubmit={handleCreateUserSubmit}>
                        <Row>
                            <Col md='6'>
                                <Form.Group controlId="name" className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={userForm.name}
                                        placeholder='Enter Full Name'
                                        onChange={handleUserInputChange}
                                        className={`${userFormErrors.name && "error-field"}`}
                                    />
                                    {userFormErrors.name && (
                                        <div className="error-message">{userFormErrors.name}</div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md='6'>
                                <Form.Group controlId="email" className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={userForm.email}
                                        placeholder='Enter Email'
                                        onChange={handleUserInputChange}
                                        className={`${userFormErrors.email && "error-field"}`}
                                    />
                                    {userFormErrors.email && (
                                        <div className="error-message">{userFormErrors.email}</div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md='6'>
                                <Form.Group controlId="password" className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <div className="position-relative">
                                        <Form.Control
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={userForm.password}
                                            onChange={handleUserInputChange}
                                            className={`${userFormErrors.password ? "error-field" : ""}`}
                                            placeholder="Enter Your Password"
                                            style={{ paddingRight: '2.5rem' }}
                                        />
                                        <span
                                            className="position-absolute top-40 translate-middle-y cursor-pointer"
                                            style={{ right: '18px' }}
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <Icon icon={showPassword ? "charm:eye" : "charm:eye-slash"} />
                                        </span>
                                    </div>
                                    {userFormErrors.password && (
                                        <div className="error-message mt-2 text-danger">
                                            {userFormErrors.password}
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md='6'>
                                <Form.Group controlId="phone" className="mb-3">
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        value={userForm.phone}
                                        onChange={handleUserInputChange}
                                        placeholder="Enter Phone Number"
                                        className={`${userFormErrors.phone && "error-field"}`}
                                    />
                                    {userFormErrors.phone && (
                                        <div className="error-message">{userFormErrors.phone}</div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md='6'>
                                <Form.Group controlId="gen" className="mb-3">
                                    <Form.Label>Gender</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="gen"
                                        value={userForm.gen}
                                        onChange={handleUserInputChange}
                                        className={`${userFormErrors.gen && "error-field"}`}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </Form.Control>
                                    {userFormErrors.gen && (
                                        <div className="error-message">{userFormErrors.gen}</div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md='6'>
                                <Form.Group controlId="role" className="mb-3">
                                    <Form.Label>Role</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="roleId"
                                        value={userForm.roleId}
                                        onChange={handleUserInputChange}
                                        className={`${userFormErrors.roleId && "error-field"}`}
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </Form.Control>
                                    {userFormErrors.roleId && (
                                        <div className="error-message">{userFormErrors.roleId}</div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md='6'>
                                <Form.Group controlId="department" className="mb-3">
                                    <Form.Label>Department</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="departmentId"
                                        value={userForm.departmentId}
                                        onChange={handleUserInputChange}
                                        className={`${userFormErrors.departmentId && "error-field"}`}
                                    >
                                        <option value="">Select Department</option>
                                        {activeDepartments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </Form.Control>
                                    {userFormErrors.departmentId && (
                                        <div className="error-message">{userFormErrors.departmentId}</div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isUserLoading}
                            >
                                {isUserLoading ? "Saving..." : "Create User"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Update User Modal */}
            <Modal show={showUpdateModal} size='lg' centered onHide={handleCloseUpdateModal}>
                <Modal.Body>
                    <div className="margin-bottom-15">
                        <div className="d-flex justify-content-between">
                            <h5 className="margin-bottom-10 mt-3 modal-heading">{`Update User`}</h5>
                            <Icon icon="ci:close-circle" color='#dc3545' className={`cursor-pointer`} style={{ fontSize: '24px' }} onClick={handleCloseUpdateModal} />
                        </div>
                    </div>
                    <Form onSubmit={handleUpdateUserSubmit}>
                        <Row>
                            <Col md='6'>
                                <Form.Group controlId="updateName" className="mb-3">
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={updateForm.name}
                                        placeholder='Enter Full Name'
                                        onChange={handleUpdateInputChange}
                                        className={`${updateFormErrors.name && "error-field"}`}
                                    />
                                    {updateFormErrors.name && (
                                        <div className="error-message">{updateFormErrors.name}</div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md='6'>
                                <Form.Group controlId="updateEmail" className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={updateForm.email}
                                        placeholder='Enter Email'
                                        onChange={handleUpdateInputChange}
                                        className={`${updateFormErrors.email && "error-field"}`}
                                    />
                                    {updateFormErrors.email && (
                                        <div className="error-message">{updateFormErrors.email}</div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md='6'>
                                <Form.Group controlId="updatePhone" className="mb-3">
                                    <Form.Label>Phone</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="phone"
                                        value={updateForm.phone}
                                        onChange={handleUpdateInputChange}
                                        placeholder="Enter Phone Number"
                                        className={`${updateFormErrors.phone && "error-field"}`}
                                    />
                                    {updateFormErrors.phone && (
                                        <div className="error-message">{updateFormErrors.phone}</div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md='6'>
                                <Form.Group controlId="updateDepartment" className="mb-3">
                                    <Form.Label>Department</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="departmentId"
                                        value={updateForm.departmentId}
                                        onChange={handleUpdateInputChange}
                                        className={`${updateFormErrors.departmentId && "error-field"}`}
                                    >
                                        <option value="">Select Department</option>
                                        {activeDepartments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))}
                                    </Form.Control>
                                    {updateFormErrors.departmentId && (
                                        <div className="error-message">{updateFormErrors.departmentId}</div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md='6'>
                                <Form.Group controlId="updateRole" className="mb-3">
                                    <Form.Label>Role</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="roleId"
                                        value={updateForm.roleId}
                                        onChange={handleUpdateInputChange}
                                        className={`${updateFormErrors.roleId && "error-field"}`}
                                    >
                                        <option value="">Select Role</option>
                                        {roles.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </Form.Control>
                                    {updateFormErrors.roleId && (
                                        <div className="error-message">{updateFormErrors.roleId}</div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md='6'>
                                <Form.Group controlId="updategen" className="mb-3">
                                    <Form.Label>Gender</Form.Label>
                                    <Form.Control
                                        as="select"
                                        name="gen"
                                        value={updateForm.gen}
                                        onChange={handleUpdateInputChange}
                                        className={`${updateFormErrors.gen && "error-field"}`}
                                    >
                                        <option value="">Select Role</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </Form.Control>
                                    {updateFormErrors.gen && (
                                        <div className="error-message">{updateFormErrors.gen}</div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={handleCloseUpdateModal}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isUserLoading}
                            >
                                {isUserLoading ? "Updating..." : "Update User"}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default UsersLayer;