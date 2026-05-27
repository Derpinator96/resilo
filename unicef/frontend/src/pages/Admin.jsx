import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v2/users`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ROLE_COLORS = {
  admin: "bg-purple-100 text-purple-700",
  dataentry: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-600",
};

const INITIAL_FORM = {
  fullName: "",
  email: "",
  username: "",
  password: "",
  role: "dataentry",
};

export default function Admin() {
  const { user } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (user && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await api.post("/admin/users", formData);
      setFormSuccess("User created successfully!");
      setFormData(INITIAL_FORM);
      fetchUsers();
      setTimeout(() => {
        setShowCreateForm(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create user");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
      showToast("Role updated successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update role", "error");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);
    try {
      await api.patch(`/admin/users/${resetTarget._id}/reset-password`, { newPassword });
      setResetSuccess("Password reset successfully!");
      setNewPassword("");
      setTimeout(() => {
        setResetTarget(null);
        setResetSuccess(null);
      }, 1500);
    } catch (err) {
      setResetError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/users/${deleteTarget._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setDeleteTarget(null);
      showToast("User deleted successfully");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete user", "error");
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#011425]">User Management</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage all users, roles and passwords</p>
          </div>
          <button
            onClick={() => { setShowCreateForm(true); setFormError(null); setFormSuccess(null); }}
            className="w-full sm:w-auto bg-[#011425] text-white px-5 py-2.5 rounded-lg hover:bg-[#1f4959] transition font-medium text-sm"
          >
            + Add New User
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:top-6 sm:right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium transition-all text-sm ${toast.type === "error" ? "bg-red-500" : "bg-green-600"}`}>
            {toast.message}
          </div>
        )}

        {/* Users Table — desktop */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading users...</div>
          ) : error ? (
            <div className="text-center py-20 text-red-400">{error}</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#011425] text-white">
                    <tr>
                      <th className="text-left px-6 py-4 font-medium">Name</th>
                      <th className="text-left px-6 py-4 font-medium">Username</th>
                      <th className="text-left px-6 py-4 font-medium">Email</th>
                      <th className="text-left px-6 py-4 font-medium">Role</th>
                      <th className="text-left px-6 py-4 font-medium">Created</th>
                      <th className="text-left px-6 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-medium text-gray-800">{u.fullName}</td>
                        <td className="px-6 py-4 text-gray-600">@{u.username}</td>
                        <td className="px-6 py-4 text-gray-600">{u.email}</td>
                        <td className="px-6 py-4">
                          {u._id === user?._id ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role]}`}>
                              {u.role} (you)
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${ROLE_COLORS[u.role]}`}
                            >
                              <option value="admin">admin</option>
                              <option value="dataentry">dataentry</option>
                              <option value="viewer">viewer</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => { setResetTarget(u); setResetError(null); setResetSuccess(null); }}
                              className="text-blue-600 hover:underline text-xs font-medium"
                            >
                              Reset Password
                            </button>
                            {u._id !== user?._id && u.role !== "admin" && (
                              <button
                                onClick={() => setDeleteTarget(u)}
                                className="text-red-500 hover:underline text-xs font-medium"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {users.map((u) => (
                  <div key={u._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{u.fullName}</p>
                        <p className="text-gray-500 text-xs">@{u.username}</p>
                        <p className="text-gray-500 text-xs mt-0.5 break-all">{u.email}</p>
                      </div>
                      <div className="shrink-0">
                        {u._id === user?._id ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role]}`}>
                            {u.role} (you)
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${ROLE_COLORS[u.role]}`}
                          >
                            <option value="admin">admin</option>
                            <option value="dataentry">dataentry</option>
                            <option value="viewer">viewer</option>
                          </select>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-gray-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => { setResetTarget(u); setResetError(null); setResetSuccess(null); }}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          Reset Password
                        </button>
                        {u._id !== user?._id && u.role !== "admin" && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="text-red-500 hover:underline text-xs font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Create User Modal ────────────────────────────────────────────────── */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#011425] mb-6">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {[
                { label: "Full Name", name: "fullName", type: "text", placeholder: "Enter full name" },
                { label: "Email", name: "email", type: "email", placeholder: "Enter email" },
                { label: "Username", name: "username", type: "text", placeholder: "Enter username" },
                { label: "Password", name: "password", type: "password", placeholder: "Enter password" },
              ].map(({ label, name, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={formData[name]}
                    onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
                    placeholder={placeholder}
                    required
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#011425]/30"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#011425]/30"
                >
                  <option value="dataentry">Data Entry</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              {formSuccess && <p className="text-green-600 text-sm">{formSuccess}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-[#011425] text-white py-2.5 rounded-lg font-medium hover:bg-[#1f4959] transition disabled:opacity-60 text-sm"
                >
                  {formLoading ? "Creating..." : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ─────────────────────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[#011425] mb-1">Reset Password</h2>
            <p className="text-gray-500 text-sm mb-6">for <span className="font-medium text-gray-700">{resetTarget.fullName}</span></p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#011425]/30"
                />
              </div>

              {resetError && <p className="text-red-500 text-sm">{resetError}</p>}
              {resetSuccess && <p className="text-green-600 text-sm">{resetSuccess}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 bg-[#011425] text-white py-2.5 rounded-lg font-medium hover:bg-[#1f4959] transition disabled:opacity-60 text-sm"
                >
                  {resetLoading ? "Resetting..." : "Reset Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center sm:px-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm p-6 sm:p-8 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete User?</h2>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete <span className="font-medium text-gray-700">{deleteTarget.fullName}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-60 text-sm"
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
