import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Table, Alert, Modal, Badge, Row, Col } from 'react-bootstrap';
import { FaUpload, FaEye, FaLink, FaFileExcel, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';

const OSReportUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [linkInvoiceId, setLinkInvoiceId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [fileType, setFileType] = useState('invoice_data');
  const [creditAgency, setCreditAgency] = useState('');

  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate required fields
    if (fileType === 'invoice_data' && !creditAgency) {
      setMessage({ type: 'warning', text: 'Please select a credit agency for invoice data.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    
    // Only add credit_agency for invoice_data
    if (fileType === 'invoice_data') {
      formData.append('credit_agency', creditAgency);
    }

    setUploading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await axios.post('/api/os-reports/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({ type: 'success', text: response.data.message || 'File uploaded successfully!' });
      fetchReports();
      // Reset form
      setFileType('invoice_data');
      setCreditAgency('');
      event.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Error uploading file';
      setMessage({ type: 'danger', text: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/os-reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setMessage({ type: 'danger', text: 'Error fetching reports' });
    }
  };

  const handleLinkInvoice = async (reportId) => {
    if (!linkInvoiceId) {
      setMessage({ type: 'warning', text: 'Please enter an invoice ID' });
      return;
    }

    try {
      await axios.post(`/api/os-reports/${reportId}/link-invoice`, {
        invoice_id: linkInvoiceId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: 'Invoice linked successfully!' });
      setShowModal(false);
      setLinkInvoiceId('');
      fetchReports();
    } catch (error) {
      console.error('Link error:', error);
      const errorMessage = error.response?.data?.message || 'Error linking invoice';
      setMessage({ type: 'danger', text: errorMessage });
    }
  };

  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setLinkInvoiceId('');
    setShowModal(true);
  };

  const formatFileType = (type) => {
    return type === 'invoice_data' ? 'Invoice Data' : 'Bank Statement';
  };

  const formatCreditAgency = (agency) => {
    const agencies = {
      'mmt': 'MMT (Make My Trip)',
      'pick': 'PICK',
      'other': 'Other'
    };
    return agencies[agency] || agency || 'N/A';
  };

  const getCreditAgencyBadgeVariant = (agency) => {
    switch (agency) {
      case 'mmt': return 'primary';
      case 'pick': return 'warning';
      case 'other': return 'secondary';
      default: return 'light';
    }
  };

  const renderInvoiceDataTable = (data) => (
    <Table striped bordered size="sm">
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Customer</th>
          <th>Amount</th>
          <th>Paid</th>
          <th>Due</th>
          <th>Status</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td>
              <Badge bg={item.status === 'linked' ? 'success' : 'secondary'}>
                {item.invoice_number}
              </Badge>
            </td>
            <td>{item.customer_name || 'N/A'}</td>
            <td>${(item.invoice_amount || 0).toFixed(2)}</td>
            <td>${(item.amount_paid || 0).toFixed(2)}</td>
            <td>
              <strong>${(item.final_due_amount || 0).toFixed(2)}</strong>
              {item.mmt_final_amount && (
                <div className="small text-muted">
                  MMT: ${(item.mmt_final_amount || 0).toFixed(2)}
                </div>
              )}
              {item.pick_final_amount && (
                <div className="small text-muted">
                  PICK: ${(item.pick_final_amount || 0).toFixed(2)}
                </div>
              )}
            </td>
            <td>
              <Badge bg={item.status === 'linked' ? 'success' : 'warning'}>
                {item.status}
              </Badge>
            </td>
            <td>{item.remarks || item.remark || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  const renderBankStatementTable = (data) => (
    <Table striped bordered size="sm">
      <thead>
        <tr>
          <th>Transaction ID</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Balance</th>
          <th>Invoice Match</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td>{item.transaction_id || 'N/A'}</td>
            <td>{item.transaction_date || item.value_date || 'N/A'}</td>
            <td>
              {item.deposit_amount && (
                <span className="text-success">+${(item.deposit_amount || 0)}</span>
              )}
              {item.withdrawal_amount && (
                <span className="text-danger">-${(item.withdrawal_amount || 0)}</span>
              )}
            </td>
            <td>${(item.balance || 0)}</td>
            <td>
              {item.potential_invoice_numbers && item.potential_invoice_numbers.length > 0 ? (
                <Badge bg="info">
                  {item.potential_invoice_numbers.join(', ')}
                </Badge>
              ) : (
                <span className="text-muted">None</span>
              )}
            </td>
            <td>{item.transaction_remarks || 'N/A'}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );

  return (
    <div className="container py-4">
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: '', text: '' })} dismissible>
          {message.text}
        </Alert>
      )}

      <Card className="shadow">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaFileExcel className="me-2" />
            OS Report Upload
          </h5>
        </Card.Header>

        <Card.Body>
          {/* Upload Form */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>File Type</strong>
                    </Form.Label>
                    <Form.Select
                      value={fileType}
                      onChange={(e) => {
                        setFileType(e.target.value);
                        if (e.target.value !== 'invoice_data') {
                          setCreditAgency('');
                        }
                      }}
                    >
                      <option value="invoice_data">Invoice Data</option>
                      <option value="bank_statement">Bank Statement</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                {fileType === 'invoice_data' && (
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <strong>Credit Agency <FaInfoCircle className="text-muted" size={12} /></strong>
                      </Form.Label>
                      <Form.Select
                        value={creditAgency}
                        onChange={(e) => setCreditAgency(e.target.value)}
                      >
                        <option value="">Select Credit Agency</option>
                        <option value="mmt">MMT (Make My Trip)</option>
                        <option value="pick">PICK</option>
                        <option value="other">Other</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        MMT: 11-column format | PICK: Invoice, Amount, Remark | Other: Basic format
                      </Form.Text>
                    </Form.Group>
                  </Col>
                )}

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <strong>Upload File</strong>
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {uploading && (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Uploading...</span>
                  </div>
                  <p className="mt-2 text-muted">Processing file...</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Reports Table */}
          <div className="table-responsive">
            <Table hover responsive>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Credit Agency</th>
                  <th>Rows</th>
                  <th>Upload Date</th>
                  <th>Linked Invoice</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div>
                        <strong>{report.file_name}</strong>
                        {report.total_rows && (
                          <small className="text-muted d-block">
                            {report.total_rows} rows processed
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge bg={report.file_type === 'invoice_data' ? 'primary' : 'info'}>
                        {formatFileType(report.file_type)}
                      </Badge>
                    </td>
                    <td>
                      {report.credit_agency ? (
                        <Badge bg={getCreditAgencyBadgeVariant(report.credit_agency)}>
                          {formatCreditAgency(report.credit_agency)}
                        </Badge>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td>{report.data?.length || 0}</td>
                    <td>{new Date(report.created_at).toLocaleDateString()}</td>
                    <td>
                      {report.invoice ? (
                        <Badge bg="success">
                          #{report.invoice.invoice_number}
                        </Badge>
                      ) : (
                        <span className="text-muted">Not linked</span>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => viewReportDetails(report)}
                      >
                        <FaEye /> View
                      </Button>
                      {!report.invoice_id && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setLinkInvoiceId('');
                            setShowModal(true);
                          }}
                        >
                          <FaLink /> Link
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="text-muted">
                        <FaFileExcel className="mb-2" size={48} />
                        <p>No reports uploaded yet. Upload your first file above!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedReport?.file_name} - Details
            <Badge className="ms-2" bg={selectedReport?.file_type === 'invoice_data' ? 'primary' : 'info'}>
              {formatFileType(selectedReport?.file_type)}
            </Badge>
            {selectedReport?.credit_agency && (
              <Badge 
                className="ms-1" 
                bg={getCreditAgencyBadgeVariant(selectedReport.credit_agency)}
              >
                {formatCreditAgency(selectedReport.credit_agency)}
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedReport && (
            <div>
              {/* Link Invoice Section */}
              {!selectedReport.invoice_id && (
                <div className="mb-4 p-3 border rounded">
                  <h6><FaLink className="me-2" />Link to Invoice</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>Invoice ID</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter Invoice ID (e.g., 123)"
                      value={linkInvoiceId}
                      onChange={(e) => setLinkInvoiceId(e.target.value)}
                      className="w-50"
                    />
                    <Form.Text className="text-muted">
                      Link this report to an existing invoice for tracking
                    </Form.Text>
                  </Form.Group>
                  <Button 
                    variant="primary" 
                    onClick={() => handleLinkInvoice(selectedReport.id)}
                    disabled={!linkInvoiceId.trim()}
                  >
                    <FaLink className="me-1" /> Link Invoice
                  </Button>
                </div>
              )}

              {/* Already Linked */}
              {selectedReport.invoice_id && (
                <Alert variant="success" className="mb-4">
                  <FaLink className="me-2" />
                  <strong>Linked to Invoice #{selectedReport.invoice?.invoice_number}</strong>
                  <br />
                  <small className="text-muted">
                    {selectedReport.invoice?.customer_name || 'Customer'} - 
                    ${(selectedReport.invoice?.total_amount || 0).toFixed(2)}
                  </small>
                </Alert>
              )}

              {/* Data Preview */}
              <div className="mb-3">
                <h6>
                  <FaFileExcel className="me-2" />
                  Extracted Data ({selectedReport.data?.length || 0} rows)
                </h6>
                {selectedReport.file_type === 'invoice_data' ? (
                  renderInvoiceDataTable(selectedReport.data || [])
                ) : (
                  renderBankStatementTable(selectedReport.data || [])
                )}
              </div>

              {/* Summary Stats */}
              {selectedReport.data && selectedReport.data.length > 0 && (
                <div className="mt-3 p-3 bg-light rounded">
                  <h6>Summary</h6>
                  <Row>
                    <Col md={3}>
                      <div className="text-center">
                        <div className="fs-3 fw-bold text-primary">
                          {selectedReport.data.length}
                        </div>
                        <div className="text-muted">Total Rows</div>
                      </div>
                    </Col>
                    {selectedReport.file_type === 'invoice_data' && (
                      <>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="fs-3 fw-bold text-success">
                              {(selectedReport.data.filter(item => item.status === 'linked').length)}
                            </div>
                            <div className="text-muted">Linked Invoices</div>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="fs-3 fw-bold text-warning">
                              {selectedReport.data.filter(item => item.status === 'unlinked').length}
                            </div>
                            <div className="text-muted">Unlinked</div>
                          </div>
                        </Col>
                        <Col md={3}>
                          <div className="text-center">
                            <div className="fs-3 fw-bold text-info">
                              ${selectedReport.data.reduce((sum, item) => sum + (item.final_due_amount || 0), 0).toFixed(2)}
                            </div>
                            <div className="text-muted">Total Due</div>
                          </div>
                        </Col>
                      </>
                    )}
                  </Row>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {selectedReport && !selectedReport.invoice_id && (
            <Button 
              variant="primary" 
              onClick={() => handleLinkInvoice(selectedReport.id)}
              disabled={!linkInvoiceId.trim()}
            >
              Link Invoice
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OSReportUpload;