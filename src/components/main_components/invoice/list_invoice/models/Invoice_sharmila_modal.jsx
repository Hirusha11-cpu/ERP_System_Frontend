import React from "react";
import { Modal, Button } from "react-bootstrap";
import { FaPrint, FaDownload } from "react-icons/fa";

const Invoice_sharmila_modal = ({
  show,
  onHide,
  invoice,
  formatDate,
  calculateItemTotal,
  handlePrintInvoice
}) => {
  if (!invoice) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      fullscreen="lg-down"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <FaFileInvoiceDollar className="me-2" />
          Invoice Preview - {invoice.invoice_number}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="invoice-preview p-4">
          {/* Company Header */}
          <div className="text-center mb-3">
            <h4 className="mb-1 fw-bold">Sharmila Tours & Travels</h4>
            <div className="mb-1">
              Shop No:1st Floor,10,Venkatraman Road,Kamala Second street
            </div>
            <div className="mb-1">Chinna Chokkikulam, Madurai - 625002</div>
            <div className="mb-1">Tel:+91 0452 405 8375/403-4704</div>
            <div className="mb-1">E-mail: chennai@Sharmilatravels.com</div>
            <div className="mb-1">
              Service Tax Registration No.: ADVT544290
            </div>
            <div className="mb-3">GSTIN: 33ADVT544290TZV</div>

            <h5 className="fw-bold mb-3">INVOICE </h5>
          </div>

          {/* Invoice Meta and Customer Info */}
          <div className="d-flex justify-content-between mb-4">
            <div>
              <div>
                <strong>To:</strong>{" "}
                {invoice.customer?.name || "N/A"}
              </div>
              <div>{invoice.customer?.address || "N/A"}</div>
            </div>
            <div className="text-end">
              <div>
                <strong>No.</strong> {invoice.invoice_number}
              </div>
              <div>
                <strong>Date</strong>{" "}
                {formatDate(invoice.issue_date)}
              </div>
              <div>
                <strong>Your Ref.</strong>{" "}
                {invoice.your_ref || "N/A"}
              </div>
              <div>
                <strong>Sales ID</strong> {invoice.sales_id || "N/A"}
              </div>
              <div>
                <strong>Printed By</strong>{" "}
                {invoice.printed_by || "N/A"}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="table table-bordered mb-3">
            <thead>
              <tr style={{ backgroundColor: "#343a40", color: "white" }}>
                <th>Description</th>
                <th style={{ textAlign: "right" }}>Unit Fare</th>
                <th style={{ textAlign: "right" }}>Discount</th>
                <th style={{ textAlign: "right" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td style={{ textAlign: "right" }}>
                    {invoice.currency} {item.price}
                  </td>
                  <td style={{ textAlign: "right" }}>{item.discount}%</td>
                  <td style={{ textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>
                    {invoice.currency}{" "}
                    {calculateItemTotal(item).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Payment Instructions */}
          <div className="mb-3">{invoice.payment_instructions}</div>

          {/* Totals */}
          <div className="row mb-4">
            <div className="col-md-6 offset-md-6">
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      <strong>Sub Total:</strong>
                    </td>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      {invoice.currency} {invoice.sub_total}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      <strong>Total:</strong>
                    </td>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      {invoice.currency}{" "}
                      {invoice.total_amount}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      <strong>Amount Received:</strong>
                    </td>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      {invoice.currency}{" "}
                      {invoice.amount_received}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      <strong>Balance:</strong>
                    </td>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      {invoice.currency} {invoice.balance}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom left: Staff and Remark */}
          <div className="row">
            <div className="col-md-6">
              <div>
                <strong>Remark:</strong> {invoice.remarks}
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
        >
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => handlePrintInvoice(invoice?.id)}
          className="d-flex align-items-center"
        >
          <FaPrint className="me-1" /> Print Invoice
        </Button>
        <Button
          variant="success"
          onClick={() => alert("PDF download would be implemented here")}
          className="d-flex align-items-center"
        >
          <FaDownload className="me-1" /> Download PDF
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Invoice_sharmila_modal;