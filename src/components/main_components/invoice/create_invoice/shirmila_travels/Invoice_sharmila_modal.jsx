import React from "react";
import { Modal, Button } from "react-bootstrap";
import { FaPrint, FaDownload } from "react-icons/fa";

const Invoice_sharmila_modal = ({
  show,
  onHide,
  formData,
  countryOptions,
  currencySymbols,
  printInvoice,
  formatDate
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      fullscreen="lg-down"
    >
      <Modal.Header closeButton>
        <Modal.Title>Invoice Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div id="invoice-preview-content" className="invoice-preview p-4">
          {/* Company Header */}
          <div className="text-center mb-3">
            <h4 className="mb-1 fw-bold" style={{ color: "red" }}>
              Sharmila Tours & Travels
            </h4>
            <div className="mb-1">
              No: 148, Aluthmawatha Road, Colombo - 15, Sri Lanka
            </div>
            <div className="mb-1">Tel:011 23 52 400 | 011 23 45 800</div>
            <div className="mb-1">E-mail: fares@sharmilatravels.com </div>

            <h5 className="fw-bold mb-3 mt-4">INVOICE</h5>
          </div>

          {/* Invoice Meta and Customer Info */}
          <div className="d-flex justify-content-between mb-4">
            <div>
              <div>
                <strong>To:</strong>{" "}
                {formData.customer.name || "PICK YOUR TRAIL"}
              </div>
              <div>
                {formData.customer.address || "Ravichander Balachander • 9"}
              </div>
            </div>
            <div className="text-end">
              <div>
                <strong> No.</strong> {"S00001"}
              </div>
              <div>
                <strong>Invoice No.</strong>{" "}
                {countryOptions.find(
                  (c) => c.code === formData.invoice.country
                )?.prefix || "IN"}
                {formData.invoice.number || "IS44641"}
              </div>
              <div>
                <strong>Date</strong> {formatDate(formData.invoice.issueDate)}
              </div>
              <div>
                <strong>Your Ref.</strong>{" "}
                {formData.invoice.yourRef || "399648 CNTL"}
              </div>
              <div>
                <strong>Sales ID</strong>{" "}
                {formData.invoice.salesId || "ARAVIND"}
              </div>
              <div>
                <strong>Printed By</strong>{" "}
                {formData.invoice.printedBy || "KAVIYA"}
              </div>
              <div>
                <strong>Booking ID</strong>{" "}
                {formData.invoice.bookingId || "399648 CNTL"}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table
            className="table table-bordered mb-3"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ backgroundColor: "#343a40", color: "white" }}>
                <th style={{ padding: "8px", textAlign: "left" }}>
                  Description
                </th>
                <th style={{ padding: "8px", textAlign: "right" }}>
                  Unit Fare
                </th>
                <th style={{ padding: "8px", textAlign: "right" }}>
                  Discount
                </th>
                <th style={{ padding: "8px", textAlign: "right" }}>Qty</th>
                <th style={{ padding: "8px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {formData.serviceItems.map((item) => (
                <tr key={item.id}>
                  <td
                    style={{ padding: "8px", borderBottom: "1px solid #ddd" }}
                  >
                    {item.description}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    {currencySymbols[formData.currencyDetails.currency] || ""}
                    {item.price.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    {item.discount}%
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    {item.qty}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    {currencySymbols[formData.currencyDetails.currency] || ""}
                    {item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="row mb-4">
            <div className="col-md-6 offset-md-6">
              <table style={{ width: "100%" }}>
                <tr>
                  <td style={{ padding: "4px", textAlign: "right" }}>
                    <strong>Sub Total:</strong>
                  </td>
                  <td style={{ padding: "4px", textAlign: "right" }}>
                    {currencySymbols[formData.currencyDetails.currency] || ""}
                    {formData.totals.subTotal.toFixed(2)}
                  </td>
                </tr>

                {formData.currencyDetails.currency === "INR" && (
                  <>
                    <tr>
                      <td style={{ padding: "4px", textAlign: "right" }}>
                        <strong>CGST of 9.00%:</strong>
                      </td>
                      <td style={{ padding: "4px", textAlign: "right" }}>
                        ₹{(formData.totals.gst / 2).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "4px", textAlign: "right" }}>
                        <strong>SGST of 9.00%:</strong>
                      </td>
                      <td style={{ padding: "4px", textAlign: "right" }}>
                        ₹{(formData.totals.gst / 2).toFixed(2)}
                      </td>
                    </tr>
                  </>
                )}

                <tr>
                  <td style={{ padding: "4px", textAlign: "right" }}>
                    <strong>Total:</strong>
                  </td>
                  <td style={{ padding: "4px", textAlign: "right" }}>
                    {currencySymbols[formData.currencyDetails.currency] || ""}
                    {formData.totals.total.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px", textAlign: "right" }}>
                    <strong>Amount Received:</strong>
                  </td>
                  <td style={{ padding: "4px", textAlign: "right" }}>
                    {currencySymbols[formData.currencyDetails.currency] || ""}
                    {formData.totals.amountReceived.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "4px", textAlign: "right" }}>
                    <strong>Balance:</strong>
                  </td>
                  <td style={{ padding: "4px", textAlign: "right" }}>
                    {currencySymbols[formData.currencyDetails.currency] || ""}
                    {formData.totals.balance.toFixed(2)}
                  </td>
                </tr>
              </table>
            </div>
          </div>

          {/* Account Details */}
          <div className="mb-4">
            <h6 className="fw-bold">ACCOUNT DETAILS</h6>
            <div>
              <strong>ACCOUNT NAME:</strong> {formData.accountDetails.name}
            </div>
            <div>
              <strong>ACCOUNT NO:</strong> {formData.accountDetails.number}
            </div>
            <div>
              <strong>BANK:</strong> {formData.accountDetails.bank}
            </div>
            <div>
              <strong>BRANCH:</strong> {formData.accountDetails.branch}
            </div>
            <div>
              <strong>IFSC CODE:</strong> {formData.accountDetails.ifsc}
            </div>
            <div>
              <strong>Bank Address:</strong> {formData.accountDetails.address}
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="mb-3">{formData.payment.instructions}</div>

          {/* Bottom left: Staff and Remark */}
          <div className="row">
            <div className="col-md-6">
              <div>
                <strong>Remark:</strong> {formData.payment.remarks}
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
        <Button variant="primary" onClick={printInvoice}>
          <FaPrint /> Print Invoice
        </Button>
        <Button
          variant="success"
          onClick={() => alert("PDF download would be implemented here")}
        >
          <FaDownload /> Download PDF
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Invoice_sharmila_modal;