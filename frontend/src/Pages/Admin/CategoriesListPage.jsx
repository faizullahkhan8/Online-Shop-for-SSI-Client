import { useState, useEffect } from "react";
import {
    useGetAllCategories,
    useDeleteCategory,
    useCreateCategory,
    useUpdateCategory,
} from "../../api/hooks/category.api.js";
import {
    Edit,
    MoreVertical,
    Trash2,
    FolderTree,
    CheckCircle2,
    XCircle,
    RefreshCw,
    ChevronRight,
    ChevronDown,
    Plus,
    X,
    Tag,
    Loader,
    Image as ImageIcon,
    UploadCloud,
} from "lucide-react";
import DeleteDialog from "../../UI/DialogBox.jsx";
import Input from "../../UI/Input.jsx";
import Button from "../../UI/Button.jsx";
import { getImageUrl } from "../../utils/imageHelper.js";

const INITIAL_STATE = {
    name: "",
    parentId: "",
    isActive: true,
    image: null,
    removeImage: false,
};

const CategoriesListPage = () => {
    const [categories, setCategories] = useState([]);
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        categoryId: null,
    });
    const [categoryModal, setCategoryModal] = useState({
        isOpen: false,
        isEditing: false,
        data: INITIAL_STATE,
        imagePreview: null,
    });
    const [expandedNodes, setExpandedNodes] = useState({});

    const toggleNode = (id) => {
        setExpandedNodes((prev) => ({
            ...prev,
            [id]: prev[id] === false ? true : false,
        }));
    };

    const { getAllCategories, loading: getAllCategoriesLoading } =
        useGetAllCategories();
    const { deleteCategory, loading: deleteCategoryLoading } =
        useDeleteCategory();
    const { createCategory, loading: creating } = useCreateCategory();
    const { updateCategory, loading: updating } = useUpdateCategory();

    useEffect(() => {
        (async () => {
            const response = await getAllCategories();
            if (response?.success) setCategories(response.categories);
        })();
    }, []);

    const handleDelete = async () => {
        const { categoryId } = deleteModal;
        const response = await deleteCategory(categoryId);
        if (response?.success) {
            setCategories((prev) => prev.filter((c) => c._id !== categoryId));
            setDeleteModal({ isOpen: false, categoryId: null });
        }
    };

    // Build hierarchy for table and select options
    const buildHierarchy = (cats) => {
        const catMap = {};
        const roots = [];
        cats.forEach((c) => {
            catMap[c._id] = { ...c, children: [], level: 0 };
        });
        cats.forEach((c) => {
            if (c.parentId) {
                const pid = c.parentId._id || c.parentId;
                if (catMap[pid]) {
                    catMap[pid].children.push(catMap[c._id]);
                } else {
                    roots.push(catMap[c._id]);
                }
            } else {
                roots.push(catMap[c._id]);
            }
        });

        // Flatten back for table display with level
        const flattened = [];
        const flatten = (node, level) => {
            node.level = level;
            flattened.push(node);
            const isExpanded = expandedNodes[node._id] !== false;
            if (isExpanded) {
                node.children.forEach(child => flatten(child, level + 1));
            }
        };
        roots.forEach(root => flatten(root, 0));
        return flattened;
    };

    const hierarchicalCategories = buildHierarchy(categories);

    const handleOpenAddModal = () => {
        setCategoryModal({
            isOpen: true,
            isEditing: false,
            data: INITIAL_STATE,
            imagePreview: null,
        });
    };

    const handleOpenAddSubcategory = (parentId) => {
        setCategoryModal({
            isOpen: true,
            isEditing: false,
            data: { ...INITIAL_STATE, parentId },
            imagePreview: null,
        });
    };

    const handleOpenEditModal = (category) => {
        setCategoryModal({
            isOpen: true,
            isEditing: true,
            data: {
                name: category.name,
                _id: category._id,
                parentId: category.parentId?._id || category.parentId || "",
                isActive: category.isActive,
                image: null,
                removeImage: false,
            },
            imagePreview: category.image ? getImageUrl(category.image) : null,
        });
    };

    const handleCloseModal = () => {
        if (categoryModal.imagePreview && categoryModal.imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(categoryModal.imagePreview);
        }
        setCategoryModal({
            isOpen: false,
            isEditing: false,
            data: INITIAL_STATE,
            imagePreview: null,
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (categoryModal.imagePreview && categoryModal.imagePreview.startsWith("blob:")) {
                URL.revokeObjectURL(categoryModal.imagePreview);
            }
            const objectUrl = URL.createObjectURL(file);
            setCategoryModal((prev) => ({
                ...prev,
                data: {
                    ...prev.data,
                    image: file,
                    removeImage: false,
                },
                imagePreview: objectUrl,
            }));
        }
    };

    const handleRemoveImage = () => {
        if (categoryModal.imagePreview && categoryModal.imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(categoryModal.imagePreview);
        }
        setCategoryModal((prev) => ({
            ...prev,
            data: {
                ...prev.data,
                image: null,
                removeImage: true,
            },
            imagePreview: null,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryModal.data.name.trim()) return;

        const formData = new FormData();
        formData.append("name", categoryModal.data.name.trim());
        formData.append("parentId", categoryModal.data.parentId || "");
        formData.append("isActive", categoryModal.data.isActive);
        if (categoryModal.data.image) {
            formData.append("image", categoryModal.data.image);
        }
        if (categoryModal.data.removeImage) {
            formData.append("removeImage", "true");
        }

        let response;
        if (categoryModal.isEditing) {
            response = await updateCategory({
                id: categoryModal.data._id,
                categoryData: formData,
            });

            if (response?.success) {
                setCategories((prev) =>
                    prev.map((cat) =>
                        cat._id === response.category._id ? response.category : cat
                    )
                );
                handleCloseModal();
            }
        } else {
            response = await createCategory(formData);
            if (response?.success) {
                setCategories((prev) => [...prev, response.category]);
                handleCloseModal();
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Categories
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage product categories ({categories.length} total)
                    </p>
                </div>
                <Button
                    onClick={handleOpenAddModal}
                    className="flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add New Category
                </Button>
            </header>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">
                                    Image
                                </th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">
                                    Category Name (Hierarchy)
                                </th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">
                                    Parent
                                </th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">
                                    Status
                                </th>
                                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-700 border-b border-gray-200">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {getAllCategoriesLoading &&
                            categories.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-16 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                                            <p className="text-sm font-medium text-gray-500">
                                                Loading categories...
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : hierarchicalCategories.length > 0 ? (
                                hierarchicalCategories.map((cat) => (
                                    <tr
                                        key={cat._id}
                                        className="group hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            {cat.image ? (
                                                <img
                                                    src={getImageUrl(cat.image)}
                                                    alt={cat.name}
                                                    className="w-14 h-14 object-cover rounded-xl shadow-xs border border-gray-200 bg-white"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "";
                                                        e.target.className = "hidden";
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl border border-gray-200 border-dashed flex items-center justify-center bg-gray-50 text-gray-400">
                                                    <ImageIcon size={22} />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2" style={{ paddingLeft: `${cat.level * 24}px` }}>
                                                {/* Connecting Lines for visual hierarchy */}
                                                {cat.level > 0 && (
                                                    <div className="w-4 h-px bg-gray-300 absolute -translate-x-5"></div>
                                                )}
                                                
                                                {/* Toggle Button for children */}
                                                <div className="w-5 flex items-center justify-center">
                                                    {cat.children && cat.children.length > 0 ? (
                                                        <button 
                                                            onClick={() => toggleNode(cat._id)}
                                                            className="p-0.5 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                                                        >
                                                            {expandedNodes[cat._id] !== false ? (
                                                                <ChevronDown size={16} />
                                                            ) : (
                                                                <ChevronRight size={16} />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                                                    )}
                                                </div>

                                                <span
                                                    className={`text-sm font-medium ${cat.level > 0 ? "text-gray-600" : "text-gray-900 font-bold"}`}
                                                >
                                                    {cat.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`text-xs font-medium px-2.5 py-1 rounded-md ${cat.parentId
                                                    ? "bg-gray-100 text-gray-600"
                                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                                    }`}
                                            >
                                                {cat.parentId?.name || "Root"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {cat.isActive ? (
                                                    <>
                                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Active
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                                                        <span className="text-sm font-medium text-gray-500">
                                                            Inactive
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                            <button
                                                onClick={() =>
                                                    handleOpenAddSubcategory(cat._id)
                                                }
                                                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                                title="Add Subcategory"
                                            >
                                                <Plus
                                                    size={16}
                                                    className="text-green-600"
                                                />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleOpenEditModal(cat)
                                                }
                                                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                                title="Edit"
                                            >
                                                <Edit
                                                    size={16}
                                                    className="text-blue-600"
                                                />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setDeleteModal({
                                                        isOpen: true,
                                                        categoryId: cat._id,
                                                    });
                                                }}
                                                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-24 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-3">
                                            <FolderTree
                                                size={48}
                                                className="text-gray-300"
                                                strokeWidth={1.5}
                                            />
                                            <div className="space-y-1">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    No categories found
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Get started by adding your
                                                    first category
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Dialog */}
            <DeleteDialog
                isOpen={deleteModal.isOpen}
                loading={deleteCategoryLoading}
                onClose={() =>
                    setDeleteModal({ isOpen: false, categoryId: null })
                }
                onConfirm={handleDelete}
                title="Delete Category"
                message="Are you sure you want to delete this category? This action cannot be undone and may affect related products."
            />

            {/* Add/Edit Category Modal */}
            {categoryModal.isOpen && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {categoryModal.isEditing
                                        ? "Edit Category"
                                        : "Add New Category"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {categoryModal.isEditing
                                        ? "Update category details & image"
                                        : "Create a new product category"}
                                </p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Category Name */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Tag size={14} className="text-blue-600" />
                                    Category Name
                                    <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    placeholder="e.g., Electronics, Medicine"
                                    value={categoryModal.data.name}
                                    onChange={(e) =>
                                        setCategoryModal({
                                            ...categoryModal,
                                            data: {
                                                ...categoryModal.data,
                                                name: e.target.value,
                                            },
                                        })
                                    }
                                    className="mt-1"
                                    required
                                />
                            </div>

                            {/* Image Upload with Instant Preview */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <ImageIcon size={14} className="text-blue-600" />
                                        Category Picture
                                    </label>
                                    {categoryModal.imagePreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={12} />
                                            Remove picture
                                        </button>
                                    )}
                                </div>

                                {categoryModal.imagePreview ? (
                                    <div className="relative rounded-2xl border border-gray-200 bg-gray-50/80 p-4 flex flex-col sm:flex-row items-center gap-4">
                                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xs shrink-0 flex items-center justify-center">
                                            <img
                                                src={categoryModal.imagePreview}
                                                alt="Category Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 w-full space-y-2 text-center sm:text-left">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                    {categoryModal.data.image instanceof File
                                                        ? categoryModal.data.image.name
                                                        : "Selected Picture"}
                                                </p>
                                                {categoryModal.data.image instanceof File ? (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {(categoryModal.data.image.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                                                        Active category picture
                                                    </p>
                                                )}
                                            </div>
                                            <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-xs transition-colors w-full sm:w-auto">
                                                <UploadCloud size={14} className="text-blue-600" />
                                                Change Picture
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all bg-gray-50/50 hover:bg-blue-50/30 group">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            <UploadCloud size={20} />
                                        </div>
                                        <p className="text-xs font-semibold text-gray-700">
                                            Click to select category picture
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            PNG, JPG, WEBP, SVG up to 5MB
                                        </p>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Parent Category */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <FolderTree size={14} className="text-blue-600" />
                                    Parent Category
                                </label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-700"
                                    value={categoryModal.data.parentId}
                                    onChange={(e) =>
                                        setCategoryModal({
                                            ...categoryModal,
                                            data: {
                                                ...categoryModal.data,
                                                parentId: e.target.value,
                                            },
                                        })
                                    }
                                >
                                    <option value="">None (Root Category)</option>
                                    {hierarchicalCategories
                                        .filter((c) => c._id !== categoryModal.data._id) // Prevent selecting self
                                        .map((cat) => (
                                            <option key={cat._id} value={cat._id}>
                                                {"\u00A0\u00A0\u00A0".repeat(cat.level)}
                                                {cat.level > 0 ? "↳ " : ""}
                                                {cat.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <span className="text-sm font-medium text-gray-900">
                                        Active Status
                                    </span>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {categoryModal.data.isActive
                                            ? "Category is visible to customers"
                                            : "Category is hidden from customers"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCategoryModal({
                                            ...categoryModal,
                                            data: {
                                                ...categoryModal.data,
                                                isActive:
                                                    !categoryModal.data
                                                        .isActive,
                                            },
                                        })
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer ${
                                        categoryModal.data.isActive
                                            ? "bg-blue-600"
                                            : "bg-gray-300"
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            categoryModal.data.isActive
                                                ? "translate-x-6"
                                                : "translate-x-1"
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4 flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCloseModal}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={creating || updating}
                                    className="min-w-35"
                                >
                                    {creating || updating ? (
                                        <div className="flex items-center gap-2">
                                            <Loader
                                                className="animate-spin"
                                                size={16}
                                            />
                                            <span>
                                                {categoryModal.isEditing
                                                    ? "Updating..."
                                                    : "Creating..."}
                                            </span>
                                        </div>
                                    ) : categoryModal.isEditing ? (
                                        "Update Category"
                                    ) : (
                                        "Create Category"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoriesListPage;
