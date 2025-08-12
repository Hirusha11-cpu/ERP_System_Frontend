import React, { useState, useEffect, useContext } from "react";
import { Modal, Button, Form, Table, Card, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaSearch, FaPlus, FaEye, FaPrint, FaDownload, FaSyncAlt, FaFileInvoiceDollar, FaUser, FaCalendarAlt, FaMoneyBillWave, FaTrash, FaCog } from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "../../invoice/upload_invoice/InvoicePDF";
import ReactDOM from "react-dom";

const Master_sheet = ({ apiName }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
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
    if (companyNo) fetchInvoices();
  }, [companyNo]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/invoicesss/all", {
        params: { company_id: companyNo },
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(response.data || []);
    } catch (error) {
      setError("Failed to fetch invoices. Please try again.");
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };
  console.log(apiName, "API Name");
  
  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customer?.name === `${apiName}` &&
      (invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === "all" || invoice.status.toLowerCase() === filterStatus.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusLower = status.toLowerCase();
    const badgeConfig = {
      open: { bg: "warning", text: "dark", icon: <FaCalendarAlt className="me-1" />, label: "Open" },
      paid: { bg: "success", icon: <FaMoneyBillWave className="me-1" />, label: "Paid" },
      cancelled: { bg: "danger", icon: <FaTrash className="me-1" />, label: "Cancelled" },
    };
    const config = badgeConfig[statusLower] || { bg: "secondary", icon: <FaCog className="me-1" />, label: status };
    return (
      <Badge bg={config.bg} text={config.text} className="d-flex align-items-center">
        {config.icon} {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => (dateString ? new Date(dateString).toLocaleDateString() : "N/A");

  const calculateItemTotal = (item) => (item.price * (1 - item.discount / 100) * item.quantity).toFixed(2);

  const handleViewInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setShowPreviewModal(true);
  };

  const handlePrintInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    const pdfLink = (
      <PDFDownloadLink document={<InvoicePDF invoice={invoice} />} fileName={`invoice_${invoice.invoice_number}.pdf`}>
        {({ loading }) => (loading ? "Loading document..." : "Download now!")}
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
            <FaFileInvoiceDollar className="me-2" />
            {apiName} Invoice List
          </h5>
          <Button variant="light" className="d-flex align-items-center" disabled>
            <FaPlus className="me-1" /> New Invoice
          </Button>
        </Card.Header>

        <Card.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="d-flex mb-4">
            <div className="input-group me-3" style={{ width: "300px" }}>
              <span className="input-group-text">
                <FaSearch />
              </span>
              <Form.Control
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Form.Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: "150px" }}
              className="me-3"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
            <Button variant="outline-secondary" onClick={fetchInvoices} className="d-flex align-items-center">
              <FaSyncAlt className="me-1" /> Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading invoices...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Invoice No.</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className={
                          invoice.status.toLowerCase() === "cancelled"
                            ? "table-danger"
                            : invoice.status.toLowerCase() === "paid"
                            ? "table-success"
                            : invoice.status.toLowerCase() === "open"
                            ? "table-warning"
                            : ""
                        }
                      >
                        <td>
                          <strong>{invoice.invoice_number}</strong>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <FaUser />
                            </div>
                            <div>
                              <div>{invoice.customer?.name || "N/A"}</div>
                              <small className="text-muted">{invoice.customer?.email || ""}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaCalendarAlt className="me-2 text-muted" />
                            {formatDate(invoice.issue_date)}
                          </div>
                          <small className="text-muted">Due: {formatDate(invoice.due_date)}</small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaMoneyBillWave className="me-2 text-muted" />
                            {invoice.currency} {invoice.total_amount}
                          </div>
                        </td>
                        <td>{getStatusBadge(invoice.status)}</td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end">
                            <ActionButton
                              icon={<FaEye />}
                              label="View"
                              variant="info"
                              onClick={() => handleViewInvoice(invoice)}
                            />
                            <ActionButton
                              icon={<FaPrint />}
                              label="Print"
                              variant="secondary"
                              onClick={() => handlePrintInvoice(invoice)}
                            />
                            <ActionButton
                              icon={<FaDownload />}
                              label="Download"
                              variant="success"
                              onClick={() => handlePrintInvoice(invoice)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <FaFileInvoiceDollar size={48} className="text-muted mb-3" />
                          <h5>No invoices found for {apiName}</h5>
                          <p className="text-muted">Try adjusting your search or check the data</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>

        {filteredInvoices.length > 0 && (
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <div>
              Showing <strong>{filteredInvoices.length}</strong> of <strong>{invoices.length}</strong> invoices
            </div>
            <div className="d-flex">
              <Button variant="outline-primary" size="sm" className="me-2">
                <FaDownload className="me-1" /> Export
              </Button>
              <Button variant="outline-secondary" size="sm">
                <FaPrint className="me-1" /> Print List
              </Button>
            </div>
          </Card.Footer>
        )}
      </Card>

      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="lg" fullscreen="lg-down">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaFileInvoiceDollar className="me-2" />
            Invoice Preview - {currentInvoice?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {currentInvoice && (
            <div className="invoice-preview p-4">
              <div className="text-center mb-3">
                <div className="company-header text-center mb-4">
                  <img
                    src="https://s3-aahaas-prod-assets.s3.ap-southeast-1.amazonaws.com/images/aahaas.png"
                    alt="Aahaas Logo"
                    className="receipt-logo"
                    style={{ width: "200px" }}
                  />
                  <div>One Galle Face Tower, 2208, 1A Centre Road, Colombo 002</div>
                  <div>Tel: 011 2352 400 | Web: www.appleholidaysds.com</div>
                </div>
                <h5 className="fw-bold mb-3">INVOICE</h5>
              </div>

              <div className="d-flex justify-content-between mb-4">
                <div>
                  <div>
                    <strong>To:</strong> {currentInvoice.customer?.name || "N/A"}
                  </div>
                  <div>{currentInvoice.customer?.address || "N/A"}</div>
                </div>
                <div className="text-end">
                  <div>
                    <strong>No.</strong> {currentInvoice.invoice_number}
                  </div>
                  <div>
                    <strong>Date</strong> {formatDate(currentInvoice.issue_date)}
                  </div>
                  <div>
                    <strong>Your Ref.</strong> {currentInvoice.your_ref || "N/A"}
                  </div>
                  <div>
                    <strong>Sales ID</strong> {currentInvoice.sales_id || "N/A"}
                  </div>
                  <div>
                    <strong>Printed By</strong> {currentInvoice.printed_by || "N/A"}
                  </div>
                  <div>
                    <strong>Booking ID</strong> {currentInvoice.booking_no || "N/A"}
                  </div>
                </div>
              </div>

              <table className="table table-bordered mb-3">
                <thead>
                  <tr style={{ backgroundColor: "#343a40", color: "white" }}>
                    <th>Description</th>
                    <th style={{ textAlign: "right" }}>Unit Fare</th>
                    <th style={{ textAlign: "right" }}>Discount</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoice.items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td style={{ textAlign: "right" }}>
                        {currentInvoice.currency} {item.price}
                      </td>
                      <td style={{ textAlign: "right" }}>{item.discount}%</td>
                      <td style={{ textAlign: "right" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>
                        {currentInvoice.currency} {calculateItemTotal(item)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mb-3">{currentInvoice.payment_instructions}</div>

              <div className="row mb-4">
                <div className="col-md-6 offset-md-6">
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Sub Total:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency} {currentInvoice.sub_total}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Total:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency} {currentInvoice.total_amount}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Amount Received:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency} {currentInvoice.amount_received}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Balance:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency} {currentInvoice.balance}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div>
                    <strong>Remark:</strong> {currentInvoice.remarks}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => handlePrintInvoice(currentInvoice)}
            className="d-flex align-items-center"
          >
            <FaPrint className="me-1" /> Print Invoice
          </Button>
          <Button
            variant="success"
            onClick={() => handlePrintInvoice(currentInvoice)}
            className="d-flex align-items-center"
          >
            <FaDownload className="me-1" /> Download PDF
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Master_sheet;