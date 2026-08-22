import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
    useGetAllPrescriptions, 
    useUpdatePrescriptionStatus, 
    useDeletePrescription,
    useMarkPrescriptionViewed
} from "../../api/hooks/prescription.api.js";
import { Eye, Trash2, X, Check, Loader, Printer, Download, MapPin } from "lucide-react";

const PrescriptionsList = () => {
    const { getAllPrescriptions, loading } = useGetAllPrescriptions();
    const { updatePrescriptionStatus } = useUpdatePrescriptionStatus();
    const { deletePrescription } = useDeletePrescription();
    
    const [prescriptions, setPrescriptions] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    const getImageUrl = (img) => {
        if (!img) return "https://placehold.co/600x800/F4F8EE/74AA34?text=No+Image";
        if (img.startsWith("http://") || img.startsWith("https://")) return img;
        const endpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
        if (endpoint) {
            return `${endpoint.replace(/\/+$/, "")}/${img.replace(/^\/+/, "")}`;
        }
        return img;
    };

    const fetchPrescriptions = async () => {
        try {
            const data = await getAllPrescriptions();
            if (data.success) {
                setPrescriptions(data.prescriptions);
            }
        } catch (error) {
            toast.error("Failed to fetch prescriptions");
        }
    };

    useEffect(() => {
        fetchPrescriptions();
    }, [getAllPrescriptions]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const data = await updatePrescriptionStatus(id, newStatus);
            if (data.success) {
                toast.success(`Prescription marked as ${newStatus}`);
                setPrescriptions(prescriptions.map(p => 
                    p._id === id ? { ...p, status: newStatus } : p
                ));
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this prescription?")) return;
        
        try {
            const data = await deletePrescription(id);
            if (data.success) {
                toast.success("Prescription deleted successfully");
                setPrescriptions(prescriptions.filter(p => p._id !== id));
            }
        } catch (error) {
            toast.error("Failed to delete prescription");
        }
    };

    const { markAsViewed } = useMarkPrescriptionViewed();

    const handleViewImage = async (p) => {
        setSelectedImage(p.image);
        if (!p.isViewed) {
            const res = await markAsViewed(p._id);
            if (res?.success) {
                setPrescriptions(prescriptions.map(presc => 
                    presc._id === p._id ? { ...presc, isViewed: true } : presc
                ));
            }
        }
    };

    const handlePrint = (img) => {
        const url = getImageUrl(img);
        const win = window.open("");
        win.document.write(`<img src="${url}" onload="window.print();window.close()" />`);
    };

    const handleDownload = (img) => {
        const url = getImageUrl(img);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Prescription.jpg";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case "pending": return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Pending</span>;
            case "processing": return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Processing</span>;
            case "completed": return <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Completed</span>;
            case "rejected": return <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Rejected</span>;
            default: return null;
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Prescriptions Management</h1>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader size={32} className="animate-spin text-[#74AA34]" />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Customer Details</th>
                                    <th className="px-6 py-4">Address</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Notes</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {prescriptions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                            No prescriptions found.
                                        </td>
                                    </tr>
                                ) : (
                                    prescriptions.map((p) => (
                                        <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {new Date(p.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {p.name || p.userId?.name || "Unknown"}
                                                <div className="text-xs text-gray-500 font-normal mt-0.5">{p.phone || p.userId?.phone || p.userId?.email || "No phone"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-700 max-w-[200px] truncate">{p.address?.text || "No address text"}</div>
                                                {p.address?.lat && p.address?.lng && (
                                                    <a 
                                                        href={`https://www.google.com/maps?q=${p.address.lat},${p.address.lng}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1 font-medium"
                                                    >
                                                        <MapPin size={12} /> View on Map
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select 
                                                    value={p.status}
                                                    onChange={(e) => handleStatusChange(p._id, e.target.value)}
                                                    className="text-xs border border-gray-200 rounded p-1 outline-none font-semibold text-gray-700 bg-white"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="processing">Processing</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                                <div className="mt-1">{getStatusBadge(p.status)}</div>
                                            </td>
                                            <td className="px-6 py-4 max-w-[200px] truncate text-xs">
                                                {p.notes || "-"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={() => handlePrint(p.image)}
                                                        className="text-gray-500 hover:text-gray-700 bg-gray-50 p-1.5 rounded"
                                                        title="Print"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDownload(p.image)}
                                                        className="text-green-500 hover:text-green-700 bg-green-50 p-1.5 rounded"
                                                        title="Download"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleViewImage(p)}
                                                        className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded relative"
                                                        title="View Image"
                                                    >
                                                        {!p.isViewed && (
                                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white"></span>
                                                        )}
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(p._id)}
                                                        className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded"
                                                        title="Delete"
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
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80">
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
                    >
                        <X size={32} />
                    </button>
                    <img 
                        src={getImageUrl(selectedImage)} 
                        alt="Prescription Preview" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg bg-white"
                    />
                </div>
            )}
        </div>
    );
};

export default PrescriptionsList;
