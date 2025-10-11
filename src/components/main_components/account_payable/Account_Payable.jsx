import React, { useState, useEffect, useContext } from "react";
import {
  Accordion,
  Nav,
  Tab,
  Row,
  Col,
  Container,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
  Badge,
  InputGroup,
  Pagination,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { CompanyContext } from "../../../contentApi/CompanyProvider";
import axios from "axios";

const Account_Payable = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reconciliations, setReconciliations] = useState({ data: [] });
  const [allPayables, setAllPayables] = useState({ data: [] });
  const [summary, setSummary] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [suggestedInvoices, setSuggestedInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState("reconciliation"); // reconciliation or all-payables
  const [filters, setFilters] = useState({
    status: 'all',
    tour_no: '',
    date_from: '',
    date_to: ''
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50
  });
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };
    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

  useEffect(() => {
    if (companyNo) {
      if (activeTab === "reconciliation") {
        fetchReconciliations();
      } else {
        fetchAllPayables();
      }
    }
  }, [companyNo, filters, pagination.current_page, activeTab]);

  const fetchReconciliations = async () => {
    if (!companyNo) return;

    setLoading(true);
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    
    try {
      const params = new URLSearchParams({
        company_id: companyNo,
        page: pagination.current_page,
        per_page: pagination.per_page,
        ...filters
      });

      const response = await axios.get(`/api/account-payables?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setReconciliations(response.data.data);
        setSummary(response.data.summary || {});
      }
    } catch (error) {
      console.error("Error fetching reconciliations:", error);
      showAlert("Failed to fetch reconciliation data", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPayables = async () => {
    if (!companyNo) return;

    setLoading(true);
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    
    try {
      const params = new URLSearchParams({
        company_id: companyNo,
        page: pagination.current_page,
        per_page: pagination.per_page,
        ...filters
      });

      // const response = await axios.get(`/api/account-payables?${params}`, {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      const response = await axios.get(`/api/account-payables`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAllPayables(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching all payables:", error);
      showAlert("Failed to fetch account payables", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPayablesRaw = async () => {
    if (!companyNo) return;

    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    
    try {
      const response = await axios.get(`/api/account-payables/raw?company_id=${companyNo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // You can use this for export or other purposes
        console.log("Raw payables data:", response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error("Error fetching raw payables:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !companyNo) return;

    setUploading(true);
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', companyNo);

    try {
      const response = await axios.post('/api/account-payables/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showAlert('File uploaded and processed successfully!', 'success');
        setShowUploadModal(false);
        // Refresh the current view
        if (activeTab === "reconciliation") {
          fetchReconciliations();
        } else {
          fetchAllPayables();
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showAlert(error.response?.data?.message || 'Failed to upload file', 'danger');
    } finally {
      setUploading(false);
    }
  };

  const handleManualMatch = async (record) => {
    setSelectedRecord(record);
    setShowMatchModal(true);
    
    // Fetch suggested invoices
    await fetchSuggestedInvoices(record);
  };

  const fetchSuggestedInvoices = async (record) => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    
    try {
      const params = new URLSearchParams({
        company_id: companyNo,
        tour_no: record.tour_no || '',
        amount: record.deposit > 0 ? record.deposit : record.withdrawal,
        date: record.value_date
      });

      const response = await axios.get(`/api/account-payables/suggested-invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSuggestedInvoices(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching suggested invoices:", error);
    }
  };

  const confirmMatch = async () => {
    if (!selectedRecord || !selectedInvoice) return;

    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    
    try {
      const response = await axios.post('/api/account-payables/manual-match', {
        reconciliation_id: selectedRecord.id,
        invoice_id: selectedInvoice.id
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        showAlert('Successfully matched with invoice!', 'success');
        setShowMatchModal(false);
        setSelectedRecord(null);
        setSelectedInvoice(null);
        // Refresh current view
        if (activeTab === "reconciliation") {
          fetchReconciliations();
        } else {
          fetchAllPayables();
        }
      }
    } catch (error) {
      console.error("Error matching record:", error);
      showAlert('Failed to match record', 'danger');
    }
  };

  const handleUnmatch = async (recordId) => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    
    try {
      const response = await axios.post(`/api/account-payables/unmatch/${recordId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        showAlert('Successfully unmatched record!', 'success');
        // Refresh current view
        if (activeTab === "reconciliation") {
          fetchReconciliations();
        } else {
          fetchAllPayables();
        }
      }
    } catch (error) {
      console.error("Error unmatching record:", error);
      showAlert('Failed to unmatch record', 'danger');
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-SG');
  };

  const renderPagination = () => {
    if (!reconciliations.data || reconciliations.data.length === 0) return null;

    const totalPages = reconciliations.last_page || 1;
    const currentPage = reconciliations.current_page || 1;
    const items = [];

    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev" 
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
      />
    );

    // Page numbers
    for (let page = 1; page <= totalPages; page++) {
      if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
        items.push(
          <Pagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Pagination.Item>
        );
      } else if (page === currentPage - 3 || page === currentPage + 3) {
        items.push(<Pagination.Ellipsis key={`ellipsis-${page}`} />);
      }
    }

    // Next button
    items.push(
      <Pagination.Next 
        key="next" 
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
      />
    );

    return <Pagination className="mt-3 justify-content-center">{items}</Pagination>;
  };

  const ReconciliationView = () => (
    <>
      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>{summary.total_records || 0}</Card.Title>
              <Card.Text>Total Records</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>{formatCurrency(summary.total_deposits || 0)}</Card.Title>
              <Card.Text>Total Deposits</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>{formatCurrency(summary.total_withdrawals || 0)}</Card.Title>
              <Card.Text>Total Withdrawals</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>
                <Badge bg="success">{summary.matched_count || 0}</Badge> / 
                <Badge bg="warning" className="ms-1">{summary.unmatched_count || 0}</Badge>
              </Card.Title>
              <Card.Text>Matched / Unmatched</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">All</option>
                  <option value="matched">Matched</option>
                  <option value="unmatched">Unmatched</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Tour No</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search tour number..."
                  value={filters.tour_no}
                  onChange={(e) => setFilters({...filters, tour_no: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Reconciliation Table */}
      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
              <p>Loading reconciliation data...</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Tour No</th>
                      <th>Reference</th>
                      <th>Deposit</th>
                      <th>Withdrawal</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliations.data && reconciliations.data.length > 0 ? (
                      reconciliations.data.map((record) => (
                        <tr key={record.id}>
                          <td>{formatDate(record.value_date)}</td>
                          <td>
                            <div>
                              <strong>{record.description}</strong>
                              {record.remarks && (
                                <small className="d-block text-muted">{record.remarks}</small>
                              )}
                            </div>
                          </td>
                          <td>
                            {record.tour_no ? (
                              <Badge bg="info">{record.tour_no}</Badge>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>{record.your_reference || '-'}</td>
                          <td className="text-success">
                            {record.deposit > 0 ? formatCurrency(record.deposit) : '-'}
                          </td>
                          <td className="text-danger">
                            {record.withdrawal > 0 ? formatCurrency(record.withdrawal) : '-'}
                          </td>
                          <td>
                            <strong>{formatCurrency(record.ledger_balance)}</strong>
                          </td>
                          <td>
                            {record.is_matched ? (
                              <Badge bg="success">
                                Matched
                                {record.invoice && (
                                  <small className="d-block">{record.invoice.invoice_number}</small>
                                )}
                              </Badge>
                            ) : (
                              <Badge bg="warning">Unmatched</Badge>
                            )}
                          </td>
                          <td>
                            {record.is_matched ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleUnmatch(record.id)}
                              >
                                Unmatch
                              </Button>
                            ) : (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleManualMatch(record)}
                              >
                                Match
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center">
                          No reconciliation records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              {renderPagination()}
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );

  const AllPayablesView = () => (
    <>
      {/* All Payables Table */}
      <Card>
        <Card.Header>
          <Row>
            <Col>
              <h5 className="mb-0">All Account Payables</h5>
            </Col>
            <Col className="text-end">
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={fetchAllPayablesRaw}
              >
                Export Raw Data
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
              <p>Loading account payables...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Account Number</th>
                    <th>Description</th>
                    <th>Tour No</th>
                    <th>Deposit</th>
                    <th>Withdrawal</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {allPayables.data && allPayables.data.length > 0 ? (
                    allPayables.data.map((payable) => (
                      <tr key={payable.id}>
                        <td>{formatDate(payable.value_date)}</td>
                        <td>{payable.account_number || '-'}</td>
                        <td>
                          <div>
                            <strong>{payable.description}</strong>
                            {payable.remarks && (
                              <small className="d-block text-muted">{payable.remarks}</small>
                            )}
                          </div>
                        </td>
                        <td>
                          {payable.tour_no ? (
                            <Badge bg="info">{payable.tour_no}</Badge>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-success">
                          {payable.deposit > 0 ? formatCurrency(payable.deposit) : '-'}
                        </td>
                        <td className="text-danger">
                          {payable.withdrawal > 0 ? formatCurrency(payable.withdrawal) : '-'}
                        </td>
                        <td>
                          {payable.cost_category && (
                            <small>{payable.cost_category}</small>
                          )}
                        </td>
                        <td>
                          {payable.is_matched ? (
                            <Badge bg="success">Matched</Badge>
                          ) : (
                            <Badge bg="warning">Unmatched</Badge>
                          )}
                        </td>
                        <td>{formatDate(payable.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center">
                        No account payable records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );

  return (
    <Container fluid>
      {alert.show && (
        <Alert variant={alert.type} onClose={() => setAlert({ show: false, message: '', type: '' })} dismissible>
          {alert.message}
        </Alert>
      )}

      {/* Header with Tabs */}
      <Card className="mb-4">
        <Card.Header>
          <Row>
            <Col md={6}>
              <h4 className="mb-0">Account Payables</h4>
              <small className="text-muted">Payables Management</small>
            </Col>
            <Col md={6} className="text-end">
              <Button 
                variant="primary" 
                onClick={() => setShowUploadModal(true)}
                disabled={uploading}
                className="me-2"
              >
                {uploading ? <Spinner animation="border" size="sm" /> : 'Upload Excel'}
              </Button>
              
              <Nav variant="pills" className="d-inline-flex">
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === "reconciliation"} 
                    onClick={() => setActiveTab("reconciliation")}
                  >
                    Reconciliation
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === "all-payables"} 
                    onClick={() => setActiveTab("all-payables")}
                  >
                    All Payables
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
          </Row>
        </Card.Header>
      </Card>

      {/* Tab Content */}
      {activeTab === "reconciliation" ? <ReconciliationView /> : <AllPayablesView />}

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Bank Reconciliation Excel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Select Excel File</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Form.Text className="text-muted">
              Supported formats: .xlsx, .xls, .csv (Max 10MB)
            </Form.Text>
          </Form.Group>
          {uploading && (
            <div className="text-center mt-3">
              <Spinner animation="border" />
              <p>Processing file...</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Match Modal */}
      <Modal show={showMatchModal} onHide={() => setShowMatchModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Match with Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <div className="mb-3">
              <h6>Transaction Details:</h6>
              <p><strong>Date:</strong> {formatDate(selectedRecord.value_date)}</p>
              <p><strong>Description:</strong> {selectedRecord.description}</p>
              <p><strong>Tour No:</strong> {selectedRecord.tour_no || 'N/A'}</p>
              <p><strong>Amount:</strong> {formatCurrency(selectedRecord.deposit > 0 ? selectedRecord.deposit : selectedRecord.withdrawal)}</p>
            </div>
          )}

          <h6>Suggested Invoices:</h6>
          {suggestedInvoices.length > 0 ? (
            <div className="list-group">
              {suggestedInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`list-group-item list-group-item-action ${
                    selectedInvoice?.id === invoice.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedInvoice(invoice)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h6 className="mb-1">{invoice.invoice_number}</h6>
                    <strong>{formatCurrency(invoice.balance)}</strong>
                  </div>
                  <p className="mb-1">Customer: {invoice.customer?.name}</p>
                  <small>Booking: {invoice.booking_no || 'N/A'}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No suggested invoices found</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMatchModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={confirmMatch}
            disabled={!selectedInvoice}
          >
            Confirm Match
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Account_Payable;