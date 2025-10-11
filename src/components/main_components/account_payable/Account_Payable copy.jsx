import React, { useState, useEffect, useContext } from "react";
import {
  Accordion,
  Nav,
  Tab,
  Row,
  Col,
  Container,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Spinner,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { CompanyContext } from "../../../contentApi/CompanyProvider";
import axios from "axios";

const Account_Payable = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const [companyNo, setCompanyNo] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [currentCost, setCurrentCost] = useState({
    country_code: "",
    no_of_pax_adult: 0,
    no_of_pax_child: 0,
    ticket_cost: 0,
    hotel_cost: 0,
    guide_cost: 0,
    transport_cost: 0,
    daycruise_cost: 0,
    water_cost: 0,
    restaurant_cost: 0,
    total_amount: 0,
    pending_amount: 0,
    remarks: "",
  });
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };
    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || null);
  }, [selectedCompany]);

  useEffect(() => {
    if (companyNo) {
      fetchInvoices();
      fetchCountries();
    }
  }, [companyNo]);

  const fetchInvoices = async () => {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/invoices?company_id=${companyNo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setInvoices(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    try {
      const response = await axios.get("/api/countries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCountries(response.data);
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  const handleEdit = (invoice, cost = null) => {
    setCurrentInvoice(invoice);
    if (cost) {
      setCurrentCost({
        ...cost,
        country_code: cost.country_code || invoice.country_code,
      });
    } else {
      setCurrentCost({
        country_code: invoice.country_code,
        no_of_pax_adult: 0,
        no_of_pax_child: 0,
        ticket_cost: 0,
        hotel_cost: 0,
        guide_cost: 0,
        transport_cost: 0,
        daycruise_cost: 0,
        water_cost: 0,
        restaurant_cost: 0,
        total_amount: invoice.total_amount,
        pending_amount: invoice.balance,
        remarks: "",
      });
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentCost((prev) => ({
      ...prev,
      [name]:
        name.includes("_cost") || name.includes("amount")
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const calculateTotal = () => {
    const sum = [
      currentCost.ticket_cost,
      currentCost.hotel_cost,
      currentCost.guide_cost,
      currentCost.transport_cost,
      currentCost.daycruise_cost,
      currentCost.water_cost,
      currentCost.restaurant_cost,
    ].reduce((a, b) => a + b, 0);

    setCurrentCost((prev) => ({
      ...prev,
      total_amount: sum,
      pending_amount: sum - (currentInvoice?.amount_received || 0),
    }));
  };

  const handleSubmit = async () => {
    const token =
      localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    try {
      if (currentCost.id) {
        // Update existing cost
        await axios.put(`/api/costs/${currentCost.id}`, currentCost, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create new cost
        await axios.post(
          `/api/invoices/${currentInvoice.id}/costs`,
          currentCost,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
      fetchInvoices();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving cost:", error);
    }
  };

  const handleViewInvoice = (invoiceNumber) => {
    window.open(`/api/invoices/${invoiceNumber}/pdf`, "_blank");
  };

  return (
    <Container fluid>
      <h2>Account Payable</h2>
      <p className="text-muted">Manage invoice costs and payments</p>

      <Card>
        <Card.Header className="bg-light">
          {/* <h5>Invoice Cost Management</h5> */}
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p>Loading invoices...</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Customer</th>
                  <th>Invoice No</th>
                  <th>Pax (A)</th>
                  <th>Pax (C)</th>
                  <th>Ticket</th>
                  <th>Hotel</th>
                  <th>Guide</th>
                  <th>Transport</th>
                  <th>Day Cruise</th>
                  <th>Water</th>
                  <th>Restaurant</th>
                  <th>Total</th>
                  <th>Pending</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) =>
                  invoice.costs?.length > 0 ? (
                    invoice.costs.map((cost, index) => (
                      <tr key={`${invoice.id}-${index}`}>
                        <td>{cost.country_code}</td>
                        <td>{invoice.customer?.name}</td>
                        <td>{invoice.invoice_number}</td>
                        <td>{cost.no_of_pax_adult}</td>
                        <td>{cost.no_of_pax_child}</td>
                        <td>{cost.ticket_cost}</td>
                        <td>{cost.hotel_cost}</td>
                        <td>{cost.guide_cost}</td>
                        <td>{cost.transport_cost}</td>
                        <td>{cost.daycruise_cost}</td>
                        <td>{cost.water_cost}</td>
                        <td>{cost.restaurant_cost}</td>
                        <td>{cost.total_amount}</td>
                        <td>{cost.pending_amount}</td>
                        <td>
                          {/* <Button variant="info" size="sm" onClick={() => handleViewInvoice(invoice.invoice_number)}>
                          View
                        </Button> */}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleEdit(invoice, cost)}
                            className="ms-1"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key={invoice.id}>
                      <td>{invoice.country_code}</td>
                      <td>{invoice.customer?.name}</td>
                      <td>{invoice.invoice_number}</td>
                      <td colSpan="11" className="text-center">
                        No cost details available
                      </td>
                      <td>
                        {/* <Button variant="info" size="sm" onClick={() => handleViewInvoice(invoice.invoice_number)}>
                        View
                      </Button> */}
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleEdit(invoice)}
                          className="ms-1"
                        >
                          Add
                        </Button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Cost Edit/Add Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentCost.id ? "Edit Cost Details" : "Add Cost Details"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Select
                    name="country_code"
                    value={currentCost.country_code}
                    onChange={handleChange}
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Pax (Adult)</Form.Label>
                  <Form.Control
                    type="number"
                    name="no_of_pax_adult"
                    value={currentCost.no_of_pax_adult}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Pax (Child)</Form.Label>
                  <Form.Control
                    type="number"
                    name="no_of_pax_child"
                    value={currentCost.no_of_pax_child}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Ticket Cost</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="ticket_cost"
                    value={currentCost.ticket_cost}
                    onChange={handleChange}
                    onBlur={calculateTotal}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Hotel Cost</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="hotel_cost"
                    value={currentCost.hotel_cost}
                    onChange={handleChange}
                    onBlur={calculateTotal}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Guide Cost</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="guide_cost"
                    value={currentCost.guide_cost}
                    onChange={handleChange}
                    onBlur={calculateTotal}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Transport Cost</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="transport_cost"
                    value={currentCost.transport_cost}
                    onChange={handleChange}
                    onBlur={calculateTotal}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Day Cruise Cost</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="daycruise_cost"
                    value={currentCost.daycruise_cost}
                    onChange={handleChange}
                    onBlur={calculateTotal}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Water Cost</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="water_cost"
                    value={currentCost.water_cost}
                    onChange={handleChange}
                    onBlur={calculateTotal}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Restaurant Cost</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="restaurant_cost"
                    value={currentCost.restaurant_cost}
                    onChange={handleChange}
                    onBlur={calculateTotal}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Remarks</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="remarks"
                    value={currentCost.remarks}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mt-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Total Amount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="total_amount"
                    value={currentCost.total_amount}
                    readOnly
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pending Amount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="pending_amount"
                    value={currentCost.pending_amount}
                    readOnly
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Account_Payable;
