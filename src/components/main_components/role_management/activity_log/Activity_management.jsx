import React, { useState, useEffect } from 'react';
import { Table, Card, Form, Row, Col, Badge, Button, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { format } from 'date-fns';

const Activity_management = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    log_name: '',
    user_name: '',
    date_from: '',
    date_to: '',
    action_type: ''
  });
  const [showDetails, setShowDetails] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchActivityLogs();
  }, [filters, currentPage]);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const params = {
        ...filters,
        page: currentPage
      };
      
      const response = await axios.get('/api/activity-logs', {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setLogs(response.data.data);
      setTotalPages(response.data.last_page);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleResetFilters = () => {
    setFilters({
      log_name: '',
      user_name: '',
      date_from: '',
      date_to: '',
      action_type: ''
    });
    setCurrentPage(1);
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const renderActionBadge = (description) => {
    if (description.includes('created')) {
      return <Badge bg="success">Created</Badge>;
    } else if (description.includes('updated')) {
      return <Badge bg="primary">Updated</Badge>;
    } else if (description.includes('deleted')) {
      return <Badge bg="danger">Deleted</Badge>;
    }
    return <Badge bg="secondary">Other</Badge>;
  };

  const renderSubjectType = (subjectType) => {
    return subjectType.split('\\').pop();
  };

  return (
    <div className="container-fluid mb-4">
      <h2>Activity Log Management</h2>
      <p className="text-muted">Track all system activities and changes</p>
      
      <Card className="mb-4">
        <Card.Header className="bg-light">
          <h5>Filters</h5>
        </Card.Header>
        <Card.Body>
          <Form>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Activity Type</Form.Label>
                  <Form.Select
                    name="log_name"
                    value={filters.log_name}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Activities</option>
                    <option value="invoice">Invoice</option>
                    <option value="customer">Customer</option>
                    <option value="user">User</option>
                    <option value="cost">Cost</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>User Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="user_name"
                    placeholder="Search by user"
                    value={filters.user_name}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>From Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_from"
                    value={filters.date_from}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>To Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_to"
                    value={filters.date_to}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button
                  variant="outline-secondary"
                  onClick={handleResetFilters}
                  className="me-2"
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  onClick={fetchActivityLogs}
                >
                  Apply
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="bg-light">
          <h5>Activity Logs</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5">
              <h5>No activity logs found</h5>
              <p className="text-muted">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Activity</th>
                      <th>Action</th>
                      <th>User</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td>{log.id}</td>
                        <td>
                          <strong>{renderSubjectType(log.subject_type)}</strong>
                          {log.subject && (
                            <>
                              <br />
                              <small className="text-muted">
                                {log.subject.invoice_number || log.subject.name || `ID: ${log.subject_id}`}
                              </small>
                            </>
                          )}
                        </td>
                        <td>{renderActionBadge(log.description)}</td>
                        <td>
                          {log.causer ? (
                            <>
                              <strong>{log.causer.name}</strong>
                              <br />
                              <small className="text-muted">
                                {log.causer.email}
                              </small>
                              <br />
                              <Badge bg="info">{log.properties?.user_role}</Badge>
                            </>
                          ) : (
                            'System'
                          )}
                        </td>
                        <td>
                          {format(new Date(log.created_at), 'dd MMM yyyy')}
                          <br />
                          <small className="text-muted">
                            {format(new Date(log.created_at), 'hh:mm a')}
                          </small>
                        </td>
                        <td>
                          <Button
                            variant="info"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Showing page {currentPage} of {totalPages}
                </div>
                <div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="me-2"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Activity Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <div>
              <h5>{selectedLog.description}</h5>
              <hr />
              
              <Row>
                <Col md={6}>
                  <h6>User Information</h6>
                  <Table striped bordered size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Name</strong></td>
                        <td>{selectedLog.causer?.name || 'System'}</td>
                      </tr>
                      <tr>
                        <td><strong>Email</strong></td>
                        <td>{selectedLog.causer?.email || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Role</strong></td>
                        <td>{selectedLog.properties?.user_role || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td><strong>Action</strong></td>
                        <td>{renderActionBadge(selectedLog.description)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <h6>Activity Information</h6>
                  <Table striped bordered size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Date & Time</strong></td>
                        <td>
                          {format(new Date(selectedLog.created_at), 'dd MMM yyyy hh:mm a')}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Activity Type</strong></td>
                        <td>{renderSubjectType(selectedLog.subject_type)}</td>
                      </tr>
                      <tr>
                        <td><strong>Reference</strong></td>
                        <td>
                          {selectedLog.subject?.invoice_number || 
                           selectedLog.subject?.name || 
                           `ID: ${selectedLog.subject_id}`}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>

              <h6 className="mt-4">Details</h6>
              <Card>
                <Card.Body>
                  <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {JSON.stringify(selectedLog.properties, null, 2)}
                  </pre>
                </Card.Body>
              </Card>

              {selectedLog.subject && (
                <>
                  <h6 className="mt-4">Subject Details</h6>
                  <Card>
                    <Card.Body>
                      <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                        {JSON.stringify(selectedLog.subject, null, 2)}
                      </pre>
                    </Card.Body>
                  </Card>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetails(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Activity_management;