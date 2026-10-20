import { useAddressLookup } from "../../hooks/useAddressLookup.js";
import { QueryError } from "../../UI/QueryState";
import { FormField, FieldLabel, FieldControl } from "../../UI/FormField";
import { useEffect, useState } from "react";
import { Truck, Receipt, Save, Loader2, CreditCard, Plus, Trash2, Image as ImageIcon, MapPin } from "lucide-react";
import Input from "../../UI/Input.jsx";
import Select from "../../UI/Select.jsx";
import { useGetSettings, useUpdateSettings, useSmsTools } from "../../api/hooks/settings.api";
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
    const { data: settingsData, loading: settingsLoading, error: queryError } = useGetSettings({ admin: true });
    const { updateSettings, loading: updateLoading } = useUpdateSettings();
    const { attempts, attemptsError, sendTest, testing } = useSmsTools();
    const [testPhone, setTestPhone] = useState("");
    const { uploadImage, loading: uploadingImage } = useUploadHomePageImage();

    const [form, setForm] = useState({
        taxAmount: 0,
        shippingFee: 0,
        shippingMethod: "standard",
        paymentMethods: [],
        advancedShipping: DEFAULT_ADV_SHIPPING,
        smsProvider: "sms_gate",
        smsFields: {},
    });

    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    const handleDetectLocation = () => {
        setIsDetectingLocation(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    updateAdv("storeLocation", { ...form.advancedShipping.storeLocation, lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setIsDetectingLocation(false);
                    toast.success("Location successfully updated!");
                },
                (err) => {
                    console.error("Location access denied", err);
                    toast.error("Please allow location access to auto-detect.");
                    setIsDetectingLocation(false);
                }, { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
            );
        } else {
            toast.error("Geolocation is not supported by your browser");
            setIsDetectingLocation(false);
        }
    };

    const isFetchingAddress = useAddressLookup({ position: form.advancedShipping?.storeLocation,
        text: form.advancedShipping?.storeLocation?.address || "",
        savedPosition: settingsData?.settings?.advancedShipping?.storeLocation || DEFAULT_ADV_SHIPPING.storeLocation,
        savedText: settingsData?.settings?.advancedShipping?.storeLocation?.address || "",
        onPosition: pos => setForm(prev => ({ ...prev, advancedShipping: { ...prev.advancedShipping, storeLocation: { ...prev.advancedShipping.storeLocation, ...pos } } })),
        onAddress: data => setForm(prev => ({ ...prev, advancedShipping: { ...prev.advancedShipping, storeLocation: { ...prev.advancedShipping.storeLocation, address: data.display_name } } })) });

    useEffect(() => {
        if (settingsData?.settings) {
            setForm({
                taxAmount: Number(settingsData.settings.taxAmount) || 0,
                shippingFee: Number(settingsData.settings.shippingFee) || 0,
                shippingMethod: settingsData.settings.shippingMethod || "standard",
                paymentMethods: settingsData.settings.paymentMethods || [],
                advancedShipping: {
                    ...DEFAULT_ADV_SHIPPING,
                    ...(settingsData.settings.advancedShipping || {}),
                    storeLocation: {
                        ...DEFAULT_ADV_SHIPPING.storeLocation,
                        ...(settingsData.settings.advancedShipping?.storeLocation || {})
                    },
                    conditionalOverride: {
                        ...DEFAULT_ADV_SHIPPING.conditionalOverride,
                        ...(settingsData.settings.advancedShipping?.conditionalOverride || {})
                    }
                },
                smsProvider: settingsData.settings.smsProvider || "sms_gate",
                smsFields: Object.fromEntries((settingsData.settings.smsProviders || []).map(provider => [provider.id,
                    Object.fromEntries(provider.fields.map(field => [field.key, field.secret ? "" : settingsData.settings.smsConfigurations?.[provider.id]?.values?.[field.key] || ""]))])),
            });
        }
    }, [settingsData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await updateSettings({
            taxAmount: Number(form.taxAmount) || 0,
            shippingFee: Number(form.shippingFee) || 0,
            shippingMethod: form.shippingMethod,
            paymentMethods: form.paymentMethods,
            advancedShipping: form.advancedShipping,
            smsProvider: form.smsProvider,
            smsConfiguration: form.smsFields[form.smsProvider] || {},
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

    if (queryError) return <QueryError />;

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center gap-3 pb-6 border-b border-gray-200">
                <div className="p-2.5 bg-primary rounded-lg text-white shadow-sm">
                    <Receipt size={20} />
                </div>
                <div>
                    <h2 className="text-3xl font-display text-gray-900">
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
                className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm transition-colors duration-200 space-y-6"
            >
                {/* Charges Section */}
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                        <Receipt size={16} className="text-primary" />
                        Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField className="space-y-1.5">
                            <FieldLabel className="text-sm font-medium text-gray-700">
                                Tax Amount (Rs)
                            </FieldLabel>
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
                        </FormField>
                        <FormField className="space-y-1.5">
                            <FieldLabel className="text-sm font-medium text-gray-700">
                                Shipping Fee (Rs)
                            </FieldLabel>
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
                        </FormField>
                    </div>
                </section>

                {/* Shipping Method Section */}
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                        <Truck size={16} className="text-primary" />
                        Shipping Calculation Rules
                    </h3>

                    <div className="space-y-6">
                        <FormField className="space-y-1.5">
                            <FieldLabel className="text-sm font-medium text-gray-700">Calculation Method</FieldLabel>
                            <Select
                                options={[
                                    { label: "Flat Rate (Uses default shipping fee above)", value: "flat" },
                                    { label: "Distance Based (Per km from Store)", value: "distance" },
                                    { label: "Percentage Based (% of Order Total)", value: "percentage" },
                                    { label: "City Based (Specific fee per city)", value: "city_based" },
                                ]}
                                value={form.advancedShipping.calculationMethod}
                                onChange={(val) => updateAdv("calculationMethod", val)}
                                className="w-full max-w-none bg-primary-pale/50 border-primary-light"
                            />
                        </FormField>

                        {/* Distance Based Config */}
                        {form.advancedShipping.calculationMethod === "distance" && (
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-5 animate-in fade-in">
                                <FormField className="space-y-1.5">
                                    <FieldLabel className="text-sm font-medium text-gray-700">Distance Rate (Rs per km)</FieldLabel>
                                    <Input
                                        type="number"
                                        value={form.advancedShipping.distanceRatePerKm}
                                        onChange={(e) => updateAdv("distanceRatePerKm", Number(e.target.value))}
                                        className="w-full max-w-xs"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Customers will be charged this amount for every kilometer away from your store.</p>
                                </FormField>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <MapPin size={16} className="text-primary" />
                                            Set Store Location (Origin point)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleDetectLocation}
                                            disabled={isDetectingLocation}
                                            className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1 bg-primary-pale hover:bg-primary-light px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {isDetectingLocation ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                                            Auto-Detect My Location
                                        </button>
                                    </div>
                                    <div className="h-[300px] rounded-xl overflow-hidden border-2 border-blue-100 relative z-0">
                                        <LocationPicker
                                            position={form.advancedShipping.storeLocation}
                                            setPosition={(pos) => updateAdv("storeLocation", { ...form.advancedShipping.storeLocation, lat: pos.lat, lng: pos.lng })}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Drop the pin exactly on your store's physical location.</p>
                                </div>

                                {/* Address Input */}
                                <FormField className="space-y-1.5 pt-2">
                                    <FieldLabel className="text-sm font-medium text-gray-700 flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <MapPin size={16} className="text-primary" /> Store Physical Address
                                        </span>
                                        {isFetchingAddress && <Loader2 size={12} className="animate-spin text-primary" />}
                                    </FieldLabel>
                                    <FieldControl as="textarea"
                                        value={form.advancedShipping.storeLocation?.address || ""}
                                        onChange={(e) => updateAdv("storeLocation", { ...form.advancedShipping.storeLocation, address: e.target.value })}
                                        placeholder="Auto-filled from map or type manually..."
                                        className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none h-20 transition-all"
                                    />
                                    <p className="text-xs font-bold text-gray-400">
                                        * Automatically filled when you drop the pin on the map above.
                                    </p>
                                </FormField>
                            </div>
                        )}

                        {/* Percentage Based Config */}
                        {form.advancedShipping.calculationMethod === "percentage" && (
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-4 animate-in fade-in">
                                <FormField className="space-y-1.5">
                                    <FieldLabel className="text-sm font-medium text-gray-700">Percentage Rate (%)</FieldLabel>
                                    <Input
                                        type="number"
                                        value={form.advancedShipping.percentageRate}
                                        onChange={(e) => updateAdv("percentageRate", Number(e.target.value))}
                                        className="w-full max-w-xs"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Shipping fee will be calculated as this percentage of the total order value.</p>
                                </FormField>
                            </div>
                        )}

                        {/* City Based Config */}
                        {form.advancedShipping.calculationMethod === "city_based" && (
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-4 animate-in fade-in">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700">City-Specific Rates</label>
                                    <button type="button" onClick={addCityRate} className="text-xs text-primary hover:text-primary-dark font-semibold flex items-center gap-1">
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
                                            <button aria-label="Delete item" type="button" onClick={() => removeCityRate(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded">
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
                        <div className="bg-primary-pale/50 border border-blue-100 p-4 rounded-xl space-y-4 mt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-semibold text-gray-900">Conditional Override</label>
                                    <p className="text-xs text-gray-500">Apply a special shipping fee based on the total order value.</p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 border border-primary-light rounded-lg shadow-sm">
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
                                    <FormField className="space-y-1.5">
                                        <FieldLabel className="text-xs font-medium text-gray-700">If Order Total is</FieldLabel>
                                        <Select
                                            options={[
                                                { label: "Greater Than (>)", value: "greater_than" },
                                                { label: "Less Than (<)", value: "less_than" },
                                            ]}
                                            value={form.advancedShipping.conditionalOverride.operator}
                                            onChange={(val) => updateCondition("operator", val)}
                                            className="w-full max-w-none"
                                        />
                                    </FormField>
                                    <FormField className="space-y-1.5">
                                        <FieldLabel className="text-xs font-medium text-gray-700">Amount (Rs)</FieldLabel>
                                        <Input
                                            type="number"
                                            value={form.advancedShipping.conditionalOverride.orderValueThreshold}
                                            onChange={(e) => updateCondition("orderValueThreshold", Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </FormField>
                                    <FormField className="space-y-1.5">
                                        <FieldLabel className="text-xs font-medium text-gray-700">Set Shipping Fee to (Rs)</FieldLabel>
                                        <Input
                                            type="number"
                                            value={form.advancedShipping.conditionalOverride.overrideFee}
                                            onChange={(e) => updateCondition("overrideFee", Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </FormField>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Payment Methods Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <CreditCard size={16} className="text-primary" />
                            Payment Methods
                        </h3>
                        <button
                            type="button"
                            onClick={addPaymentMethod}
                            className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1 bg-primary-pale hover:bg-primary-light px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus size={14} /> Add Method
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(form.paymentMethods || []).map((method, index) => (
                            <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4 relative">
                                <button aria-label="Delete item"
                                    type="button"
                                    onClick={() => removePaymentMethod(index)}
                                    className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-1 bg-white rounded shadow-sm border border-gray-100"
                                >
                                    <Trash2 size={14} />
                                </button>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mr-10">
                                    <FormField className="space-y-1.5">
                                        <FieldLabel className="text-xs font-medium text-gray-700">Method Title</FieldLabel>
                                        <Input
                                            type="text"
                                            value={method.title}
                                            onChange={(e) => updatePaymentMethod(index, "title", e.target.value)}
                                            placeholder="e.g. Credit Card, JazzCash..."
                                            className="w-full text-sm py-2"
                                        />
                                    </FormField>
                                    <FormField className="space-y-1.5">
                                        <FieldLabel className="text-xs font-medium text-gray-700">Information / Details</FieldLabel>
                                        <Input
                                            type="text"
                                            value={method.information}
                                            onChange={(e) => updatePaymentMethod(index, "information", e.target.value)}
                                            placeholder="e.g. Visa, MasterCard..."
                                            className="w-full text-sm py-2"
                                        />
                                    </FormField>
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
                                            <span className="text-xs text-gray-400 font-medium">
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

                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <MessageSquare size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">SMS Service</h2>
                            <p className="text-sm text-gray-500 font-medium">Test your configuration, then save to activate it. Saved passwords stay private.</p>
                        </div>
                    </div>

                    <FormField className="space-y-1.5">
                        <FieldLabel>SMS provider</FieldLabel>
                        <Select value={form.smsProvider} onChange={smsProvider => setForm(p => ({ ...p, smsProvider }))}
                            options={(settingsData?.settings?.smsProviders || []).map(provider => ({ label: provider.label, value: provider.id }))} />
                        <p className="text-xs text-gray-500">Active service: {settingsData?.settings?.smsProviders?.find(p => p.id === settingsData.settings.smsProvider)?.label || settingsData?.settings?.smsProvider || "SMS Gateway"}. Switching back keeps each service's saved credentials.</p>
                    </FormField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {(settingsData?.settings?.smsProviders?.find(provider => provider.id === form.smsProvider)?.fields || []).map(field =>
                            <FormField key={`${form.smsProvider}-${field.key}`} className="space-y-1.5">
                                <FieldLabel>{field.label}{field.required ? " *" : ""}</FieldLabel>
                                <Input type={field.secret ? "password" : "text"} autoComplete={field.secret ? "new-password" : "off"}
                                    value={form.smsFields[form.smsProvider]?.[field.key] || ""}
                                    onChange={e => setForm(p => ({ ...p, smsFields: { ...p.smsFields,
                                        [p.smsProvider]: { ...p.smsFields[p.smsProvider], [field.key]: e.target.value } } }))} />
                                {field.secret && <p className="text-xs text-gray-500">{settingsData?.settings?.smsConfigurations?.[form.smsProvider]?.configured?.[field.key]
                                    ? "A secret is saved. Leave blank to keep it." : "Enter your provider credential. It will be stored encrypted."}</p>}
                            </FormField>)}
                    </div>
                    <div className="border-t border-gray-100 pt-5 space-y-3">
                        <FormField className="space-y-1.5">
                            <FieldLabel>Test recipient phone</FieldLabel>
                            <Input type="tel" value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="03001234567 or +923001234567" />
                        </FormField>
                        <p className="text-xs text-gray-500">Sends one real test SMS using the selected configuration. Provider charges may apply. Wait one minute between tests.</p>
                        <button type="button" disabled={testing || updateLoading || settingsLoading || !testPhone.trim()}
                            className="min-h-11 rounded-xl border border-primary px-4 font-semibold text-primary disabled:opacity-50"
                            onClick={() => sendTest({ phone: testPhone, configuration: {
                                smsProvider: form.smsProvider, smsConfiguration: form.smsFields[form.smsProvider] || {},
                            } })}>{testing ? "Sending test…" : "Send test SMS"}</button>
                    </div>
                    <div className="border-t border-gray-100 pt-5">
                        <h3 className="font-semibold text-gray-900">Recent SMS attempts</h3>
                        <p className="text-xs text-gray-500 mt-1">Accepted means the provider received the request; phone delivery is not confirmed. Unknown outcomes are never retried automatically.</p>
                        {attemptsError ? <p role="alert" className="text-sm text-red-700 mt-3">Could not load SMS attempts.</p> : attempts.length ? <ul className="mt-3 divide-y divide-gray-100">
                            {attempts.map(attempt => <li key={attempt._id} className="py-3 text-sm break-words">
                                <span className="font-semibold">{settingsData?.settings?.smsProviders?.find(provider => provider.id === attempt.provider)?.label || attempt.provider} · {attempt.status}</span>
                                <p className="text-gray-500">{attempt.eventName} · {new Date(attempt.createdAt).toLocaleString()}</p>
                                {attempt.messageId && <p className="text-gray-500">Message ID: {attempt.messageId}</p>}
                                {attempt.errorCode && <p className="text-gray-500">{attempt.errorCode}</p>}
                            </li>)}
                        </ul> : <p className="text-sm text-gray-500 mt-3">No SMS attempts recorded yet.</p>}
                    </div>
                </section>

                {/* Submit Button */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={updateLoading || settingsLoading}
                        className="w-full bg-primary text-white rounded-lg py-3 font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
