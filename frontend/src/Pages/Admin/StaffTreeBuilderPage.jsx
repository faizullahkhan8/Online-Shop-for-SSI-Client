import { useState, useEffect } from "react";
import { useGetStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from "../../api/hooks/staff.api";
import LoadingSpinner from "../../Components/LoadingSpinner";
import { Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { getImageUrl } from "../../utils/imageHelper";
import LexicalEditor from "../../Components/LexicalEditor";

const StaffTreeBuilderPage = () => {
    const { getStaff, loading: getLoading } = useGetStaff();
    const { createStaff, loading: createLoading } = useCreateStaff();
    const { updateStaff, loading: updateLoading } = useUpdateStaff();
    const { deleteStaff, loading: deleteLoading } = useDeleteStaff();

    const [staffList, setStaffList] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNode, setEditingNode] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        role: "",
        description: "",
        image: null,
        imageUrl: "",
        parentId: "",
    });

    const fetchStaff = async () => {
        const data = await getStaff();
        setStaffList(data);
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleOpenModal = (node = null) => {
        if (node) {
            setEditingNode(node);
            setFormData({
                name: node.name,
                role: node.role,
                description: node.description || "",
                image: null,
                imageUrl: node.image || "",
                parentId: node.parentId || "",
            });
        } else {
            setEditingNode(null);
            setFormData({ name: "", role: "", description: "", image: null, imageUrl: "", parentId: "" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingNode(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formDataPayload = new FormData();
        
        const payloadData = {
            name: formData.name,
            role: formData.role,
            description: formData.description,
            parentId: formData.parentId || null,
        };

        if (formData.image instanceof File) {
            formDataPayload.append("image", formData.image);
        } else {
            payloadData.image = formData.imageUrl;
        }

        formDataPayload.append("data", JSON.stringify(payloadData));

        if (editingNode) {
            await updateStaff(editingNode._id, formDataPayload);
        } else {
            await createStaff(formDataPayload);
        }
        fetchStaff();
        handleCloseModal();
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this staff member? Any children will be moved to the top level.")) {
            await deleteStaff(id);
            fetchStaff();
        }
    };

    // Build tree
    const buildTree = (nodes, parentId = null) => {
        return nodes
            .filter((node) => node.parentId === parentId)
            .map((node) => ({
                ...node,
                children: buildTree(nodes, node._id),
            }));
    };

    const treeData = buildTree(staffList);

    const renderTree = (nodes, depth = 0) => {
        return nodes.map((node) => (
            <div key={node._id} className="mb-2">
                <div 
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
                    style={{ marginLeft: `${depth * 24}px` }}
                >
                    <div className="flex items-center gap-4">
                        <img 
                            src={getImageUrl(node.image) || "https://placehold.co/100x100?text=User"} 
                            alt={node.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                        <div>
                            <p className="font-bold text-gray-900 leading-tight">{node.name}</p>
                            <p className="text-xs text-gray-500">{node.role}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(node)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(node._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                {node.children && node.children.length > 0 && (
                    <div className="mt-2 relative">
                        {/* Connecting line */}
                        <div className="absolute left-[20px] top-[-8px] bottom-0 w-px bg-gray-300 z-0" style={{ marginLeft: `${depth * 24}px` }} />
                        <div className="relative z-10">
                            {renderTree(node.children, depth + 1)}
                        </div>
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Staff Tree Builder</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your organization's hierarchy</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm shadow-primary/20 transition-colors"
                >
                    <Plus size={16} /> Add Staff Node
                </button>
            </div>

            {getLoading ? (
                <LoadingSpinner />
            ) : (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 min-h-[400px]">
                    {treeData.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            No staff nodes found. Click "Add Staff Node" to create the root.
                        </div>
                    ) : (
                        renderTree(treeData)
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                            <h3 className="font-bold text-gray-900">
                                {editingNode ? "Edit Staff Node" : "Add Staff Node"}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Role / Title</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="CEO"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                <div className="border border-gray-300 rounded-lg overflow-hidden">
                                    <LexicalEditor
                                        initialHtml={formData.description}
                                        onChange={(data) => setFormData({ ...formData, description: data.html })}
                                        placeholder="Enter description..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Image (Upload or URL)</label>
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-pale file:text-primary hover:file:bg-primary-light transition-colors cursor-pointer"
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400 font-medium">OR provide an existing URL:</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value, image: null })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                                        placeholder="https://..."
                                        disabled={!!formData.image}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Leave both empty to use a placeholder image.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Reports To (Parent)</label>
                                <select
                                    value={formData.parentId}
                                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                    <option value="">None (Top Level)</option>
                                    {staffList.filter(s => s._id !== editingNode?._id).map((staff) => (
                                        <option key={staff._id} value={staff._id}>{staff.name} - {staff.role}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading || updateLoading}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save size={16} /> Save Node
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffTreeBuilderPage;
