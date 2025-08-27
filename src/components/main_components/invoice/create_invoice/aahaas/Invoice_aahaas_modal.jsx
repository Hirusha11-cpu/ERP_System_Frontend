import React from "react";
import { Modal, Button } from "react-bootstrap";
import { FaPrint, FaDownload } from "react-icons/fa";
import html2pdf from "html2pdf.js";
import { useRef } from "react";

const Invoice_aahaas_modal = ({
  show,
  onHide,
  formData,
  formatDate,
  currencySymbols,
  printInvoice,
}) => {
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
          format: [8.5, 14], // width x height (inches) → makes a tall portrait page
          orientation: "portrait",
        },
      };
  
      html2pdf().set(opt).from(element).save();
    };
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      fullscreen="lg-down"
      className="receipt-modal"
    >
      <div className="modal-content">
        <Modal.Body className="receipt-body" ref={receiptRef}>
          <div className="invoice-preview p-4" ref={receiptRef}>
      
          <div className="receipt-header">
            <div className="receipt-title" style={{ textAlign: "center" }}>
              <img
                // src="https://s3-aahaas-prod-assets.s3.ap-southeast-1.amazonaws.com/images/aahaas.png"
                src="/images/logo/aahaas.png"
                alt="Aahaas Logo"
                className="receipt-logo"
                style={{ width: "200px" }}
              />
            </div>
            <div className="receipt-info" style={{ textAlign: "center" }}>
              <div>One Galle Face Tower, 2208, 1A Centre Road, Colombo 002</div>
              <div>Tel: 011 2352 400 | Web: www.appleholidaysds.com</div>
            </div>
            {/* <div>{new Date().toLocaleDateString()}</div> */}
          </div>
          <div className="thank-you">
            Dear {formData.customer.name || "Customer"}, Thank you for your
            order
          </div>
          <p>Please find below the receipt for your order</p>

          {/* Order Meta Information */}
          <div className="order-meta">
            <div className="meta-item">
              <span className="meta-label pe-1">Invoice No:</span>
              <span className="meta-value ">
                {/* {formData.invoice.country+formData.invoice.number || "IS44641"} */}
                {"44641"}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label pe-1">Order No:</span>
              <span className="meta-value ">
                {formData.invoice.country+formData.invoice.number || "IS44641"}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label pe-1">Order Date:</span>
              <span className="meta-value">
                {formatDate(formData.invoice.issueDate) || "14th Jan 2025"} |{" "}
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label pe-1">Payment Type:</span>
              <span className="meta-value">
                {formData.payment.type === "credit" ? "Credit" : "Non-Credit"} |
                {formData.totals.balance <= 0
                  ? "Full Payment"
                  : "Partial Payment"}
                {formData.payment.type === "non-credit" && (
                  <span> {formatDate(formData.payment.collectionDate)}</span>
                )}
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
              {formData.currencyDetails.currency === "INR" ? (
                <tr>
                  <td>
                    <strong>Handling Fee:</strong>
                  </td>
                  <td colSpan="3" style={{ textAlign: "right" }}>
                    {/* <strong>Handling Fee:</strong> */}
                  </td>
                  <td>
                    {currencySymbols[formData.currencyDetails.currency] || "$"}
                    {formData.totals.handlingFee.toFixed(2)}
                  </td>
                </tr>
              ) : null}
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

          {/* Contact Information */}
          <div className="contact-info">
            <p>
              Should you have any questions regarding your order, please send an
              email to <strong>info@aahaas.com</strong>.
            </p>
            <p>
              Or contact us at <strong>+94 70 722 4227</strong>
            </p>
          </div>
                
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          {/* <Button variant="primary" onClick={printInvoice} className="print-receipt">
            <FaPrint /> Print Receipt
          </Button> */}
          <Button variant="success" onClick={downloadPDF}>
            <FaDownload /> Download PDF
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default Invoice_aahaas_modal;
