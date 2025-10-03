import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import ReactDOM from "react-dom/client"; // Add this import
import Swal from "sweetalert2";

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
  Pagination, // Added for pagination
  Spinner,
  Alert, // Added for loading
  Dropdown, // Added for export dropdown
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
  FaSync,
  FaExchangeAlt, // For refresh
  FaFileExcel, // For Excel export
  FaFilePdf, // For PDF export
  FaFileCsv, // For CSV export
  FaStepBackward, // For first page
  FaStepForward,
  FaCalculator,
  FaSave, // For last page
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import { useUser } from "../../../../contentApi/UserProvider";
import { pdf, PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF } from "../upload_invoice/InvoicePDF";
import html2pdf from "html2pdf.js";
import Invoice_aahaas_modal from "../create_invoice/aahaas/Invoice_aahaas_modal";
import Invoice_appleholidays_modal from "../create_invoice/appleholidays/Invoice_appleholidays_modal";
import Invoice_sharmila_modal from "../create_invoice/shirmila_travels/Invoice_sharmila_modal";

const Invoice_list = () => {
  const [fetchType, setFetchType] = useState("manual");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModalAahaas, setShowPreviewModalAahaas] = useState(false);
  const [showPreviewModalAppleholidays, setShowPreviewModalAppleholidays] =
    useState(false);
  const [showPreviewModalShirmila, setShowPreviewModalShirmila] =
    useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [isEditingPayments, setIsEditingPayments] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [currentInvoiceExchange, setCurrentInvoiceExchange] = useState(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [selectedInvoicePayments, setSelectedInvoicePayments] = useState([]);
  const [companyNo, setCompanyNo] = useState(null);
  const [searchDaysCount, setSearchDaysCount] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterCreditType, setFilterCreditType] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const navigate = useNavigate();
  const receiptRef = useRef();
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const {
    user,
    company,
    role,
    loading: userLoading,
    error: userError,
  } = useUser();
  const { selectedCompany } = useContext(CompanyContext);
  const [xeRate, setXeRate] = useState(88.66);
  const [cancelRemark, setCancelRemark] = useState("");
  const [cancelAttachment, setCancelAttachment] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of invoices per page
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [exchangeRateError, setExchangeRateError] = useState(null);
  const [exchangeRateSuccess, setExchangeRateSuccess] = useState("");
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null);
  const [showExchangedVersion, setShowExchangedVersion] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [currentInvoiceCosts, setCurrentInvoiceCosts] = useState([]);

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };
    const defaultCompanyNo = companyMap[selectedCompany?.toLowerCase()] || 3;
    setCompanyNo(defaultCompanyNo);
  }, [selectedCompany]);

  useEffect(() => {
    if (companyNo) {
      fetchInvoices(0); // Initial fetch with 0 days
    }
  }, [companyNo]);

  // Consolidated fetch function (merged fetchInvoices and fetchInvoices1)
  const fetchInvoices = async (days = 0) => {
    try {
      setLoading(true);
      setError(null);
      if (user) {
        setIsAdmin(user.role.name === "admin");
      }
      let response;

      if (companyNo == 3) {
        // Always automatic for company 3
        response = await axios.get(
          `/api/invoices?company_id=${companyNo}&days_from_today=${days}&type=automatic`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // Others follow manual/automatic depending on fetchType
        response = await axios.get(
          `/api/invoices?company_id=${companyNo}&days_from_today=${days}&type=${fetchType}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      const invoicesData = response.data.data || [];

      setInvoices(invoicesData);

      setCurrentPage(1); // Reset to first page on new fetch
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError(
        error.response?.data?.message ||
          "Failed to fetch invoices. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Debounce function for search inputs (to reduce API calls if needed, but here applied to local filters)
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleExport = (format) => {
    const dataToExport = filteredInvoices.map((invoice) => ({
      "Invoice Number": invoice.invoice_number,
      "Tour Ref No": invoice.id,
      Customer:
        companyNo === 3
          ? invoice.customer?.customer || "N/A"
          : invoice.customer?.name || "N/A",
      "Issue Date": formatDate(invoice.issue_date),
      "Travel Period": `${formatDate(invoice.start_date)} - ${formatDate(
        invoice.end_date
      )}`,
      "Credit/Non-Credit": invoice.payment_type,
      Balance: `${currencySymbols[invoice.currency] || invoice.currency} ${
        invoice.balance
      }`,
      Total: `${currencySymbols[invoice.currency] || invoice.currency} ${
        invoice.total_amount
      }`,
      Status: invoice.status === "draft" ? "open" : invoice.status,
      Currency: invoice.currency,
      "Due Date": formatDate(invoice.due_date),
    }));

    if (format === "csv") {
      exportToCSV(dataToExport);
    } else if (format === "excel") {
      exportToExcel(dataToExport);
    } else if (format === "pdf") {
      exportToPDF(dataToExport);
    }
  };

  const exportToCSV = (data) => {
    const headers = Object.keys(data[0]).join(",");
    const csvContent = data
      .map((row) =>
        Object.values(row)
          .map((field) => `"${field}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([headers + "\n" + csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = (data) => {
    // Simple Excel export using CSV (for basic functionality)
    // For advanced Excel features, you might want to use a library like xlsx
    const headers = Object.keys(data[0]).join("\t");
    const excelContent = data
      .map((row) => Object.values(row).join("\t"))
      .join("\n");

    const blob = new Blob([headers + "\n" + excelContent], {
      type: "application/vnd.ms-excel",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices_${new Date().toISOString().split("T")[0]}.xls`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = (data) => {
    // Simple PDF export - you can enhance this with a proper PDF library
    const content = `
      <html>
        <head>
          <title>Invoices Export</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Invoices Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                ${Object.keys(data[0])
                  .map((key) => `<th>${key}</th>`)
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) => `
                <tr>
                  ${Object.values(row)
                    .map((value) => `<td>${value}</td>`)
                    .join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([content], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices_${new Date().toISOString().split("T")[0]}.html`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Enhanced pagination functions
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(pageNumbers.length);

  // Enhanced ActionButton component with tooltips
  const ActionButton = ({
    icon,
    label,
    variant = "primary",
    onClick,
    disabled = false,
    tooltip = "",
  }) => (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip>{tooltip || label}</Tooltip>}
    >
      <Button
        variant={variant}
        size="sm"
        className="me-1 mb-1"
        onClick={onClick}
        disabled={disabled}
        style={{ minWidth: "40px" }}
      >
        {icon}
        <span className="d-none d-lg-inline">{label}</span>
      </Button>
    </OverlayTrigger>
  );

  const fetchInvoiceRate = async (from, to, invoice) => {
    try {
      const response = await axios.get(`/api/currency/rate`, {
        params: { from, to },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.rate) {
        setXeRate(response.data.rate + invoice.increment);
        // setXeRate(invoice.exchange_rate + invoice.increment);
      } else {
        console.warn("Invalid response format:", response.data);
      }
    } catch (error) {
      console.error("Error fetching invoice rate:", error);
      // optional fallback
      setXeRate(88.66);
    }
  };

  // Memoized filtered invoices to optimize computation
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.invoice_number
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (invoice.customer?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesCreditType =
        filterCreditType === "all" ||
        (filterCreditType === "credit" && invoice.payment_type === "credit") ||
        (filterCreditType === "non-credit" &&
          invoice.payment_type !== "credit");
      const matchesDate =
        (!dateFilter.startDate ||
          new Date(invoice.issue_date) >= new Date(dateFilter.startDate)) &&
        (!dateFilter.endDate ||
          new Date(invoice.issue_date) <= new Date(dateFilter.endDate));
      return matchesSearch && matchesCreditType && matchesDate;
    });
  }, [invoices, searchTerm, filterCreditType, dateFilter]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Number of pages
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredInvoices.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const fetchInvoicesByDays = (days) => {
    if (days < 0) {
      setError("Days cannot be negative.");
      return;
    }
    fetchInvoices(days);
  };

  const handleViewCosts = (invoice) => {
    console.log("Viewing costs for invoice:", invoice);

    // Filter only summary type costs
    const summaryCosts =
      invoice.cost_of_invoices?.filter((cost) => cost.type === "summary") || [];
    setCurrentInvoiceCosts(summaryCosts);
    setCurrentInvoice(invoice);
    setShowCostModal(true);
  };

  const resetDaysFilter = () => {
    setSearchDaysCount("");
    fetchInvoices(0); // Fetch all invoices
  };

  const handleViewInvoice = (invoice) => {
    let d = fetchInvoiceRate(
      invoice.from_currency,
      invoice.to_currency,
      invoice
    );
    console.log(d);

    setCurrentInvoice(invoice);
    setShowExchangedVersion(false); // Ensure original version is shown
    if (companyNo === 2) {
      setShowPreviewModalAppleholidays(true);
    } else if (companyNo === 3) {
      setShowPreviewModalAahaas(true);
    } else if (companyNo === 1) {
      setShowPreviewModalShirmila(true);
    } else {
      setShowPreviewModalAahaas(true);
    }
  };

  const handleEditInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setShowEditModal(true);
  };

  const handleViewPayments = (invoice) => {
    console.log("Viewing payments for invoice:", invoice);

    setSelectedInvoicePayments(invoice.payments || []);
    setCurrentInvoice(invoice);
    setShowPaymentModal(true);
    setIsEditingPayments(false); // Reset to view mode
  };
  const handleExchangeRates = (invoice) => {
    console.log("Viewing exchange rates for invoice:", invoice);

    setSelectedInvoicePayments(invoice.exchange_rate_histories || []);
    setCurrentInvoice(invoice);
    // setShowPaymentModal(true);
    setShowExchangeModal(true);
  };

  const handleAddPayment = () => {
    setSelectedInvoicePayments([
      ...selectedInvoicePayments,
      {
        id: null,
        amount: 0,
        payment_date: new Date().toISOString().split("T")[0],
        method: "",
        note: "",
        created_at: null,
        updated_at: null,
      },
    ]);
    setIsEditingPayments(true);
  };

  const handleRemovePayment = (index) => {
    const updatedPayments = selectedInvoicePayments.filter(
      (_, i) => i !== index
    );
    setSelectedInvoicePayments(updatedPayments);
  };

  const handlePaymentChange = (index, field, value) => {
    const updatedPayments = [...selectedInvoicePayments];
    updatedPayments[index] = { ...updatedPayments[index], [field]: value };
    setSelectedInvoicePayments(updatedPayments);
  };

  const handleUpdatePayments = async () => {
    try {
      const totalAmountReceived = selectedInvoicePayments.reduce(
        (sum, payment) => sum + (parseFloat(payment.amount) || 0),
        0
      );

      // Format payments for API
      const payments = selectedInvoicePayments.map((payment) => ({
        id: payment.id,
        amount: parseFloat(payment.amount) || 0,
        payment_date: payment.payment_date,
        method: payment.method || null,
        note: payment.note || null,
      }));

      // Calculate new balance based on current invoice totals
      const currentTotal = parseFloat(currentInvoice.total_amount) || 0;
      const newBalance = (currentTotal - totalAmountReceived).toFixed(2);

      // Build updated data with all financial fields
      const updatedData = {
        sub_total: currentInvoice.sub_total || "0.00",
        handling_fee: currentInvoice.handling_fee || "0.00",
        gst_amount: currentInvoice.gst_amount || "0.00",
        additional_tax: currentInvoice.additional_tax || "0.00",
        bank_charges: currentInvoice.bank_charges || "0.00",
        total_amount: currentInvoice.total_amount || "0.00",
        balance: newBalance,
        amount_received: totalAmountReceived.toFixed(2),
        payments: payments,
      };

      await axios.put(
        `/api/invoices/by-number/${currentInvoice.invoice_number}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(
        `Payments for invoice ${currentInvoice.invoice_number} updated successfully.`
      );
      fetchInvoices();
      setShowPaymentModal(false);
      setIsEditingPayments(false);
    } catch (error) {
      console.error("Error updating payments:", error);
      setError(
        error.response?.data?.error ||
          "Failed to update payments. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = () => {
    const element = receiptRef.current;
    const opt = {
      margin: 0.3,
      filename: `receipt_${currentInvoice?.invoice_number}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: {
        unit: "in",
        format: [8.5, 13],
        orientation: "portrait",
      },
    };
    html2pdf().set(opt).from(element).save();
  };

  const handlePrintInvoice = (invoice) => {
    setCurrentInvoice(invoice);

    // Create a temporary container
    const tempDiv = document.createElement("div");
    tempDiv.style.display = "none";
    document.body.appendChild(tempDiv);

    // Create a React root and render the PDFDownloadLink
    const root = ReactDOM.createRoot(tempDiv);

    root.render(
      <PDFDownloadLink
        document={<InvoicePDF invoice={invoice} />}
        fileName={`invoice_${invoice.invoice_number}.pdf`}
      >
        {({ loading, url }) => {
          if (!loading && url) {
            // Once the PDF is ready, trigger download
            setTimeout(() => {
              const downloadLink = tempDiv.querySelector("a");
              if (downloadLink) {
                downloadLink.click();
              }
              // Clean up
              root.unmount();
              document.body.removeChild(tempDiv);
            }, 100);
          }
          return loading ? "Generating PDF..." : "Download ready";
        }}
      </PDFDownloadLink>
    );
  };

  const handleDownloadInvoiceAahaas = (invoice) => {
    setCurrentInvoice(invoice);
    const pdfLink = (
      <PDFDownloadLink
        document={<InvoicePDF invoice={invoice} company="aahaas" />}
        fileName={`aahaas_invoice_${invoice.invoice_number}.pdf`}
      >
        {({ loading }) => (loading ? "Loading document..." : "Download now!")}
      </PDFDownloadLink>
    );
    const tempDiv = document.createElement("div");
    document.body.appendChild(tempDiv);
    ReactDOM.render(pdfLink, tempDiv);
    setTimeout(() => {
      const downloadLink = tempDiv.querySelector("a");
      if (downloadLink) {
        downloadLink.click();
      }
      document.body.removeChild(tempDiv);
    }, 100);
  };

  const handleDownloadInvoiceAppleHolidays = (invoice) => {
    setCurrentInvoice(invoice);
    const pdfLink = (
      <PDFDownloadLink
        document={<InvoicePDF invoice={invoice} company="appleholidays" />}
        fileName={`appleholidays_invoice_${invoice.invoice_number}.pdf`}
      >
        {({ loading }) => (loading ? "Loading document..." : "Download now!")}
      </PDFDownloadLink>
    );
    const tempDiv = document.createElement("div");
    document.body.appendChild(tempDiv);
    ReactDOM.render(pdfLink, tempDiv);
    setTimeout(() => {
      const downloadLink = tempDiv.querySelector("a");
      if (downloadLink) {
        downloadLink.click();
      }
      document.body.removeChild(tempDiv);
    }, 100);
  };

  const handleDownloadInvoiceSharmila = (invoice) => {
    setCurrentInvoice(invoice);
    const pdfLink = (
      <PDFDownloadLink
        document={<InvoicePDF invoice={invoice} company="sharmila" />}
        fileName={`sharmila_invoice_${invoice.invoice_number}.pdf`}
      >
        {({ loading }) => (loading ? "Loading document..." : "Download now!")}
      </PDFDownloadLink>
    );
    const tempDiv = document.createElement("div");
    document.body.appendChild(tempDiv);
    ReactDOM.render(pdfLink, tempDiv);
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
    setShowPreviewModalAahaas(true);
  };

  const handlePrintInvoiceAppleHolidays = (invoice) => {
    setCurrentInvoice(invoice);
    setShowPreviewModalAppleholidays(true);
  };

  const handlePrintInvoiceSharmila = (invoice) => {
    setCurrentInvoice(invoice);
    setShowPreviewModalShirmila(true);
  };

  const confirmDelete = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleUpdateExchangeRate = async (invoice) => {
    try {
      setLoadingInvoiceId(invoice.id); // mark only this invoice row as loading
      setExchangeRateLoading(true);
      setExchangeRateError(null);
      setExchangeRateSuccess("");

      console.log("Updating exchange rate for invoice:", invoice);

      const response = await axios.post(
        `/api/invoices/${invoice.id}/create-exchange-rate-histories`,
        {}, // body (empty, since you're just triggering the backend)
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Exchange rate history updated:", response.data);
      setExchangeRateSuccess("Exchange rate history updated successfully!");

      // Refresh the current invoice data to show the new exchange rate history
      fetchInvoices(searchDaysCount || 0);
    } catch (error) {
      console.error("Failed to update exchange rate:", error);
      setExchangeRateError(
        error.response?.data?.error ||
          "Failed to update exchange rate. Please try again."
      );
    } finally {
      setExchangeRateLoading(false);
      setLoadingInvoiceId(null); // reset after request finishes
    }
  };

  const formatInvoiceData = (invoice) => {
    if (!invoice) return {};
    return {
      customer: {
        id: invoice.customer_id || null,
        name: invoice.customer?.name || "",
        address: invoice.customer?.address || "",
        mobile: invoice.customer?.mobile || "",
        code: invoice.customer?.code || "",
        gst_no: invoice.customer?.gst_no || "",
        customer: invoice.customer?.customer || "",
        customer_email: invoice.customer?.customer_email || "",
        customer_number: invoice.customer?.customer_number || "",
        payment_method: invoice.customer?.payment_method || "",
      },
      invoice: {
        id: invoice.id || null,
        country: invoice.country_code || "IN",
        number: invoice.invoice_number || "",
        issueDate: invoice.issue_date || new Date().toISOString().split("T")[0],
        dueDate:
          invoice.due_date ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        salesId: invoice.sales_id || "",
        printedBy: invoice.printed_by || "",
        yourRef: invoice.your_ref || "",
        bookingId: invoice.booking_no || "",
        startDate: invoice.start_date || "",
        endDate: invoice.end_date || "",
      },
      currencyDetails: {
        currency: invoice.currency || "USD",
        exchangeRate: invoice.exchange_rate || 87.52,
        rateSource: "custom",
        customRate: invoice.exchange_rate || 87.52,
        increment: invoice.increment || 1,
        addOneToRate: true,
        addTenToRate: false,
        taxTreatment: invoice.tax_treatment || "exclusive",
      },
      serviceItems:
        invoice.items?.map((item) => ({
          id: item.id || Date.now(),
          code: item.code || "",
          type: item.type || "hotel",
          description: item.description || "",
          checkin_time: item.checkin_time || "",
          checkout_time: item.checkout_time || "",
          qty: item.quantity || 1,
          price: item.price || 0,
          discount: item.discount || 0,
          total:
            item.price * item.quantity * (1 - (item.discount || 0) / 100) || 0,
        })) || [],
      additionalCharges:
        invoice.additional_charges?.map((charge) => ({
          id: charge.id || Date.now(),
          description: charge.description || "",
          amount: charge.amount || 0,
          taxable: charge.taxable || false,
        })) || [],
      taxRates: [],
      accountDetails: {
        name: invoice.account?.account_name || "",
        number: invoice.account?.account_no || "",
        bank: invoice.account?.bank || "",
        branch: invoice.account?.branch || "",
        ifsc: invoice.account?.ifsc_code || "",
        address: invoice.account?.bank_address || "",
      },
      payment: {
        type: invoice.payment_type || "non-credit",
        collectionDate:
          invoice.collection_date ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        instructions:
          invoice.payment_instructions ||
          "Please settle the invoice on or before",
        methods: {
          bankTransfer: Array.isArray(invoice.payment_methods)
            ? invoice.payment_methods.includes("bankTransfer")
            : true,
          amex: Array.isArray(invoice.payment_methods)
            ? invoice.payment_methods.includes("amex")
            : false,
          googlePay: Array.isArray(invoice.payment_methods)
            ? invoice.payment_methods.includes("googlePay")
            : false,
          usdPortal: Array.isArray(invoice.payment_methods)
            ? invoice.payment_methods.includes("usdPortal")
            : false,
        },
        staff: invoice.staff || "KAVIYA",
        remarks: invoice.remarks || "Payable in INR(Rate 87.52)",
      },
      totals: {
        subTotal: invoice.sub_total || 0,
        handlingFee: invoice.handling_fee || 0,
        gst: invoice.gst_amount || 0,
        additionalTax: invoice.additional_tax || 0,
        bankCharges: invoice.bank_charges || 0,
        total: invoice.total_amount || 0,
        amountReceived: invoice.amount_received || 0,
        balance: invoice.balance || 0,
      },
      attachments: invoice.attachments || [],
    };
  };

  const currencySymbols = {
    INR: "₹",
    USD: "$",
    SGD: "S$",
    MYR: "RM",
    LKR: "Rs",
  };

  const countryOptions = [
    { code: "IN", name: "India", prefix: "IN" },
    { code: "LK", name: "Sri Lanka", prefix: "IS" },
    { code: "SG", name: "Singapore", prefix: "SG" },
    { code: "VN", name: "Vietnam", prefix: "VN" },
    { code: "MY", name: "Malaysia", prefix: "MY" },
    { code: "MV", name: "Maldives", prefix: "MV" },
    { code: "ID", name: "Bali", prefix: "ID" },
    { code: "KH", name: "Cambodia", prefix: "CM" },
    { code: "OB", name: "Other Countries", prefix: "OB" },
  ];

  const handleDeleteInvoiceAdmin = async () => {
    try {
      setIsLoading(true);
      await axios.delete(`/api/invoices/${invoiceToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(
        `Invoice ${invoiceToDelete.invoice_number} cancelled successfully.`
      );
      fetchInvoices(0);
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
      setCancelRemark("");
      setCancelAttachment(null);
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

// Add state for loading
const [isUpdating, setIsUpdating] = useState(false);

const handleUpdateInvoice = async (formData) => {
  try {
    setIsUpdating(true); // Start loading
    
    // Parse items from form data
    const items = [];
    for (let key in formData) {
      if (key.startsWith("items[")) {
        const matches = key.match(/items\[(\d+)\]\[(\w+)\]/);
        if (matches) {
          const index = matches[1];
          const field = matches[2];
          if (!items[index]) {
            items[index] = { 
              id: currentInvoice.items?.[index]?.id || null 
            };
          }
          items[index][field] =
            field === "quantity" || field === "price" || field === "discount"
              ? parseFloat(formData[key])
              : formData[key];
        }
      }
    }

    // Parse additional charges from form data
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
            };
          }
          if (field === "taxable") {
            additionalCharges[index][field] = formData[key] === "1";
          } else if (field === "amount") {
            additionalCharges[index][field] = parseFloat(formData[key]);
          } else {
            additionalCharges[index][field] = formData[key];
          }
        }
      }
    }

    // Parse payment methods
    const paymentMethods = formData.payment_methods
      ? formData.payment_methods.split(",").map(method => method.trim()).filter(method => method)
      : currentInvoice.payment_methods;

    // Prepare the update data as JSON object
    const updatedData = {
      customer_id: currentInvoice.customer?.id,
      country_code: formData.country_code || currentInvoice.country_code,
      currency: formData.currency,
      exchange_rate: parseFloat(formData.exchange_rate) || 1.0,
      tax_treatment: formData.tax_treatment || "inclusive",
      payment_type: formData.payment_type,
      collection_date: formData.collection_date || null,
      payment_instructions: formData.payment_instructions,
      staff: formData.staff || currentInvoice.staff,
      remarks: formData.remarks || currentInvoice.remarks,
      payment_methods: paymentMethods,
      items: items.filter(item => item && item.code && item.description),
      additional_charges: additionalCharges.filter(charge => charge && charge.description),
      amount_received: parseFloat(formData.amount_received) || 0,
      account_id: currentInvoice.account_id,
      company_id: currentInvoice.company_id,
      issue_date: formData.issue_date || currentInvoice.issue_date?.split('T')[0],
      due_date: formData.due_date || currentInvoice.due_date?.split('T')[0],
      booking_no: formData.booking_no || currentInvoice.booking_no,
      customer_po_number: formData.customer_po_number || currentInvoice.customer_po_number,
      sales_id: formData.sales_id || currentInvoice.sales_id,
      start_date: formData.start_date || currentInvoice.start_date?.split('T')[0],
      end_date: formData.end_date || currentInvoice.end_date?.split('T')[0],
      travel_period: formData.travel_period || currentInvoice.travel_period,
      status: formData.status || currentInvoice.status,
      sub_total: parseFloat(formData.sub_total) || currentInvoice.sub_total,
      handling_fee: parseFloat(formData.handling_fee) || currentInvoice.handling_fee,
      gst_amount: parseFloat(formData.gst_amount) || currentInvoice.gst_amount,
      additional_tax: parseFloat(formData.additional_tax) || currentInvoice.additional_tax,
      bank_charges: parseFloat(formData.bank_charges) || currentInvoice.bank_charges,
      total_amount: parseFloat(formData.total_amount) || currentInvoice.total_amount,
      balance: parseFloat(formData.balance) || currentInvoice.balance,
    };

    const response = await axios.put(
      `/api/invoices/by-number/${currentInvoice.invoice_number}`,
      updatedData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );

    if (response.data) {
      fetchInvoices(0);
      setShowEditModal(false);
      // alert('Invoice updated successfully!');
        Swal.fire({
        title: "Success!",
        text: "Invoice updated successfully.",
        icon: "success",
        confirmButtonText: "OK",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  } catch (error) {
    console.error("Error updating invoice:", error);
    let errorMessage = "";

    if (error.response?.data?.errors) {
      errorMessage = Object.values(error.response.data.errors).flat().join("\n");
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else {
      errorMessage = error.message;
    }

    Swal.fire({
      title: "Error!",
      text: errorMessage,
      icon: "error",
      confirmButtonText: "Close",
    });
  } finally {
    setIsUpdating(false); // Stop loading regardless of success/error
  }
};

// Update the modal close function to reset loading state
const handleCloseModal = () => {
  setShowEditModal(false);
  setIsUpdating(false); // Reset loading state when modal closes
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
            <FaInfoCircle className="me-1" /> {status || "Unknown"}
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

  // const handleShowExchangedInvoice = (invoice) => {
  //   console.log("Viewing exchanged invoice:", invoice);

  //   //  setCurrentInvoice(invoice);
  //   if (companyNo === 2) {
  //     setShowPreviewModalAppleholidays(true);
  //   } else if (companyNo === 3) {
  //     setShowPreviewModalAahaas(true);
  //   } else if (companyNo === 1) {
  //     setShowPreviewModalShirmila(true);
  //   } else {
  //     setShowPreviewModalAahaas(true);
  //   }
  // }
  const [showExchangedOpen, setShowExchangedOpen] = useState(false);
  const handleShowExchangedInvoice = (history) => {
    setShowExchangedOpen(true);
    const exchangedInvoice = {
      ...currentInvoice,
      sub_total: history.sub_total,
      handling_fee: history.handling_fee,
      gst_amount: history.gst_amount,
      additional_tax: history.additional_tax,
      bank_charges: history.bank_charges,
      total_amount: history.total_amount,
      amount_received: history.amount_received,
      balance: history.balance,
      exchange_rate: history.exchange_rate,
      is_exchanged: true,
      exchange_rate_date: history.rate_date,
    };

    setCurrentInvoiceExchange(exchangedInvoice);
    setShowExchangedVersion(true);
    setShowPreviewModalAppleholidays(true);
  };

  // const handleShowExchangedInvoice = (invoice) => {
  //   console.log("Viewing current invoice:", currentInvoice);

  //   console.log("Viewing exchanged invoice:", invoice.exchange_rate_histories);

  //   // Check if there are exchange rate histories
  //   if (
  //     currentInvoice.exchange_rate_histories &&
  //     currentInvoice.exchange_rate_histories.length > 0
  //   ) {
  //     // Get the latest exchange rate history
  //     const latestExchangeRate =
  //       currentInvoice.exchange_rate_histories[
  //         currentInvoice.exchange_rate_histories.length - 1
  //       ];

  //     const exchangedInvoice = {
  //       ...currentInvoice,
  //       sub_total: invoice.sub_total,
  //       handling_fee: invoice.handling_fee,
  //       gst_amount: invoice.gst_amount,
  //       additional_tax: invoice.additional_tax,
  //       bank_charges: invoice.bank_charges,
  //       total_amount: invoice.total_amount,
  //       amount_received: invoice.amount_received,
  //       balance: invoice.balance,
  //       exchange_rate: invoice.exchange_rate,
  //       // Add a flag to indicate this is an exchanged version
  //       is_exchanged: true,
  //       exchange_rate_date: invoice.rate_date,
  //     };
  //     console.log("this is the exchanged rate", exchangedInvoice);

  //     // Set the modified invoice as current
  //     setCurrentInvoiceExchange(exchangedInvoice);
  //   } else {
  //     // If no exchange rate history, use the original invoice
  //     setCurrentInvoiceExchange(invoice);
  //   }

  //   // Show the appropriate modal based on company
  //   if (companyNo === 2) {
  //     setShowPreviewModalAppleholidays(true);
  //   } else if (companyNo === 3) {
  //     setShowPreviewModalAahaas(true);
  //   } else if (companyNo === 1) {
  //     setShowPreviewModalShirmila(true);
  //   } else {
  //     setShowPreviewModalAahaas(true);
  //   }
  // };
  // const ActionButton = ({
  //   icon,
  //   label,
  //   variant = "primary",
  //   onClick,
  //   disabled = false,
  // }) => (
  //   <OverlayTrigger placement="top" overlay={<Tooltip>{label}</Tooltip>}>
  //     <Button
  //       variant={variant}
  //       size="sm"
  //       className="me-2"
  //       onClick={onClick}
  //       disabled={disabled}
  //     >
  //       {icon} <span className="d-none d-md-inline">{label}</span>
  //     </Button>
  //   </OverlayTrigger>
  // );

  return (
    <div className="container py-4">
      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
          <h5 className="mb-0">
            <FaFileInvoiceDollar className="me-2" />
            Invoice Management
          </h5>
          {companyNo !== 3 && (
            <Button
              variant="light"
              onClick={() => navigate("/invoice/create")}
              className="d-flex align-items-center"
            >
              <FaPlus className="me-1" /> New Invoice
            </Button>
          )}
        </Card.Header>

        <Card.Body>
          {/* <div className="d-flex mb-4 flex-wrap align-items-center gap-3">
            <div className="input-group" style={{ width: "300px" }}>
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
            <div className="d-flex align-items-center gap-2">
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
                style={{ width: "150px" }}
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
            <div className="d-flex align-items-center gap-2">
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
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Filter invoices by days from today</Tooltip>}
            >
              <div
                className="d-flex align-items-center gap-2"
                style={{ maxWidth: "280px" }}
              >
                <FloatingLabel label="" className="flex-grow-1">
                  <Form.Control
                    type="number"
                    placeholder="Days"
                    value={searchDaysCount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^[0-9]*$/.test(value)) {
                        setSearchDaysCount(value);
                      }
                    }}
                    min="0"
                    className="flex-grow-1"
                  />
                </FloatingLabel>
                <Button
                  variant="primary"
                  onClick={() => fetchInvoicesByDays(searchDaysCount || 0)}
                  disabled={
                    loading ||
                    (searchDaysCount !== "" &&
                      !/^[0-9]+$/.test(searchDaysCount))
                  }
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <FaSearch className="me-1" />
                      Search
                    </>
                  )}
                </Button>
                {searchDaysCount !== "" && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={resetDaysFilter}
                  >
                    <FaSync className="me-1" /> Reset
                  </Button>
                )}
              </div>
            </OverlayTrigger>
            <Button
              variant="outline-secondary"
              onClick={() => fetchInvoices(searchDaysCount || 0)}
              className="d-flex align-items-center"
              disabled={loading}
            >
              <FaSync className="me-1" /> Refresh
            </Button>
            {dateFilter.startDate || dateFilter.endDate ? (
              <Button
                variant="outline-secondary"
                onClick={() => setDateFilter({ startDate: "", endDate: "" })}
                size="sm"
              >
                Clear Dates
              </Button>
            ) : null}
          </div> */}
          <div className="d-flex mb-4 flex-wrap align-items-center gap-3">
            <div className="input-group" style={{ width: "300px" }}>
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
            <div className="d-flex align-items-center gap-2">
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
                style={{ width: "150px" }}
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
            <div className="d-flex align-items-center gap-2">
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
            {/* Adjusted Days Filter */}
            {/* <OverlayTrigger
              placement="top"
              overlay={<Tooltip>Filter invoices by days from today</Tooltip>}
            >
              <div
                className="d-flex align-items-center gap-2"
                style={{ maxWidth: "280px" }}
              >
                <FloatingLabel label="" className="flex-grow-1">
                  <Form.Control
                    type="number"
                    placeholder="Days"
                    value={searchDaysCount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^[0-9]*$/.test(value)) {
                        setSearchDaysCount(value);
                      }
                    }}
                    min="0"
                    className="flex-grow-1"
                  />
                </FloatingLabel>
                <Button
                  variant="primary"
                  onClick={() => fetchInvoicesByDays(searchDaysCount || 0)}
                  disabled={
                    loading ||
                    (searchDaysCount !== "" &&
                      !/^[0-9]+$/.test(searchDaysCount))
                  }
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <FaSearch className="me-1" />
                      Search
                    </>
                  )}
                </Button>
                {searchDaysCount !== "" && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={resetDaysFilter}
                  >
                    <FaSync className="me-1" /> Reset
                  </Button>
                )}
              </div>
            </OverlayTrigger> */}
            <div className="d-flex align-items-center gap-2">
              {/* <Form.Select
                value={fetchType}
                onChange={(e) => {
                  // setFetchType(e.target.value);
                  fetchInvoices(searchDaysCount || 0);
                }}
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </Form.Select> */}
            </div>
            <Button
              variant="outline-secondary"
              onClick={() => fetchInvoices(searchDaysCount || 0)}
              className="d-flex align-items-center"
              disabled={loading}
            >
              <FaSync className="me-1" /> Refresh
            </Button>
            {dateFilter.startDate || dateFilter.endDate ? (
              <Button
                variant="outline-secondary"
                onClick={() => setDateFilter({ startDate: "", endDate: "" })}
                size="sm"
              >
                Clear Dates
              </Button>
            ) : null}
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading invoices...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Invoice No.</th>
                    <th>Tour Ref No.</th>
                    <th>Customer</th>
                    <th>Issue Date</th>
                    <th>Travel Period</th>
                    <th>Credit/Non-Credit</th>
                    <th>Balance</th>
                    <th>Total</th>
                    <th>Type</th>
                    <th>Status</th>
                    {/* <th>Payments</th> */}
                    {companyNo != 3 && <th>Exchange-Rates</th>}
                    {/* <th>Costs</th> */}
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoices.length > 0 ? (
                    currentInvoices.map((invoice) => (
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
                              <div>
                                {companyNo === 3
                                  ? invoice.customer?.customer || "N/A"
                                  : invoice.customer?.name || "N/A"}
                              </div>
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
                            {/* Due: {formatDate(invoice.due_date)} */}
                          </small>
                        </td>
                        <td>
                          {formatDate(invoice.start_date)} -{" "}
                          {formatDate(invoice.end_date)}
                        </td>
                        <td>{invoice?.payment_type}</td>
                        <td>
                          {currencySymbols[invoice.currency] ||
                            invoice.currency}{" "}
                          {invoice?.balance}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {currencySymbols[invoice.currency] ||
                              invoice.currency}{" "}
                            {invoice.total_amount}
                          </div>
                        </td>
                        <td>{invoice?.type}</td>
                        <td>
                          {getStatusBadge(
                            invoice.status === "draft" ? "open" : invoice.status
                          )}
                        </td>
                        {/* <td>
                          <ActionButton
                            icon={<FaMoneyBillWave />}
                            label="View Payments"
                            variant="info"
                            disabled = {invoice.status === "cancelled"}
                            onClick={() => handleViewPayments(invoice)}
                          />
                        </td> */}
                        {companyNo != 3 && (
                          <td>
                            <ActionButton
                              icon={<FaMoneyBillWave />}
                              label="View Exchange Rates"
                              variant="warning"
                              disabled={invoice.status === "cancelled"}
                              onClick={() => handleExchangeRates(invoice)}
                            />
                          </td>
                        )}
                        {/* <td>
                          <ActionButton
                            icon={<FaMoneyBillWave />}
                            label="View Costs"
                            variant="success"
                            onClick={() => handleViewCosts(invoice)}
                            disabled={
                              !invoice.cost_of_invoices ||
                              invoice.cost_of_invoices.length === 0
                            }
                            tooltip="View Cost Details"
                          />
                        </td> */}
                        <td className="text-start">
                          <div className="d-flex justify-content-start">
                            {/* <ActionButton
                              icon={<FaFileInvoiceDollar />}
                              variant="warning"
                              // onClick={() => handleUpdateExchangeRate(invoice)}
                              onClick={() =>
                                handleUpdateExchangeRate(invoice)
                              }
                              disabled={exchangeRateLoading}
                              
                            /> */}
                            {/* <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip id={`tooltip-${invoice.id}`}>
                                  Update this invoice's exchange rate
                                </Tooltip>
                              }
                            >
                              <span>
                                <ActionButton
                                  icon={
                                    loadingInvoiceId === invoice.id ? (
                                      <Spinner
                                        animation="border"
                                        size="sm"
                                        className="me-2"
                                      />
                                    ) : (
                                      <FaFileInvoiceDollar className="me-2" />
                                    )
                                  }
                                  variant={
                                    loadingInvoiceId === invoice.id
                                      ? "secondary"
                                      : "warning"
                                  }
                                  
                                  onClick={() =>
                                    handleUpdateExchangeRate(invoice)
                                  }
                                  disabled={loadingInvoiceId === invoice.id || invoice.status === "cancelled"}
                                >
                                  {loadingInvoiceId === invoice.id
                                    ? "Updating..."
                                    : "Update Exchange Rate"}
                                </ActionButton>
                              </span>
                            </OverlayTrigger> */}

                            {/* <Button
                              variant="primary"
                              onClick={() =>
                                handleUpdateExchangeRate(currentInvoice)
                              }
                              disabled={exchangeRateLoading}
                            >
                              {exchangeRateLoading ? (
                                <>
                                  <Spinner
                                    animation="border"
                                    size="sm"
                                    className="me-2"
                                  />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <FaSync className="me-2" />
                                  Update Exchange Rate
                                </>
                              )}
                            </Button> */}
                            <ActionButton
                              icon={<FaEye />}
                              label=""
                              variant="info"
                              tooltip="View Invoice"
                              disabled={invoice.status === "cancelled"}
                              onClick={() => handleViewInvoice(invoice)}
                            />
                            <ActionButton
                              icon={<FaEdit />}
                              label=""
                              variant="primary"
                              tooltip="Edit Invoice"
                              disabled={invoice.status === "cancelled"}
                              onClick={() => handleEditInvoice(invoice)}
                            />
                            {/* <ActionButton
                              icon={<FaPrint />}
                              variant="secondary"
                              onClick={() => handlePrintInvoice(invoice.id)}
                            /> */}
                            <ActionButton
                              icon={<FaTrash />}
                              label=""
                              variant="danger"
                              tooltip="Cancel Invoice"
                              onClick={() => handleCancelInvoice(invoice)}
                              disabled={invoice.status === "cancelled"}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="11" className="text-center py-4">
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
          {/* Pagination */}
          {filteredInvoices.length > itemsPerPage && (
            <Pagination className="justify-content-center mt-3">
              {/* First Page Button */}
              <Pagination.First
                onClick={goToFirstPage}
                disabled={currentPage === 1}
              >
                <FaStepBackward />
              </Pagination.First>

              {/* Previous Button */}
              <Pagination.Prev
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              />

              {/* Page Numbers */}
              {pageNumbers.map((number) => {
                // Show first 2 pages, last 2 pages, and pages around current page
                if (
                  number === 1 ||
                  number === 2 ||
                  number === pageNumbers.length - 1 ||
                  number === pageNumbers.length ||
                  (number >= currentPage - 1 && number <= currentPage + 1)
                ) {
                  return (
                    <Pagination.Item
                      key={number}
                      active={number === currentPage}
                      onClick={() => paginate(number)}
                    >
                      {number}
                    </Pagination.Item>
                  );
                } else if (
                  number === currentPage - 2 ||
                  number === currentPage + 2
                ) {
                  return <Pagination.Ellipsis key={number} />;
                }
                return null;
              })}

              {/* Next Button */}
              <Pagination.Next
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === pageNumbers.length}
              />

              {/* Last Page Button */}
              <Pagination.Last
                onClick={goToLastPage}
                disabled={currentPage === pageNumbers.length}
              >
                <FaStepForward />
              </Pagination.Last>
            </Pagination>
          )}
        </Card.Body>

        {filteredInvoices.length > 0 && (
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <div>
              Showing{" "}
              <strong>
                {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, filteredInvoices.length)}
              </strong>{" "}
              of <strong>{filteredInvoices.length}</strong> invoices
            </div>
            <div className="d-flex">
              {/* Enhanced Export Dropdown */}
              <Dropdown className="me-2">
                <Dropdown.Toggle
                  variant="outline-primary"
                  size="sm"
                  id="export-dropdown"
                  style={{ color: "black", borderColor: "black" }}
                >
                  <FaDownload className="me-1" /> Export
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => handleExport("csv")}>
                    <FaFileCsv className="me-2" /> Export as CSV
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleExport("excel")}>
                    <FaFileExcel className="me-2" /> Export as Excel
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => handleExport("pdf")}>
                    <FaFilePdf className="me-2" /> Export as PDF
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              {/* <Button variant="outline-secondary" size="sm">
                <FaPrint className="me-1" /> Print List
              </Button> */}
            </div>
          </Card.Footer>
        )}
      </Card>

      <Invoice_aahaas_modal
        show={showPreviewModalAahaas}
        onHide={() => setShowPreviewModalAahaas(false)}
        formData={formatInvoiceData(currentInvoice)}
        countryOptions={countryOptions}
        currencySymbols={currencySymbols}
        printInvoice={handlePrintInvoiceAahaas}
        formatDate={formatDate}
        xeRate={xeRate}
      />

      {/* <Invoice_appleholidays_modal
        show={showPreviewModalAppleholidays}
        onHide={() => setShowPreviewModalAppleholidays(false)}
        formData={formatInvoiceData(currentInvoice)}
        countryOptions={countryOptions}
        currencySymbols={currencySymbols}
        printInvoice={handlePrintInvoiceAppleHolidays}
        formatDate={formatDate}
        xeRate={xeRate}
      />

      <Invoice_appleholidays_modal
        show={showPreviewModalAppleholidays}
        onHide={() => setShowPreviewModalAppleholidays(false)}
        formData={formatInvoiceData(currentInvoiceExchange)}
        countryOptions={countryOptions}
        currencySymbols={currencySymbols}
        printInvoice={handlePrintInvoiceAppleHolidays}
        formatDate={formatDate}
        xeRate={xeRate}
      /> */}

      <Invoice_appleholidays_modal
        show={showPreviewModalAppleholidays}
        onHide={() => {
          setShowPreviewModalAppleholidays(false);
          setShowExchangedVersion(false); // Reset when modal closes
        }}
        formData={formatInvoiceData(
          showExchangedVersion ? currentInvoiceExchange : currentInvoice
        )}
        countryOptions={countryOptions}
        currencySymbols={currencySymbols}
        printInvoice={handlePrintInvoiceAppleHolidays}
        formatDate={formatDate}
        xeRate={xeRate}
        showExchangedOpen={showExchangedOpen}
      />

      <Invoice_sharmila_modal
        show={showPreviewModalShirmila}
        onHide={() => setShowPreviewModalShirmila(false)}
        formData={formatInvoiceData(currentInvoice)}
        countryOptions={countryOptions}
        currencySymbols={currencySymbols}
        printInvoice={handlePrintInvoiceSharmila}
        formatDate={formatDate}
        xeRate={xeRate}
        showExchangedOpen={showExchangedOpen}
      />

      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="xl"
        className="invoice-edit-modal"
      >
        <Modal.Header closeButton className="bg-primary text-white py-3">
          <Modal.Title className="d-flex align-items-center fs-6">
            <FaEdit className="me-2" />
            Edit Invoice - {currentInvoice?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          className="p-3"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          {currentInvoice && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const formValues = Object.fromEntries(formData.entries());
                handleUpdateInvoice(formValues);
              }}
              className="compact-form"
            >
              {/* Hidden required fields */}
              <input
                type="hidden"
                name="customer_id"
                value={currentInvoice.customer?.id}
              />
              <input
                type="hidden"
                name="company_id"
                value={currentInvoice.company_id}
              />
              <input
                type="hidden"
                name="account_id"
                value={currentInvoice.account_id}
              />

              <Accordion
                defaultActiveKey={["customer", "invoice", "items"]}
                alwaysOpen
              >
                {/* Customer Information */}
                <Accordion.Item eventKey="customer" className="mb-2">
                  <Accordion.Header className="py-2">
                    <div className="d-flex align-items-center">
                      <FaUser className="me-2 fs-6" />
                      <span className="fw-semibold">Customer Information</span>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="p-3">
                    <Row className="g-2">
                      <Col md={6}>
                        <FloatingLabel
                          controlId="customerName"
                          label="Customer Name"
                          className="mb-2"
                        >
                          <Form.Control
                            type="text"
                            name="customer_name"
                            size="sm"
                            defaultValue={currentInvoice.customer?.name}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel
                          controlId="customerMobile"
                          label="Mobile Number"
                          className="mb-2"
                        >
                          <Form.Control
                            type="text"
                            name="customer_mobile"
                            size="sm"
                            defaultValue={currentInvoice.customer?.mobile}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={4}>
                        <FloatingLabel
                          controlId="customerCode"
                          label="Customer Code"
                          className="mb-2"
                        >
                          <Form.Control
                            type="text"
                            name="customer_code"
                            size="sm"
                            defaultValue={currentInvoice.customer?.code}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={4}>
                        <FloatingLabel
                          controlId="customerGst"
                          label="GST Number"
                          className="mb-2"
                        >
                          <Form.Control
                            type="text"
                            name="customer_gst_no"
                            size="sm"
                            defaultValue={currentInvoice.customer?.gst_no}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={4}>
                        <FloatingLabel
                          controlId="countryCode"
                          label="Country Code"
                          className="mb-2"
                        >
                          <Form.Select
                            name="country_code"
                            size="sm"
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
                      <Col md={4}>
                        <FloatingLabel
                          controlId="currency"
                          label="Currency"
                          className="mb-2"
                        >
                          <Form.Select
                            name="currency"
                            size="sm"
                            defaultValue={currentInvoice.currency}
                            required
                          >
                            <option value="LKR">LKR</option>
                            <option value="INR">INR</option>
                            <option value="SGD">SGD</option>
                            <option value="MYR">MYR</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </Form.Select>
                        </FloatingLabel>
                      </Col>
                      <Col md={8}>
                        <FloatingLabel
                          controlId="customerAddress"
                          label="Customer Address"
                          className="mb-2"
                        >
                          <Form.Control
                            as="textarea"
                            name="customer_address"
                            size="sm"
                            style={{ height: "60px" }}
                            defaultValue={currentInvoice.customer?.address}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Invoice Details */}
                <Accordion.Item eventKey="invoice" className="mb-2">
                  <Accordion.Header className="py-2">
                    <div className="d-flex align-items-center">
                      <FaFileInvoiceDollar className="me-2 fs-6" />
                      <span className="fw-semibold">Invoice Details</span>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="p-3">
                    <Row className="g-2">
                      <Col md={3}>
                        <FloatingLabel
                          controlId="issueDate"
                          label="Issue Date"
                          className="mb-2"
                        >
                          <Form.Control
                            type="date"
                            name="issue_date"
                            size="sm"
                            defaultValue={
                              currentInvoice.issue_date?.split("T")[0]
                            }
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={3}>
                        <FloatingLabel
                          controlId="dueDate"
                          label="Due Date"
                          className="mb-2"
                        >
                          <Form.Control
                            type="date"
                            name="due_date"
                            size="sm"
                            defaultValue={
                              currentInvoice.due_date?.split("T")[0]
                            }
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={3}>
                        <FloatingLabel
                          controlId="collectionDate"
                          label="Collection Date"
                          className="mb-2"
                        >
                          <Form.Control
                            type="date"
                            name="collection_date"
                            size="sm"
                            defaultValue={
                              currentInvoice.collection_date?.split("T")[0]
                            }
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={3}>
                        <FloatingLabel
                          controlId="exchangeRate"
                          label="Exchange Rate"
                          className="mb-2"
                        >
                          <Form.Control
                            type="number"
                            name="exchange_rate"
                            size="sm"
                            step="0.0001"
                            defaultValue={currentInvoice.exchange_rate || 1.0}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={3}>
                        <FloatingLabel
                          controlId="taxTreatment"
                          label="Tax Treatment"
                          className="mb-2"
                        >
                          <Form.Select
                            name="tax_treatment"
                            size="sm"
                            defaultValue={currentInvoice.tax_treatment}
                            required
                          >
                            <option value="inclusive">Tax Inclusive</option>
                            <option value="exclusive">Tax Exclusive</option>
                            <option value="none">No Tax</option>
                          </Form.Select>
                        </FloatingLabel>
                      </Col>
                      <Col md={3}>
                        <FloatingLabel
                          controlId="paymentType"
                          label="Payment Type"
                          className="mb-2"
                        >
                          <Form.Select
                            name="payment_type"
                            size="sm"
                            defaultValue={currentInvoice.payment_type}
                            required
                          >
                            <option value="credit">Credit</option>
                            <option value="non-credit">Non-Credit</option>
                          </Form.Select>
                        </FloatingLabel>
                      </Col>
                      <Col md={3}>
                        <FloatingLabel
                          controlId="staff"
                          label="Staff"
                          className="mb-2"
                        >
                          <Form.Control
                            type="text"
                            name="staff"
                            size="sm"
                            defaultValue={currentInvoice.staff}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={3}>
                        <FloatingLabel
                          controlId="amountReceived"
                          label="Amount Received"
                          className="mb-2"
                        >
                          <Form.Control
                            type="number"
                            name="amount_received"
                            size="sm"
                            step="0.01"
                            defaultValue={currentInvoice.amount_received}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel
                          controlId="paymentMethods"
                          label="Payment Methods"
                          className="mb-2"
                        >
                          <Form.Control
                            type="text"
                            name="payment_methods"
                            size="sm"
                            placeholder="Cash, Card, Bank Transfer..."
                            defaultValue={
                              Array.isArray(currentInvoice?.payment_methods)
                                ? currentInvoice.payment_methods.join(", ")
                                : currentInvoice.payment_methods
                            }
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel
                          controlId="bookingNo"
                          label="Booking No"
                          className="mb-2"
                        >
                          <Form.Control
                            type="text"
                            name="booking_no"
                            size="sm"
                            defaultValue={currentInvoice.booking_no}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel
                          controlId="customerPo"
                          label="Customer PO Number"
                          className="mb-2"
                        >
                          <Form.Control
                            type="text"
                            name="customer_po_number"
                            size="sm"
                            defaultValue={currentInvoice.customer_po_number}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel
                          controlId="salesId"
                          label="Sales ID"
                          className="mb-2"
                        >
                          <Form.Control
                            type="text"
                            name="sales_id"
                            size="sm"
                            defaultValue={currentInvoice.sales_id}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={12}>
                        <FloatingLabel
                          controlId="paymentInstructions"
                          label="Payment Instructions"
                          className="mb-2"
                        >
                          <Form.Control
                            as="textarea"
                            name="payment_instructions"
                            size="sm"
                            style={{ height: "60px" }}
                            defaultValue={currentInvoice.payment_instructions}
                            required
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={12}>
                        <FloatingLabel
                          controlId="remarks"
                          label="Remarks"
                          className="mb-2"
                        >
                          <Form.Control
                            as="textarea"
                            name="remarks"
                            size="sm"
                            style={{ height: "60px" }}
                            defaultValue={currentInvoice.remarks}
                          />
                        </FloatingLabel>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Travel Details */}
                <Accordion.Item eventKey="travel" className="mb-2">
                  <Accordion.Header className="py-2">
                    <div className="d-flex align-items-center">
                      <FaCalendarAlt className="me-2 fs-6" />
                      <span className="fw-semibold">Travel Details</span>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="p-3">
                    <Row className="g-2">
                      <Col md={4}>
                        <FloatingLabel
                          controlId="startDate"
                          label="Start Date"
                          className="mb-2"
                        >
                          <Form.Control
                            type="date"
                            name="start_date"
                            size="sm"
                            defaultValue={
                              currentInvoice.start_date?.split("T")[0]
                            }
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={4}>
                        <FloatingLabel
                          controlId="endDate"
                          label="End Date"
                          className="mb-2"
                        >
                          <Form.Control
                            type="date"
                            name="end_date"
                            size="sm"
                            defaultValue={
                              currentInvoice.end_date?.split("T")[0]
                            }
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={4}>
                        <FloatingLabel
                          controlId="travelPeriod"
                          label="Travel Period"
                          className="mb-2"
                        >
                          <Form.Control
                            type="text"
                            name="travel_period"
                            size="sm"
                            defaultValue={currentInvoice.travel_period}
                          />
                        </FloatingLabel>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Invoice Items */}
                <Accordion.Item eventKey="items" className="mb-2">
                  <Accordion.Header className="py-2">
                    <div className="d-flex align-items-center">
                      <FaReceipt className="me-2 fs-6" />
                      <span className="fw-semibold">Invoice Items</span>
                      <Badge bg="primary" className="ms-2 fs-3">
                        {currentInvoice.items?.length || 0}
                      </Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="p-3">
                    <div
                      className="table-responsive"
                      style={{ maxHeight: "300px", overflowY: "auto" }}
                    >
                      <table className="table table-sm table-hover">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th width="12%">Code</th>
                            <th width="12%">Type</th>
                            <th width="25%">Description</th>
                            <th width="10%">Price</th>
                            <th width="10%">Discount %</th>
                            <th width="8%">Qty</th>
                            <th width="13%">Total</th>
                            <th width="10%">Actions</th>
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
                                <Form.Select
                                  name={`items[${index}][type]`}
                                  size="sm"
                                  defaultValue={item.type}
                                  required
                                >
                                  <option value="hotel">Hotel</option>
                                  <option value="restaurant">Restaurant</option>
                                  <option value="transport">Transport</option>
                                  <option value="tour">Tour</option>
                                  <option value="other">Other</option>
                                </Form.Select>
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
                              <td className="text-end fw-semibold">
                                {currencySymbols[currentInvoice.currency] ||
                                  currentInvoice.currency}{" "}
                                {calculateItemTotal(item).toFixed(2)}
                              </td>
                              <td className="text-center">
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  className="px-2"
                                >
                                  <FaTrash className="fs-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="d-flex justify-content-end mt-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="px-3"
                      >
                        <FaPlus className="me-1 fs-3" /> Add Item
                      </Button>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Additional Charges */}
                <Accordion.Item eventKey="charges" className="mb-2">
                  <Accordion.Header className="py-2">
                    <div className="d-flex align-items-center">
                      <FaMoneyBillWave className="me-2 fs-6" />
                      <span className="fw-semibold">Additional Charges</span>
                      <Badge bg="primary" className="ms-2 fs-3">
                        {currentInvoice.additional_charges?.length || 0}
                      </Badge>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="p-3">
                    <div
                      className="table-responsive"
                      style={{ maxHeight: "200px", overflowY: "auto" }}
                    >
                      <table className="table table-sm table-hover">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th width="45%">Description</th>
                            <th width="20%">Amount</th>
                            <th width="20%">Taxable</th>
                            <th width="15%">Actions</th>
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
                                <td className="text-center">
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="px-2"
                                  >
                                    <FaTrash className="fs-3" />
                                  </Button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="d-flex justify-content-end mt-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="px-3"
                      >
                        <FaPlus className="me-1 fs-3" /> Add Charge
                      </Button>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>

                {/* Financial Summary */}
                <Accordion.Item eventKey="financial" className="mb-2">
                  <Accordion.Header className="py-2">
                    <div className="d-flex align-items-center">
                      <FaCalculator className="me-2 fs-6" />
                      <span className="fw-semibold">Financial Summary</span>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body className="p-3">
                    <Row className="g-2">
                      <Col md={3}>
                        <FloatingLabel
                          controlId="subTotal"
                          label="Sub Total"
                          className="mb-2"
                        >
                          <Form.Control
                            type="number"
                            name="sub_total"
                            size="sm"
                            step="0.01"
                            defaultValue={currentInvoice.sub_total}
                            readOnly
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={3}>
                        <FloatingLabel
                          controlId="handlingFee"
                          label="Handling Fee"
                          className="mb-2"
                        >
                          <Form.Control
                            type="number"
                            name="handling_fee"
                            size="sm"
                            step="0.01"
                            defaultValue={currentInvoice.handling_fee}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={3}>
                        <FloatingLabel
                          controlId="gstAmount"
                          label="GST Amount"
                          className="mb-2"
                        >
                          <Form.Control
                            type="number"
                            name="gst_amount"
                            size="sm"
                            step="0.01"
                            defaultValue={currentInvoice.gst_amount}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={3}>
                        <FloatingLabel
                          controlId="additionalTax"
                          label="Additional Tax"
                          className="mb-2"
                        >
                          <Form.Control
                            type="number"
                            name="additional_tax"
                            size="sm"
                            step="0.01"
                            defaultValue={currentInvoice.additional_tax}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={4}>
                        <FloatingLabel
                          controlId="bankCharges"
                          label="Bank Charges"
                          className="mb-2"
                        >
                          <Form.Control
                            type="number"
                            name="bank_charges"
                            size="sm"
                            step="0.01"
                            defaultValue={currentInvoice.bank_charges}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={4}>
                        <FloatingLabel
                          controlId="totalAmount"
                          label="Total Amount"
                          className="mb-2"
                        >
                          <Form.Control
                            type="number"
                            name="total_amount"
                            size="sm"
                            step="0.01"
                            defaultValue={currentInvoice.total_amount}
                          />
                        </FloatingLabel>
                      </Col>
                      <Col md={4}>
                        <FloatingLabel
                          controlId="balance"
                          label="Balance"
                          className="mb-2"
                        >
                          <Form.Control
                            type="number"
                            name="balance"
                            size="sm"
                            step="0.01"
                            defaultValue={currentInvoice.balance}
                            readOnly
                          />
                        </FloatingLabel>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>

              <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                  className="me-2 px-3"
                >
                  Cancel
                </Button>
              <Button
      variant="primary"
      size="sm"
      type="submit"
      className="px-4"
      disabled={isUpdating} // Disable button while loading
    >
      {isUpdating ? (
        <>
          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          Saving...
        </>
      ) : (
        <>
          <FaSave className="me-1" /> Save Changes
        </>
      )}
    </Button>
              </div>
            </form>
          )}
        </Modal.Body>
      </Modal>
      <Modal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaMoneyBillWave className="me-2" />
            Payment Details - {currentInvoice?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isEditingPayments ? (
            <div>
              <h5>Edit Payments</h5>
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Amount</th>
                      <th>Payment Date</th>
                      <th>Method</th>
                      <th>Note</th>
                      <th>Created At</th>
                      <th>Updated At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoicePayments.map((payment, index) => (
                      <tr key={index}>
                        <td>
                          <Form.Control
                            type="text"
                            value={payment.id || "New"}
                            disabled
                            size="sm"
                            style={{ minWidth: "80px" }} // ID field
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            value={payment.amount}
                            onChange={(e) =>
                              handlePaymentChange(
                                index,
                                "amount",
                                e.target.value
                              )
                            }
                            size="sm"
                            required
                            style={{ minWidth: "120px" }} // Amount field
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="date"
                            value={
                              payment.payment_date?.split("T")[0] ||
                              payment.payment_date
                            }
                            onChange={(e) =>
                              handlePaymentChange(
                                index,
                                "payment_date",
                                e.target.value
                              )
                            }
                            size="sm"
                            required
                            style={{ minWidth: "160px" }} // Date field
                          />
                        </td>
                        <td>
                          <Form.Select
                            value={payment.method || ""}
                            onChange={(e) =>
                              handlePaymentChange(
                                index,
                                "method",
                                e.target.value
                              )
                            }
                            size="sm"
                            style={{ minWidth: "150px" }} // Dropdown
                          >
                            <option value="">Select Method</option>
                            <option value="bankTransfer">Bank Transfer</option>
                            <option value="amex">Amex</option>
                            <option value="googlePay">Google Pay</option>
                            <option value="usdPortal">USD Portal</option>
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            value={payment.note || ""}
                            onChange={(e) =>
                              handlePaymentChange(index, "note", e.target.value)
                            }
                            size="sm"
                            style={{ minWidth: "200px" }} // Note field (wider for text)
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            value={formatDate(payment.created_at)}
                            disabled
                            size="sm"
                            style={{ minWidth: "140px" }} // Created At
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            value={formatDate(payment.updated_at)}
                            disabled
                            size="sm"
                            style={{ minWidth: "140px" }} // Updated At
                          />
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemovePayment(index)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="d-flex justify-content-between mt-3">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAddPayment}
                >
                  <FaPlus className="me-1" /> Add Payment
                </Button>
                <div>
                  <strong>
                    Total Received:{" "}
                    {currencySymbols[currentInvoice?.currency] ||
                      currentInvoice?.currency}{" "}
                    {selectedInvoicePayments
                      .reduce(
                        (sum, payment) =>
                          sum + (parseFloat(payment.amount) || 0),
                        0
                      )
                      .toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          ) : selectedInvoicePayments.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Amount</th>
                    <th>Payment Date</th>
                    <th>Method</th>
                    <th>Note</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoicePayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.id}</td>
                      <td>
                        {currencySymbols[currentInvoice?.currency] ||
                          currentInvoice?.currency}{" "}
                        {payment.amount}
                      </td>
                      <td>{formatDate(payment.payment_date)}</td>
                      <td>{payment.method || "N/A"}</td>
                      <td>{payment.note || "N/A"}</td>
                      <td>{formatDate(payment.created_at)}</td>
                      <td>{formatDate(payment.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="d-flex justify-content-end mt-3">
                <strong>
                  Total Received:{" "}
                  {currencySymbols[currentInvoice?.currency] ||
                    currentInvoice?.currency}{" "}
                  {selectedInvoicePayments
                    .reduce(
                      (sum, payment) => sum + (parseFloat(payment.amount) || 0),
                      0
                    )
                    .toFixed(2)}
                </strong>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <FaMoneyBillWave size={48} className="text-muted mb-3" />
              <h5>No payment details available</h5>
              <p className="text-muted">
                This invoice has no recorded payments.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPaymentModal(false)}
          >
            Close
          </Button>
          {isEditingPayments ? (
            <>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setIsEditingPayments(false);
                  setSelectedInvoicePayments(currentInvoice?.payments || []);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdatePayments}>
                {"Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline-primary"
              onClick={() => setIsEditingPayments(true)}
            >
              <FaEdit className="me-1" /> Edit Payments
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      <Modal
        show={showExchangeModal}
        onHide={() => {
          setShowExchangeModal(false);
          setExchangeRateError(null);
          setExchangeRateSuccess("");
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaExchangeAlt className="me-2" />
            Exchange Rate History - {currentInvoice?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Error Message */}
          {exchangeRateError && (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaInfoCircle className="me-2" />
              {exchangeRateError}
            </Alert>
          )}

          {/* Success Message */}
          {exchangeRateSuccess && (
            <Alert variant="success" className="d-flex align-items-center">
              <FaInfoCircle className="me-2" />
              {exchangeRateSuccess}
            </Alert>
          )}

          {currentInvoice?.exchange_rate_histories?.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Sub Total</th>
                    <th>Handling Fee</th>
                    <th>GST Amount</th>
                    <th>Additional Tax</th>
                    <th>Bank Charges</th>
                    <th>Total Amount</th>
                    <th>Amount Received</th>
                    <th>Balance</th>
                    <th>Exchange Rate</th>
                    <th>Rate Date</th>
                    <th>Created At</th>
                    <th>Print Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoice.exchange_rate_histories.map((history) => (
                    <tr key={history.id}>
                      <td>{history.id}</td>
                      <td>
                        {currencySymbols[currentInvoice?.currency] ||
                          currentInvoice?.currency}{" "}
                        {parseFloat(history.sub_total).toFixed(2)}
                      </td>
                      <td>
                        {currencySymbols[currentInvoice?.currency] ||
                          currentInvoice?.currency}{" "}
                        {parseFloat(history.handling_fee).toFixed(2)}
                      </td>
                      <td>
                        {currencySymbols[currentInvoice?.currency] ||
                          currentInvoice?.currency}{" "}
                        {parseFloat(history.gst_amount).toFixed(2)}
                      </td>
                      <td>
                        {currencySymbols[currentInvoice?.currency] ||
                          currentInvoice?.currency}{" "}
                        {parseFloat(history.additional_tax).toFixed(2)}
                      </td>
                      <td>
                        {currencySymbols[currentInvoice?.currency] ||
                          currentInvoice?.currency}{" "}
                        {parseFloat(history.bank_charges).toFixed(2)}
                      </td>
                      <td>
                        <strong>
                          {currencySymbols[currentInvoice?.currency] ||
                            currentInvoice?.currency}{" "}
                          {parseFloat(history.total_amount).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        {currencySymbols[currentInvoice?.currency] ||
                          currentInvoice?.currency}{" "}
                        {parseFloat(history.amount_received).toFixed(2)}
                      </td>
                      <td>
                        <strong>
                          {currencySymbols[currentInvoice?.currency] ||
                            currentInvoice?.currency}{" "}
                          {parseFloat(history.balance).toFixed(2)}
                        </strong>
                      </td>
                      <td>{history.exchange_rate}</td>
                      <td>{formatDate(history.rate_date)}</td>
                      <td>{formatDate(history.created_at)}</td>
                      <td>
                        <Button
                          variant="warning"
                          onClick={() => handleShowExchangedInvoice(history)}
                        >
                          show Exchanged
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4">
              <FaExchangeAlt size={48} className="text-muted mb-3" />
              <h5>No exchange rate history available</h5>
              <p className="text-muted">
                This invoice has no recorded exchange rate history.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowExchangeModal(false);
              setExchangeRateError(null);
              setExchangeRateSuccess("");
            }}
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => handleUpdateExchangeRate(currentInvoice)}
            disabled={exchangeRateLoading}
          >
            {exchangeRateLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              <>
                <FaSync className="me-2" />
                Update Exchange Rate
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setCancelRemark("");
          setCancelAttachment(null);
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
              : `Are you sure you want to request cancellation for invoice #${invoiceToDelete?.invoice_number}? `}
          </p>
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
              disabled={!cancelRemark.trim()}
            >
              {/* {isLoading ? "Submitting Request..." : "Submit Request"} */}
              {"Submit Request"}
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" onClick={handleDeleteInvoiceAdmin}>
              Confirm Cancel
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      {/* Cost Details Modal */}
      <Modal
        show={showCostModal}
        onHide={() => setShowCostModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaMoneyBillWave className="me-2" />
            Cost Summary - {currentInvoice?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentInvoiceCosts.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Total Mega Cost</th>
                    <th>Tour Cost (Without Markup)</th>
                    <th>Profit/Loss</th>
                    <th>Cost per Person (Triple)</th>
                    <th>Total Tour Cost</th>
                    <th>Currency</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoiceCosts.map((cost, index) => (
                    <tr key={cost.id}>
                      <td>{index + 1}</td>
                      <td>
                        {currencySymbols[cost.currency] || cost.currency}{" "}
                        {parseFloat(cost.total_mega_cost).toFixed(2)}
                      </td>
                      <td>
                        {currencySymbols[cost.currency] || cost.currency}{" "}
                        {parseFloat(
                          cost.total_tour_cost_without_markup
                        ).toFixed(2)}
                      </td>
                      <td>
                        <Badge
                          bg={
                            parseFloat(cost.profit_loss) >= 0
                              ? "success"
                              : "danger"
                          }
                        >
                          {currencySymbols[cost.currency] || cost.currency}{" "}
                          {parseFloat(cost.profit_loss).toFixed(2)}
                        </Badge>
                      </td>
                      <td>
                        {currencySymbols[cost.currency] || cost.currency}{" "}
                        {parseFloat(
                          cost.details?.cost_per_person_triple || 0
                        ).toFixed(2)}
                      </td>
                      <td>
                        <strong>
                          {currencySymbols[cost.currency] || cost.currency}{" "}
                          {parseFloat(cost.total_tour_cost).toFixed(2)}
                        </strong>
                      </td>
                      <td>{cost.currency}</td>
                      <td>{formatDate(cost.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Detailed Breakdown for the latest cost summary */}
              {currentInvoiceCosts.length > 0 && (
                <Accordion className="mt-4">
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      <strong>Detailed Cost Breakdown (Latest)</strong>
                    </Accordion.Header>
                    <Accordion.Body>
                      <Row>
                        <Col md={6}>
                          <Card className="mb-3">
                            <Card.Header className="bg-light">
                              <strong>Financial Summary</strong>
                            </Card.Header>
                            <Card.Body>
                              <table className="table table-sm">
                                <tbody>
                                  <tr>
                                    <td>
                                      <strong>Total Mega Cost:</strong>
                                    </td>
                                    <td>
                                      {currencySymbols[
                                        currentInvoiceCosts[0].currency
                                      ] || currentInvoiceCosts[0].currency}{" "}
                                      {parseFloat(
                                        currentInvoiceCosts[0].total_mega_cost
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>
                                        Tour Cost (Without Markup):
                                      </strong>
                                    </td>
                                    <td>
                                      {currencySymbols[
                                        currentInvoiceCosts[0].currency
                                      ] || currentInvoiceCosts[0].currency}{" "}
                                      {parseFloat(
                                        currentInvoiceCosts[0]
                                          .total_tour_cost_without_markup
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>Profit/Loss:</strong>
                                    </td>
                                    <td>
                                      <Badge
                                        bg={
                                          parseFloat(
                                            currentInvoiceCosts[0].profit_loss
                                          ) >= 0
                                            ? "success"
                                            : "danger"
                                        }
                                      >
                                        {currencySymbols[
                                          currentInvoiceCosts[0].currency
                                        ] ||
                                          currentInvoiceCosts[0].currency}{" "}
                                        {parseFloat(
                                          currentInvoiceCosts[0].profit_loss
                                        ).toFixed(2)}
                                      </Badge>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>Total Tour Cost:</strong>
                                    </td>
                                    <td>
                                      <strong>
                                        {currencySymbols[
                                          currentInvoiceCosts[0].currency
                                        ] ||
                                          currentInvoiceCosts[0].currency}{" "}
                                        {parseFloat(
                                          currentInvoiceCosts[0].total_tour_cost
                                        ).toFixed(2)}
                                      </strong>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card>
                            <Card.Header className="bg-light">
                              <strong>Per Person Costs</strong>
                            </Card.Header>
                            <Card.Body>
                              <table className="table table-sm">
                                <tbody>
                                  <tr>
                                    <td>Single:</td>
                                    <td>
                                      {currencySymbols[
                                        currentInvoiceCosts[0].currency
                                      ] || currentInvoiceCosts[0].currency}{" "}
                                      {parseFloat(
                                        currentInvoiceCosts[0].details
                                          ?.cost_per_person_single || 0
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Double:</td>
                                    <td>
                                      {currencySymbols[
                                        currentInvoiceCosts[0].currency
                                      ] || currentInvoiceCosts[0].currency}{" "}
                                      {parseFloat(
                                        currentInvoiceCosts[0].details
                                          ?.cost_per_person_double || 0
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>
                                      <strong>Triple:</strong>
                                    </td>
                                    <td>
                                      <strong>
                                        {currencySymbols[
                                          currentInvoiceCosts[0].currency
                                        ] ||
                                          currentInvoiceCosts[0].currency}{" "}
                                        {parseFloat(
                                          currentInvoiceCosts[0].details
                                            ?.cost_per_person_triple || 0
                                        ).toFixed(2)}
                                      </strong>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <FaMoneyBillWave size={48} className="text-muted mb-3" />
              <h5>No cost details available</h5>
              <p className="text-muted">
                This invoice has no recorded cost information.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCostModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Invoice_list;
