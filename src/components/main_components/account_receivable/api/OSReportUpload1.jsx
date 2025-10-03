import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Table, Alert, Modal, Badge, Row, Col, Spinner } from 'react-bootstrap';
import { FaUpload, FaEye, FaLink, FaFileExcel, FaInfoCircle, FaDownload, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const OSReportUpload1 = () => {
  const [file, setFile] = useState(null);
  const [reportType, setReportType] = useState('type1');
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinkedRecords, setUnlinkedRecords] = useState([]);
  const [loadingUnlinked, setLoadingUnlinked] = useState(false);

  // Sample templates for download
  const templateHeaders = {
    type1: ['Invoice No', 'Supplier expectation', 'Invoice Amount', 'Service charges', 'TDS2%', 'Already paid', 'Payout final payment', 'Remarks'],
    type2: ['Invoice #', 'Customer PO #', 'Customer Name', 'Amount (USD)', 'Comment', 'Promised Date', 'Amount Paid', 'Final Due Amount in USD', 'Remark', 'MMT Amount - final amount', 'Remarks']
  };

    const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        showAlert('Please select a valid Excel file (xlsx, xls, csv)', 'danger');
        return;
      }
      setFile(selectedFile);
      previewExcelFile(selectedFile);
    }
  };

  const previewExcelFile = (file) => {
    // In a real implementation, you would use a library like sheetjs to parse Excel
    // For now, we'll just show a mock preview
    const mockData = reportType === 'type1' 
      ? [
          { invoiceNo: 'INV-001', supplierExpectation: 1000, invoiceAmount: 5000, serviceCharges: 200, tds: 100, alreadyPaid: 1000, payoutFinal: 4000, remarks: 'Sample remark' },
          { invoiceNo: 'INV-002', supplierExpectation: 1500, invoiceAmount: 6000, serviceCharges: 250, tds: 120, alreadyPaid: 2000, payoutFinal: 4000, remarks: 'Another remark' }
        ]
      : [
          { invoiceNumber: 'INV-001', customerPO: 'PO-001', customerName: 'Customer A', amountUSD: 5000, comment: 'Sample comment', promisedDate: '2024-01-15', amountPaid: 1000, finalDue: 4000, remark: 'Pending', mmtAmount: 4500, remarks: 'Final remarks' }
        ];
    
    setPreviewData(mockData);
    setShowPreview(true);
  };

  const handleUpload = async () => {
    if (!file) {
      showAlert('Please select a file to upload', 'danger');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('report_type', reportType);

    try {
      
      const response = await axios.post('/api/account-receivables/import-os-report', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showAlert(response.data.message, 'success');
        setFile(null);
        setShowPreview(false);
        loadUnlinkedRecords();
      } else {
        showAlert(response.data.message, 'danger');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Upload failed';
      showAlert(errorMessage, 'danger');
    } finally {
      setUploading(false);
    }
  };

  const loadUnlinkedRecords = async () => {
    setLoadingUnlinked(true);
    try {
      const response = await axios.get('/api/account-receivables/unlinked', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setUnlinkedRecords(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error loading unlinked records:', error);
    } finally {
      setLoadingUnlinked(false);
    }
  };

  const handleLinkToInvoice = async (record) => {
    if (!invoiceNumber.trim()) {
      showAlert('Please enter an invoice number', 'danger');
      return;
    }

    setLinking(true);
    try {
      const response = await axios.post(`/api/account-receivables/${record.id}/link-invoice`, {
        invoice_number: invoiceNumber
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        showAlert('Invoice linked successfully', 'success');
        setShowLinkModal(false);
        setInvoiceNumber('');
        loadUnlinkedRecords();
      } else {
        showAlert(response.data.message, 'danger');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Linking failed';
      showAlert(errorMessage, 'danger');
    } finally {
      setLinking(false);
    }
  };

  const downloadTemplate = () => {
    const headers = templateHeaders[reportType];
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `os-report-${reportType}-template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadUnlinkedRecords();
  }, []);

  return (
    <div className="container-fluid">
      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      <Row>
        <Col md={8}>
          <Card>
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaUpload className="me-2" />
                Upload OS Report
              </h5>
              <Badge bg="light" text="dark">
                {reportType === 'type1' ? 'Type 1' : 'Type 2'}
              </Badge>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Report Type</Form.Label>
                    <Form.Select 
                      value={reportType} 
                      onChange={(e) => setReportType(e.target.value)}
                    >
                      <option value="type1">Type 1 (Supplier OS)</option>
                      <option value="type2">Type 2 (Customer OS)</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      {reportType === 'type1' 
                        ? 'Invoice No, Supplier expectation, Invoice Amount, Service charges, TDS2%, Already paid, Payout final payment, Remarks'
                        : 'Invoice #, Customer PO #, Customer Name, Amount (USD), Comment, Promised Date, Amount Paid, Final Due Amount in USD, Remark, MMT Amount - final amount, Remarks'
                      }
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Excel File</Form.Label>
                    <Form.Control
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                    />
                    <Form.Text className="text-muted">
                      Supported formats: .xlsx, .xls, .csv (Max 10MB)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {file && (
                <Alert variant="info" className="d-flex align-items-center">
                  <FaFileExcel className="me-2 fs-4" />
                  <div>
                    <strong>Selected file:</strong> {file.name}
                    <br />
                    <small>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</small>
                  </div>
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="ms-auto"
                    onClick={() => setShowPreview(true)}
                  >
                    <FaEye className="me-1" />
                    Preview
                  </Button>
                </Alert>
              )}

              <div className="d-flex gap-2">
                <Button
                  variant="success"
                  onClick={handleUpload}
                  disabled={!file || uploading}
                >
                  {uploading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload className="me-1" />
                      Upload Report
                    </>
                  )}
                </Button>

                <Button
                  variant="outline-secondary"
                  onClick={downloadTemplate}
                >
                  <FaDownload className="me-1" />
                  Download Template
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0">
                <FaInfoCircle className="me-2" />
                Report Formats
              </h6>
            </Card.Header>
            <Card.Body>
              {reportType === 'type1' ? (
                <div>
                  <h6>Type 1 - Supplier OS Report</h6>
                  <small className="text-muted">
                    Required columns:
                    <ul className="mt-2">
                      <li>Invoice No</li>
                      <li>Supplier expectation</li>
                      <li>Invoice Amount</li>
                      <li>Service charges</li>
                      <li>TDS2%</li>
                      <li>Already paid</li>
                      <li>Payout final payment</li>
                      <li>Remarks</li>
                    </ul>
                  </small>
                </div>
              ) : (
                <div>
                  <h6>Type 2 - Customer OS Report</h6>
                  <small className="text-muted">
                    Required columns:
                    <ul className="mt-2">
                      <li>Invoice #</li>
                      <li>Customer PO #</li>
                      <li>Customer Name</li>
                      <li>Amount (USD)</li>
                      <li>Comment</li>
                      <li>Promised Date</li>
                      <li>Amount Paid</li>
                      <li>Final Due Amount in USD</li>
                      <li>Remark</li>
                      <li>MMT Amount - final amount</li>
                      <li>Remarks</li>
                    </ul>
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Unlinked Records Table */}
      <Card className="mt-4">
        <Card.Header className="bg-warning text-dark d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <FaLink className="me-2" />
            Unlinked Account Receivables
          </h6>
          <Button variant="outline-dark" size="sm" onClick={loadUnlinkedRecords}>
            Refresh
          </Button>
        </Card.Header>
        <Card.Body>
          {loadingUnlinked ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : unlinkedRecords.length > 0 ? (
            <div className="table-responsive">
              <Table striped hover size="sm">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer Name</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unlinkedRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.invoice_number}</td>
                      <td>{record.customer_name}</td>
                      <td>${record.invoice_amount}</td>
                      <td>
                        <Badge bg={
                          record.status === 'paid' ? 'success' :
                          record.status === 'partially_paid' ? 'warning' :
                          record.status === 'overdue' ? 'danger' : 'secondary'
                        }>
                          {record.status}
                        </Badge>
                      </td>
                      <td>{new Date(record.created_at).toLocaleDateString()}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowLinkModal(true);
                          }}
                        >
                          <FaLink className="me-1" />
                          Link Invoice
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info" className="text-center">
              No unlinked account receivables found.
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>File Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  {reportType === 'type1' ? (
                    <>
                      <th>Invoice No</th>
                      <th>Supplier Exp.</th>
                      <th>Invoice Amt</th>
                      <th>Service Charges</th>
                      <th>TDS</th>
                      <th>Already Paid</th>
                      <th>Payout Final</th>
                      <th>Remarks</th>
                    </>
                  ) : (
                    <>
                      <th>Invoice #</th>
                      <th>Customer PO</th>
                      <th>Customer Name</th>
                      <th>Amount (USD)</th>
                      <th>Comment</th>
                      <th>Promised Date</th>
                      <th>Amount Paid</th>
                      <th>Final Due</th>
                      <th>MMT Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index}>
                    {reportType === 'type1' ? (
                      <>
                        <td>{row.invoiceNo}</td>
                        <td>${row.supplierExpectation}</td>
                        <td>${row.invoiceAmount}</td>
                        <td>${row.serviceCharges}</td>
                        <td>${row.tds}</td>
                        <td>${row.alreadyPaid}</td>
                        <td>${row.payoutFinal}</td>
                        <td>{row.remarks}</td>
                      </>
                    ) : (
                      <>
                        <td>{row.invoiceNumber}</td>
                        <td>{row.customerPO}</td>
                        <td>{row.customerName}</td>
                        <td>${row.amountUSD}</td>
                        <td>{row.comment}</td>
                        <td>{row.promisedDate}</td>
                        <td>${row.amountPaid}</td>
                        <td>${row.finalDue}</td>
                        <td>${row.mmtAmount}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Link Invoice Modal */}
      <Modal show={showLinkModal} onHide={() => setShowLinkModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Link to Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <div>
              <p>
                <strong>Account Receivable:</strong> {selectedRecord.invoice_number}
                <br />
                <strong>Customer:</strong> {selectedRecord.customer_name}
                <br />
                <strong>Amount:</strong> ${selectedRecord.invoice_amount}
              </p>
              <Form.Group>
                <Form.Label>Invoice Number to Link</Form.Label>
                <Form.Control
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number..."
                />
                <Form.Text className="text-muted">
                  Enter the exact invoice number from the system
                </Form.Text>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLinkModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleLinkToInvoice(selectedRecord)}
            disabled={linking || !invoiceNumber.trim()}
          >
            {linking ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Linking...
              </>
            ) : (
              <>
                <FaLink className="me-1" />
                Link Invoice
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OSReportUpload1;