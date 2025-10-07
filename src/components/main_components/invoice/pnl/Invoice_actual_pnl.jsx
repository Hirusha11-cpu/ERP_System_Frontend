import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Table,
  Button,
  Badge,
  Spinner,
  Container,
  Alert,
} from "react-bootstrap";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import axios from "axios";
import { 
  FaDownload, 
  FaFilter, 
  FaSyncAlt, 
  FaChartLine, 
  FaMoneyBillWave,
  FaFileInvoiceDollar
} from "react-icons/fa";

const Invoice_actual_pnl = () => {
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountReceivables, setAccountReceivables] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "all",
    currency: "all",
  });

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
      fetchActualPNLData();
    }
  }, [companyNo, filters]);

  const fetchActualPNLData = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/account-receivables`;
      
      // Add filters to URL
      const params = [`company_id=${companyNo}`];
      if (filters.startDate) params.push(`start_date=${filters.startDate}`);
      if (filters.endDate) params.push(`end_date=${filters.endDate}`);
      if (filters.status !== 'all') params.push(`status=${filters.status}`);
      if (filters.currency !== 'all') params.push(`currency=${filters.currency}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle both array and object response formats
      const data = response.data.data || response.data || [];
      const receivablesData = Array.isArray(data) ? data : (data.data || []);
      
      setAccountReceivables(receivablesData);
    } catch (error) {
      console.error("Error fetching actual PNL data:", error);
      setError(
        error.response?.data?.message ||
          "Failed to fetch actual P&L data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate P&L metrics based on account receivables
  const calculateActualPNLMetrics = () => {
    if (!accountReceivables.length) return {};

    let totalRevenue = 0;
    let totalAmountPaid = 0;
    let totalFinalDue = 0;
    let totalInvoices = 0;
    let linkedInvoices = 0;
    let unlinkedInvoices = 0;

    const monthlyData = {};
    const currencyWiseData = {};
    const statusWiseData = {};

    accountReceivables.forEach(ar => {
      // Use invoice_amount as revenue (primary revenue source)
      const revenue = parseFloat(ar.invoice_amount) || 0;
      const amountPaid = parseFloat(ar.amount_paid) || 0;
      const finalDue = parseFloat(ar.final_due_amount_usd) || 0;
      
      totalRevenue += revenue;
      totalAmountPaid += amountPaid;
      totalFinalDue += finalDue;
      totalInvoices++;

      // Count linked vs unlinked
      if (ar.invoice_id) {
        linkedInvoices++;
      } else {
        unlinkedInvoices++;
      }

      // Monthly breakdown - use created_at as date reference
      const month = new Date(ar.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      if (!monthlyData[month]) {
        monthlyData[month] = { 
          revenue: 0, 
          amountPaid: 0, 
          finalDue: 0, 
          count: 0 
        };
      }
      monthlyData[month].revenue += revenue;
      monthlyData[month].amountPaid += amountPaid;
      monthlyData[month].finalDue += finalDue;
      monthlyData[month].count++;

      // Currency-wise breakdown
      const currency = ar.currency || 'USD';
      if (!currencyWiseData[currency]) {
        currencyWiseData[currency] = { 
          revenue: 0, 
          amountPaid: 0, 
          finalDue: 0, 
          count: 0 
        };
      }
      currencyWiseData[currency].revenue += revenue;
      currencyWiseData[currency].amountPaid += amountPaid;
      currencyWiseData[currency].finalDue += finalDue;
      currencyWiseData[currency].count++;

      // Status-wise breakdown
      const status = ar.status || 'pending';
      if (!statusWiseData[status]) {
        statusWiseData[status] = { 
          revenue: 0, 
          amountPaid: 0, 
          finalDue: 0, 
          count: 0 
        };
      }
      statusWiseData[status].revenue += revenue;
      statusWiseData[status].amountPaid += amountPaid;
      statusWiseData[status].finalDue += finalDue;
      statusWiseData[status].count++;
    });

    // Calculate collection efficiency
    const collectionRate = totalRevenue > 0 ? (totalAmountPaid / totalRevenue) * 100 : 0;
    const outstandingRate = totalRevenue > 0 ? (totalFinalDue / totalRevenue) * 100 : 0;

    return {
      summary: {
        totalRevenue,
        totalAmountPaid,
        totalFinalDue,
        collectionRate,
        outstandingRate,
        totalInvoices,
        linkedInvoices,
        unlinkedInvoices,
      },
      monthlyData,
      currencyWiseData,
      statusWiseData,
    };
  };

  const pnlMetrics = calculateActualPNLMetrics();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      status: "all",
      currency: "all",
    });
  };

  const refreshData = () => {
    fetchActualPNLData();
  };

  const exportToCSV = () => {
    const headers = [
      'Invoice Number', 
      'Customer Name', 
      'Invoice Amount (Revenue)', 
      'Amount Paid', 
      'Final Due Amount', 
      'Currency',
      'Status',
      'Linked Invoice',
      'Created Date'
    ];
    
    const csvData = accountReceivables.map(ar => [
      ar.invoice_number,
      ar.customer_name || 'N/A',
      ar.invoice_amount || 0,
      ar.amount_paid || 0,
      ar.final_due_amount_usd || 0,
      ar.currency,
      ar.status,
      ar.invoice_id ? 'Yes' : 'No',
      new Date(ar.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Actual-PNL-Report-${selectedCompany}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Empty cost function for future implementation
  const calculateCosts = () => {
    // This function will be implemented when cost data is available
    return {
      totalCost: 0,
      costBreakdown: {}
    };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      paid: { variant: "success", label: "Paid" },
      pending: { variant: "warning", label: "Pending" },
      overdue: { variant: "danger", label: "Overdue" },
      draft: { variant: "secondary", label: "Draft" },
    };
    
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge bg={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading Actual P&L Report...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-primary mb-1">
            <FaMoneyBillWave className="me-2" />
            Actual P&L Report (Account Receivables)
          </h2>
          <p className="text-muted mb-0">
            {selectedCompany ? `Company: ${selectedCompany}` : 'All Companies'} 
            <span className="ms-2">• Revenue Focus</span>
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={refreshData}>
            <FaSyncAlt className="me-2" />
            Refresh
          </Button>
          <Button variant="success" onClick={exportToCSV}>
            <FaDownload className="me-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert variant="info" className="mb-4">
        <strong>Note:</strong> This report shows actual revenue from account receivables. 
        Cost calculations will be added in future updates. Currently focusing on revenue recognition.
      </Alert>

      {/* Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FaFilter className="me-2" />
            Filters
          </h5>
          <Button variant="outline-secondary" size="sm" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Currency</Form.Label>
                <Form.Select
                  value={filters.currency}
                  onChange={(e) => handleFilterChange('currency', e.target.value)}
                >
                  <option value="all">All Currencies</option>
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="LKR">LKR</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {/* <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-0 bg-primary text-white shadow">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Total Revenue</h6>
                  <h3 className="fw-bold mb-0">
                    {formatCurrency(pnlMetrics.summary?.totalRevenue)}
                  </h3>
                  <small>From {pnlMetrics.summary?.totalInvoices} invoices</small>
                </div>
                <FaFileInvoiceDollar className="display-6 opacity-50" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 bg-success text-white shadow">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Amount Collected</h6>
                  <h3 className="fw-bold mb-0">
                    {formatCurrency(pnlMetrics.summary?.totalAmountPaid)}
                  </h3>
                  <small>{pnlMetrics.summary?.collectionRate?.toFixed(1)}% collection rate</small>
                </div>
                <FaMoneyBillWave className="display-6 opacity-50" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 bg-warning text-dark shadow">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Outstanding</h6>
                  <h3 className="fw-bold mb-0">
                    {formatCurrency(pnlMetrics.summary?.totalFinalDue)}
                  </h3>
                  <small>{pnlMetrics.summary?.outstandingRate?.toFixed(1)}% outstanding</small>
                </div>
                <FaChartLine className="display-6 opacity-50" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 bg-info text-white shadow">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Linked Invoices</h6>
                  <h3 className="fw-bold mb-0">
                    {pnlMetrics.summary?.linkedInvoices || 0}
                  </h3>
                  <small>of {pnlMetrics.summary?.totalInvoices} total</small>
                </div>
                <div className="display-6 opacity-50">📊</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row> */}

      {/* Detailed Revenue Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Revenue Details (Account Receivables)</h5>
          <Badge bg="primary">
            {accountReceivables.length} Records
          </Badge>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped hover>
              <thead className="table-light">
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Invoice Amount (Revenue)</th>
                  <th>Amount Paid</th>
                  <th>Final Due</th>
                  <th>Status</th>
                  {/* <th>Linked</th> */}
                  <th>Currency</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {accountReceivables.map((ar) => (
                  <tr key={ar.id}>
                    <td>
                      <strong>{ar.invoice_number}</strong>
                    </td>
                    <td>{ar.customer_name || 'N/A'}</td>
                    <td className="fw-bold text-success">
                      {formatCurrency(ar.invoice_amount, ar.currency)}
                    </td>
                    <td className={ar.amount_paid > 0 ? 'text-success' : ''}>
                      {formatCurrency(ar.amount_paid, ar.currency)}
                    </td>
                    <td className={ar.final_due_amount_usd > 0 ? 'text-warning' : ''}>
                      {formatCurrency(ar.final_due_amount_usd, ar.currency)}
                    </td>
                    <td>
                      {getStatusBadge(ar.status)}
                    </td>
                    {/* <td>
                      <Badge bg={ar.invoice_id ? 'success' : 'secondary'}>
                        {ar.invoice_id ? 'Linked' : 'Unlinked'}
                      </Badge>
                    </td> */}
                    <td>
                      <Badge bg="dark">{ar.currency}</Badge>
                    </td>
                    <td>
                      {new Date(ar.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {accountReceivables.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      No account receivables found for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Monthly Revenue Breakdown */}
      {Object.keys(pnlMetrics.monthlyData || {}).length > 0 && (
        <Card className="mt-4 shadow-sm">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Monthly Revenue Breakdown</h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table striped hover>
                <thead className="table-light">
                  <tr>
                    <th>Month</th>
                    <th className="text-end">Invoices</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">Amount Collected</th>
                    <th className="text-end">Outstanding</th>
                    <th className="text-end">Collection Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(pnlMetrics.monthlyData).map(([month, data]) => {
                    const collectionRate = data.revenue > 0 ? (data.amountPaid / data.revenue) * 100 : 0;
                    return (
                      <tr key={month}>
                        <td><strong>{month}</strong></td>
                        <td className="text-end">{data.count}</td>
                        <td className="text-end fw-bold text-success">
                          {formatCurrency(data.revenue)}
                        </td>
                        <td className="text-end text-success">
                          {formatCurrency(data.amountPaid)}
                        </td>
                        <td className="text-end text-warning">
                          {formatCurrency(data.finalDue)}
                        </td>
                        <td className="text-end">
                          <span className={collectionRate >= 50 ? 'text-success' : 'text-warning'}>
                            {collectionRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Currency-wise Breakdown */}
      {Object.keys(pnlMetrics.currencyWiseData || {}).length > 0 && (
        <Card className="mt-4 shadow-sm">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Currency-wise Breakdown</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(pnlMetrics.currencyWiseData).map(([currency, data]) => (
                <Col md={4} key={currency} className="mb-3">
                  <Card>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{currency}</h6>
                          <small className="text-muted">{data.count} invoices</small>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-success">
                            {formatCurrency(data.revenue, currency)}
                          </div>
                          <small className="text-muted">Revenue</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default Invoice_actual_pnl;