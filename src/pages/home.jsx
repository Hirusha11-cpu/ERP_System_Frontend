import React from 'react';
import { 
  Card, Row, Col, Badge, ProgressBar, 
  Table, Button, Dropdown, Form 
} from 'react-bootstrap';
import { 
  FiDollarSign, FiTrendingUp, FiTrendingDown, 
  FiPieChart, FiCreditCard, FiCalendar, 
  FiUsers, FiFileText, FiPrinter,
  FiRefreshCw, FiSearch, FiFilter,
  FiBarChart2, FiPocket, FiDatabase
} from 'react-icons/fi';
import { 
  FaFileInvoiceDollar, FaMoneyBillWave, 
  FaRegMoneyBillAlt, FaChartLine 
} from 'react-icons/fa';

const Home = () => {
  // Sample data
  const financialStats = [
    { title: "Total Revenue", value: "$48,520", change: "+12%", trend: "up", icon: <FiTrendingUp size={24} /> },
    { title: "Account Receivable", value: "$18,420", change: "+5%", trend: "up", icon: <FaFileInvoiceDollar size={24} /> },
    { title: "Account Payable", value: "$12,480", change: "-3%", trend: "down", icon: <FaMoneyBillWave size={24} /> },
    { title: "Office Expenses", value: "$8,240", change: "+2%", trend: "up", icon: <FaRegMoneyBillAlt size={24} /> }
  ];

  const recentInvoices = [
    { id: "#INV-001", customer: "John Smith", date: "2023-05-15", amount: "$1,200", status: "paid" },
    { id: "#INV-002", customer: "Acme Corp", date: "2023-05-14", amount: "$3,450", status: "pending" },
    { id: "#INV-003", customer: "Global Tech", date: "2023-05-13", amount: "$2,100", status: "paid" },
    { id: "#INV-004", customer: "Sarah Johnson", date: "2023-05-12", amount: "$850", status: "cancelled" },
    { id: "#INV-005", customer: "Blue Ocean", date: "2023-05-11", amount: "$5,600", status: "pending" }
  ];

  const upcomingPayments = [
    { id: "#PAY-101", vendor: "Office Supplies Inc", dueDate: "2023-05-18", amount: "$1,250" },
    { id: "#PAY-102", vendor: "Tech Solutions", dueDate: "2023-05-20", amount: "$3,800" },
    { id: "#PAY-103", vendor: "Utility Services", dueDate: "2023-05-22", amount: "$1,150" }
  ];

  const reconciliationStatus = [
    { account: "Main Business Account", status: 85, reconciled: "$45,200" },
    { account: "Savings Account", status: 60, reconciled: "$18,750" },
    { account: "Credit Card", status: 45, reconciled: "$5,430" }
  ];

  return (
    <>
      <div className='main-content'>
        {/* Dashboard Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Financial Dashboard</h2>
          <div className="d-flex">
            <Button variant="outline-primary" className="me-2 d-flex align-items-center">
              <FiRefreshCw className="me-1" /> Refresh
            </Button>
            <div className="input-group" style={{ width: "250px" }}>
              <span className="input-group-text">
                <FiSearch />
              </span>
              <Form.Control placeholder="Search..." />
            </div>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <Row className="mb-4">
          {financialStats.map((stat, index) => (
            <Col key={index} md={3} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="text-muted mb-2">{stat.title}</h6>
                      <h3 className="mb-0">{stat.value}</h3>
                      <small className={`text-${stat.trend === "up" ? "success" : "danger"}`}>
                        {stat.change} from last month
                      </small>
                    </div>
                    <div className={`bg-${stat.trend === "up" ? "success" : "danger"}-light rounded p-3`}>
                      {stat.icon}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Charts and Main Content */}
        <Row>
          {/* Left Column */}
          <Col md={8}>
            {/* Revenue Chart */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Revenue Overview</h5>
                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm">
                    Last 30 Days
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item>Last 7 Days</Dropdown.Item>
                    <Dropdown.Item>Last 30 Days</Dropdown.Item>
                    <Dropdown.Item>Last 90 Days</Dropdown.Item>
                    <Dropdown.Item>This Year</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Card.Header>
              <Card.Body>
                <div style={{ height: "300px" }} className="d-flex align-items-center justify-content-center">
                  <FaChartLine size={48} className="text-primary" />
                  <div className="ms-3">
                    <h4>Revenue Chart</h4>
                    <p className="text-muted">Visual representation would be here</p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Recent Invoices */}
            <Card className="shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Invoices</h5>
                <Button variant="primary" size="sm">
                  <FaFileInvoiceDollar className="me-1" /> Create New
                </Button>
              </Card.Header>
              <Card.Body>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice, index) => (
                      <tr key={index}>
                        <td>{invoice.id}</td>
                        <td>{invoice.customer}</td>
                        <td>{invoice.date}</td>
                        <td>{invoice.amount}</td>
                        <td>
                          <Badge 
                            bg={
                              invoice.status === "paid" ? "success" : 
                              invoice.status === "pending" ? "warning" : "danger"
                            }
                            className="d-flex align-items-center"
                          >
                            {invoice.status === "paid" ? <FiPocket className="me-1" /> : 
                             invoice.status === "pending" ? <FiRefreshCw className="me-1" /> : 
                             <FiFileText className="me-1" />}
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-1">
                            View
                          </Button>
                          <Button variant="outline-secondary" size="sm">
                            <FiPrinter />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column */}
          <Col md={4}>
            {/* Upcoming Payments */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <FiCalendar className="me-2" /> Upcoming Payments
                </h5>
              </Card.Header>
              <Card.Body>
                {upcomingPayments.map((payment, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="mb-1">{payment.vendor}</h6>
                        <small className="text-muted">Due: {payment.dueDate}</small>
                      </div>
                      <div className="text-end">
                        <strong>{payment.amount}</strong>
                        <div>
                          <Badge bg="light" text="dark" className="text-uppercase">
                            {payment.id}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {index < upcomingPayments.length - 1 && <hr className="my-2" />}
                  </div>
                ))}
                <Button variant="outline-primary" size="sm" className="w-100 mt-2">
                  View All Payments
                </Button>
              </Card.Body>
            </Card>

            {/* Reconciliation Status */}
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <FiDatabase className="me-2" /> Reconciliation Status
                </h5>
              </Card.Header>
              <Card.Body>
                {reconciliationStatus.map((account, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>{account.account}</span>
                      <span>{account.reconciled}</span>
                    </div>
                    <ProgressBar 
                      now={account.status} 
                      variant={
                        account.status > 80 ? "success" : 
                        account.status > 50 ? "warning" : "danger"
                      } 
                      className="mb-2"
                    />
                    {index < reconciliationStatus.length - 1 && <hr className="my-2" />}
                  </div>
                ))}
                <Button variant="outline-primary" size="sm" className="w-100 mt-2">
                  Reconcile Now
                </Button>
              </Card.Body>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <FiBarChart2 className="me-2" /> Quick Actions
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6} className="mb-3">
                    <Button variant="outline-primary" className="w-100 d-flex flex-column align-items-center py-3">
                      <FiDollarSign size={24} className="mb-2" />
                      <span>Create Invoice</span>
                    </Button>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Button variant="outline-success" className="w-100 d-flex flex-column align-items-center py-3">
                      <FiCreditCard size={24} className="mb-2" />
                      <span>Record Payment</span>
                    </Button>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Button variant="outline-warning" className="w-100 d-flex flex-column align-items-center py-3">
                      <FiUsers size={24} className="mb-2" />
                      <span>Add Vendor</span>
                    </Button>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Button variant="outline-info" className="w-100 d-flex flex-column align-items-center py-3">
                      <FiPieChart size={24} className="mb-2" />
                      <span>Generate Report</span>
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Home;