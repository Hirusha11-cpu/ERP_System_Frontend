import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Alert,
  Spinner,
  Table,
  Badge,
  Tabs,
  Tab,
  ProgressBar,
  ListGroup,
  Modal,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import {
  FaUpload,
  FaFolder,
  FaFilePdf,
  FaFileWord,
  FaDownload,
  FaArchive,
  FaInfoCircle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaMoneyBillWave,
  FaHotel,
  FaUtensils,
  FaTicketAlt,
  FaBus,
  FaListAlt,
  FaChartBar,
} from "react-icons/fa";
import axios from "axios";

const Upload_Cost_Sheet = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadType, setUploadType] = useState("single");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [costSheets, setCostSheets] = useState([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingDetails, setProcessingDetails] = useState([]);
  const [showCostModal, setShowCostModal] = useState(false);
  const [editingCost, setEditingCost] = useState(null);
  // const [costForm, setCostForm] = useState({
  //   type: "accommodation",
  //   description: "",
  //   quantity: 1,
  //   rate: 0,
  //   total: 0,
  // });
  const [manualCosts, setManualCosts] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const fileInputRef = useRef(null);
  const initialCostForm = {
    id: null, // for editing existing
    invoice_id: null, // active invoice ID
    type: "", // string
    details: {
      // JSON field
      description: "",
      quantity: 1,
      rate: 0,
    },
    total: 0, // number
    total_mega_cost: 0, // number
    total_tour_cost_without_markup: 0, // number
    profit_loss: 0, // number
    cost_per_person_single: 0, // number
    total_tour_cost: 0, // number
    currency: "USD", // string
  };
  const [costForm, setCostForm] = useState(initialCostForm);

  const costTypes = [
    { value: "accommodation", label: "Accommodation", icon: <FaHotel /> },
    { value: "meal", label: "Meal", icon: <FaUtensils /> },
    { value: "tickets", label: "Tickets", icon: <FaTicketAlt /> },
    { value: "transport", label: "Transport", icon: <FaBus /> },
    { value: "other", label: "Other", icon: <FaListAlt /> },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (uploadType === "single") {
        const validTypes = [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!validTypes.includes(file.type)) {
          setMessage({
            type: "danger",
            text: "Please select a PDF or DOCX file.",
          });
          return;
        }
      } else {
        if (file.type !== "application/zip" && !file.name.endsWith(".zip")) {
          setMessage({ type: "danger", text: "Please select a ZIP file." });
          return;
        }
      }

      setSelectedFile(file);
      setMessage({ type: "", text: "" });
      setProcessingDetails([]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: "danger", text: "Please select a file." });
      return;
    }

    if (uploadType === "single" && !invoiceNumber) {
      setMessage({
        type: "danger",
        text: "Please enter an invoice number for single file upload.",
      });
      return;
    }

    setUploading(true);
    setProcessingDetails([
      { type: "info", message: "Starting upload process..." },
    ]);

    const formData = new FormData();
    formData.append("cost_sheet", selectedFile);

    if (uploadType === "single") {
      formData.append("invoice_number", invoiceNumber);
    } else {
      formData.append("upload_type", "zip");
    }

    try {
      const endpoint =
        uploadType === "single"
          ? "/api/invoices/cost-sheet"
          : "/api/invoices/cost-sheet-zip";

      const response = await axios.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);

          if (uploadType === "zip") {
            setProcessingDetails((prev) => [
              ...prev,
              {
                type: "info",
                message: `Upload progress: ${percentCompleted}%`,
              },
            ]);
          }
        },
      });

      setMessage({
        type: "success",
        text: response.data.message || "Files uploaded successfully!",
      });

      // Store extracted data for display
      if (response.data.extracted_content) {
        setExtractedData(response.data.extracted_content);
        setActiveInvoice(invoiceNumber);
      }

      // Add processing details for ZIP files
      if (uploadType === "zip" && response.data.processed_files) {
        setProcessingDetails((prev) => [
          ...prev,
          {
            type: "success",
            message: `Processed ${response.data.processed_files} files successfully`,
          },
        ]);
      }

      setSelectedFile(null);
      setInvoiceNumber("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchCostSheets();
    } catch (error) {
      console.error("Upload error:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to upload file(s).";
      setMessage({ type: "danger", text: errorMsg });

      setProcessingDetails((prev) => [
        ...prev,
        { type: "error", message: `Error: ${errorMsg}` },
      ]);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const fetchCostSheets = async () => {
    setLoadingSheets(true);
    try {
      const response = await axios.get("/api/invoices/cost-sheets", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setCostSheets(response.data.data || []);
    } catch (error) {
      console.error("Error fetching cost sheets:", error);
      // setMessage({ type: "danger", text: "Failed to load cost sheets." });
    } finally {
      setLoadingSheets(false);
    }
  };

  const fetchInvoiceCosts = async (invoiceNumber) => {
    try {
      const response = await axios.get(`/api/invoices/${invoiceNumber}/costs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      setManualCosts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching invoice costs:", error);
    }
  };

  const handleDownload = async (costSheet) => {
    try {
      const response = await axios.get(
        `/api/invoices/cost-sheet/${costSheet.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type:
          costSheet.file_type === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", costSheet.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      setMessage({ type: "danger", text: "Failed to download file." });
    }
  };

  const handleViewDetails = async (costSheet) => {
    try {
      const response = await axios.get(
        `/api/invoices/${costSheet.invoice_number}/cost-details`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setExtractedData(response.data);
      setActiveInvoice(costSheet.invoice_number);
      fetchInvoiceCosts(costSheet.invoice_number);
    } catch (error) {
      console.error("Error fetching cost details:", error);
      setMessage({ type: "danger", text: "Failed to load cost details." });
    }
  };

  const handleAddCost = () => {
    setEditingCost(null);
    setCostForm({
      type: "accommodation",
      description: "",
      quantity: 1,
      rate: 0,
      total: 0,
    });
    setShowCostModal(true);
  };

  const handleEditCost = (cost) => {
    setEditingCost(cost);
    setCostForm({
      type: cost.type,
      description: cost.description,
      quantity: cost.quantity,
      rate: cost.rate,
      total: cost.total,
    });
    setShowCostModal(true);
  };

  const handleDeleteCost = async (costId) => {
    if (window.confirm("Are you sure you want to delete this cost?")) {
      try {
        await axios.delete(`/api/costs/${costId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        setMessage({ type: "success", text: "Cost deleted successfully." });
        fetchInvoiceCosts(activeInvoice);
      } catch (error) {
        console.error("Error deleting cost:", error);
        setMessage({ type: "danger", text: "Failed to delete cost." });
      }
    }
  };

  const handleSaveCost = async () => {
    try {
      const costData = {
        invoice_id: activeInvoice,
        type: costForm.type,
        details: costForm.details, // JSON sent directly
        total: costForm.total,
        total_mega_cost: costForm.total_mega_cost,
        total_tour_cost_without_markup: costForm.total_tour_cost_without_markup,
        profit_loss: costForm.profit_loss,
        cost_per_person_single: costForm.cost_per_person_single,
        total_tour_cost: costForm.total_tour_cost,
        currency: costForm.currency,
      };

      if (editingCost) {
        await axios.put(`/api/cost-of-invoices/${activeInvoice}`, costData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
      } else {
        await axios.post("/api/cost-of-invoices", costData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
      }

      setShowCostModal(false);
      fetchInvoiceCosts(activeInvoice);
    } catch (error) {
      console.error("Error saving cost:", error);
    }
  };

  const calculateTotals = () => {
    const extractedTotal = extractedData?.summary?.total_tour_cost || 0;
    const manualTotal = manualCosts.reduce(
      (sum, cost) => sum + cost.quantity * cost.rate,
      0
    );
    return {
      extracted: extractedTotal,
      manual: manualTotal,
      combined: extractedTotal + manualTotal,
    };
  };

  useEffect(() => {
    fetchCostSheets();
  }, []);

  const totals = calculateTotals();

  return (
    <div className="container py-4">
      <h2 className="mb-4">Cost Sheet Management</h2>

      {message.text && (
        <Alert
          variant={message.type}
          dismissible
          onClose={() => setMessage({ type: "", text: "" })}
        >
          {message.text}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <FaUpload className="me-2" />
            Upload Cost Sheet
          </h5>
        </Card.Header>
        <Card.Body>
          <Tabs
            activeKey={uploadType}
            onSelect={(k) => setUploadType(k)}
            className="mb-3"
          >
            <Tab
              eventKey="single"
              title={
                <span>
                  <FaFileWord className="me-1" /> Single File
                </span>
              }
            >
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
                  Maximum file size: 2MB. Files will be organized by
                  month/day/invoice automatically.
                </Form.Text>
              </Form.Group>
            </Tab>

            <Tab
              eventKey="zip"
              title={
                <span>
                  <FaArchive className="me-1" /> Zip Archive
                </span>
              }
            >
              <div className="mt-3">
                <Alert variant="info">
                  <FaInfoCircle className="me-2" />
                  <strong>Zip File Structure Requirements:</strong>
                  <ul className="mb-0 mt-2">
                    <li>
                      ZIP should contain month folders (e.g., "Dec", "Jan")
                    </li>
                    <li>
                      Month folders should contain date folders (e.g., "01 Dec")
                    </li>
                    <li>
                      Date folders should contain invoice folders (e.g.,
                      "IS46224 - Nethlie")
                    </li>
                    <li>Invoice folders should contain PDF or DOCX files</li>
                    <li>
                      Example:{" "}
                      <code>Dec/01 Dec/IS46224 - Nethlie/document.pdf</code>
                    </li>
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
                    Maximum file size: 100MB. The system will automatically
                    extract and organize files.
                  </Form.Text>
                </Form.Group>
              </div>
            </Tab>
          </Tabs>

          {uploading && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span>
                  {uploadType === "single"
                    ? "Uploading..."
                    : "Processing ZIP file..."}
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
                      detail.type === "error"
                        ? "danger"
                        : detail.type === "success"
                        ? "success"
                        : "info"
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
            disabled={
              uploading ||
              !selectedFile ||
              (uploadType === "single" && !invoiceNumber)
            }
          >
            {uploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {uploadType === "single" ? "Uploading..." : "Processing..."}
              </>
            ) : (
              <>
                <FaUpload className="me-2" />
                {uploadType === "single"
                  ? "Upload Cost Sheet"
                  : "Process ZIP File"}
              </>
            )}
          </Button>
        </Card.Body>
      </Card>

      {/* Extracted Data Display */}
      {extractedData && activeInvoice && (
        <Card className="mb-4">
          <Card.Header className="bg-info text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaChartBar className="me-2" />
                Extracted Cost Data - {activeInvoice}
              </h5>
              <Button variant="outline-light" size="sm" onClick={handleAddCost}>
                <FaPlus className="me-1" /> Add Manual Cost
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="mb-4">
              <Col md={6}>
                <h6>Basic Information</h6>
                <Table size="sm" bordered>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Agent:</strong>
                      </td>
                      <td>{extractedData.agent || "N/A"}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Tour Number:</strong>
                      </td>
                      <td>{extractedData.tour_number || "N/A"}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Pax:</strong>
                      </td>
                      <td>{extractedData.pax || "N/A"}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Nights:</strong>
                      </td>
                      <td>{extractedData.no_of_night || "N/A"}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <h6>Financial Summary</h6>
                <Table size="sm" bordered>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Total Mega Cost:</strong>
                      </td>
                      <td>
                        $
                        {extractedData.summary?.total_mega_cost?.toFixed(2) ||
                          "0.00"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Total Tour Cost:</strong>
                      </td>
                      <td>
                        $
                        {extractedData.summary?.total_tour_cost?.toFixed(2) ||
                          "0.00"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Profit/Loss:</strong>
                      </td>
                      <td>
                        $
                        {extractedData.summary?.profit_loss?.toFixed(2) ||
                          "0.00"}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Cost Per Person:</strong>
                      </td>
                      <td>
                        $
                        {extractedData.summary?.cost_per_person_single?.toFixed(
                          2
                        ) || "0.00"}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>

            {/* Manual Costs Section */}
            <div className="mt-4">
              <h6>Manual Costs</h6>
              {manualCosts.length > 0 ? (
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualCosts.map((cost) => (
                      <tr key={cost.id}>
                        <td>
                          <Badge bg="secondary">
                            {costTypes.find((t) => t.value === cost.type)?.icon}{" "}
                            {
                              costTypes.find((t) => t.value === cost.type)
                                ?.label
                            }
                          </Badge>
                        </td>
                        <td>{cost.description}</td>
                        <td>{cost.quantity}</td>
                        <td>${cost.rate.toFixed(2)}</td>
                        <td>${(cost.quantity * cost.rate).toFixed(2)}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditCost(cost)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteCost(cost.id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="info">
                  No manual costs added yet. Click "Add Manual Cost" to add
                  expenses.
                </Alert>
              )}
            </div>

            {/* Combined Totals */}
            <div className="mt-4 p-3 bg-light rounded">
              <h6>Combined Cost Summary</h6>
              <Row>
                <Col md={4}>
                  <strong>Extracted Costs:</strong> $
                  {totals.extracted.toFixed(2)}
                </Col>
                <Col md={4}>
                  <strong>Manual Costs:</strong> ${totals.manual.toFixed(2)}
                </Col>
                <Col md={4}>
                  <strong>Total Combined:</strong> ${totals.combined.toFixed(2)}
                </Col>
              </Row>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* <Card>
        <Card.Header className="bg-light">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaFolder className="me-2" />
              Uploaded Cost Sheets
            </h5>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={fetchCostSheets}
            >
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
                      <Badge
                        bg={sheet.file_type === "pdf" ? "danger" : "primary"}
                      >
                        {sheet.file_type === "pdf" ? (
                          <FaFilePdf className="me-1" />
                        ) : (
                          <FaFileWord className="me-1" />
                        )}
                        {sheet.file_type.toUpperCase()}
                      </Badge>
                    </td>
                    <td>{new Date(sheet.created_at).toLocaleDateString()}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleDownload(sheet)}
                        title="Download"
                      >
                        <FaDownload />
                      </Button>
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleViewDetails(sheet)}
                        title="View Details"
                      >
                        <FaInfoCircle />
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
      </Card> */}

      {/* Add/Edit Cost Modal */}
      <Modal show={showCostModal} onHide={() => setShowCostModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCost ? "Edit Cost" : "Add Manual Cost"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            {/* Cost Type */}
            <Form.Group className="mb-3">
              <Form.Label>Cost Type</Form.Label>
              <Form.Select
                value={costForm.type}
                onChange={(e) =>
                  setCostForm({ ...costForm, type: e.target.value })
                }
                required
              >
                {costTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                value={costForm.description}
                onChange={(e) =>
                  setCostForm({ ...costForm, description: e.target.value })
                }
                placeholder="Enter cost description"
                required
              />
            </Form.Group>

            {/* Quantity & Rate */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={costForm.quantity}
                    onChange={(e) =>
                      setCostForm({
                        ...costForm,
                        quantity: parseInt(e.target.value) || 0,
                        total:
                          (parseInt(e.target.value) || 0) *
                          (costForm.rate || 0),
                      })
                    }
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rate ($)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      value={costForm.rate}
                      onChange={(e) =>
                        setCostForm({
                          ...costForm,
                          rate: parseFloat(e.target.value) || 0,
                          total:
                            (costForm.quantity || 0) *
                            (parseFloat(e.target.value) || 0),
                        })
                      }
                      step="0.01"
                      min="0"
                      required
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            {/* Total */}
            <Form.Group className="mb-3">
              <Form.Label>Total</Form.Label>
              <InputGroup>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  value={costForm.total || costForm.quantity * costForm.rate}
                  readOnly
                  className="fw-bold"
                />
              </InputGroup>
            </Form.Group>

            {/* Additional Fields */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Mega Cost</Form.Label>
                  <Form.Control
                    type="number"
                    value={costForm.total_mega_cost}
                    onChange={(e) =>
                      setCostForm({
                        ...costForm,
                        total_mega_cost: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Tour Cost (Without Markup)</Form.Label>
                  <Form.Control
                    type="number"
                    value={costForm.total_tour_cost_without_markup}
                    onChange={(e) =>
                      setCostForm({
                        ...costForm,
                        total_tour_cost_without_markup:
                          parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Profit / Loss</Form.Label>
                  <Form.Control
                    type="number"
                    value={costForm.profit_loss}
                    onChange={(e) =>
                      setCostForm({
                        ...costForm,
                        profit_loss: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Cost per Person (Single)</Form.Label>
                  <Form.Control
                    type="number"
                    value={costForm.cost_per_person_single}
                    onChange={(e) =>
                      setCostForm({
                        ...costForm,
                        cost_per_person_single: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Total Tour Cost</Form.Label>
              <Form.Control
                type="number"
                value={costForm.total_tour_cost}
                onChange={(e) =>
                  setCostForm({
                    ...costForm,
                    total_tour_cost: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Form.Group>

            {/* Currency */}
            <Form.Group className="mb-3">
              <Form.Label>Currency</Form.Label>
              <Form.Control
                type="text"
                value={costForm.currency || "USD"}
                onChange={(e) =>
                  setCostForm({ ...costForm, currency: e.target.value })
                }
                maxLength={3}
                placeholder="e.g., USD"
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCostModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveCost}>
            {editingCost ? "Update Cost" : "Add Cost"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Upload_Cost_Sheet;
