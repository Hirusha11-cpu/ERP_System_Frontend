import React, { useContext, useState } from 'react';
import { 
  Card, Row, Col, Badge, ProgressBar, 
  Table, Button, Dropdown, Form, Container 
} from 'react-bootstrap';
import { 
  FiDollarSign, FiTrendingUp, FiTrendingDown, 
  FiPieChart, FiCreditCard, FiCalendar, 
  FiUsers, FiFileText, FiPrinter, FiPlus,
  FiRefreshCw, FiSearch, FiFilter,
  FiBarChart2, FiPocket, FiDatabase,
  FiChevronRight, FiGlobe, FiLayers
} from 'react-icons/fi';
import { 
  FaFileInvoiceDollar, FaMoneyBillWave, 
  FaRegMoneyBillAlt, FaChartLine,
  FaPlane, FaHotel, FaReceipt
} from 'react-icons/fa';
import { CompanyContext } from '../contentApi/CompanyProvider';

const Home = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [activeSection, setActiveSection] = useState('overview');
  
  // Sample data for demonstration
  const invoiceStats = {
    total: 125000,
    paid: 87500,
    overdue: 12500,
    pending: 25000
  };

  const renderCompanySpecificNav = () => {
    switch(selectedCompany) {
      case "appleholidays":
      case "aahaas":
        return (
          <>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 text-primary">
                  <FaFileInvoiceDollar className="me-2" />
                  Account Payables
                </h5>
                <Row>
                  {['Sri Lanka', 'Singapore', 'Vietnam', 'Malaysia', 'Maldives', 'Bali', 'Thailand', 'Other'].map(country => (
                    <Col md={3} key={country} className="mb-3">
                      <Button 
                        variant="outline-primary" 
                        className="w-100 text-start d-flex align-items-center"
                        onClick={() => setActiveSection(`payables-${country.toLowerCase().replace(' ', '-')}`)}
                      >
                        <FiGlobe className="me-2" />
                        {country}
                        <FiChevronRight className="ms-auto" />
                      </Button>
                    </Col>
                  ))}
                </Row>
                <div className="mt-3">
                  <Button variant="link" className="text-decoration-none">
                    <FiBarChart2 className="me-2" />
                    API Reports
                  </Button>
                  <Button variant="link" className="text-decoration-none ms-3">
                    <FiPieChart className="me-2" />
                    Summary Reports
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 text-success">
                  <FaMoneyBillWave className="me-2" />
                  Account Receivables
                </h5>
                <div className="d-flex flex-wrap gap-2">
                  <Button variant="outline-success" className="d-flex align-items-center">
                    <FiDatabase className="me-2" />
                    API
                  </Button>
                  <Button variant="outline-success" className="d-flex align-items-center">
                    <FiPieChart className="me-2" />
                    Summary Reports
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </>
        );
      
      case "shirmila":
        return (
          <>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 text-primary">
                  <FaFileInvoiceDollar className="me-2" />
                  Account Payables
                </h5>
                <Row>
                  {['Ticketing', 'Income', 'Aging Reports', 'Bank Reconciliation', 'Summary Reports', 'Other'].map(item => (
                    <Col md={4} key={item} className="mb-3">
                      <Button 
                        variant="outline-primary" 
                        className="w-100 text-start d-flex align-items-center"
                      >
                        {item === 'Ticketing' && <FaPlane className="me-2" />}
                        {item === 'Income' && <FiDollarSign className="me-2" />}
                        {item === 'Aging Reports' && <FiCalendar className="me-2" />}
                        {item === 'Bank Reconciliation' && <FiCreditCard className="me-2" />}
                        {item === 'Summary Reports' && <FiPieChart className="me-2" />}
                        {item === 'Other' && <FiLayers className="me-2" />}
                        {item}
                        <FiChevronRight className="ms-auto" />
                      </Button>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>

            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <h5 className="mb-3 text-success">
                  <FaMoneyBillWave className="me-2" />
                  Account Receivables
                </h5>
                <Row>
                  {['API-Ticketing', 'Sales', 'Summary Reports'].map(item => (
                    <Col md={4} key={item} className="mb-3">
                      <Button 
                        variant="outline-success" 
                        className="w-100 text-start d-flex align-items-center"
                      >
                        {item === 'API-Ticketing' && <FaPlane className="me-2" />}
                        {item === 'Sales' && <FiTrendingUp className="me-2" />}
                        {item === 'Summary Reports' && <FiPieChart className="me-2" />}
                        {item}
                        <FiChevronRight className="ms-auto" />
                      </Button>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col md={8}>
          <h2 className="mb-0">
            <FaFileInvoiceDollar className="me-2 text-primary" />
            {selectedCompany === 'appleholidays' ? 'Apple Holidays' : 
             selectedCompany === 'aahaas' ? 'Aahaas' : 
             selectedCompany === 'shirmila' ? 'Shirmila Travels' : ''} Finance Dashboard
          </h2>
          <small className="text-muted">Manage invoices, payments and financial reports</small>
        </Col>
        <Col md={4} className="d-flex align-items-center justify-content-end">
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center">
              <FiFilter className="me-2" />
              Filter Period
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item>Today</Dropdown.Item>
              <Dropdown.Item>This Week</Dropdown.Item>
              <Dropdown.Item>This Month</Dropdown.Item>
              <Dropdown.Item>This Quarter</Dropdown.Item>
              <Dropdown.Item>Custom Range</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="primary" className="ms-3 d-flex align-items-center">
            <FiRefreshCw className="me-2" />
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Quick Stats Row */}
      <Row className="mb-4">
        <Col xl={3} md={6}>
          <Card className="shadow-sm border-start border-primary border-4">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted mb-2">Total Invoices</h6>
                  <h3 className="mb-0">₹{invoiceStats.total.toLocaleString()}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <FaFileInvoiceDollar className="text-primary" size={24} />
                </div>
              </div>
              <ProgressBar now={(invoiceStats.paid / invoiceStats.total) * 100} 
                variant="success" className="mt-3" style={{height: '6px'}} />
              <small className="text-muted">{Math.round((invoiceStats.paid / invoiceStats.total) * 100)}% Paid</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="shadow-sm border-start border-success border-4">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted mb-2">Paid Invoices</h6>
                  <h3 className="mb-0">₹{invoiceStats.paid.toLocaleString()}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <FiTrendingUp className="text-success" size={24} />
                </div>
              </div>
              <div className="mt-3">
                <Badge bg="success" className="me-2">+12%</Badge>
                <small className="text-muted">vs last month</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="shadow-sm border-start border-warning border-4">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted mb-2">Pending Invoices</h6>
                  <h3 className="mb-0">₹{invoiceStats.pending.toLocaleString()}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <FiFileText className="text-warning" size={24} />
                </div>
              </div>
              <div className="mt-3">
                <Badge bg="warning" className="me-2">+5%</Badge>
                <small className="text-muted">vs last month</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={3} md={6}>
          <Card className="shadow-sm border-start border-danger border-4">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="text-muted mb-2">Overdue Invoices</h6>
                  <h3 className="mb-0">₹{invoiceStats.overdue.toLocaleString()}</h3>
                </div>
                <div className="bg-danger bg-opacity-10 p-3 rounded">
                  <FiTrendingDown className="text-danger" size={24} />
                </div>
              </div>
              <div className="mt-3">
                <Badge bg="danger" className="me-2">+8%</Badge>
                <small className="text-muted">vs last month</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row>
        <Col md={4}>
          {/* Quick Actions Card */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">
                <FiPocket className="me-2 text-info" />
                Quick Actions
              </h5>
              <Button variant="outline-primary" className="w-100 mb-2 d-flex align-items-center">
                <FiPlus className="me-2" />
                Create New Invoice
              </Button>
              <Button variant="outline-secondary" className="w-100 mb-2 d-flex align-items-center">
                <FiPrinter className="me-2" />
                Print Invoices
              </Button>
              <Button variant="outline-success" className="w-100 mb-2 d-flex align-items-center">
                <FaChartLine className="me-2" />
                P&L Reports
              </Button>
              <Button variant="outline-info" className="w-100 d-flex align-items-center">
                <FiCreditCard className="me-2" />
                Bank Accounts
              </Button>
            </Card.Body>
          </Card>

          {/* Company Specific Navigation */}
          {renderCompanySpecificNav()}
        </Col>

        <Col md={8}>
          {/* Recent Invoices Table */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <FaReceipt className="me-2 text-primary" />
                  Recent Invoices
                </h5>
                <Form.Control 
                  type="text" 
                  placeholder="Search invoices..." 
                  style={{width: '200px'}}
                  className="d-flex align-items-center"
                />
              </div>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map(item => (
                    <tr key={item}>
                      <td>INV-2023-{1000 + item}</td>
                      <td>Client {item}</td>
                      <td>2023-06-{10 + item}</td>
                      <td>₹{(5000 + (item * 1250)).toLocaleString()}</td>
                      <td>
                        <Badge bg={item % 3 === 0 ? 'success' : item % 2 === 0 ? 'warning' : 'danger'}>
                          {item % 3 === 0 ? 'Paid' : item % 2 === 0 ? 'Pending' : 'Overdue'}
                        </Badge>
                      </td>
                      <td>
                        <Button variant="link" size="sm" className="p-0">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="d-flex justify-content-end">
                <Button variant="link" className="text-decoration-none">
                  View All Invoices <FiChevronRight />
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Bank Accounts & Reconciliation */}
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="mb-3">
                <FiCreditCard className="me-2 text-info" />
                Bank Accounts & Reconciliation
              </h5>
              <Row>
                <Col md={6}>
                  <div className="p-3 bg-light rounded mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">HDFC Bank</h6>
                      <Badge bg="success">Active</Badge>
                    </div>
                    <small className="text-muted">A/c No: ******7890</small>
                    <div className="mt-2">
                      <span className="fw-bold">₹1,25,890.00</span>
                      <small className="text-muted ms-2">Current Balance</small>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="p-3 bg-light rounded mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">ICICI Bank</h6>
                      <Badge bg="success">Active</Badge>
                    </div>
                    <small className="text-muted">A/c No: ******4567</small>
                    <div className="mt-2">
                      <span className="fw-bold">₹89,450.00</span>
                      <small className="text-muted ms-2">Current Balance</small>
                    </div>
                  </div>
                </Col>
              </Row>
              <div className="d-flex justify-content-between mt-2">
                <Button variant="outline-primary" size="sm">
                  <FiRefreshCw className="me-1" />
                  Reconcile Now
                </Button>
                <Button variant="link" size="sm" className="text-decoration-none">
                  View All Accounts <FiChevronRight />
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;