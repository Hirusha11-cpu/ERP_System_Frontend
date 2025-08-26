import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  Button,
  Form,
  Table,
  Card,
  Nav,
  Tab,
  Row,
  Col,
  Badge,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaSearch,
  FaPlus,
  FaTrash,
  FaEye,
  FaPrint,
  FaDownload,
  FaSyncAlt,
  FaCog,
  FaUpload,
  FaCheck,
  FaList,
} from "react-icons/fa";
import { CompanyContext } from "../../../../../contentApi/CompanyProvider";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

const Invoice_reconciliation = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [uploadedData, setUploadedData] = useState([]);
  const [matchedInvoices, setMatchedInvoices] = useState([]);
  const [unmatchedInvoices, setUnmatchedInvoices] = useState([]);
  const [notReconciledInvoices, setNotReconciledInvoices] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reconciliationStatus, setReconciliationStatus] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [nonMatchedInvoices, setNonMatchedInvoices] = useState([]);
  const [statusUpdate, setStatusUpdate] = useState({
    status: "",
    remark: "",
  });
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };

    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

  useEffect(() => {
    if (companyNo) {
      fetchInvoices();
    }
  }, [companyNo]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `/api/invoices?company_id=${companyNo}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );
      setInvoices(response.data);
      updateNotReconciledList(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setIsLoading(false);
    }
  };

const handleReconcileNonMatched = async (invoice) => {
  try {
    setUpdatingStatus(prev => ({ ...prev, [invoice.invoice_number]: true }));
    
    const token = localStorage.getItem("authToken");
    await axios.put(
      `/api/invoices/by-number/${invoice.invoice_number}`,
      { status: 'completed' },
      { 
        headers: { 
          Authorization: `Bearer ${token}` 
        } 
      }
    );

    // Move to matched invoices
    setMatchedInvoices(prev => [...prev, {
      date: invoice.issue_date,
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customer?.name,
      amount: invoice.total_amount,
      amountDue: invoice.balance,
      status: 'Completed',
      apiData: invoice
    }]);

    // Remove from not reconciled list
    setNotReconciledInvoices(prev => 
      prev.filter(inv => inv.invoice_number !== invoice.invoice_number)
    );

  } catch (error) {
    console.error('Error reconciling invoice:', error);
  } finally {
    setUpdatingStatus(prev => ({ ...prev, [invoice.invoice_number]: false }));
  }
};

  const updateNotReconciledList = (allInvoices) => {
    // Find invoices not present in matched or unmatched lists
    const notReconciled = allInvoices.filter(
      (invoice) =>
        !matchedInvoices.some((m) => m.apiData?.id === invoice.id) &&
        !unmatchedInvoices.some((u) => u.apiData?.id === invoice.id)
    );
    setNotReconciledInvoices(notReconciled);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      // Process the uploaded data
      const processedData = jsonData.map((item) => ({
        date: item.Date || item.date || "",
        invoiceNumber: item.Invoice || item.invoice || item["Invoice #"] || "",
        customerName: item["Customer Name"] || item.customer || "",
        amount: item.Amount || item.amount || 0,
        amountDue: item["Amount Due"] || item.due || 0,
        status: item.Status || item.status || "",
      }));

      setUploadedData(processedData);
      matchInvoices(processedData);
    };

    reader.readAsArrayBuffer(file);
  };

 const matchInvoices = (uploadedData) => {
  const matched = [];
  const unmatched = [];
  const statusUpdates = {};

  // Create a Set of invoice numbers from uploaded data for quick lookup
  const uploadedInvoiceNumbers = new Set(uploadedData.map(item => item.invoiceNumber));

  invoices.forEach(apiInvoice => {
    if (uploadedInvoiceNumbers.has(apiInvoice.invoice_number)) {
      // This invoice was in the uploaded file
      const uploadedItem = uploadedData.find(item => item.invoiceNumber === apiInvoice.invoice_number);
      
      matched.push({
        ...uploadedItem,
        apiData: apiInvoice,
      });

      // Check if amounts match
      const amountMatches = parseFloat(apiInvoice.total_amount) === parseFloat(uploadedItem.amount);
      const dueMatches = parseFloat(apiInvoice.balance) === parseFloat(uploadedItem.amountDue);

      statusUpdates[apiInvoice.invoice_number] = {
        matched: true,
        amountMatches,
        dueMatches,
        status: amountMatches && dueMatches ? "Fully Reconciled" : "Partially Reconciled"
      };
    } else {
      // This invoice wasn't in the uploaded file
      unmatched.push({
        date: apiInvoice.issue_date,
        invoiceNumber: apiInvoice.invoice_number,
        customerName: apiInvoice.customer?.name || "",
        amount: apiInvoice.total_amount,
        amountDue: apiInvoice.balance,
        status: apiInvoice.status,
        apiData: apiInvoice,
        isSystemInvoice: true
      });
      
      statusUpdates[apiInvoice.invoice_number] = {
        matched: false,
        status: "Not in Uploaded File"
      };
    }
  });

  // Also find uploaded items that don't match any system invoices
  uploadedData.forEach(uploadedItem => {
    if (!invoices.some(inv => inv.invoice_number === uploadedItem.invoiceNumber)) {
      unmatched.push(uploadedItem);
      statusUpdates[uploadedItem.invoiceNumber] = {
        matched: false,
        status: "Not Found in System"
      };
    }
  });

  setMatchedInvoices(matched);
  setUnmatchedInvoices(unmatched);
  setReconciliationStatus(statusUpdates);
  
  // Update not reconciled list (invoices not in matched or unmatched)
  const notReconciled = invoices.filter(invoice => 
    !matched.some(m => m.apiData.id === invoice.id) &&
    !unmatched.some(u => u.apiData?.id === invoice.id)
  );
  setNotReconciledInvoices(notReconciled);
  
  setShowUploadModal(false);
};
  const handleReconcile = (invoiceNumber) => {
    // Implement your reconciliation logic here
    console.log(`Reconciling invoice ${invoiceNumber}`);
    // Update status in state
    setReconciliationStatus((prev) => ({
      ...prev,
      [invoiceNumber]: {
        ...prev[invoiceNumber],
        status: "Manually Reconciled",
      },
    }));
  };

  const handleMarkAsCompleted = (invoice) => {
    setSelectedInvoice(invoice);
    setShowConfirmModal(true);
  };

  const handleUpdateStatus = (invoice) => {
    setSelectedInvoice(invoice);
    setStatusUpdate({
      status: invoice.status || "",
      remark: "",
    });
    setShowStatusModal(true);
  };

  const confirmMarkAsCompleted = async () => {
    if (!selectedInvoice) return;

    const invoiceNumber =
      selectedInvoice.invoiceNumber || selectedInvoice.apiData?.invoice_number;
    if (!invoiceNumber) return;

    try {
      setUpdatingStatus((prev) => ({ ...prev, [invoiceNumber]: true }));

      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("status", "completed");

      await axios.put(`/api/invoices/by-number/${invoiceNumber}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state
      setReconciliationStatus((prev) => ({
        ...prev,
        [invoiceNumber]: {
          ...prev[invoiceNumber],
          status: "Completed",
        },
      }));

      // Remove from unmatched/not reconciled if it was there
      setUnmatchedInvoices((prev) =>
        prev.filter(
          (inv) =>
            inv.invoiceNumber !== invoiceNumber &&
            inv.apiData?.invoice_number !== invoiceNumber
        )
      );

      setNotReconciledInvoices((prev) =>
        prev.filter((inv) => inv.invoice_number !== invoiceNumber)
      );

      // Refresh data
      await fetchInvoices();
    } catch (error) {
      console.error("Error updating invoice status:", error);
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [invoiceNumber]: false }));
      setShowConfirmModal(false);
      setSelectedInvoice(null);
    }
  };

  const handleStatusUpdate = async () => {
    console.log(selectedInvoice)
    if (!selectedInvoice) return;

    const invoiceNumber =
      selectedInvoice.invoice_number || selectedInvoice.apiData?.invoice_number;
    if (!invoiceNumber) return;

    console.log(invoiceNumber)
    try {
      console.log("sss2")
      setUpdatingStatus((prev) => ({ ...prev, [invoiceNumber]: true }));

      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("status", statusUpdate.status);
      if (statusUpdate.remark) {
        formData.append("remark", statusUpdate.remark);
      }
      
     let response = await axios.put(`/api/invoices/by-number/${invoiceNumber}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Response from status update:", response.data);
      

      // Update local state
      setReconciliationStatus((prev) => ({
        ...prev,
        [invoiceNumber]: {
          ...prev[invoiceNumber],
          status: statusUpdate.status,
        },
      }));

      // Refresh data
      await fetchInvoices();

      // If status is "completed", move to matched invoices
      if (statusUpdate.status === "completed") {
        setMatchedInvoices((prev) => [
          ...prev,
          {
            invoiceNumber,
            apiData: selectedInvoice.apiData || selectedInvoice,
            status: "Completed",
          },
        ]);

        // Remove from not reconciled list
        setNotReconciledInvoices((prev) =>
          prev.filter((inv) => inv.invoice_number !== invoiceNumber)
        );
      }

      setShowStatusModal(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Error updating invoice status:", error);
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [invoiceNumber]: false }));
    }
  };

  const reset = () => {
    setMatchedInvoices([]);
    setUnmatchedInvoices([]);
    setUploadedData([]);
    setReconciliationStatus({});
    setShowUploadModal(false);
    fetchInvoices();
  };

  return (
    <div className="container-fluid">
      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col md={6}>
              <h5>Invoice Reconciliation</h5>
            </Col>
            <Col md={6} className="text-end">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Button
                  variant="primary"
                  onClick={() => setShowUploadModal(true)}
                >
                  <FaUpload className="me-2" />
                  Upload
                </Button>

                <Button variant="secondary" onClick={fetchInvoices}>
                  <FaSyncAlt className="me-2" />
                  Refresh
                </Button>
                <Button variant="danger" onClick={reset}>
                  <FaSyncAlt className="me-2" />
                  Reset
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <Tab.Container defaultActiveKey="matched">
                <Nav variant="tabs">
                  <Nav.Item>
                    <Nav.Link eventKey="matched">
                      Matched Invoices ({matchedInvoices.length})
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="unmatched">
                      Unmatched Invoices ({unmatchedInvoices.length})
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="notReconciled">
                      <FaList className="me-1" />
                      Not Reconciled ({notReconciledInvoices.length})
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="nonMatched">
                      Non-Matched Invoices ({nonMatchedInvoices.length})
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
                <Tab.Content>
                  <Tab.Pane eventKey="matched">
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Invoice Number</th>
                          <th>Customer Name</th>
                          <th>Amount</th>
                          <th>Amount Due</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchedInvoices.map((item, index) => (
                          <tr key={index}>
                            <td>{item.date}</td>
                            <td>{item.invoiceNumber}</td>
                            <td>{item.customerName}</td>
                            <td>
                              {item.amount}
                              {!reconciliationStatus[item.invoiceNumber]
                                ?.amountMatches && (
                                <span className="text-danger ms-2">
                                  (System: {item.apiData.total_amount})
                                </span>
                              )}
                            </td>
                            <td>
                              {item.amountDue}
                              {!reconciliationStatus[item.invoiceNumber]
                                ?.dueMatches && (
                                <span className="text-danger ms-2">
                                  (System: {item.apiData.balance})
                                </span>
                              )}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  reconciliationStatus[item.invoiceNumber]
                                    ?.status === "Fully Reconciled"
                                    ? "bg-success"
                                    : reconciliationStatus[item.invoiceNumber]
                                        ?.status === "Completed"
                                    ? "bg-primary"
                                    : "bg-warning text-dark"
                                }`}
                              >
                                {
                                  reconciliationStatus[item.invoiceNumber]
                                    ?.status
                                }
                              </span>
                            </td>
                            <td>
                              <Button
                                variant="info"
                                size="sm"
                                onClick={() =>
                                  handleReconcile(item.invoiceNumber)
                                }
                                disabled={
                                  reconciliationStatus[item.invoiceNumber]
                                    ?.status === "Fully Reconciled" ||
                                  reconciliationStatus[item.invoiceNumber]
                                    ?.status === "Completed"
                                }
                              >
                                Reconcile
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Tab.Pane>
                  <Tab.Pane eventKey="unmatched">
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Invoice Number</th>
                          <th>Customer Name</th>
                          <th>Amount</th>
                          <th>Amount Due</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unmatchedInvoices.map((item, index) => (
                          <tr key={index}>
                            <td>{item.date}</td>
                            <td>
                              {item.invoiceNumber ||
                                item.apiData?.invoice_number}
                            </td>
                            <td>
                              {item.customerName ||
                                item.apiData?.customer?.name}
                            </td>
                            <td>{item.amount || item.apiData?.total_amount}</td>
                            <td>{item.amountDue || item.apiData?.balance}</td>
                            <td>
                              <span
                                className={`badge ${
                                  reconciliationStatus[
                                    item.invoiceNumber ||
                                      item.apiData?.invoice_number
                                  ]?.status === "Not Found in System"
                                    ? "bg-danger"
                                    : "bg-secondary"
                                }`}
                              >
                                {
                                  reconciliationStatus[
                                    item.invoiceNumber ||
                                      item.apiData?.invoice_number
                                  ]?.status
                                }
                              </span>
                            </td>
                            <td>
                              {item.apiData && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleMarkAsCompleted(item)}
                                  disabled={
                                    updatingStatus[
                                      item.invoiceNumber ||
                                        item.apiData?.invoice_number
                                    ]
                                  }
                                >
                                  {updatingStatus[
                                    item.invoiceNumber ||
                                      item.apiData?.invoice_number
                                  ] ? (
                                    <span
                                      className="spinner-border spinner-border-sm"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                  ) : (
                                    <>
                                      <FaCheck className="me-1" />
                                      Mark as Completed
                                    </>
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Tab.Pane>
                  <Tab.Pane eventKey="notReconciled">
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Invoice Number</th>
                          <th>Customer Name</th>
                          <th>Amount</th>
                          <th>Amount Due</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notReconciledInvoices.map((invoice, index) => (
                          <tr key={index}>
                            <td>{formatDate(invoice.issue_date)}</td>
                            <td>{invoice.invoice_number}</td>
                            <td>{invoice.customer?.name || "N/A"}</td>
                            <td>{invoice.total_amount}</td>
                            <td>{invoice.balance}</td>
                            <td>
                              <Badge bg="secondary">
                                {invoice.status || "Not Reconciled"}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleUpdateStatus(invoice)}
                                disabled={
                                  updatingStatus[invoice.invoice_number]
                                }
                              >
                                {updatingStatus[invoice.invoice_number] ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                    aria-hidden="true"
                                  ></span>
                                ) : (
                                  "Update Status"
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Tab.Pane>
                  <Tab.Pane eventKey="nonMatched">
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Invoice #</th>
                          <th>Customer</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nonMatchedInvoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td>{formatDate(invoice.issue_date)}</td>
                            <td>{invoice.invoice_number}</td>
                            <td>{invoice.customer?.name || "N/A"}</td>
                            <td>{invoice.total_amount}</td>
                            <td>
                              <Badge bg="warning">
                                {invoice.status || "Pending"}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  handleReconcileNonMatched(invoice)
                                }
                              >
                                Reconcile
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Upload Modal */}
      <Modal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Upload Excel File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId="formFile" className="mb-3">
            <Form.Label>Select Excel File</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
            />
            <Form.Text muted>
              Please upload an Excel file with Date, Invoice Number, Customer
              Name, Amount, and Amount Due columns.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Completion Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Invoice Completion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to mark invoice{" "}
          {selectedInvoice?.invoiceNumber ||
            selectedInvoice?.apiData?.invoice_number}{" "}
          as completed?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmMarkAsCompleted}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Invoice Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={statusUpdate.status}
                onChange={(e) =>
                  setStatusUpdate({ ...statusUpdate, status: e.target.value })
                }
              >
                <option value="">Select Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="refund">Refund</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Remark</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={statusUpdate.remark}
                onChange={(e) =>
                  setStatusUpdate({ ...statusUpdate, remark: e.target.value })
                }
                placeholder="Optional remarks"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleStatusUpdate}>
            Update Status
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export default Invoice_reconciliation;
