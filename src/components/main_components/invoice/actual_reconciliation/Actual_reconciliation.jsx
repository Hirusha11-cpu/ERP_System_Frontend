import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  Table,
  Button,
  Form,
  Modal,
  Spinner,
  Alert,
  Tab,
  Nav,
  Row,
  Col,
} from "react-bootstrap";
import {
  FaSearch,
  FaSyncAlt,
  FaFileExport,
  FaFileImport,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaCog,
} from "react-icons/fa";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";

const Actual_reconciliation = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [reconciliationData, setReconciliationData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    amountFrom: "",
    amountTo: "",
    status: "all",
  });

  // Mock data fetch - replace with actual API call
  useEffect(() => {
    const fetchReconciliationData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data based on company
        const mockData = {
          appleholidays: generateMockData("APL"),
          aahaas: generateMockData("AAH"),
          shirmila: generateMockData("SHM"),
        };
        
        setReconciliationData(mockData[selectedCompany?.toLowerCase()] || []);
        setFilteredData(mockData[selectedCompany?.toLowerCase()] || []);
      } catch (err) {
        setError("Failed to load reconciliation data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReconciliationData();
  }, [selectedCompany]);

  // Generate mock reconciliation data
  const generateMockData = (prefix) => {
    const statuses = ["pending", "matched", "discrepancy"];
    const types = ["hotel", "transport", "guide", "tickets", "meals"];
    
    return Array.from({ length: 25 }, (_, i) => ({
      id: `${prefix}-${1000 + i}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: types[Math.floor(Math.random() * types.length)],
      description: `${types[Math.floor(Math.random() * types.length)]} service`,
      amount: (Math.random() * 1000 + 50).toFixed(2),
      systemAmount: (Math.random() * 1000 + 50).toFixed(2),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      handler: `Handler_${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
      notes: Math.random() > 0.7 ? "Requires verification" : "",
    }));
  };

  // Apply filters
  useEffect(() => {
    let result = [...reconciliationData];
    
    // Filter by status tab
    if (activeTab !== "all") {
      result = result.filter(item => item.status === activeTab);
    }

    // Apply other filters
    if (filters.dateFrom) {
      result = result.filter(item => item.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter(item => item.date <= filters.dateTo);
    }
    if (filters.amountFrom) {
      result = result.filter(item => parseFloat(item.amount) >= parseFloat(filters.amountFrom));
    }
    if (filters.amountTo) {
      result = result.filter(item => parseFloat(item.amount) <= parseFloat(filters.amountTo));
    }
    if (filters.status !== "all") {
      result = result.filter(item => item.status === filters.status);
    }

    setFilteredData(result);
  }, [reconciliationData, activeTab, filters]);

  const handleReconcile = (id, action) => {
    setReconciliationData(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, status: action === "approve" ? "matched" : "discrepancy" }
          : item
      )
    );
  };

  const handleShowDetails = (record) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      amountFrom: "",
      amountTo: "",
      status: "all",
    });
    setActiveTab("all");
  };

  return (
    <div className="actual-reconciliation">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5>Actual Reconciliation ({selectedCompany})</h5>
            <div>
              <Button variant="outline-primary" size="sm" className="me-2">
                <FaFileImport /> Import
              </Button>
              <Button variant="outline-success" size="sm" className="me-2">
                <FaFileExport /> Export
              </Button>
              <Button variant="primary" size="sm" onClick={() => setLoading(true)}>
                <FaSyncAlt /> Refresh
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Row>
              <Col md={3}>
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="all">All Records</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="pending">Pending</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="matched">Matched</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="discrepancy">Discrepancies</Nav.Link>
                  </Nav.Item>
                </Nav>

                <Card className="mt-3">
                  <Card.Header>
                    <FaFilter className="me-2" />
                    Filters
                  </Card.Header>
                  <Card.Body>
                    <Form.Group className="mb-3">
                      <Form.Label>Date From</Form.Label>
                      <Form.Control
                        type="date"
                        name="dateFrom"
                        value={filters.dateFrom}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Date To</Form.Label>
                      <Form.Control
                        type="date"
                        name="dateTo"
                        value={filters.dateTo}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Amount From</Form.Label>
                      <Form.Control
                        type="number"
                        name="amountFrom"
                        value={filters.amountFrom}
                        onChange={handleFilterChange}
                        placeholder="Min amount"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Amount To</Form.Label>
                      <Form.Control
                        type="number"
                        name="amountTo"
                        value={filters.amountTo}
                        onChange={handleFilterChange}
                        placeholder="Max amount"
                      />
                    </Form.Group>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={resetFilters}
                    >
                      Reset Filters
                    </Button>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={9}>
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p>Loading reconciliation data...</p>
                  </div>
                ) : (
                  <Tab.Content>
                    <Tab.Pane eventKey={activeTab}>
                      <div className="table-responsive">
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Description</th>
                              <th>Amount</th>
                              <th>System Amount</th>
                              <th>Difference</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredData.length > 0 ? (
                              filteredData.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.id}</td>
                                  <td>{item.date}</td>
                                  <td className="text-capitalize">{item.type}</td>
                                  <td>{item.description}</td>
                                  <td>${item.amount}</td>
                                  <td>${item.systemAmount}</td>
                                  <td className={
                                    Math.abs(item.amount - item.systemAmount) > 0.01
                                      ? "text-danger"
                                      : "text-success"
                                  }>
                                    ${(item.amount - item.systemAmount).toFixed(2)}
                                  </td>
                                  <td>
                                    <span className={`badge bg-${
                                      item.status === "matched"
                                        ? "success"
                                        : item.status === "discrepancy"
                                        ? "danger"
                                        : "warning"
                                    }`}>
                                      {item.status}
                                    </span>
                                    {item.notes && (
                                      <span className="ms-2 text-muted" title={item.notes}>
                                        <FaCog />
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    <Button
                                      variant="outline-info"
                                      size="sm"
                                      className="me-2"
                                      onClick={() => handleShowDetails(item)}
                                    >
                                      Details
                                    </Button>
                                    {item.status === "pending" && (
                                      <>
                                        <Button
                                          variant="outline-success"
                                          size="sm"
                                          className="me-2"
                                          onClick={() => handleReconcile(item.id, "approve")}
                                        >
                                          <FaCheckCircle /> Approve
                                        </Button>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => handleReconcile(item.id, "reject")}
                                        >
                                          <FaTimesCircle /> Reject
                                        </Button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="9" className="text-center">
                                  No records found matching your criteria
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                )}
              </Col>
            </Row>
          </Tab.Container>
        </Card.Body>
      </Card>

      {/* Record Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Reconciliation Details - {selectedRecord?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <Row>
              <Col md={6}>
                <h6>Transaction Details</h6>
                <Table bordered>
                  <tbody>
                    <tr>
                      <th>Date</th>
                      <td>{selectedRecord.date}</td>
                    </tr>
                    <tr>
                      <th>Type</th>
                      <td className="text-capitalize">{selectedRecord.type}</td>
                    </tr>
                    <tr>
                      <th>Description</th>
                      <td>{selectedRecord.description}</td>
                    </tr>
                    <tr>
                      <th>Handler</th>
                      <td>{selectedRecord.handler}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h6>Amount Comparison</h6>
                <Table bordered>
                  <tbody>
                    <tr>
                      <th>Invoice Amount</th>
                      <td>${selectedRecord.amount}</td>
                    </tr>
                    <tr>
                      <th>System Amount</th>
                      <td>${selectedRecord.systemAmount}</td>
                    </tr>
                    <tr>
                      <th>Difference</th>
                      <td className={
                        Math.abs(selectedRecord.amount - selectedRecord.systemAmount) > 0.01
                          ? "text-danger fw-bold"
                          : "text-success fw-bold"
                      }>
                        ${(selectedRecord.amount - selectedRecord.systemAmount).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <th>Status</th>
                      <td>
                        <span className={`badge bg-${
                          selectedRecord.status === "matched"
                            ? "success"
                            : selectedRecord.status === "discrepancy"
                            ? "danger"
                            : "warning"
                        }`}>
                          {selectedRecord.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              {selectedRecord.notes && (
                <Col md={12} className="mt-3">
                  <h6>Notes</h6>
                  <Card>
                    <Card.Body>{selectedRecord.notes}</Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
          {selectedRecord?.status === "pending" && (
            <>
              <Button 
                variant="success" 
                onClick={() => {
                  handleReconcile(selectedRecord.id, "approve");
                  setShowDetails(false);
                }}
              >
                <FaCheckCircle /> Approve
              </Button>
              <Button 
                variant="danger" 
                onClick={() => {
                  handleReconcile(selectedRecord.id, "reject");
                  setShowDetails(false);
                }}
              >
                <FaTimesCircle /> Reject
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Actual_reconciliation;