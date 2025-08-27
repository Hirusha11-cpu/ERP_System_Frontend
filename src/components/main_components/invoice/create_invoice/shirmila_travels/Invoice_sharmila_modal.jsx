import React from "react";
import { Modal, Button } from "react-bootstrap";
import { FaPrint, FaDownload } from "react-icons/fa";
import html2pdf from "html2pdf.js";
import { useRef } from "react";

const Invoice_sharmila_modal = ({
  show,
  onHide,
  formData,
  countryOptions,
  currencySymbols,
  printInvoice,
  formatDate,
}) => {
  console.log("Invoice Data:", formData);
  const calculateTravelDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
    return diffDays > 0 ? diffDays : 0;
  };
  const receiptRef = useRef(); // Reference to modal body

  // const downloadPDF = () => {
  //   const element = receiptRef.current;
  //   const opt = {
  //     margin: 0.3,
  //     filename: `receipt_${formData.invoice.number || "order"}.pdf`,
  //     image: { type: "jpeg", quality: 0.98 },
  //     html2canvas: { scale: 2 },
  //     jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  //   };

  //   html2pdf().set(opt).from(element).save();
  // };

  const downloadPDF = () => {
      const element = receiptRef.current;
      const opt = {
        margin: 0.3,
        filename: `receipt_${formData.invoice.number || "order"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: {
          unit: "in",
          format: [8.5, 11], // width x height (inches) → makes a tall portrait page
          orientation: "portrait",
        },
      };
  
      html2pdf().set(opt).from(element).save();
    };

  return (
    <Modal show={show} onHide={onHide} size="lg" fullscreen="lg-down">
      <Modal.Header closeButton>
        <Modal.Title>Invoice Preview</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0" ref={receiptRef}>
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
              <div>
                <strong>GST:</strong>{" "}
                {"7895"}
              </div>
            </div>
            <div className="text-start">
              <div>
                <strong>Tour Confirmation No.</strong> {"S00001"}
              </div>
              <div>
                <strong>Invoice No.</strong>{" "}
                {countryOptions.find((c) => c.code === formData.invoice.country)
                  ?.prefix || "IN"}
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
                <th style={{ padding: "8px", textAlign: "right" }}>Discount</th>
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
               {formData.currencyDetails.currency === "INR" ? (
                <tr>
                  <td>
                    <strong>Handling Fee:</strong>
                  </td>
                  <td colSpan="3" style={{ textAlign: "right" }}>
                    {/* <strong>Handling Fee:</strong> */}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {currencySymbols[formData.currencyDetails.currency] || "$"}
                    {formData.totals.handlingFee.toFixed(2)}
                  </td>
                </tr>
              ) : null}
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
          {/* {formData.payment.type === "non-credit" && (
            <div className="mb-3">
              {formData.payment.instructions}{" "}
              {formData.payment.type === "non-credit" &&
                formData.payment.collectionDate}
            </div>
          )} */}
          <p>
            <strong>Start Date:</strong> {formData.invoice.startDate}{" "}
            &nbsp;|&nbsp;
            <strong>End Date:</strong> {formData.invoice.endDate} &nbsp;|&nbsp;
            <strong>Travel Period:</strong>{" "}
            {calculateTravelDays(
              formData.invoice.startDate,
              formData.invoice.endDate
            )}{" "}
            days
          </p>

          {/* Bottom left: Staff and Remark */}
          {/* <div className="row">
            <div className="col-md-6">
              <div>
                <strong>Remark:</strong> {formData.payment.remarks}
              </div>
            </div>
          </div> */}
          <div className="row">
            <div className="col-md-6">
              {formData.payment_instructions && (
                <div className="mb-3">{formData.payment_instructions}</div>
              )}
              <div>
                <strong>Remark:</strong>
                {/* {currentInvoice.remarks} <br /> */}
                Please make payment before{" "}
                {new Date(
                  new Date().setDate(new Date().getDate() + 5)
                ).toLocaleDateString()}{" "}
                (XE rate - 1 USD = LKR 365)
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="success" onClick={downloadPDF}>
          <FaDownload /> Download PDF
        </Button>
        {/* <Button
          variant="success"
          onClick={() => alert("PDF download would be implemented here")}
        >
          <FaDownload /> Download PDF
        </Button> */}
      </Modal.Footer>
    </Modal>
  );
};

export default Invoice_sharmila_modal;
