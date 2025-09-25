import React, { useState, useEffect, useContext } from "react";
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
  Alert,
  InputGroup,
  Spinner,
  Dropdown,
  Tabs,
  Tab,
  Pagination
} from "react-bootstrap";
import {
  FaFilter,
  FaSearch,
  FaChartLine,
  FaChartPie,
  FaMoneyBillWave,
  FaInfoCircle,
  FaEye,
  FaCalculator,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileExcel,
  FaFilePdf,
  FaDollarSign,
  FaPercent,
  FaCalendarAlt,
  FaBuilding,
  FaFileInvoiceDollar,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaChartBar,
  FaUsers,
  FaReceipt
} from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const Invoice_pnl = () => {
  const [pnlData, setPnlData] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    days: 30,
    company_id: "",
    start_date: "",
    end_date: "",
    status: ""
  });
  const [searchInvoice, setSearchInvoice] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { selectedCompany } = useContext(CompanyContext);
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // Currency symbols mapping
  const currencySymbols = {
    USD: "$",
    INR: "₹",
    LKR: "Rs",
    SGD: "S$",
    MYR: "RM"
  };

  // Fetch P&L data
  const fetchPnlData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      if (filters.days) params.append('days', filters.days);
      if (filters.company_id) params.append('company_id', filters.company_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.status) params.append('status', filters.status);

      const response = await axios.get(`/api/pnl/invoices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPnlData(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch P&L data");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch P&L data");
      console.error("Error fetching P&L data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual invoice P&L details
  const fetchInvoicePnl = async (invoiceNumber) => {
    console.log("Fetching P&L for invoice:", invoiceNumber);
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/${invoiceNumber.invoice_id}/pnl`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setInvoiceDetails(response.data.data);
        setShowInvoiceModal(true);
      }
    } catch (err) {
      setError("Failed to fetch invoice P&L details");
      console.error("Error fetching invoice P&L:", err);
    } finally {
      setLoading(false);
    }
  };

  // Search invoice by number
  const handleSearchInvoice = async () => {
    if (!searchInvoice.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/invoices/${searchInvoice}/pnl`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedInvoice({
          invoice_number: searchInvoice,
          ...response.data.data
        });
        setShowInvoiceModal(true);
      } else {
        setError("Invoice not found");
      }
    } catch (err) {
      setError("Invoice not found or P&L data unavailable");
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!pnlData?.invoices) return;

    const worksheet = XLSX.utils.json_to_sheet(pnlData.invoices.map(invoice => ({
      'Invoice Number': invoice.invoice_number,
      'Issue Date': new Date(invoice.issue_date).toLocaleDateString(),
      'Customer': invoice.customer_name,
      'Revenue': invoice.pnl_details.total_revenue,
      'Cost': invoice.pnl_details.total_cost,
      'Profit/Loss': invoice.pnl_details.profit_loss,
      'Profit Margin (%)': invoice.pnl_details.profit_margin,
      'Profit Markup (%)': invoice.pnl_details.profit_markup,
      'Currency': invoice.currency
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "P&L Report");
    XLSX.writeFile(workbook, `pnl-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!pnlData?.invoices) return;

    const doc = new jsPDF();
    doc.text("Profit & Loss Report", 20, 20);
    
    const tableData = pnlData.invoices.map(invoice => [
      invoice.invoice_number,
      new Date(invoice.issue_date).toLocaleDateString(),
      invoice.customer_name,
      `${currencySymbols[invoice.currency] || invoice.currency} ${invoice.pnl_details.total_revenue.toFixed(2)}`,
      `${currencySymbols[invoice.currency] || invoice.currency} ${invoice.pnl_details.total_cost.toFixed(2)}`,
      `${currencySymbols[invoice.currency] || invoice.currency} ${invoice.pnl_details.profit_loss.toFixed(2)}`,
      `${invoice.pnl_details.profit_margin.toFixed(2)}%`
    ]);

    doc.autoTable({
      head: [['Invoice', 'Date', 'Customer', 'Revenue', 'Cost', 'P&L', 'Margin']],
      body: tableData,
      startY: 30,
    });

    doc.save(`pnl-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return `${currencySymbols[currency] || currency} ${parseFloat(amount).toFixed(2)}`;
  };

  // Get profit/loss badge variant
  const getProfitBadgeVariant = (profit) => {
    return profit >= 0 ? "success" : "danger";
  };

  // Get profit/loss icon
  const getProfitIcon = (profit) => {
    return profit >= 0 ? <FaArrowUp /> : <FaArrowDown />;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = pnlData?.invoices?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = Math.ceil((pnlData?.invoices?.length || 0) / itemsPerPage);

  // Initialize with company context
  useEffect(() => {
    if (selectedCompany) {
      const companyMap = {
        appleholidays: 2,
        aahaas: 3,
        shirmila: 1,
      };
      setFilters(prev => ({
        ...prev,
        company_id: companyMap[selectedCompany?.toLowerCase()] || 3
      }));
    }
  }, [selectedCompany]);

  // Fetch data when filters change
  useEffect(() => {
    fetchPnlData();
  }, [filters.days, filters.company_id]);

  if (loading && !pnlData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading P&L Data...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <FaChartLine className="me-2 text-primary" />
                Profit & Loss Dashboard
              </h2>
              <p className="text-muted mb-0">Comprehensive view of invoice profitability and cost analysis</p>
            </div>
            <div className="d-flex gap-2">
              <Dropdown>
                <Dropdown.Toggle variant="outline-primary">
                  <FaFileExcel className="me-2 text-success" />
                  Export
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={exportToExcel}>
                    <FaFileExcel className="me-2 text-success" />
                    Export to Excel
                  </Dropdown.Item>
                  <Dropdown.Item onClick={exportToPDF}>
                    <FaFilePdf className="me-2 text-danger" />
                    Export to PDF
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Button variant="primary" onClick={fetchPnlData}>
                <FaSync className="me-2" />
                Refresh
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Search and Filters */}
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaFilter className="me-2" />
              Filters & Search
            </h5>
            <Badge bg="primary" pill>
              {pnlData?.summary?.total_invoices || 0} invoices
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Label>Time Period</Form.Label>
              <Form.Select
                value={filters.days}
                onChange={(e) => setFilters({ ...filters, days: e.target.value })}
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={365}>Last 365 Days</option>
                <option value="custom">Custom Range</option>
              </Form.Select>
            </Col>
            
            {filters.days === 'custom' && (
              <>
                <Col md={3}>
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  />
                </Col>
              </>
            )}

            <Col md={3}>
              <Form.Label>Invoice Search</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Enter invoice number..."
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchInvoice()}
                />
                <Button variant="primary" onClick={handleSearchInvoice}>
                  <FaSearch />
                </Button>
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {pnlData?.summary && (
        <Row className="mb-4">
          <Col xl={3} lg={6} className="mb-3">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title text-muted mb-2">Total Revenue</h6>
                    <h3 className="text-primary mb-0">
                      {formatCurrency(pnlData.summary.total_revenue)}
                    </h3>
                    <small className="text-muted">{pnlData.summary.total_invoices} invoices</small>
                  </div>
                  <div className="bg-primary rounded-circle p-3">
                    <FaDollarSign size={24} className="text-white" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} className="mb-3">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title text-muted mb-2">Total Cost</h6>
                    <h3 className="text-warning mb-0">
                      {formatCurrency(pnlData.summary.total_cost)}
                    </h3>
                    <small className="text-muted">
                      {pnlData.summary.total_revenue > 0 ? 
                        `${((pnlData.summary.total_cost / pnlData.summary.total_revenue) * 100).toFixed(1)}% of revenue` 
                        : 'N/A'}
                    </small>
                  </div>
                  <div className="bg-warning rounded-circle p-3">
                    <FaCalculator size={24} className="text-white" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} className="mb-3">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title text-muted mb-2">Net Profit</h6>
                    <h3 className={pnlData.summary.total_profit_loss >= 0 ? "text-success" : "text-danger"}>
                      {formatCurrency(pnlData.summary.total_profit_loss)}
                    </h3>
                    <small className="text-muted">
                      <Badge bg={getProfitBadgeVariant(pnlData.summary.total_profit_loss)}>
                        {getProfitIcon(pnlData.summary.total_profit_loss)}
                        {pnlData.summary.overall_profit_margin.toFixed(1)}% margin
                      </Badge>
                    </small>
                  </div>
                  <div className={`rounded-circle p-3 ${pnlData.summary.total_profit_loss >= 0 ? "bg-success" : "bg-danger"}`}>
                    <FaChartLine size={24} className="text-white" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={3} lg={6} className="mb-3">
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title text-muted mb-2">Profitability</h6>
                    <h3 className="text-info mb-0">
                      {pnlData.summary.overall_profit_margin.toFixed(1)}%
                    </h3>
                    <div className="mt-2">
                      <ProgressBar 
                        variant={pnlData.summary.overall_profit_margin >= 0 ? "success" : "danger"}
                        now={Math.min(Math.abs(pnlData.summary.overall_profit_margin), 100)} 
                        max={100}
                        style={{ height: '6px' }}
                      />
                    </div>
                  </div>
                  <div className="bg-info rounded-circle p-3">
                    <FaPercent size={24} className="text-white" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Invoices Table */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FaFileInvoiceDollar className="me-2" />
              Invoice Profitability Analysis
            </h5>
            <div>
              <Badge bg="light" text="dark" className="me-2">
                Page {currentPage} of {totalPages}
              </Badge>
              <Badge bg="primary" pill>
                {pnlData?.invoices?.length || 0} records
              </Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                  <th>Profit/Loss</th>
                  <th>Margin</th>
                  <th>Markup</th>
                  <th>Currency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentInvoices.map((invoice) => (
                  <tr key={invoice.invoice_id}>
                    <td>
                      <strong>{invoice.invoice_number}</strong>
                    </td>
                    <td>
                      <small>{new Date(invoice.issue_date).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <div className="text-truncate" style={{ maxWidth: '150px' }} title={invoice.customer_name}>
                        {invoice.customer_name}
                      </div>
                    </td>
                    <td>
                      <strong>{formatCurrency(invoice.pnl_details.total_revenue, invoice.currency)}</strong>
                    </td>
                    <td>
                      <span className={invoice.pnl_details.total_cost > 0 ? "text-warning" : "text-muted"}>
                        {formatCurrency(invoice.pnl_details.total_cost, invoice.currency)}
                      </span>
                    </td>
                    <td>
                      <Badge bg={getProfitBadgeVariant(invoice.pnl_details.profit_loss)}>
                        {getProfitIcon(invoice.pnl_details.profit_loss)}
                        {formatCurrency(invoice.pnl_details.profit_loss, invoice.currency)}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className={invoice.pnl_details.profit_margin >= 0 ? "text-success" : "text-danger"}>
                          {invoice.pnl_details.profit_margin.toFixed(1)}%
                        </span>
                        <ProgressBar 
                          variant={invoice.pnl_details.profit_margin >= 0 ? "success" : "danger"}
                          now={Math.min(Math.abs(invoice.pnl_details.profit_margin), 100)} 
                          max={100}
                          style={{ width: '60px', height: '4px', marginLeft: '8px' }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className={invoice.pnl_details.profit_markup >= 0 ? "text-info" : "text-danger"}>
                        {invoice.pnl_details.profit_markup.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <Badge bg="outline-secondary" style={{ color: "black"}}>{invoice.currency}</Badge>
                    </td>
                    <td>
                      <OverlayTrigger overlay={<Tooltip>View detailed P&L analysis</Tooltip>}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => fetchInvoicePnl(invoice)}
                        >
                          <FaEye className="me-1" />
                          Details
                        </Button>
                      </OverlayTrigger>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          
          {(!pnlData?.invoices || pnlData.invoices.length === 0) && (
            <div className="text-center py-5">
              <FaChartLine size={48} className="text-muted mb-3" />
              <h5>No P&L data available</h5>
              <p className="text-muted">Try adjusting your filters or check back later.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                <Pagination.First 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1} 
                />
                <Pagination.Prev 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                  disabled={currentPage === 1} 
                />
                
                {[...Array(totalPages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                />
                <Pagination.Last 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages} 
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Invoice Details Modal */}
      <Modal show={showInvoiceModal} onHide={() => setShowInvoiceModal(false)} size="xl">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <FaChartLine className="me-2" />
            Detailed P&L Analysis - {selectedInvoice?.invoice_number || invoiceDetails?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {invoiceDetails ? (
            <Tabs defaultActiveKey="summary" className="mb-3">
              <Tab eventKey="summary" title={
                <span>
                  <FaChartBar className="me-1" />
                  Financial Summary
                </span>
              }>
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Header className="bg-light">
                        <h6 className="mb-0">Profit & Loss Summary</h6>
                      </Card.Header>
                      <Card.Body>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td><strong>Total Revenue:</strong></td>
                              <td className="text-end text-success">
                                {formatCurrency(invoiceDetails.total_revenue, invoiceDetails.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Total Cost:</strong></td>
                              <td className="text-end text-warning">
                                {formatCurrency(invoiceDetails.total_cost, invoiceDetails.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Net Profit/Loss:</strong></td>
                              <td className="text-end">
                                <Badge bg={getProfitBadgeVariant(invoiceDetails.profit_loss)}>
                                  {formatCurrency(invoiceDetails.profit_loss, invoiceDetails.currency)}
                                </Badge>
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Profit Margin:</strong></td>
                              <td className="text-end">
                                <Badge bg={invoiceDetails.profit_margin >= 0 ? "success" : "danger"}>
                                  {invoiceDetails.profit_margin.toFixed(2)}%
                                </Badge>
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Profit Markup:</strong></td>
                              <td className="text-end">
                                <Badge bg={invoiceDetails.profit_markup >= 0 ? "info" : "danger"}>
                                  {invoiceDetails.profit_markup.toFixed(2)}%
                                </Badge>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Header className="bg-light">
                        <h6 className="mb-0">Invoice Details</h6>
                      </Card.Header>
                      <Card.Body>
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td><strong>Sub Total:</strong></td>
                              <td className="text-end">
                                {formatCurrency(invoiceDetails.invoice_details.sub_total, invoiceDetails.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Handling Fee:</strong></td>
                              <td className="text-end">
                                {formatCurrency(invoiceDetails.invoice_details.handling_fee, invoiceDetails.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td><strong>GST Amount:</strong></td>
                              <td className="text-end">
                                {formatCurrency(invoiceDetails.invoice_details.gst_amount, invoiceDetails.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Total Amount:</strong></td>
                              <td className="text-end text-primary">
                                <strong>
                                  {formatCurrency(invoiceDetails.invoice_details.total_amount, invoiceDetails.currency)}
                                </strong>
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Amount Received:</strong></td>
                              <td className="text-end">
                                {formatCurrency(invoiceDetails.invoice_details.amount_received, invoiceDetails.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Balance:</strong></td>
                              <td className="text-end">
                                {formatCurrency(invoiceDetails.invoice_details.balance, invoiceDetails.currency)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="breakdown" title={
                <span>
                  <FaReceipt className="me-1" />
                  Cost Breakdown
                </span>
              }>
                {invoiceDetails.cost_breakdown && (
                  <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Detailed Cost Analysis</h6>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-3">
                        {Object.entries(invoiceDetails.cost_breakdown).map(([key, value]) => (
                          <Col md={6} key={key}>
                            <Card className="h-100">
                              <Card.Body className="text-center">
                                <h6 className="text-capitalize text-muted">
                                  {key.replace(/_/g, ' ')}
                                </h6>
                                <h4 className={typeof value === 'number' && value < 0 ? "text-danger" : "text-success"}>
                                  {typeof value === 'number' ? 
                                    formatCurrency(value, invoiceDetails.currency) 
                                    : value}
                                </h4>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Card.Body>
                  </Card>
                )}
              </Tab>
            </Tabs>
          ) : (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading invoice details...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInvoiceModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Invoice_pnl;