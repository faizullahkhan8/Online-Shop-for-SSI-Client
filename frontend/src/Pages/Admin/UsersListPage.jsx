import { useState, useEffect } from "react";
import { useGetAllUsers } from "../../api/hooks/user.api";
import { User } from "lucide-react";

const UserListPage = () => {
    const { getAllUsers, loading } = useGetAllUsers();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        (async () => {
            const res = await getAllUsers();
            if (res?.users) setUsers(res.users);
        })();
    }, []);

    return (
        <div className="space-y-6">
            <header className="flex items-end justify-between pb-4 border-b border-gray-200">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Users
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage user accounts
                    </p>
                </div>
            </header>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                                    Phone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                                    Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 border-b border-gray-200">
                                    Role
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-16 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                                            <p className="text-sm text-gray-500">
                                                Loading users...
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-16 text-center"
                                    >
                                        <p className="text-sm text-gray-500">
                                            No users found
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr
                                        key={u._id}
                                        className="group hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <User size={18} />
                                                </div>
                                                <span className="font-medium text-gray-900">
                                                    {u.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {u.email}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {u.phone || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {u?.address || "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`text-xs font-medium px-2.5 py-1 rounded border ${u.role === "admin"
                                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                                    : "bg-gray-50 text-gray-600 border-gray-200"
                                                    }`}
                                            >
                                                {u.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserListPage;