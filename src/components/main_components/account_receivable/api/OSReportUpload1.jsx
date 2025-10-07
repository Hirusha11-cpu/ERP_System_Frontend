import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Table,
  Alert,
  Modal,
  Badge,
  Row,
  Col,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import {
  FaUpload,
  FaEye,
  FaFileExcel,
  FaInfoCircle,
  FaDownload,
  FaTimes,
  FaEdit,
  FaSync,
} from "react-icons/fa";
import axios from "axios";

const OSReportUpload1 = () => {
  const [file, setFile] = useState(null);
  const [reportType, setReportType] = useState("type1");
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });
  const [uploadedRecords, setUploadedRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [updateData, setUpdateData] = useState({ amount_paid: "", final_due_amount_usd: "" });
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  const showAlert = (message, type = "success") => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "success" }), 4000);
  };

  // -------------------- Upload Handlers --------------------
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        showAlert("Please select a valid Excel file (xlsx, xls, csv)", "danger");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        showAlert("File size must be less than 10MB", "danger");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showAlert("Please select a file to upload", "danger");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("report_type", reportType);

    try {
      const response = await axios.post("/api/account-receivables/import-os-report", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        showAlert("Report imported successfully!", "success");
        setFile(null);
        loadUploadedRecords();
      } else {
        console.log(response.data);
        showAlert(response.data.message || "Import failed", "danger");
      }
    } catch (error) {
      console.log(error);
      
      showAlert(error.response?.data?.message || "Import failed", "danger");
    } finally {
      setUploading(false);
    }
  };

  // -------------------- Load Uploaded Records --------------------
  const loadUploadedRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await axios.get("/api/account-receivables/unlinked", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUploadedRecords(response.data.data || []);
      }
    } catch (error) {
      showAlert("Error loading uploaded records", "danger");
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadUploadedRecords();
  }, []);

  // -------------------- Update Invoice --------------------
  const openUpdateModal = (record) => {
    setSelectedInvoice(record);
    setUpdateData({
      amount_paid: record.amount_paid || 0,
      final_due_amount_usd: record.final_due_amount_usd || 0,
    });
    setShowUpdateModal(true);
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData({ ...updateData, [name]: value });
  };

  const handleUpdateSubmit = async () => {
    if (!selectedInvoice) return;

    setUpdating(true);
    try {
      const response = await axios.post(
        `/api/account-receivables/${selectedInvoice.id}/update-invoice-amounts`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showAlert("Invoice updated successfully", "success");
        setShowUpdateModal(false);
        loadUploadedRecords();
      } else {
        console.log(response.data);
        
        showAlert(response.data.message, "danger");
      }
    } catch (error) {
      showAlert(error.response?.data?.message || "Update failed", "danger");
    } finally {
      setUpdating(false);
    }
  };

  // -------------------- Template --------------------
  const templateHeaders = {
    type1: [
      "Invoice No",
      "Supplier expectation",
      "Invoice Amount",
      "Service charges",
      "TDS2%",
      "Already paid",
      "Payout final payment",
      "Remarks",
    ],
    type2: [
      "Invoice #",
      "Customer PO #",
      "Customer Name",
      "Amount (USD)",
      "Comment",
      "Promised Date",
      "Amount Paid",
      "Final Due Amount in USD",
      "Remark",
      "MMT Amount - final amount",
      "Remarks",
    ],
  };

  const downloadTemplate = () => {
    const headers = templateHeaders[reportType];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `os-report-${reportType}-template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------- JSX --------------------
  return (
    <div className="container-fluid">
      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0"><FaUpload className="me-2" />Upload OS Report</h5>
          <Badge bg="light" text="dark">{reportType === "type1" ? "Type 1" : "Type 2"}</Badge>
        </Card.Header>
        <Card.Body>
          <Row className="align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Report Type</Form.Label>
                <Form.Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                  <option value="type1">Type 1 (PICK) </option>
                  <option value="type2">Type 2 (MMT)</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group>
                <Form.Label>Excel File</Form.Label>
                <Form.Control type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Button variant="success" onClick={handleUpload} disabled={!file || uploading} className="w-100">
                {uploading ? <Spinner animation="border" size="sm" /> : <FaUpload className="me-2" />}
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </Col>
          </Row>
          <Button variant="outline-secondary" className="mt-3" onClick={downloadTemplate}>
            <FaDownload className="me-1" />Download Template
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0"><FaEye className="me-2" />Uploaded OS Report Records</h6>
          <Button variant="light" size="sm" onClick={loadUploadedRecords}><FaSync /></Button>
        </Card.Header>
        <Card.Body>
          {loadingRecords ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Amount (USD)</th>
                    <th>Paid</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedRecords.length > 0 ? (
                    uploadedRecords.map((rec, index) => (
                      <tr key={rec.id}>
                        <td>{index + 1}</td>
                        <td>{rec.invoice_number}</td>
                        <td>{rec.customer_name}</td>
                        <td>{rec.invoice_amount}</td>
                        <td>{rec.amount_paid}</td>
                        <td>{rec.payout_final_payment}</td>
                        <td>
                          <Badge bg={
                            rec.status === "paid"
                              ? "success"
                              : rec.status === "partially_paid"
                              ? "warning"
                              : "danger"
                          }>
                            {rec.status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openUpdateModal(rec)}
                          >
                            <FaEdit /> Update
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Update Modal */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Invoice - {selectedInvoice?.invoice_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Amount Paid (USD)</Form.Label>
              <Form.Control
                type="number"
                name="amount_paid"
                value={updateData.amount_paid}
                onChange={handleUpdateChange}
              />
            </Form.Group>
            {/* <Form.Group className="mb-3">
              <Form.Label>Final Due Amount (USD)</Form.Label>
              <Form.Control
                type="number"
                name="final_due_amount_usd"
                value={updateData.final_due_amount_usd}
                onChange={handleUpdateChange}
              />
            </Form.Group> */}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateSubmit} disabled={updating}>
            {updating ? <Spinner animation="border" size="sm" /> : "Update"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OSReportUpload1;
