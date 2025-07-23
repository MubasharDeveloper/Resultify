import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";

const ErrorLayer = () => {
  return (
    <div className='card basic-data-table' style={{ minHeight: '100vh' }}>
      <div className='card-body py-80 px-32 text-center d-flex flex-column justify-content-center align-items-center w-100' style={{ minHeight: '100vh' }}>
        <img src='assets/images/error-img.svg' alt='' className='mb-24' style={{ maxWidth: '300px' }} />
        <h6 className='mb-16 fs-42 fw-500'>Page not Found</h6>
        <p className='text-secondary-light'>
          Sorry, the page you are looking for doesn’t exist{" "}
        </p>
        <Link to='/' className='btn btn-primary btn-sm btn-primary-custom'>
          <Icon icon='tabler:chevron-left' />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default ErrorLayer;
