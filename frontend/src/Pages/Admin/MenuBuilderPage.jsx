import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { 
    useGetMenus, 
    useCreateMenu, 
    useUpdateMenu, 
    useDeleteMenu 
} from "../../api/hooks/menu.api.js";
import { 
    Plus, 
    Edit, 
    Trash2, 
    ListTree, 
    Link as LinkIcon, 
    FileText, 
    FolderTree,
    ChevronDown,
    ChevronRight,
    Save,
    X,
    Loader
} from "lucide-react";
import { useGetAllCategories } from "../../api/hooks/category.api";

const MenuBuilderPage = () => {
    const { getMenus, loading: fetchLoading } = useGetMenus();
    const { createMenu, loading: createLoading } = useCreateMenu();
    const { updateMenu, loading: updateLoading } = useUpdateMenu();
    const { deleteMenu } = useDeleteMenu();
    const { getAllCategories } = useGetAllCategories();

    const [menus, setMenus] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    const [formData, setFormData] = useState({
        title: "",
        type: "CUSTOM_LINK",
        link: "",
        parentId: "",
        order: 0,
    });

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, []);

    const fetchData = async () => {
        try {
            const data = await getMenus();
            if (data.success) {
                setMenus(data.menus);
            }
        } catch (error) {
            toast.error("Failed to load menus");
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await getAllCategories();
            if (data.success) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleOpenForm = (item = null, parentId = "") => {
        if (item) {
            setEditingItem(item);
            setFormData({
                title: item.title,
                type: item.type,
                link: item.link,
                parentId: item.parentId || "",
                order: item.order,
            });
        } else {
            setEditingItem(null);
            setFormData({
                title: "",
                type: "CUSTOM_LINK",
                link: "",
                parentId: parentId,
                order: 0,
            });
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateMenu(editingItem._id, formData);
                toast.success("Menu item updated");
            } else {
                await createMenu(formData);
                toast.success("Menu item created");
            }
            setIsFormOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will also delete all sub-menus.")) return;
        try {
            await deleteMenu(id);
            toast.success("Menu deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete menu");
        }
    };

    const toggleExpand = (id) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const getIconForType = (type) => {
        switch (type) {
            case "CATEGORY": return <FolderTree size={16} className="text-blue-500" />;
            case "CUSTOM_LINK": return <LinkIcon size={16} className="text-purple-500" />;
            case "PAGE": return <FileText size={16} className="text-green-500" />;
            default: return <LinkIcon size={16} />;
        }
    };

    // Helper to generate a flat list of potential parents
    const getParentOptions = (nodes, prefix = "", excludeId = null) => {
        let options = [];
        nodes.forEach(node => {
            if (node._id === excludeId) return; // Prevent setting self or children as parent
            options.push({ _id: node._id, label: prefix + node.title });
            if (node.children?.length > 0) {
                options = [...options, ...getParentOptions(node.children, prefix + "— ", excludeId)];
            }
        });
        return options;
    };
    
    const parentOptions = getParentOptions(menus, "", editingItem?._id);

    const renderTree = (nodes, depth = 0) => {
        if (!nodes || nodes.length === 0) return null;

        return (
            <div className="flex flex-col gap-2">
                {nodes.map(node => {
                    const hasChildren = node.children && node.children.length > 0;
                    const isExpanded = expandedNodes.has(node._id);

                    return (
                        <div key={node._id} className="flex flex-col gap-2">
                            <div 
                                className={`flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-gray-200 transition-colors ml-${depth * 6}`}
                                style={{ marginLeft: `${depth * 24}px` }}
                            >
                                <div className="flex items-center gap-3">
                                    {hasChildren ? (
                                        <button onClick={() => toggleExpand(node._id)} className="text-gray-400 hover:text-gray-600">
                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        </button>
                                    ) : (
                                        <span className="w-[18px]"></span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {getIconForType(node.type)}
                                        <span className="font-semibold text-gray-800">{node.title}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                        {node.link}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                        Order: {node.order}
                                    </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleOpenForm(null, node._id)}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                                    >
                                        Add Child
                                    </button>
                                    <button 
                                        onClick={() => handleOpenForm(node)}
                                        className="text-gray-500 hover:text-gray-700 bg-gray-50 p-1.5 rounded"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(node._id)}
                                        className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            {hasChildren && isExpanded && (
                                renderTree(node.children, depth + 1)
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ListTree className="text-[#74AA34]" /> Menu Builder
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Design and arrange your header navigation</p>
                </div>
                <button 
                    onClick={() => handleOpenForm(null)}
                    className="bg-[#74AA34] hover:bg-[#629329] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} /> Add Menu Item
                </button>
            </div>

            {fetchLoading ? (
                <div className="flex justify-center py-20">
                    <Loader size={32} className="animate-spin text-[#74AA34]" />
                </div>
            ) : menus.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center">
                    <ListTree size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Menu Items</h3>
                    <p className="text-gray-500 text-sm mb-4">Start building your navigation menu by adding your first item.</p>
                    <button 
                        onClick={() => handleOpenForm(null)}
                        className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                        Add Item
                    </button>
                </div>
            ) : (
                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                    {renderTree(menus)}
                </div>
            )}

            {/* Premium Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
                            <div>
                                <h3 className="font-bold text-gray-900 text-xl">
                                    {editingItem ? "Edit Menu Item" : "Create New Menu Item"}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Configure how this link will appear in your website navigation.</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto">
                            
                            {/* Section 1: Basic Info */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-800">Display Title</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="e.g., Winter Collection"
                                    className="border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#74AA34] focus:ring-2 focus:ring-[#74AA34]/20 transition-all bg-gray-50/50 focus:bg-white"
                                />
                                <span className="text-[11px] text-gray-500">This is the exact text the user will see in the header.</span>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 2: Link Type Cards */}
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold text-gray-800">What should this link to?</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Type: Category */}
                                    <div 
                                        onClick={() => setFormData({...formData, type: "CATEGORY", link: ""})}
                                        className={`cursor-pointer rounded-xl border p-4 flex flex-col gap-2 transition-all ${
                                            formData.type === "CATEGORY" 
                                            ? "border-[#74AA34] bg-[#F4F8EE] ring-1 ring-[#74AA34]" 
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <FolderTree size={20} className={formData.type === "CATEGORY" ? "text-[#74AA34]" : "text-gray-400"} />
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">Product Category</div>
                                            <div className="text-xs text-gray-500 mt-0.5 leading-tight">Link directly to an existing product category.</div>
                                        </div>
                                    </div>
                                    
                                    {/* Type: Custom */}
                                    <div 
                                        onClick={() => setFormData({...formData, type: "CUSTOM_LINK", link: ""})}
                                        className={`cursor-pointer rounded-xl border p-4 flex flex-col gap-2 transition-all ${
                                            formData.type === "CUSTOM_LINK" 
                                            ? "border-[#74AA34] bg-[#F4F8EE] ring-1 ring-[#74AA34]" 
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <LinkIcon size={20} className={formData.type === "CUSTOM_LINK" ? "text-[#74AA34]" : "text-gray-400"} />
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">Custom URL</div>
                                            <div className="text-xs text-gray-500 mt-0.5 leading-tight">Link to specific filters, tags, or external sites.</div>
                                        </div>
                                    </div>

                                    {/* Type: Page */}
                                    <div 
                                        onClick={() => setFormData({...formData, type: "PAGE", link: ""})}
                                        className={`cursor-pointer rounded-xl border p-4 flex flex-col gap-2 transition-all ${
                                            formData.type === "PAGE" 
                                            ? "border-[#74AA34] bg-[#F4F8EE] ring-1 ring-[#74AA34]" 
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <FileText size={20} className={formData.type === "PAGE" ? "text-[#74AA34]" : "text-gray-400"} />
                                        <div>
                                            <div className="font-semibold text-gray-900 text-sm">Static Page</div>
                                            <div className="text-xs text-gray-500 mt-0.5 leading-tight">Link to informational pages like About or Contact.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Dynamic Link Input */}
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                {formData.type === "CATEGORY" ? (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-800">Select Target Category</label>
                                        <select 
                                            value={formData.link}
                                            onChange={e => setFormData({...formData, link: e.target.value})}
                                            className="border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#74AA34] bg-white shadow-sm"
                                            required
                                        >
                                            <option value="">-- Click to choose a category --</option>
                                            {categories.map(cat => (
                                                <option key={cat._id} value={`/products?category=${encodeURIComponent(cat.name)}`}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-800">Target URL Path</label>
                                        <div className="flex items-center">
                                            <span className="bg-gray-100 border border-gray-200 border-r-0 rounded-l-xl p-3 text-sm text-gray-500 shrink-0">
                                                https://yourdomain.com
                                            </span>
                                            <input 
                                                type="text" 
                                                required
                                                value={formData.link}
                                                onChange={e => setFormData({...formData, link: e.target.value})}
                                                placeholder={formData.type === "PAGE" ? "/about-us" : "/products?tags=sale"}
                                                className="border border-gray-200 rounded-r-xl p-3 text-sm outline-none focus:border-[#74AA34] bg-white flex-1 min-w-0"
                                            />
                                        </div>
                                        <span className="text-[11px] text-gray-500 mt-1">Always start with a forward slash (/).</span>
                                    </div>
                                )}
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section 4: Structure & Ordering */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-800">Nest Under (Parent)</label>
                                    <select 
                                        value={formData.parentId}
                                        onChange={e => setFormData({...formData, parentId: e.target.value})}
                                        className="border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#74AA34] bg-white transition-all hover:border-gray-300"
                                    >
                                        <option value="">[ Top Level Menu ]</option>
                                        {parentOptions.map(opt => (
                                            <option key={opt._id} value={opt._id}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <span className="text-[11px] text-gray-500">Leave as Top Level to show directly on the main header.</span>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-800">Display Order</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={formData.order}
                                            onChange={e => setFormData({...formData, order: Number(e.target.value)})}
                                            className="border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#74AA34] w-full pr-12 transition-all hover:border-gray-300"
                                        />
                                    </div>
                                    <span className="text-[11px] text-gray-500">Lower numbers (e.g., 0, 1) appear first from left to right.</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-2 pt-6 border-t border-gray-100">
                                <button 
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={createLoading || updateLoading}
                                    className="bg-[#74AA34] hover:bg-[#629329] shadow-lg shadow-[#74AA34]/20 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-70 hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    {(createLoading || updateLoading) ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                    Save Menu Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuBuilderPage;
