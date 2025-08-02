import React from "react";
import { Modal, Button } from "react-bootstrap";
import { FaPrint, FaDownload } from "react-icons/fa";

const Invoice_aahaas_modal = ({
  show,
  onHide,
  formData,
  formatDate,
  currencySymbols,
  printInvoice
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      fullscreen="lg-down"
      className="receipt-modal"
    >
      <div className="modal-content">
        <div className="receipt-header">
          <div className="receipt-title" style={{ textAlign: "center" }}>
            <img
              src="https://s3-aahaas-prod-assets.s3.ap-southeast-1.amazonaws.com/images/aahaas.png"
              alt="Aahaas Logo"
              className="receipt-logo"
              style={{ width: "200px" }}
            />
          </div>
          <div>{new Date().toLocaleDateString()}</div>
        </div>
        <Modal.Body className="receipt-body">
          <div className="thank-you">
            Dear {formData.customer.name || "Customer"}, Thank you for your
            order
          </div>
          <p>Please find below the receipt for your order</p>

          {/* Order Meta Information */}
          <div className="order-meta">
            <div className="meta-item">
              <span className="meta-label">Order No:</span>
              <span className="meta-value">
                #{formData.invoice.number || "IS44641"}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Order Date:</span>
              <span className="meta-value">
                {formatDate(formData.invoice.issueDate) || "14th Jan 2025"} |{" "}
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Payment Type:</span>
              <span className="meta-value">
                {formData.payment.type === "credit" ? "Credit" : "Non-Credit"} |
                {formData.totals.balance <= 0 ? "Full Payment" : "Partial Payment"}
              </span>
            </div>
          </div>

          {/* Customer Details */}
          <h5>Customer Details</h5>
          <table className="customer-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Email</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{formData.customer.name || "PICK YOUR TRAIL"}</td>
                <td>{formData.customer.address || "-"}</td>
                <td>{formData.customer.email || "-"}</td>
                <td>{formData.customer.phone || "-"}</td>
              </tr>
            </tbody>
          </table>

          {/* Order Items */}
          <h5>Services</h5>
          <table className="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Unit Fare</th>
                <th>Discount</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {formData.serviceItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>
                    {currencySymbols[formData.currencyDetails.currency] || "$"}
                    {item.price.toFixed(2)}
                  </td>
                  <td>{item.discount}%</td>
                  <td>{item.qty}</td>
                  <td>
                    {currencySymbols[formData.currencyDetails.currency] || "$"}
                    {item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Order Totals */}
          <table className="totals-table">
            <tr>
              <td>Sub Total:</td>
              <td>
                {currencySymbols[formData.currencyDetails.currency] || "$"}
                {formData.totals.subTotal.toFixed(2)}
              </td>
            </tr>
            {formData.currencyDetails.currency === "INR" && (
              <>
                <tr>
                  <td>CGST of 9.00%:</td>
                  <td>₹{(formData.totals.gst / 2).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>SGST of 9.00%:</td>
                  <td>₹{(formData.totals.gst / 2).toFixed(2)}</td>
                </tr>
              </>
            )}
            <tr>
              <td>
                <strong>Total:</strong>
              </td>
              <td>
                <strong>
                  {currencySymbols[formData.currencyDetails.currency] || "$"}
                  {formData.totals.total.toFixed(2)}
                </strong>
              </td>
            </tr>
            <tr>
              <td>Amount Received:</td>
              <td>
                {currencySymbols[formData.currencyDetails.currency] || "$"}
                {formData.totals.amountReceived.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Balance:</strong>
              </td>
              <td>
                <strong>
                  {currencySymbols[formData.currencyDetails.currency] || "$"}
                  {formData.totals.balance.toFixed(2)}
                </strong>
              </td>
            </tr>
          </table>

          {/* Contact Information */}
          <div className="contact-info">
            <p>
              Should you have any questions regarding your order, please send
              an email to <strong>info@aahaas.com</strong>.
            </p>
            <p>
              Or contact us at <strong>+94 70 722 4227</strong>
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          <Button variant="primary" onClick={printInvoice} className="print-receipt">
            <FaPrint /> Print Receipt
          </Button>
          <Button variant="success" onClick={() => alert("PDF download would be implemented here")}>
            <FaDownload /> Download PDF
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default Invoice_aahaas_modal;