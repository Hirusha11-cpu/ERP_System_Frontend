import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import {
  Table,
  Card,
  Badge,
  Row,
  Col,
  Form,
  Button,
  Modal,
  OverlayTrigger,
  Tooltip,
  Tab,
  Tabs,
  Alert,
  Accordion,
  Spinner
} from "react-bootstrap";
import {
  FaFilter,
  FaSearch,
  FaChartLine,
  FaChartPie,
  FaMoneyBillWave,
  FaInfoCircle,
  FaPrint,
  FaDownload,
  FaEye,
  FaCalendarAlt,
  FaBuilding,
  FaFileExcel,
  FaFilePdf,
  FaSync,
  FaChevronDown,
  FaTimes,
} from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Invoice_summary = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([subDays(new Date(), 30), new Date()]);
  const [startDate, endDate] = dateRange;
  const [activeTab, setActiveTab] = useState("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [companyNo, setCompanyNo] = useState(null);
  const [currency, setCurrency] = useState("INR");
  const [exchangeRates, setExchangeRates] = useState({
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    MYR: 0.057,
    SGD: 0.016,
    LKR: 3.2,
  });
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(null);
  const [lastRatesUpdate, setLastRatesUpdate] = useState(null);
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [exporting, setExporting] = useState({ excel: false, pdf: false });
  
  // Advanced filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("");
  const [minAmountFilter, setMinAmountFilter] = useState("");
  const [maxAmountFilter, setMaxAmountFilter] = useState("");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [travelDateRange, setTravelDateRange] = useState([null, null]);
  const [travelStartDate, travelEndDate] = travelDateRange;
  const [accountFilter, setAccountFilter] = useState("all");
  const [refundStatusFilter, setRefundStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [customersList, setCustomersList] = useState([]);
  const [accountsList, setAccountsList] = useState([]);

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // Memoized company mapping
  const companyMap = useMemo(() => ({
    appleholidays: 2,
    aahaas: 3,
    shirmila: 1,
  }), []);

  // Memoized currency conversion
  const convertCurrency = useCallback((amount, invoiceCurrency) => {
    if (!amount || !invoiceCurrency || invoiceCurrency === currency) return amount;
    const rate = exchangeRates[invoiceCurrency] / exchangeRates[currency];
    return (parseFloat(amount) * rate).toFixed(2);
  }, [currency, exchangeRates]);

  // Fetch exchange rates
  const fetchExchangeRates = useCallback(async () => {
    setRatesLoading(true);
    setRatesError(null);
    try {
      const response = await axios.get("/api/currency/rates?from=USD", {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout
      });
      const data = response.data;
      if (data.rates && data.base === "USD") {
        const usdToInr = data.rates.INR || 88.2484;
        if (usdToInr === 0) throw new Error("Invalid USD to INR rate");
        const newRates = {
          INR: 1,
          USD: 1 / usdToInr,
          EUR: (data.rates.EUR || 0.8538) / usdToInr,
          MYR: (data.rates.MYR || 4.225) / usdToInr,
          SGD: (data.rates.SGD || 1.2856) / usdToInr,
          LKR: (data.rates.LKR || 301.7489) / usdToInr,
        };
        setExchangeRates(newRates);
        setLastRatesUpdate(new Date().toLocaleString());
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
      // setRatesError("Failed to fetch rates. Using fallback values.");`
    } finally {
      setRatesLoading(false);
    }
  }, [token]);

  // Fetch invoices and summary
  const fetchData = useCallback(async (companyNumber) => {
    try {
      setLoading(true);
      setError(null);
      
      const [invoicesRes, summaryRes] = await Promise.all([
        axios.get(`/api/invoices?company_id=${companyNumber}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000 // 30 second timeout
        }),
        axios.get(`/api/invoices/summary?company_id=${companyNumber}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }).catch(err => {
          console.warn("Summary API not available, using fallback");
          return { data: {} };
        }),
      ]);
      
      const invoicesData = invoicesRes.data.data || [];
      setInvoices(invoicesData);
      setSummaryData(summaryRes.data);
      
      // Extract unique customers and accounts for filters
      const uniqueCustomers = [...new Set(invoicesData.map(inv => inv.customer?.name).filter(Boolean))];
      setCustomersList(uniqueCustomers);
      
      const uniqueAccounts = [...new Set(invoicesData.map(inv => inv.account?.account_name).filter(Boolean))];
      setAccountsList(uniqueAccounts);
      
      fetchExchangeRates();
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, fetchExchangeRates]);

  useEffect(() => {
    if (!selectedCompany) return;
    
    const mappedCompanyNo = companyMap[selectedCompany.toLowerCase()] || 3;
    setCompanyNo(mappedCompanyNo);
    fetchData(mappedCompanyNo);
  }, [selectedCompany, companyMap, fetchData]);

  // Apply all filters - memoized to prevent unnecessary recalculations
  useEffect(() => {
    if (invoices.length === 0) {
      setFilteredInvoices([]);
      return;
    }

    const filtered = invoices.filter((invoice) => {
      // Date range filter
      if (startDate && endDate) {
        const invoiceDate = new Date(invoice.issue_date);
        if (invoiceDate < startDate || invoiceDate > endDate) return false;
      }
      
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!invoice.invoice_number?.toLowerCase().includes(searchLower) &&
            !invoice.customer?.name?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "refund" && !invoice.refund) return false;
        if (statusFilter === "draft" && invoice.status !== "draft") return false;
        if (statusFilter === "confirmed" && invoice.status !== "confirmed") return false;
        if (statusFilter === "paid" && (invoice.refund || parseFloat(invoice.balance) !== 0)) return false;
      }
      
      // Payment type filter
      if (paymentTypeFilter !== "all" && invoice.payment_type !== paymentTypeFilter) return false;
      
      // Customer filter
      if (customerFilter && !invoice.customer?.name?.toLowerCase().includes(customerFilter.toLowerCase())) return false;
      
      // Amount range filter
      const invoiceAmount = parseFloat(convertCurrency(invoice.total_amount, invoice.currency));
      if (minAmountFilter && invoiceAmount < parseFloat(minAmountFilter)) return false;
      if (maxAmountFilter && invoiceAmount > parseFloat(maxAmountFilter)) return false;
      
      // Balance filter
      const balance = parseFloat(invoice.balance);
      const totalAmount = parseFloat(invoice.total_amount);
      
      if (balanceFilter !== "all") {
        if (balanceFilter === "paid" && balance !== 0) return false;
        if (balanceFilter === "partial" && (balance <= 0 || balance >= totalAmount)) return false;
        if (balanceFilter === "unpaid" && balance !== totalAmount) return false;
        if (balanceFilter === "overdue" && (balance <= 0 || new Date(invoice.due_date) >= new Date())) return false;
      }
      
      // Travel date range filter
      if (travelStartDate && travelEndDate && invoice.start_date) {
        const travelDate = new Date(invoice.start_date);
        if (travelDate < travelStartDate || travelDate > travelEndDate) return false;
      }
      
      // Account filter
      if (accountFilter !== "all" && invoice.account?.account_name !== accountFilter) return false;
      
      // Refund status filter
      if (refundStatusFilter !== "all" && (!invoice.refund || invoice.refund.refund_status !== refundStatusFilter)) return false;
      
      return true;
    });

    setFilteredInvoices(filtered);
  }, [
    invoices, 
    searchTerm, 
    startDate, 
    endDate,
    statusFilter,
    paymentTypeFilter,
    customerFilter,
    minAmountFilter,
    maxAmountFilter,
    balanceFilter,
    travelStartDate,
    travelEndDate,
    accountFilter,
    refundStatusFilter,
    convertCurrency
  ]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setDateRange([subDays(new Date(), 30), new Date()]);
    setStatusFilter("all");
    setPaymentTypeFilter("all");
    setCustomerFilter("");
    setMinAmountFilter("");
    setMaxAmountFilter("");
    setBalanceFilter("all");
    setTravelDateRange([null, null]);
    setAccountFilter("all");
    setRefundStatusFilter("all");
  }, []);

  // Memoized summary reports computation
  const summaries = useMemo(() => {
    const result = { daily: {}, weekly: {}, monthly: {} };
    const categories = [
      "new_invoices",
      "cancelled_invoices",
      "credit_invoices",
      "non_credit_invoices",
      "fully_paid_invoices",
      "payment_pending_invoices",
    ];

    filteredInvoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.issue_date);
      const dayKey = format(invoiceDate, "yyyy-MM-dd");
      const weekStart = format(startOfWeek(invoiceDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const monthKey = format(invoiceDate, "yyyy-MM");
      const amount = parseFloat(convertCurrency(invoice.total_amount, invoice.currency));

      // Initialize summaries
      ["daily", "weekly", "monthly"].forEach((period) => {
        const key = period === "daily" ? dayKey : period === "weekly" ? weekStart : monthKey;
        if (!result[period][key]) {
          result[period][key] = {};
          categories.forEach((cat) => {
            result[period][key][cat] = { count: 0, amount: 0 };
          });
        }
      });

      // Categorize invoices
      const addToCategory = (category, period, key) => {
        result[period][key][category].count += 1;
        result[period][key][category].amount += amount;
      };

      if (invoiceDate >= subDays(new Date(), 30)) {
        addToCategory("new_invoices", "daily", dayKey);
        addToCategory("new_invoices", "weekly", weekStart);
        addToCategory("new_invoices", "monthly", monthKey);
      }
      if (invoice?.status?.toLowerCase() === "cancelled") {
        addToCategory("cancelled_invoices", "daily", dayKey);
        addToCategory("cancelled_invoices", "weekly", weekStart);
        addToCategory("cancelled_invoices", "monthly", monthKey);
      }
      if (invoice?.payment_type === "credit") {
        addToCategory("credit_invoices", "daily", dayKey);
        addToCategory("credit_invoices", "weekly", weekStart);
        addToCategory("credit_invoices", "monthly", monthKey);
      }
      if (invoice?.payment_type === "non-credit") {
        addToCategory("non_credit_invoices", "daily", dayKey);
        addToCategory("non_credit_invoices", "weekly", weekStart);
        addToCategory("non_credit_invoices", "monthly", monthKey);
      }
      if (parseFloat(invoice?.balance) === 0) {
        addToCategory("fully_paid_invoices", "daily", dayKey);
        addToCategory("fully_paid_invoices", "weekly", weekStart);
        addToCategory("fully_paid_invoices", "monthly", monthKey);
      }
      if (parseFloat(invoice?.balance) > 0) {
        addToCategory("payment_pending_invoices", "daily", dayKey);
        addToCategory("payment_pending_invoices", "weekly", weekStart);
        addToCategory("payment_pending_invoices", "monthly", monthKey);
      }
    });

    return result;
  }, [filteredInvoices, convertCurrency]);

  // Excel export with current filters
  const exportToExcel = useCallback(async () => {
    setExporting({ ...exporting, excel: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const wsData = filteredInvoices.map((invoice) => ({
        "Invoice #": invoice.invoice_number,
        Customer: invoice.customer?.name || "N/A",
        Date: format(new Date(invoice.issue_date), "MMM dd, yyyy"),
        "Due Date": format(new Date(invoice.due_date), "MMM dd, yyyy"),
        Amount: parseFloat(convertCurrency(invoice.total_amount, invoice.currency)),
        Currency: currency,
        "Amount Received": parseFloat(convertCurrency(invoice.amount_received, invoice.currency)),
        Balance: parseFloat(convertCurrency(invoice.balance, invoice.currency)),
        Profit: parseFloat(convertCurrency(invoice.profit?.profit || 0, invoice.currency)),
        Status: invoice.refund ? `Refund: ${invoice.refund.refund_status}` : invoice.status,
        "Payment Type": invoice.payment_type,
        "Travel Start": invoice.start_date ? format(new Date(invoice.start_date), "MMM dd, yyyy") : "N/A",
        "Travel End": invoice.end_date ? format(new Date(invoice.end_date), "MMM dd, yyyy") : "N/A",
      }));
      
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Invoices");
      
      const summaryData = [
        ["Report Summary", ""],
        ["Generated On", new Date().toLocaleString()],
        ["Currency", currency],
        ["Date Range", `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`],
        ["Total Invoices", filteredInvoices.length],
        ["Total Amount", filteredInvoices.reduce((sum, inv) => sum + parseFloat(convertCurrency(inv.total_amount, inv.currency)), 0).toFixed(2)],
        ["Total Profit", filteredInvoices.reduce((sum, inv) => sum + parseFloat(convertCurrency(inv.profit?.profit || 0, inv.currency)), 0).toFixed(2)],
      ];
      
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
      
      XLSX.writeFile(wb, `invoices_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel. Please try again.");
    } finally {
      setExporting({ ...exporting, excel: false });
    }
  }, [filteredInvoices, currency, startDate, endDate, convertCurrency, exporting]);

  // PDF export with current filters
  const exportToPDF = useCallback(async () => {
    setExporting({ ...exporting, pdf: true });
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text("Invoice Summary Report", 105, 15, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 22, { align: "center" });
      doc.text(`Currency: ${currency}`, 105, 28, { align: "center" });
      doc.text(`Date Range: ${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`, 105, 34, { align: "center" });
      
      doc.text(`Total Invoices: ${filteredInvoices.length}`, 20, 45);
      doc.text(`Total Amount: ${filteredInvoices.reduce((sum, inv) => sum + parseFloat(convertCurrency(inv.total_amount, inv.currency)), 0).toFixed(2)} ${currency}`, 20, 52);
      doc.text(`Total Profit: ${filteredInvoices.reduce((sum, inv) => sum + parseFloat(convertCurrency(inv.profit?.profit || 0, inv.currency)), 0).toFixed(2)} ${currency}`, 20, 59);
      
      autoTable(doc, {
        startY: 70,
        head: [["Invoice #", "Customer", "Date", "Amount", "Profit", "Status"]],
        body: filteredInvoices.map((invoice) => [
          invoice.invoice_number,
          invoice.customer?.name || "N/A",
          format(new Date(invoice.issue_date), "MMM dd, yyyy"),
          `${convertCurrency(invoice.total_amount, invoice.currency)} ${currency}`,
          `${convertCurrency(invoice.profit?.profit || 0, invoice.currency)} ${currency}`,
          invoice.refund ? `Refund: ${invoice.refund.refund_status}` : invoice.status,
        ]),
        theme: 'grid',
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak'
        },
        margin: { top: 70 }
      });
      
      doc.save(`invoices_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export to PDF. Please try again.");
    } finally {
      setExporting({ ...exporting, pdf: false });
    }
  }, [filteredInvoices, currency, startDate, endDate, convertCurrency, exporting]);

  // Handle view invoice
  const handleViewInvoice = useCallback((invoice) => {
    setSelectedInvoice(invoice);
    setShowModal(true);
  }, []);

  // Handle print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Memoized summary cards data
  const summaryCards = useMemo(() => [
    { 
      title: "Total Invoices", 
      value: filteredInvoices.length, 
      icon: FaBuilding, 
      color: "info" 
    },
    {
      title: "Total Amount",
      value: filteredInvoices
        .reduce((sum, inv) => sum + parseFloat(convertCurrency(inv.total_amount, inv.currency)), 0)
        .toFixed(2),
      icon: FaMoneyBillWave,
      color: "primary",
    },
    {
      title: "Total Profit",
      value: filteredInvoices
        .reduce((sum, inv) => sum + parseFloat(convertCurrency(inv.profit?.profit || 0, inv.currency)), 0)
        .toFixed(2),
      icon: FaChartLine,
      color: "success",
    },
    {
      title: "Pending Payments",
      value: filteredInvoices
        .filter((inv) => parseFloat(inv.balance) > 0)
        .reduce((sum, inv) => sum + parseFloat(convertCurrency(inv.balance, inv.currency)), 0)
        .toFixed(2),
      icon: FaChartPie,
      color: "warning",
    },
  ], [filteredInvoices, convertCurrency]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading invoices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        <Alert.Heading>Error Loading Data</Alert.Heading>
        <p>{error}</p>
        <Button variant="primary" onClick={() => companyNo && fetchData(companyNo)}>
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="invoice-summary p-3">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">
          <FaMoneyBillWave className="me-2" />
          Invoice Summary Dashboard
        </h2>
        <div className="d-flex flex-wrap gap-2">
          <Form.Select
            size="sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{ width: "100px" }}
          >
            {Object.keys(exchangeRates).map((curr) => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </Form.Select>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={fetchExchangeRates}
            disabled={ratesLoading}
          >
            {ratesLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Updating...
              </>
            ) : (
              <>
                <FaSync className="me-1" />
                Rates
              </>
            )}
          </Button>
          <Button variant="outline-primary" onClick={handlePrint} className="me-2">
            <FaPrint className="me-1" /> Print
          </Button>
          <Button 
            variant="outline-success" 
            onClick={exportToExcel}
            disabled={exporting.excel}
          >
            {exporting.excel ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Exporting...
              </>
            ) : (
              <>
                <FaFileExcel className="me-1" /> Excel
              </>
            )}
          </Button>
          <Button 
            variant="outline-success" 
            onClick={exportToPDF}
            disabled={exporting.pdf}
          >
            {exporting.pdf ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Exporting...
              </>
            ) : (
              <>
                <FaFilePdf className="me-1" /> PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {ratesError && (
        <Alert variant="warning" className="mb-3">
          {ratesError} <Button variant="link" onClick={fetchExchangeRates} size="sm">Retry</Button>
        </Alert>
      )}
      
      {lastRatesUpdate && (
        <small className="text-muted mb-3 d-block">
          Last rates updated: {lastRatesUpdate}
        </small>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <FaFilter className="me-2" />
            Filters
            <Badge bg="secondary" className="ms-2">
              {filteredInvoices.length} of {invoices.length} invoices
            </Badge>
          </div>
          <div>
            <Button
              variant="outline-secondary"
              size="sm"
              className="me-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide Filters" : "Show Filters"} <FaChevronDown />
            </Button>
            <Button variant="outline-danger" size="sm" onClick={clearAllFilters}>
              Clear All <FaTimes />
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FaSearch className="me-2" />
                  Search Invoices
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by invoice number or customer"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FaCalendarAlt className="me-2" />
                  Invoice Date Range
                </Form.Label>
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  isClearable={true}
                  className="form-control"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FaFilter className="me-2" />
                  Quick Filters
                </Form.Label>
                <div className="d-flex">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => setDateRange([startOfMonth(new Date()), endOfMonth(new Date())])}
                  >
                    This Month
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setDateRange([subDays(new Date(), 7), new Date()])}
                  >
                    Last 7 Days
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FaChartLine className="me-2" />
                  Report Period
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Advanced Filters */}
          {showFilters && (
            <Accordion defaultActiveKey="0" className="mt-3">
              <Accordion.Item eventKey="0">
                <Accordion.Header>Advanced Filters</Accordion.Header>
                <Accordion.Body>
                  <Row>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All Statuses</option>
                          <option value="draft">Draft</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="paid">Paid</option>
                          <option value="refund">With Refund</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Payment Type</Form.Label>
                        <Form.Select
                          value={paymentTypeFilter}
                          onChange={(e) => setPaymentTypeFilter(e.target.value)}
                        >
                          <option value="all">All Types</option>
                          <option value="credit">Credit</option>
                          <option value="non-credit">Non-Credit</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Customer</Form.Label>
                        <Form.Control
                          as="select"
                          value={customerFilter}
                          onChange={(e) => setCustomerFilter(e.target.value)}
                        >
                          <option value="">All Customers</option>
                          {customersList.map((customer, idx) => (
                            <option key={idx} value={customer}>{customer}</option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Account</Form.Label>
                        <Form.Select
                          value={accountFilter}
                          onChange={(e) => setAccountFilter(e.target.value)}
                        >
                          <option value="all">All Accounts</option>
                          {accountsList.map((account, idx) => (
                            <option key={idx} value={account}>{account}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mt-3">
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Amount Range ({currency})</Form.Label>
                        <div className="d-flex">
                          <Form.Control
                            type="number"
                            placeholder="Min"
                            value={minAmountFilter}
                            onChange={(e) => setMinAmountFilter(e.target.value)}
                            className="me-2"
                          />
                          <Form.Control
                            type="number"
                            placeholder="Max"
                            value={maxAmountFilter}
                            onChange={(e) => setMaxAmountFilter(e.target.value)}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Balance Status</Form.Label>
                        <Form.Select
                          value={balanceFilter}
                          onChange={(e) => setBalanceFilter(e.target.value)}
                        >
                          <option value="all">All</option>
                          <option value="paid">Fully Paid</option>
                          <option value="partial">Partial Payment</option>
                          <option value="unpaid">Unpaid</option>
                          <option value="overdue">Overdue</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Travel Date Range</Form.Label>
                        <DatePicker
                          selectsRange={true}
                          startDate={travelStartDate}
                          endDate={travelEndDate}
                          onChange={(update) => setTravelDateRange(update)}
                          isClearable={true}
                          className="form-control"
                          placeholderText="Select travel date range"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Refund Status</Form.Label>
                        <Form.Select
                          value={refundStatusFilter}
                          onChange={(e) => setRefundStatusFilter(e.target.value)}
                        >
                          <option value="all">All</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="rejected">Rejected</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )}
        </Card.Body>
      </Card>

      {/* Summary Cards */}
      <Row className="mb-4">
        {[
          { title: "Total Invoices", value: filteredInvoices.length, icon: FaBuilding, color: "info" },
          {
            title: "Total Amount",
            value: filteredInvoices
              .reduce((sum, inv) => sum + parseFloat(convertCurrency(inv.total_amount, inv.currency)), 0)
              .toFixed(2),
            icon: FaMoneyBillWave,
            color: "primary",
          },
          {
            title: "Total Profit",
            value: filteredInvoices
              .reduce((sum, inv) => sum + parseFloat(convertCurrency(inv.profit?.profit || 0, inv.currency)), 0)
              .toFixed(2),
            icon: FaChartLine,
            color: "success",
          },
          {
            title: "Pending Payments",
            value: filteredInvoices
              .filter((inv) => parseFloat(inv.balance) > 0)
              .reduce((sum, inv) => sum + parseFloat(convertCurrency(inv.balance, inv.currency)), 0)
              .toFixed(2),
            icon: FaChartPie,
            color: "warning",
          },
        ].map((card, idx) => (
          <Col md={3} key={idx}>
            <Card className={`text-white bg-${card.color}`}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Card.Title>{card.title}</Card.Title>
                    <h2>{card.value}</h2>
                    <small>{currency}</small>
                  </div>
                  <card.icon size={40} />
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="invoices" title="All Invoices">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <span className="me-2">
                  <FaBuilding className="me-4" />
                  Invoice List
                </span>
                <Badge bg="primary">{filteredInvoices.length} invoices</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Due Date</th>
                    <th>Amount ({currency})</th>
                    <th>Profit ({currency})</th>
                    <th>Balance ({currency})</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoice_number}</td>
                      <td>{invoice.customer.name}</td>
                      <td>{format(new Date(invoice.issue_date), "MMM dd, yyyy")}</td>
                      <td>{format(new Date(invoice.due_date), "MMM dd, yyyy")}</td>
                      <td>{convertCurrency(invoice.total_amount, invoice.currency)}</td>
                      <td>
                        <Badge
                          bg={
                            invoice.profit?.profit > 0
                              ? "success"
                              : invoice.profit?.profit < 0
                              ? "danger"
                              : "warning"
                          }
                        >
                          {convertCurrency(invoice.profit?.profit || 0, invoice.currency)}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={parseFloat(invoice.balance) > 0 ? "warning" : "success"}>
                          {convertCurrency(invoice.balance, invoice.currency)}
                        </Badge>
                      </td>
                      <td>
                        {invoice.refund ? (
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Refund: {invoice.refund.refund_status}</Tooltip>}
                          >
                            <Badge
                              bg={
                                invoice.refund.refund_status === "confirmed"
                                  ? "danger"
                                  : invoice.refund.refund_status === "pending"
                                  ? "warning"
                                  : "secondary"
                              }
                            >
                              Refund
                            </Badge>
                          </OverlayTrigger>
                        ) : (
                          <Badge bg={invoice.status === "confirmed" ? "success" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Button variant="info" size="sm" onClick={() => handleViewInvoice(invoice)}>
                          <FaEye /> View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="refunds" title="Refund Requests">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <FaMoneyBillWave className="me-2" />
                  Refund Requests
                </span>
                <Badge bg="danger">{filteredInvoices.filter((inv) => inv.refund).length} pending</Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Amount ({currency})</th>
                    <th>Refund Amount ({currency})</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices
                    .filter((invoice) => invoice.refund)
                    .map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.invoice_number}</td>
                        <td>{invoice.customer.name}</td>
                        <td>{convertCurrency(invoice.total_amount, invoice.currency)}</td>
                        <td>{convertCurrency(invoice.refund.refund_amount, invoice.currency)}</td>
                        <td><small>{invoice.refund.refund_reason}</small></td>
                        <td>
                          <Badge
                            bg={
                              invoice.refund.refund_status === "confirmed"
                                ? "success"
                                : invoice.refund.refund_status === "pending"
                                ? "warning"
                                : "danger"
                            }
                          >
                            {invoice.refund.refund_status}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="info" size="sm" onClick={() => handleViewInvoice(invoice)}>
                            <FaEye /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="awaiting" title="Awaiting Payment Invoices">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <FaMoneyBillWave className="me-2" />
                  Awaiting Payments
                </span>
                <Badge bg="secondary">
                  {filteredInvoices.filter((inv) => parseFloat(inv.balance) > 0).length} awaiting
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <Table striped hover responsive>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Amount ({currency})</th>
                    <th>Balance ({currency})</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices
                    .filter((invoice) => parseFloat(invoice.balance) > 0)
                    .map((invoice) => (
                      <tr key={invoice.id}>
                        <td>{invoice.invoice_number}</td>
                        <td>{invoice.customer.name}</td>
                        <td>{convertCurrency(invoice.total_amount, invoice.currency)}</td>
                        <td>{convertCurrency(invoice.balance, invoice.currency)}</td>
                        <td>{format(new Date(invoice.due_date), "MMM dd, yyyy")}</td>
                        <td>
                          <Badge
                            bg={
                              invoice.status === "confirmed"
                                ? "success"
                                : invoice.status === "pending"
                                ? "warning"
                                : "danger"
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="info" size="sm" onClick={() => handleViewInvoice(invoice)}>
                            <FaEye /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="summary" title="Summary Reports">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <FaChartLine className="me-2" />
                  Summary Reports ({reportPeriod})
                </span>
              </div>
            </Card.Header>
            <Card.Body>
              {["new_invoices", "cancelled_invoices", "credit_invoices", "non_credit_invoices", "fully_paid_invoices", "payment_pending_invoices"].map((category) => (
                <div key={category} className="mb-4">
                  <h5>{category.replace("_", " ").toUpperCase()}</h5>
                  <Table striped hover responsive>
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Count</th>
                        <th>Amount ({currency})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(summaries[reportPeriod])
                        .sort()
                        .map((key) => (
                          <tr key={key}>
                            <td>{key}</td>
                            <td>{summaries[reportPeriod][key][category].count}</td>
                            <td>{summaries[reportPeriod][key][category].amount.toFixed(2)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </Table>
                  {/* <Bar data={getChartData(reportPeriod, category)} /> */}
                </div>
              ))}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Invoice Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Invoice Details: {selectedInvoice?.invoice_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInvoice && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <h5>Customer Information</h5>
                  <p><strong>Name:</strong> {selectedInvoice.customer.name}</p>
                  <p><strong>Address:</strong> {selectedInvoice.customer.address}</p>
                  <p><strong>Contact:</strong> {selectedInvoice.customer.mobile}</p>
                </Col>
                <Col md={6}>
                  <h5>Invoice Summary</h5>
                  <p><strong>Date:</strong> {format(new Date(selectedInvoice.issue_date), "MMM dd, yyyy")}</p>
                  <p><strong>Due Date:</strong> {format(new Date(selectedInvoice.due_date), "MMM dd, yyyy")}</p>
                  <p><strong>Total Amount:</strong> {convertCurrency(selectedInvoice.total_amount, selectedInvoice.currency)} {currency}</p>
                  <p><strong>Amount Received:</strong> {convertCurrency(selectedInvoice.amount_received, selectedInvoice.currency)} {currency}</p>
                  <p><strong>Balance:</strong> {convertCurrency(selectedInvoice.balance, selectedInvoice.currency)} {currency}</p>
                  <p>
                    <strong>Profit:</strong>{" "}
                    <Badge
                      bg={
                        selectedInvoice.profit?.profit > 0
                          ? "success"
                          : selectedInvoice.profit?.profit < 0
                          ? "danger"
                          : "warning"
                      }
                    >
                      {convertCurrency(selectedInvoice.profit?.profit || 0, selectedInvoice.currency)} {currency}
                    </Badge>
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {selectedInvoice.refund ? (
                      <Badge
                        bg={
                          selectedInvoice.refund.refund_status === "confirmed"
                            ? "danger"
                            : selectedInvoice.refund.refund_status === "pending"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        Refund: {selectedInvoice.refund.refund_status}
                      </Badge>
                    ) : (
                      <Badge bg={selectedInvoice.status === "confirmed" ? "success" : "secondary"}>
                        {selectedInvoice.status}
                      </Badge>
                    )}
                  </p>
                </Col>
              </Row>
              <h5 className="mt-4">Items</h5>
              <Table striped bordered>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Discount</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.code}</td>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>{convertCurrency(item.price, selectedInvoice.currency)} {currency}</td>
                      <td>{item.discount}%</td>
                      <td>{convertCurrency(item.total_amount, selectedInvoice.currency)} {currency}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {selectedInvoice.additional_charges.length > 0 && (
                <>
                  <h5 className="mt-4">Additional Charges</h5>
                  <Table striped bordered>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Taxable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.additional_charges.map((charge, idx) => (
                        <tr key={idx}>
                          <td>{charge.description}</td>
                          <td>{convertCurrency(charge.amount, selectedInvoice.currency)} {currency}</td>
                          <td>{charge.taxable ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
              {selectedInvoice.refund && (
                <>
                  <h5 className="mt-4">Refund Details</h5>
                  <Table striped bordered>
                    <tbody>
                      <tr>
                        <td><strong>Refund Amount</strong></td>
                        <td>{convertCurrency(selectedInvoice.refund.refund_amount, selectedInvoice.currency)} {currency}</td>
                      </tr>
                      <tr>
                        <td><strong>Reason</strong></td>
                        <td>{selectedInvoice.refund.refund_reason}</td>
                      </tr>
                      <tr>
                        <td><strong>Status</strong></td>
                        <td>
                          <Badge
                            bg={
                              selectedInvoice.refund.refund_status === "confirmed"
                                ? "success"
                                : selectedInvoice.refund.refund_status === "pending"
                                ? "warning"
                                : "danger"
                            }
                          >
                            {selectedInvoice.refund.refund_status}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Remark</strong></td>
                        <td>{selectedInvoice.refund.remark}</td>
                      </tr>
                    </tbody>
                  </Table>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint}>
            Print
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Invoice_summary;