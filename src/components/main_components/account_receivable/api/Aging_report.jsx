import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  Card,
  Badge,
  Button,
  Form,
  ProgressBar,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaSearch,
  FaClock,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaSyncAlt,
  FaDownload,
} from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";

const Aging_report = ({ apiName }) => {
  const [agingData, setAgingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedCompany } = useContext(CompanyContext);
  const [filterStatus, setFilterStatus] = useState("all");
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
    if (companyNo) fetchAgingData();
  }, [companyNo]);

  const fetchAgingData = async () => {
    try {
      setLoading(true);
      setError(null);
     const response = await axios.get("/api/invoicesss/all", {
        params: { company_id: companyNo },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgingData(response.data || []);
    } catch (error) {
      setError("Failed to fetch aging report. Please try again.");
      console.error("Error fetching aging data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgingData = agingData.filter(
    (invoice) =>
      invoice.customer?.name === `${apiName}` &&
      (invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus === "all" || invoice.status.toLowerCase() === filterStatus.toLowerCase())
  );


//   const filteredAgingData = agingData.filter((item) =>
//     item.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     item.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

  const calculateDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getAgingBucket = (days) => {
    if (days <= 30) return "0-30 days";
    if (days <= 60) return "31-60 days";
    if (days <= 90) return "61-90 days";
    return "90+ days";
  };

  const getSeverity = (days) => {
    if (days <= 30) return "success";
    if (days <= 60) return "warning";
    if (days <= 90) return "danger";
    return "dark";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount, currency) => {
    return `${currency} ${parseFloat(amount).toFixed(2)}`;
  };

  const calculateTotalOutstanding = () => {
    return agingData.reduce((total, item) => total + parseFloat(item.balance), 0);
  };

  return (
    <div className="container py-4">
      <Card className="shadow">
        <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white">
          <h5 className="mb-0">
            <FaClock className="me-2" />
            {apiName} Aging Report
          </h5>
          <div>
            <Button variant="light" onClick={fetchAgingData} className="d-flex align-items-center">
              <FaSyncAlt className="me-1" /> Refresh
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          <div className="d-flex mb-4">
            <div className="input-group me-3" style={{ width: "300px" }}>
              <span className="input-group-text">
                <FaSearch />
              </span>
              <Form.Control
                type="text"
                placeholder="Search aging items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading aging report...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <>
              <div className="mb-4">
                <h6>Summary</h6>
                <ProgressBar className="mb-3">
                  <ProgressBar
                    variant="success"
                    now={agingData.filter(item => calculateDaysOverdue(item.due_date) <= 30).length / agingData.length * 100}
                    label="0-30 days"
                  />
                  <ProgressBar
                    variant="warning"
                    now={agingData.filter(item => calculateDaysOverdue(item.due_date) > 30 && calculateDaysOverdue(item.due_date) <= 60).length / agingData.length * 100}
                    label="31-60 days"
                  />
                  <ProgressBar
                    variant="danger"
                    now={agingData.filter(item => calculateDaysOverdue(item.due_date) > 60 && calculateDaysOverdue(item.due_date) <= 90).length / agingData.length * 100}
                    label="61-90 days"
                  />
                  <ProgressBar
                    variant="dark"
                    now={agingData.filter(item => calculateDaysOverdue(item.due_date) > 90).length / agingData.length * 100}
                    label="90+ days"
                  />
                </ProgressBar>
                <div className="d-flex justify-content-between">
                  <div>
                    <strong>Total Outstanding:</strong> {formatCurrency(calculateTotalOutstanding(), agingData[0]?.currency || "USD")}
                  </div>
                  <div>
                    <strong>Total Items:</strong> {agingData.length}
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Invoice No.</th>
                      <th>Customer</th>
                      <th>Due Date</th>
                      <th>Days Overdue</th>
                      <th>Aging Bucket</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgingData.length > 0 ? (
                      filteredAgingData.map((item) => {
                        const daysOverdue = calculateDaysOverdue(item.due_date);
                        const agingBucket = getAgingBucket(daysOverdue);
                        const severity = getSeverity(daysOverdue);
                        
                        return (
                          <tr key={item.invoice_number}>
                            <td>{item.invoice_number}</td>
                            <td>{item.customer_name}</td>
                            <td>
                              <FaCalendarAlt className="me-2 text-muted" />
                              {formatDate(item.due_date)}
                            </td>
                            <td>
                              <Badge bg={severity}>
                                {daysOverdue} days
                              </Badge>
                            </td>
                            <td>{agingBucket}</td>
                            <td>
                              <FaMoneyBillWave className="me-2 text-muted" />
                              {formatCurrency(item.balance, item.currency)}
                            </td>
                            <td>
                              {daysOverdue > 60 ? (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Critical overdue - Immediate action required</Tooltip>}
                                >
                                  <span>
                                    <FaExclamationTriangle className="text-danger me-1" />
                                    Critical
                                  </span>
                                </OverlayTrigger>
                              ) : daysOverdue > 30 ? (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Follow up required</Tooltip>}
                                >
                                  <span>
                                    <FaExclamationTriangle className="text-warning me-1" />
                                    Warning
                                  </span>
                                </OverlayTrigger>
                              ) : (
                                "Normal"
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <FaClock size={48} className="text-muted mb-3" />
                            <h5>No aging items found for {apiName}</h5>
                            <p className="text-muted">All invoices appear to be current</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>

        {filteredAgingData.length > 0 && (
          <Card.Footer className="d-flex justify-content-between align-items-center">
            <div>
              Showing <strong>{filteredAgingData.length}</strong> of <strong>{agingData.length}</strong> items
            </div>
            <div>
              <Button variant="outline-primary" size="sm">
                <FaDownload className="me-1" /> Export Report
              </Button>
            </div>
          </Card.Footer>
        )}
      </Card>
    </div>
  );
};

export default Aging_report;