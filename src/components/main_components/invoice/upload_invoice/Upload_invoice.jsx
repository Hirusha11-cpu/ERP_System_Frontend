import React, { useContext, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Button, Table, Card, Form, Alert, Accordion } from "react-bootstrap";
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

  const cleanAmount = (amountStr) => {
    if (!amountStr) return 0;
    return parseFloat(amountStr.replace(/[^0-9.-]+/g, '')) || 0;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setSubmissionResults([]);

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
            const processed = mappedData.map(row => {
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

              return {
                invoice_number: row["Invoice #"] || "",
                customer_po_number: row["Customer PO #"] || "",
                customer_name: row["Customer Name"] || "",
                amount: cleanAmount(row["Amount"]),
                amount_due: cleanAmount(row["Amount Due"]),
                status: row["Status"] || "Open",
                ship_via: row["Ship Via"] || "",
                promised_date: collectionDate,
                journal_memo: row["Journal Memo"] || "",
                salesperson: row["Salesperson"] || "",
                referral: row["Referral"] || "",
                customer_id: 1, // Implement lookup if needed
                country_code: "IN",
                currency: "USD",
                exchange_rate: cleanAmount(row["Exchange Rate"]) || 87.52,
                tax_treatment: "exclusive",
                payment_type: "non-credit",
                collection_date: collectionDate || new Date().toISOString().split('T')[0],
                payment_instructions: "Please settle the invoice on or before the due date",
                staff: row["Salesperson"] || "KAVIYA",
                remarks: `Payable in USD (Rate ${cleanAmount(row["Exchange Rate"]) || 87.52})`,
                payment_methods: ["bankTransfer"],
                items: [
                  {
                    code: row["Customer PO #"] || "INV001",
                    type: "hotel",
                    description: row["Journal Memo"] || "Service charge",
                    quantity: 1,
                    price: cleanAmount(row["Amount"]),
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
                company_id: companyNo || 1,
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
    setError(null);
    setSuccess(null);
    setSubmissionResults([]);

    try {
      const results = [];
      for (const invoice of processedData) {
        const payload = {
          ...invoice,
          collection_date: invoice.collection_date || null,
          start_date: invoice.start_date || null,
          end_date: invoice.end_date || null,
          promised_date: invoice.promised_date || null,
        };

        const response = await axios.post(
          "/api/invoices_new",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        results.push(response.data);
      }

      setSubmissionResults(results);
      setSuccess(`${results.length} invoices processed successfully!`);
      setExcelData([]);
      setProcessedData([]);
    } catch (err) {
      if (err.response?.data?.errors) {
        const errorMessages = Object.entries(err.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        setError(`Validation errors:\n${errorMessages}`);
      } else {
        setError(
          err.response?.data?.message || 
          err.message || 
          "Failed to submit invoice data. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
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

          {error && (
            <Alert variant="danger" className="pre-wrap">
              {error}
            </Alert>
          )}
          {success && <Alert variant="success">{success}</Alert>}

          {excelData.length > 0 && (
            <>
              <div className="mb-3">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Invoice Data"}
                </Button>
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

          {submissionResults.length > 0 && (
            <Accordion className="mt-4">
              <Accordion.Item eventKey="0">
                <Accordion.Header>Submission Results & Updates</Accordion.Header>
                <Accordion.Body>
                  {submissionResults.map((result, index) => (
                    <Card key={index} className="mb-3">
                      <Card.Header>
                        Invoice #{result.invoice.invoice_number} - {result.action.charAt(0).toUpperCase() + result.action.slice(1)}
                      </Card.Header>
                      <Card.Body>
                        {result.action === 'updated' && result.changes && Object.keys(result.changes).length > 0 ? (
                          <ul>
                            {Object.entries(result.changes).map(([field, {old, new: newVal}]) => (
                              <li key={field}>
                                {field}: Changed from "{old}" to "{newVal}"
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No changes (or new invoice created).</p>
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