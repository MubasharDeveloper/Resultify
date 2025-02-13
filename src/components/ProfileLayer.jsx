const ProfileLayer = () => {
    const ProfileBannerImg = {
        maxHeight: '250px'
    };
    const ProfileImg = {
        boxShadow: '0 0 16px 1px'
    };
    return (
        <div className="container">
            <div className="user-grid-card position-relative border radius-16 overflow-hidden bg-base h-100">
                <img
                    src="assets/images/user-grid/user-grid-360-120.jpg"
                    alt=""
                    className="w-100 object-fit-cover"
                    style={ProfileBannerImg}
                />
                <div className="pb-24 ms-16 mb-24 me-16  mt--100">
                    <div className="text-center border border-top-0 border-start-0 border-end-0">
                        <img
                            src="assets/images/avatar/avatar.png"
                            alt=""
                            className="border br-white border-width-2-px w-200-px h-200-px rounded-circle object-fit-cover bg-white"
                            style={ProfileImg}
                        />
                        <h6 className="mb-0 mt-16">RankUp</h6>
                        <span className="text-secondary-light mb-16">RankUp@gmail.com</span>
                    </div>
                    <div className="mt-24">
                        <h6 className="text-xl mb-16">Personal Info</h6>
                        <ul>
                            <li className="d-flex align-items-center gap-1 mb-12">
                                <span className="w-30 text-md fw-semibold text-primary-light">
                                    Full Name
                                </span>
                                <span className="w-70 text-secondary-light fw-medium">
                                    : Mubashar Ahmad
                                </span>
                            </li>
                            <li className="d-flex align-items-center gap-1 mb-12">
                                <span className="w-30 text-md fw-semibold text-primary-light">
                                    {" "}
                                    Email
                                </span>
                                <span className="w-70 text-secondary-light fw-medium">
                                    : mubashar@gmail.com
                                </span>
                            </li>
                            <li className="d-flex align-items-center gap-1 mb-12">
                                <span className="w-30 text-md fw-semibold text-primary-light">
                                    {" "}
                                    Phone Number
                                </span>
                                <span className="w-70 text-secondary-light fw-medium">
                                    : +92 304 6321166
                                </span>
                            </li>
                            <li className="d-flex align-items-center gap-1 mb-12">
                                <span className="w-30 text-md fw-semibold text-primary-light">
                                    {" "}
                                    Department
                                </span>
                                <span className="w-70 text-secondary-light fw-medium">
                                    : Development
                                </span>
                            </li>
                            <li className="d-flex align-items-center gap-1 mb-12">
                                <span className="w-30 text-md fw-semibold text-primary-light">
                                    {" "}
                                    Designation
                                </span>
                                <span className="w-70 text-secondary-light fw-medium">
                                    : FrontEnd Developer
                                </span>
                            </li>
                            <li className="d-flex align-items-center gap-1 mb-12">
                                <span className="w-30 text-md fw-semibold text-primary-light">
                                    {" "}
                                    Languages
                                </span>
                                <span className="w-70 text-secondary-light fw-medium">
                                    : React JS & Node JS
                                </span>
                            </li>
                            <li className="d-flex align-items-center gap-1">
                                <span className="w-30 text-md fw-semibold text-primary-light">
                                    {" "}
                                    Bio
                                </span>
                                <span className="w-70 text-secondary-light fw-medium">
                                    : Lorem Ipsum&nbsp;is simply dummy text of the printing and
                                    typesetting industry.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileLayer;