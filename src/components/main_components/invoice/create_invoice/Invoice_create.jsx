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
  Badge,
  Spinner,
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
  FaEdit, // Add this import
} from "react-icons/fa";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Invoice_sharmila_modal from "./shirmila_travels/Invoice_sharmila_modal";
import Invoice_appleholidays_modal from "./appleholidays/Invoice_appleholidays_modal";
import Invoice_aahaas_modal from "./aahaas/Invoice_aahaas_modal";
import { add } from "date-fns";

const Invoice_create = () => {
  const { selectedCompany } = useContext(CompanyContext);
  const navigate = useNavigate();

  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  const [customers, setCustomers] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [xeRate, setXeRate] = useState(88.66);
  const [increaseAmount, setIncreaseAmount] = useState(0);

  const [currency, setCurrency] = useState("USD");
  const [attachments, setAttachments] = useState([]);
  const [companyNo, setCompanyNo] = useState(null);
  const [component, setComponent] = useState(null);

  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("LKR");
  const [exchangeRates, setExchangeRates] = useState({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isXeRateZero, setIsXeRateZero] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [convertFromCurrency, setConvertFromCurrency] = useState("USD");
  const [convertToCurrency, setConvertToCurrency] = useState("USD");
  const [originalAmount, setOriginalAmount] = useState(0);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [descriptionValue, setDescriptionValue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch customers and tax rates on component mount
  useEffect(() => {
    fetchCustomers();
    // fetchAccounts()
    // fetchTaxRates();
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [selectedCompany]);

  useEffect(() => {
    const companyMap = {
      appleholidays: 2,
      aahaas: 3,
      shirmila: 1,
    };

    setCompanyNo(companyMap[selectedCompany?.toLowerCase()] || 3);
    // resetForm()
    setFormData({
      customer: {
        id: null,
        name: "",
        address: "",
        mobile: "",
        code: "",
        gst_no: "",
        customer: "",
        customer_email: "",
        customer_number: "",
        payment_method: "",
      },
      invoice: {
        country: "IN",
        number: "",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        salesId: "",
        printedBy: "",
        yourRef: "",
        bookingId: "",
        paymentMethod: "",
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
      taxRates: [],
      accountDetails: {
        name: "",
        number: "",
        bank: "",
        branch: "",
        ifsc: "",
        address: "",
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
      attachments: [],
    });
  }, [selectedCompany]);

  const renderCompanyName = () => {
    switch (companyNo) {
      case 1:
        return <span className="text-warning">Sharmila Tours & Travels</span>;
      case 2:
        return (
          <span className="text-success">
            Apple Holidays Destination Services
          </span>
        );
      case 3:
        return <span className="text-primary">Aahaas</span>;
      default:
        return <span className="text-muted">Unknown Company</span>;
    }
  };

  // const fetchAccounts = async (currencyInfo = "USD") => {
  //   try {
  //     console.log(`Fetching accounts for currency: ${currencyInfo}`);

  //     const response = await axios.get(
  //       `/api/accounts/by-currency/${currencyInfo}/${companyNo}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );
  //     console.log(response);
  //     setAccounts(response.data);
  //   } catch (error) {
  //     console.error("Error fetching accounts:", error);
  //   }
  // };

  const fetchAccounts = async (currencyInfo = "USD") => {
    try {
      console.log(`Fetching accounts for currency: ${currencyInfo}`);

      const response = await axios.get(
        `/api/accounts/by-currency/${currencyInfo}/${companyNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response);
      setAccounts(response.data);

      // Auto-select the first account for the new currency if available
      if (response.data.length > 0) {
        const firstAccount = response.data[0];
        handleAccountSelect(firstAccount.id, currencyInfo);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };
  const fetchCustomers = async () => {
    try {
      const response = await axios.get("/api/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);

      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    if (component) {
      fetchTaxRates();
    }
  }, [component]);

  const fetchTaxRates = async () => {
    try {
      const response = await axios.get(`/api/tax-rate/component/${component}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetched tax rate:", response.data);

      const rates = Array.isArray(response.data)
        ? response.data
        : [response.data];

      setTaxRates(rates);

      // Safely extract numeric rate
      if (rates.length > 0 && rates[0]?.rate != null) {
        const numericRate = Number(rates[0].rate);
        setNewTaxRate((prev) => ({
          ...prev,
          rate: isNaN(numericRate) ? 0 : numericRate,
        }));
      }
    } catch (error) {
      console.error("Error fetching tax rates:", error);
      setTaxRates([]);
    }
  };

  const TAX_COMPONENTS = [
    { name: "GST", rate: 18, type: "standard" },
    { name: "CGST", rate: 9, type: "standard" },
    { name: "SGST", rate: 9, type: "standard" },
    { name: "Flight Tax", rate: 5, type: "flight" },
    { name: "Hotel Tax", rate: 12, type: "hotel" },
    { name: "Lifestyle Tax", rate: 18, type: "lifestyle" },
    { name: "Essentials Tax", rate: 5, type: "essentials" },
    { name: "Non-Essentials Tax", rate: 18, type: "non-essentials" },
    { name: "Education Tax", rate: 0, type: "education" },
  ];

  const handleSubmit = async () => {
    console.log(formData);
    setIsSubmitting(true);
    const paymentMethodArray = Object.entries(formData.payment.methods)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    const dataToSend = {
      invoice_number: formData.invoice.number,
      customer_id: formData.customer.id,
      country_code: formData.invoice.country,
      payment_method: formData.invoice.paymentMethod,
      currency: formData.currencyDetails.currency,
      exchange_rate: formData.currencyDetails.exchangeRate,
      tax_treatment: formData.currencyDetails.taxTreatment,
      payment_type: formData.payment.type,
      collection_date: formData.payment.collectionDate,
      payment_instructions: formData.payment.instructions,
      staff: formData.payment.staff,
      remarks: formData.payment.remarks,
      payment_methods: paymentMethodArray,
      company_id: companyNo,
      account_id: formData.selectedAccountId || 1, // use your selected account logic
      booking_no: formData.invoice.bookingId,
      start_date: formData.invoice.startDate,
      sales_id: formData.invoice.salesId,
      end_date: formData.invoice.endDate,
      sub_total: formData.totals.subTotal.toFixed(2),
      handling_fee: formData.totals.handlingFee.toFixed(2),
      gst_amount: formData.totals.handlingFee * 0.18,
      total_amount: formData.totals.total.toFixed(2),

      additional_tax: formData.totals.additionalTax.toFixed(2),
      bank_charges: formData.totals.additionalTax.toFixed(2),
      amount_received: formData.totals.amountReceived.toFixed(2),
      balance: formData.totals.balance.toFixed(2),
      from_currency: fromCurrency,
      to_currency: toCurrency,
      // bank_charges:formData.additionalCharges
      //                   .reduce(
      //                     (sum, charge) => sum + parseFloat(charge.amount || 0),
      //                     0
      //                   )
      //                   .toFixed(2),

      travel_period: calculateTravelDays(
        formData.invoice.startDate,
        formData.invoice.endDate
      ),

      items: formData.serviceItems.map((item) => ({
        code: item.code,
        type: item.type,
        description: item.description,
        quantity: item.qty,
        price: item.price,
        discount: item.discount,
        checkin_time: item.checkin_time || null,
        checkout_time: item.checkout_time || null,
      })),

      additional_charges: formData.additionalCharges.map((charge) => ({
        description: charge.description,
        amount: charge.amount,
        taxable: 1,
      })),
      attachments: formData.attachments,
      // attachments: formData.attachments.forEach((file) => {
      //   formData.append("attachments[]", file);
      // }),
    };

    console.log("Formatted Data to Send =>", dataToSend);

    try {
      const response = await axios.post("/api/invoices", dataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data);
      alert("Invoice created successfully!");
      resetForm();
      setAttachments([]);
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert(
        "Error creating invoice: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit1 = async () => {
    console.log(formData);

    const paymentMethodArray = Object.entries(formData.payment.methods)
      .filter(([_, value]) => value)
      .map(([key]) => key);

    // Create FormData object for file uploads
    const formDataToSend = new FormData();

    // Add all the data fields
    formDataToSend.append("customer_id", formData.customer.id);
    formDataToSend.append("country_code", formData.invoice.country);
    formDataToSend.append("currency", formData.currencyDetails.currency);
    formDataToSend.append(
      "exchange_rate",
      formData.currencyDetails.exchangeRate
    );
    formDataToSend.append(
      "tax_treatment",
      formData.currencyDetails.taxTreatment
    );
    formDataToSend.append("payment_type", formData.payment.type);
    formDataToSend.append("collection_date", formData.payment.collectionDate);
    formDataToSend.append(
      "payment_instructions",
      formData.payment.instructions
    );
    formDataToSend.append("staff", formData.payment.staff);
    formDataToSend.append("remarks", formData.payment.remarks);
    formDataToSend.append(
      "payment_methods",
      JSON.stringify(paymentMethodArray)
    );
    formDataToSend.append("company_id", companyNo);
    formDataToSend.append("account_id", formData.selectedAccountId || 1);
    formDataToSend.append("booking_no", formData.invoice.bookingId || "");
    formDataToSend.append("start_date", formData.invoice.startDate || "");
    formDataToSend.append("sales_id", formData.invoice.salesId || "");
    formDataToSend.append("end_date", formData.invoice.endDate || "");

    formDataToSend.append("end_date", formData.invoice.endDate || "");
    formDataToSend.append("end_date", formData.invoice.endDate || "");
    formDataToSend.append("end_date", formData.invoice.endDate || "");
    formDataToSend.append(
      "travel_period",
      calculateTravelDays(
        formData.invoice.startDate,
        formData.invoice.endDate
      ) || ""
    );
    formDataToSend.append("status", "draft"); // Add status field

    // Add items
    formDataToSend.append(
      "items",
      JSON.stringify(
        formData.serviceItems.map((item) => ({
          code: item.code,
          type: item.type,
          description: item.description,
          quantity: item.qty,
          price: item.price,
          discount: item.discount,
          checkin_time: item.checkin_time || null,
          checkout_time: item.checkout_time || null,
        }))
      )
    );

    // Add additional charges
    formDataToSend.append(
      "additional_charges",
      JSON.stringify(
        formData.additionalCharges.map((charge) => ({
          description: charge.description,
          amount: charge.amount,
          taxable: charge.taxable ? 1 : 0, // Convert to 1/0 for boolean
        }))
      )
    );

    // Add empty refund object (as required by your backend)
    formDataToSend.append(
      "refund",
      JSON.stringify([
        {
          refund_amount: null,
          total_amount: null,
          refund_reason: null,
          attachments: [],
          payment_methods: [],
          remark: null,
          status: "non-refund",
          refund_status: null,
        },
      ])
    );

    // Add attachments
    if (formData.attachments && formData.attachments.length > 0) {
      formData.attachments.forEach((file) => {
        formDataToSend.append("attachments[]", file);
      });
    }

    console.log(
      "Formatted Data to Send =>",
      Object.fromEntries(formDataToSend)
    );

    try {
      const response = await axios.post("/api/invoices", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data);
      alert("Invoice created successfully!");
      resetForm();
      setAttachments([]);
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert(
        "Error creating invoice: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // const handleSubmit = async () => {
  //   console.log(selectedCompany);
  //   const prefix =
  //     countryOptions.find((c) => c.code === formData.invoice.country)?.prefix ||
  //     "IN";

  //   const dataToSend = {
  //     ...formData,
  //     invoice: {
  //       ...formData.invoice,
  //       number: prefix + formData.invoice.number,
  //     },
  //     company_id: selectedCompany.id,
  //     items: formData.serviceItems.map((item) => ({
  //       code: item.code,
  //       type: item.type,
  //       description: item.description,
  //       checkin_time: item.checkin,
  //       checkout_time: item.checkout,
  //       quantity: item.qty,
  //       price: item.price,
  //       discount: item.discount,
  //     })),
  //     additional_charges: formData.additionalCharges.map((charge) => ({
  //       description: charge.description,
  //       amount: charge.amount,
  //       taxable: charge.taxable,
  //     })),
  //   };

  //   try {
  //     const response = await axios.post("/api/invoices", dataToSend);
  //     console.log();

  //     // Handle success
  //     alert("Invoice created successfully!");
  //     resetForm();
  //   } catch (error) {
  //     // Handle error
  //     console.error("Error creating invoice:", error);
  //     alert(
  //       "Error creating invoice: " +
  //         (error.response?.data?.message || error.message)
  //     );
  //   }
  // };

  // State for form data
  const [formData, setFormData] = useState({
    customer: {
      id: null,
      name: "",
      address: "",
      mobile: "",
      code: "",
      gst_no: "",
      customer: "",
      customer_email: "",
      customer_number: "",
      payment_method: "",
    },
    invoice: {
      country: "IS",
      number: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      salesId: "",
      printedBy: "",
      yourRef: "",
      bookingId: "",
      startDate: "",
      endDate: "",
      paymentMethod: "",
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
      name: "",
      number: "",
      bank: "",
      branch: "",
      ifsc: "",
      address: "",
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
    attachments: [],
  });

  // Modal states
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newItem, setNewItem] = useState({
    code: "123",
    type: "hotel",
    description: "",
    checkin_time: "",
    checkout_time: "",
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
    name: "new",
    component: "",
    rate: 0,
  });
  const [vatInclude, setVatInclude] = useState(false);
  const [vatComponent, setVatComponent] = useState({
    taxBased: "",
  });
  const [newCustomer, setNewCustomer] = useState({
    code: "",
    name: "",
    address: "",
    mobile: "",
    gst_no: "",
    customer: "",
    customer_email: "",
    customer_number: "",
    payment_method: "",
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

  const currencySymbols = {
    INR: "₹",
    USD: "$",
    SGD: "S$",
    MYR: "RM",
    LKR: "Rs",
  };

  // Currency options
  const currencyOptions = ["INR", "USD", "SGD", "MYR", "LKR"];

  // Item types
  // const itemTypes = ["hotel", "restaurant", "transport", "other"];
  const itemTypes = [
    "hotel",
    "transport",
    "ticket",
    "entrance",
    "meal",
    "guide",
    "others",
  ];

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

  const calculateTravelDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = endDate - startDate;
    // const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // +1 to include both days
    return diffDays > 0 ? diffDays : 0;
  };

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
        gst_no: customer.gst_no || "",
        customer: customer.customer || "",
        customer_email: customer.customer_email || "",
        customer_number: customer.customer_number || "",
        payment_method: customer.paymentMethod || "",
      },
    });
    setCustomerSearch("");
    setFilteredCustomers([]);
  };

  // Create new customer
  const createNewCustomer = async () => {
    try {
      const response = await axios.post("/api/customers", newCustomer, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCustomers([...customers, response.data]);
      handleCustomerSelect(response.data);
      setShowCustomerModal(false);
      setNewCustomer({
        // code: "",
        code: "",
        name: "",
        address: "",
        mobile: "",
        gst_no: "",
        customer: "",
        customer_email: "",
        customer_number: "",
        payment_method: "",
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      alert(
        "Error creating customer: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const isItemFormEmpty =
    !newItem.code &&
    !newItem.type &&
    !newItem.description &&
    !newItem.checkin_time &&
    !newItem.checkout_time &&
    (!newItem.qty || newItem.qty === 0) &&
    (!newItem.price || newItem.price === 0) &&
    (!newItem.discount || newItem.discount === 0);

  const createNewCustomerAahaas = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/customers", newCustomer, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const createdCustomer = response.data;

      // Add to customer list
      setCustomers([...customers, createdCustomer]);

      // Assign it to formData.customer (Agent Details)
      handleCustomerSelect(createdCustomer);

      // Close modal
      setShowCustomerModal(false);

      // Reset newCustomer form
      // setNewCustomer({
      //   code: "",
      //   name: "",
      //   address: "",
      //   mobile: "",
      //   gst_no: "",
      //   customer: "",
      //   customer_email: "",
      //   customer_number: "",
      //   payment_method: "",
      // });
    } catch (error) {
      console.error("Error creating customer:", error);
      alert(
        "Error creating customer: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setIsLoading(false); // stop spinner no matter success or error
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
  // const handleNestedInputChange = (section, subSection, field, value) => {
  //   setFormData({
  //     ...formData,
  //     [section]: {
  //       ...formData[section],
  //       [subSection]: {
  //         ...formData[section][subSection],
  //         [field]: value,
  //       },
  //     },
  //   });
  // };

  const handleNestedInputChange = (section, key, value) => {
    setFormData((formData) => ({
      ...formData,
      [section]: {
        ...formData[section],
        [key]: value, // value must be a string
      },
    }));
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
  // const handleCurrencyChange = (currency) => {
  //   console.log("Selected currency:", currency);

  //   let rate = 87.52;
  //   switch (currency) {
  //     case "SGD":
  //       rate = 65.32;
  //       break;
  //     case "MYR":
  //       rate = 21.05;
  //       break;
  //     case "LKR":
  //       rate = 0.29;
  //       break;
  //     case "INR":
  //       rate = 1.0;
  //       break;
  //     default:
  //       rate = 87.52;
  //   }
  //   setCurrency(currency);
  //   setFormData({
  //     ...formData,
  //     currencyDetails: {
  //       ...formData.currencyDetails,
  //       currency,
  //       exchangeRate: rate,
  //       customRate: rate,
  //     },
  //   });

  //   fetchAccounts(currency);
  // };
  const handleCurrencyChange = async (currency) => {
    console.log("Selected currency:", currency);

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

    setCurrency(currency);

    // Reset account details
    setFormData((prev) => ({
      ...prev,
      accountDetails: {
        name: "",
        number: "",
        bank: "",
        branch: "",
        ifsc: "",
        address: "",
      },
      selectedAccountId: null,
      currencyDetails: {
        ...prev.currencyDetails,
        currency,
        exchangeRate: rate,
        customRate: rate,
      },
    }));

    // Fetch accounts for the new currency
    await fetchAccounts(currency);
  };

  // Calculate totals
  // const calculateTotals = () => {
  //   const { currency, exchangeRate, taxTreatment } = formData.currencyDetails;
  //   const { serviceItems, additionalCharges, taxRates } = formData;

  //   // Calculate subtotal from service items
  //   let subTotal = 0;
  //   let totalPax = 0;
  //   let totalAmount = 0;
  //   console.log(serviceItems);

  //   serviceItems.forEach((item) => {
  //     if (item.type === "hotel" || item.type === "restaurant") {
  //       console.log(item.total);

  //       totalPax += item.qty;
  //       totalAmount += item.total;
  //     }
  //     // subTotal += item.total;
  //   });
  //   console.log(totalAmount);

  //   // Add additional charges
  //   let taxableCharges = 0;
  //   additionalCharges.forEach((charge) => {
  //     subTotal += charge.amount;
  //     if (charge.taxable) {
  //       taxableCharges += charge.amount;
  //     }
  //   });
  //   console.log(exchangeRate);
  //   console.log(totalPax);

  //   // Calculate handling fee (only for INR)
  //   let handlingFee = 0;
  //   if (currency === "INR" && totalPax > 0) {
  //     const perPersonRate = subTotal / totalPax - 5;
  //     handlingFee = 5 * 88.66 * totalPax;
  //     console.log(handlingFee);
  //     // totalAmount = totalAmount - handlingFee;
  //     console.log(totalAmount);
  //     // subTotal = totalAmount + handlingFee;
  //     subTotal = totalAmount;
  //   } else {
  //     subTotal = totalAmount;
  //   }

  //   let additionalTax = 0;
  //   console.log(taxRates);

  //   if (subTotal > 0 && taxRates.length > 0) {
  //     console.log(Number(taxRates[0].rate));
  //     additionalTax = subTotal * (parseFloat(Number(taxRates[0].rate)) / 100);
  //   }

  //   // formData.serviceItems.forEach((item) => {
  //   //   console.log(formData.taxRates);

  //   //   const itemTaxRate = formData.taxRates.find(
  //   //     (tax) => tax.component === item.type
  //   //   );
  //   //   console.log(itemTaxRate);

  //   //   if (itemTaxRate) {
  //   //     const itemTotal = item.price * (1 - item.discount / 100) * item.qty;
  //   //     console.log(itemTotal);

  //   //     additionalTax += itemTotal * (parseFloat(itemTaxRate.rate) / 100);
  //   //   }
  //   // });

  //   // Calculate GST (only for INR)
  //   if (vatInclude) {
  //     if (vatComponent.taxBased != "") {
  //       if (vatComponent.taxBased === "subtotal") {
  //         subTotal = subTotal + (subTotal * 18) / 100;
  //       } else if (vatComponent.taxBased === "total") {
  //         total = total + (total * 18) / 100;
  //       } else if (vatComponent.taxBased === "handling") {
  //         handlingFee = handlingFee + (handlingFee * 18) / 100;
  //       }
  //     }
  //   }
  //   let gst = 0;
  //   if (currency === "INR") {
  //     // const gstRate = taxRates.find((tax) => tax.name === "GST")?.rate || 0;
  //     gst = handlingFee * (18 / 100);
  //   }
  //   const additionalChargeCost = formData.additionalCharges.reduce(
  //     (acc, item) => acc + parseFloat(item.amount || 0),
  //     0
  //   );
  //   console.log(handlingFee);

  //   console.log(vatComponent);
  //   console.log(handlingFee);

  //   // Calculate total
  //   const total =
  //     subTotal +
  //     // handlingFee +
  //     gst +
  //     // formData.totals.additionalTax +
  //     additionalTax +
  //     additionalChargeCost +
  //     formData.totals.bankCharges;
  //   const balance = total - formData.totals.amountReceived;

  //   setFormData({
  //     ...formData,
  //     totals: {
  //       ...formData.totals,
  //       subTotal,
  //       handlingFee,
  //       gst,
  //       total,
  //       balance,
  //       additionalTax,
  //     },
  //   });
  // };

  // Replace the entire calculateTotals function with this:
  // const calculateTotals = () => {
  //   const { currency, exchangeRate, taxTreatment } = formData.currencyDetails;
  //   const { serviceItems, additionalCharges, taxRates } = formData;

  //   // Calculate subtotal from service items
  //   let subTotal = 0;
  //   let totalPax = 0;
  //   let totalAmount = 0;

  //   serviceItems.forEach((item) => {
  //     if (item.type === "hotel" || item.type === "restaurant") {
  //       totalPax += item.qty;
  //       totalAmount += item.total;
  //     }
  //   });

  //   // Add additional charges
  //   let taxableCharges = 0;
  //   additionalCharges.forEach((charge) => {
  //     subTotal += charge.amount;
  //     if (charge.taxable) {
  //       taxableCharges += charge.amount;
  //     }
  //   });

  //   // Calculate handling fee (only for INR)
  //   let handlingFee = 0;
  //   if (currency === "INR" && totalPax > 0) {
  //     const perPersonRate = subTotal / totalPax - 5;
  //     handlingFee = 5 * 88.66 * totalPax;
  //     subTotal = totalAmount;
  //   } else {
  //     subTotal = totalAmount;
  //   }

  //   let additionalTax = 0;
  //   if (subTotal > 0 && taxRates.length > 0) {
  //     additionalTax = subTotal * (parseFloat(Number(taxRates[0].rate)) / 100);
  //   }

  //   // Calculate GST (only for INR)
  //   let gst = 0;
  //   if (currency === "INR") {
  //     gst = handlingFee * (18 / 100);
  //   }

  //   const additionalChargeCost = formData.additionalCharges.reduce(
  //     (acc, item) => acc + parseFloat(item.amount || 0),
  //     0
  //   );

  //   // Create temporary variables for VAT calculation
  //   let calculatedSubTotal = subTotal;
  //   let calculatedHandlingFee = handlingFee;
  //   let calculatedTotal = subTotal + handlingFee + gst + additionalTax + additionalChargeCost + formData.totals.bankCharges;

  //   // Apply VAT if enabled
  //   if (vatInclude && vatComponent.taxBased !== "") {
  //     const vatRate = 0.18; // 18% VAT

  //     if (vatComponent.taxBased === "subtotal") {
  //       calculatedSubTotal = calculatedSubTotal + (calculatedSubTotal * vatRate);
  //     } else if (vatComponent.taxBased === "total") {
  //       calculatedTotal = calculatedTotal + (calculatedTotal * vatRate);
  //     } else if (vatComponent.taxBased === "handling") {
  //       calculatedHandlingFee = calculatedHandlingFee + (calculatedHandlingFee * vatRate);
  //     }
  //   }

  //   // Recalculate total with VAT adjustments
  //   calculatedTotal = calculatedSubTotal + calculatedHandlingFee + gst + additionalTax + additionalChargeCost + formData.totals.bankCharges;

  //   const balance = calculatedTotal - formData.totals.amountReceived;

  //   setFormData({
  //     ...formData,
  //     totals: {
  //       ...formData.totals,
  //       subTotal: calculatedSubTotal,
  //       handlingFee: calculatedHandlingFee,
  //       gst,
  //       total: calculatedTotal,
  //       balance,
  //       additionalTax,
  //     },
  //   });
  // };
  // Replace the entire calculateTotals function with this:
  const calculateTotals1 = () => {
    const { currency, exchangeRate, taxTreatment } = formData.currencyDetails;
    const { serviceItems, additionalCharges, taxRates } = formData;

    // Calculate subtotal from service items
    let subTotal = 0;
    let totalPax = 0;
    let totalAmount = 0;

    serviceItems.forEach((item) => {
      // if (item.type === "hotel" || item.type === "restaurant") {
      totalPax += item.qty;
      totalAmount += item.total;
      // }
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
      // handlingFee = 5 * 88.66 * totalPax;
      handlingFee = 5 * (xeRate + increaseAmount) * totalPax;
      subTotal = totalAmount;
    } else {
      subTotal = totalAmount;
    }

    let additionalTax = 0;
    if (subTotal > 0 && taxRates.length > 0) {
      additionalTax = subTotal * (parseFloat(Number(taxRates[0].rate)) / 100);
    }

    // Calculate GST (only for INR)
    let gst = 0;
    if (currency === "INR") {
      gst = handlingFee * (18 / 100);
    }

    const additionalChargeCost = formData.additionalCharges.reduce(
      (acc, item) => acc + parseFloat(item.amount || 0),
      0
    );

    // Create temporary variables for VAT calculation
    let calculatedSubTotal = subTotal;
    let calculatedHandlingFee = handlingFee;
    let calculatedTotal =
      subTotal +
      handlingFee +
      gst +
      additionalTax +
      additionalChargeCost +
      formData.totals.bankCharges;

    // Apply VAT if enabled
    // if (vatInclude && vatComponent.taxBased !== "") {
    console.log("Calculated SubTotal before VAT:", calculatedSubTotal);
    console.log("VAT Include:", vatInclude);

    if (vatInclude) {
      const vatRate = 0.18; // 18% VAT
      console.log("fff");

      if (vatComponent.taxBased === "subtotal") {
        calculatedSubTotal = calculatedSubTotal + calculatedSubTotal * vatRate;
      } else if (vatComponent.taxBased === "total") {
        calculatedTotal = calculatedTotal + calculatedTotal * vatRate;
      } else if (vatComponent.taxBased === "handling") {
        calculatedHandlingFee =
          calculatedHandlingFee + calculatedHandlingFee * vatRate;
      }
    }
    console.log("Calculated SubTotal after VAT:", calculatedSubTotal);
    // Recalculate total with VAT adjustments
    calculatedTotal =
      calculatedSubTotal +
      calculatedHandlingFee +
      gst +
      additionalTax +
      additionalChargeCost +
      formData.totals.bankCharges;

    const balance = calculatedTotal - formData.totals.amountReceived;

    setFormData({
      ...formData,
      totals: {
        ...formData.totals,
        subTotal: calculatedSubTotal,
        handlingFee: calculatedHandlingFee,
        gst,
        total: calculatedTotal,
        balance,
        additionalTax,
      },
    });
  };

  const calculateTotals = () => {
    const { currency } = formData.currencyDetails;
    const {
      serviceItems,
      additionalCharges,
      taxRates,
      vatInclude,
      vatComponent,
    } = formData;

    let subTotal = 0;
    let totalPax = 0;
    let totalAmount = 0;

    // Service items subtotal
    serviceItems.forEach((item) => {
      totalPax += item.qty;
      totalAmount += item.total;
    });

    // Additional charges
    let taxableCharges = 0;
    additionalCharges.forEach((charge) => {
      if (charge.taxable) {
        taxableCharges += charge.amount;
      }
    });

    // Handling fee (only INR)
    let handlingFee = 0;
    console.log(isXeRateZero);
    
    if (currency === "INR" && totalPax > 0 && !isXeRateZero) {
      handlingFee = 5 * (xeRate === 1 ? 0 : xeRate) * totalPax; // ensure xeRate is defined
      subTotal = totalAmount; // reset subtotal to items only
    } else {
      subTotal = totalAmount;
    }
    console.log("Handling Fee:", handlingFee);
    console.log("Increase Amount:", increaseAmount);
    console.log("Increase Amount:", increaseAmount + xeRate);
    console.log("Total Pax:", totalPax);
    console.log("xeRate:", xeRate);

    // Taxes
    let additionalTax = 0;
    if (subTotal > 0 && taxRates.length > 0) {
      additionalTax = subTotal * (parseFloat(Number(taxRates[0].rate)) / 100);
    }

    // GST (only INR)
    let gst = 0;
    if (currency === "INR") {
      gst = handlingFee * 0.18;
    }

    const additionalChargeCost = additionalCharges.reduce(
      (acc, item) => acc + parseFloat(item.amount || 0),
      0
    );

    // Initial totals before VAT
    let calculatedSubTotal = subTotal;
    let calculatedHandlingFee = handlingFee;
    let calculatedTotal =
      calculatedSubTotal +
      // calculatedHandlingFee +
      gst +
      additionalTax +
      // additionalChargeCost +
      formData.totals.bankCharges;

    // Apply VAT
    if (vatInclude) {
      const vatRate = 0.18;
      if (vatComponent.taxBased === "subtotal") {
        calculatedSubTotal += calculatedSubTotal * vatRate;
      } else if (vatComponent.taxBased === "handling") {
        calculatedHandlingFee += calculatedHandlingFee * vatRate;
      } else if (vatComponent.taxBased === "total") {
        calculatedTotal += calculatedTotal * vatRate; // keep this final
      }
    }

    // Recalculate total only if VAT wasn’t applied on total directly
    // if (!(vatInclude && vatComponent.taxBased === "total")) {
    if (vatInclude) {
      calculatedTotal =
        calculatedSubTotal +
        // calculatedHandlingFee +
        // calculatedSubTotal * 0.18 + // GST recalculated on new subtotal
        gst +
        additionalTax +
        additionalChargeCost +
        formData.totals.bankCharges;
    }

    const balance = calculatedTotal - formData.totals.amountReceived;

    setFormData({
      ...formData,
      totals: {
        ...formData.totals,
        subTotal: calculatedSubTotal,
        handlingFee: calculatedHandlingFee,
        gst,
        total: calculatedTotal,
        balance,
        additionalTax,
      },
    });
  };

  const toggleTaxRateStatus = async (taxId, isActive) => {
    try {
      await axios.patch(
        `/api/tax-rates/${taxId}`,
        { isActive },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      const updatedTaxRates = taxRates.map((tax) =>
        tax.id === taxId ? { ...tax, isActive } : tax
      );

      setTaxRates(updatedTaxRates);
      setFormData((prev) => ({
        ...prev,
        taxRates: updatedTaxRates,
      }));

      calculateTotals();
    } catch (error) {
      console.error("Error updating tax rate status:", error);
    }
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
          // total: currency === "INR" ? total : total * exchangeRate,
          total: currency === "INR" ? total : total,
        },
      ],
    });

    setNewItem({
      code: "",
      type: "hotel",
      description: "",
      checkin_time: "",
      checkout_time: "",
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
      const response = await axios.post(
        "/api/tax-rates",
        {
          name: newTaxRate.component,
          component: newTaxRate.component,
          rate: newTaxRate.rate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update tax rates list
      const updatedTaxRates = [...taxRates, response.data];
      setTaxRates(updatedTaxRates);

      // Update formData tax rates
      setFormData((prev) => ({
        ...prev,
        taxRates: updatedTaxRates,
      }));

      // Reset form
      setNewTaxRate({
        name: "new",
        component: "",
        rate: 0,
      });

      setShowTaxModal(false);
      calculateTotals();
    } catch (error) {
      console.error("Error adding tax rate:", error);
      alert(
        "Error adding tax rate: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Add this function to handle currency conversion
  // const handleCurrencyConversion = () => {
  //   if (convertFromCurrency === convertToCurrency) {
  //     setConvertedAmount(originalAmount);
  //     return;
  //   }

  //   // Get exchange rates (you'll need to fetch these from your API)
  //   const exchangeRates = {
  //     USD: 1,
  //     INR: 88.0852,
  //     LKR: 301.7202,
  //     SGD: 1.2835,
  //     MYR: 4.2188,
  //     EUR: 0.8511,
  //     GBP: 0.7385,
  //   };

  //   // Convert currency
  //   const amountInUSD =
  //     originalAmount / (exchangeRates[convertFromCurrency] || 1);
  //   const converted = amountInUSD * (exchangeRates[convertToCurrency] || 1);

  //   setConvertedAmount(parseFloat(converted.toFixed(2)));
  // };
  const handleCurrencyConversion = async () => {
    if (convertFromCurrency === convertToCurrency) {
      setConvertedAmount(originalAmount);
      return;
    }
    setIsLoading(true); // Start loading

    try {
      // Fetch exchange rates from your API
      const rates = await fetchExchangeRates(convertFromCurrency);

      if (rates && rates[convertToCurrency]) {
        const converted =
          originalAmount * (rates[convertToCurrency] + increaseAmount);
        setConvertedAmount(parseFloat(converted.toFixed(2)));
      } else {
        console.error("Exchange rate not available for target currency");
        // Fallback to hardcoded rates if API fails
        const fallbackRates = {
          USD: 1,
          INR: 88.0852,
          LKR: 301.7202,
          SGD: 1.2835,
          MYR: 4.2188,
        };

        const converted =
          originalAmount * (fallbackRates[convertToCurrency] || 1);
        setConvertedAmount(parseFloat(converted.toFixed(2)));
      }
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      // Fallback logic here
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // const fetchExchangeRates = async (baseCurrency = "USD") => {
  //   try {
  //     const response = await axios.get(
  //       `/api/currency/rates?base=${baseCurrency}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     if (response.data && response.data.rates) {
  //       return response.data.rates;
  //     }
  //     // if (response.data && response.data.rates) {
  //     //   const rate = response.data.rates; // e.g. "INR"
  //     //   if (!rate) throw new Error("Target currency not found");

  //     //   return rate + increaseAmount;
  //     // }
  //     throw new Error("Invalid response format");
  //   } catch (error) {
  //     console.error("Error fetching exchange rates:", error);

  //     // Return comprehensive default rates for fallback
  //     const defaultRates = {
  //       USD: 1,
  //       INR: 88.0852,
  //       LKR: 301.7202,
  //       SGD: 1.2835,
  //       MYR: 4.2188,
  //       EUR: 0.8511,
  //       GBP: 0.7385,
  //       AED: 3.6725,
  //       CAD: 1.3808,
  //       AUD: 1.5174,
  //       JPY: 147.5733,
  //       CNY: 7.1276,
  //       CHF: 0.7942,
  //     };

  //     // If base currency is not USD, convert the rates
  //     if (baseCurrency !== "USD") {
  //       const baseRate = defaultRates[baseCurrency] || 1;
  //       const convertedRates = {};
  //       Object.keys(defaultRates).forEach((currency) => {
  //         convertedRates[currency] = defaultRates[currency] / baseRate;
  //       });
  //       return convertedRates;
  //     }

  //     return defaultRates;
  //   }
  // };

  // Delete item from table

  const fetchExchangeRates = async (baseCurrency = "USD") => {
    try {
      const response = await axios.get(
        `/api/currency/rates?base=${baseCurrency}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.rates) {
        return response.data.rates;
      }
      throw new Error("Invalid response format");
    } catch (error) {
      console.error("Error fetching exchange rates:", error);

      // Return comprehensive default rates for fallback
      const defaultRates = {
        USD: 1,
        INR: 88.0852,
        LKR: 301.7202,
        SGD: 1.2835,
        MYR: 4.2188,
        EUR: 0.8511,
        GBP: 0.7385,
        AED: 3.6725,
        CAD: 1.3808,
        AUD: 1.5174,
        JPY: 147.5733,
        CNY: 7.1276,
        CHF: 0.7942,
      };

      // If base currency is not USD, convert the rates
      if (baseCurrency !== "USD") {
        const baseRate = defaultRates[baseCurrency] || 1;
        const convertedRates = {};
        Object.keys(defaultRates).forEach((currency) => {
          convertedRates[currency] = defaultRates[currency] / baseRate;
        });
        return convertedRates;
      }

      return defaultRates;
    }
  };
  const deleteItem = async (id, type) => {
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
      try {
        await axios.delete(`/api/tax-rates/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const updatedTaxRates = taxRates.filter((tax) => tax.id !== id);
        setTaxRates(updatedTaxRates);
        setFormData((prev) => ({
          ...prev,
          taxRates: updatedTaxRates,
        }));
        calculateTotals();
      } catch (error) {
        console.error("Error deleting tax rate:", error);
        alert(
          "Error deleting tax rate: " +
            (error.response?.data?.message || error.message)
        );
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
    console.log(formData);
  };

  // const handleAccountSelect = (accountId, currency) => {
  //   console.log("Selected account ID:", accountId);

  //   const selected = accounts.find((acc) => acc.id === parseInt(accountId));
  //   console.log("Selected account:", selected);

  //   if (selected) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       accountDetails: {
  //         name: selected.account_name,
  //         number: selected.account_no,
  //         bank: selected.bank,
  //         branch: selected.branch,
  //         ifsc: selected.ifsc_code,
  //         address: selected.bank_address,
  //       },
  //       selectedAccountId: selected.id,
  //     }));
  //   }
  // };

  const handleAccountSelect = (accountId, currency) => {
    console.log("Selected account ID:", accountId);

    const selected = accounts.find((acc) => acc.id === parseInt(accountId));
    console.log("Selected account:", selected);

    if (selected) {
      setFormData((prev) => ({
        ...prev,
        accountDetails: {
          name: selected.account_name,
          number: selected.account_no,
          bank: selected.bank,
          branch: selected.branch,
          ifsc: selected.ifsc_code,
          address: selected.bank_address,
        },
        selectedAccountId: selected.id,
      }));
    }
  };
  const handleAccount = () => {
    navigate("/invoice/bank-accounts");
  };

  // Handle edit item
  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      ...item,
      total: item.qty * item.price * (1 - item.discount / 100),
    });
    setIsEditing(true);
    setShowItemModal(true);
  };

  // Update existing item
  const updateItem = () => {
    const { currency, exchangeRate } = formData.currencyDetails;
    const total = newItem.price * (1 - newItem.discount / 100) * newItem.qty;

    setFormData({
      ...formData,
      serviceItems: formData.serviceItems.map((item) =>
        item.id === editingItem.id
          ? {
              ...newItem,
              total: currency === "INR" ? total : total,
            }
          : item
      ),
    });

    // Reset states
    setNewItem({
      code: "",
      type: "hotel",
      description: "",
      checkin_time: "",
      checkout_time: "",
      qty: 1,
      price: 0,
      discount: 0,
      total: 0,
    });
    setEditingItem(null);
    setIsEditing(false);
    setShowItemModal(false);
  };

  // Cancel edit
  const cancelEdit = () => {
    setNewItem({
      code: "",
      type: "hotel",
      description: "",
      checkin_time: "",
      checkout_time: "",
      qty: 1,
      price: 0,
      discount: 0,
      total: 0,
    });
    setEditingItem(null);
    setIsEditing(false);
    setShowItemModal(false);
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

  const isFormEmpty =
    !newCustomer.customer &&
    !newCustomer.customer_email &&
    !newCustomer.customer_number &&
    !newCustomer.gst_no &&
    !newCustomer.payment_method;

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
          gst_no: "",
          customer: "",
          customer_email: "",
          customer_number: "",
          payment_method: "",
        },
        invoice: {
          country: "IN",
          number: "",
          issueDate: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          salesId: "",
          printedBy: "",
          yourRef: "",
          bookingId: "",
          paymentMethod: "",
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
        taxRates: [],
        accountDetails: {
          name: "",
          number: "",
          bank: "",
          branch: "",
          ifsc: "",
          address: "",
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
        attachments: [],
      });
    }
  };
  // Auto-calculate total when item details change
  useEffect(() => {
    if (showItemModal) {
      const total = newItem.qty * newItem.price * (1 - newItem.discount / 100);
      setNewItem((prev) => ({ ...prev, total }));
    }
  }, [newItem.qty, newItem.price, newItem.discount, showItemModal]);

  useEffect(() => {
    if (formData.currencyDetails.currency === "INR") {
      calculateTotals();
    }
  }, [xeRate, increaseAmount]);

  useEffect(() => {
    const fetchRates = async () => {
      setIsLoadingRates(true);
      try {
        const rates = await fetchExchangeRates(fromCurrency);
        setExchangeRates(rates);

        // Calculate and set the conversion rate
        if (rates[toCurrency]) {
          const baseRate = rates[toCurrency];
          const finalRate = baseRate + increaseAmount;
          setXeRate(parseFloat(finalRate.toFixed(4)));
        }
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchRates();
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    if (exchangeRates[toCurrency]) {
      const baseRate = exchangeRates[toCurrency];
      const finalRate = baseRate + increaseAmount;
      setXeRate(parseFloat(finalRate.toFixed(4)));
    }
  }, [increaseAmount, exchangeRates, toCurrency]);

  const handleClick = () => {
    console.log("Form Data Submitted:", formData);
    setIsLoading(true);

    axios
      .put(`/api/customers/${formData.customer.id}`, formData.customer, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        console.log("Customer updated:", response.data);
        fetchCustomers();
      })
      .catch((error) => {
        console.error("Error updating customer:", error);
      })
      .finally(() => {
        setIsLoading(false); // stop spinner no matter success or error
      });
  };

  useEffect(() => {
  if (fromCurrency === toCurrency) {
    setIsXeRateZero(true);
  } else {
    setIsXeRateZero(false);
  }
}, [xeRate, fromCurrency, toCurrency]);


  return (
    <div className="container py-4">
      {/* Header */}
      <div className="header text-center bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white py-5 mb-4 rounded shadow-lg">
        <div
          className="fs-1 fw-bold tracking-wide"
          style={{ letterSpacing: "2px", color: "black" }}
        >
          Create Invoice –{" "}
          <span className="text-warning">{renderCompanyName()}</span>
        </div>
      </div>

      {/* Exchange Rate Configuration */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="section-title fw-semibold mb-3 pb-2 border-bottom">
            Exchange Rate Configuration
          </h5>

          <Row className="mb-3">
            <Col md={3}>
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

            <Col md={3}>
              <Form.Group>
                <Form.Label>From Currency</Form.Label>
                <Form.Select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  disabled={isLoadingRates}
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>To Currency</Form.Label>
                <Form.Select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  disabled={isLoadingRates}
                >
                  {currencyOptions.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>Current Rate</Form.Label>
                <Form.Control
                  type="text"
                  readOnly
                  value={
                    isLoadingRates
                      ? "Loading..."
                      : `1 ${fromCurrency} = ${xeRate} ${toCurrency}`
                  }
                  className="fw-bold text-center bg-light"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Base Exchange Rate</Form.Label>
                <Form.Control
                  type="number"
                  step="0.0001"
                  readOnly
                  value={
                    exchangeRates[toCurrency]
                      ? exchangeRates[toCurrency].toFixed(4)
                      : "0.0000"
                  }
                  className="bg-light"
                />
                <Form.Text className="text-muted">
                  1 {fromCurrency} ={" "}
                  {exchangeRates[toCurrency]
                    ? exchangeRates[toCurrency].toFixed(4)
                    : "0.0000"}{" "}
                  {toCurrency}
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Increase Amount</Form.Label>
                <Form.Control
                  type="number"
                  step="1"
                  value={increaseAmount}
                  onChange={(e) =>
                    setIncreaseAmount(parseFloat(e.target.value) || 0)
                  }
                />
                <Form.Text className="text-muted">
                  Amount to add to base rate
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Final XE Rate</Form.Label>
                <Form.Control
                  type="number"
                  step="0.0001"
                  value={fromCurrency === toCurrency ? 0 : xeRate}
                  onChange={(e) => setXeRate(parseFloat(e.target.value) || 0)}
                />
                <Form.Text className="text-muted">
                  Base Rate + Increase Amount
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={async () => {
              setIsLoadingRates(true);
              try {
                const rates = await fetchExchangeRates(fromCurrency);
                setExchangeRates(rates);
                if (rates[toCurrency]) {
                  const baseRate = rates[toCurrency];
                  const finalRate = baseRate + increaseAmount;
                  setXeRate(parseFloat(finalRate.toFixed(4)));
                }
              } catch (error) {
                console.error("Error refreshing rates:", error);
              } finally {
                setIsLoadingRates(false);
              }
            }}
            disabled={isLoadingRates}
          >
            <FaSyncAlt className="me-1" /> Refresh Rates
          </Button>
        </Card.Body>
      </Card>

      {/* Customer and Invoice Information */}
      <Row className="mb-4">
        {(companyNo === 2 || companyNo === 1 || companyNo === 3) && (
          <Col md={6}>
            <Card className="h-100">
              <Card.Body>
                <h5 className="section-title fw-semibold mb-3">
                  Agent Details
                </h5>

                <Form.Group className="mb-3">
                  <Form.Label>Search Agent:</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      placeholder="Search by name, code or phone"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    <Button variant="primary">
                      <FaSearch />
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => setShowCustomerModal(true)}
                    >
                      <FaPlus />
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
                  <Form.Label>Agent Name:</Form.Label>
                  <Form.Control
                    type="text"
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
                    rows={2}
                    value={formData.customer.address}
                    onChange={(e) =>
                      handleInputChange("customer", "address", e.target.value)
                    }
                  />
                </Form.Group>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Mobile:</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.customer.mobile}
                        onChange={(e) =>
                          handleInputChange(
                            "customer",
                            "mobile",
                            e.target.value
                          )
                        }
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>GST:</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.customer.gst_no}
                        onChange={(e) =>
                          handleInputChange(
                            "customer",
                            "gst_no",
                            e.target.value
                          )
                        }
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* <Form.Group className="mb-3">
                  <Form.Label>Mobile:</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.customer.mobile}
                    onChange={(e) =>
                      handleInputChange("customer", "mobile", e.target.value)
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>GST:</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.customer.gst_no}
                    onChange={(e) =>
                      handleInputChange("customer", "mobile", e.target.value)
                    }
                  />
                </Form.Group> */}

                <Row className="align-items-end mb-3">
                  <Col md={9}>
                    <Form.Group>
                      <Form.Label>Customer Name:</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.customer.customer}
                        onChange={(e) =>
                          handleInputChange(
                            "customer",
                            "customer",
                            e.target.value
                          )
                        }
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    {/* <Button
                      variant="primary"
                      className="w-100"
                      onClick={handleClick}
                    >
                      Submit
                    </Button> */}
                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={handleClick}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Updating...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        )}
        {companyNo === 4 && (
          <Col md={6}>
            <Card className="h-100">
              <Card.Body>
                <h5 className="section-title fw-semibold mb-3">
                  Customer Details
                </h5>

                <Row className="align-items-end mb-3">
                  <Col md={9}>
                    <Form.Group>
                      <Form.Label>Customer Name:</Form.Label>
                      <Form.Control
                        type="text"
                        value={newCustomer.customer}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            customer: e.target.value,
                          })
                        }
                      />
                      <Form.Label>Customer Email:</Form.Label>
                      <Form.Control
                        type="text"
                        value={newCustomer.customer_email}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            customer_email: e.target.value,
                          })
                        }
                      />
                      <Form.Label>Customer Mobile:</Form.Label>
                      <Form.Control
                        type="text"
                        value={newCustomer.customer_number}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            customer_number: e.target.value,
                          })
                        }
                      />
                      {/* <Form.Label>Customer GST:</Form.Label>
                      <Form.Control
                        type="text"
                        value={newCustomer.gst_no}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            gst_no: e.target.value,
                          })
                        }
                      /> */}
                      <Form.Label>Payment Method:</Form.Label>
                      <Form.Select
                        value={newCustomer.payment_method}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            payment_method: e.target.value,
                          })
                        }
                      >
                        <option value="">-- Select Payment Method --</option>
                        <option value="Aahaas Pay">Aahaas Pay</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={createNewCustomerAahaas}
                      disabled={isLoading || isFormEmpty} // disable if empty
                    >
                      {isLoading ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Submitting...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </Col>
                </Row>

                {/* <Row className="align-items-end mb-3">
                  <Col md={9}>
                    <Form.Group>
                      <Form.Label>Customer Name:</Form.Label>
                      <Form.Control
                        type="text"
                        value={newCustomer.customer}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            customer: e.target.value,
                          })
                        }
                      />
                      <Form.Label>Customer Email:</Form.Label>
                      <Form.Control
                        type="text"
                        value={newCustomer.customer_email}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            customer_email: e.target.value,
                          })
                        }
                      />
                      <Form.Label>Customer Mobile:</Form.Label>
                      <Form.Control
                        type="text"
                        value={newCustomer.customer_number}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            customer_number: e.target.value,
                          })
                        }
                      />
                      <Form.Label>Customer GST:</Form.Label>
                      
                      <Form.Control
                        type="text"
                        value={newCustomer.gst_no}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            gst_no: e.target.value,
                          })
                        }
                      />
                      <Form.Label>Payment Method:</Form.Label>
                      <Form.Select
                        value={newCustomer.payment_method}
                        onChange={(e) =>
                          setNewCustomer({
                            ...newCustomer,
                            payment_method: e.target.value,
                          })
                        }
                      >
                        <option value="">-- Select Payment Method --</option>
                        <option value="Aahaas Pay">Aahaas Pay</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    
                    <Button
                      variant="primary"
                      className="w-100"
                      onClick={createNewCustomerAahaas}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Submitting...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  </Col>
                </Row> */}
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <h5 className="section-title fw-semibold mb-3">
                Invoice Details
              </h5>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Country:</Form.Label>
                    <Form.Select
                      value={formData.invoice.country}
                      onChange={(e) =>
                        handleInputChange("invoice", "country", e.target.value)
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
                    <Form.Label>Tour No.:</Form.Label>
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
                          handleInputChange("invoice", "number", e.target.value)
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
                    <Form.Label>Your Ref.:</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.invoice.yourRef}
                      onChange={(e) =>
                        handleInputChange("invoice", "yourRef", e.target.value)
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
                        handleInputChange("invoice", "salesId", e.target.value)
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

                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Booking ID:</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.invoice.bookingId}
                      onChange={(e) =>
                        handleInputChange(
                          "invoice",
                          "bookingId",
                          e.target.value
                        )
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Agent Type:</Form.Label>
                  <Form.Select
                    value={formData.payment.type}
                    onChange={(e) =>
                      handleInputChange("payment", "type", e.target.value)
                    }
                  >
                    <option value="">-- Select Agent Type --</option>
                    <option value="credit">Credit</option>
                    <option value="non-credit">Non-Credit</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Travel Period */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="section-title fw-semibold mb-3">Travel Period</h5>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Start Date:</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.invoice.startDate}
                  onChange={(e) =>
                    handleInputChange("invoice", "startDate", e.target.value)
                  }
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>End Date:</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.invoice.endDate}
                  min={formData.invoice.startDate || ""}
                  onChange={(e) =>
                    handleInputChange("invoice", "endDate", e.target.value)
                  }
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Travel Days:</Form.Label>
                <Form.Control
                  type="text"
                  readOnly
                  value={
                    formData.invoice.startDate && formData.invoice.endDate
                      ? `${calculateTravelDays(
                          formData.invoice.startDate,
                          formData.invoice.endDate
                        )} day(s)`
                      : "0 day(s)"
                  }
                  className="bg-light"
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Service Items */}
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
              <thead className="table-light">
                <tr>
                  <th>Code</th>
                  {/* <th>Type</th> */}
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
                    {/* <td>{item.type}</td> */}
                    <td>{item.description}</td>
                    <td>{item.checkin_time || "-"}</td>
                    <td>{item.checkout_time || "-"}</td>
                    <td>{item.qty}</td>
                    <td>{item.price}</td>
                    <td>{item.discount}%</td>
                    <td>
                      {(
                        item.qty *
                        item.price *
                        (1 - item.discount / 100)
                      ).toFixed(2)}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                          title="Edit Item"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteItem(item.id, "service")}
                          title="Delete Item"
                        >
                          <FaTrash />
                        </Button>
                      </div>
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
              <thead className="table-light">
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  {/* <th>Taxable</th> */}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.additionalCharges.map((charge) => (
                  <tr key={charge.id}>
                    <td>{charge.description}</td>
                    <td>{charge.amount.toFixed(2)}</td>
                    {/* <td>
                      <Form.Check
                        type="switch"
                        checked={charge.taxable}
                        readOnly
                      />
                    </td> */}
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
      <Card className="mb-4 d-none">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="section-title fw-semibold mb-0">Tax Rates</h5>
            <Button variant="primary" onClick={() => setShowTaxModal(true)}>
              <FaPlus /> Add Tax Rate
            </Button>
          </div>

          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="vat-toggle"
              label="VAT Included"
              checked={vatInclude}
              onChange={(e) => {
                setVatInclude(e.target.checked);
                if (!e.target.checked) {
                  setVatComponent({ taxBased: "" });
                }
              }}
            />
          </Form.Group>

          {vatInclude && (
            <Form.Group className="mb-3">
              <Form.Label>VAT Applied On:</Form.Label>
              <Form.Select
                value={vatComponent.taxBased}
                onChange={(e) => {
                  setVatComponent({
                    ...vatComponent,
                    taxBased: e.target.value,
                  });
                  calculateTotals();
                }}
              >
                <option value="">Select VAT Component</option>
                <option value="subtotal">Subtotal</option>
                <option value="total">Total Amount</option>
                <option value="handling">Handling Fee</option>
              </Form.Select>
              {vatComponent.taxBased && (
                <Form.Text className="text-muted">
                  VAT (18%) will be applied to {vatComponent.taxBased}
                </Form.Text>
              )}
            </Form.Group>
          )}

          <div className="table-responsive">
            <Table bordered>
              <thead className="table-light">
                <tr>
                  <th>Component</th>
                  <th>Rate (%)</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {taxRates.map((tax, index) => (
                  <tr key={index}>
                    <td>{tax.component}</td>
                    <td>{tax.rate}</td>
                    <td>
                      <Badge
                        bg={tax.component === "VAT" ? "success" : "primary"}
                      >
                        {tax.component === "VAT" ? "VAT" : "Standard"}
                      </Badge>
                    </td>
                    <td>
                      <Form.Check
                        type="switch"
                        checked={tax.isActive !== false}
                        onChange={(e) =>
                          toggleTaxRateStatus(tax.id, e.target.checked)
                        }
                      />
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteItem(tax.id, "tax")}
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

      {/* Account Details */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="section-title fw-semibold mb-0">Account Details</h5>
            <Button variant="primary" onClick={() => handleAccount()}>
              <FaPlus /> Add Account
            </Button>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Select Account</Form.Label>
            <Form.Select
              onChange={(e) => handleAccountSelect(e.target.value, currency)}
              value={formData.selectedAccountId || ""}
            >
              <option value="" disabled>
                Select an account
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_name} - {account.account_no}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

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

      {/* Totals and Payment Information */}
      <Row className="mb-4">
        {/* <Col md={8}>
          <Card className="h-100">
            <Card.Body>
              <h5 className="section-title fw-semibold mb-3">
                Payment Information
              </h5>

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
                      rows={2}
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
                        handlePaymentMethodChange("googlePay", e.target.checked)
                      }
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Check
                      type="checkbox"
                      label="USD Portal Link"
                      checked={formData.payment.methods.usdPortal}
                      onChange={(e) =>
                        handlePaymentMethodChange("usdPortal", e.target.checked)
                      }
                    />
                  </Col>
                </Row>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Attachments:</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      attachments: Array.from(e.target.files),
                    }))
                  }
                />

                {Array.isArray(formData.attachments) &&
                formData.attachments.length > 0 ? (
                  <div className="mt-2">
                    <strong>Selected files:</strong>
                    <ul>
                      {formData.attachments.map((file, index) => (
                        <li key={index}>{file?.name || "Unnamed file"}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-muted mt-2">No files selected.</div>
                )}
              </Form.Group>
            </Card.Body>
          </Card>
        </Col> */}

        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <h5 className="section-title fw-semibold mb-3">Invoice Totals</h5>

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
                    <span>GST 18%:</span>
                    <span>
                      {(formData.totals.handlingFee * 0.18).toFixed(2)}
                    </span>
                  </div>
                </>
              )}

              <div className="d-flex justify-content-between mb-2 pb-2 border-bottom bg-light">
                <span>Additional Tax:</span>
                <span>{(formData.totals.additionalTax * 0.18).toFixed(2)}</span>
                {/* <Form.Control
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
                /> */}
              </div>

              <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                <span>Additional Charges:</span>
                <span>
                  {formData.additionalCharges
                    .reduce(
                      (sum, charge) => sum + parseFloat(charge.amount || 0),
                      0
                    )
                    .toFixed(2)}
                </span>
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

      {/* Action Buttons */}
      <div className="d-flex justify-content-center gap-3 mb-4">
        <Button variant="primary" size="lg" onClick={generatePreview}>
          <FaEye className="me-2" /> Preview Invoice
        </Button>
        {/* <Button variant="success" size="lg" onClick={handleSubmit}>
          <FaCog className="me-2" /> Create Invoice
        </Button> */}
        <Button
          variant="success"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Creating...
            </>
          ) : (
            <>
              <FaCog className="me-2" /> Create Invoice
            </>
          )}
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
              {/* <Nav.Link eventKey="purchase">Purchase Details</Nav.Link> */}
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
                    <Form.Select
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          description: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Description</option>

                      {companyNo === 1 || companyNo === 2 ? (
                        <>
                          <option value="Cost per Adult">Cost per Adult</option>
                          <option value="Cost per Child">Cost per Child</option>
                          <option value="Cost per Person">
                            Cost per Person
                          </option>
                        </>
                      ) : (
                        <option value="Cost per Product">
                          Cost per Product
                        </option>
                      )}

                      {/* <option value="custom">Other (Type Manually)</option> */}
                    </Form.Select>

                    {newItem.description === "custom" && (
                      <Form.Control
                        className="mt-2"
                        type="text"
                        placeholder="Enter custom description"
                        value={newItem.description || ""}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            description: e.target.value,
                            customDescription: e.target.value,
                          })
                        }
                      />
                    )}
                    {/* <Form.Control
                      type="text"
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({ ...newItem, description: e.target.value })
                      }
                    /> */}
                  </Form.Group>
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Check-in Date:</Form.Label>
                    <Form.Control
                      type="date"
                      value={newItem.checkin_time}
                      onChange={(e) =>
                        setNewItem({ ...newItem, checkin_time: e.target.value })
                      }
                    />
                  </Form.Group>
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Check-out Date:</Form.Label>
                    <Form.Control
                      type="date"
                      value={newItem.checkout_time}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          checkout_time: e.target.value,
                        })
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
                      step="0.01" // allows decimal numbers
                      inputMode="decimal"
                      value={newItem.price}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    {/* <Form.Control
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={newItem.price}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    /> */}
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
              type="text"
              inputMode="decimal"
              pattern="[0-9]*"
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
            {/* <Form.Check
              type="checkbox"
              label="Taxable"
              checked={newCharge.taxable}
              onChange={(e) =>
                setNewCharge({ ...newCharge, taxable: e.target.checked })
              }
            /> */}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowChargeModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={addNewCharge}
            disabled={!newCharge.description || !newCharge.amount}
          >
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
            <Form.Label>Tax Component:</Form.Label>
            <Form.Select
              value={newTaxRate.component}
              onChange={(e) => {
                setNewTaxRate({ ...newTaxRate, component: e.target.value });
                setComponent(e.target.value);
              }}
            >
              <option value="">Select Component</option>
              <option value="flight">Flight</option>
              <option value="hotel">Hotel</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="essentials">Essentials</option>
              <option value="non-essentials">Non-Essentials</option>
              <option value="education">Education</option>
              {/* <option value="standard">SubTotal</option> */}
            </Form.Select>
          </Form.Group>
          {/* <Form.Group className="mb-3">
            <Form.Label>Display Name:</Form.Label>
            <Form.Control
              type="text"
              value={newTaxRate.name || "-"}
              onChange={(e) =>
                setNewTaxRate({ ...newTaxRate, name: e.target.value })
              }
            />
          </Form.Group> */}
          <Form.Group className="mb-3">
            <Form.Label>Rate (%):</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              value={newTaxRate.rate}
              // onChange={(e) =>
              //   setNewTaxRate({
              //     ...newTaxRate,
              //     rate: parseFloat(e.target.value) || 0,
              //   })
              // }
            />
          </Form.Group>
          {/* <Form.Group className="mb-3">
            <Form.Label>Rate (%):</Form.Label>
            <Form.Control
              // type="number"
              // // step="0.01"
              type="text"
              inputMode="decimal"
              pattern="[0-9]*"
              value={newTaxRate.rate}
              onChange={(e) =>
                setNewTaxRate({
                  ...newTaxRate,
                  rate: parseFloat(e.target.value) || 0,
                })
              }
            />
          </Form.Group> */}
          {newTaxRate.rate > 0 && (
            <div className="alert alert-info">
              {/* <strong>Tax Calculation:</strong> For an item worth 100{" "}
              {formData.currencyDetails.currency}, the tax would be{" "}
              {newTaxRate.rate} {formData.currencyDetails.currency} */}
              <strong>Tax Calculation:</strong> For an item worth{" "}
              {formData.totals.subTotal} {formData.currencyDetails.currency},
              the tax would be{" "}
              {((formData.totals.subTotal * newTaxRate.rate) / 100).toFixed(2)}{" "}
              {formData.currencyDetails.currency} at a rate of {newTaxRate.rate}
              %.
            </div>
          )}
          {/* VAT Type Selection */}
          <Form.Group className="mb-3">
            <Form.Label>VAT Type:</Form.Label>
            <Form.Select
              value={vatInclude.vatType || "nonvat"}
              onChange={(e) => {
                const value = e.target.value;
                // setNewTaxRate({ ...newTaxRate, vatType: value });
                setVatInclude(value !== "nonvat"); // enable if exclusive or inclusive
              }}
            >
              <option value="exclusive">Exclusive (add VAT)</option>
              <option value="nonvat">Non-VAT</option>
            </Form.Select>
          </Form.Group>
          {/* Show Tax Component only if vatInclude is true */}
          {vatInclude && (
            <Form.Group className="mb-3">
              <Form.Label>Tax Component:</Form.Label>
              <Form.Select
                value={vatComponent.taxBased}
                onChange={(e) =>
                  setVatComponent({ ...vatComponent, taxBased: e.target.value })
                }
              >
                <option value="">Select Component</option>
                <option value="subtotal">Subtotal</option>
                <option value="total">Total</option>
                <option value="handling">Handling Fee</option>
              </Form.Select>
            </Form.Group>
          )}
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
      {/* <Modal show={showTaxModal} onHide={() => setShowTaxModal(false)}>
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
      </Modal> */}
      <Modal
        show={showItemModal}
        onHide={() => (isEditing ? cancelEdit() : setShowItemModal(false))}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Edit Item" : "Add New Item"}</Modal.Title>
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
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="sell" active={activeTab === "sell"}>
              <Row>
                {companyNo === 3 && (
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
                )}

                {companyNo === 3 && (
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
                )}

                <Col md={12} className="mb-3">
                  {/* <Form.Group>
                    <Form.Label>Description:</Form.Label>
                    <Form.Select
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          description: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Description</option>
                      {companyNo === 1 || companyNo === 2 ? (
                        <>
                          <option value="Cost per Adult">Cost per Adult</option>
                          <option value="Cost per Child">Cost per Child</option>
                        </>
                      ) : (
                        <option value="Cost per Product">
                          Cost per Product
                        </option>
                      )}
                      <option onClick={() => setDescriptionValue(true)}>Other (Type Manually)</option>
                    </Form.Select>

                    {descriptionValue && (
                      <Form.Control
                        className="mt-2"
                        type="text"
                        placeholder="Enter custom description"
                        value={newItem.customDescription || ""}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            description: e.target.value,
                          })
                        }
                      />
                    )}
                  </Form.Group> */}
                  <Form.Group>
                    <Form.Label>Description:</Form.Label>
                    <Form.Select
                      value={newItem.description}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "custom") {
                          setDescriptionValue(true); // ✅ show input
                        } else {
                          setDescriptionValue(false); // ✅ hide input when normal option selected
                        }
                        setNewItem({
                          ...newItem,
                          description: value,
                        });
                      }}
                    >
                      <option value="">Select Description</option>
                      {companyNo === 1 || companyNo === 2 ? (
                        <>
                          <option value="Cost per Adult">Cost per Adult</option>
                          <option value="Cost per Child">Cost per Child</option>
                          <option value="Cost per Person">
                            Cost per Person
                          </option>
                        </>
                      ) : (
                        <option value="Cost per Product">
                          Cost per Product
                        </option>
                      )}
                      <option value="custom">Other (Type Manually)</option>
                    </Form.Select>

                    {descriptionValue && (
                      <Form.Control
                        className="mt-2"
                        type="text"
                        placeholder="Enter custom description"
                        value={
                          newItem.description !== "custom"
                            ? newItem.description
                            : ""
                        }
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            description: e.target.value, // ✅ keep typed custom value
                          })
                        }
                      />
                    )}
                  </Form.Group>
                </Col>

                {companyNo === 4 && (
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Check-in Date:</Form.Label>
                      <Form.Control
                        type="date"
                        value={newItem.checkin_time}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            checkin_time: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                )}

                {companyNo === 4 && (
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Check-out Date:</Form.Label>
                      <Form.Control
                        type="date"
                        value={newItem.checkout_time}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            checkout_time: e.target.value,
                          })
                        }
                      />
                    </Form.Group>
                  </Col>
                )}

                <Col md={4} className="mb-3">
                  <Form.Group>
                    <Form.Label>
                      {" "}
                      {newItem.type === "hotel" ? "pax" : "Quantity"}{" "}
                    </Form.Label>
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

                {/* <Col md={4} className="mb-3">
  <Form.Group>
    <Form.Label>Price:</Form.Label>
    <Form.Control
      type="number"
      step="0.01"        // allows decimals
      min="0"            // optional: prevents negative prices
      inputMode="decimal"
      value={newItem.price}
      onChange={(e) =>
        setNewItem({
          ...newItem,
          price: e.target.value,  // keep as string for smooth typing
        })
      }
      onBlur={(e) =>
        setNewItem({
          ...newItem,
          price: parseFloat(e.target.value || 0).toFixed(2), // format only when leaving field
        })
      }
    />
  </Form.Group>
</Col> */}

                <Col md={4} className="mb-3">
                  <Form.Group>
                    <Form.Label>Price:</Form.Label>

                    {/* Currency Conversion Row */}
                    {/* <Row className="mb-2">
      <Col md={5}>
        <Form.Control
          type="number"
          step="0.01"
          placeholder="Amount"
          value={originalAmount}
          onChange={(e) => setOriginalAmount(parseFloat(e.target.value) || 0)}
        />
      </Col>
      <Col md={3}>
        <Form.Select
          value={convertFromCurrency}
          onChange={(e) => setConvertFromCurrency(e.target.value)}
          size="sm"
        >
          <option value="USD">USD</option>
          <option value="INR">INR</option>
          <option value="LKR">LKR</option>
          <option value="SGD">SGD</option>
          <option value="MYR">MYR</option>
        </Form.Select>
      </Col>
      <Col md={1} className="text-center pt-1">
        <span>→</span>
      </Col>
      <Col md={3}>
        <Form.Select
          value={convertToCurrency}
          onChange={(e) => setConvertToCurrency(e.target.value)}
          size="sm"
        >
          <option value="USD">USD</option>
          <option value="INR">INR</option>
          <option value="LKR">LKR</option>
          <option value="SGD">SGD</option>
          <option value="MYR">MYR</option>
        </Form.Select>
      </Col>
    </Row> */}
                    <Row className="mb-2">
                      {/* Amount Input */}
                      <Col xs={12} className="mb-2">
                        {/* <Form.Control
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={originalAmount}
                          onChange={(e) =>
                            setOriginalAmount(parseFloat(e.target.value) || 0)
                          }
                        /> */}
                        <Form.Control
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={originalAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || parseFloat(value) <= 0) {
                              setOriginalAmount("");
                            } else {
                              setOriginalAmount(value);
                            }
                          }}
                        />
                      </Col>

                      {/* From Currency */}
                      <Col xs={12} className="mb-2">
                        <Form.Label>From</Form.Label>
                        <Form.Select
                          value={convertFromCurrency}
                          onChange={(e) =>
                            setConvertFromCurrency(e.target.value)
                          }
                          size="sm"
                        >
                          <option value="USD">USD</option>
                          <option value="INR">INR</option>
                          <option value="LKR">LKR</option>
                          <option value="SGD">SGD</option>
                          <option value="MYR">MYR</option>
                        </Form.Select>
                      </Col>

                      {/* Arrow */}
                      <Col xs={12} className="text-center mb-2">
                        <span style={{ fontSize: "18px" }}>↓</span>
                      </Col>

                      {/* To Currency */}
                      <Col xs={12}>
                        <Form.Label>To</Form.Label>
                        <Form.Select
                          value={convertToCurrency}
                          onChange={(e) => setConvertToCurrency(e.target.value)}
                          size="sm"
                        >
                          <option value="USD">USD</option>
                          <option value="INR">INR</option>
                          <option value="LKR">LKR</option>
                          <option value="SGD">SGD</option>
                          <option value="MYR">MYR</option>
                        </Form.Select>
                      </Col>
                    </Row>

                    {/* Convert Button and Result */}
                    <Row className="mb-2">
                      <Col md={6}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={handleCurrencyConversion}
                          className="w-100"
                          disabled={!originalAmount || originalAmount <= 0}
                          style={{ color: "black" }}
                        >
                          {isLoading ? "Converting..." : "Convert"}
                        </Button>
                      </Col>
                      <Col md={6}>
                        <Form.Control
                          type="text"
                          readOnly
                          value={convertedAmount}
                          className="text-center fw-bold bg-light"
                        />
                      </Col>
                    </Row>

                    {/* Final Price Field */}
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
                      placeholder="Enter price or use conversion above"
                    />

                    {/* Apply Converted Price Button */}
                    {convertedAmount > 0 && (
                      <Button
                        variant="success"
                        size="sm"
                        className="mt-2 w-100"
                        onClick={() => {
                          setNewItem({
                            ...newItem,
                            price: convertedAmount,
                          });
                          setOriginalAmount(0);
                          setConvertedAmount(0);
                        }}
                      >
                        Apply Converted Price ({convertToCurrency}{" "}
                        {convertedAmount})
                      </Button>
                    )}
                  </Form.Group>
                </Col>

                {/* <Col md={4} className="mb-3">
                  <Form.Group>
                    <Form.Label>Price:</Form.Label>
                    <Form.Control
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={newItem.price}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </Form.Group>
                </Col> */}

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

                {/* Display calculated total */}
                <Col md={12} className="mb-3">
                  <Form.Group>
                    <Form.Label>Calculated Total:</Form.Label>
                    <Form.Control
                      type="text"
                      readOnly
                      value={`${(
                        newItem.qty *
                        newItem.price *
                        (1 - newItem.discount / 100)
                      ).toFixed(2)} ${formData.currencyDetails.currency}`}
                      className="fw-bold"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Tab.Pane>
          </Tab.Content>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => (isEditing ? cancelEdit() : setShowItemModal(false))}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            // disabled={!isItemFormEmpty}
            onClick={isEditing ? updateItem : addNewItem}
            // disabled={!(originalAmount > 0.00)} // 🔒 disable until 1+ field is filled
          >
            {isEditing ? "Update Item" : "Add to Invoice"}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Customer Modal */}
      {(companyNo === 1 || companyNo === 2) && (
        <Modal
          show={showCustomerModal}
          onHide={() => setShowCustomerModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Agent</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Agent Code:</Form.Label>
              <Form.Control
                type="text"
                value={newCustomer.code}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, code: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Agent Name:</Form.Label>
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
              <Form.Label>GST NO:</Form.Label>
              <Form.Control
                type="text"
                value={newCustomer.gst_no}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, gst_no: e.target.value })
                }
              />
            </Form.Group>

            {/* <Form.Group className="mb-3">
            <Form.Label>GST No:</Form.Label>
            <Form.Control
              type="text"
              value={newCustomer.gst_no}
              onChange={(e) =>
                setNewCustomer({ ...newCustomer, gst_no: e.target.value })
              }
            />
          </Form.Group> */}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCustomerModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={createNewCustomer}>
              Create Agent
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Preview Invoice Modal */}
      {companyNo === 1 && (
        <Invoice_sharmila_modal
          show={showPreviewModal}
          onHide={() => setShowPreviewModal(false)}
          formData={formData}
          countryOptions={countryOptions}
          currencySymbols={currencySymbols}
          printInvoice={printInvoice}
          formatDate={formatDate}
          xeRate={xeRate}
        />
      )}

      {companyNo === 2 && (
        <Invoice_appleholidays_modal
          show={showPreviewModal}
          onHide={() => setShowPreviewModal(false)}
          formData={formData}
          formatDate={formatDate}
          currencySymbols={currencySymbols}
          printInvoice={printInvoice}
          xeRate={xeRate}
        />
      )}

      {companyNo === 3 && (
        <Invoice_aahaas_modal
          show={showPreviewModal}
          onHide={() => setShowPreviewModal(false)}
          formData={formData}
          countryOptions={countryOptions}
          currencySymbols={currencySymbols}
          printInvoice={printInvoice}
          formatDate={formatDate}
          xeRate={xeRate}
        />
      )}
    </div>
  );
};

export default Invoice_create;
