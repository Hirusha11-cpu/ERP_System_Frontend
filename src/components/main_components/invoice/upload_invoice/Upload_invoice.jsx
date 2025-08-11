import React, { useContext, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Button, Table, Card, Form, Alert } from "react-bootstrap";
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
    if (!dateStr) return null; // No date provided
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null; // Invalid date
  return parsed.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }
  const formatDateForBackend1 = (dateString) => {
    if (!dateString) return null;
    
    // Try to parse the date (handles various Excel date formats)
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If parsing fails, try to extract date parts from string
      const parts = dateString.split(/[/-]/);
      if (parts.length === 3) {
        const newDate = new Date(parts[2], parts[1] - 1, parts[0]);
        if (!isNaN(newDate.getTime())) {
          return newDate.toISOString().split('T')[0];
        }
      }
      return null;
    }
    return date.toISOString().split('T')[0];
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

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
              const collectionDate = formatDateForBackend(9/8/2025);
            //   const collectionDate = row["Promised Date"];
              const startDate = formatDateForBackend(row["Date"]);
              const endDate = formatDateForBackend(9/8/2025);
              console.log("Processed Row:", row, "Collection Date:", collectionDate, "Start Date:", startDate, "End Date:", endDate);

              return {
                customer_id: 1, // You'll need to implement customer lookup
                country_code: "IN",
                currency: "USD",
                exchange_rate: 87.52,
                tax_treatment: "exclusive",
                payment_type: "non-credit",
                collection_date: collectionDate || new Date().toISOString().split('T')[0] || "2025-07-26",
                payment_instructions: "Please settle the invoice on or before the due date",
                staff: row["Salesperson"] || "KAVIYA",
                remarks: `Payable in USD (Rate 87.52)`,
                payment_methods: ["bankTransfer"],
                items: [
                  {
                    code: row["Customer PO #"] || "INV001",
                    type: "hotel",
                    description: row["Journal Memo"] || "Service charge",
                    quantity: 1,
                    price: parseFloat(row["Amount"]) || 0,
                    discount: 0,
                  }
                ],
                additional_charges: row["Amount Due"] ? [
                  {
                    description: "Outstanding balance",
                    amount: parseFloat(row["Amount Due"]) || 0,
                    taxable: false
                  }
                ] : [],
                company_id: selectedCompany?.id || 1, // Use selectedCompany from context
                account_id: 1,
                booking_no: row["Customer PO #"] || "",
                status: row["Status"] || "draft",
                sales_id: row["Salesperson"] || "",
                start_date: startDate || new Date().toISOString().split('T')[0],
                end_date: endDate || new Date().toISOString().split('T')[0] || "2025-07-26" ,
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

    try {
      // Submit each invoice individually
      const results = [];
      for (const invoice of processedData) {
        // Ensure required fields are properly formatted
        const payload = {
          ...invoice,
          collection_date: invoice.collection_date || null,
          start_date: invoice.start_date || null,
          end_date: invoice.end_date || null,
          company_id: companyNo // Ensure company_id is always set
        };

        const response = await axios.post(
          "/api/invoices",
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

      setSuccess(`${results.length} invoices submitted successfully!`);
      setExcelData([]);
      setProcessedData([]);
    } catch (err) {
      if (err.response?.data?.errors) {
        // Format validation errors for display
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
                        <td>{invoice.items[0]?.code || 'N/A'}</td>
                        <td>{invoice.customer_id}</td>
                        <td>{invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</td>
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
        </Card.Body>
      </Card>
    </div>
  );
};

export default Upload_invoice;