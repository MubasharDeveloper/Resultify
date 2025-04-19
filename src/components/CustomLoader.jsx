import React from 'react';

export function CustomLoader(prop) {
    return (
        <div className='d-flex justify-content-center my-5'>
            <div id="custom-loader" style={{ width: prop.size, height: prop.size }}></div>
        </div>
    )
}

export function BodyLoader() {
    return (
        <div id='body-loader'>
            <div id="loader"></div>
        </div>
    )
}

export function BodyLoading() {
    return (
        <div id='body-loading'>
            <div id="loader"></div>
        </div>
    )
}
