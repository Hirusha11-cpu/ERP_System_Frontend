import React, { useState, useEffect, useContext, useRef } from "react";
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
  FaGlobe,
  FaBuilding,
  FaUser,
  FaFileExcel,
  FaFilePdf,
  FaSync,
} from "react-icons/fa";
import { Bar, Pie } from "react-chartjs-2";
import Chart from "chart.js/auto";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

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

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // Fetch exchange rates
  const fetchExchangeRates = async () => {
    setRatesLoading(true);
    setRatesError(null);
    try {
      const response = await axios.get("/api/currency/rates?from=USD", {
        headers: { Authorization: `Bearer ${token}` },
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
      setRatesError("Failed to fetch rates. Using fallback values.");
    } finally {
      setRatesLoading(false);
    }
  };

  // Convert amount to selected currency
  const convertCurrency = (amount, invoiceCurrency) => {
    if (!amount || !invoiceCurrency || invoiceCurrency === currency) return amount;
    const rate = exchangeRates[invoiceCurrency] / exchangeRates[currency];
    return (amount * rate).toFixed(2);
  };

  // Fetch invoices and summary
  const fetchData = async (companyNumber) => {
    try {
      setLoading(true);
      const [invoicesRes, summaryRes] = await Promise.all([
        axios.get(`/api/invoices?company_id=${companyNumber}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`/api/invoicess/summary?company_id=${companyNumber}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setInvoices(invoicesRes.data.data || []);
      setSummaryData(summaryRes.data);
      setFilteredInvoices(invoicesRes.data.data || []);
      fetchExchangeRates();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCompany) return;
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };
    const mappedCompanyNo = companyMap[selectedCompany.toLowerCase()] || 3;
    setCompanyNo(mappedCompanyNo);
    if (mappedCompanyNo) {
      fetchData(mappedCompanyNo);
    } else {
      fetchData(3);
    }
  }, [selectedCompany]);

  // Apply filters
  useEffect(() => {
    let results = invoices;
    if (results?.length > 0) {
      if (startDate && endDate) {
        results = results.filter((invoice) => {
          const invoiceDate = new Date(invoice.issue_date);
          return invoiceDate >= startDate && invoiceDate <= endDate;
        });
      }
      if (searchTerm) {
        results = results.filter(
          (invoice) =>
            invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      setFilteredInvoices(results);
    }
  }, [invoices, searchTerm, startDate, endDate]);

  // Compute summary reports
  const computeSummaryReports = () => {
    const summaries = { daily: {}, weekly: {}, monthly: {} };
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
        if (!summaries[period][key]) {
          summaries[period][key] = {};
          categories.forEach((cat) => {
            summaries[period][key][cat] = { count: 0, amount: 0 };
          });
        }
      });

      // Categorize invoices
      const addToCategory = (category, period, key) => {
        summaries[period][key][category].count += 1;
        summaries[period][key][category].amount += amount;
      };

      if (invoiceDate >= subDays(new Date(), 30)) {
        addToCategory("new_invoices", "daily", dayKey);
        addToCategory("new_invoices", "weekly", weekStart);
        addToCategory("new_invoices", "monthly", monthKey);
      }
      if (invoice.status.toLowerCase() === "cancelled") {
        addToCategory("cancelled_invoices", "daily", dayKey);
        addToCategory("cancelled_invoices", "weekly", weekStart);
        addToCategory("cancelled_invoices", "monthly", monthKey);
      }
      if (invoice.payment_type === "credit") {
        addToCategory("credit_invoices", "daily", dayKey);
        addToCategory("credit_invoices", "weekly", weekStart);
        addToCategory("credit_invoices", "monthly", monthKey);
      }
      if (invoice.payment_type === "non-credit") {
        addToCategory("non_credit_invoices", "daily", dayKey);
        addToCategory("non_credit_invoices", "weekly", weekStart);
        addToCategory("non_credit_invoices", "monthly", monthKey);
      }
      if (parseFloat(invoice.balance) === 0) {
        addToCategory("fully_paid_invoices", "daily", dayKey);
        addToCategory("fully_paid_invoices", "weekly", weekStart);
        addToCategory("fully_paid_invoices", "monthly", monthKey);
      }
      if (parseFloat(invoice.balance) > 0) {
        addToCategory("payment_pending_invoices", "daily", dayKey);
        addToCategory("payment_pending_invoices", "weekly", weekStart);
        addToCategory("payment_pending_invoices", "monthly", monthKey);
      }
    });

    return summaries;
  };

  const summaries = computeSummaryReports();

  // Chart data for summaries
  const getChartData = (period, category) => {
    const data = summaries[period];
    const labels = Object.keys(data).sort();
    return {
      labels,
      datasets: [
        {
          label: `${category.replace("_", " ")} Amount`,
          data: labels.map((key) => data[key][category].amount.toFixed(2)),
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  // Excel export
  const exportToExcel = () => {
    const wsData = filteredInvoices.map((invoice) => ({
      "Invoice #": invoice.invoice_number,
      Customer: invoice.customer.name,
      Date: format(new Date(invoice.issue_date), "MMM dd, yyyy"),
      Amount: `${convertCurrency(invoice.total_amount, invoice.currency)} ${currency}`,
      Profit: `${convertCurrency(invoice.profit?.profit || 0, invoice.currency)} ${currency}`,
      Status: invoice.refund ? `Refund: ${invoice.refund.refund_status}` : "Paid",
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.write_file(wb, `invoices_${format(new Date(), "yyyyMMdd")}.xlsx`);
  };

  // PDF export
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Invoice Summary", 20, 20);
    doc.autoTable({
      startY: 30,
      head: [["Invoice #", "Customer", "Date", "Amount", "Profit", "Status"]],
      body: filteredInvoices.map((invoice) => [
        invoice.invoice_number,
        invoice.customer.name,
        format(new Date(invoice.issue_date), "MMM dd, yyyy"),
        `${convertCurrency(invoice.total_amount, invoice.currency)} ${currency}`,
        `${convertCurrency(invoice.profit?.profit || 0, invoice.currency)} ${currency}`,
        invoice.refund ? `Refund: ${invoice.refund.refund_status}` : "Paid",
      ]),
    });
    doc.save(`invoices_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  // Handle view invoice
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowModal(true);
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="text-center py-5">Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="invoice-summary p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <FaMoneyBillWave className="me-2" />
          Invoice Summary Dashboard
        </h2>
        <div>
          <Form.Select
            size="sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="d-inline-block me-2"
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
            className="me-2"
          >
            {ratesLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" />
                Updating Rates...
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
          <Button variant="outline-success" onClick={exportToExcel} className="me-2">
            <FaFileExcel className="me-1" /> Excel
          </Button>
          <Button variant="outline-success" onClick={exportToPDF}>
            <FaFilePdf className="me-1" /> PDF
          </Button>
        </div>
      </div>

      {ratesError && (
        <Alert variant="warning" className="mb-3">
          {ratesError} <Button variant="link" onClick={fetchExchangeRates}>Retry</Button>
        </Alert>
      )}
      {lastRatesUpdate && (
        <small className="text-muted mb-3 d-block">
          Last rates updated: {lastRatesUpdate}
        </small>
      )}

      {/* Filters */}
      <Card className="mb-4">
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
                  Date Range
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
                    <th>Amount</th>
                    <th>Profit</th>
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
                      <td>{convertCurrency(invoice.total_amount, invoice.currency)} {currency}</td>
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
                          {convertCurrency(invoice.profit?.profit || 0, invoice.currency)} {currency}
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
                          <Badge bg="success">Paid</Badge>
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
                    <th>Amount</th>
                    <th>Refund Amount</th>
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
                        <td>{convertCurrency(invoice.total_amount, invoice.currency)} {currency}</td>
                        <td>{convertCurrency(invoice.refund.refund_amount, invoice.currency)} {currency}</td>
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
                    <th>Amount</th>
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
                        <td>{convertCurrency(invoice.total_amount, invoice.currency)} {currency}</td>
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
                  <p><strong>Total Amount:</strong> {convertCurrency(selectedInvoice.total_amount, selectedInvoice.currency)} {currency}</p>
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
                      <Badge bg="success">Paid</Badge>
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