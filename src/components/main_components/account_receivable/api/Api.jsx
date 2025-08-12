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
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import Aging_report from "./Aging_report";
import Bank_reconciliation from "./Bank_reconciliation";
import Master_sheet from "./Master_sheet";
import Payment_details from "./Payment_details";
import Summery_report from "./Summery_report";

const Api = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [selectedApi, setSelectedApi] = useState(null);

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };
    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

  // Complete list of all APIs with their subcategories
  const allApis = [
    { 
      name: "MMT", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="MMT" /> },
        { name: "Payment details", component: <Payment_details apiName="MMT" /> },
        { name: "Aging reports", component: <Aging_report apiName="MMT" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="MMT" /> },
        { name: "Summary reports", component: <Summery_report apiName="MMT" /> }
      ] 
    },
    { 
      name: "TBO INDIA", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="TBO INDIA" /> },
        { name: "Payment details", component: <Payment_details apiName="TBO INDIA" /> },
        { name: "Aging reports", component: <Aging_report apiName="TBO INDIA" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="TBO INDIA" /> },
        { name: "Summary reports", component: <Summery_report apiName="TBO INDIA" /> }
      ] 
    },
    { 
      name: "TBO INTERNATIONAL", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="TBO INTERNATIONAL" /> },
        { name: "Payment details", component: <Payment_details apiName="TBO INTERNATIONAL" /> },
        { name: "Aging reports", component: <Aging_report apiName="TBO INTERNATIONAL" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="TBO INTERNATIONAL" /> },
        { name: "Summary reports", component: <Summery_report apiName="TBO INTERNATIONAL" /> }
      ] 
    },
    { 
      name: "REZLIFE", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="REZLIFE" /> },
        { name: "Payment details", component: <Payment_details apiName="REZLIFE" /> },
        { name: "Aging reports", component: <Aging_report apiName="REZLIFE" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="REZLIFE" /> },
        { name: "Summary reports", component: <Summery_report apiName="REZLIFE" /> }
      ] 
    },
    { 
      name: "ORIVADO", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="ORIVADO" /> },
        { name: "Payment details", component: <Payment_details apiName="ORIVADO" /> },
        { name: "Aging reports", component: <Aging_report apiName="ORIVADO" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="ORIVADO" /> },
        { name: "Summary reports", component: <Summery_report apiName="ORIVADO" /> }
      ] 
    },
    { 
      name: "Global Tix-Malaysia", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Global Tix-Malaysia" /> },
        { name: "Payment details", component: <Payment_details apiName="Global Tix-Malaysia" /> },
        { name: "Aging reports", component: <Aging_report apiName="Global Tix-Malaysia" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Global Tix-Malaysia" /> },
        { name: "Summary reports", component: <Summery_report apiName="Global Tix-Malaysia" /> }
      ] 
    },
    { 
      name: "Global Tix-Singapore", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Global Tix-Singapore" /> },
        { name: "Payment details", component: <Payment_details apiName="Global Tix-Singapore" /> },
        { name: "Aging reports", component: <Aging_report apiName="Global Tix-Singapore" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Global Tix-Singapore" /> },
        { name: "Summary reports", component: <Summery_report apiName="Global Tix-Singapore" /> }
      ] 
    },
    { 
      name: "Drivania", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Drivania" /> },
        { name: "Payment details", component: <Payment_details apiName="Drivania" /> },
        { name: "Aging reports", component: <Aging_report apiName="Drivania" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Drivania" /> },
        { name: "Summary reports", component: <Summery_report apiName="Drivania" /> }
      ] 
    },
    { 
      name: "Sabre", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Sabre" /> },
        { name: "Payment details", component: <Payment_details apiName="Sabre" /> },
        { name: "Aging reports", component: <Aging_report apiName="Sabre" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Sabre" /> },
        { name: "Summary reports", component: <Summery_report apiName="Sabre" /> }
      ] 
    },
    { 
      name: "Travl nxt", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Travl nxt" /> },
        { name: "Payment details", component: <Payment_details apiName="Travl nxt" /> },
        { name: "Aging reports", component: <Aging_report apiName="Travl nxt" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Travl nxt" /> },
        { name: "Summary reports", component: <Summery_report apiName="Travl nxt" /> }
      ] 
    },
    { 
      name: "Bridgify", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Bridgify" /> },
        { name: "Payment details", component: <Payment_details apiName="Bridgify" /> },
        { name: "Aging reports", component: <Aging_report apiName="Bridgify" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Bridgify" /> },
        { name: "Summary reports", component: <Summery_report apiName="Bridgify" /> }
      ] 
    },
    { 
      name: "CEBU", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="CEBU" /> },
        { name: "Payment details", component: <Payment_details apiName="CEBU" /> },
        { name: "Aging reports", component: <Aging_report apiName="CEBU" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="CEBU" /> },
        { name: "Summary reports", component: <Summery_report apiName="CEBU" /> }
      ] 
    },
    { 
      name: "Zetexa", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Zetexa" /> },
        { name: "Payment details", component: <Payment_details apiName="Zetexa" /> },
        { name: "Aging reports", component: <Aging_report apiName="Zetexa" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Zetexa" /> },
        { name: "Summary reports", component: <Summery_report apiName="Zetexa" /> }
      ] 
    },
    { 
      name: "Ratehawk", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Ratehawk" /> },
        { name: "Payment details", component: <Payment_details apiName="Ratehawk" /> },
        { name: "Aging reports", component: <Aging_report apiName="Ratehawk" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Ratehawk" /> },
        { name: "Summary reports", component: <Summery_report apiName="Ratehawk" /> }
      ] 
    },
    { 
      name: "Senthosa", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Senthosa" /> },
        { name: "Payment details", component: <Payment_details apiName="Senthosa" /> },
        { name: "Aging reports", component: <Aging_report apiName="Senthosa" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Senthosa" /> },
        { name: "Summary reports", component: <Summery_report apiName="Senthosa" /> }
      ] 
    },
    { 
      name: "Be my guest", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Be my guest" /> },
        { name: "Payment details", component: <Payment_details apiName="Be my guest" /> },
        { name: "Aging reports", component: <Aging_report apiName="Be my guest" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Be my guest" /> },
        { name: "Summary reports", component: <Summery_report apiName="Be my guest" /> }
      ] 
    },
    { 
      name: "Ryna", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Ryna" /> },
        { name: "Payment details", component: <Payment_details apiName="Ryna" /> },
        { name: "Aging reports", component: <Aging_report apiName="Ryna" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Ryna" /> },
        { name: "Summary reports", component: <Summery_report apiName="Ryna" /> }
      ] 
    },
    { 
      name: "Travel vago", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Travel vago" /> },
        { name: "Payment details", component: <Payment_details apiName="Travel vago" /> },
        { name: "Aging reports", component: <Aging_report apiName="Travel vago" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Travel vago" /> },
        { name: "Summary reports", component: <Summery_report apiName="Travel vago" /> }
      ] 
    },
    { 
      name: "Others", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Others" /> },
        { name: "Payment details", component: <Payment_details apiName="Others" /> },
        { name: "Aging reports", component: <Aging_report apiName="Others" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Others" /> },
        { name: "Summary reports", component: <Summery_report apiName="Others" /> }
      ] 
    },
    { 
      name: "Amadeus", 
      subcategories: [
        { name: "Master sheets", component: <Master_sheet apiName="Amadeus" /> },
        { name: "Payment details", component: <Payment_details apiName="Amadeus" /> },
        { name: "Aging reports", component: <Aging_report apiName="Amadeus" /> },
        { name: "Bank reconciliation", component: <Bank_reconciliation apiName="Amadeus" /> },
        { name: "Summary reports", component: <Summery_report apiName="Amadeus" /> }
      ] 
    }
  ];

  // For companyNo 1, only show Amadeus
  const filteredApis = companyNo === 1 
    ? allApis.filter(api => api.name === "Amadeus")
    : allApis.filter(api => api.name !== "Amadeus");

  const handleSubcategorySelect = (apiName, subcategory) => {
    setSelectedApi(apiName);
    setActiveTab(subcategory.name);
  };

  return (
    <Container fluid className="">
      <h2>API Reports</h2>
      <p className="text-muted">Select an API and report type to view details</p>
      
      <Row>
        <Col md={2}>
          <Card>
            <Card.Header className="bg-primary text-white">
              Available APIs
            </Card.Header>
            <Card.Body style={{ padding: '0' }}>
              <Accordion defaultActiveKey="0" flush>
                {filteredApis.map((api, index) => (
                  <Accordion.Item eventKey={index.toString()} key={api.name}>
                    <Accordion.Header>{api.name}</Accordion.Header>
                    <Accordion.Body style={{ padding: '0' }}>
                      <Nav variant="pills" className="flex-column">
                        {api.subcategories.map((subcategory, subIndex) => (
                          <Nav.Item key={subIndex}>
                            <Nav.Link 
                              eventKey={`${api.name}-${subcategory.name}`}
                              active={activeTab === subcategory.name && selectedApi === api.name}
                              onClick={() => handleSubcategorySelect(api.name, subcategory)}
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
              {selectedApi && activeTab ? (
                <h5>{selectedApi} - {activeTab}</h5>
              ) : (
                <h5>Select a report to view details</h5>
              )}
            </Card.Header>
            <Card.Body>
              <Tab.Content>
                {filteredApis.map(api => (
                  api.subcategories.map(subcategory => (
                    <Tab.Pane 
                      key={`${api.name}-${subcategory.name}`}
                      eventKey={`${api.name}-${subcategory.name}`}
                      active={activeTab === subcategory.name && selectedApi === api.name}
                    >
                      {subcategory.component}
                    </Tab.Pane>
                  ))
                ))}
                {!activeTab && (
                  <div className="text-center py-5">
                    <h4>No report selected</h4>
                    <p className="text-muted">Please select an API and report type from the left panel</p>
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

export default Api;