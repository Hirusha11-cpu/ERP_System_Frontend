import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  Button,
  Form,
  Table,
  Card,
  Nav,
  Tab,
  Row,
  Col,
  Badge,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaSearch,
  FaPlus,
  FaTrash,
  FaEye,
  FaPrint,
  FaDownload,
  FaSyncAlt,
  FaCog,
  FaFileInvoiceDollar,
  FaUser,
  FaCalendarAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";

const Master_sheet = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };

    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

  useEffect(() => {
    if (companyNo) {
      fetchInvoices();
    }
  }, [companyNo]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/invoicesss/all", {
        params: {
          company_id: companyNo,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data);

      setInvoices(response.data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log("Invoices before filtering:", invoices);

  const filteredInvoices = invoices
    .filter((invoice) => {
      console.log("Step 1 - Customer Name:", invoice.customer?.name);
      return invoice.customer?.name === "MMT";
    })
    .filter((invoice) => {
      const matchesSearch =
        invoice.invoice_number
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (invoice.customer?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      console.log(
        "Step 2 - Matches Search:",
        invoice.invoice_number,
        matchesSearch
      );
      return matchesSearch;
    });

  console.log("Final filteredInvoices:", filteredInvoices);

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "open":
        return (
          <Badge bg="warning" text="dark" className="d-flex align-items-center">
            <FaCalendarAlt className="me-1" /> Open
          </Badge>
        );
      case "paid":
        return (
          <Badge bg="success" className="d-flex align-items-center">
            <FaMoneyBillWave className="me-1" /> Paid
          </Badge>
        );
      case "cancelled":
        return (
          <Badge bg="danger" className="d-flex align-items-center">
            <FaTrash className="me-1" /> Cancelled
          </Badge>
        );
      default:
        return (
          <Badge bg="secondary" className="d-flex align-items-center">
            <FaCog className="me-1" /> {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const ActionButton = ({
    icon,
    label,
    variant = "primary",
    onClick,
    disabled = false,
  }) => (
    <OverlayTrigger placement="top" overlay={<Tooltip>{label}</Tooltip>}>
      <Button
        variant={variant}
        size="sm"
        className="me-2"
        onClick={onClick}
        disabled={disabled}
      >
        {icon} <span className="d-none d-md-inline">{label}</span>
      </Button>
    </OverlayTrigger>
  );

  return (
    <div className="container py-4">
      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
          <h5 className="mb-0">
            <FaFileInvoiceDollar className="me-2" />
            MMT Invoice List
          </h5>
          <Button
            variant="light"
            className="d-flex align-items-center"
            disabled
          >
            <FaPlus className="me-1" /> New Invoice
          </Button>
        </Card.Header>

        <Card.Body>
          <div className="d-flex mb-4">
            <div className="input-group me-3" style={{ width: "300px" }}>
              <span className="input-group-text">
                <FaSearch />
              </span>
              <Form.Control
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="d-flex align-items-center me-3">
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: "150px" }}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </div>

            <Button
              variant="outline-secondary"
              onClick={fetchInvoices}
              className="d-flex align-items-center"
            >
              <FaSyncAlt className="me-1" /> Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading invoices...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Invoice No.</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className={
                          invoice.status.toLowerCase() === "cancelled"
                            ? "table-danger"
                            : invoice.status.toLowerCase() === "paid"
                            ? "table-success"
                            : invoice.status.toLowerCase() === "open"
                            ? "table-warning"
                            : ""
                        }
                      >
                        <td>
                          <strong>{invoice.invoice_number}</strong>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: "32px", height: "32px" }}
                            >
                              <FaUser />
                            </div>
                            <div>
                              <div>{invoice.customer?.name || "N/A"}</div>
                              <small className="text-muted">
                                {invoice.customer?.email || ""}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaCalendarAlt className="me-2 text-muted" />
                            {formatDate(invoice.issue_date)}
                          </div>
                          <small className="text-muted">
                            Due: {formatDate(invoice.due_date)}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaMoneyBillWave className="me-2 text-muted" />
                            {invoice.currency} {invoice.total_amount}
                          </div>
                        </td>
                        <td>{getStatusBadge(invoice.status)}</td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end">
                            <ActionButton
                              icon={<FaEye />}
                              label="View"
                              variant="info"
                              onClick={() =>
                                console.log("View invoice:", invoice.id)
                              }
                            />
                            <ActionButton
                              icon={<FaPrint />}
                              label="Print"
                              variant="secondary"
                              onClick={() =>
                                console.log("Print invoice:", invoice.id)
                              }
                            />
                            <ActionButton
                              icon={<FaDownload />}
                              label="Download"
                              variant="success"
                              onClick={() =>
                                console.log("Download invoice:", invoice.id)
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="d-flex flex-column align-items-center">
                          <FaFileInvoiceDollar
                            size={48}
                            className="text-muted mb-3"
                          />
                          <h5>No invoices found for MMT</h5>
                          <p className="text-muted">
                            Try adjusting your search or check the data
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>

        {filteredInvoices.length > 0 && (
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <div>
              Showing <strong>{filteredInvoices.length}</strong> of{" "}
              <strong>{invoices.length}</strong> invoices
            </div>
            <div className="d-flex">
              <Button variant="outline-primary" size="sm" className="me-2">
                <FaDownload className="me-1" /> Export
              </Button>
              <Button variant="outline-secondary" size="sm">
                <FaPrint className="me-1" /> Print List
              </Button>
            </div>
          </Card.Footer>
        )}
      </Card>
    </div>
  );
};

export default Master_sheet;
