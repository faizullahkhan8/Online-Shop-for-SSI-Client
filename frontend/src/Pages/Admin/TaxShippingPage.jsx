import { useEffect, useState } from "react";
import { Truck, Receipt, Save, Loader2, CreditCard, Plus, Trash2, Image as ImageIcon, MapPin } from "lucide-react";
import Input from "../../UI/Input.jsx";
import Select from "../../UI/Select.jsx";
import { useGetSettings, useUpdateSettings } from "../../api/hooks/settings.api";
import { useUploadHomePageImage } from "../../api/hooks/homePage.api";
import { toast } from "react-toastify";
import LocationPicker from "../../Components/LocationPicker.jsx";
import { allCities } from "../../utils/pakistanData.js";

const DEFAULT_ADV_SHIPPING = {
    calculationMethod: "flat",
    storeLocation: { lat: 24.8607, lng: 67.0011 },
    distanceRatePerKm: 50,
    percentageRate: 5,
    cityRates: [],
    conditionalOverride: {
        enabled: false,
        operator: "greater_than",
        orderValueThreshold: 1000,
        overrideFee: 0
    }
};

const TaxShippingSettings = () => {
    const { getSettings, loading: settingsLoading } = useGetSettings();
    const { updateSettings, loading: updateLoading } = useUpdateSettings();
    const { uploadImage, loading: uploadingImage } = useUploadHomePageImage();

    const [form, setForm] = useState({
        taxAmount: 0,
        shippingFee: 0,
        shippingMethod: "standard",
        paymentMethods: [],
        advancedShipping: DEFAULT_ADV_SHIPPING,
    });
    
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    const handleDetectLocation = () => {
        setIsDetectingLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    updateAdv("storeLocation", { lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setIsDetectingLocation(false);
                    toast.success("Location successfully updated!");
                },
                (err) => {
                    console.error("Location access denied", err);
                    toast.error("Please allow location access to auto-detect.");
                    setIsDetectingLocation(false);
                }
            );
        } else {
            toast.error("Geolocation is not supported by your browser");
            setIsDetectingLocation(false);
        }
    };

    const [isFetchingAddress, setIsFetchingAddress] = useState(false);

    useEffect(() => {
        const fetchAddress = async () => {
            const loc = form.advancedShipping?.storeLocation;
            if (!loc?.lat || !loc?.lng) return;
            
            setIsFetchingAddress(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`
                );
                const data = await response.json();
                if (data && data.display_name) {
                    setForm(p => ({
                        ...p,
                        advancedShipping: {
                            ...p.advancedShipping,
                            storeLocation: {
                                ...p.advancedShipping.storeLocation,
                                address: data.display_name
                            }
                        }
                    }));
                }
            } catch (error) {
                console.error("Error fetching address:", error);
            } finally {
                setIsFetchingAddress(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchAddress();
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [form.advancedShipping?.storeLocation?.lat, form.advancedShipping?.storeLocation?.lng]);

    useEffect(() => {
        getSettings().then((res) => {
            if (res?.settings) {
                setForm({
                    taxAmount: Number(res.settings.taxAmount) || 0,
                    shippingFee: Number(res.settings.shippingFee) || 0,
                    shippingMethod: res.settings.shippingMethod || "standard",
                    paymentMethods: res.settings.paymentMethods || [],
                    advancedShipping: {
                        ...DEFAULT_ADV_SHIPPING,
                        ...(res.settings.advancedShipping || {}),
                        storeLocation: {
                            ...DEFAULT_ADV_SHIPPING.storeLocation,
                            ...(res.settings.advancedShipping?.storeLocation || {})
                        },
                        conditionalOverride: {
                            ...DEFAULT_ADV_SHIPPING.conditionalOverride,
                            ...(res.settings.advancedShipping?.conditionalOverride || {})
                        }
                    },
                });
            }
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateSettings({
            taxAmount: Number(form.taxAmount) || 0,
            shippingFee: Number(form.shippingFee) || 0,
            shippingMethod: form.shippingMethod,
            paymentMethods: form.paymentMethods,
            advancedShipping: form.advancedShipping,
        });
    };

    const updateAdv = (field, value) => {
        setForm(p => ({
            ...p,
            advancedShipping: { ...p.advancedShipping, [field]: value }
        }));
    };

    const updateCondition = (field, value) => {
        setForm(p => ({
            ...p,
            advancedShipping: {
                ...p.advancedShipping,
                conditionalOverride: {
                    ...p.advancedShipping.conditionalOverride,
                    [field]: value
                }
            }
        }));
    };

    const addCityRate = () => {
        setForm(p => ({
            ...p,
            advancedShipping: {
                ...p.advancedShipping,
                cityRates: [...p.advancedShipping.cityRates, { city: "", fee: 0 }]
            }
        }));
    };

    const removeCityRate = (idx) => {
        setForm(p => ({
            ...p,
            advancedShipping: {
                ...p.advancedShipping,
                cityRates: p.advancedShipping.cityRates.filter((_, i) => i !== idx)
            }
        }));
    };

    const updateCityRate = (idx, field, value) => {
        setForm(p => ({
            ...p,
            advancedShipping: {
                ...p.advancedShipping,
                cityRates: p.advancedShipping.cityRates.map((c, i) => i === idx ? { ...c, [field]: value } : c)
            }
        }));
    };

    const addPaymentMethod = () => {
        setForm(p => ({
            ...p,
            paymentMethods: [...p.paymentMethods, { title: "New Method", information: "", isActive: true, image: "", imagekitFileId: "" }]
        }));
    };

    const removePaymentMethod = (index) => {
        setForm(p => ({
            ...p,
            paymentMethods: p.paymentMethods.filter((_, i) => i !== index)
        }));
    };

    const updatePaymentMethod = (index, field, value) => {
        setForm(p => ({
            ...p,
            paymentMethods: p.paymentMethods.map((m, i) => i === index ? { ...m, [field]: value } : m)
        }));
    };

    const handleImageUpload = async (index, file) => {
        if (!file) return;
        const res = await uploadImage(file);
        if (res?.success) {
            updatePaymentMethod(index, "image", res.fileUrl);
            updatePaymentMethod(index, "imagekitFileId", res.fileId);
            toast.success("Image uploaded!");
        } else {
            toast.error("Failed to upload image");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center gap-3 pb-6 border-b border-gray-200">
                <div className="p-2.5 bg-blue-600 rounded-lg text-white shadow-sm">
                    <Receipt size={20} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Tax & Shipping Settings
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Configure default checkout settings
                    </p>
                </div>
            </header>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-6"
            >
                {/* Charges Section */}
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                        <Receipt size={16} className="text-blue-600" />
                        Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">
                                Tax Amount (Rs)
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                value={form.taxAmount}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        taxAmount: Number(e.target.value),
                                    }))
                                }
                                className="w-full"
                                disabled={settingsLoading}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">
                                Shipping Fee (Rs)
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                value={form.shippingFee}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        shippingFee: Number(e.target.value),
                                    }))
                                }
                                className="w-full"
                                disabled={settingsLoading}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </section>

                {/* Shipping Method Section */}
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                        <Truck size={16} className="text-blue-600" />
                        Shipping Calculation Rules
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Calculation Method</label>
                            <Select
                                options={[
                                    { label: "Flat Rate (Uses default shipping fee above)", value: "flat" },
                                    { label: "Distance Based (Per km from Store)", value: "distance" },
                                    { label: "Percentage Based (% of Order Total)", value: "percentage" },
                                    { label: "City Based (Specific fee per city)", value: "city_based" },
                                ]}
                                value={form.advancedShipping.calculationMethod}
                                onChange={(val) => updateAdv("calculationMethod", val)}
                                className="w-full max-w-none bg-blue-50/50 border-blue-200"
                            />
                        </div>

                        {/* Distance Based Config */}
                        {form.advancedShipping.calculationMethod === "distance" && (
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-5 animate-in fade-in">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Distance Rate (Rs per km)</label>
                                    <Input
                                        type="number"
                                        value={form.advancedShipping.distanceRatePerKm}
                                        onChange={(e) => updateAdv("distanceRatePerKm", Number(e.target.value))}
                                        className="w-full max-w-xs"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Customers will be charged this amount for every kilometer away from your store.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <MapPin size={16} className="text-blue-600" />
                                            Set Store Location (Origin point)
                                        </label>
                                        <button 
                                            type="button" 
                                            onClick={handleDetectLocation}
                                            disabled={isDetectingLocation}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isDetectingLocation ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                                            Auto-Detect My Location
                                        </button>
                                    </div>
                                    <div className="h-[300px] rounded-xl overflow-hidden border-2 border-blue-100 relative z-0">
                                        <LocationPicker
                                            position={form.advancedShipping.storeLocation}
                                            setPosition={(pos) => updateAdv("storeLocation", { lat: pos.lat, lng: pos.lng })}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Drop the pin exactly on your store's physical location.</p>
                                </div>

                                {/* Address Input */}
                                <div className="space-y-1.5 pt-2">
                                    <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <MapPin size={16} className="text-blue-600" /> Store Physical Address
                                        </span>
                                        {isFetchingAddress && <Loader2 size={12} className="animate-spin text-blue-600" />}
                                    </label>
                                    <textarea
                                        value={form.advancedShipping.storeLocation?.address || ""}
                                        onChange={(e) => updateAdv("storeLocation", { ...form.advancedShipping.storeLocation, address: e.target.value })}
                                        placeholder="Auto-filled from map or type manually..."
                                        className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none h-20 transition-all"
                                    />
                                    <p className="text-[11px] font-bold text-gray-400">
                                        * Automatically filled when you drop the pin on the map above.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Percentage Based Config */}
                        {form.advancedShipping.calculationMethod === "percentage" && (
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-4 animate-in fade-in">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Percentage Rate (%)</label>
                                    <Input
                                        type="number"
                                        value={form.advancedShipping.percentageRate}
                                        onChange={(e) => updateAdv("percentageRate", Number(e.target.value))}
                                        className="w-full max-w-xs"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Shipping fee will be calculated as this percentage of the total order value.</p>
                                </div>
                            </div>
                        )}

                        {/* City Based Config */}
                        {form.advancedShipping.calculationMethod === "city_based" && (
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-4 animate-in fade-in">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">City-Specific Rates</label>
                                    <button type="button" onClick={addCityRate} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                                        <Plus size={14} /> Add City
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {(form.advancedShipping.cityRates || []).map((cityRate, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <Select
                                                    options={allCities.map(c => ({ label: c, value: c }))}
                                                    value={cityRate.city}
                                                    onChange={(val) => updateCityRate(idx, "city", val)}
                                                    placeholder="Select City"
                                                    className="w-full h-10"
                                                />
                                            </div>
                                            <Input
                                                type="number"
                                                placeholder="Fee (Rs)"
                                                value={cityRate.fee}
                                                onChange={(e) => updateCityRate(idx, "fee", Number(e.target.value))}
                                                className="w-32"
                                            />
                                            <button type="button" onClick={() => removeCityRate(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!form.advancedShipping.cityRates || form.advancedShipping.cityRates.length === 0) && (
                                        <p className="text-xs text-gray-500 italic">No cities added. Unlisted cities will fall back to the default flat shipping fee.</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Conditional Override Config */}
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-4 mt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-semibold text-gray-900">Conditional Override</label>
                                    <p className="text-xs text-gray-500">Apply a special shipping fee based on the total order value.</p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-blue-200 rounded-lg shadow-sm">
                                    <div className={`w-8 h-4 rounded-full transition-colors relative ${form.advancedShipping.conditionalOverride.enabled ? "bg-blue-500" : "bg-gray-300"}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${form.advancedShipping.conditionalOverride.enabled ? "left-4.5" : "left-0.5"}`} style={{ left: form.advancedShipping.conditionalOverride.enabled ? '18px' : '2px' }} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{form.advancedShipping.conditionalOverride.enabled ? "On" : "Off"}</span>
                                    <input
                                        type="checkbox"
                                        checked={form.advancedShipping.conditionalOverride.enabled}
                                        onChange={(e) => updateCondition("enabled", e.target.checked)}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {form.advancedShipping.conditionalOverride.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in pt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">If Order Total is</label>
                                        <Select
                                            options={[
                                                { label: "Greater Than (>)", value: "greater_than" },
                                                { label: "Less Than (<)", value: "less_than" },
                                            ]}
                                            value={form.advancedShipping.conditionalOverride.operator}
                                            onChange={(val) => updateCondition("operator", val)}
                                            className="w-full max-w-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">Amount (Rs)</label>
                                        <Input
                                            type="number"
                                            value={form.advancedShipping.conditionalOverride.orderValueThreshold}
                                            onChange={(e) => updateCondition("orderValueThreshold", Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">Set Shipping Fee to (Rs)</label>
                                        <Input
                                            type="number"
                                            value={form.advancedShipping.conditionalOverride.overrideFee}
                                            onChange={(e) => updateCondition("overrideFee", Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Payment Methods Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <CreditCard size={16} className="text-blue-600" />
                            Payment Methods
                        </h3>
                        <button
                            type="button"
                            onClick={addPaymentMethod}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus size={14} /> Add Method
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(form.paymentMethods || []).map((method, index) => (
                            <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4 relative">
                                <button
                                    type="button"
                                    onClick={() => removePaymentMethod(index)}
                                    className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1 bg-white rounded shadow-sm border border-gray-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mr-10">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">Method Title</label>
                                        <Input
                                            type="text"
                                            value={method.title}
                                            onChange={(e) => updatePaymentMethod(index, "title", e.target.value)}
                                            placeholder="e.g. Credit Card, JazzCash..."
                                            className="w-full text-sm py-2"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">Information / Details</label>
                                        <Input
                                            type="text"
                                            value={method.information}
                                            onChange={(e) => updatePaymentMethod(index, "information", e.target.value)}
                                            placeholder="e.g. Visa, MasterCard..."
                                            className="w-full text-sm py-2"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-10 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center shrink-0">
                                            {method.image ? (
                                                <img src={method.image} alt={method.title} className="w-full h-full object-contain" />
                                            ) : (
                                                <ImageIcon size={20} className="text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2">
                                                {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : "Upload Logo"}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(index, e.target.files[0])}
                                                />
                                            </label>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                Rec: 120 × 60 px (PNG/SVG)
                                            </span>
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-sm">
                                        <div className={`w-8 h-4 rounded-full transition-colors relative ${method.isActive ? "bg-green-500" : "bg-gray-300"}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${method.isActive ? "left-4.5" : "left-0.5"}`} style={{ left: method.isActive ? '18px' : '2px' }} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{method.isActive ? "Active" : "Hidden"}</span>
                                        <input
                                            type="checkbox"
                                            checked={method.isActive}
                                            onChange={(e) => updatePaymentMethod(index, "isActive", e.target.checked)}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}
                        
                        {(!form.paymentMethods || form.paymentMethods.length === 0) && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                                <p className="text-sm text-gray-500">No custom payment methods added.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={updateLoading || settingsLoading}
                        className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {updateLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TaxShippingSettings;