import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Row, Col } from 'react-bootstrap';
import { FaPrint, FaDownload, FaArrowLeft } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const invoice_shirmila_view = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axios.get(`/api/invoices/${id}`);
        setInvoice(response.data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.open(`/api/invoices/${id}/print`, '_blank');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': return <Badge bg="success">Paid</Badge>;
      case 'pending': return <Badge bg="warning" text="dark">Pending</Badge>;
      case 'cancelled': return <Badge bg="danger">Cancelled</Badge>;
      default: return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return <div className="container py-4">Loading invoice...</div>;
  }

  if (!invoice) {
    return <div className="container py-4">Invoice not found</div>;
  }

  return (
    <div className="container py-4">
      <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">
        <FaArrowLeft /> Back to List
      </Button>
      
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5>Invoice #{invoice.invoice_number}</h5>
          <div>
            {getStatusBadge(invoice.status)}
            <Button variant="primary" className="ms-2" onClick={handlePrint}>
              <FaPrint /> Print
            </Button>
            <Button variant="success" className="ms-2">
              <FaDownload /> Download PDF
            </Button>
          </div>
        </Card.Header>
        
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <h6>From:</h6>
              <p>
                <strong>{invoice.company.name}</strong><br />
                {invoice.company.address}<br />
                GSTIN: {invoice.company.gstin}
              </p>
            </Col>
            <Col md={6} className="text-end">
              <h6>To:</h6>
              <p>
                <strong>{invoice.customer.name}</strong><br />
                {invoice.customer.address}<br />
                {invoice.customer.gst_no && `GST: ${invoice.customer.gst_no}`}
              </p>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={6}>
              <p><strong>Invoice Date:</strong> {new Date(invoice.issue_date).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> {new Date(invoice.due_date).toLocaleDateString()}</p>
            </Col>
            <Col md={6} className="text-end">
              <p><strong>Sales ID:</strong> {invoice.sales_id}</p>
              <p><strong>Printed By:</strong> {invoice.printed_by}</p>
            </Col>
          </Row>
          
          <Table striped bordered className="mb-4">
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{invoice.currency} {item.price.toFixed(2)}</td>
                  <td>{item.discount}%</td>
                  <td>{invoice.currency} {item.total_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          <Row>
            <Col md={{ span: 6, offset: 6 }}>
              <Table bordered>
                <tbody>
                  <tr>
                    <td><strong>Sub Total:</strong></td>
                    <td className="text-end">{invoice.currency} {invoice.sub_total.toFixed(2)}</td>
                  </tr>
                  {invoice.handling_fee > 0 && (
                    <tr>
                      <td><strong>Handling Fee:</strong></td>
                      <td className="text-end">{invoice.currency} {invoice.handling_fee.toFixed(2)}</td>
                    </tr>
                  )}
                  {invoice.gst_amount > 0 && (
                    <tr>
                      <td><strong>GST:</strong></td>
                      <td className="text-end">{invoice.currency} {invoice.gst_amount.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td><strong>Total:</strong></td>
                    <td className="text-end">{invoice.currency} {invoice.total_amount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td><strong>Amount Received:</strong></td>
                    <td className="text-end">{invoice.currency} {invoice.amount_received.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td><strong>Balance:</strong></td>
                    <td className="text-end">{invoice.currency} {invoice.balance.toFixed(2)}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
          
          <div className="mt-4">
            <h6>Payment Instructions:</h6>
            <p>{invoice.payment_instructions}</p>
            
            <h6 className="mt-3">Account Details:</h6>
            <p>
              <strong>Bank:</strong> {invoice.company.bank_name}<br />
              <strong>Account No:</strong> {invoice.company.account_number}<br />
              <strong>IFSC:</strong> {invoice.company.ifsc_code}
            </p>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

export default invoice_shirmila_view