import React, { useState, useEffect } from "react";
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
} from "react-bootstrap";
import {
  FaSearch,
  FaMoneyBillWave,
  FaEdit,
  FaCheck,
  FaTimes,
  FaEye,
  FaInfoCircle,
} from "react-icons/fa";
import axios from "axios";

const Invoice_refund = () => {
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
  const [showModal, setShowModal] = useState(false);

  // Fetch all invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/invoicess/all");
        setInvoices(response.data.data);
        // Filter invoices with refunds
        const refundInvoices = response.data.data.filter(
          (invoice) => invoice.refund?.status !== "non-refund"
        );
        setFilteredInvoices(refundInvoices);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

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
        refund_attachments: selectedInvoice.refund.attachments || []
      });
    }
  }, [selectedInvoice]);

  // Search invoices by number
  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/by-number/${searchTerm}`);
      setSelectedInvoice(response.data);
      setShowModal(true);
    } catch (err) {
      setError("Invoice not found");
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

  // Save refund request
  // const handleSave = async () => {
  //   try {
  //     setLoading(true);
  //     await axios.put(`/api/invoices/by-number/${selectedInvoice.invoice_number}`, refundData);
  //     // Refresh the list after update
  //     const response = await axios.get('/api/invoicess/all');
  //     setInvoices(response.data.data);
  //     const refundInvoices = response.data.data.filter(invoice => invoice.refund !== null);
  //     setFilteredInvoices(refundInvoices);
  //     setShowModal(false);
  //     setRefundData({
  //       refund_amount: '',
  //       refund_reason: '',
  //       refund_status: '',
  //       status: 'refund',
  //       remark: '',
  //       payment_methods: []
  //     });
  //   } catch (err) {
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Create the refund object structure that matches Postman
      const refundPayload = {
        refund: {
          refund_amount: parseFloat(refundData.refund_amount),
          total_amount: parseFloat(refundData.total_amount),
          refund_reason: refundData.refund_reason,
          refund_status: "pending", // Default status
          status: "refund", // Change from non-refund to refund
          remark: refundData.remark,
          payment_methods: refundData.payment_methods,
          attachments: refundData.refund_attachments
        }
      };
  
      // Add the refund object as JSON string
      formData.append('refund', JSON.stringify(refundPayload.refund));
      
      // Add attachments if they exist
      if (refundData.refund_attachments?.length > 0) {
        refundData.refund_attachments.forEach((file, index) => {
          formData.append(`attachments[${index}]`, file);
        });
      }
  
      // Debug: Show what's being sent
      console.log('Request payload:', {
        refund: refundPayload.refund,
        attachments: refundData.refund_attachments
      });
  
      await axios.put(
        `/api/invoices/by-number/${selectedInvoice.invoice_number}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
  
      // Refresh data
      const response = await axios.get('/api/invoicess/all');
      setInvoices(response.data.data);
      setFilteredInvoices(response.data.data.filter(invoice => invoice.refund?.status === "refund"));
      
      setShowModal(false);
      setError(null);
    } catch (err) {
      console.error('Refund submission error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  // const handleSave = async () => {
  //   try {
  //     setLoading(true);
      
  //     const formData = new FormData();
  //     console.log(refundData);
  //     // Add all refund data
  //     formData.append('refund[refund_amount]', refundData.refund_amount);
  //     formData.append('refund[total_amount]', refundData.total_amount);
  //     formData.append('refund[refund_reason]', refundData.refund_reason);
  //     formData.append('refund[refund_status]', refundData.refund_status);
  //     formData.append('refund[status]', refundData.status);
  //     formData.append('refund[remark]', refundData.remark);
  //     formData.append('refund[payment_methods]', JSON.stringify(refundData.payment_methods));
      
  //     // Add attachments
  //     refundData.refund_attachments.forEach((file, index) => {
  //       formData.append(`refund[attachments][${index}]`, file);
  //     });
      
  //     console.log('FormData contents:');
  //     for (let [key, value] of formData.entries()) {
  //       console.log(key, value);
  //     }
        
  
  //     await axios.put(
  //       `/api/invoices/by-number/${selectedInvoice.invoice_number}`,
  //       formData,
  //       {
  //         headers: {
  //           'Content-Type': 'multipart/form-data'
  //         }
  //       }
  //     );
  
  //     // Refresh data
  //     const response = await axios.get('/api/invoicess/all');
  //     setInvoices(response.data.data);
  //     setFilteredInvoices(response.data.data.filter(invoice => invoice.refund?.status === "refund"));
      
  //     setShowModal(false);
  //     setError(null);
  //   } catch (err) {
  //     setError(err.response?.data?.message || err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Update refund status
  const updateRefundStatus = async (status) => {
    try {
      setLoading(true);
      
      await axios.put(
        `/api/invoices/by-number/${selectedInvoice.invoice_number}`,
        {
          refund: {
            ...refundData,
            refund_status: status
          }
        }
      );
      
      // Refresh data
      const response = await axios.get('/api/invoices/all');
      setInvoices(response.data.data);
      setFilteredInvoices(response.data.data.filter(invoice => invoice.refund));
      
      // Update local state
      setRefundData(prev => ({ ...prev, refund_status: status }));
      setSelectedInvoice(prev => ({
        ...prev,
        refund: {
          ...prev.refund,
          refund_status: status
        }
      }));
      
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
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
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <Row className="mb-4">
            <Col md={8}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search by invoice number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="primary" onClick={handleSearch}>
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
                        <td>{invoice.refund?.refund_amount || "N/A"}</td>
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
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowModal(true);
                            }}
                          >
                            <FaEye /> View
                          </Button>
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

      {/* Invoice Refund Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>
      {selectedInvoice?.refund ? "Refund Details" : "Create Refund Request"}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedInvoice && (
      <>
        <Row className="mb-3">
          <Col md={6}>
            <h5>Invoice Information</h5>
            <p><strong>Invoice #:</strong> {selectedInvoice.invoice_number}</p>
            <p><strong>Customer:</strong> {selectedInvoice.customer?.name || "N/A"}</p>
            <p><strong>Total Amount:</strong> {selectedInvoice.total_amount} {selectedInvoice.currency}</p>
          </Col>
          <Col md={6}>
            {selectedInvoice.refund && (
              <div className="d-flex align-items-center">
                <h5 className="mb-0 me-2">Status:</h5>
                <Badge bg={
                  selectedInvoice.refund.refund_status === "confirmed" ? "success" :
                  selectedInvoice.refund.refund_status === "cancelled" ? "danger" : "warning"
                }>
                  {selectedInvoice.refund.refund_status}
                </Badge>
              </div>
            )}
          </Col>
        </Row>

        {selectedInvoice.refund?.status !== "non-refund" ? (
          <>
            <h5>Refund Details</h5>
            <Table bordered>
              <tbody>
                <tr>
                  <td><strong>Refund Amount</strong></td>
                  <td>{selectedInvoice.refund.refund_amount} {selectedInvoice.currency}</td>
                </tr>
                <tr>
                  <td><strong>Reason</strong></td>
                  <td>{selectedInvoice.refund.refund_reason}</td>
                </tr>
                <tr>
                  <td><strong>Status</strong></td>
                  <td>
                    <Badge bg={
                      selectedInvoice.refund.refund_status === "confirmed" ? "success" :
                      selectedInvoice.refund.refund_status === "cancelled" ? "danger" : "warning"
                    }>
                      {selectedInvoice.refund.refund_status}
                    </Badge>
                  </td>
                </tr>
                <tr>
                  <td><strong>Remark</strong></td>
                  <td>{selectedInvoice.refund.remark || "N/A"}</td>
                </tr>
                <tr>
                  <td><strong>Attachments</strong></td>
                  <td>
                    {selectedInvoice.refund.attachments?.length > 0 ? (
                      <div>
                        {selectedInvoice.refund.attachments.map((file, index) => (
                          <div key={index}>
                            <a href={`/storage/${file}`} target="_blank" rel="noreferrer">
                              View Attachment {index + 1}
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : "N/A"}
                  </td>
                </tr>
              </tbody>
            </Table>

            <div className="d-flex justify-content-end mt-3">
              <Button
                variant="success"
                className="me-2"
                onClick={() => updateRefundStatus("confirmed")}
                disabled={selectedInvoice.refund.refund_status === "confirmed"}
              >
                <FaCheck className="me-1" /> Confirm Refund
              </Button>
              <Button
                variant="danger"
                onClick={() => updateRefundStatus("cancelled")}
                disabled={selectedInvoice.refund.refund_status === "cancelled"}
              >
                <FaTimes className="me-1" /> Cancel Refund
              </Button>
            </div>
          </>
        ) : (
          <>
            <h5>Create Refund Request</h5>
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
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Total Amount</Form.Label>
                    <Form.Control
                      type="number"
                      name="total_amount"
                      value={selectedInvoice.total_amount}
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
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Payment Methods</Form.Label>
                <div>
                  {['cash', 'bank_transfer', 'credit_card'].map(method => (
                    <Form.Check
                      key={method}
                      inline
                      type="checkbox"
                      label={method.replace('_', ' ').toUpperCase()}
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
                  onChange={(e) => {
                    setRefundData(prev => ({
                      ...prev,
                      refund_attachments: Array.from(e.target.files)
                    }));
                  }}
                />
                {refundData.refund_attachments.length > 0 && (
                  <div className="mt-2">
                    <strong>Selected Files:</strong>
                    <ul>
                      {refundData.refund_attachments.map((file, index) => (
                        <li key={index}>
                          {file.name} 
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              const newFiles = [...refundData.refund_attachments];
                              newFiles.splice(index, 1);
                              setRefundData(prev => ({
                                ...prev,
                                refund_attachments: newFiles
                              }));
                            }}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Form.Group>
            </Form>
          </>
        )}
      </>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Close
    </Button>
    {selectedInvoice?.refund?.status == "non-refund" && (
      <Button variant="primary" onClick={handleSave} type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Submit Refund Request'}
      </Button>
    )}
  </Modal.Footer>
</Modal>
    </Container>
  );
};

export default Invoice_refund;
