import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";

const AccessDeniedLayer = () => {
  return (
    <div className='card basic-data-table' style={{ minHeight: '100vh' }}>
      <div className='card-body py-80 px-32 text-center d-flex flex-column justify-content-center align-items-center w-100' style={{ minHeight: '100vh' }}>
        <img src='assets/images/access-fail.svg' alt='' className='mb-24' style={{ maxWidth: '300px' }} />
        <h6 className='mb-16 fs-42 fw-500'>Access Denied</h6>
        <p className='text-secondary-light' style={{maxWidth: 520}}>
          You don't have authorization to get to this page. If it's not too
          much trouble, contact your site executive to demand access.
        </p>
        <Link to='/' className='btn btn-primary btn-sm btn-primary-custom'>
          <Icon icon='tabler:chevron-left' />
          Go Back To Home
        </Link>
      </div>
    </div>
  );
};

export default AccessDeniedLayer;
