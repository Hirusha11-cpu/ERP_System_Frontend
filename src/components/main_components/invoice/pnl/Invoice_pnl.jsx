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
  ProgressBar,
  OverlayTrigger,
  Tooltip,
  Alert,
  InputGroup,
  Spinner,
  Dropdown
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
  FaExchangeAlt,
  FaCalculator,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileExcel,
  FaFilePdf
} from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Invoice_pnl = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [invoiceNumber, setInvoiceNumber] = useState("IS46224");
  const [pnlData, setPnlData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(300);
  const [showDetails, setShowDetails] = useState(false);
  const tableRef = useRef();

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  const fetchPnLData = async () => {
    if (!invoiceNumber) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/pnl/invoice/${invoiceNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPnlData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch P&L data');
      console.error('Error fetching P&L data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnLData();
  }, [invoiceNumber]);

  const calculateLkrValue = (usdAmount) => {
    return usdAmount * exchangeRate;
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const getStatusBadge = (status) => {
    return status === 'matched' ? (
      <Badge bg="success"><FaCheckCircle className="me-1" /> Matched</Badge>
    ) : (
      <Badge bg="warning"><FaExclamationTriangle className="me-1" /> Mismatch</Badge>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToExcel = () => {
    if (!pnlData) return;

    const workbook = XLSX.utils.book_new();
    
    // Main P&L Data
    const mainData = [
      ['Profit & Loss Statement', '', '', ''],
      ['Invoice Number', pnlData.invoice.invoice_number, '', ''],
      ['Customer', pnlData.invoice.customer, '', ''],
      ['Issue Date', new Date(pnlData.invoice.issue_date).toLocaleDateString(), '', ''],
      ['Currency', pnlData.invoice.currency, '', ''],
      ['Exchange Rate', exchangeRate, '', ''],
      ['', '', '', ''],
      ['Description', 'USD', 'Exchange Rate', 'LKR'],
      ['Invoice Revenue', pnlData.revenue_breakdown.total_revenue, exchangeRate, calculateLkrValue(pnlData.revenue_breakdown.total_revenue)],
      ['GST', pnlData.revenue_breakdown.gst_amount, exchangeRate, calculateLkrValue(pnlData.revenue_breakdown.gst_amount)],
      ['Total Costs', pnlData.financial_summary.total_cost, exchangeRate, calculateLkrValue(pnlData.financial_summary.total_cost)],
      ['Profit', pnlData.financial_summary.profit_loss, exchangeRate, calculateLkrValue(pnlData.financial_summary.profit_loss)],
      ['Profit % (Margin)', pnlData.financial_summary.profit_margin + '%', '', ''],
      ['Profit % (Markup)', pnlData.financial_summary.profit_markup + '%', '', ''],
      ['', '', '', ''],
      ['Validation Results', '', '', ''],
      ['Revenue vs Mega Cost Status', pnlData.validation.revenue_vs_mega_cost.status, '', ''],
      ['Revenue vs Mega Cost Difference', pnlData.validation.revenue_vs_mega_cost.difference, '', ''],
      ['Profit Comparison Status', pnlData.validation.profit_comparison.status, '', ''],
      ['Profit Comparison Difference', pnlData.validation.profit_comparison.difference, '', '']
    ];

    const mainWorksheet = XLSX.utils.aoa_to_sheet(mainData);
    XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'P&L Summary');

    // Revenue Breakdown
    const revenueData = [
      ['Revenue Breakdown', ''],
      ['Sub Total', pnlData.revenue_breakdown.sub_total],
      ['Bank Charges', pnlData.revenue_breakdown.bank_charges],
      ['GST Amount', pnlData.revenue_breakdown.gst_amount],
      ['Additional Tax', pnlData.revenue_breakdown.additional_tax],
      ['Handling Fee', pnlData.revenue_breakdown.handling_fee],
      ['Total Revenue', pnlData.revenue_breakdown.total_revenue]
    ];

    const revenueWorksheet = XLSX.utils.aoa_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(workbook, revenueWorksheet, 'Revenue Details');

    // Cost Breakdown
    const costData = [
      ['Cost Breakdown', ''],
      ['Accommodation', pnlData.cost_breakdown.accommodation],
      ['Meals', pnlData.cost_breakdown.meal],
      ['Tickets', pnlData.cost_breakdown.tickets],
      ['Transport', pnlData.cost_breakdown.transport],
      ['Other Rates', pnlData.cost_breakdown.other_rates],
      ['Total Cost', pnlData.financial_summary.total_cost]
    ];

    const costWorksheet = XLSX.utils.aoa_to_sheet(costData);
    XLSX.utils.book_append_sheet(workbook, costWorksheet, 'Cost Details');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `P&L_Report_${pnlData.invoice.invoice_number}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    if (!pnlData) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('PROFIT & LOSS REPORT', 105, 15, { align: 'center' });
    
    // Invoice Info
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice: ${pnlData.invoice.invoice_number}`, 14, 25);
    doc.text(`Customer: ${pnlData.invoice.customer}`, 14, 32);
    doc.text(`Date: ${new Date(pnlData.invoice.issue_date).toLocaleDateString()}`, 14, 39);
    doc.text(`Currency: ${pnlData.invoice.currency}`, 14, 46);
    doc.text(`Exchange Rate: ${exchangeRate}`, 14, 53);

    // Main Table
    doc.autoTable({
      startY: 60,
      head: [['Description', 'USD', 'Exchange Rate', 'LKR']],
      body: [
        ['Invoice Revenue', formatCurrency(pnlData.revenue_breakdown.total_revenue), exchangeRate, formatCurrency(calculateLkrValue(pnlData.revenue_breakdown.total_revenue), 'LKR')],
        ['GST', formatCurrency(pnlData.revenue_breakdown.gst_amount), exchangeRate, formatCurrency(calculateLkrValue(pnlData.revenue_breakdown.gst_amount), 'LKR')],
        ['Total Costs', formatCurrency(pnlData.financial_summary.total_cost), exchangeRate, formatCurrency(calculateLkrValue(pnlData.financial_summary.total_cost), 'LKR')],
        ['Profit', formatCurrency(pnlData.financial_summary.profit_loss), exchangeRate, formatCurrency(calculateLkrValue(pnlData.financial_summary.profit_loss), 'LKR')],
        ['Profit % (Margin)', formatPercentage(pnlData.financial_summary.profit_margin), '', ''],
        ['Profit % (Markup)', formatPercentage(pnlData.financial_summary.profit_markup), '', '']
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });

    // Validation Section
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('VALIDATION RESULTS', 14, finalY);

    doc.autoTable({
      startY: finalY + 5,
      body: [
        ['Revenue vs Mega Cost', pnlData.validation.revenue_vs_mega_cost.status, formatCurrency(pnlData.validation.revenue_vs_mega_cost.difference)],
        ['Profit Comparison', pnlData.validation.profit_comparison.status, formatCurrency(pnlData.validation.profit_comparison.difference)]
      ],
      theme: 'grid',
      head: [['Validation Type', 'Status', 'Difference']],
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: 'bold'
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    // Save PDF
    doc.save(`P&L_Report_${pnlData.invoice.invoice_number}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExport = (format) => {
    switch (format) {
      case 'excel':
        exportToExcel();
        break;
      case 'pdf':
        exportToPDF();
        break;
      default:
        console.log('Unknown format');
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header Section */}
      <Card className="mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <FaChartLine className="me-2" />
            Profit & Loss Report
          </h4>
          <div>
            <Button variant="outline-light" size="sm" className="me-2" onClick={handlePrint}>
              <FaPrint className="me-1" /> Print
            </Button>
            
            <Dropdown>
              <Dropdown.Toggle variant="outline-light" size="sm">
                <FaDownload className="me-1" /> Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleExport('excel')}>
                  <FaFileExcel className="me-2 text-success" /> Excel
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleExport('pdf')}>
                  <FaFilePdf className="me-2 text-danger" /> PDF
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Invoice Number</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Enter invoice number (e.g., IS46224)"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value.toUpperCase())}
                  />
                  <Button variant="primary" onClick={fetchPnLData}>
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Exchange Rate (USD to LKR)</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <FaExchangeAlt />
                  </InputGroup.Text>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 300)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      {pnlData && (
        <>
          {/* Invoice Header */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h5>{pnlData.invoice.invoice_number} - {pnlData.invoice.customer}</h5>
                  <p className="text-muted mb-0">
                    Issue Date: {new Date(pnlData.invoice.issue_date).toLocaleDateString()}
                  </p>
                </Col>
                <Col md={6} className="text-end">
                  <Badge bg="info" className="fs-6">
                    Currency: {pnlData.invoice.currency}
                  </Badge>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Main P&L Table */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <FaMoneyBillWave className="me-2" />
                Profit & Loss Statement
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              <Table striped bordered className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Description</th>
                    <th className="text-end">USD</th>
                    <th className="text-end">Exchange Rate</th>
                    <th className="text-end">LKR</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Invoice Revenue */}
                  <tr>
                    <td>
                      <strong>Invoice Revenue</strong>
                      <br />
                      <small className="text-muted">Sub Total: {formatCurrency(pnlData.revenue_breakdown.sub_total)}</small>
                    </td>
                    <td className="text-end">{formatCurrency(pnlData.revenue_breakdown.total_revenue)}</td>
                    <td className="text-end">{exchangeRate.toFixed(2)}</td>
                    <td className="text-end">{formatCurrency(calculateLkrValue(pnlData.revenue_breakdown.total_revenue), 'LKR')}</td>
                  </tr>

                  {/* Taxes and Charges */}
                  {pnlData.revenue_breakdown.gst_amount > 0 && (
                    <tr>
                      <td>GST</td>
                      <td className="text-end">{formatCurrency(pnlData.revenue_breakdown.gst_amount)}</td>
                      <td className="text-end">{exchangeRate.toFixed(2)}</td>
                      <td className="text-end">{formatCurrency(calculateLkrValue(pnlData.revenue_breakdown.gst_amount), 'LKR')}</td>
                    </tr>
                  )}

                  {/* Total Costs */}
                  <tr className="table-danger">
                    <td>
                      <strong>Total Costs</strong>
                      <br />
                      <small className="text-muted">
                        Accommodation: {formatCurrency(pnlData.cost_breakdown.accommodation)} | 
                        Transport: {formatCurrency(pnlData.cost_breakdown.transport)}
                      </small>
                    </td>
                    <td className="text-end">{formatCurrency(pnlData.financial_summary.total_cost)}</td>
                    <td className="text-end">{exchangeRate.toFixed(2)}</td>
                    <td className="text-end">({formatCurrency(calculateLkrValue(pnlData.financial_summary.total_cost), 'LKR')})</td>
                  </tr>

                  {/* Profit */}
                  <tr className="table-success">
                    <td>
                      <strong>Profit</strong>
                    </td>
                    <td className="text-end">{formatCurrency(pnlData.financial_summary.profit_loss)}</td>
                    <td className="text-end">{exchangeRate.toFixed(2)}</td>
                    <td className="text-end">{formatCurrency(calculateLkrValue(pnlData.financial_summary.profit_loss), 'LKR')}</td>
                  </tr>

                  {/* Profit Percentage */}
                  <tr>
                    <td>
                      <strong>Profit % (Margin)</strong>
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip>
                            Profit Margin = (Profit / Total Revenue) × 100
                          </Tooltip>
                        }
                      >
                        <FaInfoCircle className="ms-2 text-info" />
                      </OverlayTrigger>
                    </td>
                    <td className="text-end" colSpan="3">
                      <strong>{formatPercentage(pnlData.financial_summary.profit_margin)}</strong>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>Profit % (Markup)</strong>
                      <OverlayTrigger
                        placement="top"
                        overlay={
                          <Tooltip>
                            Profit Markup = (Profit / Total Cost) × 100
                          </Tooltip>
                        }
                      >
                        <FaInfoCircle className="ms-2 text-info" />
                      </OverlayTrigger>
                    </td>
                    <td className="text-end" colSpan="3">
                      <strong>{formatPercentage(pnlData.financial_summary.profit_markup)}</strong>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Validation Section */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <FaCalculator className="me-2" />
                Data Validation
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Revenue vs Mega Cost:</span>
                    {getStatusBadge(pnlData.validation.revenue_vs_mega_cost.status)}
                  </div>
                  <ProgressBar 
                    variant={pnlData.validation.revenue_vs_mega_cost.status === 'matched' ? 'success' : 'warning'}
                    now={100}
                    label={`Difference: ${formatCurrency(pnlData.validation.revenue_vs_mega_cost.difference)}`}
                  />
                </Col>
                <Col md={6}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Profit Comparison:</span>
                    {getStatusBadge(pnlData.validation.profit_comparison.status)}
                  </div>
                  <ProgressBar 
                    variant={pnlData.validation.profit_comparison.status === 'matched' ? 'success' : 'warning'}
                    now={100}
                    label={`Difference: ${formatCurrency(pnlData.validation.profit_comparison.difference)}`}
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Detailed Breakdown Toggle */}
          <div className="text-center mb-4">
            <Button 
              variant="outline-primary" 
              onClick={() => setShowDetails(!showDetails)}
            >
              <FaEye className="me-2" />
              {showDetails ? 'Hide Detailed Breakdown' : 'Show Detailed Breakdown'}
            </Button>
          </div>

          {/* Detailed Breakdown */}
          {showDetails && (
            <Row>
              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header className="bg-info text-white">
                    <h6 className="mb-0">Revenue Breakdown</h6>
                  </Card.Header>
                  <Card.Body>
                    <Table size="sm">
                      <tbody>
                        <tr>
                          <td>Sub Total:</td>
                          <td className="text-end">{formatCurrency(pnlData.revenue_breakdown.sub_total)}</td>
                        </tr>
                        <tr>
                          <td>Bank Charges:</td>
                          <td className="text-end">{formatCurrency(pnlData.revenue_breakdown.bank_charges)}</td>
                        </tr>
                        <tr>
                          <td>GST Amount:</td>
                          <td className="text-end">{formatCurrency(pnlData.revenue_breakdown.gst_amount)}</td>
                        </tr>
                        <tr>
                          <td>Additional Tax:</td>
                          <td className="text-end">{formatCurrency(pnlData.revenue_breakdown.additional_tax)}</td>
                        </tr>
                        <tr className="table-primary">
                          <td><strong>Total Revenue:</strong></td>
                          <td className="text-end"><strong>{formatCurrency(pnlData.revenue_breakdown.total_revenue)}</strong></td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="mb-4">
                  <Card.Header className="bg-warning text-dark">
                    <h6 className="mb-0">Cost Breakdown</h6>
                  </Card.Header>
                  <Card.Body>
                    <Table size="sm">
                      <tbody>
                        <tr>
                          <td>Accommodation:</td>
                          <td className="text-end">{formatCurrency(pnlData.cost_breakdown.accommodation)}</td>
                        </tr>
                        <tr>
                          <td>Meals:</td>
                          <td className="text-end">{formatCurrency(pnlData.cost_breakdown.meal)}</td>
                        </tr>
                        <tr>
                          <td>Tickets:</td>
                          <td className="text-end">{formatCurrency(pnlData.cost_breakdown.tickets)}</td>
                        </tr>
                        <tr>
                          <td>Transport:</td>
                          <td className="text-end">{formatCurrency(pnlData.cost_breakdown.transport)}</td>
                        </tr>
                        <tr>
                          <td>Other Rates:</td>
                          <td className="text-end">{formatCurrency(pnlData.cost_breakdown.other_rates)}</td>
                        </tr>
                        <tr className="table-danger">
                          <td><strong>Total Cost:</strong></td>
                          <td className="text-end"><strong>{formatCurrency(pnlData.financial_summary.total_cost)}</strong></td>
                        </tr>
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}
    </div>
  );
};

export default Invoice_pnl;