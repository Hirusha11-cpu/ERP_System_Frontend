import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Card } from "react-bootstrap";
import { FaPlus, FaTrash, FaEye, FaSyncAlt } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const Bank_accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    account_name: "",
    account_no: "",
    bank: "",
    branch: "",
    ifsc_code: "",
    bank_address: "",
    currency:""
  });
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // Fetch accounts (Mock or replace with API call)
  const fetchAccounts = () => {
    // Fetch from API
    axios.get("/api/accounts",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }
    ).then((res) => setAccounts(res.data));
    setAccounts([]); // Empty initially for demo
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleShowModal = (account = null) => {
    setEditingAccount(account);
    setFormData(
      account || {
        account_name: "",
        account_no: "",
        bank: "",
        branch: "",
        ifsc_code: "",
        bank_address: "",
        currency: ""
      }
    );
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingAccount(null);
    setShowModal(false);
  };

//   const handleChange = (e) => {
//     setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//   };

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: name === "company_id" ? parseInt(value, 10) : value,
  }));
};


  const handleSubmit = () => {
    if (editingAccount) {
      // Update
      axios
        .put(`/api/accounts/${editingAccount.id}`, formData)
        .then(fetchAccounts);
    } else {
      // Create
      axios.post("/api/accounts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then(fetchAccounts);
    }
    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      axios.delete(`/api/accounts/${id}`,{
        headers: {
          Authorization: `Bearer ${token}`,
        }
      }).then(fetchAccounts);
    }
  };

  return (
    <div className="container py-4">
      <Card className="">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Bank Accounts</h5>
          <div className="d-flex align-items-center gap-2">
            <Button variant="outline-primary" onClick={() => handleShowModal()}>
              <FaPlus className="me-2" />
              Add Account
            </Button>
            <Button variant="outline-secondary" onClick={fetchAccounts}>
              <FaSyncAlt />
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Account Name</th>
                <th>Account No</th>
                <th>Bank</th>
                <th>Branch</th>
                <th>IFSC Code</th>
                <th>Bank Address</th>
                <th>Currency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length > 0 ? (
                accounts.map((acc, index) => (
                  <tr key={acc.id || index}>
                    <td>{index + 1}</td>
                    <td>{acc.account_name}</td>
                    <td>{acc.account_no}</td>
                    <td>{acc.bank}</td>
                    <td>{acc.branch}</td>
                    <td>{acc.ifsc_code}</td>
                    <td>{acc.bank_address}</td>
                    <td>{acc.currency}</td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleShowModal(acc)}
                        className="me-2"
                      >
                        <FaEye />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(acc.id)}
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">
                    No accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>

        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingAccount ? "Edit" : "Add"} Bank Account
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              {[
                "account_name",
                "account_no",
                "bank",
                "branch",
                "ifsc_code",
                "bank_address",
                "currency"
              ].map((field) => (
                <Form.Group key={field} className="mb-3">
                  <Form.Label>
                    {field
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                  />
                </Form.Group>
              ))}
              {/* Company Select Dropdown */}
              <Form.Group className="mb-3">
                <Form.Label>Company</Form.Label>
                <Form.Select
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleChange}
                >
                  <option value="">Select Company</option>
                  <option value="1">Shirmila Travels</option>
                  <option value="2">Apple Holidays</option>
                  <option value="3">Aahaas</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingAccount ? "Update" : "Create"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Card>
    </div>
  );
};

export default Bank_accounts;
