import { useState, useEffect } from "react";
import {
    useGetAllVendors,
    useDeleteVendor,
    useCreateVendor,
    useUpdateVendor,
    useUploadVendorImage,
    useDeleteVendorImage,
} from "../../api/hooks/vendor.api.js";
import { handleImageError, getImageUrl } from "../../utils/imageHelper";
import {
    Edit,
    Trash2,
    RefreshCw,
    Plus,
    X,
    Loader,
    Image as ImageIcon,
    UploadCloud,
    Building2,
    Search
} from "lucide-react";
import DeleteDialog from "../../UI/DialogBox.jsx";
import Input from "../../UI/Input.jsx";
import Button from "../../UI/Button.jsx";

const INITIAL_STATE = {
    name: "",
    description: "",
    image: "",
    imageFileId: "",
    removeImage: false,
};

const VendorsListPage = () => {
    const [vendors, setVendors] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        vendorId: null,
    });
    const [vendorModal, setVendorModal] = useState({
        isOpen: false,
        isEditing: false,
        data: INITIAL_STATE,
        imagePreview: null,
    });

    const { getAllVendors, loading: getAllVendorsLoading } = useGetAllVendors();
    const { deleteVendor, loading: deleteVendorLoading } = useDeleteVendor();
    const { createVendor, loading: creating } = useCreateVendor();
    const { updateVendor, loading: updating } = useUpdateVendor();
    const { uploadImage, loading: uploadingImg } = useUploadVendorImage();
    const { deleteImage, loading: deletingImg } = useDeleteVendorImage();

    const fetchVendors = async () => {
        const response = await getAllVendors();
        if (response?.success) setVendors(response.vendors);
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleDelete = async () => {
        const { vendorId } = deleteModal;
        const response = await deleteVendor(vendorId);
        if (response?.success) {
            setVendors((prev) => prev.filter((v) => v._id !== vendorId));
            setDeleteModal({ isOpen: false, vendorId: null });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const { isEditing, data } = vendorModal;

        let response;
        if (isEditing) {
            response = await updateVendor(data._id, data); // Passing JSON data now instead of formData
        } else {
            response = await createVendor(data);
        }

        if (response?.success) {
            setVendorModal({
                isOpen: false,
                isEditing: false,
                data: INITIAL_STATE,
                imagePreview: null,
            });
            fetchVendors();
        }
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const res = await uploadImage(file);
                if (res.success) {
                    setVendorModal((prev) => ({
                        ...prev,
                        data: { ...prev.data, image: res.url, imageFileId: res.fileId, removeImage: false },
                        imagePreview: res.url,
                    }));
                }
            } catch (error) {
                console.error("Upload failed", error);
            }
        }
    };

    const handleRemoveImage = async () => {
        const { data } = vendorModal;
        if (data.imageFileId) {
            await deleteImage(data.imageFileId);
        }
        setVendorModal((prev) => ({
            ...prev,
            data: { ...prev.data, image: "", imageFileId: "", removeImage: true },
            imagePreview: null,
        }));
    };

    const openEditModal = (vendor) => {
        setVendorModal({
            isOpen: true,
            isEditing: true,
            data: {
                _id: vendor._id,
                name: vendor.name,
                description: vendor.description || "",
                image: vendor.image || "",
                imageFileId: vendor.imageFileId || "",
                removeImage: false,
            },
            imagePreview: vendor.image || null,
        });
    };

    const openAddModal = () => {
        setVendorModal({
            isOpen: true,
            isEditing: false,
            data: INITIAL_STATE,
            imagePreview: null,
        });
    };

    const filteredVendors = vendors.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-[#FAFBF9] min-h-screen font-sans selection:bg-primary/10 selection:text-primary pb-12">
            <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
                
                {/* ── HEADER ───────────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-primary-pale/30 flex items-center justify-center border border-primary-pale/50">
                                <Building2 className="text-primary" size={16} />
                            </div>
                            <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">
                                Vendor Directory
                            </span>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
                            Manage Vendors
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                        <Button
                            onClick={fetchVendors}
                            disabled={getAllVendorsLoading}
                            variant="outline"
                            className="flex items-center gap-2 !px-4 !py-2.5 !rounded-xl !text-sm bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 shadow-sm"
                        >
                            <RefreshCw
                                size={16}
                                className={getAllVendorsLoading ? "animate-spin" : ""}
                            />
                            Refresh
                        </Button>
                        <Button
                            onClick={openAddModal}
                            className="flex items-center gap-2 !px-4 !py-2.5 !rounded-xl !text-sm bg-primary hover:bg-primary-dark text-white shadow-sm shadow-primary/30"
                        >
                            <Plus size={16} />
                            Add Vendor
                        </Button>
                    </div>
                </div>

                {/* ── FILTERS ──────────────────────────────────────────────────────── */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search vendors..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="text-sm font-semibold text-gray-500">
                        Total Vendors: <span className="text-gray-900">{vendors.length}</span>
                    </div>
                </div>

                {/* ── DATA LIST ────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20 text-center">Logo</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor Info</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right pr-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {getAllVendorsLoading ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-gray-400">
                                            <Loader size={24} className="animate-spin mx-auto mb-2 text-primary" />
                                            <p className="text-sm">Loading vendors...</p>
                                        </td>
                                    </tr>
                                ) : filteredVendors.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-gray-400">
                                            <Building2 size={32} className="mx-auto mb-3 text-gray-300 opacity-50" />
                                            <p className="text-sm">No vendors found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVendors.map((vendor) => (
                                        <tr key={vendor._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4 text-center">
                                                <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden shadow-sm mx-auto p-1">
                                                    {vendor.image ? (
                                                        <img
                                                            src={getImageUrl(vendor.image, 'vendor')}
                                                            alt={vendor.name}
                                                            onError={(e) => handleImageError(e, "vendor")}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="text-gray-300" size={20} />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">{vendor.name}</span>
                                                    <span className="text-xs text-gray-500 line-clamp-1 max-w-md mt-0.5">{vendor.description || "No description provided."}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditModal(vendor)}
                                                        className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal({ isOpen: true, vendorId: vendor._id })}
                                                        className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── MODALS ───────────────────────────────────────────────────────── */}
                {vendorModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                            
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900">
                                    {vendorModal.isEditing ? "Edit Vendor" : "Add Vendor"}
                                </h2>
                                <button
                                    onClick={() => setVendorModal({ ...vendorModal, isOpen: false })}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form id="vendorForm" onSubmit={handleSave} className="flex flex-col gap-5">
                                    
                                    {/* Image Upload Box */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-primary hover:text-primary hover:bg-primary/5 transition-all relative overflow-hidden group bg-gray-50">
                                            {vendorModal.imagePreview ? (
                                                <>
                                                    <img src={getImageUrl(vendorModal.imagePreview, 'vendor')} alt="Preview" className="w-full h-full object-contain p-2" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <UploadCloud className="text-white drop-shadow-md" size={24} />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <UploadCloud size={24} className="mb-1" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Logo</span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                        {vendorModal.imagePreview && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                disabled={deletingImg}
                                                className="text-xs text-red-500 hover:text-red-700 font-semibold mt-2 disabled:opacity-50"
                                            >
                                                {deletingImg ? "Removing..." : "Remove Logo"}
                                            </button>
                                        )}
                                        {uploadingImg && (
                                            <span className="text-xs text-blue-500 font-semibold mt-2 animate-pulse">
                                                Uploading...
                                            </span>
                                        )}
                                    </div>

                                    {/* Fields */}
                                    <Input
                                        id="name"
                                        label="Vendor Name *"
                                        type="text"
                                        value={vendorModal.data.name}
                                        onChange={(e) => setVendorModal((prev) => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                                        required
                                        placeholder="e.g. GSK Pharma"
                                        className="bg-gray-50"
                                    />
                                    
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">Description</label>
                                        <textarea
                                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-gray-50 transition-all min-h-[100px] resize-none"
                                            placeholder="Write a short description about this vendor..."
                                            value={vendorModal.data.description}
                                            onChange={(e) => setVendorModal((prev) => ({ ...prev, data: { ...prev.data, description: e.target.value } }))}
                                        />
                                    </div>
                                </form>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setVendorModal({ ...vendorModal, isOpen: false })}
                                    className="!px-5 !py-2.5 !rounded-xl text-sm"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    form="vendorForm"
                                    disabled={creating || updating || uploadingImg}
                                    className="!px-6 !py-2.5 !rounded-xl text-sm shadow-sm"
                                >
                                    {(creating || updating || uploadingImg) ? (
                                        <Loader size={16} className="animate-spin" />
                                    ) : vendorModal.isEditing ? "Save Changes" : "Create Vendor"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <DeleteDialog
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ isOpen: false, vendorId: null })}
                    onConfirm={handleDelete}
                    title="Delete Vendor"
                    message="Are you sure you want to delete this vendor? This action cannot be undone."
                    loading={deleteVendorLoading}
                />
            </div>
        </div>
    );
};

export default VendorsListPage;
