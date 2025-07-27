import React, { useState, useEffect, useContext } from "react";
import {
  Modal,
  Button,
  Form,
  Table,
  Card,
  Nav,
  Tab,
  Row,
  Col,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaSearch,
  FaPlus,
  FaTrash,
  FaEye,
  FaPrint,
  FaDownload,
  FaSyncAlt,
  FaCog,
} from "react-icons/fa";
import { CompanyContext } from "../../../../../contentApi/CompanyProvider";
import axios from "axios";

const Invoice_aahaas = () => {
  const { selectedCompany } = useContext(CompanyContext);

  const [customers, setCustomers] = useState([]);
  const [taxRates, setTaxRates] = useState([]);

  // Fetch customers and tax rates on component mount
  useEffect(() => {
    fetchCustomers();
    fetchTaxRates();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get("/api/customers");
      console.log(response);

      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchTaxRates = async () => {
    try {
      const response = await axios.get("/api/tax-rates");
      setTaxRates(response.data);
    } catch (error) {
      console.error("Error fetching tax rates:", error);
    }
  };

  const handleSubmit = async () => {
    console.log(selectedCompany);
    const prefix =
      countryOptions.find((c) => c.code === formData.invoice.country)?.prefix ||
      "IN";

    const dataToSend = {
      ...formData,
      invoice: {
        ...formData.invoice,
        number: prefix + formData.invoice.number,
      },
      company_id: selectedCompany.id,
      items: formData.serviceItems.map((item) => ({
        code: item.code,
        type: item.type,
        description: item.description,
        checkin_time: item.checkin,
        checkout_time: item.checkout,
        quantity: item.qty,
        price: item.price,
        discount: item.discount,
      })),
      additional_charges: formData.additionalCharges.map((charge) => ({
        description: charge.description,
        amount: charge.amount,
        taxable: charge.taxable,
      })),
    };

    try {
      const response = await axios.post("/api/invoices", dataToSend);
      console.log();

      // Handle success
      alert("Invoice created successfully!");
      resetForm();
    } catch (error) {
      // Handle error
      console.error("Error creating invoice:", error);
      alert(
        "Error creating invoice: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // State for form data
  const [formData, setFormData] = useState({
    customer: {
      id: null,
      name: "",
      address: "",
      mobile: "",
      code: "",
      gstNo: "",
    },
    invoice: {
      country: "IN",
      number: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      salesId: "ARAVEND",
      printedBy: "KAVIYA",
      yourRef: "399648 CNTL",
    },
    currencyDetails: {
      currency: "USD",
      exchangeRate: 87.52,
      rateSource: "custom",
      customRate: 87.52,
      addOneToRate: true,
      addTenToRate: false,
      taxTreatment: "exclusive",
    },
    serviceItems: [],
    additionalCharges: [],
    taxRates: taxRates,
    accountDetails: {
      name: "AAHAAS",
      number: "054205002744",
      bank: "DFCC Bank Ltd",
      branch: "COLOMBO",
      ifsc: "ICIC0000542",
      address: "NO 2208, ONE GALLE FACE TOWER",
    },
    payment: {
      type: "non-credit",
      collectionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      instructions: "Please settle the invoice on or before",
      methods: {
        bankTransfer: true,
        amex: false,
        googlePay: false,
        usdPortal: false,
      },
      staff: "KAVIYA",
      remarks: "Payable in INR(Rate 87.52)",
    },
    totals: {
      subTotal: 0,
      handlingFee: 0,
      gst: 0,
      additionalTax: 0,
      bankCharges: 0,
      total: 0,
      amountReceived: 0,
      balance: 0,
    },
  });

  // Modal states
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newItem, setNewItem] = useState({
    code: "",
    type: "hotel",
    description: "",
    checkin: "",
    checkout: "",
    qty: 1,
    price: 0,
    discount: 0,
    total: 0,
  });
  const [newCharge, setNewCharge] = useState({
    description: "",
    amount: 0,
    taxable: false,
  });
  const [newTaxRate, setNewTaxRate] = useState({
    name: "",
    component: "",
    rate: 0,
  });
  const [newCustomer, setNewCustomer] = useState({
    code: "",
    name: "",
    address: "",
    mobile: "",
    gstNo: "",
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState("sell");

  // Country options
  const countryOptions = [
    { code: "IN", name: "India", prefix: "IN" },
    { code: "LK", name: "Sri Lanka", prefix: "IS" },
    { code: "SG", name: "Singapore", prefix: "SG" },
    { code: "VN", name: "Vietnam", prefix: "VN" },
    { code: "MY", name: "Malaysia", prefix: "MY" },
    { code: "MV", name: "Maldives", prefix: "MV" },
    { code: "ID", name: "Bali", prefix: "ID" },
    { code: "KH", name: "Cambodia", prefix: "CM" },
    { code: "OB", name: "Other Countries", prefix: "OB" },
  ];

  // Currency options
  const currencyOptions = ["INR", "USD", "SGD", "MYR", "LKR"];

  // Item types
  const itemTypes = ["hotel", "restaurant", "transport", "handling", "other"];

  // Calculate totals whenever relevant data changes
  useEffect(() => {
    calculateTotals();
  }, [
    formData.serviceItems,
    formData.additionalCharges,
    formData.currencyDetails,
    formData.taxRates,
  ]);

  // Update tax rates when they change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      taxRates: taxRates,
    }));
  }, [taxRates]);

  // Filter customers based on search
  useEffect(() => {
    if (customerSearch) {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          customer.code.toLowerCase().includes(customerSearch.toLowerCase()) ||
          customer.mobile.includes(customerSearch)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers([]);
    }
  }, [customerSearch, customers]);

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setFormData({
      ...formData,
      customer: {
        id: customer.id,
        name: customer.name,
        address: customer.address,
        mobile: customer.mobile,
        code: customer.code,
        gstNo: customer.gstNo || "",
      },
    });
    setCustomerSearch("");
    setFilteredCustomers([]);
  };

  // Create new customer
  const createNewCustomer = async () => {
    try {
      const response = await axios.post("/api/customers", newCustomer);
      setCustomers([...customers, response.data]);
      handleCustomerSelect(response.data);
      setShowCustomerModal(false);
      setNewCustomer({
        code: "",
        name: "",
        address: "",
        mobile: "",
        gstNo: "",
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      alert(
        "Error creating customer: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Handle input changes
  const handleInputChange = (section, field, value) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value,
      },
    });
  };

  // Handle nested input changes
  const handleNestedInputChange = (section, subSection, field, value) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [subSection]: {
          ...formData[section][subSection],
          [field]: value,
        },
      },
    });
  };

  // Handle payment method change
  const handlePaymentMethodChange = (method, checked) => {
    setFormData({
      ...formData,
      payment: {
        ...formData.payment,
        methods: {
          ...formData.payment.methods,
          [method]: checked,
        },
      },
    });
  };

  // Handle currency change
  const handleCurrencyChange = (currency) => {
    let rate = 87.52;
    switch (currency) {
      case "SGD":
        rate = 65.32;
        break;
      case "MYR":
        rate = 21.05;
        break;
      case "LKR":
        rate = 0.29;
        break;
      case "INR":
        rate = 1.0;
        break;
      default:
        rate = 87.52;
    }

    setFormData({
      ...formData,
      currencyDetails: {
        ...formData.currencyDetails,
        currency,
        exchangeRate: rate,
        customRate: rate,
      },
    });
  };

  // Calculate totals
  const calculateTotals = () => {
    const { currency, exchangeRate, taxTreatment } = formData.currencyDetails;
    const { serviceItems, additionalCharges, taxRates } = formData;

    // Calculate subtotal from service items
    let subTotal = 0;
    let totalPax = 0;

    serviceItems.forEach((item) => {
      if (item.type === "hotel" || item.type === "restaurant") {
        totalPax += item.qty;
      }
      subTotal += item.total;
    });

    // Add additional charges
    let taxableCharges = 0;
    additionalCharges.forEach((charge) => {
      subTotal += charge.amount;
      if (charge.taxable) {
        taxableCharges += charge.amount;
      }
    });

    // Calculate handling fee (only for INR)
    let handlingFee = 0;
    if (currency === "INR" && totalPax > 0) {
      const perPersonRate = subTotal / totalPax - 5;
      handlingFee = 5 * exchangeRate * totalPax;
    }

    // Calculate GST (only for INR)
    let gst = 0;
    if (currency === "INR" && taxTreatment === "exclusive") {
      const gstRate = taxRates.find((tax) => tax.name === "GST")?.rate || 0;
      gst = (subTotal + handlingFee + taxableCharges) * (gstRate / 100);
    }

    // Calculate total
    const total =
      subTotal +
      handlingFee +
      gst +
      formData.totals.additionalTax +
      formData.totals.bankCharges;
    const balance = total - formData.totals.amountReceived;

    setFormData({
      ...formData,
      totals: {
        ...formData.totals,
        subTotal,
        handlingFee,
        gst,
        total,
        balance,
      },
    });
  };

  // Add new item to service table
  const addNewItem = () => {
    const { currency, exchangeRate } = formData.currencyDetails;
    const total = newItem.price * (1 - newItem.discount / 100) * newItem.qty;

    setFormData({
      ...formData,
      serviceItems: [
        ...formData.serviceItems,
        {
          ...newItem,
          id: Date.now(),
          total: currency === "INR" ? total : total * exchangeRate,
        },
      ],
    });

    setNewItem({
      code: "",
      type: "hotel",
      description: "",
      checkin: "",
      checkout: "",
      qty: 1,
      price: 0,
      discount: 0,
      total: 0,
    });

    setShowItemModal(false);
  };

  // Add new charge
  const addNewCharge = () => {
    setFormData({
      ...formData,
      additionalCharges: [
        ...formData.additionalCharges,
        {
          ...newCharge,
          id: Date.now(),
        },
      ],
    });

    setNewCharge({
      description: "",
      amount: 0,
      taxable: false,
    });

    setShowChargeModal(false);
  };

  // Add new tax rate
  const addNewTaxRate = async () => {
    try {
      const response = await axios.post("/api/tax-rates", newTaxRate);
      setTaxRates([...taxRates, response.data]);
      setNewTaxRate({
        name: "",
        component: "",
        rate: 0,
      });
      setShowTaxModal(false);
    } catch (error) {
      console.error("Error adding tax rate:", error);
      alert(
        "Error adding tax rate: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Delete item from table
  const deleteItem = (id, type) => {
    if (type === "service") {
      setFormData({
        ...formData,
        serviceItems: formData.serviceItems.filter((item) => item.id !== id),
      });
    } else if (type === "charge") {
      setFormData({
        ...formData,
        additionalCharges: formData.additionalCharges.filter(
          (charge) => charge.id !== id
        ),
      });
    } else if (type === "tax") {
      // For tax rates, we'll need to make an API call to delete
      const taxToDelete = taxRates.find((tax) => tax.name === id);
      if (taxToDelete) {
        axios
          .delete(`/api/tax-rates/${taxToDelete.id}`)
          .then(() => {
            setTaxRates(taxRates.filter((tax) => tax.name !== id));
          })
          .catch((error) => {
            console.error("Error deleting tax rate:", error);
            alert(
              "Error deleting tax rate: " +
                (error.response?.data?.message || error.message)
            );
          });
      }
    }
  };

  // Apply exchange rate settings
  const applyExchangeRate = () => {
    let rate = formData.currencyDetails.customRate;

    if (formData.currencyDetails.rateSource === "xe") {
      // In a real app, you would fetch this from an API
      rate = 87.52;
      if (formData.currencyDetails.addOneToRate) rate += 1;
      if (formData.currencyDetails.addTenToRate) rate += 10;
    }

    setFormData({
      ...formData,
      currencyDetails: {
        ...formData.currencyDetails,
        exchangeRate: rate,
      },
    });

    setShowExchangeModal(false);
  };

  // Format date as DD/MM/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Generate invoice preview
  const generatePreview = () => {
    setShowPreviewModal(true);
  };

  // Print invoice
  const printInvoice = () => {
    const printContent = document.getElementById(
      "invoice-preview-content"
    ).innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
  };

  // Reset form
  const resetForm = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the form? All data will be lost."
      )
    ) {
      setFormData({
        customer: {
          id: null,
          name: "",
          address: "",
          mobile: "",
          code: "",
          gstNo: "",
        },
        invoice: {
          country: "IN",
          number: "",
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          salesId: "ARAVEND",
          printedBy: "KAVIYA",
          yourRef: "399648 CNTL",
        },
        currencyDetails: {
          currency: "USD",
          exchangeRate: 87.52,
          rateSource: "custom",
          customRate: 87.52,
          addOneToRate: true,
          addTenToRate: false,
          taxTreatment: "exclusive",
        },
        serviceItems: [],
        additionalCharges: [],
        taxRates: taxRates,
        accountDetails: {
          name: "SHARMILA TOURS AND TRAVELS",
          number: "054205002744",
          bank: "ICICI Bank Ltd",
          branch: "TEPPAKULAM, MADURAI BRANCH",
          ifsc: "ICIC0000542",
          address: "NO 172, DARSHINI TOWER, VASAI COLONY, ANNA NAGAR - 625020",
        },
        payment: {
          type: "non-credit",
          collectionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          instructions: "Please settle the invoice on or before",
          methods: {
            bankTransfer: true,
            amex: false,
            googlePay: false,
            usdPortal: false,
          },
          staff: "KAVIYA",
          remarks: "Payable in INR(Rate 87.52)",
        },
        totals: {
          subTotal: 0,
          handlingFee: 0,
          gst: 0,
          additionalTax: 0,
          bankCharges: 0,
          total: 0,
          amountReceived: 0,
          balance: 0,
        },
      });
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="header text-center bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white py-5 mb-4 rounded shadow-lg">
        <div
          className="fs-1 fw-bold tracking-wide"
          style={{ letterSpacing: "2px", color:'black' }}
        >
           Create Invoice –{" "}
          <span className="text-warning">Aahaas</span>
        </div>
        {/* <div className="fst-italic mt-2" style={{ fontSize: "1rem",color:'black' }}>
          Where your journey begins with seamless billing...
        </div> */}
      </div>

      {/* Important Notice */}
      {/* <div className="notice-box bg-warning bg-opacity-10 border-start border-warning border-4 p-3 mb-4">
        <strong>STRICTLY TO BE NOTED:</strong> Finance Bill 2017 proposes to insert Section 269ST in the Income-tax Act that restricts receiving an amount of Rs 2,00,000/- or more. Sharmila Travels will not accept any cash deposit. If the total value of such cash deposit, then the amount will be ignored and penalties will be charged as per law. Please use other payment modes such as Cheque deposit, RTGS & NEFT for all your future bookings with Sharmila Travels.
      </div> */}

      {/* Customer and Invoice Information */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="section-title fw-semibold mb-3 pb-2 border-bottom">
            Invoice Information
          </h5>

          <Row className="mb-3">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <h6 className="card-title">Customer Details</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>Search Customer:</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type="text"
                        placeholder="Search by name, code or phone"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                      <Button variant="primary">
                        <FaSearch className="me-2" /> Search
                      </Button>
                      <Button
                        variant="success"
                        onClick={() => setShowCustomerModal(true)}
                      >
                        <FaPlus className="me-2" /> New
                      </Button>
                    </div>
                    {filteredCustomers.length > 0 && (
                      <div
                        className="mt-2 border rounded p-2"
                        style={{ maxHeight: "200px", overflowY: "auto" }}
                      >
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="p-2 border-bottom hover-bg"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <strong>{customer.name}</strong> ({customer.code})
                            <br />
                            {customer.mobile} | {customer.address}
                          </div>
                        ))}
                      </div>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>To:</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Customer Name"
                      value={formData.customer.name}
                      onChange={(e) =>
                        handleInputChange("customer", "name", e.target.value)
                      }
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Address:</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Customer Address"
                      value={formData.customer.address}
                      onChange={(e) =>
                        handleInputChange("customer", "address", e.target.value)
                      }
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Mobile:</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Customer Mobile"
                      value={formData.customer.mobile}
                      onChange={(e) =>
                        handleInputChange("customer", "mobile", e.target.value)
                      }
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>GST No:</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Customer GST Number"
                      value={formData.customer.gstNo}
                      onChange={(e) =>
                        handleInputChange("customer", "gstNo", e.target.value)
                      }
                    />
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Body>
                  <h6 className="card-title">Invoice Details</h6>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Country:</Form.Label>
                        <Form.Select
                          value={formData.invoice.country}
                          onChange={(e) =>
                            handleInputChange(
                              "invoice",
                              "country",
                              e.target.value
                            )
                          }
                        >
                          {countryOptions.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.name} ({country.prefix})
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Invoice No.:</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">
                            {countryOptions.find(
                              (c) => c.code === formData.invoice.country
                            )?.prefix || "IN"}
                          </span>
                          <Form.Control
                            type="text"
                            value={formData.invoice.number}
                            onChange={(e) =>
                              handleInputChange(
                                "invoice",
                                "number",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Issue Date:</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.invoice.issueDate}
                          onChange={(e) =>
                            handleInputChange(
                              "invoice",
                              "issueDate",
                              e.target.value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Due Date:</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.invoice.dueDate}
                          onChange={(e) =>
                            handleInputChange(
                              "invoice",
                              "dueDate",
                              e.target.value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Your Ref.:</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.invoice.yourRef}
                          onChange={(e) =>
                            handleInputChange(
                              "invoice",
                              "yourRef",
                              e.target.value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Sales ID:</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.invoice.salesId}
                          onChange={(e) =>
                            handleInputChange(
                              "invoice",
                              "salesId",
                              e.target.value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Printed By:</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.invoice.printedBy}
                          onChange={(e) =>
                            handleInputChange(
                              "invoice",
                              "printedBy",
                              e.target.value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Currency Details */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="section-title fw-semibold mb-3 pb-2 border-bottom">
            Currency Details
          </h5>

          <Row>
            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Currency:</Form.Label>
                <Form.Select
                  value={formData.currencyDetails.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Exchange Rate (1 USD):</Form.Label>
                <div className="input-group">
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={formData.currencyDetails.exchangeRate}
                    onChange={(e) =>
                      handleNestedInputChange(
                        "currencyDetails",
                        "exchangeRate",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowExchangeModal(true)}
                  >
                    <FaCog />
                  </Button>
                </div>
              </Form.Group>
            </Col>

            <Col md={3} className="mb-3">
              <Form.Group>
                <Form.Label>Tax Treatment:</Form.Label>
                <Form.Select
                  value={formData.currencyDetails.taxTreatment}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "currencyDetails",
                      "taxTreatment",
                      e.target.value
                    )
                  }
                >
                  <option value="inclusive">Tax Inclusive</option>
                  <option value="exclusive">Tax Exclusive</option>
                  <option value="none">No Tax</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Service Details */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="section-title fw-semibold mb-0">Service Details</h5>
            <Button variant="primary" onClick={() => setShowItemModal(true)}>
              <FaPlus /> Add Item
            </Button>
          </div>

          <div className="table-responsive">
            <Table bordered>
              <thead className="table-dark">
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.serviceItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.code}</td>
                    <td>{item.type}</td>
                    <td>{item.description}</td>
                    <td>{item.checkin || "-"}</td>
                    <td>{item.checkout || "-"}</td>
                    <td>{item.qty}</td>
                    <td>{item.price.toFixed(2)}</td>
                    <td>{item.discount}%</td>
                    <td>{item.total.toFixed(2)}</td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteItem(item.id, "service")}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {formData.currencyDetails.currency === "INR" && (
            <div className="mt-3">
              <strong>Handling Fee:</strong>{" "}
              {formData.totals.handlingFee.toFixed(2)}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Additional Charges */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="section-title fw-semibold mb-0">
              Additional Charges
            </h5>
            <Button variant="primary" onClick={() => setShowChargeModal(true)}>
              <FaPlus /> Add Charge
            </Button>
          </div>

          <div className="table-responsive">
            <Table bordered>
              <thead className="table-dark">
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Taxable</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.additionalCharges.map((charge) => (
                  <tr key={charge.id}>
                    <td>{charge.description}</td>
                    <td>{charge.amount.toFixed(2)}</td>
                    <td>
                      <Form.Check
                        type="switch"
                        checked={charge.taxable}
                        readOnly
                      />
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteItem(charge.id, "charge")}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Tax Rates */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="section-title fw-semibold mb-0">Tax Rates</h5>
            <Button variant="primary" onClick={() => setShowTaxModal(true)}>
              <FaPlus /> Add Tax Rate
            </Button>
          </div>

          <div className="table-responsive">
            <Table bordered>
              <thead className="table-dark">
                <tr>
                  <th>Display Name</th>
                  <th>Tax Component</th>
                  <th>Rate (%)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* {formData.taxRates.map((tax, index) => (
                  <tr key={index}>
                    <td>{tax.name}</td>
                    <td>{tax.component}</td>
                    <td>{tax.rate.toFixed(2)}</td>
                    <td>
                      <Button variant="danger" size="sm" onClick={() => deleteItem(tax.name, 'tax')}>
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))} */}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Account Details */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="section-title fw-semibold mb-3 pb-2 border-bottom">
            Account Details
          </h5>

          <Row>
            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Account Name:</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.accountDetails.name}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "accountDetails",
                      "name",
                      e.target.value
                    )
                  }
                />
              </Form.Group>
            </Col>

            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Account No:</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.accountDetails.number}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "accountDetails",
                      "number",
                      e.target.value
                    )
                  }
                />
              </Form.Group>
            </Col>

            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Bank:</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.accountDetails.bank}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "accountDetails",
                      "bank",
                      e.target.value
                    )
                  }
                />
              </Form.Group>
            </Col>

            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Branch:</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.accountDetails.branch}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "accountDetails",
                      "branch",
                      e.target.value
                    )
                  }
                />
              </Form.Group>
            </Col>

            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>IFSC Code:</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.accountDetails.ifsc}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "accountDetails",
                      "ifsc",
                      e.target.value
                    )
                  }
                />
              </Form.Group>
            </Col>

            <Col md={4} className="mb-3">
              <Form.Group>
                <Form.Label>Bank Address:</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.accountDetails.address}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "accountDetails",
                      "address",
                      e.target.value
                    )
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tax Calculation & Totals */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="section-title fw-semibold mb-3 pb-2 border-bottom">
            Tax Calculation & Totals
          </h5>

          <Row>
            <Col md={8}>
              <Card className="mb-4">
                <Card.Body>
                  <h6 className="card-title">Payment Information</h6>

                  <Form.Group className="mb-3">
                    <div className="d-flex gap-3">
                      <Form.Check
                        type="radio"
                        label="Credit (One-time Payment)"
                        name="paymentType"
                        id="creditType"
                        checked={formData.payment.type === "credit"}
                        onChange={() =>
                          handleInputChange("payment", "type", "credit")
                        }
                      />
                      <Form.Check
                        type="radio"
                        label="Non-Credit (Collection Payment)"
                        name="paymentType"
                        id="nonCreditType"
                        checked={formData.payment.type === "non-credit"}
                        onChange={() =>
                          handleInputChange("payment", "type", "non-credit")
                        }
                      />
                    </div>
                  </Form.Group>

                  {formData.payment.type === "non-credit" && (
                    <div id="collectionDetails">
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Group>
                            <Form.Label>Collection Date:</Form.Label>
                            <Form.Control
                              type="date"
                              value={formData.payment.collectionDate}
                              onChange={(e) =>
                                handleNestedInputChange(
                                  "payment",
                                  "collectionDate",
                                  e.target.value
                                )
                              }
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-3">
                        <Form.Label>Payment Instructions:</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={formData.payment.instructions}
                          onChange={(e) =>
                            handleNestedInputChange(
                              "payment",
                              "instructions",
                              e.target.value
                            )
                          }
                        />
                      </Form.Group>
                    </div>
                  )}

                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Staff:</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.payment.staff}
                          onChange={(e) =>
                            handleNestedInputChange(
                              "payment",
                              "staff",
                              e.target.value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Remarks:</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.payment.remarks}
                          onChange={(e) =>
                            handleNestedInputChange(
                              "payment",
                              "remarks",
                              e.target.value
                            )
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Payment Methods:</Form.Label>
                    <Row>
                      <Col md={3}>
                        <Form.Check
                          type="checkbox"
                          label="Bank Transfer"
                          checked={formData.payment.methods.bankTransfer}
                          onChange={(e) =>
                            handlePaymentMethodChange(
                              "bankTransfer",
                              e.target.checked
                            )
                          }
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Check
                          type="checkbox"
                          label="AMEX"
                          checked={formData.payment.methods.amex}
                          onChange={(e) =>
                            handlePaymentMethodChange("amex", e.target.checked)
                          }
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Check
                          type="checkbox"
                          label="Google Pay"
                          checked={formData.payment.methods.googlePay}
                          onChange={(e) =>
                            handlePaymentMethodChange(
                              "googlePay",
                              e.target.checked
                            )
                          }
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Check
                          type="checkbox"
                          label="USD Portal Link"
                          checked={formData.payment.methods.usdPortal}
                          onChange={(e) =>
                            handlePaymentMethodChange(
                              "usdPortal",
                              e.target.checked
                            )
                          }
                        />
                      </Col>
                    </Row>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card>
                <Card.Body>
                  <h6 className="card-title">Invoice Totals</h6>

                  <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                    <span>Sub Total:</span>
                    <span>{formData.totals.subTotal.toFixed(2)}</span>
                  </div>

                  {formData.currencyDetails.currency === "INR" && (
                    <>
                      <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                        <span>Handling Fee:</span>
                        <span>{formData.totals.handlingFee.toFixed(2)}</span>
                      </div>

                      <div className="d-flex justify-content-between mb-2 pb-2 border-bottom bg-light">
                        <span>
                          GST @{" "}
                          {formData.taxRates.find((tax) => tax.name === "GST")
                            ?.rate || 0}
                          %:
                        </span>
                        <span>{formData.totals.gst.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="d-flex justify-content-between mb-2 pb-2 border-bottom bg-light">
                    <span>Additional Tax:</span>
                    <Form.Control
                      type="number"
                      size="sm"
                      className="w-50 text-end"
                      value={formData.totals.additionalTax}
                      onChange={(e) =>
                        handleInputChange(
                          "totals",
                          "additionalTax",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                    <span>Bank Charges:</span>
                    <Form.Control
                      type="number"
                      size="sm"
                      className="w-50 text-end"
                      value={formData.totals.bankCharges}
                      onChange={(e) =>
                        handleInputChange(
                          "totals",
                          "bankCharges",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  <div className="d-flex justify-content-between mb-2 pb-2 border-bottom fw-bold">
                    <span>Total Amount:</span>
                    <span>{formData.totals.total.toFixed(2)}</span>
                  </div>

                  <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                    <span>Amount Received:</span>
                    <Form.Control
                      type="number"
                      size="sm"
                      className="w-50 text-end"
                      value={formData.totals.amountReceived}
                      onChange={(e) =>
                        handleInputChange(
                          "totals",
                          "amountReceived",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>

                  <div className="d-flex justify-content-between mb-2 fw-bold">
                    <span>Balance:</span>
                    <span>{formData.totals.balance.toFixed(2)}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="text-muted text-center mt-2">
            * Tax amounts and totals are calculated automatically
          </div>
        </Card.Body>
      </Card>

      {/* Action Buttons */}
      <div className="d-flex justify-content-center gap-3 mb-4">
        <Button variant="primary" size="lg" onClick={generatePreview}>
          <FaEye className="me-2" /> Preview Invoice
        </Button>
        <Button variant="success" size="lg" onClick={handleSubmit}>
          <FaCog className="me-2" /> Create Invoice
        </Button>
        <Button variant="secondary" size="lg" onClick={resetForm}>
          <FaSyncAlt className="me-2" /> Reset Form
        </Button>
      </div>

      {/* Exchange Rate Modal */}
      <Modal
        show={showExchangeModal}
        onHide={() => setShowExchangeModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Exchange Rate Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Source:</Form.Label>
            <Form.Select
              value={formData.currencyDetails.rateSource}
              onChange={(e) =>
                handleNestedInputChange(
                  "currencyDetails",
                  "rateSource",
                  e.target.value
                )
              }
            >
              <option value="custom">Custom Rate</option>
              <option value="xe">XE.com Rate</option>
            </Form.Select>
          </Form.Group>

          {formData.currencyDetails.rateSource === "custom" ? (
            <Form.Group className="mb-3" id="customRateGroup">
              <Form.Label>Custom Rate (1 USD to INR):</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={formData.currencyDetails.customRate}
                onChange={(e) =>
                  handleNestedInputChange(
                    "currencyDetails",
                    "customRate",
                    parseFloat(e.target.value)
                  )
                }
              />
            </Form.Group>
          ) : (
            <div className="mb-3" id="xeRateGroup">
              <p>
                Current XE.com rate: <span>87.52</span>
              </p>
              <Form.Check
                type="checkbox"
                label="Add +1 to rate (standard for all currencies except LKR)"
                checked={formData.currencyDetails.addOneToRate}
                onChange={(e) =>
                  handleNestedInputChange(
                    "currencyDetails",
                    "addOneToRate",
                    e.target.checked
                  )
                }
              />
              <Form.Check
                type="checkbox"
                label="Add +10 to rate (for USD to LKR only)"
                checked={formData.currencyDetails.addTenToRate}
                onChange={(e) =>
                  handleNestedInputChange(
                    "currencyDetails",
                    "addTenToRate",
                    e.target.checked
                  )
                }
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowExchangeModal(false)}
          >
            Close
          </Button>
          <Button variant="primary" onClick={applyExchangeRate}>
            Apply Rate
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Item Management Modal */}
      <Modal
        show={showItemModal}
        onHide={() => setShowItemModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Nav
            variant="tabs"
            activeKey={activeTab}
            onSelect={setActiveTab}
            className="mb-4"
          >
            <Nav.Item>
              <Nav.Link eventKey="sell">Sell Details</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="purchase">Purchase Details</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="sell" active={activeTab === "sell"}>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Item Code:</Form.Label>
                    <Form.Control
                      type="text"
                      value={newItem.code}
                      onChange={(e) =>
                        setNewItem({ ...newItem, code: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Item Type:</Form.Label>
                    <Form.Select
                      value={newItem.type}
                      onChange={(e) =>
                        setNewItem({ ...newItem, type: e.target.value })
                      }
                    >
                      {itemTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={12} className="mb-3">
                  <Form.Group>
                    <Form.Label>Description:</Form.Label>
                    <Form.Control
                      type="text"
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({ ...newItem, description: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Check-in Time:</Form.Label>
                    <Form.Control
                      type="time"
                      value={newItem.checkin}
                      onChange={(e) =>
                        setNewItem({ ...newItem, checkin: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Check-out Time:</Form.Label>
                    <Form.Control
                      type="time"
                      value={newItem.checkout}
                      onChange={(e) =>
                        setNewItem({ ...newItem, checkout: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>

                <Col md={4} className="mb-3">
                  <Form.Group>
                    <Form.Label>Quantity:</Form.Label>
                    <Form.Control
                      type="number"
                      value={newItem.qty}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          qty: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </Form.Group>
                </Col>

                <Col md={4} className="mb-3">
                  <Form.Group>
                    <Form.Label>Price:</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Form.Group>
                </Col>

                <Col md={4} className="mb-3">
                  <Form.Group>
                    <Form.Label>Discount (%):</Form.Label>
                    <Form.Control
                      type="number"
                      value={newItem.discount}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          discount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab.Pane>

            <Tab.Pane eventKey="purchase" active={activeTab === "purchase"}>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Cost Price:</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Tax Rate:</Form.Label>
                    <Form.Select
                      value={newItem.taxRate || 0}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          taxRate: parseFloat(e.target.value) || 0,
                        })
                      }
                    >
                      <option value="0">No Tax</option>
                      <option value="18">GST 18%</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Tab.Pane>
          </Tab.Content>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowItemModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={addNewItem}>
            Add to Invoice
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Charge Modal */}
      <Modal show={showChargeModal} onHide={() => setShowChargeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Additional Charge</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Description:</Form.Label>
            <Form.Control
              type="text"
              value={newCharge.description}
              onChange={(e) =>
                setNewCharge({ ...newCharge, description: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Amount:</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              value={newCharge.amount}
              onChange={(e) =>
                setNewCharge({
                  ...newCharge,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Taxable"
              checked={newCharge.taxable}
              onChange={(e) =>
                setNewCharge({ ...newCharge, taxable: e.target.checked })
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowChargeModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={addNewCharge}>
            Add Charge
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Tax Rate Modal */}
      <Modal show={showTaxModal} onHide={() => setShowTaxModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Tax Rate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Display Name:</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., GST, VAT"
              value={newTaxRate.name}
              onChange={(e) =>
                setNewTaxRate({ ...newTaxRate, name: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tax Component:</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g., Goods and Services Tax"
              value={newTaxRate.component}
              onChange={(e) =>
                setNewTaxRate({ ...newTaxRate, component: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Rate (%):</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              placeholder="e.g., 18.00"
              value={newTaxRate.rate}
              onChange={(e) =>
                setNewTaxRate({
                  ...newTaxRate,
                  rate: parseFloat(e.target.value) || 0,
                })
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTaxModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={addNewTaxRate}>
            Add Tax Rate
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Customer Modal */}
      <Modal
        show={showCustomerModal}
        onHide={() => setShowCustomerModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New Customer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Customer Code:</Form.Label>
            <Form.Control
              type="text"
              value={newCustomer.code}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, code: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Customer Name:</Form.Label>
            <Form.Control
              type="text"
              value={newCustomer.name}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, name: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Address:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={newCustomer.address}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, address: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mobile:</Form.Label>
            <Form.Control
              type="text"
              value={newCustomer.mobile}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, mobile: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>GST No:</Form.Label>
            <Form.Control
              type="text"
              value={newCustomer.gstNo}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, gstNo: e.target.value })
              }
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowCustomerModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={createNewCustomer}>
            Create Customer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Invoice Modal */}
      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
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

              <div className="notice-box p-2 mb-3 text-start bg-warning bg-opacity-10 border-start border-warning border-4">
                <strong>STRICTLY TO BE NOTED:</strong> Finance bill 2017
                proposes to insert Section 269ST in the Income tax Act that
                restricts receiving an amount of Rs 2,00,000/- or more. Sharmila
                Travels will not accept any cash deposit effective 1st April
                2017. If trade partners make cash deposit, then the amount will
                be ignored and use other payment modes such as Cheque deposit,
                RTGS & NEFT for all your future bookings with Sharmila Travels.
              </div>

              <h5 className="fw-bold mb-3">INVOICE (Original)</h5>
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
                <div>GST NO: {formData.customer.gstNo || "OTHERS"}</div>
              </div>
              <div className="text-end">
                <div>
                  <strong>No.</strong>{" "}
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
                      {formData.currencyDetails.currency === "INR" ? "₹" : "$"}
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
                      {formData.currencyDetails.currency === "INR" ? "₹" : "$"}
                      {item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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

            {/* Totals */}
            <div className="row mb-4">
              <div className="col-md-6 offset-md-6">
                <table style={{ width: "100%" }}>
                  <tr>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      <strong>Sub Total:</strong>
                    </td>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      {formData.currencyDetails.currency === "INR" ? "₹" : "$"}
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
                      {formData.currencyDetails.currency === "INR" ? "₹" : "$"}
                      {formData.totals.total.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      <strong>Amount Received:</strong>
                    </td>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      {formData.currencyDetails.currency === "INR" ? "₹" : "$"}
                      {formData.totals.amountReceived.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      <strong>Balance:</strong>
                    </td>
                    <td style={{ padding: "4px", textAlign: "right" }}>
                      {formData.currencyDetails.currency === "INR" ? "₹" : "$"}
                      {formData.totals.balance.toFixed(2)}
                    </td>
                  </tr>
                </table>
              </div>
            </div>

            {/* Bottom left: Staff and Remark */}
            <div className="row">
              <div className="col-md-6">
                <div>
                  <strong>Staff:</strong> {formData.payment.staff}
                </div>
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
            onClick={() => setShowPreviewModal(false)}
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
    </div>
  );
};

export default Invoice_aahaas;
