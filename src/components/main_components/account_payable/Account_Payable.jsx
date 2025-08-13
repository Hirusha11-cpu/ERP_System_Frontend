import React, { useState, useEffect, useContext } from "react";
import {
  Accordion,
  Nav,
  Tab,
  Row,
  Col,
  Container,
  Card,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { CompanyContext } from "../../../contentApi/CompanyProvider";
import SriLanka from "./countries/SriLanka";
import Reconciliation from "./reports/Reconciliation";
import SummaryReports from "./reports/SummaryReports";
import Singapore from "./countries/Singapore";
import Vietnam from "./countries/Vietnam";
import Malaysia from "./countries/Malaysia";
import Maldives from "./countries/Maldives";
import Thailand from "./countries/Thailand";
import Bali from "./countries/Bali";
import OtherCountries from "./countries/OtherCountries";



const Account_Payable = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };
    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

  // Complete list of all countries with their subcategories
  const allCountries = [
    { 
      name: "Sri Lanka", 
      subcategories: [
        { name: "Train Ticket", component: <SriLanka category="Train Ticket" companyNo={companyNo} /> },
        { name: "Lunch & Break", component: <SriLanka category="Lunch & Break" companyNo={companyNo} /> },
        { name: "Guide", component: <SriLanka category="Guide" companyNo={companyNo} /> },
        { name: "Hotel", component: <SriLanka category="Hotel" companyNo={companyNo} /> },
        { name: "Transport", component: <SriLanka category="Transport" companyNo={companyNo} /> },
        { name: "Tickets", component: <SriLanka category="Tickets" companyNo={companyNo} /> },
        { name: "Reconciliation", component: <Reconciliation country="Sri Lanka" companyNo={companyNo} /> },
        { name: "Summary Reports", component: <SummaryReports country="Sri Lanka" companyNo={companyNo} /> }
      ] 
    },
    { 
      name: "Singapore", 
      subcategories: [
        { name: "Reconciliation", component: <Reconciliation country="Singapore" companyNo={companyNo} /> },
        { name: "Summary Reports", component: <SummaryReports country="Singapore" companyNo={companyNo} /> },
        { name: "Other", component: <Singapore category="Other" companyNo={companyNo} /> }
      ] 
    },
    { 
      name: "Vietnam", 
      subcategories: [
        { name: "Hotel", component: <Vietnam category="Hotel" companyNo={companyNo} /> },
        { name: "Tickets", component: <Vietnam category="Tickets" companyNo={companyNo} /> },
        { name: "Guide", component: <Vietnam category="Guide" companyNo={companyNo} /> },
        { name: "Water", component: <Vietnam category="Water" companyNo={companyNo} /> },
        { name: "Day Cruise", component: <Vietnam category="Day Cruise" companyNo={companyNo} /> },
        { name: "Transport", component: <Vietnam category="Transport" companyNo={companyNo} /> },
        { name: "Other", component: <Vietnam category="Other" companyNo={companyNo} /> },
        { name: "Reconciliation", component: <Reconciliation country="Vietnam" companyNo={companyNo} /> },
        { name: "Summary Reports", component: <SummaryReports country="Vietnam" companyNo={companyNo} /> }
      ] 
    },
    { 
      name: "Malaysia", 
      subcategories: [
        { name: "Hotel", component: <Malaysia category="Hotel" companyNo={companyNo} /> },
        { name: "Tickets", component: <Malaysia category="Tickets" companyNo={companyNo} /> },
        { name: "Transport", component: <Malaysia category="Transport" companyNo={companyNo} /> },
        { name: "Meals", component: <Malaysia category="Meals" companyNo={companyNo} /> },
        { name: "Other", component: <Malaysia category="Other" companyNo={companyNo} /> },
        { name: "Reconciliation", component: <Reconciliation country="Malaysia" companyNo={companyNo} /> },
        { name: "Summary Reports", component: <SummaryReports country="Malaysia" companyNo={companyNo} /> }
      ] 
    },
    { 
      name: "Maldives", 
      subcategories: [
        { name: "Supplier", component: <Maldives category="Supplier" companyNo={companyNo} /> },
        { name: "Other", component: <Maldives category="Other" companyNo={companyNo} /> },
        { name: "Reconciliation", component: <Reconciliation country="Maldives" companyNo={companyNo} /> },
        { name: "Summary Reports", component: <SummaryReports country="Maldives" companyNo={companyNo} /> }
      ] 
    },
    { 
      name: "Thailand", 
      subcategories: [
        { name: "Supplier", component: <Thailand category="Supplier" companyNo={companyNo} /> },
        { name: "Other", component: <Thailand category="Other" companyNo={companyNo} /> },
        { name: "Reconciliation", component: <Reconciliation country="Thailand" companyNo={companyNo} /> },
        { name: "Summary Reports", component: <SummaryReports country="Thailand" companyNo={companyNo} /> }
      ] 
    },
    { 
      name: "Bali", 
      subcategories: [
        { name: "Supplier", component: <Bali category="Supplier" companyNo={companyNo} /> },
        { name: "Other", component: <Bali category="Other" companyNo={companyNo} /> },
        { name: "Reconciliation", component: <Reconciliation country="Bali" companyNo={companyNo} /> },
        { name: "Summary Reports", component: <SummaryReports country="Bali" companyNo={companyNo} /> }
      ] 
    },
    { 
      name: "Other Countries", 
      subcategories: [
        { name: "Supplier", component: <OtherCountries category="Supplier" companyNo={companyNo} /> },
        { name: "Other", component: <OtherCountries category="Other" companyNo={companyNo} /> },
        { name: "Reconciliation", component: <Reconciliation country="Other Countries" companyNo={companyNo} /> },
        { name: "Summary Reports", component: <SummaryReports country="Other Countries" companyNo={companyNo} /> }
      ] 
    }
  ];

  const handleSubcategorySelect = (countryName, subcategory) => {
    setSelectedCountry(countryName);
    setActiveTab(subcategory.name);
  };

  return (
    <Container fluid className="">
      <h2>Account Payable</h2>
      <p className="text-muted">Select a country and category to view details</p>
      
      <Row>
        <Col md={2}>
          <Card>
            <Card.Header className="bg-primary text-white">
              Countries
            </Card.Header>
            <Card.Body style={{ padding: '0' }}>
              <Accordion defaultActiveKey="0" flush>
                {allCountries.map((country, index) => (
                  <Accordion.Item eventKey={index.toString()} key={country.name}>
                    <Accordion.Header>{country.name}</Accordion.Header>
                    <Accordion.Body style={{ padding: '0' }}>
                      <Nav variant="pills" className="flex-column">
                        {country.subcategories.map((subcategory, subIndex) => (
                          <Nav.Item key={subIndex}>
                            <Nav.Link 
                              eventKey={`${country.name}-${subcategory.name}`}
                              active={activeTab === subcategory.name && selectedCountry === country.name}
                              onClick={() => handleSubcategorySelect(country.name, subcategory)}
                              className="py-2"
                            >
                              {subcategory.name}
                            </Nav.Link>
                          </Nav.Item>
                        ))}
                      </Nav>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={10}>
          <Card>
            <Card.Header className="bg-light">
              {selectedCountry && activeTab ? (
                <h5>{selectedCountry} - {activeTab}</h5>
              ) : (
                <h5>Select a category to view details</h5>
              )}
            </Card.Header>
            <Card.Body>
              <Tab.Content>
                {allCountries.map(country => (
                  country.subcategories.map(subcategory => (
                    <Tab.Pane 
                      key={`${country.name}-${subcategory.name}`}
                      eventKey={`${country.name}-${subcategory.name}`}
                      active={activeTab === subcategory.name && selectedCountry === country.name}
                    >
                      {subcategory.component}
                    </Tab.Pane>
                  ))
                ))}
                {!activeTab && (
                  <div className="text-center py-5">
                    <h4>No category selected</h4>
                    <p className="text-muted">Please select a country and category from the left panel</p>
                  </div>
                )}
              </Tab.Content>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Account_Payable;