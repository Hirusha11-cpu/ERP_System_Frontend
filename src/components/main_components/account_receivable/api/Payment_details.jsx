import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  Card,
  Badge,
  Button,
  Form,
  OverlayTrigger,
  Tooltip,
  Modal,
  Row,
  Col,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaSearch,
  FaEye,
  FaPrint,
  FaDownload,
  FaSyncAlt,
  FaFileInvoiceDollar,
  FaUser,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaReceipt,
} from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "../../invoice/upload_invoice/InvoicePDF";
import ReactDOM from "react-dom";

const Payment_details = ({ apiName }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };
    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

  useEffect(() => {
    if (companyNo) fetchPayments();
  }, [companyNo]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/invoicesss/all", {
              params: { company_id: companyNo },
              headers: { Authorization: `Bearer ${token}` },
            });
      setPayments(response.data || []);
    } catch (error) {
      setError("Failed to fetch payment details. Please try again.");
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) =>
    payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPayment = (payment) => {
    setCurrentPayment(payment);
    setShowModal(true);
  };

  const handlePrintPayment = (payment) => {
    setCurrentPayment(payment);
    const pdfLink = (
      <PDFDownloadLink
        document={<InvoicePDF invoice={payment} />}
        fileName={`payment_${payment.reference_number}.pdf`}
      >
        {({ blob, url, loading, error }) =>
          loading ? "Loading document..." : "Download now!"
        }
      </PDFDownloadLink>
    );

    const tempDiv = document.createElement("div");
    document.body.appendChild(tempDiv);
    ReactDOM.render(pdfLink, tempDiv);

    setTimeout(() => {
      const downloadLink = tempDiv.querySelector("a");
      if (downloadLink) downloadLink.click();
      document.body.removeChild(tempDiv);
    }, 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount, currency) => {
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge bg="success">Completed</Badge>;
      case "pending":
        return <Badge bg="warning" text="dark">Pending</Badge>;
      case "failed":
        return <Badge bg="danger">Failed</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const ActionButton = ({ icon, label, variant = "primary", onClick, disabled = false }) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{label}</Tooltip>}>
      <Button variant={variant} size="sm" className="me-2" onClick={onClick} disabled={disabled}>
        {icon} <span className="d-none d-md-inline">{label}</span>
      </Button>
    </OverlayTrigger>
  );

  return (
    <div className="container py-4">
      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
          <h5 className="mb-0">
            <FaMoneyBillWave className="me-2" />
            {apiName} Payment Details
          </h5>
          <div>
            <Button variant="light" onClick={fetchPayments} className="d-flex align-items-center">
              <FaSyncAlt className="me-1" /> Refresh
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          <div className="d-flex mb-4">
            <div className="input-group me-3" style={{ width: "300px" }}>
              <span className="input-group-text">
                <FaSearch />
              </span>
              <Form.Control
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading payment details...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Invoice No.</th>
                    <th>Payment Method</th>
                    <th>Reference</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <FaCalendarAlt className="me-2 text-muted" />
                          {formatDate(payment.payment_date)}
                        </td>
                        <td>{payment.invoice_number}</td>
                        <td>{payment.payment_method}</td>
                        <td>{payment.reference_number}</td>
                        <td>
                          <FaMoneyBillWave className="me-2 text-muted" />
                          {formatCurrency(payment.amount, payment.currency)}
                        </td>
                        <td>{getStatusBadge(payment.status)}</td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end">
                            <ActionButton
                              icon={<FaEye />}
                              label="View"
                              variant="info"
                              onClick={() => handleViewPayment(payment)}
                            />
                            <ActionButton
                              icon={<FaPrint />}
                              label="Print"
                              variant="secondary"
                              onClick={() => handlePrintPayment(payment)}
                            />
                            <ActionButton
                              icon={<FaDownload />}
                              label="Download"
                              variant="success"
                              onClick={() => handlePrintPayment(payment)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <FaFileInvoiceDollar size={48} className="text-muted mb-3" />
                          <h5>No payment details found for {apiName}</h5>
                          <p className="text-muted">Try adjusting your search or check back later</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>

        {filteredPayments.length > 0 && (
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <div>
              Showing <strong>{filteredPayments.length}</strong> of <strong>{payments.length}</strong> payments
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Payment Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaMoneyBillWave className="me-2" />
            Payment Details - {currentPayment?.reference_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentPayment && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Payment Information</h6>
                  <p><strong>Date:</strong> {formatDate(currentPayment.payment_date)}</p>
                  <p><strong>Amount:</strong> {formatCurrency(currentPayment.amount, currentPayment.currency)}</p>
                  <p><strong>Method:</strong> {currentPayment.payment_method}</p>
                  <p><strong>Status:</strong> {getStatusBadge(currentPayment.status)}</p>
                </Col>
                <Col md={6}>
                  <h6>Related Invoice</h6>
                  <p><strong>Invoice No:</strong> {currentPayment.invoice_number}</p>
                  <p><strong>Customer:</strong> {currentPayment.customer_name}</p>
                  <p><strong>Reference:</strong> {currentPayment.reference_number}</p>
                </Col>
              </Row>
              {currentPayment.notes && (
                <div className="mt-3">
                  <h6>Notes</h6>
                  <p>{currentPayment.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => handlePrintPayment(currentPayment)}>
            <FaPrint className="me-1" /> Print Receipt
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Payment_details;