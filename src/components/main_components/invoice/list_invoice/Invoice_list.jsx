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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import Invoice_sharmila_modal from "./models/Invoice_sharmila_modal";
import Invoice_appleholidays_modal from "./models/Invoice_appleholidays_modal";
import Invoice_aahaas_modal from "./models/Invoice_aahaas_modal";

const Invoice_list = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };

    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/invoices", {
        params: {
          company_id: companyNo,
        },
      });
      setInvoices(response.data.data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || invoice.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleViewInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setShowPreviewModal(true);
  };

  const handleEditInvoice = (invoice) => {
    console.log("Editing invoice:", invoice);

    setCurrentInvoice(invoice);
    setShowEditModal(true);
  };

  const handlePrintInvoice = async (invoiceId) => {
    try {
      const response = await axios.get(`/api/invoices/${invoiceId}/print`, {
        responseType: "blob",
      });
      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const fileLink = document.createElement("a");
      fileLink.href = fileURL;
      fileLink.setAttribute("download", `invoice_${invoiceId}.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
    } catch (error) {
      console.error("Error printing invoice:", error);
    }
  };

  const confirmDelete = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleDeleteInvoice = async () => {
    try {
      await axios.delete(`/api/invoices/${invoiceToDelete.id}`);
      fetchInvoices();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  // const handleUpdateInvoice = async (formData) => {
  //   try {
  //     // Convert items from form data to array format
  //     const items = [];
  //     for (let key in formData) {
  //       if (key.startsWith("items[")) {
  //         const matches = key.match(/items\[(\d+)\]\[(\w+)\]/);
  //         if (matches) {
  //           const index = matches[1];
  //           const field = matches[2];
  //           if (!items[index])
  //             items[index] = { id: currentInvoice.items?.[index]?.id };
  //           items[index][field] =
  //             field === "quantity" || field === "price" || field === "discount"
  //               ? parseFloat(formData[key])
  //               : formData[key];
  //         }
  //       }
  //     }

  //     // Convert additional charges if present
  //     const additionalCharges = [];
  //     for (let key in formData) {
  //       if (key.startsWith("additional_charges[")) {
  //         const matches = key.match(/additional_charges\[(\d+)\]\[(\w+)\]/);
  //         if (matches) {
  //           const index = matches[1];
  //           const field = matches[2];
  //           if (!additionalCharges[index])
  //             additionalCharges[index] = {
  //               id: currentInvoice.additional_charges?.[index]?.id,
  //             };
  //           additionalCharges[index][field] =
  //             field === "amount" ? parseFloat(formData[key]) : formData[key];
  //         }
  //       }
  //     }

  //     // Prepare the data for API
  //     const updatedData = {
  //       customer_id: currentInvoice.customer?.id,
  //       country_code: formData.country_code || currentInvoice.country_code,
  //       currency: formData.currency,
  //       exchange_rate: parseFloat(formData.exchange_rate) || 1.0,
  //       tax_treatment: formData.tax_treatment || "inclusive",
  //       payment_type: formData.payment_type,
  //       collection_date: formData.collection_date || null,
  //       payment_instructions: formData.payment_instructions,
  //       staff: formData.staff,
  //       remarks: formData.remarks,
  //       // payment_methods: formData.payment_methods
  //       //   ? formData.payment_methods.split(",")
  //       //   : currentInvoice.payment_methods,
  //       items: items.filter((item) => item),
  //       additional_charges: additionalCharges.filter((charge) => charge),
  //       amount_received: parseFloat(formData.amount_received) || 0,
  //     };

  //     await axios.put(
  //       `/api/invoices/by-number/${currentInvoice.invoice_number}`,
  //       updatedData
  //     );
  //     fetchInvoices();
  //     setShowEditModal(false);
  //   } catch (error) {
  //     console.error("Error updating invoice:", error);
  //   }
  // };

  // In your handleUpdateInvoice function, modify to:
  const handleUpdateInvoice = async (formData) => {
    try {
      // Prepare items array
      const items = [];
      for (let key in formData) {
        if (key.startsWith("items[")) {
          const matches = key.match(/items\[(\d+)\]\[(\w+)\]/);
          if (matches) {
            const index = matches[1];
            const field = matches[2];
            if (!items[index]) {
              items[index] = {
                id: currentInvoice.items?.[index]?.id || null,
                code: "",
                type: "",
                description: "",
                quantity: 0,
                price: 0,
                discount: 0,
              };
            }
            items[index][field] =
              field === "quantity" || field === "price" || field === "discount"
                ? parseFloat(formData[key])
                : formData[key];
          }
        }
      }

      // Prepare additional charges array
      const additionalCharges = [];
      for (let key in formData) {
        if (key.startsWith("additional_charges[")) {
          const matches = key.match(/additional_charges\[(\d+)\]\[(\w+)\]/);
          if (matches) {
            const index = matches[1];
            const field = matches[2];
            if (!additionalCharges[index]) {
              additionalCharges[index] = {
                id: currentInvoice.additional_charges?.[index]?.id || null,
                description: "",
                amount: 0,
                taxable: false,
              };
            }
            additionalCharges[index][field] =
              field === "amount"
                ? parseFloat(formData[key])
                : field === "taxable"
                ? formData[key] === "1"
                : formData[key];
          }
        }
      }

      // Prepare the complete data for API
      const updatedData = {
        customer_id: currentInvoice.customer?.id,
        country_code: formData.country_code || currentInvoice.country_code,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchange_rate) || 1.0,
        tax_treatment: formData.tax_treatment || "inclusive",
        payment_type: formData.payment_type,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        collection_date: formData.collection_date || null,
        payment_instructions: formData.payment_instructions,
        staff: formData.staff,
        remarks: formData.remarks,
        payment_methods: currentInvoice.payment_methods, // or handle from form if needed
        items: items.filter((item) => item),
        additional_charges: additionalCharges.filter((charge) => charge),
        amount_received: parseFloat(formData.amount_received) || 0,
        account_id: currentInvoice.account_id,
        booking_no: currentInvoice.booking_no,
      };

      const response = await axios.put(
        `/api/invoices/by-number/${currentInvoice.invoice_number}`,
        updatedData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      fetchInvoices();
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating invoice:", error);
      // Add error handling UI here
    }
  };

  // Add these helper functions for dynamic fields
  const handleAddItem = () => {
    setCurrentInvoice((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          id: null,
          code: "",
          type: "",
          description: "",
          quantity: 1,
          price: 0,
          discount: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    setCurrentInvoice((prev) => {
      const newItems = [...prev.items];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const handleAddCharge = () => {
    setCurrentInvoice((prev) => ({
      ...prev,
      additional_charges: [
        ...(prev.additional_charges || []),
        {
          id: null,
          description: "",
          amount: 0,
          taxable: false,
        },
      ],
    }));
  };

  const handleRemoveCharge = (index) => {
    setCurrentInvoice((prev) => {
      const newCharges = [...prev.additional_charges];
      newCharges.splice(index, 1);
      return { ...prev, additional_charges: newCharges };
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
        return (
          <Badge bg="success" className="d-flex align-items-center">
            <FaMoneyBillWave className="me-1" /> Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge bg="warning" text="dark" className="d-flex align-items-center">
            <FaCalendarAlt className="me-1" /> Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge bg="danger" className="d-flex align-items-center">
            <FaMinus className="me-1" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge bg="secondary" className="d-flex align-items-center">
            <FaInfoCircle className="me-1" /> Unknown
          </Badge>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const calculateItemTotal = (item) => {
    return item.price * (1 - item.discount / 100) * item.quantity;
  };

  const ActionButton = ({
    icon,
    label,
    variant = "primary",
    onClick,
    disabled = false,
  }) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{label}</Tooltip>}>
      <Button
        variant={variant}
        size="sm"
        className="me-2"
        onClick={onClick}
        disabled={disabled}
      >
        {icon} <span className="d-none d-md-inline">{label}</span>
      </Button>
    </OverlayTrigger>
  );

  return (
    <div className="container py-4">
      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
          <h5 className="mb-0">
            <FaFileInvoiceDollar className="me-2" />
            Invoice Management
          </h5>
          <Button
            variant="light"
            onClick={() => navigate("/invoice/create")}
            className="d-flex align-items-center"
          >
            <FaPlus className="me-1" /> New Invoice
          </Button>
        </Card.Header>

        <Card.Body>
          {/* Search and Filter Bar */}
          <div className="d-flex mb-4">
            <div className="input-group me-3" style={{ width: "300px" }}>
              <span className="input-group-text">
                <FaSearch />
              </span>
              <Form.Control
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="d-flex align-items-center me-3">
              <span className="me-2">
                <FaFilter />
              </span>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: "150px" }}
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </div>

            <Button
              variant="outline-secondary"
              onClick={fetchInvoices}
              className="d-flex align-items-center"
            >
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading invoices...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Invoice No.</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className={
                          invoice.status === "cancelled"
                            ? "table-danger"
                            : invoice.status === "paid"
                            ? "table-success"
                            : invoice.status === "pending"
                            ? "table-warning"
                            : ""
                        }
                      >
                        <td>
                          <strong>{invoice.invoice_number}</strong>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <FaUser />
                            </div>
                            <div>
                              <div>{invoice.customer?.name || "N/A"}</div>
                              <small className="text-muted">
                                {invoice.customer?.email || ""}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaCalendarAlt className="me-2 text-muted" />
                            {formatDate(invoice.issue_date)}
                          </div>
                          <small className="text-muted">
                            Due: {formatDate(invoice.due_date)}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaReceipt className="me-2 text-muted" />
                            {invoice.currency} {invoice.total_amount}
                          </div>
                        </td>
                        <td>{getStatusBadge(invoice.status)}</td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end">
                            <ActionButton
                              icon={<FaEye />}
                              label="View"
                              variant="info"
                              onClick={() => handleViewInvoice(invoice)}
                            />
                            <ActionButton
                              icon={<FaEdit />}
                              label="Edit"
                              variant="primary"
                              onClick={() => handleEditInvoice(invoice)}
                            />
                            <ActionButton
                              icon={<FaPrint />}
                              label="Print"
                              variant="secondary"
                              onClick={() => handlePrintInvoice(invoice.id)}
                            />
                            <ActionButton
                              icon={<FaTrash />}
                              label="Cancel"
                              variant="danger"
                              onClick={() => confirmDelete(invoice)}
                              disabled={invoice.status === "cancelled"}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <FaFileInvoiceDollar
                            size={48}
                            className="text-muted mb-3"
                          />
                          <h5>No invoices found</h5>
                          <p className="text-muted">
                            Try adjusting your search or create a new invoice
                          </p>
                          <Button
                            variant="primary"
                            onClick={() => navigate("/invoice/create")}
                            className="mt-2"
                          >
                            <FaPlus className="me-1" /> Create Invoice
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>

        {filteredInvoices.length > 0 && (
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <div>
              Showing <strong>{filteredInvoices.length}</strong> of{" "}
              <strong>{invoices.length}</strong> invoices
            </div>
            <div className="d-flex">
              <Button variant="outline-primary" size="sm" className="me-2">
                <FaDownload className="me-1" /> Export
              </Button>
              <Button variant="outline-secondary" size="sm">
                <FaPrint className="me-1" /> Print List
              </Button>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Invoice Preview Modal */}

      {companyNo === 1 && (
        <Invoice_sharmila_modal
          show={showPreviewModal}
          onHide={() => setShowPreviewModal(false)}
          invoice={currentInvoice}
          formatDate={formatDate}
          calculateItemTotal={calculateItemTotal}
          handlePrintInvoice={handlePrintInvoice}
        />
      )}
      {companyNo === 2 && (
        <Invoice_appleholidays_modal
              show={showPreviewModal}
          onHide={() => setShowPreviewModal(false)}
          invoice={currentInvoice}
          formatDate={formatDate}
          calculateItemTotal={calculateItemTotal}
          handlePrintInvoice={handlePrintInvoice}
        />
      )}
      {companyNo === 3 && (
        <Invoice_aahaas_modal
          show={showPreviewModal}
          onHide={() => setShowPreviewModal(false)}
          invoice={currentInvoice}
          formatDate={formatDate}
          calculateItemTotal={calculateItemTotal}
          handlePrintInvoice={handlePrintInvoice}
        />
      )}
      {/* <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        size="lg"
        fullscreen="lg-down"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaFileInvoiceDollar className="me-2" />
            Invoice Preview - {currentInvoice?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {currentInvoice && (
            <div className="invoice-preview p-4">
              <div className="text-center mb-3">
                <h4 className="mb-1 fw-bold">Sharmila Tours & Travels</h4>
                <div className="mb-1">
                  No: 148, Aluthmawatha Road, Colombo - 15, Sri Lanka
                </div>
                <div className="mb-1">Tel:011 23 52 400 | 011 23 45 800</div>
            
                <h5 className="fw-bold mb-3">INVOICE </h5>
              </div>

              <div className="d-flex justify-content-between mb-4">
                <div>
                  <div>
                    <strong>To:</strong>{" "}
                    {currentInvoice.customer?.name || "N/A"}
                  </div>
                  <div>{currentInvoice.customer?.address || "N/A"}</div>
                </div>
                <div className="text-end">
                  <div>
                    <strong>No.</strong> {currentInvoice.invoice_number}
                  </div>
                  <div>
                    <strong>Date</strong>{" "}
                    {formatDate(currentInvoice.issue_date)}
                  </div>
                  <div>
                    <strong>Your Ref.</strong>{" "}
                    {currentInvoice.your_ref || "N/A"}
                  </div>
                  <div>
                    <strong>Sales ID</strong> {currentInvoice.sales_id || "N/A"}
                  </div>
                  <div>
                    <strong>Printed By</strong>{" "}
                    {currentInvoice.printed_by || "N/A"}
                  </div>
                </div>
              </div>

              <table className="table table-bordered mb-3">
                <thead>
                  <tr style={{ backgroundColor: "#343a40", color: "white" }}>
                    <th>Description</th>
                    <th style={{ textAlign: "right" }}>Unit Fare</th>
                    <th style={{ textAlign: "right" }}>Discount</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoice.items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td style={{ textAlign: "right" }}>
                        {currentInvoice.currency} {item.price}
                      </td>
                      <td style={{ textAlign: "right" }}>{item.discount}%</td>
                      <td style={{ textAlign: "right" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>
                        {currentInvoice.currency}{" "}
                        {calculateItemTotal(item).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mb-3">{currentInvoice.payment_instructions}</div>

          
              <div className="row mb-4">
                <div className="col-md-6 offset-md-6">
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Sub Total:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency} {currentInvoice.sub_total}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Total:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency}{" "}
                          {currentInvoice.total_amount}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Amount Received:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency}{" "}
                          {currentInvoice.amount_received}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Balance:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency} {currentInvoice.balance}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div>
                  </div>
                  <div>
                    <strong>Remark:</strong> {currentInvoice.remarks}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPreviewModal(false)}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => handlePrintInvoice(currentInvoice?.id)}
            className="d-flex align-items-center"
          >
            <FaPrint className="me-1" /> Print Invoice
          </Button>
          <Button
            variant="success"
            onClick={() => alert("PDF download would be implemented here")}
            className="d-flex align-items-center"
          >
            <FaDownload className="me-1" /> Download PDF
          </Button>
        </Modal.Footer>
      </Modal> */}

      {/* Edit Invoice Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="xl"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaEdit className="me-2" />
            Edit Invoice - {currentInvoice?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentInvoice && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const formValues = Object.fromEntries(formData.entries());
                handleUpdateInvoice(formValues);
              }}
            >
              <Accordion
                defaultActiveKey={["customer", "invoice", "items"]}
                alwaysOpen
              >
                {/* Customer Information */}
                <Accordion.Item eventKey="customer">
                  <Accordion.Header>
                    <div className="d-flex align-items-center">
                      <FaUser className="me-2" />
                      <span>Customer Information</span>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <input
                      type="hidden"
                      name="customer_id"
                      value={currentInvoice.customer?.id}
                    />

                    <Row>
                      <Col md={6}>
                        <FloatingLabel label="Country Code" className="mb-3">
                          <Form.Select
                            name="country_code"
                            defaultValue={currentInvoice.country_code}
                            required
                          >
                            <option value="MY">Malaysia</option>
                            <option value="IN">India</option>
                            <option value="US">United States</option>
                          </Form.Select>
                        </FloatingLabel>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Invoice Details */}
                <Accordion.Item eventKey="invoice">
                  <Accordion.Header>
                    <div className="d-flex align-items-center">
                      <FaFileInvoiceDollar className="me-2" />
                      <span>Invoice Details</span>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row className="mb-3">
                      <Col md={6}>
                        <FloatingLabel label="Currency" className="mb-3">
                          <Form.Select
                            name="currency"
                            defaultValue={currentInvoice.currency}
                            required
                          >
                            <option value="MYR">MYR</option>
                            <option value="INR">INR</option>
                            <option value="USD">USD</option>
                          </Form.Select>
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel label="Exchange Rate" className="mb-3">
                          <Form.Control
                            type="number"
                            name="exchange_rate"
                            step="0.0001"
                            defaultValue={currentInvoice.exchange_rate || 1.0}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <FloatingLabel label="Tax Treatment" className="mb-3">
                          <Form.Select
                            name="tax_treatment"
                            defaultValue={currentInvoice.tax_treatment}
                            required
                          >
                            <option value="inclusive">Tax Inclusive</option>
                            <option value="exclusive">Tax Exclusive</option>
                            <option value="none">No Tax</option>
                          </Form.Select>
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel label="Payment Type" className="mb-3">
                          <Form.Select
                            name="payment_type"
                            defaultValue={currentInvoice.payment_type}
                            required
                          >
                            <option value="credit">Credit</option>
                            <option value="non-credit">Non-Credit</option>
                          </Form.Select>
                        </FloatingLabel>
                      </Col>
                    </Row>

                    {/* Dates */}
                    <Row className="mb-3">
                      <Col md={4}>
                        <FloatingLabel label="Issue Date" className="mb-3">
                          <Form.Control
                            type="date"
                            name="issue_date"
                            defaultValue={
                              currentInvoice.issue_date?.split("T")[0]
                            }
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={4}>
                        <FloatingLabel label="Due Date" className="mb-3">
                          <Form.Control
                            type="date"
                            name="due_date"
                            defaultValue={
                              currentInvoice.due_date?.split("T")[0]
                            }
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={4}>
                        <FloatingLabel label="Collection Date" className="mb-3">
                          <Form.Control
                            type="date"
                            name="collection_date"
                            defaultValue={
                              currentInvoice.collection_date?.split("T")[0]
                            }
                          />
                        </FloatingLabel>
                      </Col>
                    </Row>

                    {/* Payment Information */}
                    <Row className="mb-3">
                      <Col md={6}>
                        <FloatingLabel
                          label="Payment Instructions"
                          className="mb-3"
                        >
                          <Form.Control
                            as="textarea"
                            name="payment_instructions"
                            style={{ height: "100px" }}
                            defaultValue={currentInvoice.payment_instructions}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel
                          label="Payment Methods (comma separated)"
                          className="mb-3"
                        >
                          {/* <Form.Control
                            type="text"
                            name="payment_methods"
                            defaultValue={currentInvoice.payment_methods?.join(",")}
                          /> */}
                        </FloatingLabel>
                      </Col>
                    </Row>

                    {/* Staff and Remarks */}
                    <Row className="mb-3">
                      <Col md={6}>
                        <FloatingLabel label="Staff" className="mb-3">
                          <Form.Control
                            type="text"
                            name="staff"
                            defaultValue={currentInvoice.staff}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel label="Amount Received" className="mb-3">
                          <Form.Control
                            type="number"
                            name="amount_received"
                            step="0.01"
                            defaultValue={currentInvoice.amount_received}
                          />
                        </FloatingLabel>
                      </Col>
                    </Row>

                    <FloatingLabel label="Remarks" className="mb-3">
                      <Form.Control
                        as="textarea"
                        name="remarks"
                        style={{ height: "100px" }}
                        defaultValue={currentInvoice.remarks}
                      />
                    </FloatingLabel>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Invoice Items Section */}
                <Accordion.Item eventKey="items">
                  <Accordion.Header>
                    <div className="d-flex align-items-center">
                      <FaReceipt className="me-2" />
                      <span>Invoice Items</span>
                      <Badge bg="primary" className="ms-2">
                        {currentInvoice.items?.length || 0}
                      </Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <table className="table">
                      <thead className="table-light">
                        <tr>
                          <th>Code</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Price</th>
                          <th>Discount %</th>
                          <th>Quantity</th>
                          <th>Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentInvoice.items?.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <Form.Control
                                type="text"
                                name={`items[${index}][code]`}
                                size="sm"
                                defaultValue={item.code}
                                required
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                name={`items[${index}][type]`}
                                size="sm"
                                defaultValue={item.type}
                                required
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="text"
                                name={`items[${index}][description]`}
                                size="sm"
                                defaultValue={item.description}
                                required
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="number"
                                name={`items[${index}][price]`}
                                size="sm"
                                step="0.01"
                                min="0"
                                defaultValue={item.price}
                                required
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="number"
                                name={`items[${index}][discount]`}
                                size="sm"
                                min="0"
                                max="100"
                                defaultValue={item.discount}
                                required
                              />
                            </td>
                            <td>
                              <Form.Control
                                type="number"
                                name={`items[${index}][quantity]`}
                                size="sm"
                                min="1"
                                defaultValue={item.quantity}
                                required
                              />
                            </td>
                            <td className="text-end">
                              {currentInvoice.currency}{" "}
                              {calculateItemTotal(item).toFixed(2)}
                            </td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="d-flex justify-content-between mt-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleAddItem}
                      >
                        <FaPlus className="me-1" /> Add Item
                      </Button>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Additional Charges Section */}
                <Accordion.Item eventKey="charges">
                  <Accordion.Header>
                    <div className="d-flex align-items-center">
                      <FaMoneyBillWave className="me-2" />
                      <span>Additional Charges</span>
                      <Badge bg="primary" className="ms-2">
                        {currentInvoice.additional_charges?.length || 0}
                      </Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <table className="table">
                      <thead className="table-light">
                        <tr>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Taxable</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentInvoice.additional_charges?.map(
                          (charge, index) => (
                            <tr key={index}>
                              <td>
                                <Form.Control
                                  type="text"
                                  name={`additional_charges[${index}][description]`}
                                  size="sm"
                                  defaultValue={charge.description}
                                />
                              </td>
                              <td>
                                <Form.Control
                                  type="number"
                                  name={`additional_charges[${index}][amount]`}
                                  size="sm"
                                  step="0.01"
                                  min="0"
                                  defaultValue={charge.amount}
                                />
                              </td>
                              <td>
                                <Form.Select
                                  name={`additional_charges[${index}][taxable]`}
                                  size="sm"
                                  defaultValue={charge.taxable ? "1" : "0"}
                                >
                                  <option value="1">Yes</option>
                                  <option value="0">No</option>
                                </Form.Select>
                              </td>
                              <td>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleRemoveCharge(index)}
                                >
                                  <FaTrash />
                                </Button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>

                    <div className="d-flex justify-content-end mt-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleAddCharge}
                      >
                        <FaPlus className="me-1" /> Add Charge
                      </Button>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              <div className="d-flex justify-content-end mt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                  className="me-2"
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FaTrash className="me-2 text-danger" />
            Confirm Cancellation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-danger">
            <strong>Warning:</strong> This action cannot be undone.
          </div>
          <p>
            Are you sure you want to cancel invoice #
            <strong>{invoiceToDelete?.invoice_number}</strong>?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={handleDeleteInvoice}>
            Confirm Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Invoice_list;
