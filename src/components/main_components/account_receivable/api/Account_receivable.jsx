import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  Button,
  Form,
  Table,
  Card,
  Nav,
  Tab,
  Row,
  Col,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaSearch,
  FaPlus,
  FaTrash,
  FaEye,
  FaPrint,
  FaDownload,
  FaSyncAlt,
  FaCog,
  FaFileImport,
  FaFileExport,
  FaEdit,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import axios from "axios";

const Account_receivable = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isNonCredit, setIsNonCredit] = useState(false);
  const [error, setError] = useState(null);
  const [companyNo, setCompanyNo] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [file, setFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Credit partners list
  const creditPartners = [
    "MMT",
    "PYT",
    "SOTC",
    "TC",
    "Travel Triangle",
    "I-Trip",
    "Riya",
  ];

  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };
    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

  // Fetch invoices from API
  useEffect(() => {
    if (companyNo) {
      fetchInvoices();
    }
  }, [companyNo]);

const fetchInvoices = async () => {
  setLoading(true);
  try {
    // Check if cached data exists
    const cachedInvoices = localStorage.getItem(`invoices_${companyNo}`);
    if (cachedInvoices) {
      setInvoices(JSON.parse(cachedInvoices));
      setFilteredInvoices(JSON.parse(cachedInvoices));
      setLoading(false);
      return; // skip API call
    }

    // Fetch from API if not in cache
    const response = await axios.get(
      `/api/invoicesss/all?company_id=${companyNo}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    setInvoices(response.data);
    setFilteredInvoices(response.data);

    // Store in cache
    localStorage.setItem(
      `invoices_${companyNo}`,
      JSON.stringify(response.data)
    );
  } catch (err) {
    setError("Failed to fetch invoices");
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    let result = [...invoices];
    console.log(result);

    if (activeTab === "credit") {
      result = result.filter((invoice) =>
        creditPartners.includes(invoice.customer?.name)
      );
      setIsNonCredit(false);
      console.log(
        "Credit invoices:",
        result.filter((invoice) => {
          console.log(invoice);
        })
      );
    } else if (activeTab === "non-credit") {
      result = result.filter(
        (invoice) => !creditPartners.includes(invoice.customer?.name)
      );
      setIsNonCredit(true);

    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(term) ||
          invoice.customer?.name.toLowerCase().includes(term) ||
          invoice.booking_no.toLowerCase().includes(term)
      );
    }

    setFilteredInvoices(result);
  }, [activeTab, searchTerm, invoices]);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(
        `/api/invoices/import?company_id=${companyNo}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setShowUploadModal(false);
      setFile(null);
      fetchInvoices();
    } catch (err) {
      setError("Failed to upload file");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = async () => {
    if (!selectedInvoice || paymentAmount <= 0) return;

    setLoading(true);
    try {
      const updatedAmountReceived =
        parseFloat(selectedInvoice.amount_received) + parseFloat(paymentAmount);
      const newBalance =
        parseFloat(selectedInvoice.total_amount) - updatedAmountReceived;

      await axios.patch(
        `/api/invoices/${selectedInvoice.invoice_number}`,
        {
          amount_received: updatedAmountReceived,
          balance: newBalance > 0 ? newBalance : 0,
          status: newBalance <= 0 ? "Paid" : "Partial",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowEditModal(false);
      setPaymentAmount(0);
      fetchInvoices();
    } catch (err) {
      setError("Failed to update payment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return "success";
      case "Partial":
        return "warning";
      case "Open":
        return "danger";
      default:
        return "secondary";
    }
  };

  return (
    <div className="account-receivable">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5>Account Receivable ({selectedCompany})</h5>
            <div>
              {/* <Button 
                variant="outline-primary" 
                size="sm" 
                className="me-2"
                onClick={() => setShowUploadModal(true)}
              >
                <FaFileImport /> Upload
              </Button>
              <Button variant="outline-success" size="sm" className="me-2">
                <FaFileExport /> Export
              </Button>
              <Button variant="primary" size="sm" onClick={fetchInvoices}>
                <FaSyncAlt /> Refresh
              </Button> */}
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Row>
              <Col md={12}>
                <Nav variant="tabs">
                  <Nav.Item>
                    <Nav.Link eventKey="all">All Invoices</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="credit">Credit Partners</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="non-credit">Non-Credit</Nav.Link>
                  </Nav.Item>
                </Nav>

                <div className="mt-3 mb-3 d-flex">
                  <Form.Control
                    type="text"
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: "300px" }}
                  />
                </div>

                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p>Loading invoices...</p>
                  </div>
                ) : (
                  <Tab.Content>
                    <Tab.Pane eventKey={activeTab}>
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Booking #</th>
                            <th>Total Amount</th>
                            <th>Received</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th>Type</th>
                            {activeTab !== "all" && <th>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInvoices.length > 0 ? (
                            filteredInvoices.map((invoice) => (
                              <tr key={invoice.id}>
                                <td>{invoice.invoice_number}</td>
                                <td>
                                  {new Date(
                                    invoice.issue_date
                                  ).toLocaleDateString()}
                                </td>
                                <td>{invoice.customer?.name || "N/A"}</td>
                                <td>{invoice.booking_no}</td>
                                <td>
                                  {invoice.currency}{" "}
                                  {parseFloat(invoice.total_amount).toFixed(2)}
                                </td>
                                <td>
                                  {invoice.currency}{" "}
                                  {parseFloat(invoice.amount_received).toFixed(
                                    2
                                  )}
                                </td>
                                <td>
                                  {invoice.currency}{" "}
                                  {parseFloat(invoice.balance).toFixed(2)}
                                </td>
                                <td>
                                  <Badge bg={getStatusBadge(invoice.status)}>
                                    {invoice.status}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge
                                    bg={
                                      creditPartners.includes(
                                        invoice.customer?.name
                                      )
                                        ? "info"
                                        : "secondary"
                                    }
                                  >
                                    {creditPartners.includes(
                                      invoice.customer?.name
                                    )
                                      ? "Credit"
                                      : "Non-Credit"}
                                  </Badge>
                                </td>
                                {activeTab !== "all" && <td>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="me-2"
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setShowEditModal(true);
                                    }}
                                  >
                                    <FaEdit /> Update
                                  </Button>
                                </td>}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="10" className="text-center">
                                No invoices found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </Tab.Pane>
                  </Tab.Content>
                )}
              </Col>
            </Row>
          </Tab.Container>
        </Card.Body>
      </Card>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Invoices</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Select Excel File</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <Form.Text className="text-muted">
              Only Excel files are accepted for non-credit invoices
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? <Spinner size="sm" /> : "Upload"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit/Update Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Update Payment - {selectedInvoice?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInvoice && (
            <Row>
              <Col md={6}>
                <Table bordered>
                  <tbody>
                    <tr>
                      <th>Customer</th>
                      <td>{selectedInvoice.customer?.name}</td>
                    </tr>
                    <tr>
                      <th>Booking #</th>
                      <td>{selectedInvoice.booking_no}</td>
                    </tr>
                    <tr>
                      <th>Total Amount</th>
                      <td>
                        {selectedInvoice.currency}{" "}
                        {parseFloat(selectedInvoice.total_amount).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <th>Amount Received</th>
                      <td>
                        {selectedInvoice.currency}{" "}
                        {parseFloat(selectedInvoice.amount_received).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <th>Balance</th>
                      <td>
                        {selectedInvoice.currency}{" "}
                        {parseFloat(selectedInvoice.balance).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Payment Amount</Form.Label>
                  <Form.Control
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    min="0"
                    max={selectedInvoice.balance}
                    step="0.01"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>New Balance</Form.Label>
                  <Form.Control
                    type="text"
                    value={`${selectedInvoice.currency} ${(
                      parseFloat(selectedInvoice.balance) -
                      parseFloat(paymentAmount || 0)
                    ).toFixed(2)}`}
                    readOnly
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>New Status</Form.Label>
                  <Form.Control
                    type="text"
                    value={
                      parseFloat(paymentAmount || 0) >=
                      parseFloat(selectedInvoice.balance)
                        ? "Paid"
                        : parseFloat(paymentAmount || 0) > 0
                        ? "Partial"
                        : "Open"
                    }
                    readOnly
                  />
                </Form.Group>
                {isNonCredit && <Form.Group>
                  <Form.Label>Select Excel File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <Form.Text className="text-muted">
                    Only Excel files are accepted for non-credit invoices
                  </Form.Text>
                </Form.Group>}
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePaymentUpdate}
            disabled={
              !paymentAmount || parseFloat(paymentAmount) <= 0 || loading
            }
          >
            {loading ? <Spinner size="sm" /> : "Update Payment"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Account_receivable;
