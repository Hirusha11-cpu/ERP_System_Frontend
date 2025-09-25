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
  FaEye,
} from "react-icons/fa";
import axios from "axios";

const Upload_Cost_Sheet = () => {
  const [uploading, setUploading] = useState(false);
  const [costSheets, setCostSheets] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showModal, setShowModal] = useState(false);
  const [selectedCostSheet, setSelectedCostSheet] = useState(null);
  const [editCostData, setEditCostData] = useState({});
  const [activeTab, setActiveTab] = useState("upload");
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  useEffect(() => {
    fetchCostSheets();
  }, []);

  const fetchCostSheets = async () => {
    try {
      const response = await axios.get("/api/sinvoices/cost-sheets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCostSheets(response.data.data || []);
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Failed to fetch cost sheets",
      });
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file || !invoiceNumber) {
      setMessage({ type: "warning", text: "Please provide both invoice number and file" });
      return;
    }

    const formData = new FormData();
    formData.append("cost_sheet", file);
    formData.append("invoice_number", invoiceNumber);

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post("/api/invoices/cost-sheet", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage({ type: "success", text: response.data.message });
      fetchCostSheets();
      setInvoiceNumber("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to upload cost sheet";
      setMessage({ type: "danger", text: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id, originalName) => {
    try {
      const response = await axios.get(`/api/invoices/cost-sheet/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ type: "danger", text: "Failed to download cost sheet" });
    }
  };

  const viewCostSheetDetails = (costSheet) => {
    setSelectedCostSheet(costSheet);
    setEditCostData(costSheet.extracted_data ? JSON.parse(costSheet.extracted_data) : {});
    setShowModal(true);
  };

  const handleUpdateCostData = async () => {
    if (!selectedCostSheet) return;

    try {
      const response = await axios.put(
        `/api/cost-of-invoices/${selectedCostSheet.id}`,
        {
          invoice_id: selectedCostSheet.id,
          type: editCostData.summary ? "summary" : "",
          details: editCostData,
          total: editCostData.summary?.total_mega_cost || 0,
          total_mega_cost: editCostData.summary?.total_mega_cost || 0,
          total_tour_cost_without_markup: editCostData.summary?.total_tour_cost_without_markup || 0,
          profit_loss: editCostData.summary?.profit_loss || 0,
          cost_per_person_single: editCostData.summary?.cost_per_person_single || 0,
          total_tour_cost: editCostData.summary?.total_tour_cost || 0,
          currency: editCostData.currency || "USD",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({ type: "success", text: response.data.message });
      setShowModal(false);
      fetchCostSheets();
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Failed to update cost data",
      });
    }
  };

  const renderCostSheetData = (data) => {
    if (!data) return <p>No data extracted</p>;

    return (
      <Tabs defaultActiveKey="summary" id="cost-sheet-tabs" className="mb-3">
        <Tab eventKey="summary" title={<><FaChartBar /> Summary</>}>
          <ListGroup>
            {data.summary && (
              <>
                <ListGroup.Item>
                  Total Mega Cost: ${data.summary.total_mega_cost?.toFixed(2) || 0}
                </ListGroup.Item>
                <ListGroup.Item>
                  Total Tour Cost (No Markup): ${data.summary.total_tour_cost_without_markup?.toFixed(2) || 0}
                </ListGroup.Item>
                <ListGroup.Item>
                  Profit/Loss: ${data.summary.profit_loss?.toFixed(2) || 0}
                </ListGroup.Item>
                <ListGroup.Item>
                  Cost Per Person: ${data.summary.cost_per_person_single?.toFixed(2) || 0}
                </ListGroup.Item>
                <ListGroup.Item>
                  Total Tour Cost: ${data.summary.total_tour_cost?.toFixed(2) || 0}
                </ListGroup.Item>
              </>
            )}
            <ListGroup.Item>Currency: {data.currency || "USD"}</ListGroup.Item>
          </ListGroup>
        </Tab>
        <Tab eventKey="accommodation" title={<><FaHotel /> Accommodation</>}>
          <Table striped bordered size="sm">
            <thead>
              <tr>
                <th>Hotel</th>
                <th>Nights</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.accommodation?.map((item, index) => (
                <tr key={index}>
                  <td>{item.hotel}</td>
                  <td>{item.nights}</td>
                  <td>${item.total?.toFixed(2)}</td>
                </tr>
              ))}
              {data.accommodation_total && (
                <tr>
                  <td colSpan="2"><strong>Total</strong></td>
                  <td><strong>${data.accommodation_total.toFixed(2)}</strong></td>
                </tr>
              )}
            </tbody>
          </Table>
        </Tab>
        <Tab eventKey="meal" title={<><FaUtensils /> Meals</>}>
          <Table striped bordered size="sm">
            <thead>
              <tr>
                <th>Type</th>
                <th>Adults</th>
                <th>Children</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.meal?.map((item, index) => (
                <tr key={index}>
                  <td>{item.type}</td>
                  <td>{item.adults}</td>
                  <td>{item.children}</td>
                  <td>${item.total?.toFixed(2)}</td>
                </tr>
              ))}
              {data.meal_total && (
                <tr>
                  <td colSpan="3"><strong>Total</strong></td>
                  <td><strong>${data.meal_total.toFixed(2)}</strong></td>
                </tr>
              )}
            </tbody>
          </Table>
        </Tab>
        <Tab eventKey="tickets" title={<><FaTicketAlt /> Tickets</>}>
          <ListGroup>
            <ListGroup.Item>
              Total: ${data.tickets_total?.toFixed(2) || 0}
            </ListGroup.Item>
          </ListGroup>
        </Tab>
        <Tab eventKey="transport" title={<><FaBus /> Transport</>}>
          <Table striped bordered size="sm">
            <thead>
              <tr>
                <th>Type</th>
                <th>Distance/Days</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.transport?.map((item, index) => (
                <tr key={index}>
                  <td>{item.type}</td>
                  <td>{item.distance_days}</td>
                  <td>${item.rate?.toFixed(2)}</td>
                  <td>${item.total?.toFixed(2)}</td>
                </tr>
              ))}
              {data.transport_total && (
                <tr>
                  <td colSpan="3"><strong>Total</strong></td>
                  <td><strong>${data.transport_total.toFixed(2)}</strong></td>
                </tr>
              )}
            </tbody>
          </Table>
        </Tab>
        <Tab eventKey="other" title={<><FaListAlt /> Other Rates</>}>
          <Table striped bordered size="sm">
            <thead>
              <tr>
                <th>Type</th>
                <th>Pax</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.other_rates?.map((item, index) => (
                <tr key={index}>
                  <td>{item.type}</td>
                  <td>{item.pax}</td>
                  <td>${item.rate}</td>
                  <td>${item.total?.toFixed(2)}</td>
                </tr>
              ))}
              {data.other_rates_total && (
                <tr>
                  <td colSpan="3"><strong>Total</strong></td>
                  <td><strong>${data.other_rates_total.toFixed(2)}</strong></td>
                </tr>
              )}
            </tbody>
          </Table>
        </Tab>
      </Tabs>
    );
  };

  return (
    <div className="container py-4">
      {message.text && (
        <Alert variant={message.type} onClose={() => setMessage({ type: "", text: "" })} dismissible>
          {message.text}
        </Alert>
      )}

      <Card className="shadow">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaFilePdf className="me-2" />
            Cost Sheet Management
          </h5>
        </Card.Header>

        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            id="cost-sheet-tabs"
            className="mb-4"
          >
            <Tab eventKey="upload" title={<><FaUpload /> Upload</>}>
              <Card className="mb-4">
                <Card.Body>
                  <Form onSubmit={handleFileUpload}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <strong>Invoice Number <FaInfoCircle className="text-muted" size={12} /></strong>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter invoice number (e.g., VN12345)"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            required
                          />
                          <Form.Text className="text-muted">
                            Must match an existing invoice in the system
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <strong>Cost Sheet File <FaInfoCircle className="text-muted" size={12} /></strong>
                          </Form.Label>
                          <Form.Control
                            type="file"
                            accept=".pdf,.docx"
                            onChange={(e) => setFile(e.target.files[0])}
                            ref={fileInputRef}
                            disabled={uploading}
                            required
                          />
                          <Form.Text className="text-muted">
                            Supported formats: PDF, DOCX. Max size: 2MB
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Button type="submit" variant="primary" disabled={uploading || !file || !invoiceNumber}>
                      {uploading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FaUpload className="me-2" />
                          Upload Cost Sheet
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="list" title={<><FaListAlt /> Cost Sheets</>}>
              <div className="table-responsive">
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Uploaded By</th>
                      <th>Date</th>
                      <th>Total Cost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costSheets.map((sheet) => (
                      <tr key={sheet.id}>
                        <td>
                          <Badge bg="primary">{sheet.invoice_number}</Badge>
                        </td>
                        <td>{sheet.original_name}</td>
                        <td>
                          <Badge bg={sheet.file_type === "pdf" ? "danger" : "info"}>
                            {sheet.file_type.toUpperCase()}
                          </Badge>
                        </td>
                        <td>{sheet.uploader?.name || "N/A"}</td>
                        <td>{new Date(sheet.created_at).toLocaleDateString()}</td>
                        <td>
                          ${sheet.extracted_data?.summary?.total_mega_cost?.toFixed(2) || "0.00"}
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => viewCostSheetDetails(sheet)}
                          >
                            <FaEye /> View
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="me-2"
                            onClick={() => handleDownload(sheet.id, sheet.original_name)}
                          >
                            <FaDownload /> Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {costSheets.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="text-muted">
                            <FaFilePdf className="mb-2" size={48} />
                            <p>No cost sheets uploaded yet. Upload one above!</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Cost Sheet: {selectedCostSheet?.original_name}
            <Badge className="ms-2" bg={selectedCostSheet?.file_type === "pdf" ? "danger" : "info"}>
              {selectedCostSheet?.file_type?.toUpperCase()}
            </Badge>
            <Badge className="ms-2" bg="primary">
              {selectedCostSheet?.invoice_number}
            </Badge>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {selectedCostSheet && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <h6><FaInfoCircle /> Basic Information</h6>
                  <ListGroup>
                    <ListGroup.Item>
                      Invoice: {selectedCostSheet.invoice_number}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      Tour: {JSON.parse(selectedCostSheet.extracted_data)?.tour_number || "N/A"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      Agent: {JSON.parse(selectedCostSheet.extracted_data)?.agent || "N/A"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      Pax: {JSON.parse(selectedCostSheet.extracted_data)?.pax || "N/A"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      Travel Date: {JSON.parse(selectedCostSheet.extracted_data)?.travel_date || "N/A"}
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
                <Col md={6}>
                  <h6><FaMoneyBillWave /> Financial Summary</h6>
                  <ListGroup>
                    <ListGroup.Item>
                      Total Mega Cost: ${editCostData.summary?.total_mega_cost?.toFixed(2) || "0.00"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      Profit/Loss: ${editCostData.summary?.profit_loss?.toFixed(2) || "0.00"}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      Currency: {editCostData.currency || "USD"}
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
              </Row>

              {renderCostSheetData(JSON.parse(selectedCostSheet.extracted_data || "{}"))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button
            variant="success"
            onClick={() => handleDownload(selectedCostSheet?.id, selectedCostSheet?.original_name)}
          >
            <FaDownload /> Download
          </Button>
          <Button variant="primary" onClick={handleUpdateCostData}>
            <FaEdit /> Update Data
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Upload_Cost_Sheet;