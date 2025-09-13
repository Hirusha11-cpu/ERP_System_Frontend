import React, { useState, useRef } from 'react';
import { Card, Button, Form, Alert, Spinner, Table, Badge, Tabs, Tab, ProgressBar, ListGroup } from 'react-bootstrap';
import { FaUpload, FaFolder, FaFilePdf, FaFileWord, FaDownload, FaArchive, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';

const Upload_Cost_Sheet = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState('single');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [costSheets, setCostSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingDetails, setProcessingDetails] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (uploadType === 'single') {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
          setMessage({ type: 'danger', text: 'Please select a PDF or DOCX file.' });
          return;
        }
      } else {
        if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
          setMessage({ type: 'danger', text: 'Please select a ZIP file.' });
          return;
        }
      }
      
      setSelectedFile(file);
      setMessage({ type: '', text: '' });
      setProcessingDetails([]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'danger', text: 'Please select a file.' });
      return;
    }

    if (uploadType === 'single' && !invoiceNumber) {
      setMessage({ type: 'danger', text: 'Please enter an invoice number for single file upload.' });
      return;
    }

    setUploading(true);
    setProcessingDetails([{ type: 'info', message: 'Starting upload process...' }]);
    
    const formData = new FormData();
    formData.append('cost_sheet', selectedFile);
    
    if (uploadType === 'single') {
      formData.append('invoice_number', invoiceNumber);
    } else {
      formData.append('upload_type', 'zip');
    }

    try {
      const endpoint = uploadType === 'single' 
        ? '/api/invoices/cost-sheet' 
        : '/api/invoices/cost-sheet-zip';
        
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
          
          if (uploadType === 'zip') {
            setProcessingDetails(prev => [
              ...prev,
              { type: 'info', message: `Upload progress: ${percentCompleted}%` }
            ]);
          }
        }
      });

      setMessage({ 
        type: 'success', 
        text: response.data.message || 'Files uploaded successfully!' 
      });
      
      // Add processing details for ZIP files
      if (uploadType === 'zip' && response.data.processed_files) {
        setProcessingDetails(prev => [
          ...prev,
          { type: 'success', message: `Processed ${response.data.processed_files} files successfully` }
        ]);
      }
      
      setSelectedFile(null);
      setInvoiceNumber('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchCostSheets();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to upload file(s).';
      setMessage({ type: 'danger', text: errorMsg });
      
      setProcessingDetails(prev => [
        ...prev,
        { type: 'error', message: `Error: ${errorMsg}` }
      ]);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const fetchCostSheets = async () => {
    setLoadingSheets(true);
    try {
      const response = await axios.get('/api/invoices/cost-sheets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setCostSheets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching cost sheets:', error);
      setMessage({ type: 'danger', text: 'Failed to load cost sheets.' });
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleDownload = async (costSheet) => {
    try {
      const response = await axios.get(`/api/invoices/cost-sheet/${costSheet.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { 
        type: costSheet.file_type === 'docx' 
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
          : 'application/pdf' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', costSheet.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setMessage({ type: 'danger', text: 'Failed to download file.' });
    }
  };

  React.useEffect(() => {
    fetchCostSheets();
  }, []);

  return (
    <div className="container py-4">
      <h2 className="mb-4">Cost Sheet Management</h2>
      
      {message.text && (
        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0"><FaUpload className="me-2" />Upload Cost Sheet</h5>
        </Card.Header>
        <Card.Body>
          <Tabs
            activeKey={uploadType}
            onSelect={(k) => setUploadType(k)}
            className="mb-3"
          >
            <Tab eventKey="single" title={
              <span><FaFileWord className="me-1" /> Single File</span>
            }>
              <Form.Group className="mb-3 mt-3">
                <Form.Label>Invoice Number</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter invoice number (e.g., IS46135)"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Cost Sheet File (PDF or DOCX)</Form.Label>
                <Form.Control
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />
                <Form.Text className="text-muted">
                  Maximum file size: 2MB. Files will be organized by month/day/invoice automatically.
                </Form.Text>
              </Form.Group>
            </Tab>
            
            <Tab eventKey="zip" title={
              <span><FaArchive className="me-1" /> Zip Archive</span>
            }>
              <div className="mt-3">
                <Alert variant="info">
                  <FaInfoCircle className="me-2" />
                  <strong>Zip File Structure Requirements:</strong>
                  <ul className="mb-0 mt-2">
                    <li>ZIP should contain month folders (e.g., "Dec", "Jan")</li>
                    <li>Month folders should contain date folders (e.g., "01 Dec")</li>
                    <li>Date folders should contain invoice folders (e.g., "IS46224 - Nethlie")</li>
                    <li>Invoice folders should contain PDF or DOCX files</li>
                    <li>Example: <code>Dec/01 Dec/IS46224 - Nethlie/document.pdf</code></li>
                  </ul>
                </Alert>
                
                <Form.Group className="mb-3">
                  <Form.Label>Zip File with Month Folders</Form.Label>
                  <Form.Control
                    type="file"
                    ref={fileInputRef}
                    accept=".zip"
                    onChange={handleFileChange}
                  />
                  <Form.Text className="text-muted">
                    Maximum file size: 100MB. The system will automatically extract and organize files.
                  </Form.Text>
                </Form.Group>
              </div>
            </Tab>
          </Tabs>

          {uploading && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span>
                  {uploadType === 'single' ? 'Uploading...' : 'Processing ZIP file...'}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <ProgressBar 
                now={uploadProgress} 
                label={`${uploadProgress}%`} 
                animated 
              />
            </div>
          )}

          {processingDetails.length > 0 && (
            <div className="mb-3">
              <h6>Processing Details:</h6>
              <ListGroup>
                {processingDetails.map((detail, index) => (
                  <ListGroup.Item 
                    key={index}
                    variant={
                      detail.type === 'error' ? 'danger' : 
                      detail.type === 'success' ? 'success' : 'info'
                    }
                  >
                    {detail.message}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}

          <Button 
            variant="primary" 
            onClick={handleUpload} 
            disabled={uploading || !selectedFile || (uploadType === 'single' && !invoiceNumber)}
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {uploadType === 'single' ? 'Uploading...' : 'Processing...'}
              </>
            ) : (
              <>
                <FaUpload className="me-2" />
                {uploadType === 'single' ? 'Upload Cost Sheet' : 'Process ZIP File'}
              </>
            )}
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><FaFolder className="me-2" />Uploaded Cost Sheets</h5>
            <Button variant="outline-secondary" size="sm" onClick={fetchCostSheets}>
              Refresh
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {loadingSheets ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading cost sheets...</p>
            </div>
          ) : costSheets.length > 0 ? (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Upload Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {costSheets.map((sheet) => (
                  <tr key={sheet.id}>
                    <td>{sheet.invoice_number}</td>
                    <td>{sheet.file_name}</td>
                    <td>
                      <Badge bg={sheet.file_type === 'pdf' ? 'danger' : 'primary'}>
                        {sheet.file_type === 'pdf' ? <FaFilePdf className="me-1" /> : <FaFileWord className="me-1" />}
                        {sheet.file_type.toUpperCase()}
                      </Badge>
                    </td>
                    <td>{new Date(sheet.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleDownload(sheet)}
                        title="Download"
                      >
                        <FaDownload />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted">
              <FaFolder size={48} className="mb-3" />
              <p>No cost sheets uploaded yet.</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Upload_Cost_Sheet;