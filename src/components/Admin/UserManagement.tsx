import React, { useState, useEffect } from "react";
import {
    Users,
    Plus,
    Edit2,
    Trash2,
    Shield,
    ShieldCheck,
    Eye,
    Loader2,
    X,
    Save,
    Key,
} from "lucide-react";

interface User {
    id: number;
    username: string;
    full_name?: string;
    email?: string;
    role: "super_admin" | "admin" | "viewer";
    is_active: number;
    created_at: string;
    last_login?: string;
}

interface UserManagementProps {
    currentUserRole: string;
}

export default function UserManagement({ currentUserRole }: UserManagementProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        fullName: "",
        email: "",
        role: "admin" as "super_admin" | "admin" | "viewer",
    });

    // Check permission
    const canManageUsers = currentUserRole === "super_admin";

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await fetch("/api/auth/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (err) {
            console.error("Failed to load users:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setModalMode("create");
        setFormData({
            username: "",
            password: "",
            fullName: "",
            email: "",
            role: "admin",
        });
        setShowModal(true);
        setError("");
        setSuccess("");
    };

    const handleEdit = (user: User) => {
        setModalMode("edit");
        setSelectedUser(user);
        setFormData({
            username: user.username,
            password: "",
            fullName: user.full_name || "",
            email: user.email || "",
            role: user.role,
        });
        setShowModal(true);
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            if (modalMode === "create") {
                const res = await fetch("/api/auth/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                const data = await res.json();
                if (res.ok) {
                    setSuccess("User created successfully!");
                    setShowModal(false);
                    loadUsers();
                } else {
                    setError(data.error || "Failed to create user");
                }
            } else {
                const updateData: any = {
                    userId: selectedUser?.id,
                    full_name: formData.fullName,
                    email: formData.email,
                    role: formData.role,
                };

                if (formData.password) {
                    updateData.newPassword = formData.password;
                }

                const res = await fetch("/api/auth/users", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updateData),
                });

                const data = await res.json();
                if (res.ok) {
                    setSuccess("User updated successfully!");
                    setShowModal(false);
                    loadUsers();
                } else {
                    setError(data.error || "Failed to update user");
                }
            }
        } catch (err) {
            setError("Network error");
        }
    };

    const handleDelete = async (userId: number) => {
        if (!confirm("Are you sure you want to delete this user?")) return;

        try {
            const res = await fetch("/api/auth/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess("User deleted successfully!");
                loadUsers();
            } else {
                setError(data.error || "Failed to delete user");
            }
        } catch (err) {
            setError("Network error");
        }
    };

    const handleToggleActive = async (user: User) => {
        try {
            const res = await fetch("/api/auth/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.id,
                    is_active: user.is_active === 1 ? 0 : 1,
                }),
            });

            if (res.ok) {
                setSuccess(`User ${user.is_active === 1 ? "deactivated" : "activated"}!`);
                loadUsers();
            }
        } catch (err) {
            setError("Network error");
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "super_admin":
                return <ShieldCheck className="h-4 w-4 text-purple-500" />;
            case "admin":
                return <Shield className="h-4 w-4 text-blue-500" />;
            case "viewer":
                return <Eye className="h-4 w-4 text-gray-500" />;
            default:
                return null;
        }
    };

    const getRoleBadge = (role: string) => {
        const colors = {
            super_admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            viewer: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
        };

        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${colors[role as keyof typeof colors]}`}
            >
                {getRoleIcon(role)}
                {role.replace("_", " ").toUpperCase()}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!canManageUsers) {
        return (
            <div className="rounded-lg bg-yellow-50 p-6 text-center dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    You don't have permission to manage users. Only Super Admins can access this feature.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage admin users and their permissions
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" />
                    Add User
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {error}
                </div>
            )}
            {success && (
                <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    {success}
                </div>
            )}

            {/* Users Table */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                                Last Login
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-white">
                                            {user.full_name || user.username}
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            @{user.username}
                                        </div>
                                        {user.email && (
                                            <div className="text-xs text-slate-400 dark:text-slate-500">{user.email}</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${user.is_active === 1
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            }`}
                                    >
                                        {user.is_active === 1 ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                    {user.last_login
                                        ? new Date(user.last_login).toLocaleDateString()
                                        : "Never"}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                            title="Edit user"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(user)}
                                            className="rounded p-1 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                                            title={user.is_active === 1 ? "Deactivate" : "Activate"}
                                        >
                                            <Key className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                            title="Delete user"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-slate-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {modalMode === "create" ? "Create New User" : "Edit User"}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    disabled={modalMode === "edit"}
                                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Password {modalMode === "edit" && "(leave blank to keep current)"}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={modalMode === "create"}
                                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Role
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            role: e.target.value as "super_admin" | "admin" | "viewer",
                                        })
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                >
                                    <option value="viewer">Viewer (Read Only)</option>
                                    <option value="admin">Admin (Edit & Delete)</option>
                                    <option value="super_admin">Super Admin (Full Access)</option>
                                </select>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    <Save className="h-4 w-4" />
                                    {modalMode === "create" ? "Create" : "Update"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
