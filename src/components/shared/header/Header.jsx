import React, { useContext, useEffect, useRef, useState } from "react";
import {
  FiAlignLeft,
  FiArrowLeft,
  FiArrowRight,
  FiChevronRight,
  FiMaximize,
  FiMinimize,
  FiMoon,
  FiPlus,
  FiSun,
  FiChevronDown,
  FiFilter,
} from "react-icons/fi";
import LanguagesModal from "./LanguagesModal";
import NotificationsModal from "./NotificationsModal";
import ProfileModal from "./ProfileModal";
import SearchModal from "./SearchModal";
import TimesheetsModal from "./TimesheetsModal";
import HeaderDropDownModal from "./HeaderDropDownModal";
import MegaMenu from "./megaManu/MegaMenu";
import { NavigationContext } from "../../../contentApi/navigationProvider";
import { CompanyContext } from "../../../contentApi/CompanyProvider";
import { Dropdown } from "react-bootstrap";

const Header = () => {
  const { navigationOpen, setNavigationOpen } = useContext(NavigationContext);
  const [openMegaMenu, setOpenMegaMenu] = useState(false);
  const [navigationExpend, setNavigationExpend] = useState(false);
  const miniButtonRef = useRef(null);
  const expendButtonRef = useRef(null);
  const { selectedCompany, setSelectedCompany } = useContext(CompanyContext);

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
    // You can add API calls, context update, or page reload here if needed
    console.log("Selected Company:", e.target.value);
  };

  useEffect(() => {
    if (openMegaMenu) {
      document.documentElement.classList.add("nxl-lavel-mega-menu-open");
    } else {
      document.documentElement.classList.remove("nxl-lavel-mega-menu-open");
    }
  }, [openMegaMenu]);

  const handleThemeMode = (type) => {
    if (type === "dark") {
      document.documentElement.classList.add("app-skin-dark");
      localStorage.setItem("skinTheme", "dark");
    } else {
      document.documentElement.classList.remove("app-skin-dark");
      localStorage.setItem("skinTheme", "light");
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const newWindowWidth = window.innerWidth;
      if (newWindowWidth <= 1024) {
        document.documentElement.classList.remove("minimenu");
        document.querySelector(".navigation-down-1600").style.display = "none";
      } else if (newWindowWidth >= 1025 && newWindowWidth <= 1400) {
        document.documentElement.classList.add("minimenu");
        document.querySelector(".navigation-up-1600").style.display = "none";
        document.querySelector(".navigation-down-1600").style.display = "block";
      } else {
        document.documentElement.classList.remove("minimenu");
        document.querySelector(".navigation-up-1600").style.display = "block";
        document.querySelector(".navigation-down-1600").style.display = "none";
      }
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    const savedSkinTheme = localStorage.getItem("skinTheme");
    handleThemeMode(savedSkinTheme);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleNavigationExpendUp = (e, pram) => {
    e.preventDefault();
    if (pram === "show") {
      setNavigationExpend(true);
      document.documentElement.classList.add("minimenu");
    } else {
      setNavigationExpend(false);
      document.documentElement.classList.remove("minimenu");
    }
  };

  const handleNavigationExpendDown = (e, pram) => {
    e.preventDefault();
    if (pram === "show") {
      setNavigationExpend(true);
      document.documentElement.classList.remove("minimenu");
    } else {
      setNavigationExpend(false);
      document.documentElement.classList.add("minimenu");
    }
  };

  const fullScreenMaximize = () => {
    const elem = document.documentElement;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }

    document.documentElement.classList.add("fsh-infullscreen");
    document.querySelector("body").classList.add("full-screen-helper");
  };
  const fullScreenMinimize = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    document.documentElement.classList.remove("fsh-infullscreen");
    document.querySelector("body").classList.remove("full-screen-helper");
  };

  return (
    <header className="nxl-header">
      <div className="header-wrapper">
        {/* <!--! [Start] Header Left !--> */}
        <div className="header-left d-flex align-items-center gap-4">
          {/* <!--! [Start] nxl-head-mobile-toggler !--> */}
          <a
            href="#"
            className="nxl-head-mobile-toggler"
            onClick={(e) => {
              e.preventDefault(), setNavigationOpen(true);
            }}
            id="mobile-collapse"
          >
            <div
              className={`hamburger hamburger--arrowturn ${
                navigationOpen ? "is-active" : ""
              }`}
            >
              <div className="hamburger-box">
                <div className="hamburger-inner"></div>
              </div>
            </div>
          </a>
          {/* <!--! [Start] nxl-head-mobile-toggler !-->
                    <!--! [Start] nxl-navigation-toggle !--> */}
          <div className="nxl-navigation-toggle navigation-up-1600">
            <a
              href="#"
              onClick={(e) => handleNavigationExpendUp(e, "show")}
              id="menu-mini-button"
              ref={miniButtonRef}
              style={{ display: navigationExpend ? "none" : "block" }}
            >
              <FiAlignLeft size={24} />
            </a>
            <a
              href="#"
              onClick={(e) => handleNavigationExpendUp(e, "hide")}
              id="menu-expend-button"
              ref={expendButtonRef}
              style={{ display: navigationExpend ? "block" : "none" }}
            >
              <FiArrowRight size={24} />
            </a>
          </div>
          <div className="nxl-navigation-toggle navigation-down-1600">
            <a
              href="#"
              onClick={(e) => handleNavigationExpendDown(e, "hide")}
              id="menu-mini-button"
              ref={miniButtonRef}
              style={{ display: navigationExpend ? "block" : "none" }}
            >
              <FiAlignLeft size={24} />
            </a>
            <a
              href="#"
              onClick={(e) => handleNavigationExpendDown(e, "show")}
              id="menu-expend-button"
              ref={expendButtonRef}
              style={{ display: navigationExpend ? "none" : "block" }}
            >
              <FiArrowRight size={24} />
            </a>
          </div>
          {/* <!--! [End] nxl-navigation-toggle !-->
                    <!--! [Start] nxl-lavel-mega-menu-toggle !--> */}
          <div className="nxl-lavel-mega-menu-toggle d-flex d-lg-none">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault(), setOpenMegaMenu(true);
              }}
              id="nxl-lavel-mega-menu-open"
            >
              <FiAlignLeft size={24} />
            </a>
          </div>
          {/* <!--! [End] nxl-lavel-mega-menu-toggle !-->
                    <!--! [Start] nxl-lavel-mega-menu !--> */}
          <div className="nxl-drp-link nxl-lavel-mega-menu">
            <div className="nxl-lavel-mega-menu-toggle d-flex d-lg-none">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault(), setOpenMegaMenu(false);
                }}
                id="nxl-lavel-mega-menu-hide"
              >
                <i className="me-2">
                  <FiArrowLeft />
                </i>
                <span>Back</span>
              </a>
            </div>
            {/* <!--! [Start] nxl-lavel-mega-menu-wrapper !--> */}
            <div className="nxl-lavel-mega-menu-wrapper d-flex gap-3">
              {/* <HeaderDropDownModal /> */}
              {/* <MegaMenu /> */}
            </div>
          </div>
        </div>
        {/* <!--! [End] Header Left !-->
                <!--! [Start] Header Right !--> */}
        <div className="header-right ms-auto">
          <div className="d-flex align-items-center">
            {/* <SearchModal /> */}
            {/* <LanguagesModal /> */}
            {/* <div className="nxl-h-item d-none d-sm-flex" >
                            <div className="full-screen-switcher">
                                <span className="nxl-head-link me-0">
                                    <FiMaximize size={20} className="maximize" onClick={fullScreenMaximize} />
                                    <FiMinimize size={20} className="minimize" onClick={fullScreenMinimize} />
                                </span>
                            </div>
                        </div> */}
            <div className="nxl-h-item company-dropdown">
              <div style={{ marginRight: "1rem", position: "relative" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    {selectedCompany.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ position: "relative" }}>
                    <select
                      style={{
                        appearance: "none",
                        background: "transparent",
                        border: "none",
                        color: "black",
                        fontWeight: "600",
                        paddingRight: "32px",
                        cursor: "pointer",
                        outline: "none",
                        fontSize: "14px",
                        transition: "color 0.2s ease",
                      }}
                      value={selectedCompany}
                      onChange={handleCompanyChange}
                    >
                      <option value="aahaas">Aahaas</option>
                      <option value="appleholidays">Apple Holidays</option>
                      <option value="shirmila">Sharmila Travels</option>
                    </select>
                    <div
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                        color: "black",
                        transition: "color 0.2s ease",
                      }}
                    >
                      <FiChevronDown size={16} />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    bottom: "-4px",
                    height: "2px",
                    background:
                      "linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(139,92,246,1) 100%)",
                    width: "0",
                    transition: "width 0.3s ease",
                  }}
                ></div>
              </div>
            </div>

            {/* <Dropdown style={{ position: "relative", marginRight: "1rem" }}>
  <Dropdown.Toggle
    variant="light"
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      border: "none",
      background: "transparent",
      fontWeight: "600",
      fontSize: "14px",
      color: "#000",
      paddingRight: "32px",
      cursor: "pointer",
      outline: "none",
      boxShadow: "none",
    }}
  >
    <FiFilter size={16} />
    Filter Period
    <FiChevronDown
      size={16}
      style={{
        position: "absolute",
        right: "8px",
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
      }}
    />
  </Dropdown.Toggle>

  <Dropdown.Menu
    style={{
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
      borderRadius: "6px",
      padding: "0.5rem 0",
    }}
  >
    <Dropdown.Item>Today</Dropdown.Item>
    <Dropdown.Item>This Week</Dropdown.Item>
    <Dropdown.Item>This Month</Dropdown.Item>
    <Dropdown.Item>This Quarter</Dropdown.Item>
    <Dropdown.Item>Custom Range</Dropdown.Item>
  </Dropdown.Menu>
</Dropdown> */}
            {/* <div className="nxl-h-item company-dropdown">
              <div className="me-4">
                <select
                  className="form-select"
                  value={selectedCompany}
                  onChange={handleCompanyChange}
                  style={{
                    border: "none",
                    background: "gray",
                    fontWeight: "bold",
                    paddingRight: "25px",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 10l5 5 5-5H7z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1rem",
                    color: "white",
                  }}
                >
                  <option value="aahaas">Aahaas</option>
                  <option value="appleholidays">Apple Holidays</option>
                  <option value="shirmila">Shirmila Travels</option>
                </select>
              </div>
            </div> */}
            {/* 
            <div className="nxl-h-item dark-light-theme">
              <div
                className="nxl-head-link me-0 dark-button"
                onClick={() => handleThemeMode("dark")}
              >
                <FiMoon size={20} />
              </div>
              <div
                className="nxl-head-link me-0 light-button"
                onClick={() => handleThemeMode("light")}
                style={{ display: "none" }}
              >
                <FiSun size={20} />
              </div>
            </div> */}
            {/* <TimesheetsModal />
                        <NotificationsModal /> */}
            <ProfileModal />
          </div>
        </div>
        {/* <!--! [End] Header Right !--> */}
      </div>
    </header>
  );
};

export default Header;
