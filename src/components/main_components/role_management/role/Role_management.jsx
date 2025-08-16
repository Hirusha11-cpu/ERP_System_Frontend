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
  ListGroup,
  FormCheck,
} from "react-bootstrap";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSyncAlt,
  FaUserCog,
  FaUsers,
  FaLock,
  FaBuilding,
} from "react-icons/fa";
import axios from "axios";
import { CompanyContext } from "../../../../contentApi/CompanyProvider";
import { useUser } from "../../../../contentApi/UserProvider";

const RoleManagement = () => {
  const { user: currentUser } = useUser();
  const { selectedCompany } = useContext(CompanyContext);
  
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [currentRole, setCurrentRole] = useState({ name: "" });
  const [currentDepartment, setCurrentDepartment] = useState({ name: "", description: "" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [rolePermissions, setRolePermissions] = useState({
    assigned: [],
    available: []
  });
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes, deptsRes] = await Promise.all([
        axios.get("/api/roles", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/roles1/users", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/departments", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setRoles(rolesRes.data);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId) => {
    try {
      const res = await axios.get(`/api/roles/${roleId}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRolePermissions(res.data);
      setSelectedPermissions(res.data.assigned.map(p => p.id));
    } catch (err) {
      setError("Failed to fetch permissions");
      console.error(err);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentRole.id) {
        await axios.put(`/api/roles/${currentRole.id}`, currentRole, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("/api/roles", currentRole, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowRoleModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentDepartment.id) {
        await axios.put(`/api/departments/${currentDepartment.id}`, currentDepartment, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("/api/departments", currentDepartment, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowDepartmentModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save department");
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
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    setLoading(true);
    try {
      await axios.delete(`/api/departments/${deptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete department");
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
        { role_id: selectedRoleId, department_id: selectedDepartmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowUserRoleModal(false);
      fetchData();
    } catch (err) {
      setError("Failed to update user role");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionUpdate = async () => {
    if (!currentRole.id) return;
    setLoading(true);
    try {
      await axios.put(
        `/api/roles/${currentRole.id}/permissions`,
        { permissions: selectedPermissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowPermissionsModal(false);
      fetchData();
    } catch (err) {
      setError("Failed to update permissions");
    } finally {
      setLoading(false);
    }
  };

  const openEditRoleModal = (role = { name: "" }) => {
    setCurrentRole(role);
    setShowRoleModal(true);
  };

  const openPermissionsModal = async (role) => {
    setCurrentRole(role);
    await fetchRolePermissions(role.id);
    setShowPermissionsModal(true);
  };

  const openEditDepartmentModal = (dept = { name: "", description: "" }) => {
    setCurrentDepartment(dept);
    setShowDepartmentModal(true);
  };

  const openUserRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRoleId(user.role_id);
    setSelectedDepartmentId(user.department_id);
    setShowUserRoleModal(true);
  };

  const togglePermission = (permissionId) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <div className="role-management">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center gap-2">
            <h5>Role & Permission Management ({selectedCompany})</h5>
            <div className="d-flex gap-2">
              <Button variant="primary" onClick={fetchData} className="me-2">
                <FaSyncAlt /> Refresh
              </Button>
              <Button variant="success" onClick={() => openEditRoleModal()}>
                <FaPlus /> Add Role
              </Button>
              <Button variant="info" onClick={() => openEditDepartmentModal()}>
                <FaBuilding /> Add Department
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

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
                  <Nav.Item>
                    <Nav.Link eventKey="departments">
                      <FaBuilding className="me-2" />
                      Departments
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
                              <th>Department</th>
                              <th>Role</th>
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
                                  <td>{user.department?.name || "N/A"}</td>
                                  <td>
                                    <Badge bg="info">{user.role?.name}</Badge>
                                  </td>
                                  <td>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => openUserRoleModal(user)}
                                    >
                                      <FaEdit /> Edit
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="6" className="text-center">
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
                              <th>Permissions</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roles.length > 0 ? (
                              roles.map((role) => (
                                <tr key={role.id}>
                                  <td>{role.id}</td>
                                  <td>{role.name}</td>
                                  <td>
                                    {role.permissions?.length > 0 ? (
                                      <div className="d-flex flex-wrap gap-1">
                                        {role.permissions.map(p => (
                                          <Badge key={p.id} bg="secondary">
                                            {p.display_name}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-muted">No permissions</span>
                                    )}
                                  </td>
                                  <td className="d-flex flex-row gap-2">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => openEditRoleModal(role)}
                                    >
                                      <FaEdit /> Edit
                                    </Button>
                                    <Button
                                      variant="outline-info"
                                      size="sm"
                                      onClick={() => openPermissionsModal(role)}
                                    >
                                      <FaLock /> Permissions
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
                                <td colSpan="4" className="text-center">
                                  No roles found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Tab.Pane>

                    {/* Departments Tab */}
                    <Tab.Pane eventKey="departments">
                      <div className="mt-3 table-responsive">
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Name</th>
                              <th>Description</th>
                              <th>Users</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {departments.length > 0 ? (
                              departments.map((dept) => (
                                <tr key={dept.id}>
                                  <td>{dept.id}</td>
                                  <td>{dept.name}</td>
                                  <td>{dept.description || "N/A"}</td>
                                  <td>{dept.users_count || 0}</td>
                                  <td>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="me-2"
                                      onClick={() => openEditDepartmentModal(dept)}
                                    >
                                      <FaEdit /> Edit
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleDeleteDepartment(dept.id)}
                                    >
                                      <FaTrash /> Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center">
                                  No departments found
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

      {/* Department Create/Edit Modal */}
      <Modal show={showDepartmentModal} onHide={() => setShowDepartmentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentDepartment.id ? "Edit Department" : "Create New Department"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDepartmentSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Department Name</Form.Label>
              <Form.Control
                type="text"
                value={currentDepartment.name}
                onChange={(e) =>
                  setCurrentDepartment({ ...currentDepartment, name: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentDepartment.description}
                onChange={(e) =>
                  setCurrentDepartment({ ...currentDepartment, description: e.target.value })
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDepartmentModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* User Role Update Modal */}
      <Modal show={showUserRoleModal} onHide={() => setShowUserRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update User: {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
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
              <Form.Group className="mb-3">
                <Form.Label>Department</Form.Label>
                <Form.Select
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserRoleModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUserRoleUpdate}
            disabled={!selectedRoleId || loading}
          >
            {loading ? <Spinner size="sm" /> : "Update"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Permissions Management Modal */}
      <Modal show={showPermissionsModal} onHide={() => setShowPermissionsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Manage Permissions for Role: {currentRole.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex">
            <div className="w-100">
              <h5>Available Permissions</h5>
              <ListGroup>
                {rolePermissions.available.map((permission) => (
                  <ListGroup.Item key={permission.id}>
                    <FormCheck
                      type="checkbox"
                      label={`${permission.display_name} (${permission.group})`}
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                    />
                    <small className="text-muted d-block">{permission.description}</small>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
            <div className="w-100">
              <h5>Assigned Permissions</h5>
              <ListGroup>
                {rolePermissions.assigned.map((permission) => (
                  <ListGroup.Item key={permission.id}>
                    <FormCheck
                      type="checkbox"
                      label={`${permission.display_name} (${permission.group})`}
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                    />
                    <small className="text-muted d-block">{permission.description}</small>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPermissionsModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePermissionUpdate}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : "Save Permissions"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RoleManagement;