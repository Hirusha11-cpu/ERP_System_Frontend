import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Card, Badge, Modal, Row, Col } from 'react-bootstrap';
import { FaEye, FaTrash, FaPrint, FaDownload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CompanyContext } from '../../../../contentApi/CompanyProvider';

const Invoice_List_shirmila = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const { currentCompany } = useContext(CompanyContext); // Get current company from context
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/invoices', {
        params: {
          company_id: currentCompany.id // Pass company ID to filter invoices
        }
      });
      console.log('Fetched invoices:', response.data);
      
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoiceId) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const handlePrintInvoice = async (invoiceId) => {
    try {
      const response = await axios.get(`/api/invoices/${invoiceId}/print`, {
        responseType: 'blob'
      });
      
      const fileURL = window.URL.createObjectURL(new Blob([response.data]));
      const fileLink = document.createElement('a');
      fileLink.href = fileURL;
      fileLink.setAttribute('download', `invoice_${invoiceId}.pdf`);
      document.body.appendChild(fileLink);
      fileLink.click();
    } catch (error) {
      console.error('Error printing invoice:', error);
    }
  };

  const confirmDelete = (invoice) => {
    setInvoiceToDelete(invoice);
    setShowDeleteModal(true);
  };

  const handleDeleteInvoice = async () => {
    try {
      await axios.delete(`/api/invoices/${invoiceToDelete.id}`);
      fetchInvoices(); // Refresh the list
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge bg="success">Paid</Badge>;
      case 'pending':
        return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="container py-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5>Invoice List</h5>
          <Button variant="primary" onClick={() => navigate('/invoices/create')}>
            Create New Invoice
          </Button>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center">Loading invoices...</div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoice_number}</td>
                      <td>{invoice.customer?.name || 'N/A'}</td>
                      <td>{new Date(invoice.issue_date).toLocaleDateString()}</td>
                      <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                      <td>{invoice.currency} {invoice.total_amount.toFixed(2)}</td>
                      <td>{getStatusBadge(invoice.status)}</td>
                      <td>
                        <Button 
                          variant="info" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleViewInvoice(invoice.id)}
                        >
                          <FaEye /> View
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handlePrintInvoice(invoice.id)}
                        >
                          <FaPrint /> Print
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => confirmDelete(invoice)}
                        >
                          <FaTrash /> Cancel
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">No invoices found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to cancel invoice #{invoiceToDelete?.invoice_number}? 
          This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Close
          </Button>
          <Button variant="danger" onClick={handleDeleteInvoice}>
            Confirm Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Invoice_List_shirmila;