import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Card,
  Spinner,
  Alert,
  Badge,
  Tab,
  Nav,
  Row,
  Col,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSyncAlt,
  FaUserCog,
  FaUsers,
} from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import { useUser } from "../../../../contentApi/UserProvider";

const Role_management = () => {
  const { user, company, role } = useUser();

  const { selectedCompany } = useContext(CompanyContext);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [currentRole, setCurrentRole] = useState({ name: "" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // Fetch all roles and users
  useEffect(() => {
    console.log(user, company, role);
    
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes] = await Promise.all([
        axios.get("/api/roles", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/roles/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setRoles(rolesRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentRole.id) {
        // Update existing role
        await axios.put(`/api/roles/${currentRole.id}`, currentRole, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create new role
        await axios.post("/api/roles", currentRole, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowRoleModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save role");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    setLoading(true);
    try {
      await axios.delete(`/api/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete role");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleUpdate = async () => {
    if (!selectedUser || !selectedRoleId) return;

    setLoading(true);
    try {
      await axios.put(
        `/api/roles/users/${selectedUser.id}/role`,
        { role_id: selectedRoleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowUserRoleModal(false);
      fetchData();
    } catch (err) {
      setError("Failed to update user role");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditRoleModal = (role = { name: "" }) => {
    setCurrentRole(role);
    setShowRoleModal(true);
  };

  const openUserRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRoleId(user.role_id);
    setShowUserRoleModal(true);
  };

  return (
    <div className="role-management">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center gap-2">
            <h5>Role Management ({selectedCompany})</h5>
            <div>
              <Button
                variant="primary"
                onClick={fetchData}
                className="me-2 mb-2"
              >
                <FaSyncAlt /> Refresh
              </Button>
              <Button variant="success" onClick={() => openEditRoleModal()}>
                <FaPlus /> Add Role
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {/* <div className="">
            <h2>User Information</h2>
            <div>
              <strong>Name:</strong> {user?.name}
            </div>
            <div>
              <strong>Email:</strong> {user?.email}
            </div>
            <div>
              <strong>Company:</strong> {company?.name || "N/A"}
            </div>
            <div>
              <strong>Role:</strong> {role?.name || "N/A"}
            </div>
            <div>
              <strong>Account Created:</strong>{" "}
              {new Date(user?.created_at).toLocaleDateString()}
            </div>
          </div> */}

          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Row>
              <Col md={12}>
                <Nav variant="tabs">
                  <Nav.Item>
                    <Nav.Link eventKey="users">
                      <FaUsers className="me-2" />
                      Users
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="roles">
                      <FaUserCog className="me-2" />
                      Roles
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" />
                    <p>Loading data...</p>
                  </div>
                ) : (
                  <Tab.Content>
                    {/* Users Tab */}
                    <Tab.Pane eventKey="users">
                      <div className="mt-3 table-responsive">
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Company</th>
                              <th>Current Role</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.length > 0 ? (
                              users.map((user) => (
                                <tr key={user.id}>
                                  <td>{user.name}</td>
                                  <td>{user.email}</td>
                                  <td>{user.company?.name || "N/A"}</td>
                                  <td>
                                    <Badge bg="info">{user.role?.name}</Badge>
                                  </td>
                                  <td>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => openUserRoleModal(user)}
                                    >
                                      <FaEdit /> Change Role
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center">
                                  No users found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Tab.Pane>

                    {/* Roles Tab */}
                    <Tab.Pane eventKey="roles">
                      <div className="mt-3 table-responsive">
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Name</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roles.length > 0 ? (
                              roles.map((role) => (
                                <tr key={role.id}>
                                  <td>{role.id}</td>
                                  <td>{role.name}</td>
                                  <td className="d-flex flex-row gap-2">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="me-2 "
                                      onClick={() => openEditRoleModal(role)}
                                    >
                                      <FaEdit /> Edit
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleDeleteRole(role.id)}
                                    >
                                      <FaTrash /> Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="3" className="text-center">
                                  No roles found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                )}
              </Col>
            </Row>
          </Tab.Container>
        </Card.Body>
      </Card>

      {/* Role Create/Edit Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentRole.id ? "Edit Role" : "Create New Role"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRoleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Role Name</Form.Label>
              <Form.Control
                type="text"
                value={currentRole.name}
                onChange={(e) =>
                  setCurrentRole({ ...currentRole, name: e.target.value })
                }
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* User Role Update Modal */}
      <Modal
        show={showUserRoleModal}
        onHide={() => setShowUserRoleModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Change Role for {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Form.Group>
              <Form.Label>Select Role</Form.Label>
              <Form.Select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowUserRoleModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUserRoleUpdate}
            disabled={!selectedRoleId || loading}
          >
            {loading ? <Spinner size="sm" /> : "Update Role"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Role_management;
