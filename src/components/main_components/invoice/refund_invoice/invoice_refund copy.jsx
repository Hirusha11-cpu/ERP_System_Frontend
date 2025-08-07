import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Card,
  Table,
  Form,
  Button,
  Badge,
  Modal,
  Row,
  Col,
  InputGroup,
  Alert,
} from "react-bootstrap";
import {
  FaSearch,
  FaMoneyBillWave,
  FaEdit,
  FaCheck,
  FaTimes,
  FaEye,
  FaInfoCircle,
  FaTrash,
  FaPlus,
  FaFileUpload,
  FaFileInvoiceDollar,
  FaPrint,
  FaDownload,
} from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";

const Invoice_refund = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [refundData, setRefundData] = useState({
    refund_amount: "",
    total_amount: "",
    refund_reason: "",
    refund_status: "",
    status: "refund",
    remark: "",
    payment_methods: [],
    refund_attachments: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [companyNo, setCompanyNo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [files, setFiles] = useState([]);
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const companyMap = {
    appleholidays: 2,
    aahaas: 3,
    shirmila: 1,
  };

  // Calculate item total
  const calculateItemTotal = (item) => {
    return (item.price * (1 - item.discount / 100) * item.quantity).toFixed(2);
  };

  const fetchInvoices = async (companyId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/invoicess/all?company_id=${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setInvoices(response.data.data);
      const refundInvoices = response.data.data.filter(
        (invoice) =>
          invoice.refund?.status !== "non-refund" && invoice.refund !== null
      );
      setFilteredInvoices(refundInvoices);
    } catch (err) {
      setError(err.message || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCompany) return;
    
    const companyNumber = companyMap[selectedCompany.toLowerCase()];
    if (!companyNumber) {
      console.error("Unknown company selected:", selectedCompany);
      return;
    }

    setCompanyNo(companyNumber);
    fetchInvoices(companyNumber);
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedInvoice?.refund) {
      setRefundData({
        refund_amount: selectedInvoice.refund.refund_amount || "",
        total_amount: selectedInvoice.total_amount || "",
        refund_reason: selectedInvoice.refund.refund_reason || "",
        refund_status: selectedInvoice.refund.refund_status || "pending",
        status: "refund",
        remark: selectedInvoice.refund.remark || "",
        payment_methods: selectedInvoice.refund.payment_methods || [],
        refund_attachments: selectedInvoice.refund.attachments || [],
      });
    }
  }, [selectedInvoice]);

  // Search invoices by number
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError("Please enter an invoice number");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `/api/invoices/by-number/${searchTerm}?company_id=${companyNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSelectedInvoice(response.data);
      setShowModal(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Invoice not found");
    } finally {
      setLoading(false);
    }
  };

  // Handle refund data changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRefundData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (method) => {
    setRefundData((prev) => {
      const methods = [...prev.payment_methods];
      const index = methods.indexOf(method);

      if (index === -1) {
        methods.push(method);
      } else {
        methods.splice(index, 1);
      }

      return {
        ...prev,
        payment_methods: methods,
      };
    });
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // Remove file from list
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Save refund request
  const handleSave = async () => {
    if (!refundData.refund_amount || !refundData.refund_reason) {
      setError("Refund amount and reason are required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      const refundPayload = {
        refund_amount: parseFloat(refundData.refund_amount),
        total_amount: parseFloat(refundData.total_amount),
        refund_reason: refundData.refund_reason,
        refund_status: refundData.refund_status,
        status: "refund",
        remark: refundData.remark,
        payment_methods: refundData.payment_methods,
      };

      formData.append("refund", JSON.stringify(refundPayload));

      // Add files to formData
      files.forEach((file) => {
        formData.append("attachments[]", file);
      });

      await axios.put(
        `/api/invoices/by-number/${selectedInvoice.invoice_number}?company_id=${companyNo}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh data
      await fetchInvoices(companyNo);
      setShowModal(false);
      setError(null);
    } catch (err) {
      console.error("Refund submission error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update refund status
  const updateRefundStatus = async (status) => {
    try {
      setLoading(true);

      await axios.put(
        `/api/invoices/by-number/${selectedInvoice.invoice_number}?company_id=${companyNo}`,
        {
          refund: {
            ...refundData,
            refund_status: status,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh data
      await fetchInvoices(companyNo);
      
      // Update local state
      setRefundData((prev) => ({ ...prev, refund_status: status }));
      setSelectedInvoice((prev) => ({
        ...prev,
        refund: {
          ...prev.refund,
          refund_status: status,
        },
      }));
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setShowEditModal(true);
  };

  // Open preview modal
  const handlePreview = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPreviewModal(true);
  };

  // Save edited refund
  const handleEditSave = async () => {
    if (!refundData.refund_amount || !refundData.refund_reason) {
      setError("Refund amount and reason are required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      const refundPayload = {
        refund_amount: parseFloat(refundData.refund_amount),
        total_amount: parseFloat(refundData.total_amount),
        refund_reason: refundData.refund_reason,
        refund_status: refundData.refund_status,
        status: "refund",
        remark: refundData.remark,
        payment_methods: refundData.payment_methods,
      };

      formData.append("refund", JSON.stringify(refundPayload));

      // Add existing attachments
      if (refundData.refund_attachments?.length > 0) {
        refundData.refund_attachments.forEach((file) => {
          if (file instanceof File) {
            formData.append("attachments[]", file);
          }
        });
      }

      // Add new files
      files.forEach((file) => {
        formData.append("attachments[]", file);
      });

      await axios.put(
        `/api/invoices/by-number/${selectedInvoice.invoice_number}?company_id=${companyNo}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh data
      await fetchInvoices(companyNo);
      setShowEditModal(false);
      setError(null);
    } catch (err) {
      console.error("Refund update error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle print invoice
  const handlePrintInvoice = async (invoiceId) => {
    try {
      const response = await axios.get(
        `/api/invoices/${invoiceId}/print?company_id=${companyNo}`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const fileLink = document.createElement("a");
      fileLink.href = fileURL;
      fileLink.setAttribute("download", `invoice_${invoiceId}.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
      fileLink.remove();
    } catch (error) {
      console.error("Error printing invoice:", error);
      setError("Failed to download invoice");
    }
  };

  // Render company header based on company number
  const renderCompanyHeader = (invoice) => {
    switch (invoice?.company_id) {
      case 1: // Sharmila Tours & Travels
        return (
          <div className="text-center mb-3">
            <h4 className="mb-1 fw-bold">Sharmila Tours & Travels</h4>
            <div className="mb-1">
              No: 148, Aluthmawatha Road, Colombo - 15, Sri Lanka
            </div>
            <div className="mb-1">Tel:011 23 52 400 | 011 23 45 800</div>
            <h5 className="fw-bold mb-3">INVOICE</h5>
          </div>
        );
      case 2: // Apple Holidays
        return (
          <div className="text-center mb-3">
            <img
              src="/images/logo/appleholidays_extend.png"
              alt="Apple Holidays Destination Services"
              className="img-fluid mb-3"
              style={{ width: "400px" }}
            />
            <div>One Galle Face Tower, 2208, 1A Centre Road, Colombo 002</div>
            <div>Tel: 011 2352 400 | Web: www.appleholidaysds.com</div>
            <h5 className="fw-bold mb-3 mt-3">INVOICE</h5>
          </div>
        );
      case 3: // Aahaas
        return (
          <div className="text-center mb-3">
            <img
              src="/images/logo/aahaas.png"
              alt="Aahaas Logo"
              className="img-fluid mb-3"
              style={{ width: "200px" }}
            />
            <div>One Galle Face Tower, 2208, 1A Centre Road, Colombo 002</div>
            <div>Tel: 011 2352 400 | Web: www.aahaas.com</div>
            <h5 className="fw-bold mb-3">INVOICE</h5>
          </div>
        );
      default:
        return (
          <div className="text-center mb-3">
            <h4 className="mb-1 fw-bold">Invoice</h4>
            <h5 className="fw-bold mb-3">INVOICE</h5>
          </div>
        );
    }
  };

  return (
    <Container className="py-4">
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">
            <FaMoneyBillWave className="me-2" />
            Invoice Refund Management
          </h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="mb-4">
            <Col md={8}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search by invoice number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button 
                  variant="primary" 
                  onClick={handleSearch}
                  disabled={loading || !searchTerm.trim()}
                >
                  <FaSearch className="me-1" /> Search
                </Button>
              </InputGroup>
            </Col>
          </Row>

          <Card>
            <Card.Header>
              <h3 className="mb-0">Refund Requests</h3>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No refund requests found.</p>
                </div>
              ) : (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Refund Amount</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.invoice_number}</td>
                        <td>{invoice.customer?.name || "N/A"}</td>
                        <td>
                          {invoice.total_amount} {invoice.currency}
                        </td>
                        <td>
                          {invoice.refund?.refund_amount || "N/A"} {invoice.currency}
                        </td>
                        <td>
                          <small>
                            {invoice.refund?.refund_reason || "N/A"}
                          </small>
                        </td>
                        <td>
                          <Badge
                            bg={
                              invoice.refund?.refund_status === "confirmed"
                                ? "success"
                                : invoice.refund?.refund_status === "cancelled"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {invoice.refund?.refund_status || "N/A"}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex">
                            <Button
                              variant="info"
                              size="sm"
                              className="me-2"
                              onClick={() => handlePreview(invoice)}
                              disabled={loading}
                            >
                              <FaEye /> View
                            </Button>
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleEdit(invoice)}
                              disabled={loading}
                            >
                              <FaEdit /> Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>

      {/* View Refund Details Modal */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Refund Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInvoice && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <h5>Invoice Information</h5>
                  <p>
                    <strong>Invoice #:</strong> {selectedInvoice.invoice_number}
                  </p>
                  <p>
                    <strong>Customer:</strong>{" "}
                    {selectedInvoice.customer?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Total Amount:</strong>{" "}
                    {selectedInvoice.total_amount} {selectedInvoice.currency}
                  </p>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center">
                    <h5 className="mb-0 me-2">Status:</h5>
                    <Badge
                      bg={
                        selectedInvoice.refund?.refund_status === "confirmed"
                          ? "success"
                          : selectedInvoice.refund?.refund_status === "cancelled"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {selectedInvoice.refund?.refund_status}
                    </Badge>
                  </div>
                </Col>
              </Row>

              <h5>Refund Details</h5>
              <Table bordered>
                <tbody>
                  <tr>
                    <td>
                      <strong>Refund Amount</strong>
                    </td>
                    <td>
                      {selectedInvoice.refund?.refund_amount}{" "}
                      {selectedInvoice.currency}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Reason</strong>
                    </td>
                    <td>{selectedInvoice.refund?.refund_reason}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Status</strong>
                    </td>
                    <td>
                      <Badge
                        bg={
                          selectedInvoice.refund?.refund_status === "confirmed"
                            ? "success"
                            : selectedInvoice.refund?.refund_status === "cancelled"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {selectedInvoice.refund?.refund_status}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Remark</strong>
                    </td>
                    <td>{selectedInvoice.refund?.remark || "N/A"}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Payment Methods</strong>
                    </td>
                    <td>
                      {selectedInvoice.refund?.payment_methods?.length > 0
                        ? selectedInvoice.refund.payment_methods
                            .map(method => method.replace("_", " ").toUpperCase())
                            .join(", ")
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Attachments</strong>
                    </td>
                    <td>
                      {selectedInvoice.refund?.attachments?.length > 0 ? (
                        <div>
                          {selectedInvoice.refund.attachments.map(
                            (file, index) => (
                              <div key={index}>
                                <a
                                  href={`/storage/${file}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="me-2"
                                >
                                  Attachment {index + 1}
                                </a>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>

              <div className="d-flex justify-content-end mt-3">
                <Button
                  variant="success"
                  className="me-2"
                  onClick={() => updateRefundStatus("confirmed")}
                  disabled={
                    selectedInvoice.refund?.refund_status === "confirmed" ||
                    loading
                  }
                >
                  <FaCheck className="me-1" /> Confirm Refund
                </Button>
                <Button
                  variant="danger"
                  onClick={() => updateRefundStatus("cancelled")}
                  disabled={
                    selectedInvoice.refund?.refund_status === "cancelled" ||
                    loading
                  }
                >
                  <FaTimes className="me-1" /> Cancel Refund
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowModal(false)}
            disabled={loading}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Refund Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Refund Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInvoice && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <h5>Invoice Information</h5>
                  <p>
                    <strong>Invoice #:</strong> {selectedInvoice.invoice_number}
                  </p>
                  <p>
                    <strong>Customer:</strong>{" "}
                    {selectedInvoice.customer?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Total Amount:</strong>{" "}
                    {selectedInvoice.total_amount} {selectedInvoice.currency}
                  </p>
                </Col>
                <Col md={6}>
                  <div className="d-flex align-items-center">
                    <h5 className="mb-0 me-2">Status:</h5>
                    <Badge
                      bg={
                        selectedInvoice.refund?.refund_status === "confirmed"
                          ? "success"
                          : selectedInvoice.refund?.refund_status === "cancelled"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {selectedInvoice.refund?.refund_status}
                    </Badge>
                  </div>
                </Col>
              </Row>

              <Form>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Refund Amount</Form.Label>
                      <Form.Control
                        type="number"
                        name="refund_amount"
                        value={refundData.refund_amount}
                        onChange={handleChange}
                        max={selectedInvoice.total_amount}
                        min="0"
                        step="0.01"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Total Amount</Form.Label>
                      <Form.Control
                        type="text"
                        value={`${selectedInvoice.total_amount} ${selectedInvoice.currency}`}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Refund Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="refund_reason"
                    value={refundData.refund_reason}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Remark</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="remark"
                    value={refundData.remark}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Payment Methods</Form.Label>
                  <div>
                    {["cash", "bank_transfer", "credit_card"].map((method) => (
                      <Form.Check
                        key={method}
                        inline
                        type="checkbox"
                        id={`payment-method-${method}`}
                        label={method.replace("_", " ").toUpperCase()}
                        checked={refundData.payment_methods.includes(method)}
                        onChange={() => handlePaymentMethodChange(method)}
                      />
                    ))}
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Attachments</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  {files.length > 0 && (
                    <div className="mt-2">
                      <strong>New Files to Upload:</strong>
                      <ul className="list-unstyled">
                        {files.map((file, index) => (
                          <li key={index} className="d-flex align-items-center">
                            <span className="me-2">{file.name}</span>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => removeFile(index)}
                              disabled={loading}
                            >
                              <FaTrash />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {refundData.refund_attachments?.length > 0 && (
                    <div className="mt-2">
                      <strong>Existing Attachments:</strong>
                      <ul className="list-unstyled">
                        {refundData.refund_attachments.map((file, index) => (
                          <li key={index} className="d-flex align-items-center">
                            <a
                              href={`/storage/${file}`}
                              target="_blank"
                              rel="noreferrer"
                              className="me-2"
                            >
                              Attachment {index + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Refund Status</Form.Label>
                  <Form.Select
                    name="refund_status"
                    value={refundData.refund_status}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowEditModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditSave} 
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Invoice Preview Modal */}
      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        size="lg"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaFileInvoiceDollar className="me-2" />
            Invoice Preview - {selectedInvoice?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedInvoice && (
            <div className="invoice-preview p-4">
              {/* Company Header */}
              {renderCompanyHeader(selectedInvoice)}

              {/* Invoice Meta and Customer Info */}
              <div className="d-flex justify-content-between mb-4">
                <div>
                  <div>
                    <strong>To:</strong>{" "}
                    {selectedInvoice.customer?.name || "N/A"}
                  </div>
                  <div>{selectedInvoice.customer?.address || "N/A"}</div>
                </div>
                <div className="text-end">
                  <div>
                    <strong>No.</strong> {selectedInvoice.invoice_number}
                  </div>
                  <div>
                    <strong>Date</strong>{" "}
                    {formatDate(selectedInvoice.issue_date)}
                  </div>
                  <div>
                    <strong>Your Ref.</strong>{" "}
                    {selectedInvoice.your_ref || "N/A"}
                  </div>
                  <div>
                    <strong>Sales ID</strong>{" "}
                    {selectedInvoice.sales_id || "N/A"}
                  </div>
                  <div>
                    <strong>Printed By</strong>{" "}
                    {selectedInvoice.printed_by || "N/A"}
                  </div>
                </div>
              </div>

              {/* Items Table */}
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
                  {selectedInvoice.items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td style={{ textAlign: "right" }}>
                        {selectedInvoice.currency} {item.price}
                      </td>
                      <td style={{ textAlign: "right" }}>{item.discount}%</td>
                      <td style={{ textAlign: "right" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>
                        {selectedInvoice.currency} {calculateItemTotal(item)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Payment Instructions */}
              {selectedInvoice.payment_instructions && (
                <div className="mb-3">
                  <strong>Payment Instructions:</strong>{" "}
                  {selectedInvoice.payment_instructions}
                </div>
              )}

              {/* Totals */}
              <div className="row mb-4">
                <div className="col-md-6 offset-md-6">
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Sub Total:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {selectedInvoice.currency} {selectedInvoice.sub_total}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Total:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {selectedInvoice.currency}{" "}
                          {selectedInvoice.total_amount}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Amount Received:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {selectedInvoice.currency}{" "}
                          {selectedInvoice.amount_received || "0.00"}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Balance:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {selectedInvoice.currency}{" "}
                          {selectedInvoice.balance || "0.00"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom left: Staff and Remark */}
              <div className="row">
                <div className="col-md-6">
                  {selectedInvoice.remarks && (
                    <div>
                      <strong>Remark:</strong> {selectedInvoice.remarks}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPreviewModal(false)}
            disabled={loading}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => handlePrintInvoice(selectedInvoice?.id)}
            className="d-flex align-items-center"
            disabled={loading}
          >
            <FaPrint className="me-1" /> Print Invoice
          </Button>
          <Button
            variant="success"
            onClick={() => handlePrintInvoice(selectedInvoice?.id)}
            className="d-flex align-items-center"
            disabled={loading}
          >
            <FaDownload className="me-1" /> Download PDF
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Invoice_refund;