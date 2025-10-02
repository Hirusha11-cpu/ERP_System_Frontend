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
} from "react-bootstrap";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import axios from "axios";
import { FaDownload, FaFilter, FaSyncAlt, FaChartLine } from "react-icons/fa";

const Invoice_pnl = () => {
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "all",
    type: "all",
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
      fetchPNLData();
    }
  }, [companyNo, filters]);

  const fetchPNLData = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/invoices?company_id=${companyNo}`;
      
      // Add filters to URL
      const params = [];
      if (filters.startDate) params.push(`start_date=${filters.startDate}`);
      if (filters.endDate) params.push(`end_date=${filters.endDate}`);
      if (filters.status !== 'all') params.push(`status=${filters.status}`);
      if (filters.type !== 'all') params.push(`type=${filters.type}`);
      
      if (params.length > 0) {
        url += `&${params.join('&')}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const invoicesData = response.data.data || [];
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching PNL data:", error);
      setError(
        error.response?.data?.message ||
          "Failed to fetch PNL data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate P&L metrics
  const calculatePNLMetrics = () => {
    if (!invoices.length) return {};

    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalInvoices = 0;
    let paidInvoices = 0;
    let draftInvoices = 0;

    const monthlyData = {};
    const typeWiseData = {};

    invoices.forEach(invoice => {
      const revenue = parseFloat(invoice.total_amount) || 0;
      const cost = parseFloat(invoice.cost_of_invoices?.[0]?.total_tour_cost || invoice.cost_of_invoices?.[0]?.net_cost_amount || 0);
      const profit = parseFloat(invoice.profit?.profit || revenue - cost);
      
      totalRevenue += revenue;
      totalCost += cost;
      totalProfit += profit;
      totalInvoices++;

      // Status count
      if (invoice.status === 'paid') paidInvoices++;
      if (invoice.status === 'draft') draftInvoices++;

      // Monthly breakdown
      const month = new Date(invoice.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, cost: 0, profit: 0, count: 0 };
      }
      monthlyData[month].revenue += revenue;
      monthlyData[month].cost += cost;
      monthlyData[month].profit += profit;
      monthlyData[month].count++;

      // Type-wise breakdown
      const type = invoice.type || 'manual';
      if (!typeWiseData[type]) {
        typeWiseData[type] = { revenue: 0, cost: 0, profit: 0, count: 0 };
      }
      typeWiseData[type].revenue += revenue;
      typeWiseData[type].cost += cost;
      typeWiseData[type].profit += profit;
      typeWiseData[type].count++;
    });

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const profitMarkup = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return {
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin,
        profitMarkup,
        totalInvoices,
        paidInvoices,
        draftInvoices,
      },
      monthlyData,
      typeWiseData,
    };
  };

  const pnlMetrics = calculatePNLMetrics();

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
      type: "all",
    });
  };

  const exportToCSV = () => {
    const headers = [
      'Invoice Number', 'Issue Date', 'Customer', 'Type', 'Status',
      'Revenue', 'Cost', 'Profit', 'Profit Margin %', 'Currency'
    ];
    
    const csvData = invoices.map(invoice => [
      invoice.invoice_number,
      invoice.issue_date,
      invoice.customer?.name || 'N/A',
      invoice.type,
      invoice.status,
      invoice.total_amount,
      invoice.cost_of_invoices?.[0]?.total_tour_cost || invoice.cost_of_invoices?.[0]?.net_cost_amount || 0,
      invoice.profit?.profit || 0,
      invoice.profit?.profit_margin || 0,
      invoice.currency
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PNL-Report-${selectedCompany}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading P&L Report...</span>
          </Spinner>
          <p className="mt-2">Loading P&L Report...</p>
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
            <FaChartLine className="me-2" />
            Profit & Loss Report
          </h2>
          <p className="text-muted mb-0">
            {selectedCompany ? `Company: ${selectedCompany}` : 'All Companies'}
          </p>
        </div>
        <Button variant="success" onClick={exportToCSV}>
          <FaDownload className="me-2" />
          Export CSV
        </Button>
      </div>

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
                  <option value="draft">Draft</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <Row className="mb-4 g-3 d-none">
        <Col md={3}>
          <Card className="border-0 bg-primary text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Revenue</h6>
                  <h3 className="fw-bold">
                    {pnlMetrics.summary?.totalRevenue.toFixed(2)}
                  </h3>
                </div>
                <div className="display-4 opacity-50">
                  ₹
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 bg-warning text-dark">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Cost</h6>
                  <h3 className="fw-bold">
                    {pnlMetrics.summary?.totalCost.toFixed(2)}
                  </h3>
                </div>
                <div className="display-4 opacity-50">
                  ₹
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 bg-success text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Profit</h6>
                  <h3 className="fw-bold">
                    {pnlMetrics.summary?.totalProfit.toFixed(2)}
                  </h3>
                </div>
                <div className="display-4 opacity-50">
                  ₹
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 bg-info text-white">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Profit Margin</h6>
                  <h3 className="fw-bold">
                    {pnlMetrics.summary?.profitMargin.toFixed(1)}%
                  </h3>
                </div>
                <div className="display-4 opacity-50">
                  %
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Invoice Statistics */}
      <Row className="mb-4 g-3 d-none">
        <Col md={4}>
          <Card>
            <Card.Body className="text-center">
              <h6 className="text-muted">Total Invoices</h6>
              <h3 className="text-primary">{pnlMetrics.summary?.totalInvoices}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body className="text-center">
              <h6 className="text-muted">Paid Invoices</h6>
              <h3 className="text-success">{pnlMetrics.summary?.paidInvoices}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Body className="text-center">
              <h6 className="text-muted">Draft Invoices</h6>
              <h3 className="text-warning">{pnlMetrics.summary?.draftInvoices}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed P&L Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Detailed Profit & Loss Analysis</h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped hover>
              <thead className="table-light">
                <tr>
                  <th>Invoice #</th>
                  <th>Issue Date</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-end">Revenue</th>
                  <th className="text-end">Cost</th>
                  <th className="text-end">Profit</th>
                  <th className="text-end">Margin %</th>
                  <th>Currency</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const revenue = parseFloat(invoice.total_amount) || 0;
                  const cost = parseFloat(invoice.cost_of_invoices?.[0]?.total_tour_cost || invoice.cost_of_invoices?.[0]?.net_cost_amount || 0);
                  const profit = parseFloat(invoice.profit?.profit || revenue - cost);
                  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

                  return (
                    <tr key={invoice.id}>
                      <td>
                        <strong>{invoice.invoice_number}</strong>
                      </td>
                      <td>{new Date(invoice.issue_date).toLocaleDateString()}</td>
                      <td>{invoice.customer?.name || 'N/A'}</td>
                      <td>
                        <Badge bg={invoice.type === 'automatic' ? 'info' : 'secondary'}>
                          {invoice.type}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={
                          invoice.status === 'paid' ? 'success' :
                          invoice.status === 'draft' ? 'warning' : 'secondary'
                        }>
                          {invoice.status === "draft" ? "open" : invoice.status }
                        </Badge>
                      </td>
                      <td className="text-end">{revenue.toFixed(2)}</td>
                      <td className="text-end">{cost.toFixed(2)}</td>
                      <td className="text-end">
                        <span className={profit >= 0 ? 'text-success' : 'text-danger'}>
                          {profit.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-end">
                        <span className={margin >= 0 ? 'text-success' : 'text-danger'}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                      <td>{invoice.currency}</td>
                    </tr>
                  );
                })}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center text-muted py-4">
                      No invoices found for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Monthly Breakdown */}
      {Object.keys(pnlMetrics.monthlyData || {}).length > 0 && (
        <Card className="mt-4 shadow-sm">
          <Card.Header className="bg-light">
            <h5 className="mb-0">Monthly Breakdown</h5>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table striped hover>
                <thead className="table-light">
                  <tr>
                    <th>Month</th>
                    <th className="text-end">Invoices</th>
                    <th className="text-end">Revenue</th>
                    <th className="text-end">Cost</th>
                    <th className="text-end">Profit</th>
                    <th className="text-end">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(pnlMetrics.monthlyData).map(([month, data]) => {
                    const margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
                    return (
                      <tr key={month}>
                        <td><strong>{month}</strong></td>
                        <td className="text-end">{data.count}</td>
                        <td className="text-end">{data.revenue.toFixed(2)}</td>
                        <td className="text-end">{data.cost.toFixed(2)}</td>
                        <td className="text-end">
                          <span className={data.profit >= 0 ? 'text-success' : 'text-danger'}>
                            {data.profit.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-end">
                          <span className={margin >= 0 ? 'text-success' : 'text-danger'}>
                            {margin.toFixed(1)}%
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
      
    </Container>
  );
};

export default Invoice_pnl;