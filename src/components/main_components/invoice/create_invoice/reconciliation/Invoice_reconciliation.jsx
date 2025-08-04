import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  Button,
  Card,
  Badge,
  Modal,
  Row,
  Col,
  Form,
  FloatingLabel,
  Accordion,
  OverlayTrigger,
  Tooltip,
  Alert,
} from "react-bootstrap";
import {
  FaEye,
  FaTrash,
  FaPrint,
  FaDownload,
  FaEdit,
  FaPlus,
  FaMinus,
  FaFileInvoiceDollar,
  FaUser,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaReceipt,
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaFilter,
  FaFileExcel,
  FaUpload,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";

const Invoice_reconciliation = () => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [processedData, setProcessedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  const processExcel = (data) => {
    return data.map((row) => ({
      invoice_number: row["Invoice Number"] || row["invoice_number"],
      status: row["Status"] || "completed",
      customer_name: row["Customer Name"] || row["customer_name"],
      amount: row["Amount"] || row["amount"],
      date: row["Date"] || row["date"],
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("Please select a file first");
      return;
    }

    setIsLoading(true);
    setUploadStatus("Processing file...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const processed = processExcel(jsonData);
      setProcessedData(processed);

      const token = localStorage.getItem("authToken");

      const results = await Promise.allSettled(
        processed.map(async (item) => {
          if (!item.invoice_number) return null;

          try {
            const formData = new FormData();
            formData.append("status", item.status);
            formData.append("remarks", "Updated via Excel upload");

            const response = await axios.put(
              `/api/invoices/by-number/${item.invoice_number}`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            return {
              ...item,
              success: true,
              message: "Updated successfully",
              response: response.data,
            };
          } catch (error) {
            return {
              ...item,
              success: false,
              message: error.response?.data?.message || error.message,
            };
          }
        })
      );

      setProcessedData(results.map((result) => result.value).filter(Boolean));
      setUploadStatus(
        `Processed ${processed.length} invoices. ${
          results.filter((r) => r.value?.success).length
        } successful, ${
          results.filter((r) => r.value && !r.value.success).length
        } failed.`
      );
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadStatus("Error processing file: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = processedData.filter((item) => {
    const matchesSearch = item.invoice_number
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusVariants = {
    completed: "success",
    pending: "warning",
    refund: "danger",
    "non-refund": "secondary",
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaFileInvoiceDollar className="me-2" />
          Invoice Reconciliation
        </h5>
        <div>
          <Button
            variant="primary"
            onClick={() => setShowUploadModal(true)}
            className="me-2"
          >
            <FaUpload className="me-2" />
            Upload Excel
          </Button>
          <Button variant="outline-secondary">
            <FaDownload className="me-2" />
            Download Template
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className="mb-4">
          <Col md={6}>
            <FloatingLabel controlId="search" label="Search invoices">
              <Form.Control
                type="text"
                // placeholder="Search invoices"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FloatingLabel>
          </Col>
          <Col md={6}>
            <FloatingLabel controlId="statusFilter" label="Filter by status">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="refund">Refund</option>
                <option value="non-refund">Non-Refund</option>
              </Form.Select>
            </FloatingLabel>
          </Col>
        </Row>

        {uploadStatus && (
          <Alert variant={isLoading ? "info" : "success"} className="mb-4">
            {uploadStatus}
          </Alert>
        )}

        <div className="table-responsive">
          <Table striped bordered hover className="mb-0">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Result</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <Button
                        variant="link"
                        onClick={() =>
                          navigate(`/invoices/${item.invoice_number}`)
                        }
                      >
                        {item.invoice_number}
                      </Button>
                    </td>
                    <td>{item.customer_name || "N/A"}</td>
                    <td>{item.amount ? `$${item.amount}` : "N/A"}</td>
                    <td>{item.date || "N/A"}</td>
                    <td>
                      <Badge
                        pill
                        bg={statusVariants[item.status] || "primary"}
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        pill
                        bg={item.success ? "success" : "danger"}
                      >
                        {item.success ? "Success" : "Failed"}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() =>
                          navigate(`/invoices/${item.invoice_number}`)
                        }
                      >
                        <FaEye />
                      </Button>
                      <Button variant="outline-danger" size="sm">
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    {processedData.length > 0
                      ? "No matching invoices found"
                      : "Upload an Excel file to begin reconciliation"}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card.Body>

      {/* Upload Modal */}
      <Modal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileExcel className="me-2" />
            Upload Invoice Reconciliation File
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Select Excel File</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
            <Form.Text className="text-muted">
              Please upload an Excel file with invoice data. Ensure it includes
              Invoice Number and Status columns.
            </Form.Text>
          </Form.Group>

          {file && (
            <Card className="mb-3">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <FaFileExcel className="text-success me-3" size={24} />
                  <div>
                    <h6 className="mb-1">{file.name}</h6>
                    <small className="text-muted">
                      {(file.size / 1024).toFixed(2)} KB
                    </small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {isLoading && (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 mb-0">Processing file...</p>
            </div>
          )}

          {uploadStatus && (
            <Alert variant={isLoading ? "info" : "success"}>
              {uploadStatus}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowUploadModal(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!file || isLoading}
          >
            {isLoading ? "Processing..." : "Upload and Reconcile"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default Invoice_reconciliation;