import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Button } from 'react-bootstrap';
// import ThemeToggleButton from "../helper/ThemeToggleButton";
import { useAuth } from "../context/AuthContext";

const MasterLayout = ({ children }) => {
  let [sidebarActive, seSidebarActive] = useState(false);
  let [mobileMenu, setMobileMenu] = useState(false);
  const location = useLocation(); // Hook to get the current route
  const { user, logout } = useAuth();


  useEffect(() => {
    const handleDropdownClick = (event) => {
      event.preventDefault();
      const clickedLink = event.currentTarget;
      const clickedDropdown = clickedLink.closest(".dropdown");

      if (!clickedDropdown) return;

      const isActive = clickedDropdown.classList.contains("open");

      // Close all dropdowns
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
        const submenu = dropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = "0px"; // Collapse submenu
        }
      });

      // Toggle the clicked dropdown
      if (!isActive) {
        clickedDropdown.classList.add("open");
        const submenu = clickedDropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
        }
      }
    };

    // Attach click event listeners to all dropdown triggers
    const dropdownTriggers = document.querySelectorAll(
      ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link"
    );

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener("click", handleDropdownClick);
    });

    const openActiveDropdown = () => {
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        const submenuLinks = dropdown.querySelectorAll(".sidebar-submenu li a");
        submenuLinks.forEach((link) => {
          if (
            link.getAttribute("href") === location.pathname ||
            link.getAttribute("to") === location.pathname
          ) {
            dropdown.classList.add("open");
            const submenu = dropdown.querySelector(".sidebar-submenu");
            if (submenu) {
              submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
            }
          }
        });
      });
    };

    // Open the submenu that contains the active route
    openActiveDropdown();

    // Cleanup event listeners on unmount
    return () => {
      dropdownTriggers.forEach((trigger) => {
        trigger.removeEventListener("click", handleDropdownClick);
      });
    };
  }, [location.pathname]);

  let sidebarControl = () => {
    seSidebarActive(!sidebarActive);
  };

  let mobileMenuControl = () => {
    setMobileMenu(!mobileMenu);
  };

  return (
    <section className={mobileMenu ? "overlay active" : "overlay "}>
      {/* sidebar */}
      <aside
        className={
          sidebarActive
            ? "sidebar active "
            : mobileMenu
              ? "sidebar sidebar-open"
              : "sidebar"
        }
      >
        <button
          onClick={mobileMenuControl}
          type='button'
          className='sidebar-close-btn'
        >
          <Icon icon='radix-icons:cross-2' />
        </button>
        <div>
          <Link to='/' className='sidebar-logo'>
            <img
              src='assets/images/logo.png'
              alt='site logo'
              className='light-logo'
            />
            <img
              src='assets/images/logo-light.png'
              alt='site logo'
              className='dark-logo'
            />
            <img
              src='assets/images/logo-icon.png'
              alt='site logo'
              className='logo-icon'
            />
          </Link>
        </div>
        <div className='sidebar-menu-area'>
          <ul className='sidebar-menu' id='sidebar-menu'>
            {
              user.roleName === 'Admin' ? (
                <>
                  <li className='sidebar-menu-group-title'>Supper Admin</li>
                  <li>
                    <NavLink
                      to='/admin-dashboard'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon
                        icon='tabler:brand-tabler'
                        className='menu-icon'
                      />
                      <span>Admin Dashboard</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/departments'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler:building-skyscraper' className='menu-icon' />
                      <span>Departments</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/batches'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler:color-swatch' className='menu-icon' />
                      <span>Batch</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/manage-users'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler:user-square-rounded' className='menu-icon' />
                      <span>Staff</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/manage-requests'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler:login-2' className='menu-icon' />
                      <span>Login Requests</span>
                    </NavLink>
                  </li>
                </>
              ) : user.roleName === 'HOD' ? (
                <>
                  <li className='sidebar-menu-group-title'>Head of Department (HOD)</li>
                  <li>
                    <NavLink
                      to='/hod-dashboard'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon
                        icon='tabler:brand-tabler'
                        className='menu-icon'
                      />
                      <span>HOD Dashboard</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/batches'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler:color-swatch' className='menu-icon' />
                      <span>Batch</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/subjects'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler:book-2' className='menu-icon' />
                      <span>Subjects</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/semesters'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler:calendar-week' className='menu-icon' />
                      <span>Semesters</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/manage-users'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler:user-square-rounded' className='menu-icon' />
                      <span>Staff</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/leactures'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler:freeze-column' className='menu-icon' />
                      <span>Leactures</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/add-students'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler:school' className='menu-icon' />
                      <span>Admissions</span>
                    </NavLink>
                  </li>
                </>
              ) : user.roleName === 'Teacher' ? (
                ''
              ) : user.roleName === 'Data Operator' && (
                <>
                  <li className='sidebar-menu-group-title'>Data Operator</li>
                  <li>
                    <NavLink
                      to='/dashboard'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon
                        icon='tabler:brand-tabler'
                        className='menu-icon'
                      />
                      <span>Dashboard</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/add-students'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler:school' className='menu-icon' />
                      <span>Admissions</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to='/subjects'
                      className={(navData) => (navData.isActive ? "active-page" : "")}
                    >
                      <Icon icon='tabler-book-2' className='menu-icon' />
                      <span>Subjects</span>
                    </NavLink>
                  </li>
                </>
              )
            }
            <li className='sidebar-menu-group-title'>Settings</li>
            <li>
              <NavLink
                to='/profile'
                className={(navData) => (navData.isActive ? "active-page" : "")}
              >
                <Icon
                  icon='tabler:user-square-rounded'
                  className='menu-icon'
                />
                <span>My Profile</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                onClick={logout}
                className={'text-danger text-white:hover'}
              >
                <Icon
                  icon='tabler:logout'
                  className='menu-icon'
                />
                <span>Logout</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>

      <main
        className={sidebarActive ? "dashboard-main active" : "dashboard-main"}
      >
        <div className='navbar-header'>
          <div className='row align-items-center justify-content-between'>
            <div className='col-auto'>
              <div className='d-flex flex-wrap align-items-center gap-4'>
                <button
                  type='button'
                  className='sidebar-toggle'
                  onClick={sidebarControl}
                >
                  <Icon
                    icon='heroicons:bars-3-solid'
                    className='icon text-2xl non-active '
                  />
                </button>
                <button
                  onClick={mobileMenuControl}
                  type='button'
                  className='sidebar-mobile-toggle'
                >
                  <Icon icon='heroicons:bars-3-solid' className='icon' />
                </button>
                <form className='navbar-search'>
                  <input type='text' name='search' placeholder='Search' />
                  <Icon icon='tabler:search' className='icon' />
                </form>
              </div>
            </div>
            <div className='col-auto'>
              <div className='d-flex flex-wrap align-items-center gap-3'>
                {/* Notification dropdown end */}
                <div className='dropdown'>
                  <button
                    className='d-flex justify-content-center align-items-center rounded-circle'
                    type='button'
                    data-bs-toggle='dropdown'
                  >
                    <img
                      src={user?.gen ? `assets/images/${user.gen}-user.png` : 'assets/images/user.jpg'}
                      alt='image_user'
                      className='w-40-px h-40-px object-fit-cover rounded-circle'
                    />
                  </button>
                  <div className='dropdown-menu to-top dropdown-menu-sm'>
                    {
                      user && (
                        <div className='py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2'>
                          <div>
                            <h6 className='text-lg text-primary-light fw-semibold mb-2'>
                              {user.name}
                            </h6>
                            <span className='text-secondary-light fw-medium text-sm'>
                              {user.roleName}
                            </span>
                          </div>
                          <button type='button' className='hover-text-danger'>
                            <Icon
                              icon='radix-icons:cross-1'
                              className='icon text-xl'
                            />
                          </button>
                        </div>
                      )
                    }

                    <ul className='to-top-list'>
                      {
                        user && (
                          <>
                            <li>
                              <Link
                                className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                                to='/profile'
                              >
                                <Icon
                                  icon='tabler:user-square-rounded'
                                  className='icon text-xl'
                                />{" "}
                                My Profile
                              </Link>
                            </li>
                          </>
                        )
                      }
                      {
                        user ? (
                          <li>
                            <Button
                              className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3'
                              onClick={logout}
                            >
                              <Icon icon='tabler:logout' className='icon text-xl' />{" "}
                              Log Out
                            </Button>
                          </li>
                        ) : (
                          <li>
                            <Link
                              className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3'
                              to='/sign-in'
                            >
                              <Icon icon='lucide:power' className='icon text-xl' />{" "}
                              Log In
                            </Link>
                          </li>
                        )
                      }
                    </ul>
                  </div>
                </div>
                {/* Profile dropdown end */}
              </div>
            </div>
          </div>
        </div>

        {/* dashboard-main-body */}
        <div className='dashboard-main-body'>{children}</div>

        {/* Footer section */}
        {/* <footer className='d-footer'>
          <div className='row align-items-center justify-content-between'>
            <div className='col-auto'>
              <p className='mb-0'>© 2024 WowDash. All Rights Reserved.</p>
            </div>
            <div className='col-auto'>
              <p className='mb-0'>
                Made by <span className='text-primary-600'>wowtheme7</span>
              </p>
            </div>
          </div>
        </footer> */}
      </main>
    </section>
  );
};

export default MasterLayout;
