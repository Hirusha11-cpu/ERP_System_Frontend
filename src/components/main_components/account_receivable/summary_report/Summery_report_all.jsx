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
  InputGroup,
} from "react-bootstrap";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import axios from "axios";
import { 
  FaDownload, 
  FaFilter, 
  FaSyncAlt, 
  FaChartLine, 
  FaFileExcel,
  FaFilePdf,
  FaSearch,
  FaMoneyBillWave,
  FaFileInvoiceDollar
} from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Summary_report_all = () => {
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountReceivables, setAccountReceivables] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "all",
    currency: "all",
    type: "all",
    searchTerm: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      fetchSummaryData();
    }
  }, [companyNo, filters, currentPage]);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch account receivables
      let arUrl = `/api/account-receivables?page=${currentPage}`;
      const params = [];
      if (filters.startDate) params.push(`start_date=${filters.startDate}`);
      if (filters.endDate) params.push(`end_date=${filters.endDate}`);
      if (filters.status !== 'all') params.push(`status=${filters.status}`);
      if (filters.currency !== 'all') params.push(`currency=${filters.currency}`);
      if (filters.searchTerm) params.push(`search=${filters.searchTerm}`);
      
      if (params.length > 0) {
        arUrl += `&${params.join('&')}`;
      }

      const arResponse = await axios.get(arUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const arData = arResponse.data.data || {};
      setAccountReceivables(arData.data || []);
      setTotalPages(arData.last_page || 1);

      // Fetch invoices for additional data
      const invoiceResponse = await axios.get(`/api/invoices?company_id=${companyNo}&per_page=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const invoiceData = invoiceResponse.data.data || [];
      setInvoices(Array.isArray(invoiceData) ? invoiceData : (invoiceData.data || []));

    } catch (error) {
      console.error("Error fetching summary data:", error);
      setError(
        error.response?.data?.message ||
          "Failed to fetch summary data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    if (!accountReceivables.length && !invoices.length) return {};

    let totalRevenue = 0;
    let totalAmountPaid = 0;
    let totalFinalDue = 0;
    let totalInvoices = invoices.length;
    let totalAccountReceivables = accountReceivables.length;
    let linkedInvoices = 0;
    let unlinkedInvoices = 0;

    const monthlyData = {};
    const currencyWiseData = {};
    const statusWiseData = {};

    // Process account receivables
    accountReceivables.forEach(ar => {
      const revenue = parseFloat(ar.invoice_amount) || 0;
      const amountPaid = parseFloat(ar.amount_paid) || 0;
      const finalDue = parseFloat(ar.final_due_amount_usd) || 0;
      
      totalRevenue += revenue;
      totalAmountPaid += amountPaid;
      totalFinalDue += finalDue;

      if (ar.invoice_id) {
        linkedInvoices++;
      } else {
        unlinkedInvoices++;
      }

      // Monthly breakdown
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

    // Process invoices for additional metrics
    let totalInvoiceAmount = 0;
    let totalAmountReceived = 0;
    let totalBalance = 0;
    let paidInvoices = 0;
    let draftInvoices = 0;

    invoices.forEach(invoice => {
      const invoiceAmount = parseFloat(invoice.total_amount) || 0;
      const amountReceived = parseFloat(invoice.amount_received) || 0;
      const balance = parseFloat(invoice.balance) || 0;
      
      totalInvoiceAmount += invoiceAmount;
      totalAmountReceived += amountReceived;
      totalBalance += balance;

      if (invoice.status === 'paid') paidInvoices++;
      if (invoice.status === 'draft') draftInvoices++;
    });

    // Calculate rates
    const collectionRate = totalRevenue > 0 ? (totalAmountPaid / totalRevenue) * 100 : 0;
    const outstandingRate = totalRevenue > 0 ? (totalFinalDue / totalRevenue) * 100 : 0;
    const invoiceCollectionRate = totalInvoiceAmount > 0 ? (totalAmountReceived / totalInvoiceAmount) * 100 : 0;

    return {
      summary: {
        totalRevenue,
        totalAmountPaid,
        totalFinalDue,
        totalInvoiceAmount,
        totalAmountReceived,
        totalBalance,
        collectionRate,
        outstandingRate,
        invoiceCollectionRate,
        totalInvoices,
        totalAccountReceivables,
        linkedInvoices,
        unlinkedInvoices,
        paidInvoices,
        draftInvoices,
      },
      monthlyData,
      currencyWiseData,
      statusWiseData,
    };
  };

  const summaryMetrics = calculateSummaryMetrics();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      status: "all",
      currency: "all",
      type: "all",
      searchTerm: "",
    });
    setCurrentPage(1);
  };

  const refreshData = () => {
    fetchSummaryData();
  };

  // Export to Excel (CSV)
  const exportToExcel = () => {
    const headers = [
      'Invoice Number', 
      'Customer Name', 
      'Invoice Amount', 
      'Amount Paid', 
      'Final Due Amount', 
      'Currency',
      'Status',
      'Linked Invoice',
      'Created Date',
      'Type'
    ];
    
    const csvData = accountReceivables.map(ar => [
      `"${ar.invoice_number}"`,
      `"${ar.customer_name || 'N/A'}"`,
      ar.invoice_amount || 0,
      ar.amount_paid || 0,
      ar.final_due_amount_usd || 0,
      ar.currency,
      ar.status,
      ar.invoice_id ? 'Yes' : 'No',
      new Date(ar.created_at).toLocaleDateString(),
      'Account Receivable'
    ]);

    // Add invoice data
    invoices.forEach(invoice => {
      csvData.push([
        `"${invoice.invoice_number}"`,
        `"${invoice.customer?.name || 'N/A'}"`,
        invoice.total_amount || 0,
        invoice.amount_received || 0,
        invoice.balance || 0,
        invoice.currency,
        invoice.status,
        'N/A',
        new Date(invoice.created_at).toLocaleDateString(),
        invoice.type || 'manual'
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Summary-Report-${selectedCompany}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text(`Summary Report - ${selectedCompany}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    // Summary Metrics
    doc.setFontSize(12);
    doc.text('Summary Metrics', 14, 35);
    
    const summaryData = [
      ['Total Revenue', formatCurrency(summaryMetrics.summary?.totalRevenue)],
      ['Amount Collected', formatCurrency(summaryMetrics.summary?.totalAmountPaid)],
      ['Outstanding Amount', formatCurrency(summaryMetrics.summary?.totalFinalDue)],
      ['Collection Rate', `${summaryMetrics.summary?.collectionRate?.toFixed(1)}%`],
      ['Total Invoices', summaryMetrics.summary?.totalInvoices],
      ['Account Receivables', summaryMetrics.summary?.totalAccountReceivables],
      ['Linked Invoices', summaryMetrics.summary?.linkedInvoices],
    ];

    doc.autoTable({
      startY: 40,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Account Receivables Table
    const arTableData = accountReceivables.slice(0, 20).map(ar => [
      ar.invoice_number,
      ar.customer_name || 'N/A',
      formatCurrency(ar.invoice_amount, ar.currency),
      formatCurrency(ar.amount_paid, ar.currency),
      formatCurrency(ar.final_due_amount_usd, ar.currency),
      ar.status,
      ar.invoice_id ? 'Yes' : 'No'
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Invoice #', 'Customer', 'Amount', 'Paid', 'Due', 'Status', 'Linked']],
      body: arTableData,
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96] },
    });

    doc.save(`Summary-Report-${selectedCompany}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "primary" : "outline-primary"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className="me-1"
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="d-flex justify-content-center mt-3">
        <Button
          variant="outline-primary"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="me-2"
        >
          Previous
        </Button>
        {pages}
        <Button
          variant="outline-primary"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="ms-2"
        >
          Next
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading Summary Report...</p>
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
            Comprehensive Summary Report
          </h2>
          <p className="text-muted mb-0">
            {selectedCompany ? `Company: ${selectedCompany}` : 'All Companies'} 
            <span className="ms-2">• Account Receivables & Invoices</span>
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={refreshData}>
            <FaSyncAlt className="me-2" />
            Refresh
          </Button>
          <Button variant="success" onClick={exportToExcel}>
            <FaFileExcel className="me-2" />
            Export Excel
          </Button>
          <Button variant="danger" onClick={exportToPDF}>
            <FaFilePdf className="me-2" />
            Export PDF
          </Button>
        </div>
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
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="draft">Draft</option>
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
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search by invoice number or customer name..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  />
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                </InputGroup>
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
      <Row className="mb-4 g-3">
        <Col md={3}>
          <Card className="border-0 bg-primary text-white shadow">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-title">Total Revenue</h6>
                  <h3 className="fw-bold mb-0">
                    {formatCurrency(summaryMetrics.summary?.totalRevenue)}
                  </h3>
                  <small>From {summaryMetrics.summary?.totalAccountReceivables} AR records</small>
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
                    {formatCurrency(summaryMetrics.summary?.totalAmountPaid)}
                  </h3>
                  <small>{summaryMetrics.summary?.collectionRate?.toFixed(1)}% collection rate</small>
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
                    {formatCurrency(summaryMetrics.summary?.totalFinalDue)}
                  </h3>
                  <small>{summaryMetrics.summary?.outstandingRate?.toFixed(1)}% outstanding</small>
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
                  <h6 className="card-title">Linked Records</h6>
                  <h3 className="fw-bold mb-0">
                    {summaryMetrics.summary?.linkedInvoices || 0}
                  </h3>
                  <small>of {summaryMetrics.summary?.totalAccountReceivables} total</small>
                </div>
                <div className="display-6 opacity-50">📊</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Account Receivables Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Account Receivables</h5>
          <Badge bg="primary">
            {accountReceivables.length} Records • Page {currentPage} of {totalPages}
          </Badge>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped hover>
              <thead className="table-light">
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Invoice Amount</th>
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
                      {/* {formatCurrency(ar.final_due_amount_usd, ar.currency)} */}
                      {formatCurrency(
  (Number(ar.invoice_amount) || 0) - (Number(ar.amount_paid) || 0),
  ar.currency
)}
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
          {renderPagination()}
        </Card.Body>
      </Card>

      {/* Quick Statistics */}
      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Status Distribution</h6>
            </Card.Header>
            <Card.Body>
              {Object.entries(summaryMetrics.statusWiseData || {}).map(([status, data]) => (
                <div key={status} className="d-flex justify-content-between align-items-center mb-2">
                  <span>
                    <Badge bg="secondary" className="me-2">{data.count}</Badge>
                    {status}
                  </span>
                  <span className="fw-bold">{formatCurrency(data.revenue)}</span>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Currency Distribution</h6>
            </Card.Header>
            <Card.Body>
              {Object.entries(summaryMetrics.currencyWiseData || {}).map(([currency, data]) => (
                <div key={currency} className="d-flex justify-content-between align-items-center mb-2">
                  <span>
                    <Badge bg="primary" className="me-2">{data.count}</Badge>
                    {currency}
                  </span>
                  <span className="fw-bold">{formatCurrency(data.revenue, currency)}</span>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Summary_report_all;