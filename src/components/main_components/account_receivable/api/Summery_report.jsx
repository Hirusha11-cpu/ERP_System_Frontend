import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  Table,
  Row,
  Col,
  Badge,
  Button,
  Form,
  ProgressBar,
  OverlayTrigger,
  Tooltip,
  ListGroup,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaSearch,
  FaChartBar,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaCalendarAlt,
  FaSyncAlt,
  FaPrint,
  FaDownload,
} from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

// Register Chart.js components
Chart.register(...registerables);

const Summery_report = ({ apiName }) => {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timePeriod, setTimePeriod] = useState("monthly");
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };
    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

  useEffect(() => {
    if (companyNo) fetchSummaryData();
  }, [companyNo, timePeriod]);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/summary-report", {
        params: { 
          company_id: companyNo,
          customer_name: apiName,
          period: timePeriod
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummaryData(response.data);
    } catch (error) {
      setError("Failed to fetch summary report. Please try again.");
      console.error("Error fetching summary data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge bg="success">Paid</Badge>;
      case "unpaid":
        return <Badge bg="danger">Unpaid</Badge>;
      case "partial":
        return <Badge bg="warning" text="dark">Partial</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const prepareChartData = () => {
    if (!summaryData?.monthly_breakdown) return null;

    const months = summaryData.monthly_breakdown.map(item => item.month);
    const paidAmounts = summaryData.monthly_breakdown.map(item => item.paid_amount);
    const unpaidAmounts = summaryData.monthly_breakdown.map(item => item.unpaid_amount);

    return {
      labels: months,
      datasets: [
        {
          label: 'Paid Amount',
          data: paidAmounts,
          backgroundColor: '#28a745',
        },
        {
          label: 'Unpaid Amount',
          data: unpaidAmounts,
          backgroundColor: '#dc3545',
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.raw, summaryData?.currency || 'USD')}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value, summaryData?.currency || 'USD');
          }
        }
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container py-4">
      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
          <h5 className="mb-0">
            <FaChartBar className="me-2" />
            {apiName} Summary Report
          </h5>
          <div className="d-flex">
            <Form.Select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              style={{ width: '150px' }}
              className="me-2"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </Form.Select>
            <Button variant="light" onClick={fetchSummaryData} className="me-2">
              <FaSyncAlt />
            </Button>
            <Button variant="light" onClick={handlePrint} className="me-2">
              <FaPrint />
            </Button>
            <Button variant="light">
              <FaDownload />
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading summary report...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : summaryData ? (
            <>
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Quick Stats</h6>
                    </Card.Header>
                    <Card.Body>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Total Invoices</span>
                          <Badge bg="primary">{summaryData.total_invoices}</Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Paid Invoices</span>
                          <Badge bg="success">{summaryData.paid_invoices}</Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Unpaid Invoices</span>
                          <Badge bg="danger">{summaryData.unpaid_invoices}</Badge>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Partially Paid</span>
                          <Badge bg="warning" text="dark">{summaryData.partial_invoices}</Badge>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Amounts</h6>
                    </Card.Header>
                    <Card.Body>
                      <ListGroup variant="flush">
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Total Amount</span>
                          <span className="fw-bold">
                            {formatCurrency(summaryData.total_amount, summaryData.currency)}
                          </span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Paid Amount</span>
                          <span className="fw-bold text-success">
                            {formatCurrency(summaryData.paid_amount, summaryData.currency)}
                          </span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Unpaid Amount</span>
                          <span className="fw-bold text-danger">
                            {formatCurrency(summaryData.unpaid_amount, summaryData.currency)}
                          </span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Avg. Payment Days</span>
                          <Badge bg="info">{summaryData.avg_payment_days}</Badge>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Payment Status</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-center mb-3">
                        <div style={{ width: '200px', height: '200px' }}>
                          {summaryData.payment_status_chart && (
                            <Pie
                              data={{
                                labels: ['Paid', 'Unpaid', 'Partial'],
                                datasets: [{
                                  data: [
                                    summaryData.paid_amount,
                                    summaryData.unpaid_amount,
                                    summaryData.partial_amount
                                  ],
                                  backgroundColor: [
                                    '#28a745',
                                    '#dc3545',
                                    '#ffc107'
                                  ],
                                }]
                              }}
                              options={{
                                plugins: {
                                  tooltip: {
                                    callbacks: {
                                      label: function(context) {
                                        const value = context.raw;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${context.label}: ${formatCurrency(value, summaryData.currency)} (${percentage}%)`;
                                      }
                                    }
                                  }
                                }
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={12}>
                  <Card>
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Monthly Breakdown</h6>
                    </Card.Header>
                    <Card.Body>
                      {summaryData.monthly_breakdown && (
                        <div style={{ height: '300px' }}>
                          <Bar data={prepareChartData()} options={chartOptions} />
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Card>
                    <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Recent Transactions</h6>
                      <small>Last 5 transactions</small>
                    </Card.Header>
                    <Card.Body>
                      <Table hover responsive>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Invoice No.</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Payment Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summaryData.recent_transactions?.map((transaction, index) => (
                            <tr key={index}>
                              <td>
                                <FaCalendarAlt className="me-2 text-muted" />
                                {transaction.date}
                              </td>
                              <td>{transaction.invoice_number}</td>
                              <td>
                                <FaMoneyBillWave className="me-2 text-muted" />
                                {formatCurrency(transaction.amount, transaction.currency)}
                              </td>
                              <td>{getStatusBadge(transaction.status)}</td>
                              <td>{transaction.payment_method}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <div className="text-center py-5">
              <FaChartBar size={48} className="text-muted mb-3" />
              <h5>No summary data available for {apiName}</h5>
              <p className="text-muted">Please check back later or contact support</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Summery_report;