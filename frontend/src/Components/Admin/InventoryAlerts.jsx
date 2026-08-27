import { AlertTriangle, XCircle, Package, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const InventoryAlerts = ({ inventory }) => {
    const navigate = useNavigate();

    if (!inventory || (inventory.outOfStockCount === 0 && inventory.lowStockCount === 0)) {
        return null;
    }

    const { outOfStock, lowStock, outOfStockCount, lowStockCount } = inventory;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {/* Out of Stock Alert */}
            {outOfStockCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-500 text-white rounded-lg">
                                <XCircle size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Out of Stock
                                </h3>
                                <p className="text-xs font-medium text-red-600">
                                    {outOfStockCount} {outOfStockCount === 1 ? 'item' : 'items'} require restock
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/admin-dashboard?tab=products-list")}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        >
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {outOfStock.slice(0, 3).map((item) => (
                            <div key={item._id} className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-red-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden p-1.5">
                                        <img
                                            src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${item.image}`}
                                            alt={item.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                                        {item.name}
                                    </span>
                                </div>
                                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                                    Stock: 0
                                </span>
                            </div>
                        ))}
                        {outOfStockCount > 3 && (
                            <p className="text-xs font-medium text-gray-500 text-center pt-1">
                                +{outOfStockCount - 3} more {outOfStockCount - 3 === 1 ? 'item' : 'items'}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Low Stock Alert */}
            {lowStockCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500 text-white rounded-lg">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Low Stock Warning
                                </h3>
                                <p className="text-xs font-medium text-amber-600">
                                    {lowStockCount} {lowStockCount === 1 ? 'item' : 'items'} running low
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/admin/products")}
                            className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-amber-600"
                        >
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        {lowStock.slice(0, 3).map((item) => (
                            <div key={item._id} className="flex items-center justify-between bg-white p-3.5 rounded-lg border border-amber-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden p-1.5">
                                        <img
                                            src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${item.image}`}
                                            alt={item.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                                        {item.name}
                                    </span>
                                </div>
                                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                    Stock: {item.stock}
                                </span>
                            </div>
                        ))}
                        {lowStockCount > 3 && (
                            <p className="text-xs font-medium text-gray-500 text-center pt-1">
                                +{lowStockCount - 3} more {lowStockCount - 3 === 1 ? 'item' : 'items'}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryAlerts;