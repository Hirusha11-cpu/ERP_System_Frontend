import React, { Fragment, useState } from 'react'
import { FiActivity, FiBell, FiChevronRight, FiDollarSign, FiLogOut, FiSettings, FiUser, FiX, FiEdit } from "react-icons/fi"
import { useNavigate } from 'react-router-dom'
import { useUser } from "../../../contentApi/UserProvider";

const activePosition = ["Active", "Always", "Bussy", "Inactive", "Disabled", "Cutomization"]
const subscriptionsList = ["Plan", "Billings", "Referrals", "Payments", "Statements", "Subscriptions"]

const ProfileModal = () => {
    const { user, company, role } = useUser();
    const navigate = useNavigate();
    const [showProfileModal, setShowProfileModal] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        navigate('/login');
    }

    const openProfileModal = (e) => {
        e.preventDefault();
        setShowProfileModal(true);
    }

    const closeProfileModal = () => {
        setShowProfileModal(false);
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return (
        <>
            <div className="dropdown nxl-h-item">
                <a href="#" data-bs-toggle="dropdown" role="button" data-bs-auto-close="outside">
                    <img src="/images/avatar/new_user.jpg" alt="user-image" className="img-fluid user-avtar me-0" />
                </a>
                <div className="dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-user-dropdown">
                    <div className="dropdown-header">
                        <div className="d-flex align-items-center">
                            <img src="/images/avatar/new_user.jpg" alt="user-image" className="img-fluid user-avtar" />
                            <div>
                                <h6 className="text-dark mb-0">{user?.name} <span className="badge bg-soft-success text-success ms-1"></span></h6>
                                <span className="fs-12 fw-medium text-muted">{user?.email}</span>
                            </div>
                        </div>
                    </div>
                    {/* <div className="dropdown">
                        <a href="#" className="dropdown-item" data-bs-toggle="dropdown">
                            <span className="hstack">
                                <i className="wd-10 ht-10 border border-2 border-gray-1 bg-success rounded-circle me-2"></i>
                                <span>Active</span>
                            </span>
                            <i className="ms-auto me-0"><FiChevronRight /></i>
                        </a>
                        <div className="dropdown-menu user-active">
                            {
                                activePosition.map((item, index) => {
                                    return (
                                        <Fragment key={index}>
                                            {index === activePosition.length - 1 && <div className="dropdown-divider"></div>}
                                            <a href="#" className="dropdown-item">
                                                <span className="hstack">
                                                    <i className={`wd-10 ht-10 border border-2 border-gray-1 rounded-circle me-2 ${getColor(item)}`}></i>
                                                    <span>{item}</span>
                                                </span>
                                            </a>
                                        </Fragment>
                                    )
                                })
                            }
                        </div>
                    </div> */}
                    <div className="dropdown-divider"></div>
                    
                    <a href="#" className="dropdown-item" onClick={openProfileModal}>
                        <i><FiUser /></i>
                        <span>Profile Details</span>
                    </a>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button className="dropdown-item" onClick={handleLogout}>
                        <i><FiLogOut /></i>
                        <span>Logout</span>
                    </button>
                </div> 
            </div>

            {/* Profile Details Modal */}
            {showProfileModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fs-18 fw-bold">Profile Details</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeProfileModal}
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    {/* User Information */}
                                    <div className="col-md-6">
                                        <div className="card border-0 bg-light">
                                            <div className="card-body">
                                                <h6 className="fw-bold text-primary mb-3">Personal Information</h6>
                                                <div className="mb-3">
                                                    <label className="fs-12 fw-medium text-muted mb-1">Full Name</label>
                                                    <p className="fs-14 fw-semibold mb-0">{user?.name || 'N/A'}</p>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="fs-12 fw-medium text-muted mb-1">Email Address</label>
                                                    <p className="fs-14 fw-semibold mb-0">{user?.email || 'N/A'}</p>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="fs-12 fw-medium text-muted mb-1">Member Since</label>
                                                    <p className="fs-14 fw-semibold mb-0">{formatDate(user?.created_at)}</p>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="fs-12 fw-medium text-muted mb-1">Last Updated</label>
                                                    <p className="fs-14 fw-semibold mb-0">{formatDate(user?.updated_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Company Information */}
                                    <div className="col-md-6">
                                        <div className="card border-0 bg-light">
                                            <div className="card-body">
                                                <h6 className="fw-bold text-primary mb-3">Company Information</h6>
                                                <div className="mb-3">
                                                    <label className="fs-12 fw-medium text-muted mb-1">Company Name</label>
                                                    <p className="fs-14 fw-semibold mb-0">{company?.name || 'N/A'}</p>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="fs-12 fw-medium text-muted mb-1">Company Email</label>
                                                    <p className="fs-14 fw-semibold mb-0">{company?.email || 'N/A'}</p>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="fs-12 fw-medium text-muted mb-1">Company Phone</label>
                                                    <p className="fs-14 fw-semibold mb-0">{company?.phone || 'N/A'}</p>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="fs-12 fw-medium text-muted mb-1">Company Address</label>
                                                    <p className="fs-14 fw-semibold mb-0">{company?.address || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role & Additional Information */}
                                    <div className="col-12 mt-3">
                                        <div className="card border-0 bg-light">
                                            <div className="card-body">
                                                <h6 className="fw-bold text-primary mb-3">Role & System Information</h6>
                                                <div className="row">
                                                    <div className="col-md-4">
                                                        <div className="mb-3">
                                                            <label className="fs-12 fw-medium text-muted mb-1">User Role</label>
                                                            <p className="fs-14 fw-semibold mb-0 text-capitalize">{role?.name || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-3">
                                                            <label className="fs-12 fw-medium text-muted mb-1">Department</label>
                                                            <p className="fs-14 fw-semibold mb-0">{user?.department_id ? `Department ${user.department_id}` : 'Not assigned'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="mb-3">
                                                            <label className="fs-12 fw-medium text-muted mb-1">Account Status</label>
                                                            <span className="badge bg-success fs-11">Active</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Company Additional Details */}
                                                <div className="row mt-2">
                                                    <div className="col-md-6">
                                                        <div className="mb-2">
                                                            <label className="fs-11 fw-medium text-muted mb-1">GSTIN</label>
                                                            <p className="fs-12 fw-semibold mb-0">{company?.gstin || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="mb-2">
                                                            <label className="fs-11 fw-medium text-muted mb-1">Service Tax No</label>
                                                            <p className="fs-12 fw-semibold mb-0">{company?.service_tax_no || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-2">
                                                    <label className="fs-11 fw-medium text-muted mb-1">Account Details</label>
                                                    <p className="fs-12 fw-semibold mb-0">{company?.account_details || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeProfileModal}
                                >
                                    Close
                                </button>
                                {/* <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        // Add edit functionality here
                                        console.log('Edit profile clicked');
                                    }}
                                >
                                    <FiEdit className="me-1" />
                                    Edit Profile
                                </button> */}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Styles */}
            <style jsx>{`
                .modal {
                    backdrop-filter: blur(5px);
                }
                .modal-header {
                    border-bottom: 1px solid #ecf0f1;
                    padding: 1rem 1.5rem;
                }
                .modal-footer {
                    border-top: 1px solid #ecf0f1;
                    padding: 1rem 1.5rem;
                }
                .card {
                    border-radius: 10px;
                }
                .bg-light {
                    background-color: #f8f9fa !important;
                }
            `}</style>
        </>
    )
}

export default ProfileModal

const getColor = (item) => {
    switch (item) {
        case "Always":
            return "always_clr"
        case "Bussy":
            return "bussy_clr"
        case "Inactive":
            return "inactive_clr"
        case "Disabled":
            return "disabled_clr"
        case "Cutomization":
            return "cutomization_clr"
        default:
            return "active-clr";
    }
}