import React, { useContext, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiSunrise } from "react-icons/fi";
import PerfectScrollbar from "react-perfect-scrollbar";
import Menus from './Menus';
import { NavigationContext } from '../../../contentApi/navigationProvider';
import { CompanyContext } from '../../../contentApi/CompanyProvider';

const NavigationManu = () => {
    const { navigationOpen, setNavigationOpen } = useContext(NavigationContext)
    const { selectedCompany } = useContext(CompanyContext);
    const pathName = useLocation().pathname
    useEffect(() => {
        setNavigationOpen(false)
    }, [pathName])

     // Define logo URLs based on company
    const getLogo = () => {
      switch(selectedCompany) {
        case 'aahaas':
          return {
            lg: "https://s3-aahaas-prod-assets.s3.ap-southeast-1.amazonaws.com/images/aahaas.png",
            sm: "/images/logo/aahaas_small.jpg"
          };
        case 'appleholidays':
          return {
            lg: "/images/logo/appleholidays_extend.png",
            sm: "/images/logo/appleholidays_small.jpg"
          };
        case 'shirmila':
          return {
            lg: "https://jaffna.city/wp-content/uploads/2016/04/Sharmila-Travels.png",
            sm: "/images/logo/shirmila_travels.jpg"
          };
        default:
          return {
            lg: "https://s3-aahaas-prod-assets.s3.ap-southeast-1.amazonaws.com/images/aahaas.png",
            sm: "/images/logo-abbr.png"
          };
      }
    };
    
    const logos = getLogo();

    return (
        <nav className={`nxl-navigation ${navigationOpen ? "mob-navigation-active" : ""}`}>
            <div className="navbar-wrapper">
                <div className="m-header">
                    <Link to="/" className="b-brand">
                        {/* <!-- ========   change your logo hear   ============ --> */}
                        {/* <img src="/images/logo-full.png" alt="logo" className="logo logo-lg" />
                        <img src="/images/logo-abbr.png" alt="logo" className="logo logo-sm" /> */}
                        {/* <img src="https://s3-aahaas-prod-assets.s3.ap-southeast-1.amazonaws.com/images/aahaas.png" alt="logo" className="logo logo-lg" style={{ width: "150px" }} />
                        <img src="/images/logo-abbr.png" alt="logo" className="logo logo-sm" /> */}
                        <img src={logos.lg} alt="logo" className="logo logo-lg" style={{ width: "150px" }} />
                        <img src={logos.sm} alt="logo" className="logo logo-sm" />
                    </Link>
                </div>

                <div className={`navbar-content`}>
                    <PerfectScrollbar>
                        <ul className="nxl-navbar">
                            <li className="nxl-item nxl-caption">
                                <label>Navigation</label>
                            </li>
                            <Menus />
                        </ul>
                        {/* <div className="card text-center">
                            <div className="card-body">
                                <i className="fs-4 text-dark"><FiSunrise /></i>
                                <h6 className="mt-4 text-dark fw-bolder">Downloading Center</h6>
                                <p className="fs-11 my-3 text-dark">Duralux is a production ready CRM to get started up and running easily.</p>
                                <Link to="#" className="btn btn-primary text-dark w-100">Download Now</Link>
                            </div>
                        </div> */}
                        <div style={{ height: "18px" }}></div>
                    </PerfectScrollbar>
                </div>
            </div>
            <div onClick={() => setNavigationOpen(false)} className={`${navigationOpen ? "nxl-menu-overlay" : ""}`}></div>
        </nav>
    )
}

export default NavigationManu