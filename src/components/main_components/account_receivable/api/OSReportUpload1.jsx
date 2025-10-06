import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Table, Alert, Modal, Badge, Row, Col, Spinner, InputGroup } from 'react-bootstrap';
import { FaUpload, FaEye, FaLink, FaFileExcel, FaInfoCircle, FaDownload, FaTimes, FaSearch, FaSync } from 'react-icons/fa';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [allRecords, setAllRecords] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [activeTab, setActiveTab] = useState('unlinked'); // 'unlinked' or 'all'
  const [showUpdateModal, setShowUpdateModal] = useState(false);
const [selectedRecordForUpdate, setSelectedRecordForUpdate] = useState(null);
const [updateSummary, setUpdateSummary] = useState(null);
const [updating, setUpdating] = useState(false);
const [bulkUpdateMode, setBulkUpdateMode] = useState(false);
const [selectedRecords, setSelectedRecords] = useState([]);


  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

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
      if (selectedFile.size > 10 * 1024 * 1024) {
        showAlert('File size must be less than 10MB', 'danger');
        return;
      }
      setFile(selectedFile);
      previewExcelFile(selectedFile);
    }
  };

  const previewExcelFile = async (file) => {
    try {
      // For real Excel parsing, you would use a library like sheetjs
      // This is a simplified preview
      const reader = new FileReader();
      reader.onload = (e) => {
        // In a real implementation, parse the Excel file here
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
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error previewing file:', error);
      showAlert('Error previewing file', 'danger');
    }
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
        loadAllRecords();
      } else {
        showAlert(response.data.message, 'danger');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Upload failed';
      showAlert(errorMessage, 'danger');
    } finally {
      setUploading(false);
    }
  };

  const loadUnlinkedRecords = async () => {
    setLoadingUnlinked(true);
    try {
      const response = await axios.get('/api/account-receivables/unlinked', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { search: searchTerm }
      });

      if (response.data.success) {
        setUnlinkedRecords(response.data.data.data || response.data.data || []);
      } else {
        showAlert('Failed to load unlinked records', 'danger');
      }
    } catch (error) {
      console.error('Error loading unlinked records:', error);
      showAlert('Error loading unlinked records', 'danger');
    } finally {
      setLoadingUnlinked(false);
    }
  };

  const loadAllRecords = async () => {
    setLoadingAll(true);
    try {
      const response = await axios.get('/api/account-receivables', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { 
          search: searchTerm,
          link_status: 'unlinked'
        }
      });

      if (response.data.success) {
        setAllRecords(response.data.data.data || response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading all records:', error);
    } finally {
      setLoadingAll(false);
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
        setSelectedRecord(null);
        loadUnlinkedRecords();
        loadAllRecords();
      } else {
        showAlert(response.data.message, 'danger');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Linking failed';
      showAlert(errorMessage, 'danger');
    } finally {
      setLinking(false);
    }
  };

  const downloadTemplate = () => {
    const headers = templateHeaders[reportType];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + '\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `os-report-${reportType}-template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const refreshData = () => {
    if (activeTab === 'unlinked') {
      loadUnlinkedRecords();
    } else {
      loadAllRecords();
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeTab, searchTerm]);

  const fetchUpdateSummary = async (record) => {
  try {
    const response = await axios.get(
      `/api/account-receivables/${record.id}/invoice-summary`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    if (response.data.success) {
      setUpdateSummary(response.data.data);
      setSelectedRecordForUpdate(record);
      setShowUpdateModal(true);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch update summary';
    showAlert(errorMessage, 'danger');
  }
};
const handleUpdateInvoiceAmounts = async (record) => {
  setUpdating(true);
  try {
    const response = await axios.post(
      `/api/account-receivables/${record.id}/update-invoice-amounts`,
      {
        amount_paid: record.amount_paid,
        final_due_amount_usd: record.final_due_amount_usd,
        create_payment_record: true
      },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (response.data.success) {
      showAlert('Invoice amounts updated successfully', 'success');
      setShowUpdateModal(false);
      setSelectedRecordForUpdate(null);
      setUpdateSummary(null);
      refreshData();
    } else {
      showAlert(response.data.message, 'danger');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Update failed';
    showAlert(errorMessage, 'danger');
  } finally {
    setUpdating(false);
  }
};

const handleBulkUpdateInvoices = async () => {
  if (selectedRecords.length === 0) {
    showAlert('Please select records to update', 'warning');
    return;
  }

  setUpdating(true);
  try {
    const response = await axios.post(
      '/api/account-receivables/bulk-update-invoice-amounts',
      {
        ar_ids: selectedRecords.map(r => r.id),
        create_payment_records: true
      },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (response.data.success) {
      showAlert(response.data.message, 'success');
      setBulkUpdateMode(false);
      setSelectedRecords([]);
      refreshData();
    } else {
      showAlert(response.data.message, 'danger');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Bulk update failed';
    showAlert(errorMessage, 'danger');
  } finally {
    setUpdating(false);
  }
};

const handleSyncAllInvoices = async () => {
  if (!window.confirm('This will sync all linked account receivables with their invoices. Continue?')) {
    return;
  }

  setUpdating(true);
  try {
    const response = await axios.post(
      '/api/account-receivables/sync-all-invoices',
      {},
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (response.data.success) {
      showAlert(response.data.message, 'success');
      refreshData();
    } else {
      showAlert(response.data.message, 'danger');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Sync failed';
    showAlert(errorMessage, 'danger');
  } finally {
    setUpdating(false);
  }
};
  const templateHeaders = {
    type1: ['Invoice No', 'Supplier expectation', 'Invoice Amount', 'Service charges', 'TDS2%', 'Already paid', 'Payout final payment', 'Remarks'],
    type2: ['Invoice #', 'Customer PO #', 'Customer Name', 'Amount (USD)', 'Comment', 'Promised Date', 'Amount Paid', 'Final Due Amount in USD', 'Remark', 'MMT Amount - final amount', 'Remarks']
  };

  const renderRecordsTable = (records, loading, showLinkButton = true) => {
    if (loading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Loading records...</div>
        </div>
      );
    }

    if (!records || records.length === 0) {
      return (
        <Alert variant="info" className="text-center">
          No records found.
        </Alert>
      );
    }

    return (
      <div className="table-responsive">
        <Table striped hover size="sm">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer Name</th>
              <th>Invoice Amount</th>
              <th>Amount Paid</th>
              <th>Final Due</th>
              <th>Status</th>
              <th>Linked</th>
              <th>Created</th>
              <th>Action</th>
              {/* {showLinkButton && <th>Actions</th>} */}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>
                  <strong>{record.invoice_number}</strong>
                  {record.customer_po_number && (
                    <div><small className="text-muted">PO: {record.customer_po_number}</small></div>
                  )}
                </td>
                <td>{record.customer_name}</td>
                <td>${parseFloat(record.invoice_amount).toLocaleString()}</td>
                <td>${parseFloat(record.amount_paid).toLocaleString()}</td>
                <td>
                  <strong>${parseFloat(record.final_due_amount_usd).toLocaleString()}</strong>
                </td>
                <td>
                  <Badge bg={
                    record.status === 'paid' ? 'success' :
                    record.status === 'partially_paid' ? 'warning' :
                    record.status === 'overdue' ? 'danger' : 'secondary'
                  }>
                    {record.status?.replace('_', ' ') || 'pending'}
                  </Badge>
                </td>
                <td>
                  {record.invoice_id ? (
                    <Badge bg="success">Yes</Badge>
                  ) : (
                    <Badge bg="warning">No</Badge>
                  )}
                </td>
                <td>{new Date(record.created_at).toLocaleDateString()}</td>
                <td>{record.invoice_id && (
  <Button
    variant="outline-success"
    size="sm"
    onClick={() => fetchUpdateSummary(record)}
    title="Update Invoice Amounts"
  >
    <FaSync />
  </Button>
)}</td>
                {/* {showLinkButton && (
                  <td>
                    {!record.invoice_id && (
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
                    )}
                  </td>
                )} */}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

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
                      onChange={(e) => {
                        setReportType(e.target.value);
                        setFile(null);
                        setPreviewData([]);
                      }}
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
                    className="ms-auto me-2"
                    onClick={() => setShowPreview(true)}
                  >
                    <FaEye className="me-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <FaTimes />
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
                    <ul className="mt-2 mb-0">
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
                    <ul className="mt-2 mb-0">
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

      {/* Records Tabs */}
      <Card className="mt-4">
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Button
                variant={activeTab === 'unlinked' ? 'primary' : 'outline-primary'}
                size="sm"
                className="me-2"
                onClick={() => setActiveTab('unlinked')}
              >
                Unlinked Records
                <Badge bg="danger" className="ms-1">
                  {unlinkedRecords.length}
                </Badge>
              </Button>
              <Button
                variant={activeTab === 'all' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setActiveTab('all')}
              >
                All Records
              </Button>

              <Button
  variant="outline-success"
  size="sm"
  onClick={() => setBulkUpdateMode(!bulkUpdateMode)}
  className="me-2"
>
  <FaSync className="me-1" />
  {bulkUpdateMode ? 'Cancel Bulk Update' : 'Bulk Update Invoices'}
</Button>

<Button
  variant="outline-info"
  size="sm"
  onClick={handleSyncAllInvoices}
  disabled={updating}
>
  {updating ? (
    <Spinner animation="border" size="sm" className="me-2" />
  ) : (
    <FaSync className="me-1" />
  )}
  Sync All
</Button>
            </div>
            <div className="d-flex gap-2">
              <InputGroup size="sm" style={{ width: '300px' }}>
                <Form.Control
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
              </InputGroup>
              <Button variant="outline-secondary" size="sm" onClick={refreshData}>
                <FaSync />
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {activeTab === 'unlinked' 
            ? renderRecordsTable(unlinkedRecords, loadingUnlinked, true)
            : renderRecordsTable(allRecords, loadingAll, false)
          }
        </Card.Body>
      </Card>

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>File Preview - {file?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            This is a sample preview. Actual data will be parsed from your Excel file.
          </Alert>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-dark">
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
                      <th>Remarks</th>
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
                        <td>{row.supplierExpectation?.toLocaleString()}</td>
                        <td>{row.invoiceAmount?.toLocaleString()}</td>
                        <td>{row.serviceCharges?.toLocaleString()}</td>
                        <td>{row.tds?.toLocaleString()}</td>
                        <td>{row.alreadyPaid?.toLocaleString()}</td>
                        <td>{row.payoutFinal?.toLocaleString()}</td>
                        <td>{row.remarks}</td>
                      </>
                    ) : (
                      <>
                        <td>{row.invoiceNumber}</td>
                        <td>{row.customerPO}</td>
                        <td>{row.customerName}</td>
                        <td>{row.amountUSD?.toLocaleString()}</td>
                        <td>{row.comment}</td>
                        <td>{row.promisedDate}</td>
                        <td>{row.amountPaid?.toLocaleString()}</td>
                        <td>{row.finalDue?.toLocaleString()}</td>
                        <td>{row.mmtAmount?.toLocaleString()}</td>
                        <td>{row.remarks}</td>
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
          <Button variant="primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              'Upload Now'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Link Invoice Modal */}
      <Modal show={showLinkModal} onHide={() => {
        setShowLinkModal(false);
        setSelectedRecord(null);
        setInvoiceNumber('');
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Link to Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <div>
              <Alert variant="info">
                <strong>Account Receivable Details:</strong>
                <br />
                Invoice: <strong>{selectedRecord.invoice_number}</strong>
                <br />
                Customer: {selectedRecord.customer_name}
                <br />
                Amount: <strong>${parseFloat(selectedRecord.invoice_amount).toLocaleString()}</strong>
              </Alert>
              <Form.Group>
                <Form.Label>Invoice Number to Link</Form.Label>
                <Form.Control
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter exact invoice number..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLinkToInvoice(selectedRecord);
                    }
                  }}
                />
                <Form.Text className="text-muted">
                  Enter the exact invoice number from the system to link this account receivable.
                </Form.Text>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowLinkModal(false);
            setSelectedRecord(null);
            setInvoiceNumber('');
          }}>
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

      // Add the Update Modal
<Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
  <Modal.Header closeButton>
    <Modal.Title>Update Invoice Amounts</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {updateSummary && selectedRecordForUpdate && (
      <div>
        <Alert variant="info">
          <strong>Account Receivable:</strong> {selectedRecordForUpdate.invoice_number}
          <br />
          <strong>Customer:</strong> {selectedRecordForUpdate.customer_name}
        </Alert>
        
        <Table bordered size="sm">
          <thead>
            <tr>
              <th>Field</th>
              <th>Account Receivable</th>
              <th>Invoice</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Amount Paid/Received</td>
              <td>${parseFloat(updateSummary.account_receivable.amount_paid).toLocaleString()}</td>
              <td>${parseFloat(updateSummary.invoice.amount_received).toLocaleString()}</td>
              <td className={updateSummary.update_required ? 'text-warning fw-bold' : ''}>
                {updateSummary.update_required ? 'Update Required' : 'Synced'}
              </td>
            </tr>
            <tr>
              <td>Final Due/Balance</td>
              <td>${parseFloat(updateSummary.account_receivable.final_due_amount_usd).toLocaleString()}</td>
              <td>${parseFloat(updateSummary.invoice.balance).toLocaleString()}</td>
              <td>-</td>
            </tr>
          </tbody>
        </Table>
        
        {updateSummary.payment_difference > 0 && (
          <Alert variant="warning">
            <strong>Payment to be created:</strong> ${parseFloat(updateSummary.payment_difference).toLocaleString()}
          </Alert>
        )}
      </div>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
      Cancel
    </Button>
    <Button 
      variant="primary" 
      onClick={() => handleUpdateInvoiceAmounts(selectedRecordForUpdate)}
      disabled={updating || !updateSummary?.update_required}
    >
      {updating ? (
        <>
          <Spinner animation="border" size="sm" className="me-2" />
          Updating...
        </>
      ) : (
        'Update Invoice'
      )}
    </Button>
  </Modal.Footer>
</Modal>
    </div>
  );
};

export default OSReportUpload1;