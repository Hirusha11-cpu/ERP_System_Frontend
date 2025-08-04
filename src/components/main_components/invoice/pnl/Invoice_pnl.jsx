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
} from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";

const Invoice_pnl = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    dateRange: "all",
    profitStatus: "all",
    currency: "all",
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { selectedCompany } = useContext(CompanyContext);
      const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, searchTerm, filters]);

    useEffect(() => {
    if (!selectedCompany) return;

    // You can map it to company_id here
    const companyMap = {
      appleholidays: 2,
      shirmila: 1,
      aahaas: 3,
    };

    const company_id = companyMap[selectedCompany.toLowerCase()] || null;

    if (company_id) {
      // Call API or any action here
      fetchInvoices(company_id);
    }
  }, [selectedCompany]);

  const fetchInvoices = async (company_id) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/invoices?company_id=${company_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setInvoices(response.data.data || []);
      setFilteredInvoices(response.data.data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };


//   const fetchInvoices = async () => {
//     try {
//       setLoading(true);
//       let company_id;

//       switch (selectedCompany) {
//         case "appleholidays":
//           company_id = 2;
//           break;
//         case "shirmila":
//           company_id = 1;
//           break;
//         case "aahaas":
//           company_id = 3;
//           break;
//         default:
//           company_id = 1; // or any fallback
//       }
//       console.log(company_id);
      
//       const response = await axios.get("/api/invoices", {
//         params: { company_id},
//       });
//       setInvoices(response.data.data || []);
//     } catch (error) {
//       console.error("Error fetching invoices:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

  const applyFilters = () => {
    let result = [...invoices];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (invoice) =>
          invoice.invoice_number
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          invoice.customer?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Apply profit status filter
    if (filters.profitStatus !== "all") {
      result = result.filter((invoice) => {
        if (filters.profitStatus === "profit") {
          return invoice.profit?.profit > 0;
        } else if (filters.profitStatus === "loss") {
          return invoice.profit?.profit < 0;
        } else {
          return invoice.profit?.profit === 0;
        }
      });
    }

    // Apply currency filter
    if (filters.currency !== "all") {
      result = result.filter(
        (invoice) => invoice.currency === filters.currency
      );
    }

    // Apply date range filter
    const now = new Date();
    if (filters.dateRange !== "all") {
      result = result.filter((invoice) => {
        const issueDate = new Date(invoice.issue_date);
        const diffDays = Math.floor((now - issueDate) / (1000 * 60 * 60 * 24));

        if (filters.dateRange === "week") {
          return diffDays <= 7;
        } else if (filters.dateRange === "month") {
          return diffDays <= 30;
        } else if (filters.dateRange === "quarter") {
          return diffDays <= 90;
        }
        return true;
      });
    }

    setFilteredInvoices(result);
  };

  const getProfitBadge = (profit) => {
    if (profit > 0) {
      return <Badge bg="success">Profit</Badge>;
    } else if (profit < 0) {
      return <Badge bg="danger">Loss</Badge>;
    } else {
      return <Badge bg="secondary">Break-even</Badge>;
    }
  };

  const calculateTotal = (field) => {
    return filteredInvoices.reduce((sum, invoice) => {
      return sum + parseFloat(invoice.profit?.[field] || 0);
    }, 0);
  };

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading invoice data...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Card className="shadow">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0 d-flex align-items-center">
            <FaChartLine className="me-2" />
            Invoice Profit & Loss Analysis
          </h5>
        </Card.Header>

        <Card.Body>
          {/* Summary Cards */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="border-success">
                <Card.Body>
                  <h6 className="text-muted">Total Revenue</h6>
                  <h3 className="text-success">
                    {calculateTotal("total_revenue").toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </h3>
                  <small className="text-muted">Across all invoices</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-info">
                <Card.Body>
                  <h6 className="text-muted">Total Profit</h6>
                  <h3 className="text-info">
                    {calculateTotal("profit").toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </h3>
                  <small className="text-muted">
                    Avg. margin:{" "}
                    {filteredInvoices.length > 0
                      ? (
                          (calculateTotal("profit") /
                            calculateTotal("total_revenue")) *
                          100
                        ).toFixed(2)
                      : 0}
                    %
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-warning">
                <Card.Body>
                  <h6 className="text-muted">Total Cost</h6>
                  <h3 className="text-warning">
                    {calculateTotal("total_cost").toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </h3>
                  <small className="text-muted">
                    {filteredInvoices.length} invoices
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>
                      <FaSearch className="me-2" />
                      Search
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search invoices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>
                      <FaFilter className="me-2" />
                      Profit Status
                    </Form.Label>
                    <Form.Select
                      value={filters.profitStatus}
                      onChange={(e) =>
                        setFilters({ ...filters, profitStatus: e.target.value })
                      }
                    >
                      <option value="all">All</option>
                      <option value="profit">Profit</option>
                      <option value="loss">Loss</option>
                      <option value="neutral">Break-even</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>
                      <FaFilter className="me-2" />
                      Currency
                    </Form.Label>
                    <Form.Select
                      value={filters.currency}
                      onChange={(e) =>
                        setFilters({ ...filters, currency: e.target.value })
                      }
                    >
                      <option value="all">All</option>
                      <option value="USD">USD</option>
                      <option value="LKR">LKR</option>
                      <option value="INR">INR</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>
                      <FaFilter className="me-2" />
                      Date Range
                    </Form.Label>
                    <Form.Select
                      value={filters.dateRange}
                      onChange={(e) =>
                        setFilters({ ...filters, dateRange: e.target.value })
                      }
                    >
                      <option value="all">All Time</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="quarter">Last 90 Days</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex align-items-end">
                  <Button
                    variant="outline-secondary"
                    onClick={fetchInvoices}
                    className="w-100"
                  >
                    Refresh
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Invoice P&L Table */}
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Invoice No.</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Revenue</th>
                  <th>Cost</th>
                  <th>Profit</th>
                  <th>Margin</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <strong>{invoice.invoice_number}</strong>
                      </td>
                      <td>{invoice.customer?.name || "N/A"}</td>
                      <td>
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </td>
                      <td>
                        {parseFloat(
                          invoice.profit?.total_revenue || 0
                        ).toLocaleString("en-US", {
                          style: "currency",
                          currency: invoice.currency || "USD",
                        })}
                      </td>
                      <td>
                        {parseFloat(
                          invoice.profit?.total_cost || 0
                        ).toLocaleString("en-US", {
                          style: "currency",
                          currency: invoice.currency || "USD",
                        })}
                      </td>
                      <td
                        className={
                          invoice.profit?.profit > 0
                            ? "text-success"
                            : invoice.profit?.profit < 0
                            ? "text-danger"
                            : "text-muted"
                        }
                      >
                        {parseFloat(invoice.profit?.profit || 0).toLocaleString(
                          "en-US",
                          {
                            style: "currency",
                            currency: invoice.currency || "USD",
                          }
                        )}
                      </td>
                      <td>
                        <ProgressBar
                          now={Math.abs(invoice.profit?.profit_margin || 0)}
                          variant={
                            invoice.profit?.profit > 0
                              ? "success"
                              : invoice.profit?.profit < 0
                              ? "danger"
                              : "info"
                          }
                          label={`${invoice.profit?.profit_margin || 0}%`}
                        />
                      </td>
                      <td>{getProfitBadge(invoice.profit?.profit)}</td>
                      <td className="text-end">
                        <OverlayTrigger
                          overlay={<Tooltip>View Details</Tooltip>}
                        >
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewDetails(invoice)}
                          >
                            <FaEye />
                          </Button>
                        </OverlayTrigger>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      No invoices found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>

        <Card.Footer className="d-flex justify-content-between align-items-center">
          <div>
            Showing <strong>{filteredInvoices.length}</strong> of{" "}
            <strong>{invoices.length}</strong> invoices
          </div>
          <div>
            <Button variant="outline-primary" className="me-2">
              <FaDownload className="me-1" /> Export
            </Button>
            <Button variant="outline-secondary">
              <FaPrint className="me-1" /> Print
            </Button>
          </div>
        </Card.Footer>
      </Card>

      {/* Invoice Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Invoice Details - {selectedInvoice?.invoice_number}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedInvoice && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Customer</h6>
                  <p>{selectedInvoice.customer?.name || "N/A"}</p>
                </Col>
                <Col md={6} className="text-end">
                  <h6>Date</h6>
                  <p>
                    {new Date(selectedInvoice.issue_date).toLocaleDateString()}
                  </p>
                </Col>
              </Row>

              <h6 className="mt-4">Items</h6>
              <Table bordered>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td>
                        {selectedInvoice.currency} {item.price}
                      </td>
                      <td>{item.quantity}</td>
                      <td>
                        {selectedInvoice.currency}{" "}
                        {(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <h6 className="mt-4">Profit Analysis</h6>
              <Table bordered>
                <tbody>
                  <tr>
                    <td>
                      <strong>Total Revenue</strong>
                    </td>
                    <td className="text-end">
                      {selectedInvoice.currency}{" "}
                      {selectedInvoice.profit?.total_revenue || "0.00"}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Total Cost</strong>
                    </td>
                    <td className="text-end">
                      {selectedInvoice.currency}{" "}
                      {selectedInvoice.profit?.total_cost || "0.00"}
                    </td>
                  </tr>
                  <tr
                    className={
                      selectedInvoice.profit?.profit > 0
                        ? "table-success"
                        : selectedInvoice.profit?.profit < 0
                        ? "table-danger"
                        : "table-secondary"
                    }
                  >
                    <td>
                      <strong>Profit/Loss</strong>
                    </td>
                    <td className="text-end">
                      {selectedInvoice.currency}{" "}
                      {selectedInvoice.profit?.profit || "0.00"}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Profit Margin</strong>
                    </td>
                    <td className="text-end">
                      {selectedInvoice.profit?.profit_margin || "0.00"}%
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Profit Markup</strong>
                    </td>
                    <td className="text-end">
                      {selectedInvoice.profit?.profit_markup || "0.00"}%
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Invoice_pnl;
