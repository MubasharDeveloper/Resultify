import React from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Breadcrumb = ({ title}) => {
  const { user } = useAuth();
  const link = user.rootLink
  return (
    <div className='d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24'>
      {/* <h6 className='fw-semibold mb-0'>{title}</h6> */}
      <ul className='d-flex align-items-center gap-2'>
        <li className='fw-medium'>
          <Link
            to={link}
            className='d-flex align-items-center gap-1 hover-text-primary'
          >
            <Icon
              icon='tabler:layout-dashboard'
              className='icon text-lg'
            />
            Dashboard
          </Link>
        </li>
        <li> / </li>
        <li className='fw-medium'>{title}</li>
      </ul>
    </div>
  );
};

export default Breadcrumb;
