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
  FaCreditCard,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import { useUser } from "../../../../contentApi/UserProvider";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "../upload_invoice/InvoicePDF";

const Invoice_list = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDelete, setLoadingDelete] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModalAahaas, setShowPreviewModalAahaas] = useState(false);
  const [showPreviewModalAppleholidays, setShowPreviewModalAppleholidays] =
    useState(false);
  const [showPreviewModalShirmila, setShowPreviewModalShirmila] =
    useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [companyNo, setCompanyNo] = useState(null);
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const { selectedCompany } = useContext(CompanyContext);
  const [filterCreditType, setFilterCreditType] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const navigate = useNavigate();
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const {
    user,
    company,
    role,
    loading: userLoading,
    error: userError,
  } = useUser();
  const [cancelRemark, setCancelRemark] = useState("");
  const [cancelAttachment, setCancelAttachment] = useState(null);

  // useEffect(() => {
  //   fetchInvoices();
  // }, []);

  useEffect(() => {
    // Map selected company to ID
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };

    // Default to 3 (aahaas) if selectedCompany is not set
    const defaultCompanyNo = companyMap[selectedCompany?.toLowerCase()] || 3;

    setCompanyNo(defaultCompanyNo);
  }, [selectedCompany]);

  useEffect(() => {
    if (companyNo) {
      fetchInvoices(companyNo);
    }
  }, [companyNo]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      // console.log(refreshUser);
      if (user) {
        console.log(user.role.name);
        setIsAdmin(user.role.name === "admin");
      }

      // const cacheKey = `invoices_company_${companyNo}`;
      // const cacheExpiryKey = `${cacheKey}_expiry`;

      // const cachedData = localStorage.getItem(cacheKey);
      // const cacheExpiry = localStorage.getItem(cacheExpiryKey);

      // // If we have cached data and it's not expired
      // if (cachedData && cacheExpiry && Date.now() < Number(cacheExpiry)) {
      //   console.log("Loaded invoices from cache");
      //   setInvoices(JSON.parse(cachedData));
      //   setLoading(false);
      //   return;
      // }

      // Otherwise, fetch from API
      // const response = await axios.get("/api/invoices", {
      //   params: { company_id: companyNo },
      //   headers: { Authorization: `Bearer ${token}` },
      // });

      const response = await axios.get(
        `/api/invoices?company_id=${companyNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const invoicesData = response.data.data || [];

      // Save to cache
      // localStorage.setItem(cacheKey, JSON.stringify(invoicesData));
      // localStorage.setItem(cacheExpiryKey, Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      setInvoices(invoicesData);
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

    // const matchesStatus =
    //   filterStatus === "all" || invoice.status === filterStatus;
    const matchesCreditType =
      filterCreditType === "all" ||
      (filterCreditType === "credit" && invoice.payment_type === "credit") ||
      (filterCreditType === "non-credit" && invoice.payment_type !== "credit");

    // Date filtering logic
    const matchesDate =
      (!dateFilter.startDate ||
        new Date(invoice.issue_date) >= new Date(dateFilter.startDate)) &&
      (!dateFilter.endDate ||
        new Date(invoice.issue_date) <= new Date(dateFilter.endDate));

    return matchesSearch && matchesCreditType && matchesDate;
  });

  const handleViewInvoice = (invoice) => {
    console.log("Viewing invoice:", invoice);

    setCurrentInvoice(invoice);
    if (companyNo === 2) {
      setShowPreviewModalAppleholidays(true);
    } else if (companyNo === 3) {
      setShowPreviewModalAahaas(true);
    } else if (companyNo === 1) {
      setShowPreviewModalShirmila(true);
    } else {
      setShowPreviewModalAahaas(true);
    }
    // setShowPreviewModalAppleholidays(true);
    // setShowPreviewModalShirmila(true);
  };

  const handleEditInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setShowEditModal(true);
  };

  const handlePrintInvoice = (invoice) => {
    // Set the current invoice to generate the PDF for
    setCurrentInvoice(invoice);

    // Create a download link using the PDFDownloadLink component
    const pdfLink = (
      <PDFDownloadLink
        document={<InvoicePDF invoice={invoice} />}
        fileName={`invoice_${invoice.invoice_number}.pdf`}
      >
        {({ blob, url, loading, error }) =>
          loading ? "Loading document..." : "Download now!"
        }
      </PDFDownloadLink>
    );

    // Programmatically trigger the download
    // Since we can't directly access the download link in this way,
    // we'll need to create a temporary button and click it
    const tempDiv = document.createElement("div");
    document.body.appendChild(tempDiv);

    // Render the PDFDownloadLink to our temp div
    ReactDOM.render(pdfLink, tempDiv);

    // Find the anchor tag and click it
    setTimeout(() => {
      const downloadLink = tempDiv.querySelector("a");
      if (downloadLink) {
        downloadLink.click();
      }
      document.body.removeChild(tempDiv);
    }, 100);
  };
  const handleDownloadInvoiceAahaas = (invoice) => {
    // Set the current invoice to generate the PDF for
    setCurrentInvoice(invoice);
    console.log("Printing invoice for Aahaas:", invoice);

    // Create a download link using the PDFDownloadLink component
    const pdfLink = (
      <PDFDownloadLink
        document={<InvoicePDF invoice={invoice} company="aahaas" />}
        fileName={`aahaas_invoice_${invoice.invoice_number}.pdf`}
      >
        {({ loading }) => (loading ? "Loading document..." : "Download now!")}
      </PDFDownloadLink>
    );

    // Programmatically trigger the download
    // Since we can't directly access the download link in this way,
    // we'll need to create a temporary button and click it
    const tempDiv = document.createElement("div");
    document.body.appendChild(tempDiv);

    // Render the PDFDownloadLink to our temp div
    ReactDOM.render(pdfLink, tempDiv);

    // Find the anchor tag and click it
    setTimeout(() => {
      const downloadLink = tempDiv.querySelector("a");
      if (downloadLink) {
        downloadLink.click();
      }
      document.body.removeChild(tempDiv);
    }, 100);
  };
  const handleDownloadInvoiceAppleHolidays = (invoice) => {
    // Set the current invoice to generate the PDF for
    setCurrentInvoice(invoice);

    // Create a download link using the PDFDownloadLink component
    const pdfLink = (
      <PDFDownloadLink
        document={<InvoicePDF invoice={invoice} company="appleholidays" />}
        fileName={`appleholidays_invoice_${invoice.invoice_number}.pdf`}
      >
        {({ loading }) => (loading ? "Loading document..." : "Download now!")}
      </PDFDownloadLink>
    );

    // Programmatically trigger the download
    // Since we can't directly access the download link in this way,
    // we'll need to create a temporary button and click it
    const tempDiv = document.createElement("div");
    document.body.appendChild(tempDiv);

    // Render the PDFDownloadLink to our temp div
    ReactDOM.render(pdfLink, tempDiv);

    // Find the anchor tag and click it
    setTimeout(() => {
      const downloadLink = tempDiv.querySelector("a");
      if (downloadLink) {
        downloadLink.click();
      }
      document.body.removeChild(tempDiv);
    }, 100);
  };
  const handleDownloadInvoiceSharmila = (invoice) => {
    // Set the current invoice to generate the PDF for
    setCurrentInvoice(invoice);

    // Create a download link using the PDFDownloadLink component
    const pdfLink = (
      <PDFDownloadLink
        document={<InvoicePDF invoice={invoice} company="sharmila" />}
        fileName={`sharmila_invoice_${invoice.invoice_number}.pdf`}
      >
        {({ loading }) => (loading ? "Loading document..." : "Download now!")}
      </PDFDownloadLink>
    );

    // Programmatically trigger the download
    // Since we can't directly access the download link in this way,
    // we'll need to create a temporary button and click it
    const tempDiv = document.createElement("div");
    document.body.appendChild(tempDiv);

    // Render the PDFDownloadLink to our temp div
    ReactDOM.render(pdfLink, tempDiv);

    // Find the anchor tag and click it
    setTimeout(() => {
      const downloadLink = tempDiv.querySelector("a");
      if (downloadLink) {
        downloadLink.click();
      }
      document.body.removeChild(tempDiv);
    }, 100);
  };

  const handlePrintInvoiceAahaas = (invoice) => {
    setCurrentInvoice(invoice);
    console.log("Printing invoice for Aahaas:", invoice);

    // Create a modal or component that shows the PDF with print button
    setShowPreviewModalAahaas(true);
  };

  const handlePrintInvoiceAppleHolidays = (invoice) => {
    setCurrentInvoice(invoice);
    setShowPreviewModalAppleholidays(true);
  };

  const handlePrintInvoiceSharmila = (invoice) => {
    setCurrentInvoice(invoice);
    setShowPreviewModalSharmila(true);
  };

  const confirmDelete = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleDeleteInvoiceAdmin = async () => {
    try {
      setIsLoading(true);

      await axios.delete(`/api/invoices/${invoiceToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess(
        `Invoice ${invoiceToDelete.invoice_number} cancelled successfully.`
      );
      fetchInvoices();
      setShowDeleteModal(false);
      setSuccess("");
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      setError(
        error.response?.data?.error ||
          "Failed to cancel invoice. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  // const handleDeleteInvoice = async () => {
  //   try {
  //     setIsLoading(true);

  //     const emailResponse = await axios.post(
  //       "/api/send-email",
  //       {
  //         to: "nightvine121@gmail.com",
  //         subject: `Invoice Cancellation: ${invoiceToDelete.invoice_number}`,
  //         invoice_number: invoiceToDelete.invoice_number,
  //         customer_name: invoiceToDelete.customer?.name || "N/A",
  //         currency: invoiceToDelete.currency,
  //         amount: invoiceToDelete.total_amount,
  //         date: formatDate(invoiceToDelete.issue_date),
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     if (emailResponse.status === 200) {
  //       // Only delete if email sent successfully
  //       await axios.delete(`/api/invoices/${invoiceToDelete.id}`, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });
  //     }

  //     fetchInvoices();
  //     setShowDeleteModal(false);
  //     setSuccess(
  //       `Invoice ${invoiceToDelete.invoice_number} cancelled successfully and notification sent.`
  //     );
  //   } catch (error) {
  //     console.error("Error cancelling invoice:", error);
  //     setError(
  //       error.response?.data?.error ||
  //         "Failed to cancel invoice. Please try again."
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleDeleteInvoice = async () => {
  //   try {
  //     setIsLoading(true);

  //     const emailResponse = await axios.post(
  //       "/api/send-email",
  //       {
  //         to: "nightvine121@gmail.com",
  //         subject: `Invoice Cancellation Request: ${invoiceToDelete.invoice_number}`,
  //         invoice_number: invoiceToDelete.invoice_number,
  //         customer_name: invoiceToDelete.customer?.name || "N/A",
  //         currency: invoiceToDelete.currency,
  //         amount: invoiceToDelete.total_amount,
  //         date: formatDate(invoiceToDelete.issue_date),
  //         invoice_id: invoiceToDelete.id,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     setShowDeleteModal(false);
  //     setSuccess(
  //       `Cancellation request for invoice ${invoiceToDelete.invoice_number} has been sent for approval.`
  //     );
  //   } catch (error) {
  //     console.error("Error requesting invoice cancellation:", error);
  //     setError(
  //       error.response?.data?.error ||
  //         "Failed to request invoice cancellation. Please try again."
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleDeleteInvoice = async () => {
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("to", "nightvine121@gmail.com");
      formData.append(
        "subject",
        `Invoice Cancellation Request: ${invoiceToDelete.invoice_number}`
      );
      formData.append("invoice_number", invoiceToDelete.invoice_number);
      formData.append("customer_name", invoiceToDelete.customer?.name || "N/A");
      formData.append("currency", invoiceToDelete.currency);
      formData.append("amount", invoiceToDelete.total_amount);
      formData.append("date", formatDate(invoiceToDelete.issue_date));
      formData.append("invoice_id", invoiceToDelete.id);
      formData.append("remark", cancelRemark);

      if (cancelAttachment) {
        formData.append("attachment", cancelAttachment);
      }

      const emailResponse = await axios.post("/api/send-email", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setShowDeleteModal(false);
      setCancelRemark(""); // Reset remark
      setCancelAttachment(null); // Reset attachment
      setSuccess(
        `Cancellation request for invoice ${invoiceToDelete.invoice_number} has been sent for approval.`
      );
    } catch (error) {
      console.error("Error requesting invoice cancellation:", error);
      setError(
        error.response?.data?.error ||
          "Failed to request invoice cancellation. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateInvoice = async (formData) => {
    try {
      // Convert items from form data to array format
      const items = [];
      for (let key in formData) {
        if (key.startsWith("items[")) {
          const matches = key.match(/items\[(\d+)\]\[(\w+)\]/);
          if (matches) {
            const index = matches[1];
            const field = matches[2];
            if (!items[index])
              items[index] = { id: currentInvoice.items?.[index]?.id };
            items[index][field] =
              field === "quantity" || field === "price" || field === "discount"
                ? parseFloat(formData[key])
                : formData[key];
          }
        }
      }

      // Convert additional charges if present
      const additionalCharges = [];
      for (let key in formData) {
        if (key.startsWith("additional_charges[")) {
          const matches = key.match(/additional_charges\[(\d+)\]\[(\w+)\]/);
          if (matches) {
            const index = matches[1];
            const field = matches[2];
            if (!additionalCharges[index])
              additionalCharges[index] = {
                id: currentInvoice.additional_charges?.[index]?.id,
              };
            additionalCharges[index][field] =
              field === "amount" ? parseFloat(formData[key]) : formData[key];
          }
        }
      }

      // Prepare the data for API
      const updatedData = {
        customer_id: currentInvoice.customer?.id,
        country_code: formData.country_code || currentInvoice.country_code,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchange_rate) || 1.0,
        tax_treatment: formData.tax_treatment || "inclusive",
        payment_type: formData.payment_type,
        collection_date: formData.collection_date || null,
        payment_instructions: formData.payment_instructions,
        staff: formData.staff,
        remarks: formData.remarks,
        payment_methods: formData.payment_methods
          ? formData.payment_methods.split(",")
          : currentInvoice.payment_methods,
        items: items.filter((item) => item),
        additional_charges: additionalCharges.filter((charge) => charge),
        amount_received: parseFloat(formData.amount_received) || 0,
      };

      await axios.put(
        `/api/invoices/by-number/${currentInvoice.invoice_number}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchInvoices();
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
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

  const handleCancelInvoice = async (invoice) => {
    try {
      setInvoiceToDelete(invoice);
      setShowDeleteModal(true);
    } catch (error) {
      console.error("Error preparing to cancel invoice:", error);
    }
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

            {/* Add this to your existing filter section */}
            <div className="d-flex align-items-center me-3">
              <span className="me-2">
                <FaCalendarAlt />
              </span>
              <Form.Control
                type="date"
                placeholder="From"
                name="startDate"
                value={dateFilter.startDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, startDate: e.target.value })
                }
                style={{ width: "150px", marginRight: "10px" }}
              />
              <span className="me-2">to</span>
              <Form.Control
                type="date"
                placeholder="To"
                name="endDate"
                value={dateFilter.endDate}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, endDate: e.target.value })
                }
                style={{ width: "150px" }}
              />
            </div>

            {/* <div className="d-flex align-items-center me-3">
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
            </div> */}

            <div className="d-flex align-items-center me-3">
              <span className="me-2">
                <FaCreditCard />
              </span>
              <Form.Select
                value={filterCreditType}
                onChange={(e) => setFilterCreditType(e.target.value)}
                style={{ width: "150px" }}
              >
                <option value="all">All Types</option>
                <option value="credit">Credit</option>
                <option value="non-credit">Non-Credit</option>
              </Form.Select>
            </div>

            <Button
              variant="outline-secondary"
              onClick={fetchInvoices}
              className="d-flex align-items-center"
            >
              Refresh
            </Button>
            {dateFilter.startDate || dateFilter.endDate ? (
              <Button
                variant="outline-secondary"
                onClick={() => setDateFilter({ startDate: "", endDate: "" })}
                className="ms-2"
                size="sm"
              >
                Clear Dates
              </Button>
            ) : null}
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
                    <th>Tour Ref No.</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Travel Period</th>
                    <th>Credit/Non-Credit</th>
                    <th>Balance</th>
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
                        <td>{invoice?.id}</td>
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
                          {formatDate(invoice.due_date)} -{" "}
                          {formatDate(invoice.end_date)}
                        </td>
                        <td>{invoice?.payment_type}</td>
                        <td>
                          {invoice.currency} {invoice?.balance}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {/* <FaReceipt className="me-2 text-muted" /> */}
                            {invoice.currency} {invoice.total_amount}
                          </div>
                        </td>
                        <td>{invoice.status}</td>
                        <td className="text-start">
                          <div className="d-flex justify-content-start">
                            <ActionButton
                              icon={<FaEye />}
                              // label="View"
                              variant="info"
                              onClick={() => handleViewInvoice(invoice)}
                            />
                            <ActionButton
                              icon={<FaEdit />}
                              // label="Edit"
                              variant="primary"
                              onClick={() => handleEditInvoice(invoice)}
                            />
                            <ActionButton
                              icon={<FaPrint />}
                              // label="Print"
                              variant="secondary"
                              onClick={() => handlePrintInvoice(invoice.id)}
                            />
                            <ActionButton
                              icon={<FaTrash />}
                              // label="Cancel"
                              variant="danger"
                              onClick={() => handleCancelInvoice(invoice)}
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

      {/* Invoice Preview Modal Aahaas*/}
      <Modal
        show={showPreviewModalAahaas}
        onHide={() => setShowPreviewModalAahaas(false)}
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
              {/* Company Header */}
              <div className="text-center mb-3">
                <img
                  src="/images/logo/aahaas.png"
                  alt="Aahaas Logo"
                  className="receipt-logo"
                  style={{ width: "200px" }}
                />
                <div>
                  One Galle Face Tower, 2208, 1A Centre Road, Colombo 002
                </div>
                <div>Tel: +9411 2352 400 | Web: www.appleholidaysds.com</div>
              </div>

              {/* Greeting + Notice */}
              <div className="thank-you mb-2">
                Dear {currentInvoice.customer?.name || "Customer"}, Thank you
                for your order
              </div>
              <p>Please find below the receipt for your order</p>

              {/* Order Meta Info */}
              <div className="order-meta mb-3">
                <div>
                  <strong>Invoice No:</strong> {currentInvoice.id}
                </div>
                <div>
                  <strong>Order No:</strong> {currentInvoice.invoice_number}
                </div>
                <div>
                  <strong>Order Date:</strong>{" "}
                  {formatDate(currentInvoice.issue_date)} |{" "}
                  {new Date().toLocaleTimeString()}
                </div>
                <div>
                  <strong>Payment Type:</strong>{" "}
                  {currentInvoice.payment_type === "credit"
                    ? "Credit"
                    : "Non-Credit"}{" "}
                  |{" "}
                  {Number(currentInvoice.balance) <= 0
                    ? "Full Payment"
                    : "Partial Payment"}
                  {currentInvoice.payment_type === "non-credit" && (
                    <span>
                      {" "}
                      &nbsp; {formatDate(currentInvoice.collection_date)}
                    </span>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <h5>Customer Details</h5>
              <table className="table table-bordered mb-4">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Email</th>
                    <th>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{currentInvoice.customer?.name || "-"}</td>
                    <td>{currentInvoice.customer?.address || "-"}</td>
                    <td>{currentInvoice.customer?.email || "-"}</td>
                    <td>{currentInvoice.customer?.phone || "-"}</td>
                  </tr>
                </tbody>
              </table>

              {/* Services / Items */}
              <h5>Services</h5>
              <table className="table table-bordered mb-4">
                <thead style={{ backgroundColor: "#343a40", color: "white" }}>
                  <tr>
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

              {/* Totals */}
              <table className="table totals-table mb-4">
                <tbody>
                  <tr>
                    <td>
                      <strong>Sub Total:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {currentInvoice.currency} {currentInvoice.sub_total}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Total:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {currentInvoice.currency} {currentInvoice.total_amount}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Amount Received:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {currentInvoice.currency} {currentInvoice.amount_received}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Balance:</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {currentInvoice.currency} {currentInvoice.balance}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mb-4">
                <h6 className="fw-bold">ACCOUNT DETAILS</h6>
                <div>
                  <strong>ACCOUNT NAME:</strong>{" "}
                  {currentInvoice.account?.account_name || "N/A"}
                </div>
                <div>
                  <strong>ACCOUNT NO:</strong>{" "}
                  {currentInvoice.account?.account_no || "N/A"}
                </div>
                <div>
                  <strong>BANK:</strong> {currentInvoice.account?.bank || "N/A"}
                </div>
                <div>
                  <strong>BRANCH:</strong>{" "}
                  {currentInvoice.account?.branch || "N/A"}
                </div>
                <div>
                  <strong>IFSC CODE:</strong>{" "}
                  {currentInvoice.account?.ifsc_code || "N/A"}
                </div>
                <div>
                  <strong>Bank Address:</strong>{" "}
                  {currentInvoice.account?.bank_address || "N/A"}
                </div>
              </div>

              {/* Travel Period */}
              <p>
                <strong>Start Date:</strong> {currentInvoice.start_date || "-"}{" "}
                &nbsp;|&nbsp;
                <strong>End Date:</strong> {currentInvoice.end_date || "-"}{" "}
                &nbsp;|&nbsp;
                <strong>Travel Period:</strong>{" "}
                {/* {calculateTravelDays(
                  currentInvoice.start_date,
                  currentInvoice.end_date
                )}{" "} */}
                days
              </p>

              {/* Contact Info */}
              <div className="contact-info mt-4">
                <p>
                  Should you have any questions regarding your order, please
                  send an email to <strong>info@aahaas.com</strong>.
                </p>
                <p>
                  Or contact us at <strong>+94 70 722 4227</strong>
                </p>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPreviewModalAahaas(false)}
          >
            Close
          </Button>
          <PDFDownloadLink
            document={<InvoicePDF invoice={currentInvoice} company="aahaas" />}
            fileName={`aahaas_invoice_${currentInvoice?.invoice_number}.pdf`}
            className="btn btn-success me-2"
          >
            {({ loading }) => (
              <>
                <FaDownload className="me-1" />
                {loading ? "Generating..." : "Download PDF"}
              </>
            )}
          </PDFDownloadLink>
          <Button
            variant="primary"
            onClick={() => window.print()}
            className="d-flex align-items-center"
          >
            <FaPrint className="me-1" /> Print Invoice
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Invoice Preview Modal Appleholidays*/}
      <Modal
        show={showPreviewModalAppleholidays}
        onHide={() => setShowPreviewModalAppleholidays(false)}
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
              {/* Company Header */}
              <div className="company-header text-center mb-4">
                <img
                  src="/images/logo/appleholidays_extend.png"
                  alt="Apple Holidays Destination Services"
                  className="img-fluid mb-3"
                  style={{ width: "400px" }}
                />
                <div>
                  One Galle Face Tower, 2208, 1A Centre Road, Colombo 002
                </div>
                <div>Tel: 011 2352 400 | Web: www.appleholidaysds.com</div>
              </div>

              {/* Invoice Title */}
              <div className="text-center mb-3">
                <h5 className="fw-bold">INVOICE - {currentInvoice.id}</h5>
              </div>

              {/* Invoice Meta and Customer Info */}
              <div className="d-flex justify-content-between mb-4">
                <div>
                  <div>
                    <strong>To:</strong>{" "}
                    {currentInvoice.customer?.name || "N/A"}
                  </div>
                  <div>{currentInvoice.customer?.address || "N/A"}</div>
                </div>
                <div className="text-start">
                  <div>
                    <strong>Tour confirmation No.</strong>{" "}
                    {currentInvoice.invoice_number}
                  </div>
                  <div>
                    <strong>Invoice No.</strong> {currentInvoice.id}
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
                  <div>
                    <strong>Booking No</strong>{" "}
                    {currentInvoice.booking_no || "N/A"}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="invoice-table mb-3">
                <thead>
                  <tr>
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
                      {/* <td>{item.description}</td> */}
                      <td>Cost per Adult</td>
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
                  {/* <td>Handling Fee</td>
                  <td style={{ textAlign: "right" }}></td>
                  <td style={{ textAlign: "right" }}></td>
                  <td style={{ textAlign: "right" }}></td>
                  <td style={{ textAlign: "right" }}>USD 100.00</td> */}
                </tbody>
              </table>

              {/* Totals */}
              <div className="row mb-4">
                <div className="col-md-6 offset-md-6">
                  <table className="invoice-totals w-100">
                    <tbody>
                      <tr>
                        <td style={{ textAlign: "right" }}>
                          <strong>SUB TOTAL:</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {currentInvoice.currency} {currentInvoice.sub_total}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: "right" }}>
                          <strong>TOTAL:</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {currentInvoice.currency}{" "}
                          {currentInvoice.total_amount}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: "right" }}>
                          <strong>AMOUNT RECEIVED:</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {currentInvoice.currency}{" "}
                          {currentInvoice.amount_received}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: "right" }}>
                          <strong>BALANCE DUE:</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {currentInvoice.currency} {currentInvoice.balance}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold">ACCOUNT DETAILS</h6>
                <div>
                  <strong>ACCOUNT NAME:</strong>{" "}
                  {currentInvoice.account?.account_name || "N/A"}
                </div>
                <div>
                  <strong>ACCOUNT NO:</strong>{" "}
                  {currentInvoice.account?.account_no || "N/A"}
                </div>
                <div>
                  <strong>BANK:</strong> {currentInvoice.account?.bank || "N/A"}
                </div>
                <div>
                  <strong>BRANCH:</strong>{" "}
                  {currentInvoice.account?.branch || "N/A"}
                </div>
                <div>
                  <strong>IFSC CODE:</strong>{" "}
                  {currentInvoice.account?.ifsc_code || "N/A"}
                </div>
                <div>
                  <strong>Bank Address:</strong>{" "}
                  {currentInvoice.account?.bank_address || "N/A"}
                </div>
              </div>

              {/* Payment Instructions / Account Details */}
              <div className="row">
                <div className="col-md-6">
                  {currentInvoice.payment_instructions && (
                    <div className="mb-3">
                      {currentInvoice.payment_instructions}
                    </div>
                  )}
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
            onClick={() => setShowPreviewModalAppleholidays(false)}
          >
            Close
          </Button>
          <PDFDownloadLink
            document={
              <InvoicePDF invoice={currentInvoice} company="appleholidays" />
            }
            fileName={`appleholidays_invoice_${currentInvoice?.invoice_number}.pdf`}
            className="btn btn-success me-2"
          >
            {({ loading }) => (
              <>
                <FaDownload className="me-1" />
                {loading ? "Generating..." : "Download PDF"}
              </>
            )}
          </PDFDownloadLink>
          <Button
            variant="primary"
            onClick={() => window.print()}
            className="d-flex align-items-center"
          >
            <FaPrint className="me-1" /> Print Invoice
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Invoice Preview Modal Shirmila*/}
      <Modal
        show={showPreviewModalShirmila}
        onHide={() => setShowPreviewModalShirmila(false)}
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
              {/* Company Header */}
              <div className="text-center mb-3">
                <h4 className="mb-1 fw-bold text-danger">
                  Sharmila Tours & Travels
                </h4>
                <div className="mb-1">
                  No: 148, Aluthmawatha Road, Colombo - 15, Sri Lanka
                </div>
                <div className="mb-1">Tel: 011 23 52 400 | 011 23 45 800</div>
                <div className="mb-1">E-mail: fares@sharmilatravels.com</div>

                <h5 className="fw-bold mb-3 mt-4">INVOICE</h5>
              </div>

              {/* Invoice Meta and Customer Info */}
              <div className="d-flex justify-content-between mb-4">
                <div>
                  <div>
                    <strong>To:</strong>{" "}
                    {currentInvoice.customer?.name || "N/A"}
                  </div>
                  <div>{currentInvoice.customer?.address || "N/A"}</div>
                  {/* <div>GST NO: {currentInvoice.customer?.gst_no || "N/A"}</div> */}
                </div>
                <div className="text-start">
                  <div>
                    <strong>No.</strong> {currentInvoice.invoice_number}
                  </div>
                  <div>
                    <strong>Date:</strong>{" "}
                    {formatDate(currentInvoice.issue_date)}
                  </div>
                  <div>
                    <strong>Your Ref.</strong>{" "}
                    {currentInvoice.your_ref || "N/A"}
                  </div>
                  <div>
                    <strong>Sales ID:</strong>{" "}
                    {currentInvoice.sales_id || "N/A"}
                  </div>
                  <div>
                    <strong>Printed By:</strong>{" "}
                    {currentInvoice.printed_by || "N/A"}
                  </div>
                  <div>
                    <strong>Booking ID:</strong>{" "}
                    {currentInvoice.booking_id || "N/A"}
                  </div>
                </div>
              </div>

              {/* Items Table */}
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

              {/* Payment Instructions */}
              {currentInvoice.payment_instructions && (
                <div className="mb-3">
                  <strong>Payment Instructions:</strong>{" "}
                  {currentInvoice.payment_instructions}
                </div>
              )}

              {/* Totals */}
              <div className="row mb-4">
                <div className="col-md-6 offset-md-6">
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Sub Total:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency}{" "}
                          {Number(currentInvoice.sub_total).toFixed(2)}
                        </td>
                      </tr>
                      {currentInvoice.gst && (
                        <tr>
                          <td style={{ padding: "4px", textAlign: "right" }}>
                            <strong>GST:</strong>
                          </td>
                          <td style={{ padding: "4px", textAlign: "right" }}>
                            {currentInvoice.currency}{" "}
                            {Number(currentInvoice.gst).toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Total:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency}{" "}
                          {Number(currentInvoice.total_amount).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Amount Received:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency}{" "}
                          {Number(currentInvoice.amount_received).toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          <strong>Balance:</strong>
                        </td>
                        <td style={{ padding: "4px", textAlign: "right" }}>
                          {currentInvoice.currency}{" "}
                          {Number(currentInvoice.balance).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="fw-bold">ACCOUNT DETAILS</h6>
                <div>
                  <strong>ACCOUNT NAME:</strong>{" "}
                  {currentInvoice.account?.account_name || "N/A"}
                </div>
                <div>
                  <strong>ACCOUNT NO:</strong>{" "}
                  {currentInvoice.account?.account_no || "N/A"}
                </div>
                <div>
                  <strong>BANK:</strong> {currentInvoice.account?.bank || "N/A"}
                </div>
                <div>
                  <strong>BRANCH:</strong>{" "}
                  {currentInvoice.account?.branch || "N/A"}
                </div>
                <div>
                  <strong>IFSC CODE:</strong>{" "}
                  {currentInvoice.account?.ifsc_code || "N/A"}
                </div>
                <div>
                  <strong>Bank Address:</strong>{" "}
                  {currentInvoice.account?.bank_address || "N/A"}
                </div>
              </div>

              {/* Bottom left: Staff and Remark */}
              <div className="row">
                <div className="col-md-6">
                  {currentInvoice.staff && (
                    <div>
                      <strong>Staff:</strong> {currentInvoice.staff}
                    </div>
                  )}
                  <div>
                    <strong>Remark:</strong> {currentInvoice.remarks || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPreviewModalShirmila(false)}
          >
            Close
          </Button>
          <PDFDownloadLink
            document={
              <InvoicePDF invoice={currentInvoice} company="sharmila" />
            }
            fileName={`sharmila_invoice_${currentInvoice?.invoice_number}.pdf`}
            className="btn btn-success me-2"
          >
            {({ loading }) => (
              <>
                <FaDownload className="me-1" />
                {loading ? "Generating..." : "Download PDF"}
              </>
            )}
          </PDFDownloadLink>
          <Button
            variant="primary"
            onClick={() => window.print()}
            className="d-flex align-items-center"
          >
            <FaPrint className="me-1" /> Print Invoice
          </Button>
        </Modal.Footer>
      </Modal>

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
                {/* <Accordion.Item eventKey="customer">
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
                </Accordion.Item> */}
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
                        <FloatingLabel label="Customer Name" className="mb-3">
                          <Form.Control
                            type="text"
                            name="customer_name"
                            defaultValue={currentInvoice.customer?.name}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel label="Mobile Number" className="mb-3">
                          <Form.Control
                            type="text"
                            name="customer_mobile"
                            defaultValue={currentInvoice.customer?.mobile}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <FloatingLabel label="Customer Code" className="mb-3">
                          <Form.Control
                            type="text"
                            name="customer_code"
                            defaultValue={currentInvoice.customer?.code}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel label="GST Number" className="mb-3">
                          <Form.Control
                            type="text"
                            name="customer_gst_no"
                            defaultValue={currentInvoice.customer?.gst_no}
                          />
                        </FloatingLabel>
                      </Col>
                    </Row>

                    <FloatingLabel label="Customer Address" className="mb-3">
                      <Form.Control
                        as="textarea"
                        name="customer_address"
                        style={{ height: "80px" }}
                        defaultValue={currentInvoice.customer?.address}
                        required
                      />
                    </FloatingLabel>

                    <Row>
                      <Col md={6}>
                        <FloatingLabel label="Country Code" className="mb-3">
                          <Form.Select
                            name="country_code"
                            defaultValue={currentInvoice.country_code}
                            required
                          >
                            <option value="LK">Sri Lanka</option>
                            <option value="IN">India</option>
                            <option value="SG">Singapore</option>
                            <option value="MY">Malaysia</option>
                            <option value="US">United States</option>
                            <option value="UK">United Kingdom</option>
                          </Form.Select>
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel label="Currency" className="mb-3">
                          <Form.Select
                            name="currency"
                            defaultValue={currentInvoice.currency}
                            required
                          >
                            <option value="LKR">LKR (Sri Lankan Rupee)</option>
                            <option value="INR">INR (Indian Rupee)</option>
                            <option value="SGD">SGD (Singapore Dollar)</option>
                            <option value="MYR">MYR (Malaysian Ringgit)</option>
                            <option value="USD">USD (US Dollar)</option>
                            <option value="EUR">EUR (Euro)</option>
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
                          <Form.Control
                            type="text"
                            name="payment_methods"
                            defaultValue={
                              Array.isArray(currentInvoice?.payment_methods)
                                ? currentInvoice.payment_methods.join(",")
                                : ""
                            }
                          />
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

                {/* Invoice Items */}
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
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="d-flex justify-content-end mt-2">
                      <Button variant="outline-primary" size="sm">
                        <FaPlus className="me-1" /> Add Item
                      </Button>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Additional Charges */}
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
                              <td className="text-end">
                                <Button variant="outline-danger" size="sm">
                                  <FaTrash />
                                </Button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>

                    <div className="d-flex justify-content-end mt-2">
                      <Button variant="outline-primary" size="sm">
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
      {/* <Modal
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
          {!isAdmin && (
            <Button variant="danger" onClick={handleDeleteInvoice}>
              {loading ? "Requestinng Cancel..." : "Request to Cancel"}
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" onClick={handleDeleteInvoiceAdmin}>
              Confirm Cancel
            </Button>
          )}
        </Modal.Footer>
      </Modal> */}
      <Modal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setCancelRemark(""); // Reset on close
          setCancelAttachment(null); // Reset on close
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FaTrash className="me-2 text-danger" />
            {isAdmin ? "Confirm Cancellation" : "Request Cancellation"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="alert alert-danger">
            <strong>Warning:</strong>{" "}
            {isAdmin
              ? "This action cannot be undone."
              : "This will send a cancellation request for approval."}
          </div>

          <p>
            {isAdmin
              ? `Are you sure you want to cancel invoice #${invoiceToDelete?.invoice_number}?`
              : `Are you sure you want to request cancellation for invoice #${invoiceToDelete?.invoice_number}?`}
          </p>

          {/* Add remark and attachment fields for non-admin users */}
          {!isAdmin && (
            <div className="mt-4">
              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Reason for Cancellation *</strong>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Please provide the reason for cancellation..."
                  value={cancelRemark}
                  onChange={(e) => setCancelRemark(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Attachment (Optional)</strong>
                </Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setCancelAttachment(e.target.files[0])}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <Form.Text className="text-muted">
                  Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)
                </Form.Text>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setCancelRemark("");
              setCancelAttachment(null);
            }}
          >
            Close
          </Button>
          {!isAdmin && (
            <Button
              variant="danger"
              onClick={handleDeleteInvoice}
              disabled={!cancelRemark.trim()} // Disable if no remark
            >
              {isLoading ? "Submitting Request..." : "Submit Request"}
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" onClick={handleDeleteInvoiceAdmin}>
              Confirm Cancel
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Invoice_list;
