import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  Table,
  Form,
  Row,
  Col,
  Button,
  Spinner,
  Badge,
  Accordion,
  Tab,
  Nav,
  Modal,
} from "react-bootstrap";
import {
  FaFilter,
  FaDownload,
  FaPrint,
  FaCalendarAlt,
  FaFileExcel,
  FaFilePdf,
  FaChartBar,
  FaSearch,
} from "react-icons/fa";
import { CompanyContext } from "../../../contentApi/CompanyProvider";
import axios from "axios";
import moment from "moment";

const Summary_report = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [loading, setLoading] = useState(true);
  const [companyNo, setCompanyNo] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    account: "",
    startDate: "",
    endDate: "",
    currency: "",
    status: "",
    customer: "",
    paymentType: "",
  });

  const currencies = ["USD", "LKR", "EUR", "GBP", "SGD", "INR"];
  const statuses = ["Open", "Paid", "Partial", "Cancelled"];
  const paymentTypes = ["credit", "non-credit"];

  useEffect(() => {
    fetchData();
    fetchAccounts();
  }, [selectedCompany]);

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
      fetchData(companyNo);
    }
  }, [companyNo]);

  const fetchData = async (companyId) => {
    setLoading(true);
    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      //   const response = await axios.get('/api/invoices', {
      //     headers: { Authorization: `Bearer ${token}` }
      //   });
      const response = await axios.get(
        `/api/invoices?company_id=${companyNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setInvoices(response.data.data);
      setFilteredData(response.data.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");
      const response = await axios.get("/api/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(response.data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, invoices]);

  const applyFilters = () => {
    let result = [...invoices];

    if (filters.account) {
      result = result.filter(
        (invoice) => invoice.account_id === parseInt(filters.account)
      );
    }

    if (filters.startDate) {
      result = result.filter(
        (invoice) => new Date(invoice.issue_date) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      result = result.filter(
        (invoice) => new Date(invoice.issue_date) <= new Date(filters.endDate)
      );
    }

    if (filters.currency) {
      result = result.filter(
        (invoice) => invoice.currency === filters.currency
      );
    }

    if (filters.status) {
      result = result.filter((invoice) => invoice.status === filters.status);
    }

    if (filters.customer) {
      result = result.filter((invoice) =>
        invoice.customer?.name
          .toLowerCase()
          .includes(filters.customer.toLowerCase())
      );
    }

    if (filters.paymentType) {
      result = result.filter(
        (invoice) => invoice.payment_type === filters.paymentType
      );
    }

    console.log(invoices);
    setFilteredData(result);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      account: "",
      startDate: "",
      endDate: "",
      currency: "",
      status: "",
      customer: "",
      paymentType: "",
    });
    setFilteredData(invoices);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return "success";
      case "Partial":
        return "warning";
      case "Open":
        return "danger";
      case "Cancelled":
        return "secondary";
      default:
        return "primary";
    }
  };

  const calculateSummary = () => {
    const summary = {
      totalInvoices: filteredData.length,
      totalAmount: 0,
      totalReceived: 0,
      totalBalance: 0,
      byCurrency: {},
      byStatus: {},
      byAccount: {},
    };

    filteredData.forEach((invoice) => {
      // Total amounts
      summary.totalAmount += parseFloat(invoice.total_amount) || 0;
      summary.totalReceived += parseFloat(invoice.amount_received) || 0;
      summary.totalBalance += parseFloat(invoice.balance) || 0;

      // By currency
      if (!summary.byCurrency[invoice.currency]) {
        summary.byCurrency[invoice.currency] = {
          count: 0,
          amount: 0,
          received: 0,
          balance: 0,
        };
      }
      summary.byCurrency[invoice.currency].count++;
      summary.byCurrency[invoice.currency].amount +=
        parseFloat(invoice.total_amount) || 0;
      summary.byCurrency[invoice.currency].received +=
        parseFloat(invoice.amount_received) || 0;
      summary.byCurrency[invoice.currency].balance +=
        parseFloat(invoice.balance) || 0;

      // By status
      if (!summary.byStatus[invoice.status]) {
        summary.byStatus[invoice.status] = {
          count: 0,
          amount: 0,
          received: 0,
          balance: 0,
        };
      }
      summary.byStatus[invoice.status].count++;
      summary.byStatus[invoice.status].amount +=
        parseFloat(invoice.total_amount) || 0;
      summary.byStatus[invoice.status].received +=
        parseFloat(invoice.amount_received) || 0;
      summary.byStatus[invoice.status].balance +=
        parseFloat(invoice.balance) || 0;

      // By account
      const accountName = invoice.account?.account_name || "Unknown";
      if (!summary.byAccount[accountName]) {
        summary.byAccount[accountName] = {
          count: 0,
          amount: 0,
          received: 0,
          balance: 0,
        };
      }
      summary.byAccount[accountName].count++;
      summary.byAccount[accountName].amount +=
        parseFloat(invoice.total_amount) || 0;
      summary.byAccount[accountName].received +=
        parseFloat(invoice.amount_received) || 0;
      summary.byAccount[accountName].balance +=
        parseFloat(invoice.balance) || 0;
    });

    return summary;
  };

  const summary = calculateSummary();

  const exportToExcel = () => {
    // Implement Excel export logic
    console.log("Exporting to Excel...");

    setShowExportModal(false);
  };

  const exportToPDF = () => {
    // Implement PDF export logic
    console.log("Exporting to PDF...");
    setShowExportModal(false);
  };

  return (
    <div className="summary-report">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5>Summary Report - {selectedCompany}</h5>
            <div>
              <Button
                variant={showFilters ? "primary" : "outline-primary"}
                onClick={() => setShowFilters(!showFilters)}
                className="me-2"
              >
                <FaFilter /> {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              <Button
                variant="outline-success"
                onClick={() => setShowExportModal(true)}
              >
                <FaDownload /> Export
              </Button>
            </div>
          </div>
        </Card.Header>

        {showFilters && (
          <Card.Body className="bg-light">
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Account</Form.Label>
                  <Form.Select
                    name="account"
                    value={filters.account}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Accounts</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.account_name} ({account.account_no})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Date From</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Date To</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Currency</Form.Label>
                  <Form.Select
                    name="currency"
                    value={filters.currency}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Currencies</option>
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Statuses</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Customer</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search customer..."
                    name="customer"
                    value={filters.customer}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Payment Type</Form.Label>
                  <Form.Select
                    name="paymentType"
                    value={filters.paymentType}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Types</option>
                    {paymentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Button
                  variant="outline-secondary"
                  onClick={resetFilters}
                  className="me-2"
                >
                  Reset Filters
                </Button>
                <Button variant="primary" onClick={applyFilters}>
                  <FaSearch /> Apply
                </Button>
              </Col>
            </Row>
          </Card.Body>
        )}

        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p>Loading report data...</p>
            </div>
          ) : (
            <Tab.Container defaultActiveKey="summary">
              <Row>
                <Col md={3}>
                  <Card className="mb-3">
                    <Card.Header>Quick Stats</Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <h6>Total Invoices</h6>
                        <h4>{summary.totalInvoices}</h4>
                      </div>
                      <div className="mb-3">
                        <h6>Total Amount</h6>
                        <h4>{summary.totalAmount.toFixed(2)}</h4>
                      </div>
                      <div className="mb-3">
                        <h6>Amount Received</h6>
                        <h4>{summary.totalReceived.toFixed(2)}</h4>
                      </div>
                      <div>
                        <h6>Balance</h6>
                        <h4>{summary.totalBalance.toFixed(2)}</h4>
                      </div>
                    </Card.Body>
                  </Card>

                  <Nav variant="pills" className="flex-column">
                    <Nav.Item>
                      <Nav.Link eventKey="summary">Summary</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="byCurrency">By Currency</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="byStatus">By Status</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="byAccount">By Account</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="details">Invoice Details</Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Col>
                <Col md={9}>
                  <Tab.Content>
                    <Tab.Pane eventKey="summary">
                      <Card>
                        <Card.Header>
                          <h5>Summary Overview</h5>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <h6>By Currency</h6>
                              <Table striped bordered size="sm">
                                <thead>
                                  <tr>
                                    <th>Currency</th>
                                    <th>Count</th>
                                    <th>Amount</th>
                                    <th>Received</th>
                                    <th>Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(summary.byCurrency).map(
                                    ([currency, data]) => (
                                      <tr key={currency}>
                                        <td>{currency}</td>
                                        <td>{data.count}</td>
                                        <td>{data.amount.toFixed(2)}</td>
                                        <td>{data.received.toFixed(2)}</td>
                                        <td>{data.balance.toFixed(2)}</td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </Table>
                            </Col>
                            <Col md={6}>
                              <h6>By Status</h6>
                              <Table striped bordered size="sm">
                                <thead>
                                  <tr>
                                    <th>Status</th>
                                    <th>Count</th>
                                    <th>Amount</th>
                                    <th>Received</th>
                                    <th>Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(summary.byStatus).map(
                                    ([status, data]) => (
                                      <tr key={status}>
                                        <td>
                                          <Badge bg={getStatusBadge(status)}>
                                            {status}
                                          </Badge>
                                        </td>
                                        <td>{data.count}</td>
                                        <td>{data.amount.toFixed(2)}</td>
                                        <td>{data.received.toFixed(2)}</td>
                                        <td>{data.balance.toFixed(2)}</td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </Table>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    <Tab.Pane eventKey="byCurrency">
                      <Card>
                        <Card.Header>
                          <h5>Breakdown by Currency</h5>
                        </Card.Header>
                        <Card.Body>
                          <Table striped bordered hover>
                            <thead>
                              <tr>
                                <th>Currency</th>
                                <th>Invoice Count</th>
                                <th>Total Amount</th>
                                <th>Amount Received</th>
                                <th>Balance</th>
                                <th>% of Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(summary.byCurrency).map(
                                ([currency, data]) => (
                                  <tr key={currency}>
                                    <td>{currency}</td>
                                    <td>{data.count}</td>
                                    <td>{data.amount.toFixed(2)}</td>
                                    <td>{data.received.toFixed(2)}</td>
                                    <td>{data.balance.toFixed(2)}</td>
                                    <td>
                                      {(
                                        (data.amount / summary.totalAmount) *
                                        100
                                      ).toFixed(2)}
                                      %
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    <Tab.Pane eventKey="byStatus">
                      <Card>
                        <Card.Header>
                          <h5>Breakdown by Status</h5>
                        </Card.Header>
                        <Card.Body>
                          <Table striped bordered hover>
                            <thead>
                              <tr>
                                <th>Status</th>
                                <th>Invoice Count</th>
                                <th>Total Amount</th>
                                <th>Amount Received</th>
                                <th>Balance</th>
                                <th>% of Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(summary.byStatus).map(
                                ([status, data]) => (
                                  <tr key={status}>
                                    <td>
                                      <Badge bg={getStatusBadge(status)}>
                                        {status}
                                      </Badge>
                                    </td>
                                    <td>{data.count}</td>
                                    <td>{data.amount.toFixed(2)}</td>
                                    <td>{data.received.toFixed(2)}</td>
                                    <td>{data.balance.toFixed(2)}</td>
                                    <td>
                                      {(
                                        (data.amount / summary.totalAmount) *
                                        100
                                      ).toFixed(2)}
                                      %
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    <Tab.Pane eventKey="byAccount">
                      <Card>
                        <Card.Header>
                          <h5>Breakdown by Account</h5>
                        </Card.Header>
                        <Card.Body>
                          <Table striped bordered hover>
                            <thead>
                              <tr>
                                <th>Account</th>
                                <th>Invoice Count</th>
                                <th>Total Amount</th>
                                <th>Amount Received</th>
                                <th>Balance</th>
                                <th>% of Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(summary.byAccount).map(
                                ([account, data]) => (
                                  <tr key={account}>
                                    <td>{account}</td>
                                    <td>{data.count}</td>
                                    <td>{data.amount.toFixed(2)}</td>
                                    <td>{data.received.toFixed(2)}</td>
                                    <td>{data.balance.toFixed(2)}</td>
                                    <td>
                                      {(
                                        (data.amount / summary.totalAmount) *
                                        100
                                      ).toFixed(2)}
                                      %
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>

                    <Tab.Pane eventKey="details">
                      <Card>
                        <Card.Header>
                          <div className="d-flex justify-content-between align-items-center">
                            <h5>Invoice Details</h5>
                            <small>
                              Showing {filteredData.length} of {invoices.length}{" "}
                              invoices
                            </small>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div className="table-responsive">
                            <Table striped bordered hover>
                              <thead>
                                <tr>
                                  <th>Invoice #</th>
                                  <th>Date</th>
                                  <th>Customer</th>
                                  <th>Account</th>
                                  <th>Currency</th>
                                  <th>Amount</th>
                                  <th>Received</th>
                                  <th>Balance</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredData.map((invoice) => (
                                  <tr key={invoice.id}>
                                    <td>{invoice.invoice_number}</td>
                                    <td>
                                      {moment(invoice.issue_date).format(
                                        "DD/MM/YYYY"
                                      )}
                                    </td>
                                    <td>{invoice.customer?.name || "N/A"}</td>
                                    <td>
                                      {invoice.account?.account_name || "N/A"}
                                    </td>
                                    <td>{invoice.currency}</td>
                                    <td>
                                      {parseFloat(invoice.total_amount).toFixed(
                                        2
                                      )}
                                    </td>
                                    <td>
                                      {parseFloat(
                                        invoice.amount_received
                                      ).toFixed(2)}
                                    </td>
                                    <td>
                                      {parseFloat(invoice.balance).toFixed(2)}
                                    </td>
                                    <td>
                                      <Badge
                                        bg={getStatusBadge(invoice.status)}
                                      >
                                        {invoice.status}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          )}
        </Card.Body>
      </Card>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Export Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Select Export Format</h5>
          <div className="d-grid gap-2">
            <Button variant="success" onClick={exportToExcel}>
              <FaFileExcel /> Export to Excel
            </Button>
            <Button variant="danger" onClick={exportToPDF}>
              <FaFilePdf /> Export to PDF
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Summary_report;
