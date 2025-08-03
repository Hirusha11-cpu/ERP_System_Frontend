import React, { useState, useEffect, useContext , useRef} from "react";
import {
  Table,
  Card,
  Badge,
  Row,
  Col,
  Form,
  Button,
  Modal,
  ProgressBar,
  OverlayTrigger,
  Tooltip,
  Tab,
  Tabs,
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
} from "react-icons/fa";
import { Bar, Pie, Line } from "react-chartjs-2";
import Chart from 'chart.js/auto';

import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

const Invoice_summary = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([
    subDays(new Date(), 30),
    new Date(),
  ]);
  const [startDate, endDate] = dateRange;
  const [activeTab, setActiveTab] = useState("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch invoices and summary data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invoicesRes, summaryRes] = await Promise.all([
          axios.get(`/api/invoicesss/all?company_id=1`),
          axios.get(`/api/invoicess/summary?company_id=1`),
          //   axios.get(`/api/invoicess/all?company_id=${selectedCompany.id}`),
          //   axios.get(`/api/invoicess/summary?company_id=${selectedCompany.id}`)
        ]);
        console.log(invoicesRes.data);

        setInvoices(invoicesRes.data);

        console.log(invoicesRes.data, "Invoices xxxxx");
        setFilteredInvoices(invoicesRes.data);
        setSummaryData(summaryRes.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCompany) {
      fetchData();
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

      // Search term filter
      if (searchTerm) {
        results = results.filter(
          (invoice) =>
            invoice.invoice_number
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            invoice.customer.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        );
      }

      setFilteredInvoices(results);
    }
    // Date filter
  }, [invoices, searchTerm, startDate, endDate]);

    const BarChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
      if (chartRef.current && data) {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.labels,
            datasets: data.datasets
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.raw} ${selectedCompany?.currency || "USD"}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return `${value} ${selectedCompany?.currency || "USD"}`;
                  }
                }
              }
            }
          }
        });
      }

      return () => {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
      };
    }, [data, selectedCompany]);

    return <canvas ref={chartRef} />;
  };

  const PieChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
      if (chartRef.current && data) {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: data.labels,
            datasets: data.datasets
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'right',
              }
            }
          }
        });
      }

      return () => {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
      };
    }, [data]);

    return <canvas ref={chartRef} />;
  };

  const DoughnutChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
      if (chartRef.current && data) {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: data.labels,
            datasets: data.datasets
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'right',
              }
            }
          }
        });
      }

      return () => {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
      };
    }, [data]);

    return <canvas ref={chartRef} />;
  };

  // Chart data for profit analysis with null checks
  const profitChartData = {
    labels: summaryData?.monthly_profit?.map((item) => item.month) || [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
    ],
    datasets: [
      {
        label: "Revenue",
        data: summaryData?.monthly_profit?.map((item) => item.revenue) || [
          0, 0, 0, 0, 0, 0,
        ],
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Profit",
        data: summaryData?.monthly_profit?.map((item) => item.profit) || [
          0, 0, 0, 0, 0, 0,
        ],
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Chart data for country distribution with null checks
  const countryChartData = {
    labels: summaryData?.country_distribution?.map((item) => item.country) || [
      "No Data",
    ],
    datasets: [
      {
        data: summaryData?.country_distribution?.map((item) => item.count) || [
          1,
        ],
        backgroundColor: ["#FF6384"],
      },
    ],
  };

  // Chart data for refund analysis with null checks
  const refundChartData = {
    labels: ["Completed", "Pending", "Cancelled"],
    datasets: [
      {
        data: [
          summaryData?.refund_summary?.completed || 0,
          summaryData?.refund_summary?.pending || 0,
          summaryData?.refund_summary?.cancelled || 0,
        ],
        backgroundColor: ["#4BC0C0", "#FFCE56", "#FF6384"],
      },
    ],
  };

  // Handle view invoice details
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowModal(true);
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle export
  const handleExport = () => {
    // Export logic here
    alert("Export functionality would be implemented here");
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
          <Button
            variant="outline-primary"
            onClick={handlePrint}
            className="me-2"
          >
            <FaPrint className="me-1" /> Print
          </Button>
          <Button variant="outline-success" onClick={handleExport}>
            <FaDownload className="me-1" /> Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
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
            <Col md={4}>
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
            <Col md={4}>
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
                    onClick={() =>
                      setDateRange([
                        startOfMonth(new Date()),
                        endOfMonth(new Date()),
                      ])
                    }
                  >
                    This Month
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() =>
                      setDateRange([subDays(new Date(), 7), new Date()])
                    }
                  >
                    Last 7 Days
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-white bg-primary">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title>Total Revenue</Card.Title>
                  <h2>{summaryData?.total_amount || 0}</h2>
                  <small>{selectedCompany?.currency || "USD"}</small>
                </div>
                <FaChartLine size={40} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-success">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title>Total Profit</Card.Title>
                  <h2>{summaryData?.total_profit || 0}</h2>
                  <small>{selectedCompany?.currency || "USD"}</small>
                </div>
                <FaMoneyBillWave size={40} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-info">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title>Total Invoices</Card.Title>
                  <h2>{summaryData?.invoice_count || 0}</h2>
                  <small>{filteredInvoices.length} filtered</small>
                </div>
                <FaBuilding size={40} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-warning">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Card.Title>Refund Requests</Card.Title>
                  <h2>{summaryData?.total_refunds || 0}</h2>
                  <small>
                    {summaryData?.refund_summary?.pending || 0} pending
                  </small>
                </div>
                <FaChartPie size={40} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
      >

        <Tab eventKey="invoices" title="All Invoices">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <span>
                  <FaBuilding className="me-2" />
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
                      <td>
                        {format(new Date(invoice.issue_date), "MMM dd, yyyy")}
                      </td>
                      <td>
                        {invoice.total_amount} {invoice.currency}
                      </td>
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
                          {invoice.profit?.profit || 0} {invoice.currency}
                        </Badge>
                      </td>
                      <td>
                        {invoice.refund ? (
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip>
                                Refund: {invoice.refund.refund_status}
                              </Tooltip>
                            }
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
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice)}
                        >
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
                <Badge bg="danger">
                  {0} pending
                  {/* {summaryData?.refund_summary?.pending || 0} pending */}
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
                        <td>
                          {invoice.total_amount} {invoice.currency}
                        </td>
                        <td>
                          {invoice.refund.refund_amount} {invoice.currency}
                        </td>
                        <td>
                          <small>{invoice.refund.refund_reason}</small>
                        </td>
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
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                          >
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
      </Tabs>

      {/* Invoice Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Invoice Details: {selectedInvoice?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInvoice && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <h5>Customer Information</h5>
                  <p>
                    <strong>Name:</strong> {selectedInvoice.customer.name}
                  </p>
                  <p>
                    <strong>Address:</strong> {selectedInvoice.customer.address}
                  </p>
                  <p>
                    <strong>Contact:</strong> {selectedInvoice.customer.mobile}
                  </p>
                </Col>
                <Col md={6}>
                  <h5>Invoice Summary</h5>
                  <p>
                    <strong>Date:</strong>{" "}
                    {format(
                      new Date(selectedInvoice.issue_date),
                      "MMM dd, yyyy"
                    )}
                  </p>
                  <p>
                    <strong>Total Amount:</strong>{" "}
                    {selectedInvoice.total_amount} {selectedInvoice.currency}
                  </p>
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
                      {selectedInvoice.profit?.profit || 0}{" "}
                      {selectedInvoice.currency}
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
                      <td>
                        {item.price} {selectedInvoice.currency}
                      </td>
                      <td>{item.discount}%</td>
                      <td>
                        {item.total_amount} {selectedInvoice.currency}
                      </td>
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
                          <td>
                            {charge.amount} {selectedInvoice.currency}
                          </td>
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
                        <td>
                          <strong>Refund Amount</strong>
                        </td>
                        <td>
                          {selectedInvoice.refund.refund_amount}{" "}
                          {selectedInvoice.currency}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Reason</strong>
                        </td>
                        <td>{selectedInvoice.refund.refund_reason}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Status</strong>
                        </td>
                        <td>
                          <Badge
                            bg={
                              selectedInvoice.refund.refund_status ===
                              "confirmed"
                                ? "success"
                                : selectedInvoice.refund.refund_status ===
                                  "pending"
                                ? "warning"
                                : "danger"
                            }
                          >
                            {selectedInvoice.refund.refund_status}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Remark</strong>
                        </td>
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
          <Button variant="primary" onClick={() => setShowModal(false)}>
            Print
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Invoice_summary;
