import React, { useState, useEffect } from 'react';
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
} from 'react-bootstrap';
import {
  FaSearch,
  FaMoneyBillWave,
  FaEdit,
  FaCheck,
  FaTimes,
  FaEye,
  FaInfoCircle,
} from 'react-icons/fa';
import axios from 'axios';

const Invoice_refund = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [refundData, setRefundData] = useState({
    refund_amount: '',
    refund_reason: '',
    refund_status: '',
    status: 'refund',
    remark: '',
    payment_methods: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch all invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/invoicess/all');
        setInvoices(response.data.data);
        // Filter invoices with refunds
        const refundInvoices = response.data.data.filter(invoice => invoice.refund !== null);
        setFilteredInvoices(refundInvoices);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Search invoices by number
  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/by-number/${searchTerm}`);
      setSelectedInvoice(response.data);
      setShowModal(true);
    } catch (err) {
      setError('Invoice not found');
    } finally {
      setLoading(false);
    }
  };

  // Handle refund data changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRefundData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (method) => {
    setRefundData(prev => {
      const methods = [...prev.payment_methods];
      const index = methods.indexOf(method);
      
      if (index === -1) {
        methods.push(method);
      } else {
        methods.splice(index, 1);
      }
      
      return {
        ...prev,
        payment_methods: methods
      };
    });
  };

  // Save refund request
  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.put(`/api/invoices/by-number/${selectedInvoice.invoice_number}`, refundData);
      // Refresh the list after update
      const response = await axios.get('/api/invoicess/all');
      setInvoices(response.data.data);
      const refundInvoices = response.data.data.filter(invoice => invoice.refund !== null);
      setFilteredInvoices(refundInvoices);
      setShowModal(false);
      setRefundData({
        refund_amount: '',
        refund_reason: '',
        refund_status: '',
        status: 'refund',
        remark: '',
        payment_methods: []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update refund status
  const updateRefundStatus = async (status) => {
    try {
      setLoading(true);
      await axios.put(`/api/invoices/by-number/${selectedInvoice.invoice_number}`, {
        ...refundData,
        refund_status: status
      });
      // Refresh the list after update
      const response = await axios.get('/api/invoicess/all');
      setInvoices(response.data.data);
      const refundInvoices = response.data.data.filter(invoice => invoice.refund !== null);
      setFilteredInvoices(refundInvoices);
      setSelectedInvoice(prev => ({
        ...prev,
        refund: {
          ...prev.refund,
          refund_status: status
        }
      }));
    } catch (err) {
      setError(err.message);
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
                    {filteredInvoices.map(invoice => (
                      <tr key={invoice.id}>
                        <td>{invoice.invoice_number}</td>
                        <td>{invoice.customer?.name || 'N/A'}</td>
                        <td>{invoice.total_amount} {invoice.currency}</td>
                        <td>{invoice.refund?.refund_amount || 'N/A'}</td>
                        <td>
                          <small>{invoice.refund?.refund_reason || 'N/A'}</small>
                        </td>
                        <td>
                          <Badge
                            bg={
                              invoice.refund?.refund_status === 'confirmed' ? 'success' :
                              invoice.refund?.refund_status === 'cancelled' ? 'danger' :
                              'warning'
                            }
                          >
                            {invoice.refund?.refund_status || 'N/A'}
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
            {selectedInvoice?.refund ? 'Refund Details' : 'Create Refund Request'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInvoice && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <h5>Invoice Information</h5>
                  <p><strong>Invoice #:</strong> {selectedInvoice.invoice_number}</p>
                  <p><strong>Customer:</strong> {selectedInvoice.customer?.name || 'N/A'}</p>
                  <p><strong>Total Amount:</strong> {selectedInvoice.total_amount} {selectedInvoice.currency}</p>
                </Col>
                <Col md={6}>
                  {selectedInvoice.refund && (
                    <>
                      <h5>Current Status</h5>
                      <Badge
                        bg={
                          selectedInvoice.refund.refund_status === 'confirmed' ? 'success' :
                          selectedInvoice.refund.refund_status === 'cancelled' ? 'danger' :
                          'warning'
                        }
                        className="mb-2"
                      >
                        {selectedInvoice.refund.refund_status}
                      </Badge>
                    </>
                  )}
                </Col>
              </Row>

              {selectedInvoice.refund ? (
                <>
                  <h5 className="mt-4">Refund Details</h5>
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
                        <td><strong>Payment Methods</strong></td>
                        <td>{selectedInvoice.refund.payment_methods?.join(', ') || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Remark</strong></td>
                        <td>{selectedInvoice.refund.remark || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </Table>

                  <div className="d-flex justify-content-end mt-4">
                    <Button
                      variant="success"
                      className="me-2"
                      onClick={() => updateRefundStatus('confirmed')}
                      disabled={selectedInvoice.refund.refund_status === 'confirmed'}
                    >
                      <FaCheck className="me-1" /> Confirm
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => updateRefundStatus('cancelled')}
                      disabled={selectedInvoice.refund.refund_status === 'cancelled'}
                    >
                      <FaTimes className="me-1" /> Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h5 className="mt-4">Create Refund Request</h5>
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
                            placeholder="Enter refund amount"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Refund Reason</Form.Label>
                          <Form.Control
                            type="text"
                            name="refund_reason"
                            value={refundData.refund_reason}
                            onChange={handleChange}
                            placeholder="Enter reason for refund"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={12}>
                        <Form.Group>
                          <Form.Label>Remark</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            name="remark"
                            value={refundData.remark}
                            onChange={handleChange}
                            placeholder="Additional notes"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={12}>
                        <Form.Label>Payment Methods</Form.Label>
                        <div>
                          <Form.Check
                            inline
                            type="checkbox"
                            label="Cash"
                            checked={refundData.payment_methods.includes('cash')}
                            onChange={() => handlePaymentMethodChange('cash')}
                          />
                          <Form.Check
                            inline
                            type="checkbox"
                            label="Bank Transfer"
                            checked={refundData.payment_methods.includes('bank_transfer')}
                            onChange={() => handlePaymentMethodChange('bank_transfer')}
                          />
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {!selectedInvoice?.refund && (
            <Button variant="primary" onClick={handleSave}>
              <FaEdit className="me-1" /> Save Refund Request
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Invoice_refund;