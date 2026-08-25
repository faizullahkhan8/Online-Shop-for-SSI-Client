import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
    useGetAllPrescriptions, 
    useUpdatePrescriptionStatus, 
    useDeletePrescription,
    useMarkPrescriptionViewed
} from "../../api/hooks/prescription.api.js";
import { Eye, Trash2, X, Check, Loader, Printer, Download, MapPin } from "lucide-react";
import { useSocket, SOCKET_EVENTS } from "../../context/SocketContext";

const PrescriptionsList = () => {
    const { getAllPrescriptions, loading } = useGetAllPrescriptions();
    const { updatePrescriptionStatus } = useUpdatePrescriptionStatus();
    const { deletePrescription } = useDeletePrescription();
    const { socket } = useSocket();
    
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

    // Live socket listener for instant prescription uploads
    useEffect(() => {
        if (!socket) return;

        const handleNewPrescription = (data) => {
            if (data?.prescription) {
                setPrescriptions(prev => [data.prescription, ...prev.filter(p => p._id !== data.prescription._id)]);
            }
        };

        socket.on(SOCKET_EVENTS.PRESCRIPTION_NEW, handleNewPrescription);
        return () => socket.off(SOCKET_EVENTS.PRESCRIPTION_NEW, handleNewPrescription);
    }, [socket]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            const data = await updatePrescriptionStatus(id, newStatus);
            if (data.success) {
                toast.success(`Prescription marked as ${newStatus}`);
                setPrescriptions(prescriptions.map(p => 
                    p._id === id ? { ...p, status: newStatus, isViewed: true } : p
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

    const handlePrint = (item) => {
        if (!item) return;
        const imgPath = typeof item === "string" ? item : item.image;
        const url = getImageUrl(imgPath);
        const patientName = item.name || item.userId?.name || "Customer";
        const patientPhone = item.phone || item.userId?.phone || "N/A";
        const patientAddress = item.address?.text || "N/A";
        const uploadDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
        const status = (item.status || "Pending").toUpperCase();

        const printWindow = window.open("", "_blank", "width=900,height=1100");
        if (!printWindow) {
            toast.error("Please allow popups in your browser to print prescriptions.");
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Prescription - ${patientName}</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 8mm 10mm;
                    }
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    html, body {
                        width: 100%;
                        height: 100%;
                        background-color: #ffffff;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        color: #111827;
                    }
                    body {
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        padding: 10px;
                        height: 100vh;
                        max-height: 100vh;
                        overflow: hidden;
                    }
                    .header {
                        border-bottom: 2px solid #1e4d28;
                        padding-bottom: 6px;
                        margin-bottom: 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    .brand-title {
                        font-size: 18px;
                        font-weight: 900;
                        color: #1e4d28;
                        letter-spacing: -0.5px;
                    }
                    .brand-sub {
                        font-size: 10px;
                        color: #6b7280;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .status-pill {
                        font-size: 10px;
                        font-weight: 800;
                        background: #f0fdf4;
                        color: #166534;
                        border: 1px solid #bbf7d0;
                        padding: 3px 10px;
                        border-radius: 9999px;
                    }
                    .meta-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 6px;
                        font-size: 11px;
                        background: #f9fafb;
                        border: 1px solid #f3f4f6;
                        border-radius: 6px;
                        padding: 6px 10px;
                        margin-bottom: 8px;
                    }
                    .meta-item strong {
                        display: block;
                        font-size: 9px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        color: #6b7280;
                    }
                    .meta-item span {
                        font-weight: 700;
                        color: #1f2937;
                    }
                    .image-container {
                        flex: 1;
                        min-height: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: #fdfdfd;
                        border: 1px solid #e5e7eb;
                        border-radius: 6px;
                        padding: 4px;
                        overflow: hidden;
                    }
                    .image-container img {
                        max-width: 100%;
                        max-height: 100%;
                        width: auto;
                        height: auto;
                        object-fit: contain;
                        display: block;
                        margin: auto;
                    }
                    .footer {
                        margin-top: 6px;
                        padding-top: 4px;
                        border-top: 1px dashed #e5e7eb;
                        font-size: 9px;
                        color: #9ca3af;
                        text-align: center;
                    }
                    @media print {
                        body {
                            padding: 0;
                            height: 100%;
                            max-height: 100%;
                        }
                        .image-container {
                            border: none;
                            background: transparent;
                            padding: 0;
                        }
                        .image-container img {
                            max-height: calc(100vh - 110px);
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                <div>
                    <div class="header">
                        <div>
                            <div class="brand-title">ZADA PHARMACY</div>
                            <div class="brand-sub">Prescription Verification & Order Document</div>
                        </div>
                        <div>
                            <span class="status-pill">STATUS: ${status}</span>
                        </div>
                    </div>

                    <div class="meta-grid">
                        <div class="meta-item">
                            <strong>Customer / Patient</strong>
                            <span>${patientName}</span>
                        </div>
                        <div class="meta-item">
                            <strong>Contact Phone</strong>
                            <span>${patientPhone}</span>
                        </div>
                        <div class="meta-item">
                            <strong>Date Uploaded</strong>
                            <span>${uploadDate}</span>
                        </div>
                        <div class="meta-item" style="grid-column: span 3;">
                            <strong>Delivery Address</strong>
                            <span>${patientAddress}</span>
                        </div>
                    </div>
                </div>

                <div class="image-container">
                    <img id="print-image" src="${url}" alt="Prescription Document" />
                </div>

                <div class="footer">
                    Printed on ${new Date().toLocaleString()} • Zada Pharmacy Management System
                </div>

                <script>
                    const img = document.getElementById('print-image');
                    const triggerPrint = () => {
                        window.focus();
                        window.print();
                        setTimeout(() => { window.close(); }, 400);
                    };

                    if (img.complete) {
                        setTimeout(triggerPrint, 250);
                    } else {
                        img.onload = () => setTimeout(triggerPrint, 250);
                        img.onerror = () => {
                            alert('Error loading image for print.');
                            window.close();
                        };
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
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
                                                <div className="flex items-center gap-2">
                                                    {!p.isViewed && (
                                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-red-100 shrink-0 animate-pulse" title="New / Unviewed Prescription" />
                                                    )}
                                                    <span>{p.name || p.userId?.name || "Unknown"}</span>
                                                </div>
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
                                                        onClick={() => handlePrint(p)}
                                                        className="text-gray-500 hover:text-gray-700 bg-gray-50 p-1.5 rounded cursor-pointer transition-colors"
                                                        title="Print Prescription"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDownload(p.image)}
                                                        className="text-green-500 hover:text-green-700 bg-green-50 p-1.5 rounded cursor-pointer transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleViewImage(p)}
                                                        className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded relative cursor-pointer transition-colors"
                                                        title="View Image"
                                                    >
                                                        {!p.isViewed && (
                                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white"></span>
                                                        )}
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(p._id)}
                                                        className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded cursor-pointer transition-colors"
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

            {/* Image Modal with Print Toolbar */}
            {selectedImage && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
                    {/* Top Action Bar */}
                    <div className="absolute top-5 right-6 flex items-center gap-4 z-10">
                        <button
                            onClick={() => handlePrint(selectedImage)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold backdrop-blur transition-all cursor-pointer"
                            title="Print Prescription"
                        >
                            <Printer size={15} /> Print
                        </button>
                        <button
                            onClick={() => handleDownload(selectedImage)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold backdrop-blur transition-all cursor-pointer"
                            title="Download Image"
                        >
                            <Download size={15} /> Download
                        </button>
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="p-1.5 bg-white/15 hover:bg-red-500/80 text-white rounded-lg transition-colors cursor-pointer"
                            title="Close"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="max-w-4xl max-h-[85vh] p-2 flex items-center justify-center">
                        <img 
                            src={getImageUrl(selectedImage)} 
                            alt="Prescription Preview" 
                            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl bg-white"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrescriptionsList;
