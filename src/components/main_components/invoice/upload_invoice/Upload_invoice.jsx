import React, { useContext, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Button, Table, Card, Form, Alert, Accordion, Badge, Modal, ProgressBar } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import axios from 'axios';

const Upload_invoice = () => {
   const { selectedCompany } = useContext(CompanyContext);
  const [excelData, setExcelData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [companyNo, setCompanyNo] = useState(null);
  const [submissionResults, setSubmissionResults] = useState([]);
  const [failedRecords, setFailedRecords] = useState([]);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };

    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // Expected columns in the Excel file
  const expectedColumns = [
    "Date",
    "Invoice #",
    "Customer PO #",
    "Customer Name",
    "Amount",
    "Amount Due",
    "Status",
    "Ship Via",
    "Promised Date",
    "Journal Memo",
    "Salesperson",
    "Referral",
  ];

  const formatDateForBackend = (dateStr) => {
    if (!dateStr) return null;

    // Handle Excel serial dates (numeric values)
    if (!isNaN(dateStr) && Number(dateStr) > 10000) {
      // Excel dates are relative to 1900-01-01 (serial number 1)
      const excelEpoch = new Date(1899, 11, 31); // 1900-01-01 minus 1 day
      const date = new Date(excelEpoch.getTime() + Number(dateStr) * 24 * 60 * 60 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      return null;
    }

    // Handle DD/MM/YYYY or similar formats
    const parts = dateStr.split(/[/\-]/);
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    // Fallback to native Date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return null;
  };

  // const cleanAmount = (amountStr) => {
  //   if (!amountStr) return 0;
  //   return parseFloat(amountStr.replace(/[^0-9.-]+/g, '')) || 0;
  // };

  // const handleFileUpload = (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   setIsLoading(true);
  //   setError(null);
  //   setSuccess(null);
  //   setSubmissionResults([]);
  //   setFailedRecords([]);

  //   const reader = new FileReader();
  //   reader.onload = (e) => {
  //     try {
  //       const data = new Uint8Array(e.target.result);
  //       const workbook = XLSX.read(data, { type: "array", dateNF: "dd/mm/yyyy" });
  //       const firstSheetName = workbook.SheetNames[0];
  //       const worksheet = workbook.Sheets[firstSheetName];
  //       const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false, dateNF: "dd/mm/yyyy" });

  //       // Find header row dynamically
  //       let headerRowIndex = -1;
  //       for (let i = 0; i < jsonData.length; i++) {
  //         if (jsonData[i].some(cell => cell === "Date") && jsonData[i].some(cell => cell === "Invoice #")) {
  //           headerRowIndex = i;
  //           break;
  //         }
  //       }

  //       if (headerRowIndex === -1) {
  //         throw new Error("Header row not found in the Excel file.");
  //       }

  //       const headers = jsonData[headerRowIndex].map((h, idx) => (h ? h.trim() : `Column${idx}`));
  //       const dataRows = jsonData.slice(headerRowIndex + 1).filter(row => row.some(cell => cell));

  //       // Map rows to objects using headers
  //       const mappedData = dataRows.map(row => {
  //         const rowObj = {};
  //         headers.forEach((header, idx) => {
  //           rowObj[header] = row[idx] !== undefined ? String(row[idx]).trim() : "";
  //         });
  //         return rowObj;
  //       });

  //       // Validate that all expected columns are present
  //       if (mappedData.length > 0) {
  //         const firstRow = mappedData[0];
  //         const missingColumns = expectedColumns.filter(
  //           (col) => !Object.keys(firstRow).includes(col)
  //         );

  //         if (missingColumns.length > 0) {
  //           setError(`Missing required columns: ${missingColumns.join(", ")}`);
  //           setExcelData([]);
  //           setProcessedData([]);
  //         } else {
  //           setExcelData(mappedData);

  //           // Process data to match backend structure
  //           const processed = mappedData.map((row, index) => {
  //             const collectionDate = formatDateForBackend(row["Promised Date"]);
  //             const invoiceDate = formatDateForBackend(row["Date"]);
  //             // Parse Journal Memo for start/end dates
  //             let startDate = null;
  //             let endDate = null;
  //             if (row["Journal Memo"]) {
  //               const memoParts = row["Journal Memo"].split('-');
  //               if (memoParts.length === 2) {
  //                 startDate = formatDateForBackend(memoParts[0].trim());
  //                 endDate = formatDateForBackend(memoParts[1].trim());
  //               }
  //             }
  //             startDate = startDate || invoiceDate || new Date().toISOString().split('T')[0];
  //             endDate = endDate || collectionDate || new Date().toISOString().split('T')[0];

  //             return {
  //               invoice_number: row["Invoice #"] || "",
  //               customer_po_number: row["Customer PO #"] || "",
  //               customer_name: row["Customer Name"] || "",
  //               amount: cleanAmount(row["Amount"]),
  //               amount_due: cleanAmount(row["Amount Due"]),
  //               status: row["Status"] || "Open",
  //               ship_via: row["Ship Via"] || "",
  //               promised_date: collectionDate,
  //               journal_memo: row["Journal Memo"] || "",
  //               salesperson: row["Salesperson"] || "",
  //               referral: row["Referral"] || "",
  //               customer_id: 1, // Implement lookup if needed
  //               country_code: "IN",
  //               currency: "USD",
  //               exchange_rate: cleanAmount(row["Exchange Rate"]) || 87.52,
  //               tax_treatment: "exclusive",
  //               payment_type: "non-credit",
  //               collection_date: collectionDate || new Date().toISOString().split('T')[0],
  //               payment_instructions: "Please settle the invoice on or before the due date",
  //               staff: row["Salesperson"] || "KAVIYA",
  //               remarks: `Payable in USD (Rate ${cleanAmount(row["Exchange Rate"]) || 87.52})`,
  //               payment_methods: ["bankTransfer"],
  //               items: [
  //                 {
  //                   code: row["Customer PO #"] || "INV001",
  //                   type: "hotel",
  //                   description: row["Journal Memo"] || "Service charge",
  //                   quantity: 1,
  //                   price: cleanAmount(row["Amount"]),
  //                   discount: 0,
  //                 }
  //               ],
  //               additional_charges: row["Amount Due"] ? [
  //                 {
  //                   description: "Outstanding balance",
  //                   amount: cleanAmount(row["Amount Due"]),
  //                   taxable: false
  //                 }
  //               ] : [],
  //               company_id: companyNo || 1,
  //               account_id: 1,
  //               booking_no: row["Customer PO #"] || "",
  //               sales_id: row["Salesperson"] || "",
  //               start_date: startDate,
  //               end_date: endDate,
  //               travel_period: calculateTravelPeriod(startDate, endDate)
  //             };
  //           });

  //           setProcessedData(processed);
  //           setSuccess("File uploaded and processed successfully!");
  //         }
  //       } else {
  //         setError("No data rows found in the file.");
  //         setExcelData([]);
  //         setProcessedData([]);
  //       }
  //     } catch (err) {
  //       setError(
  //         err.message || "Error processing the file. Please make sure it is a valid Excel file."
  //       );
  //       setExcelData([]);
  //       setProcessedData([]);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   reader.readAsArrayBuffer(file);
  // };

  const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setIsLoading(true);
  setError(null);
  setSuccess(null);
  setSubmissionResults([]);
  setFailedRecords([]);

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array", dateNF: "dd/mm/yyyy" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false, dateNF: "dd/mm/yyyy" });

      // Find header row dynamically
      let headerRowIndex = -1;
      for (let i = 0; i < jsonData.length; i++) {
        if (jsonData[i].some(cell => cell === "Date") && jsonData[i].some(cell => cell === "Invoice #")) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error("Header row not found in the Excel file.");
      }

      const headers = jsonData[headerRowIndex].map((h, idx) => (h ? h.trim() : `Column${idx}`));
      const dataRows = jsonData.slice(headerRowIndex + 1).filter(row => row.some(cell => cell));

      // Map rows to objects using headers
      const mappedData = dataRows.map(row => {
        const rowObj = {};
        headers.forEach((header, idx) => {
          rowObj[header] = row[idx] !== undefined ? String(row[idx]).trim() : "";
        });
        return rowObj;
      });

      // Validate that all expected columns are present
      if (mappedData.length > 0) {
        const firstRow = mappedData[0];
        const missingColumns = expectedColumns.filter(
          (col) => !Object.keys(firstRow).includes(col)
        );

        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(", ")}`);
          setExcelData([]);
          setProcessedData([]);
        } else {
          setExcelData(mappedData);

          // Process data to match backend structure
          const processed = mappedData.map((row, index) => {
            const collectionDate = formatDateForBackend(row["Promised Date"]);
            const invoiceDate = formatDateForBackend(row["Date"]);
            
            // Parse Journal Memo for start/end dates
            let startDate = null;
            let endDate = null;
            if (row["Journal Memo"]) {
              const memoParts = row["Journal Memo"].split('-');
              if (memoParts.length === 2) {
                startDate = formatDateForBackend(memoParts[0].trim());
                endDate = formatDateForBackend(memoParts[1].trim());
              }
            }
            startDate = startDate || invoiceDate || new Date().toISOString().split('T')[0];
            endDate = endDate || collectionDate || new Date().toISOString().split('T')[0];

            // Detect currency and set company_id accordingly
            const amountValue = row["Amount"] || "";
            let currency = "USD";
            let company_id = 2; // Default to appleholidays
            
            if (amountValue.includes('INR') || amountValue.includes('₹')) {
              currency = "INR";
              company_id = 1; // shirmila
            } else if (amountValue.includes('Rs') || amountValue.includes('LKR')) {
              currency = "LKR";
              company_id = 3; // aahaas
            } else if (amountValue.includes('SGD') || amountValue.includes('S$')) {
              currency = "SGD";
              company_id = 2; // appleholidays
            } else if (amountValue.includes('MYR') || amountValue.includes('RM')) {
              currency = "MYR";
              company_id = 2; // appleholidays
            }
            
            // Clean amount by removing currency symbols and commas
            const cleanAmountValue = cleanAmount(amountValue);

            return {
              issue_date: row["Date"] || "",
              invoice_number: row["Invoice #"] || "",
              customer_po_number: row["Customer PO #"] || "",
              customer_name: row["Customer Name"] || "",
              amount: cleanAmountValue,
              amount_due: cleanAmount(row["Amount Due"]),
              status: row["Status"] || "Open",
              ship_via: row["Ship Via"] || "",
              promised_date: collectionDate,
              original_amount: cleanAmount(row["Original Amount"]),
              freight_amt: cleanAmount(row["Freight Amt"]),
              tax_amt: cleanAmount(row["Tax Amt"]),
              journal_memo: row["Journal Memo"] || "",
              custom_list_1: row["Custom List #1"] || "",
              salesperson: row["Salesperson"] || "",
              referral: row["Referral"] || "",
              customer_id: 1, // Implement lookup if needed
              country_code: "IN",
              currency: currency,
              currency_code: currency,
              exchange_rate: cleanAmount(row["Exchange Rate"]) || (currency === "USD" ? 87.52 : 1),
              tax_treatment: "exclusive",
              payment_type: "non-credit",
              collection_date: collectionDate || new Date().toISOString().split('T')[0],
              payment_instructions: "Please settle the invoice on or before the due date",
              staff: row["Salesperson"] || "KAVIYA",
              remarks: `Payable in ${currency} (Rate ${cleanAmount(row["Exchange Rate"]) || (currency === "USD" ? 87.52 : 1)})`,
              payment_methods: ["bankTransfer"],
              items: [
                {
                  code: row["Customer PO #"] || "INV001",
                  type: "hotel",
                  description: row["Journal Memo"] || "Service charge",
                  quantity: 1,
                  price: cleanAmountValue,
                  discount: 0,
                }
              ],
              additional_charges: row["Amount Due"] ? [
                {
                  description: "Outstanding balance",
                  amount: cleanAmount(row["Amount Due"]),
                  taxable: false
                }
              ] : [],
              company_id: company_id,
              account_id: 1,
              booking_no: row["Customer PO #"] || "",
              sales_id: row["Salesperson"] || "",
              start_date: startDate,
              end_date: endDate,
              travel_period: calculateTravelPeriod(startDate, endDate)
            };
          });

          setProcessedData(processed);
          setSuccess("File uploaded and processed successfully!");
        }
      } else {
        setError("No data rows found in the file.");
        setExcelData([]);
        setProcessedData([]);
      }
    } catch (err) {
      setError(
        err.message || "Error processing the file. Please make sure it is a valid Excel file."
      );
      setExcelData([]);
      setProcessedData([]);
    } finally {
      setIsLoading(false);
    }
  };
  reader.readAsArrayBuffer(file);
};

// Update the cleanAmount function to handle currency symbols better
const cleanAmount = (amountStr) => {
  if (!amountStr) return 0;
  
  // Remove all currency symbols and commas
  const cleaned = amountStr.replace(/[$,₹RsINRLKRSGDMYR\s]/g, '');
  
  return parseFloat(cleaned) || 0;
};

  const calculateTravelPeriod = (startDate, endDate) => {
    if (!startDate || !endDate) return "1 day";
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} days`;
    } catch (e) {
      return "1 day";
    }
  };

 const handleSubmit = async () => {
    if (processedData.length === 0) {
      setError("No data to submit. Please upload a valid file first.");
      return;
    }

    setIsLoading(true);
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setSubmissionResults([]);
    setFailedRecords([]);
    setUploadProgress(0);

    try {
      // Process data in chunks of 10
      const chunkSize = 10;
      const chunks = [];
      
      for (let i = 0; i < processedData.length; i += chunkSize) {
        chunks.push(processedData.slice(i, i + chunkSize));
      }

      setTotalChunks(chunks.length);
      setCurrentChunk(0);

      const allResults = {
        successful: [],
        failed: []
      };

      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunk(i + 1);
        setUploadProgress(Math.round(((i + 1) / chunks.length) * 100));

        try {
          const response = await axios.post(
            "/api/invoices_new/bulk",
            chunks[i],
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          const results = response.data;
          allResults.successful = [...allResults.successful, ...(results.successful || [])];
          allResults.failed = [...allResults.failed, ...(results.failed || [])];

          // Small delay between chunks
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (err) {
          // If a chunk fails, add all records in that chunk to failed
          chunks[i].forEach((record, index) => {
            allResults.failed.push({
              index: (i * chunkSize) + index,
              invoice_number: record.invoice_number || 'Unknown',
              error: err.response?.data?.message || err.message || "Chunk processing failed",
              data: record
            });
          });
        }
      }

      setSubmissionResults(allResults.successful);
      setFailedRecords(allResults.failed);

      if (allResults.failed.length > 0) {
        setError(`${allResults.failed.length} records failed to process. Click to view details.`);
      }

      if (allResults.successful.length > 0) {
        setSuccess(`${allResults.successful.length} invoices processed successfully!`);
      }

      // Clear data if everything was successful
      if (allResults.failed.length === 0) {
        setExcelData([]);
        setProcessedData([]);
      }

    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.message || 
        "Failed to submit invoice data. Please try again."
      );
    } finally {
      setIsLoading(false);
      setIsUploading(false);
      setUploadProgress(100);
    }
  };


  const retryFailedRecords = async () => {
    if (failedRecords.length === 0) return;

    setIsLoading(true);
    const retryData = failedRecords.map(record => record.data);
    
    try {
      const response = await axios.post(
        "/api/invoices_new/bulk",
        retryData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const results = response.data;
      
      // Update results
      setSubmissionResults(prev => [...prev, ...(results.successful || [])]);
      setFailedRecords(results.failed || []);

      if (results.failed_count === 0) {
        setShowFailedModal(false);
        setSuccess("All records processed successfully!");
      } else {
        setError(`${results.failed_count} records still failed after retry.`);
      }

    } catch (err) {
      setError("Failed to retry processing: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const manuallyUpdateFailedRecords = () => {
    // This would open a modal or redirect to a manual update interface
    alert("Manual update functionality would be implemented here");
  };

  const downloadFailedRecords = () => {
    // Create a CSV of failed records for manual review
    const csvContent = failedRecords.map(record => {
      return {
        'Row Index': record.index + 1,
        'Invoice Number': record.invoice_number,
        'Error': record.errors ? JSON.stringify(record.errors) : record.error,
        'Data': JSON.stringify(record.data)
      };
    });
    
    const worksheet = XLSX.utils.json_to_sheet(csvContent);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Failed Records");
    XLSX.writeFile(workbook, "failed_invoice_records.xlsx");
  };

  return (
    <div className="container py-4">
      <Card className="mb-4">
        <Card.Header as="h4">Upload Invoice Excel File</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Select Excel File</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
              <Form.Text className="text-muted">
                Please upload an Excel file with the following columns:{" "}
                {expectedColumns.join(", ")}
              </Form.Text>
            </Form.Group>
          </Form>

              {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Uploading invoices...</span>
                <span>{currentChunk}/{totalChunks} chunks ({uploadProgress}%)</span>
              </div>
              <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
              <div className="text-muted small mt-1">
                Processing {currentChunk * 10} of {processedData.length} invoices
              </div>
            </div>
          )}

          {error && (
            <Alert variant="danger" className="pre-wrap">
              {error}
              {failedRecords.length > 0 && (
                <>
                  <br />
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => setShowFailedModal(true)}
                    className="mt-2 me-2"
                  >
                    View Failed Records ({failedRecords.length})
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={downloadFailedRecords}
                    className="mt-2"
                  >
                    Download Failed Records
                  </Button>
                </>
              )}
            </Alert>
          )}

          {success && <Alert variant="success">{success}</Alert>}

          
          {excelData.length > 0 && !isUploading && (
            <>
              <div className="mb-3">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isLoading || isUploading}
                  className="me-2"
                >
                  {isLoading ? "Processing..." : `Submit ${processedData.length} Invoices`}
                </Button>
                {failedRecords.length > 0 && (
                  <Button
                    variant="outline-warning"
                    onClick={() => setShowFailedModal(true)}
                  >
                    Review Failed Records ({failedRecords.length})
                  </Button>
                )}
              </div>

              <div className="table-responsive mb-4">
                <h5>Original Data Preview (First 5 rows)</h5>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      {expectedColumns.map((col, index) => (
                        <th key={index}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.slice(0, 5).map((row, rowIndex) => (
                      <tr key={`original-${rowIndex}`}>
                        {expectedColumns.map((col, colIndex) => (
                          <td key={`original-${rowIndex}-${colIndex}`}>
                            {row[col] !== undefined ? row[col] : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="table-responsive">
                <h5>Processed Data Preview (First 5 rows)</h5>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Collection Date</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Company ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.slice(0, 5).map((invoice, index) => (
                      <tr key={`processed-${index}`}>
                        <td>{invoice.invoice_number || 'N/A'}</td>
                        <td>{invoice.customer_name}</td>
                        <td>{invoice.amount}</td>
                        <td>{invoice.collection_date || 'N/A'}</td>
                        <td>{invoice.start_date || 'N/A'}</td>
                        <td>{invoice.end_date || 'N/A'}</td>
                        <td>{invoice.company_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}

          {/* Failed Records Modal */}
          <Modal show={showFailedModal} onHide={() => setShowFailedModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Failed Records</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted mb-3">
                {failedRecords.length} records failed to process. You can retry or update them manually.
              </p>
              
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Invoice #</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedRecords.map((record, index) => (
                      <tr key={index}>
                        <td>{record.index + 1}</td>
                        <td>{record.invoice_number}</td>
                        <td>
                          {record.errors ? (
                            Object.entries(record.errors).map(([field, messages]) => (
                              <div key={field}>
                                <strong>{field}:</strong> {messages.join(', ')}
                              </div>
                            ))
                          ) : (
                            record.error
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowFailedModal(false)}>
                Close
              </Button>
              <Button variant="warning" onClick={manuallyUpdateFailedRecords}>
                Update Manually
              </Button>
              <Button variant="primary" onClick={retryFailedRecords} disabled={isLoading}>
                {isLoading ? 'Retrying...' : 'Retry Failed Records'}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Submission Results */}
          {submissionResults.length > 0 && (
            <Accordion className="mt-4">
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  Submission Results ({submissionResults.length} successful)
                  {failedRecords.length > 0 && (
                    <Badge bg="danger" className="ms-2">
                      {failedRecords.length} failed
                    </Badge>
                  )}
                </Accordion.Header>
                <Accordion.Body>
                  {submissionResults.map((result, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Header className="d-flex justify-content-between align-items-center">
                        <span>
                          Invoice #{result.invoice.invoice_number} - 
                          <Badge bg={
                            result.action === 'created' ? 'success' : 
                            result.action === 'updated' ? 'warning' : 'info'
                          } className="ms-2">
                            {result.action}
                          </Badge>
                        </span>
                        <small className="text-muted">Row {result.index + 1}</small>
                      </Card.Header>
                      <Card.Body>
                        {result.action === 'updated' && result.changes && (
                          <div className="small">
                            <strong>Changes:</strong>
                            <ul className="mb-0">
                              {Object.entries(result.changes).map(([field, {old, new: newVal}]) => (
                                <li key={field}>
                                  <strong>{field}:</strong> "{old}" → "{newVal}"
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Upload_invoice;