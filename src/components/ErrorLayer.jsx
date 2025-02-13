import React from "react";
import { Link } from "react-router-dom";

const ErrorLayer = () => {
  const ErrorBtn = {
    margin: '0 auto', maxWidth: "fit-content", maxHeight: "fit-content"
  };
  const ErrorInnerDiv = {
    display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'
  };
  const ErrorDiv = {
    minHeight: '100vh'
  };
  const ErrorImg = {
    maxWidth: '350px', width: '100%'
  };
  return (
    <div className='card basic-data-table' style={ErrorDiv}>
      <div className='card-body text-center' style={ErrorInnerDiv}>
        <img src='assets/images/error-img.png' alt='' style={ErrorImg} />
        <h6 className='mb-16'>Page not Found</h6>
        <p className='text-secondary-light'>
          Sorry, the page you are looking for doesn’t exist{" "}
        </p>
        <Link to='/' className='btn btn-primary-600 radius-8 px-20 py-11' style={ErrorBtn}>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default ErrorLayer;
