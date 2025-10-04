import React, { Fragment, useEffect, useState, useContext } from "react";
import { FiChevronRight } from "react-icons/fi";
import { Link, useLocation } from "react-router-dom";
import { menuList } from "@/utils/fackData/menuList";
import getIcon from "@/utils/getIcon";
import { CompanyContext } from "../../../contentApi/CompanyProvider";

const Menus = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubDropdown, setOpenSubDropdown] = useState(null);
  const [activeParent, setActiveParent] = useState("");
  const [activeChild, setActiveChild] = useState("");
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const [filteredMenu, setFilteredMenu] = useState([]);
  const pathName = useLocation().pathname;
  
  const handleMainMenu = (e, name) => {
    if (openDropdown === name) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(name);
    }
  };

  const handleDropdownMenu = (e, name) => {
    e.stopPropagation();
    if (openSubDropdown === name) {
      setOpenSubDropdown(null);
    } else {
      setOpenSubDropdown(name);
    }
  };

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };
    const currentCompanyNo =
      companyMap[selectedCompany?.toLowerCase()] || null;
    setCompanyNo(currentCompanyNo);

    // Filter menu dynamically
    const menu = menuList.map((menuItem) => ({
      ...menuItem,
      dropdownMenu:
        currentCompanyNo === 3
          ? menuItem.dropdownMenu.filter((item) => item.name !== "Create Invoice" || item.name !== "PnL Report")
          : menuItem.dropdownMenu,
    }));

    setFilteredMenu(menu);
  }, [selectedCompany]);

  useEffect(() => {
    if (pathName !== "/") {
      const x = pathName.split("/");
      setActiveParent(x[1]);
      setActiveChild(x[2]);
      setOpenDropdown(x[1]);
      setOpenSubDropdown(x[2]);
    } else {
      setActiveParent("dashboards");
      setOpenDropdown("dashboards");
    }
  }, [pathName]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Menu Items - This will scroll if content overflows */}
      <ul style={{ flex: 1, overflowY: 'auto', paddingBottom: '10px' }}>
        {filteredMenu.map(({ dropdownMenu, id, name, path, icon, mainName }) => {
          return (
            <li
              key={id}
              onClick={(e) => handleMainMenu(e, name)}
              className={`nxl-item nxl-hasmenu ${
                activeParent === name ? "active nxl-trigger" : ""
              }`}
            >
              <Link to={path} className="nxl-link text-capitalize">
                <span className="nxl-micon"> {getIcon(icon)} </span>
                <span className="nxl-mtext" style={{ paddingLeft: "2.5px" }}>
                  {mainName || name}
                </span>
                <span className="nxl-arrow fs-16">
                  <FiChevronRight />
                </span>
              </Link>
              <ul
                className={`nxl-submenu ${
                  openDropdown === name ? "nxl-menu-visible" : "nxl-menu-hidden"
                }`}
              >
                {dropdownMenu.map(({ id, name, path, subdropdownMenu }) => {
                  const x = name;
                  return (
                    <Fragment key={id}>
                      {subdropdownMenu.length ? (
                        <li
                          className={`nxl-item nxl-hasmenu ${
                            activeChild === name ? "active" : ""
                          }`}
                          onClick={(e) => handleDropdownMenu(e, x)}
                        >
                          <Link to={path} className={`nxl-link text-capitalize`}>
                            <span className="nxl-mtext">{name}</span>
                            <span className="nxl-arrow">
                              <i>
                                {" "}
                                <FiChevronRight />
                              </i>
                            </span>
                          </Link>
                          {subdropdownMenu.map(({ id, name, path }) => {
                            return (
                              <ul
                                key={id}
                                className={`nxl-submenu ${
                                  openSubDropdown === x
                                    ? "nxl-menu-visible"
                                    : "nxl-menu-hidden "
                                }`}
                              >
                                <li
                                  className={`nxl-item ${
                                    pathName === path ? "active" : ""
                                  }`}
                                >
                                  <Link
                                    className="nxl-link text-capitalize"
                                    to={path}
                                  >
                                    {name}
                                  </Link>
                                </li>
                              </ul>
                            );
                          })}
                        </li>
                      ) : (
                        <li
                          className={`nxl-item ${
                            pathName === path ? "active" : ""
                          }`}
                        >
                          <Link className="nxl-link" to={path}>
                            {name}
                          </Link>
                        </li>
                      )}
                    </Fragment>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>

      {/* Version Number - Always at bottom */}
      <div style={{
        padding: '15px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        marginTop: 'auto',
        backgroundColor: 'inherit'
      }}>
        <div style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          fontWeight: '500'
        }}>
          v{"1.0.0"}
        </div>
      </div>
    </div>
  );
};

export default Menus;