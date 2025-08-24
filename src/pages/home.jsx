import React, { useContext, useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Badge,
  ProgressBar,
  Table,
  Button,
  Dropdown,
  Form,
  Container,
  Tab,
  Nav,
  Modal,
} from "react-bootstrap";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiCreditCard,
  FiCalendar,
  FiUsers,
  FiFileText,
  FiPrinter,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiBarChart2,
  FiPocket,
  FiDatabase,
  FiChevronRight,
  FiGlobe,
  FiLayers,
  FiCloud,
} from "react-icons/fi";
import {
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaRegMoneyBillAlt,
  FaChartLine,
  FaPlane,
  FaHotel,
  FaReceipt,
  FaCreditCard,
} from "react-icons/fa";
import { CompanyContext } from "../contentApi/CompanyProvider";
import { Link } from "react-router-dom";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Home = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [activeSection, setActiveSection] = useState("overview");
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyNo, setCompanyNo] = useState(null);
  const [invoiceStats, setInvoiceStats] = useState({
    total: 0,
    paid: 0,
    overdue: 0,
    pending: 0,
  });
  const [filteredStats, setFilteredStats] = useState({
    total: 0,
    paid: 0,
    overdue: 0,
    pending: 0,
  });
  const [pnlSummary, setPnlSummary] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalInvoicesWithPnl: 0,
  });
  const [filteredPnlSummary, setFilteredPnlSummary] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalInvoicesWithPnl: 0,
  });
  const [nonCreditCount, setNonCreditCount] = useState(0);
  const [creditCount, setCreditCount] = useState(0);
  const [filteredNonCreditCount, setFilteredNonCreditCount] = useState(0);
  const [filteredCreditCount, setFilteredCreditCount] = useState(0);
  const [gracePeriod, setGracePeriod] = useState(15); // default 15 days

    const [appleSyncStats, setAppleSyncStats] = useState({
    sync_created: 0,
    sync_updated: 0,
    last_sync_time: "Never",
    total_invoices: 0,
    last_invoice: {
      id: 0,
      quotation_no: 0,
      created_at: null
    }
  });
  const [syncLoading, setSyncLoading] = useState(false);
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  const [currency, setCurrency] = useState("INR");
  const [exchangeRates, setExchangeRates] = useState({
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    MYR: 0.057,
    SGD: 0.016,
    LKR: 3.2,
  });

  // Filter states
  const [dateFilter, setDateFilter] = useState("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };
    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

    // Add function to fetch Apple sync stats
  const fetchAppleSyncStats = async () => {
    // if (selectedCompany?.toLowerCase() !== "appleholidays") return;
    
    try {
      setSyncLoading(true);
      const response = await axios.get('/api/apple-quotations/sync-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAppleSyncStats(response.data);
    } catch (error) {
      console.error("Error fetching Apple sync stats:", error);
    } finally {
      setSyncLoading(false);
    }
  };

  // Add function to trigger sync manually
  const triggerAppleSync = async () => {
    try {
      setSyncLoading(true);
      const response = await axios.post('/api/apple-quotations/sync', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Refresh the sync stats after sync
      await fetchAppleSyncStats();
      alert('Sync completed successfully!');
    } catch (error) {
      console.error("Error triggering Apple sync:", error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncLoading(false);
    }
  };

  // Add useEffect to fetch sync stats when company is Apple Holidays
  useEffect(() => {
    // if (selectedCompany?.toLowerCase() === "appleholidays") {
      fetchAppleSyncStats();
    // }
  }, [selectedCompany]);

  const convertCurrency = (amount) => {
    const rate = exchangeRates[currency] || 1;
    return amount * rate;
  };

  const getCurrencySymbol = () => {
    switch (currency) {
      case "USD":
        return "$";
      case "EUR":
        return "€";
      case "MYR":
        return "RM";
      case "SGD":
        return "S$";
      case "LKR":
        return "Rs";
      default:
        return "₹";
    }
  };

  const applyDateFilters = (data) => {
    let filteredData = [...data];

    if (dateFilter === "today") {
      const today = new Date();
      filteredData = filteredData.filter((invoice) => {
        const invoiceDate = new Date(invoice.issue_date);
        return (
          invoiceDate.getDate() === today.getDate() &&
          invoiceDate.getMonth() === today.getMonth() &&
          invoiceDate.getFullYear() === today.getFullYear()
        );
      });
    } else if (dateFilter === "thisWeek") {
      const today = new Date();
      const firstDayOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      );
      const lastDayOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay() + 6)
      );

      filteredData = filteredData.filter((invoice) => {
        const invoiceDate = new Date(invoice.issue_date);
        return invoiceDate >= firstDayOfWeek && invoiceDate <= lastDayOfWeek;
      });
    } else if (dateFilter === "thisMonth") {
      const today = new Date();
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );

      filteredData = filteredData.filter((invoice) => {
        const invoiceDate = new Date(invoice.issue_date);
        return invoiceDate >= firstDayOfMonth && invoiceDate <= lastDayOfMonth;
      });
    } else if (dateFilter === "thisQuarter") {
      const today = new Date();
      const quarter = Math.floor(today.getMonth() / 3);
      const firstDayOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
      const lastDayOfQuarter = new Date(
        today.getFullYear(),
        quarter * 3 + 3,
        0
      );

      filteredData = filteredData.filter((invoice) => {
        const invoiceDate = new Date(invoice.issue_date);
        return (
          invoiceDate >= firstDayOfQuarter && invoiceDate <= lastDayOfQuarter
        );
      });
    } else if (dateFilter === "custom" && customStartDate && customEndDate) {
      filteredData = filteredData.filter((invoice) => {
        const invoiceDate = new Date(invoice.issue_date);
        return invoiceDate >= customStartDate && invoiceDate <= customEndDate;
      });
    }

    return filteredData;
  };

  const applyPaymentTypeFilters = (data) => {
    if (paymentTypeFilter === "credit") {
      return data.filter(
        (invoice) =>
          invoice.payment_type === "credit" || invoice.customer?.name === "MMT"
      );
    } else if (paymentTypeFilter === "non-credit") {
      return data.filter((invoice) => invoice.payment_type === "non-credit");
    }
    return data;
  };

  // const calculateStats = (invoiceData) => {
  //   const stats = {
  //     total: 0,
  //     paid: 0,
  //     overdue: 0,
  //     pending: 0,
  //   };

  //   const pnl = {
  //     totalRevenue: 0,
  //     totalCost: 0,
  //     totalProfit: 0,
  //     totalInvoicesWithPnl: 0,
  //   };

  //   let nonCreditInvoices = 0;
  //   let creditInvoices = 0;

  //   invoiceData.forEach((invoice) => {
  //     const amount = parseFloat(invoice.total_amount) || 0;
  //     stats.total += amount;

  //     if (invoice.payment_type === "non-credit") {
  //       nonCreditInvoices++;
  //     }
  //     if (
  //       invoice?.customer?.name === "MMT" ||
  //       invoice.payment_type === "credit"
  //     ) {
  //       creditInvoices++;
  //     }

  //     if (
  //       invoice.amount_received &&
  //       parseFloat(invoice.amount_received) >= amount
  //     ) {
  //       stats.paid += amount;
  //     } else if (new Date(invoice.due_date) < new Date()) {
  //       stats.overdue += amount;
  //     } else {
  //       stats.pending += amount;
  //     }

  //     if (invoice.profit) {
  //       pnl.totalRevenue += parseFloat(invoice.profit.total_revenue) || 0;
  //       pnl.totalCost += parseFloat(invoice.profit.total_cost) || 0;
  //       pnl.totalProfit += parseFloat(invoice.profit.profit) || 0;
  //       pnl.totalInvoicesWithPnl++;
  //     }
  //   });

  //   return { stats, pnl, nonCreditInvoices, creditInvoices };
  // };

  const calculateStats = (invoiceData, gracePeriodDays = 15) => {
    const stats = {
      total: 0,
      paid: 0,
      overdue: 0,
      pending: 0,
    };

    const pnl = {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      totalInvoicesWithPnl: 0,
    };

    let nonCreditInvoices = 0;
    let creditInvoices = 0;

    const now = new Date();

    invoiceData.forEach((invoice) => {
      const amount = parseFloat(invoice.total_amount) || 0;
      stats.total += amount;

      if (invoice.payment_type === "non-credit") {
        nonCreditInvoices++;
      }
      if (
        invoice?.customer?.name === "MMT" ||
        invoice.payment_type === "credit"
      ) {
        creditInvoices++;
      }

      if (
        invoice.amount_received &&
        parseFloat(invoice.amount_received) >= amount
      ) {
        stats.paid += amount;
      } else {
        const dueDate = new Date(invoice.due_date);

        // Add grace period
        const graceDate = new Date(dueDate);
        graceDate.setDate(dueDate.getDate() + gracePeriodDays);

        if (now > graceDate) {
          stats.overdue += amount; // overdue after grace period
        } else {
          stats.pending += amount; // still pending during grace period
        }
      }

      if (invoice.profit) {
        pnl.totalRevenue += parseFloat(invoice.profit.total_revenue) || 0;
        pnl.totalCost += parseFloat(invoice.profit.total_cost) || 0;
        pnl.totalProfit += parseFloat(invoice.profit.profit) || 0;
        pnl.totalInvoicesWithPnl++;
      }
    });

    return { stats, pnl, nonCreditInvoices, creditInvoices };
  };

  const handleChange = (e) => {
    console.log(e.target.value);
    calculateStats(invoices, parseInt(e.target.value, 10));
    const value = parseInt(e.target.value, 10);
    setGracePeriod(value);
    // onGraceChange(value); // pass it up so your calculation function uses it
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/invoices?company_id=${companyNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const invoiceData = response.data.data;
      setInvoices(invoiceData);

      // Apply initial filters
      const dateFilteredData = applyDateFilters(invoiceData);
      const paymentTypeFilteredData = applyPaymentTypeFilters(dateFilteredData);
      setFilteredInvoices(paymentTypeFilteredData);

      // Calculate all stats
      const { stats, pnl, nonCreditInvoices, creditInvoices } =
        calculateStats(invoiceData);
      setInvoiceStats(stats);
      setPnlSummary(pnl);
      setNonCreditCount(nonCreditInvoices);
      setCreditCount(creditInvoices);

      // Calculate filtered stats
      const {
        stats: filteredStats,
        pnl: filteredPnl,
        nonCreditInvoices: filteredNonCredit,
        creditInvoices: filteredCredit,
      } = calculateStats(paymentTypeFilteredData);
      setFilteredStats(filteredStats);
      setFilteredPnlSummary(filteredPnl);
      setFilteredNonCreditCount(filteredNonCredit);
      setFilteredCreditCount(filteredCredit);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setLoading(false);
    }
  };

  const handleDateFilterChange = (filterType) => {
    setDateFilter(filterType);
    if (filterType === "custom") {
      setShowDateModal(true);
    } else {
      applyFilters();
    }
  };

  const handlePaymentTypeFilterChange = (filterType) => {
    setPaymentTypeFilter(filterType);
    applyFilters();
  };

  const applyFilters = () => {
    const dateFilteredData = applyDateFilters(invoices);
    const paymentTypeFilteredData = applyPaymentTypeFilters(dateFilteredData);
    setFilteredInvoices(paymentTypeFilteredData);

    const { stats, pnl, nonCreditInvoices, creditInvoices } = calculateStats(
      paymentTypeFilteredData
    );
    setFilteredStats(stats);
    setFilteredPnlSummary(pnl);
    setFilteredNonCreditCount(nonCreditInvoices);
    setFilteredCreditCount(creditInvoices);
  };

  const applyCustomDateFilter = () => {
    if (customStartDate && customEndDate) {
      setDateFilter("custom");
      applyFilters();
      setShowDateModal(false);
    }
  };

  const clearAllFilters = () => {
    setDateFilter("all");
    setPaymentTypeFilter("all");
    setCustomStartDate(null);
    setCustomEndDate(null);
    applyFilters();
  };

  useEffect(() => {
    if (companyNo) {
      fetchInvoices();
      fetchAppleSyncStats();

    }
  }, [companyNo, token]);

  const getStatusBadge = (invoice) => {
    const amount = parseFloat(invoice.total_amount) || 0;
    const received = parseFloat(invoice.amount_received) || 0;

    if (received >= amount) {
      return <Badge bg="success">Paid</Badge>;
    } else if (new Date(invoice.due_date) < new Date()) {
      return <Badge bg="danger">Overdue</Badge>;
    } else {
      return <Badge bg="warning">Pending</Badge>;
    }
  };

  const nonCreditInvoices = filteredInvoices.filter(
    (invoice) => invoice.payment_type === "non-credit"
  );
  const creditInvoices = filteredInvoices.filter(
    (invoice) =>
      invoice?.customer?.name === "MMT" || invoice.payment_type === "credit"
  );

  const renderCompanySpecificNav = () => {
    switch (selectedCompany) {
      case "appleholidays":
      case "aahaas":
        return (
          <>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 text-primary">
                  <FaFileInvoiceDollar className="me-2" />
                  Account Payables
                </h5>
                <Row>
                  {[
                    "Sri Lanka",
                    "Singapore",
                    "Vietnam",
                    "Malaysia",
                    "Maldives",
                    "Bali",
                    "Thailand",
                    "Other",
                  ].map((country) => (
                    <Col md={3} key={country} className="mb-3">
                      <Button
                        variant="outline-primary"
                        className="w-100 text-start d-flex align-items-center"
                        onClick={() =>
                          setActiveSection(
                            `payables-${country
                              .toLowerCase()
                              .replace(" ", "-")}`
                          )
                        }
                      >
                        <FiGlobe className="me-2" />
                        {country}
                        <FiChevronRight className="ms-auto" />
                      </Button>
                    </Col>
                  ))}
                </Row>
                <div className="mt-3">
                  <Button variant="link" className="text-decoration-none">
                    <FiBarChart2 className="me-2" />
                    API Reports
                  </Button>
                  <Button variant="link" className="text-decoration-none ms-3">
                    <FiPieChart className="me-2" />
                    Summary Reports
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 text-success">
                  <FaMoneyBillWave className="me-2" />
                  Account Receivables
                </h5>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    variant="outline-success"
                    className="d-flex align-items-center"
                  >
                    <FiDatabase className="me-2" />
                    API
                  </Button>
                  <Button
                    variant="outline-success"
                    className="d-flex align-items-center"
                  >
                    <FiPieChart className="me-2" />
                    Summary Reports
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </>
        );

      case "shirmila":
        return (
          <>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 text-primary">
                  <FaFileInvoiceDollar className="me-2" />
                  Account Payables
                </h5>
                <Row>
                  {[
                    "Ticketing",
                    "Income",
                    "Aging Reports",
                    "Bank Reconciliation",
                    "Summary Reports",
                    "Other",
                  ].map((item) => (
                    <Col md={4} key={item} className="mb-3">
                      <Button
                        variant="outline-primary"
                        className="w-100 text-start d-flex align-items-center"
                      >
                        {item === "Ticketing" && <FaPlane className="me-2" />}
                        {item === "Income" && <FiDollarSign className="me-2" />}
                        {item === "Aging Reports" && (
                          <FiCalendar className="me-2" />
                        )}
                        {item === "Bank Reconciliation" && (
                          <FiCreditCard className="me-2" />
                        )}
                        {item === "Summary Reports" && (
                          <FiPieChart className="me-2" />
                        )}
                        {item === "Other" && <FiLayers className="me-2" />}
                        {item}
                        <FiChevronRight className="ms-auto" />
                      </Button>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 text-success">
                  <FaMoneyBillWave className="me-2" />
                  Account Receivables
                </h5>
                <Row>
                  {["API-Ticketing", "Sales", "Summary Reports"].map((item) => (
                    <Col md={4} key={item} className="mb-3">
                      <Button
                        variant="outline-success"
                        className="w-100 text-start d-flex align-items-center"
                      >
                        {item === "API-Ticketing" && (
                          <FaPlane className="me-2" />
                        )}
                        {item === "Sales" && <FiTrendingUp className="me-2" />}
                        {item === "Summary Reports" && (
                          <FiPieChart className="me-2" />
                        )}
                        {item}
                        <FiChevronRight className="ms-auto" />
                      </Button>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Container fluid className="py-4">
      {/* Custom Date Range Modal */}
      <Modal show={showDateModal} onHide={() => setShowDateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Custom Date Range</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <DatePicker
                  selected={customStartDate}
                  onChange={(date) => setCustomStartDate(date)}
                  selectsStart
                  startDate={customStartDate}
                  endDate={customEndDate}
                  className="form-control"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Date</Form.Label>
                <DatePicker
                  selected={customEndDate}
                  onChange={(date) => setCustomEndDate(date)}
                  selectsEnd
                  startDate={customStartDate}
                  endDate={customEndDate}
                  minDate={customStartDate}
                  className="form-control"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={applyCustomDateFilter}>
            Apply Filter
          </Button>
        </Modal.Footer>
      </Modal>

      <Row className="mb-4">
        <Col md={8}>
          <h2 className="mb-0">
            <FaFileInvoiceDollar className="me-2 text-primary" />
            {selectedCompany === "appleholidays"
              ? "Apple Holidays"
              : selectedCompany === "aahaas"
              ? "Aahaas"
              : selectedCompany === "shirmila"
              ? "Shirmila Travels"
              : ""}{" "}
            Finance Dashboard
          </h2>
          <small className="text-muted">
            Manage invoices, payments and financial reports
          </small>
        </Col>
        <Col md={4} className="d-flex align-items-center justify-content-end">
          <Dropdown className="me-2">
            <Dropdown.Toggle
              variant="outline-secondary"
              className="d-flex align-items-center"
            >
              {currency} {getCurrencySymbol()}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setCurrency("INR")}>
                INR (₹)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setCurrency("USD")}>
                USD ($)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setCurrency("EUR")}>
                EUR (€)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setCurrency("MYR")}>
                MYR (RM)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setCurrency("SGD")}>
                SGD (S$)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setCurrency("LKR")}>
                LKR (Rs)
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown className="me-2">
            <Dropdown.Toggle
              variant="outline-primary"
              className="d-flex align-items-center"
            >
              <FiCalendar className="me-2" />
              {dateFilter === "today" && "Today"}
              {dateFilter === "thisWeek" && "This Week"}
              {dateFilter === "thisMonth" && "This Month"}
              {dateFilter === "thisQuarter" && "This Quarter"}
              {dateFilter === "custom" && "Custom Range"}
              {dateFilter === "all" && "Date"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleDateFilterChange("all")}>
                All Time
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleDateFilterChange("today")}>
                Today
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleDateFilterChange("thisWeek")}>
                This Week
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => handleDateFilterChange("thisMonth")}
              >
                This Month
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => handleDateFilterChange("thisQuarter")}
              >
                This Quarter
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleDateFilterChange("custom")}>
                Custom Range
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown className="me-2">
            <Dropdown.Toggle
              variant="outline-primary"
              className="d-flex align-items-center"
            >
              <FiCreditCard className="me-2" />
              {paymentTypeFilter === "credit" && "Credit"}
              {paymentTypeFilter === "non-credit" && "Non-Credit"}
              {paymentTypeFilter === "all" && "Type"}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item
                onClick={() => handlePaymentTypeFilterChange("all")}
              >
                All Types
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => handlePaymentTypeFilterChange("credit")}
              >
                Credit
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => handlePaymentTypeFilterChange("non-credit")}
              >
                Non-Credit
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button
            variant="primary"
            className="d-flex align-items-center"
            onClick={fetchInvoices}
          >
            <FiRefreshCw className="me-2" />
            Refresh
          </Button>
        </Col>
      </Row>

   

      {/* Filter Summary */}
      {(dateFilter !== "all" || paymentTypeFilter !== "all") && (
        <Row className="mb-3">
          <Col>
            <Card className="shadow-sm">
              <Card.Body className="py-2">
                <div className="d-flex align-items-center">
                  <FiFilter className="me-2" />
                  <div>
                    {dateFilter !== "all" && (
                      <div>
                        <strong>Date:</strong>{" "}
                        {dateFilter === "today" && "Today"}
                        {dateFilter === "thisWeek" && "This Week"}
                        {dateFilter === "thisMonth" && "This Month"}
                        {dateFilter === "thisQuarter" && "This Quarter"}
                        {dateFilter === "custom" &&
                          `${customStartDate?.toLocaleDateString()} to ${customEndDate?.toLocaleDateString()}`}
                      </div>
                    )}
                    {paymentTypeFilter !== "all" && (
                      <div>
                        <strong>Type:</strong>{" "}
                        {paymentTypeFilter === "credit" && "Credit"}
                        {paymentTypeFilter === "non-credit" && "Non-Credit"}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="ms-auto"
                    onClick={clearAllFilters}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Quick Stats Row */}
      <Row className="mb-4">
        <Col xl={3} md={6}>
          <Card className="shadow-sm border-start border-primary border-4">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted mb-2">Total Invoices</h6>
                  <h3 className="mb-0">
                    {getCurrencySymbol()}
                    {convertCurrency(filteredStats.total).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </h3>
                  <small className="text-muted">
                    {filteredInvoices.length} invoices
                  </small>
                </div>
              </div>
              <ProgressBar
                now={(filteredStats.paid / (filteredStats.total || 1)) * 100}
                variant="success"
                className="mt-3"
                style={{ height: "6px" }}
              />
              <small className="text-muted">
                {filteredStats.total > 0
                  ? Math.round((filteredStats.paid / filteredStats.total) * 100)
                  : 0}
                % Paid
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="shadow-sm border-start border-success border-4">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted mb-2">Paid Invoices</h6>
                  <h3 className="mb-0">
                    {getCurrencySymbol()}
                    {convertCurrency(filteredStats.paid).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </h3>
                </div>
              </div>
              <div className="mt-3">
                <Badge bg="success" className="me-2">
                  +12%
                </Badge>
                <small className="text-muted">vs last period</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="shadow-sm border-start border-warning border-4">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted mb-2">Pending Invoices</h6>
                  <h3 className="mb-0">
                    {getCurrencySymbol()}
                    {convertCurrency(filteredStats.pending).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </h3>
                </div>
              </div>
              <div className="mt-3">
                <Badge bg="warning" className="me-2">
                  +5%
                </Badge>
                <small className="text-muted">vs last period</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="shadow-sm border-start border-danger border-4">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted mb-2">Overdue Invoices</h6>
                  <h3 className="mb-0">
                    {getCurrencySymbol()}
                    {convertCurrency(filteredStats.overdue).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </h3>
                </div>

                {/* Grace Period Selector */}
                <Form.Select
                  size="sm"
                  value={gracePeriod}
                  onChange={handleChange}
                  style={{ width: "100px" }}
                >
                  <option value={7}>7 days</option>
                  <option value={15}>15 days</option>
                  <option value={30}>30 days</option>
                  <option value={45}>45 days</option>
                </Form.Select>
              </div>
              <div className="mt-3">
                <Badge bg="danger" className="me-2">
                  +8%
                </Badge>
                <small className="text-muted">vs last period</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* PNL Summary */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">
                <FaChartLine className="me-2 text-info" />
                Profit & Loss Summary
              </h5>
              <Row>
                <Col md={4}>
                  <Card className="bg-light">
                    <Card.Body>
                      <h6>Total Revenue</h6>
                      <h4>
                        {getCurrencySymbol()}
                        {convertCurrency(
                          filteredPnlSummary.totalRevenue
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </h4>
                      <small className="text-muted">
                        {filteredPnlSummary.totalInvoicesWithPnl} invoices
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="bg-light">
                    <Card.Body>
                      <h6>Total Cost</h6>
                      <h4>
                        {getCurrencySymbol()}
                        {convertCurrency(
                          filteredPnlSummary.totalCost
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </h4>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="bg-light">
                    <Card.Body>
                      <h6>Total Profit</h6>
                      <h4>
                        {getCurrencySymbol()}
                        {convertCurrency(
                          filteredPnlSummary.totalProfit
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </h4>
                      <small className="text-muted">
                        {filteredPnlSummary.totalProfit > 0 ? (
                          <Badge bg="success">
                            {(
                              (filteredPnlSummary.totalProfit /
                                filteredPnlSummary.totalRevenue) *
                              100
                            ).toFixed(2)}
                            % Margin
                          </Badge>
                        ) : (
                          <Badge bg="danger">Loss</Badge>
                        )}
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <div className="mt-3">
                <small className="text-muted">
                  Based on {filteredPnlSummary.totalInvoicesWithPnl} invoices
                  with PNL data.
                  {filteredPnlSummary.totalInvoicesWithPnl <
                    filteredInvoices.length &&
                    ` (${
                      filteredInvoices.length -
                      filteredPnlSummary.totalInvoicesWithPnl
                    } invoices have no PNL data)`}
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

          {/* Apple Holidays Sync Stats Card - Only show for Apple Holidays */}
      {selectedCompany?.toLowerCase() === "appleholidays" || "aahaas" && (
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">
                    <FiCloud className="me-2 text-info" />
                    Apple Quotations Sync Status
                  </h5>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={triggerAppleSync}
                    disabled={syncLoading}
                  >
                    {syncLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <FiRefreshCw className="me-2" />
                        Sync Now
                      </>
                    )}
                  </Button>
                </div>
                
                <Row>
                  <Col md={3}>
                    <div className="text-center">
                      <h6 className="text-muted">Total Invoices</h6>
                      <h3 className="text-primary">{appleSyncStats.total_invoices}</h3>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h6 className="text-muted">Last Created</h6>
                      <h3 className="text-success">{appleSyncStats.sync_created}</h3>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h6 className="text-muted">Last Updated</h6>
                      <h3 className="text-warning">{appleSyncStats.sync_updated}</h3>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="text-center">
                      <h6 className="text-muted">Last Sync</h6>
                      <h5 className={appleSyncStats.last_sync_time === "Never" ? "text-danger" : "text-success"}>
                        {appleSyncStats.last_sync_time}
                      </h5>
                    </div>
                  </Col>
                </Row>

                {appleSyncStats.last_invoice && appleSyncStats.last_invoice.id > 0 && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <h6 className="mb-2">Latest Invoice</h6>
                    <div className="d-flex justify-content-between">
                      <span>Quotation #: {appleSyncStats.last_invoice.quotation_no}</span>
                      <span>ID: {appleSyncStats.last_invoice.id}</span>
                      <span>
                        Created: {appleSyncStats.last_invoice.created_at ? 
                          new Date(appleSyncStats.last_invoice.created_at).toLocaleDateString() : 
                          'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Content */}
      <Row>
        <Col md={4}>
          {/* Quick Actions Card */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">
                <FiPocket className="me-2 text-info" />
                Quick Actions
              </h5>
              <Link
                to="/invoice/create"
                className="btn btn-outline-primary w-50 mb-2 d-flex align-items-center"
              >
                <FiPlus className="me-2" />
                Create New Invoice
              </Link>
              <Link
                to="/invoice/pnl"
                className="btn btn-outline-success w-50 mb-2 d-flex align-items-center"
              >
                <FiPlus className="me-2" />P & L reports
              </Link>
              <Link
                to="/invoice/summary"
                className="btn btn-outline-secondary w-50 mb-2 d-flex align-items-center"
              >
                <FiPlus className="me-2" />
                Summary reports
              </Link>
              <Link
                to="/invoice/bank-accounts"
                className="btn btn-outline-info w-50 mb-2 d-flex align-items-center"
              >
                <FiPlus className="me-2" />
                Bank Accounts
              </Link>
            </Card.Body>
          </Card>

          {/* Company Specific Navigation */}
          {renderCompanySpecificNav()}
        </Col>

        <Col md={8}>
          {/* Recent Invoices Table */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Tab.Container defaultActiveKey="nonCredit">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Nav variant="tabs">
                    <Nav.Item>
                      <Nav.Link eventKey="nonCredit">
                        <FaReceipt className="me-2 text-primary" />
                        Non-Credit ({filteredNonCreditCount})
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="credit">
                        <FaCreditCard className="me-2 text-success" />
                        Credit ({filteredCreditCount})
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                  <Form.Control
                    type="text"
                    placeholder="Search invoices..."
                    style={{ width: "200px" }}
                    className="d-flex align-items-center"
                  />
                </div>

                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <Tab.Content>
                    {/* Non-Credit Invoices Tab */}
                    <Tab.Pane eventKey="nonCredit">
                      <Table hover responsive>
                        <thead>
                          <tr>
                            <th>Invoice #</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nonCreditInvoices.slice(0, 10).map((invoice) => (
                            <tr key={`noncredit-${invoice.id}`}>
                              <td>{invoice.invoice_number}</td>
                              <td>{invoice.customer?.name || "N/A"}</td>
                              <td>
                                {new Date(
                                  invoice.issue_date
                                ).toLocaleDateString()}
                              </td>
                              <td>
                                {getCurrencySymbol()}
                                {convertCurrency(
                                  invoice.total_amount
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td>{getStatusBadge(invoice)}</td>
                              <td>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0"
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab.Pane>

                    {/* Credit Invoices Tab */}
                    <Tab.Pane eventKey="credit">
                      <Table hover responsive>
                        <thead>
                          <tr>
                            <th>Invoice #</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditInvoices.slice(0, 10).map((invoice) => (
                            <tr key={`credit-${invoice.id}`}>
                              <td>{invoice.invoice_number}</td>
                              <td>{invoice.customer?.name || "N/A"}</td>
                              <td>
                                {new Date(
                                  invoice.issue_date
                                ).toLocaleDateString()}
                              </td>
                              <td>
                                {getCurrencySymbol()}
                                {convertCurrency(
                                  invoice.total_amount
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td>{getStatusBadge(invoice)}</td>
                              <td>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0"
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab.Pane>
                  </Tab.Content>
                )}

                <div className="d-flex justify-content-end mt-3">
                  <Button variant="link" className="text-decoration-none">
                    View All Invoices <FiChevronRight />
                  </Button>
                </div>
              </Tab.Container>
            </Card.Body>
          </Card>

          {/* Bank Accounts & Reconciliation */}
          {/* <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">
                <FiCreditCard className="me-2 text-info" />
                Bank Accounts & Reconciliation
              </h5>
              <Row>
                {filteredInvoices
                  .filter((inv) => inv.account)
                  .slice(0, 2)
                  .map((invoice) => (
                    <Col md={6} key={invoice.account.id}>
                      <div className="p-3 bg-light rounded mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">{invoice.account.bank}</h6>
                          <Badge bg="success">Active</Badge>
                        </div>
                        <small className="text-muted">
                          A/c No: ******{invoice.account.account_no.slice(-4)}
                        </small>
                        <div className="mt-2">
                          <span className="fw-bold">
                            {getCurrencySymbol()}
                            {convertCurrency(
                              invoice.total_amount
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <small className="text-muted ms-2">
                            Current Balance
                          </small>
                        </div>
                      </div>
                    </Col>
                  ))}
              </Row>
              <div className="d-flex justify-content-between mt-2">
                <Button variant="outline-primary" size="sm">
                  <FiRefreshCw className="me-1" />
                  Reconcile Now
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  className="text-decoration-none"
                >
                  View All Accounts <FiChevronRight />
                </Button>
              </div>
            </Card.Body>
          </Card> */}
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
