import React from "react";
import { Modal, Button } from "react-bootstrap";
import { FaPrint, FaDownload } from "react-icons/fa";

const Invoice_appleholidays_modal = ({
  show,
  onHide,
  formData,
  formatDate,
  currencySymbols,
  printInvoice,
}) => {
  console.log("Invoice Data:", formData);
  const calculateTravelDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" fullscreen="lg-down">
      <Modal.Header closeButton>
        <Modal.Title>Invoice Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="invoice-preview p-4">
          {/* Company Header */}
          <div className="company-header text-center mb-4">
            <img
              src="/images/logo/appleholidays_extend.png"
              alt="Apple Holidays Destination Services"
              className="img-fluid mb-3"
              style={{ width: "400px" }}
            />
            <div>One Galle Face Tower, 2208, 1A Centre Road, Colombo 002</div>
            <div>Tel: 011 2352 400 | Web: www.appleholidaysds.com</div>
          </div>

          {/* Invoice Title */}
          <div className="text-center mb-3">
            <h5 className="fw-bold">INVOICE</h5>
          </div>

          {/* Invoice Meta and Customer Info */}
          <div className="d-flex justify-content-between mb-4">
            <div>
              <div>
                <strong>To:</strong>{" "}
                {formData.customer.name || "PICK YOUR TRAVEL"}
              </div>
              <div>
                {formData.customer.address || "Ravichander Balachander • 9"}
              </div>
            </div>
            <div className="text-end">
              <div>
                <strong>No.</strong> {formData.invoice.number || "IS44641"}
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
                {formData.invoice.salesId || "ARAVEND"}
              </div>
              <div>
                <strong>Printed By</strong>{" "}
                {formData.invoice.printedBy || "KAVIYA"}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="invoice-table mb-3">
            <thead>
              <tr>
                <th>TKT/VOUCH</th>
                <th>UNIT FARE</th>
                <th>DISC %</th>
                <th>QTY.</th>
                <th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {formData.serviceItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td className="text-end">
                    {currencySymbols[formData.currencyDetails.currency] || "$"}
                    {item.price.toFixed(2)}
                  </td>
                  <td className="text-end">{item.discount}%</td>
                  <td className="text-end">{item.qty}</td>
                  <td className="text-end">
                    {currencySymbols[formData.currencyDetails.currency] || "$"}
                    {item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="mb-3">
                <p className="mb-0">
                  {formData.payment.type === "credit" ? (
                    <span></span>
                  ) : (
                    <span>
                      Please settle the invoice on or before{" "}
                      {formatDate(formData.payment.collectionDate)}
                    </span>
                  )}
                </p>
              </div>

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

            <div className="col-md-6">
              <table className="invoice-totals">
                <tr>
                  <td style={{ textAlign: "right" }}>
                    <strong>SUB TOTAL:</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {currencySymbols[formData.currencyDetails.currency] || "$"}
                    {formData.totals.subTotal.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ textAlign: "right" }}>
                    <strong>BANK CHARGES:</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {currencySymbols[formData.currencyDetails.currency] || "$"}
                    {formData.totals.bankCharges.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ textAlign: "right" }}>
                    <strong>TOTAL:</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {currencySymbols[formData.currencyDetails.currency] || "$"}
                    {formData.totals.total.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ textAlign: "right" }}>
                    <strong>AMOUNT RECEIVED:</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {currencySymbols[formData.currencyDetails.currency] || "$"}
                    {formData.totals.amountReceived.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ textAlign: "right" }}>
                    <strong>BALANCE DUE:</strong>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {currencySymbols[formData.currencyDetails.currency] || "$"}
                    {formData.totals.balance.toFixed(2)}
                  </td>
                </tr>
              </table>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div>
                <p>
                  <strong>Start Date:</strong> {formData.invoice.startDate}{" "}
                  &nbsp;|&nbsp;
                  <strong>End Date:</strong> {formData.invoice.endDate}{" "}
                  &nbsp;|&nbsp;
                  <strong>Travel Period:</strong>{" "}
                  {calculateTravelDays(
                    formData.invoice.startDate,
                    formData.invoice.endDate
                  )}{" "}
                  days
                </p>
                <strong>Remark:</strong> {formData.payment.remarks}
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={printInvoice}>
          <FaPrint /> Print Invoice
        </Button>
        <Button variant="success">
          <FaDownload /> Download PDF
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Invoice_appleholidays_modal;
