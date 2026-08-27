import { useState, useEffect, useCallback } from "react";
import {
    Zap,
    Settings,
    Plus,
    Trash2,
    Save,
    Loader2,
    Percent,
    Calendar,
    Package,
} from "lucide-react";
import { useAddPromotion, useUpdatePromotion, useGetPromotionById } from "../../api/hooks/promotion.api";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductSelector from "../../Components/Admin/ProductSelector";

import Input from "../../UI/Input";
import Select from "../../UI/Select";

const PromotionBuilder = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("id");

    const { addPromotion, loading: addLoading } = useAddPromotion();
    const { updatePromotion, loading: updateLoading } = useUpdatePromotion();
    const { getPromotionById, loading: fetchLoading } = useGetPromotionById();

    const loading = addLoading || updateLoading || (editId && fetchLoading);

    const [promotionData, setPromotionData] = useState({
        title: "",
        type: "FLASH_DEAL",
        discountType: "PERCENTAGE",
        discountValue: 0,
        startTime: "",
        endTime: "",
    });

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [errors, setErrors] = useState({});

    // Fetch existing promotion if editing
    useEffect(() => {
        if (editId) {
            const loadPromotion = async () => {
                const data = await getPromotionById(editId);
                if (data && data.promotion) {
                    const p = data.promotion;
                    setPromotionData({
                        title: p.title,
                        type: p.type,
                        discountType: p.discountType,
                        discountValue: p.discountValue,
                        startTime: new Date(p.startTime).toISOString().slice(0, 16),
                        endTime: new Date(p.endTime).toISOString().slice(0, 16),
                    });
                    setSelectedProducts(p.products);
                }
            };
            loadPromotion();
        }
    }, [editId, getPromotionById]);



    const handleDataChange = (name, value) => {
        setPromotionData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const toggleProduct = (product) => {
        const isSelected = selectedProducts.some((p) => p._id === product._id);
        if (isSelected) {
            setSelectedProducts((prev) =>
                prev.filter((p) => p._id !== product._id),
            );
        } else {
            setSelectedProducts((prev) => [...prev, product]);
        }
        setNoProductFound(false);
    };

    const validateEndTime = (endTime) => {
        if (new Date(endTime) <= new Date()) {
            return "End time must be in the future";
        }
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!promotionData.title) newErrors.title = "Title is required";
        if (promotionData.discountValue <= 0)
            newErrors.discountValue = "Value must be positive";
        if (!promotionData.startTime) newErrors.startTime = "Start is required";
        if (!promotionData.endTime) newErrors.endTime = "End is required";

        const endTimeError = validateEndTime(promotionData.endTime);
        if (endTimeError) newErrors.endTime = endTimeError;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const data = {
            ...promotionData,
            products: selectedProducts.map((p) => p._id),
        };

        let result;
        if (editId) {
            result = await updatePromotion(editId, data);
        } else {
            result = await addPromotion(data);
        }

        if (result?.success) {
            navigate("/admin-dashboard/promotions");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {editId ? "Edit Promotion" : "Create Promotion"}
                        </h1>
                        <span className="text-sm text-gray-500">
                            {editId ? "Update campaign details" : "Build a new campaign"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate("/admin-dashboard/promotions")}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        form="promotion-form"
                        type="submit"
                        disabled={loading || selectedProducts.length === 0}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        {editId ? "Update" : "Create"}
                    </button>
                </div>
            </div>

            <form
                id="promotion-form"
                onSubmit={handleSubmit}
                className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
                {/* Configuration Panel */}
                <div className="lg:col-span-5 space-y-4">
                    <section className="bg-white border border-gray-200 rounded-lg p-5">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Settings size={16} className="text-blue-600" />
                            Configuration
                        </h3>

                        <div className="space-y-4">
                            <Input
                                label="Promotion Title"
                                placeholder="e.g., Summer Sale"
                                value={promotionData.title}
                                className="w-full"
                                onChange={(e) =>
                                    handleDataChange("title", e.target.value)
                                }
                                error={errors.title}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <Select
                                    label="Type"
                                    value={promotionData.type}
                                    onChange={(val) =>
                                        handleDataChange("type", val)
                                    }
                                    className="w-full!"
                                    options={[
                                        { value: "FLASH_DEAL", label: "Flash Deal" },
                                        { value: "OFFER", label: "Offer" },
                                    ]}
                                />
                                <Select
                                    label="Discount Type"
                                    value={promotionData.discountType}
                                    onChange={(val) =>
                                        handleDataChange("discountType", val)
                                    }
                                    className="w-full!"
                                    options={[
                                        { value: "PERCENTAGE", label: "Percentage" },
                                        { value: "FIXED_AMOUNT", label: "Fixed Amount" },
                                    ]}
                                />
                            </div>

                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Discount Value
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={promotionData.discountValue}
                                        onChange={(e) =>
                                            handleDataChange(
                                                "discountValue",
                                                Number(e.target.value),
                                            )
                                        }
                                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                        {promotionData.discountType === "PERCENTAGE" ? (
                                            <Percent size={18} />
                                        ) : (
                                            <span className="font-semibold text-sm">PKR</span>
                                        )}
                                    </div>
                                </div>
                                {errors.discountValue && (
                                    <p className="text-xs text-red-600 mt-1">
                                        {errors.discountValue}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="bg-gray-900 rounded-lg p-5 text-white">
                        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                            <Calendar size={16} className="text-blue-400" />
                            Timeline
                        </h3>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-400">
                                    Start Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={promotionData.startTime}
                                    onChange={(e) =>
                                        handleDataChange("startTime", e.target.value)
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {errors.startTime && (
                                    <p className="text-xs text-red-400">{errors.startTime}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-400">
                                    End Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={promotionData.endTime}
                                    onChange={(e) =>
                                        handleDataChange("endTime", e.target.value)
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {errors.endTime && (
                                    <p className="text-xs text-red-400">{errors.endTime}</p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Product Selection */}
                <div className="lg:col-span-7 space-y-4">
                    <ProductSelector
                        selectedProducts={selectedProducts}
                        onChange={setSelectedProducts}
                        excludeActivePromotions={true}
                        currentPromotionId={editId}
                        multiple={true}
                    />
                </div>

                {/* Selected Products */}
                <div className="lg:col-span-12">
                    <section className="bg-white border border-gray-200 rounded-lg p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Plus size={16} className="text-blue-600" />
                                Selected Products
                            </h3>
                            <span className="bg-gray-900 text-white px-3 py-1 rounded text-sm font-medium">
                                {selectedProducts.length} selected
                            </span>
                        </div>

                        {selectedProducts.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center">
                                <Package size={40} className="text-gray-300 mb-3" />
                                <p className="text-sm text-gray-500">
                                    No products selected
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                {selectedProducts.map((p) => (
                                    <div
                                        key={p._id}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden min-w-0">
                                            <div className="w-10 h-10 shrink-0 bg-white rounded-lg p-1 border border-gray-200">
                                                <img
                                                    src={`${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${p.image}`}
                                                    className="w-full h-full object-contain"
                                                    alt={p.name}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-gray-900 truncate">
                                                    {p.name}
                                                </p>
                                                <p className="text-xs text-blue-600 mt-0.5">
                                                    Rs{" "}
                                                    {(promotionData.discountType === "PERCENTAGE"
                                                        ? p.price - (p.price * promotionData.discountValue) / 100
                                                        : p.price - promotionData.discountValue
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleProduct(p)}
                                            className="w-6 h-6 shrink-0 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </form>
        </div>
    );
};

export default PromotionBuilder;