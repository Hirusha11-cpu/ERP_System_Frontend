import React, { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Table, Card, Spinner, Alert } from "react-bootstrap";
import { FaPlus, FaTrash, FaEye, FaSyncAlt } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const Bank_accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    account_name: "",
    account_no: "",
    bank: "",
    branch: "",
    ifsc_code: "",
    bank_address: "",
    currency: "",
    company_id: ""
  });
  
  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/accounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setAccounts(response.data);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Failed to load bank accounts. Please try again.");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

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
        currency: "",
        company_id: ""
      }
    );
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingAccount(null);
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "company_id" ? parseInt(value, 10) || "" : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editingAccount) {
        // Update
        await axios.put(`/api/accounts/${editingAccount.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Create
        await axios.post("/api/accounts", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      handleCloseModal();
      await fetchAccounts();
    } catch (err) {
      console.error("Error saving account:", err);
      handleCloseModal();
      setError("Failed to save account. Please try again.");
    } finally {
      handleCloseModal();
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        setLoading(true);
        await axios.delete(`/api/accounts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        await fetchAccounts();
      } catch (err) {
        console.error("Error deleting account:", err);
        setError("Failed to delete account. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container py-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Bank Accounts</h5>
          <div className="d-flex align-items-center gap-2">
            <Button 
              variant="outline-primary" 
              onClick={() => handleShowModal()}
              disabled={loading}
               style={{ color: "black", borderColor: "black" }}
            >
              <FaPlus className="me-2" />
              Add Account
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={fetchAccounts}
              disabled={loading}
              style={{ color: "black", borderColor: "black" }}
            >
              <FaSyncAlt />
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading bank accounts...</p>
            </div>
          ) : (
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
                  <th>Company</th>
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
                        {acc.company_id === 1 && "Shirmila Travels"}
                        {acc.company_id === 2 && "Apple Holidays"}
                        {acc.company_id === 3 && "Aahaas"}
                      </td>
                      <td className="">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowModal(acc)}
                          className="me-2"
                          disabled={loading}
                          style={{ color: "black"}}
                        >
                          <FaEye />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(acc.id)}
                          disabled={loading}
                          className="mb-2"
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center">
                      No accounts found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
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
                      .split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name={field}
                    value={formData[field] || ""}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Form.Group>
              ))}
              {/* Company Select Dropdown */}
              <Form.Group className="mb-3">
                <Form.Label>Company</Form.Label>
                <Form.Select
                  name="company_id"
                  value={formData.company_id || ""}
                  onChange={handleChange}
                  disabled={loading}
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
            <Button variant="secondary" onClick={handleCloseModal} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  {editingAccount ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingAccount ? "Update" : "Create"
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Card>
    </div>
  );
};

export default Bank_accounts;