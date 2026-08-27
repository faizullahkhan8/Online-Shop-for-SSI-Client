import { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    ShoppingBag,
    Save,
    Loader2,
    Truck,
    CreditCard,
    Hash,
    User,
    Receipt,
} from "lucide-react";
import Input from "../../UI/Input.jsx";
import Select from "../../UI/Select.jsx";
import { useGetAllProducts } from "../../api/hooks/product.api.js";
import { usePlaceOrder } from "../../api/hooks/orders.api.js";
import { useGetAllUsers } from "../../api/hooks/user.api.js";
import { useNavigate } from "react-router-dom";

const AddOrderPage = () => {
    const { getAllProducts, loading: productsLoading } = useGetAllProducts();
    const { placeOrder, loading: orderLoading } = usePlaceOrder();
    const { getAllUsers, loading: usersLoading } = useGetAllUsers();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [orderData, setOrderData] = useState({
        userId: "",
        items: [
            {
                product: "",
                quantity: 1,
                originalPrice: 0,
                discount: 0,
                price: 0,
                totalAmount: 0,
            },
        ],
        recipient: {
            name: "",
            street: "",
            addressLine2: "",
            city: "",
            state: "",
            postalCode: "",
            country: "",
            phone: "",
        },
        payment: { method: "COD", ispaid: false },
        taxAmount: 0,
        shippingFee: 0,
        shippingMethod: "standard",
        grandTotal: 0,
        status: "pending",
    });

    const itemsSubtotal = orderData.items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
    );
    const taxAmount = Number(orderData.taxAmount) || 0;
    const shippingFee = Number(orderData.shippingFee) || 0;
    const grandTotal = itemsSubtotal + taxAmount + shippingFee;

    const addItem = () => {
        setOrderData({
            ...orderData,
            items: [
                ...orderData.items,
                {
                    product: "",
                    quantity: 1,
                    originalPrice: 0,
                    discount: 0,
                    price: 0,
                    totalAmount: 0,
                },
            ],
        });
    };

    const removeItem = (index) => {
        const newItems = orderData.items.filter((_, i) => i !== index);
        setOrderData({ ...orderData, items: newItems });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...orderData.items];
        const item = { ...newItems[index] };

        if (field === "product") {
            const selectedProd = products.find((p) => p._id === value);
            item.product = value;
            item.originalPrice = selectedProd?.price || 0;
            if (selectedProd?.effectivePrice < selectedProd?.price) {
                item.discount = selectedProd.price - selectedProd.effectivePrice;
                item.price = selectedProd.effectivePrice;
            } else {
                item.discount = 0;
                item.price = selectedProd?.price || 0;
            }
        } else if (field === "price") {
            item.price = value;
            item.discount = item.originalPrice - value;
        } else if (field === "discount") {
            item.discount = value;
            item.price = item.originalPrice - value;
        } else {
            item[field] = value;
        }

        item.totalAmount =
            (Number(item.price) || 0) * (Number(item.quantity) || 0);
        newItems[index] = item;
        setOrderData({ ...orderData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalItems = orderData.items.map((item) => ({
            ...item,
            totalAmount:
                (Number(item.price) || 0) * (Number(item.quantity) || 0),
        }));
        const finalData = {
            ...orderData,
            items: finalItems,
            grandTotal,
        };
        const response = await placeOrder(finalData);
        if (response.success) {
            navigate("/admin-dashboard?tab=orders-list");
        }
    };

    useEffect(() => {
        getAllProducts().then((res) => {
            setProducts(res.products);
        });
        getAllUsers().then((res) => {
            setUsers(res.users || []);
        });
    }, []);

    const handleUserSelect = (value) => {
        const selectedUser = users.find((u) => u._id === value);
        setOrderData((prev) => ({
            ...prev,
            userId: value,
            recipient: {
                ...prev.recipient,
                name: selectedUser?.name || prev.recipient.name,
                phone: selectedUser?.phone || prev.recipient.phone,
                street:
                    selectedUser?.addresses?.[0]?.street ||
                    prev.recipient.street,
                addressLine2:
                    selectedUser?.addresses?.[0]?.addressLine2 ||
                    prev.recipient.addressLine2,
                city:
                    selectedUser?.addresses?.[0]?.city || prev.recipient.city,
                state:
                    selectedUser?.addresses?.[0]?.state || prev.recipient.state,
                postalCode:
                    selectedUser?.addresses?.[0]?.postalCode ||
                    prev.recipient.postalCode,
                country:
                    selectedUser?.addresses?.[0]?.country ||
                    prev.recipient.country,
            },
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-gray-200">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600 rounded-lg text-white">
                            <ShoppingBag size={20} />
                        </div>
                        Create Manual Order
                    </h2>
                    <p className="text-sm text-gray-500 ml-11">
                        Add a new order directly to the system
                    </p>
                </div>

                <div className="bg-blue-600 rounded-lg p-4 min-w-[240px] shadow-sm">
                    <p className="text-xs font-medium text-blue-100 mb-1">
                        Grand Total
                    </p>
                    <p className="text-2xl font-bold text-white">
                        Rs {grandTotal.toLocaleString()}
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Left Column - Order Items */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Hash size={16} className="text-blue-600" />
                                Order Items
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {orderData.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-3 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                >
                                    <div className="col-span-3 space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">
                                            Product
                                        </label>
                                        <Select
                                            disabled={productsLoading}
                                            options={products?.map((p) => ({
                                                label: p.name,
                                                value: p._id,
                                            }))}
                                            value={item.product}
                                            placeholder="Select product"
                                            onChange={(val) =>
                                                updateItem(index, "product", val)
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">
                                            Original Price
                                        </label>
                                        <div className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-500">
                                            Rs {item.originalPrice}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">
                                            Discount
                                        </label>
                                        <Input
                                            type="number"
                                            value={item.discount}
                                            onChange={(e) =>
                                                updateItem(
                                                    index,
                                                    "discount",
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">
                                            Price
                                        </label>
                                        <Input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) =>
                                                updateItem(
                                                    index,
                                                    "price",
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-700">
                                            Quantity
                                        </label>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateItem(
                                                    index,
                                                    "quantity",
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-medium text-gray-700">
                                            Subtotal
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2">
                                            Rs {(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            Add Item
                        </button>
                    </div>
                </div>

                {/* Right Column - Customer & Details */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-6">
                        {/* Customer Section */}
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-200">
                                <User size={16} className="text-blue-600" />
                                Customer
                            </h3>
                            <Select
                                disabled={usersLoading}
                                options={users?.map((u) => ({
                                    label: `${u.name} (${u.email})`,
                                    value: u._id,
                                }))}
                                value={orderData.userId}
                                placeholder="Select customer"
                                onChange={handleUserSelect}
                                className="w-full max-w-none"
                            />
                        </section>

                        {/* Shipping Address Section */}
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-200">
                                <Truck size={16} className="text-blue-600" />
                                Shipping Address
                            </h3>
                            <Input
                                placeholder="Recipient name"
                                value={orderData.recipient.name}
                                onChange={(e) =>
                                    setOrderData({
                                        ...orderData,
                                        recipient: {
                                            ...orderData.recipient,
                                            name: e.target.value,
                                        },
                                    })
                                }
                                className="w-full"
                            />
                            <Input
                                placeholder="Street address"
                                value={orderData.recipient.street}
                                onChange={(e) =>
                                    setOrderData({
                                        ...orderData,
                                        recipient: {
                                            ...orderData.recipient,
                                            street: e.target.value,
                                        },
                                    })
                                }
                                className="w-full"
                            />
                            <Input
                                placeholder="Apartment, suite, etc. (optional)"
                                value={orderData.recipient.addressLine2}
                                onChange={(e) =>
                                    setOrderData({
                                        ...orderData,
                                        recipient: {
                                            ...orderData.recipient,
                                            addressLine2: e.target.value,
                                        },
                                    })
                                }
                                className="w-full"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    placeholder="City"
                                    value={orderData.recipient.city}
                                    onChange={(e) =>
                                        setOrderData({
                                            ...orderData,
                                            recipient: {
                                                ...orderData.recipient,
                                                city: e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full"
                                />
                                <Input
                                    placeholder="Phone"
                                    value={orderData.recipient.phone}
                                    onChange={(e) =>
                                        setOrderData({
                                            ...orderData,
                                            recipient: {
                                                ...orderData.recipient,
                                                phone: e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    placeholder="State/Province"
                                    value={orderData.recipient.state}
                                    onChange={(e) =>
                                        setOrderData({
                                            ...orderData,
                                            recipient: {
                                                ...orderData.recipient,
                                                state: e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full"
                                />
                                <Input
                                    placeholder="Postal code"
                                    value={orderData.recipient.postalCode}
                                    onChange={(e) =>
                                        setOrderData({
                                            ...orderData,
                                            recipient: {
                                                ...orderData.recipient,
                                                postalCode: e.target.value,
                                            },
                                        })
                                    }
                                    className="w-full"
                                />
                            </div>
                            <Input
                                placeholder="Country"
                                value={orderData.recipient.country}
                                onChange={(e) =>
                                    setOrderData({
                                        ...orderData,
                                        recipient: {
                                            ...orderData.recipient,
                                            country: e.target.value,
                                        },
                                    })
                                }
                                className="w-full"
                            />
                        </section>

                        {/* Payment Section */}
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-200">
                                <CreditCard size={16} className="text-blue-600" />
                                Payment
                            </h3>
                            <Select
                                options={[
                                    { label: "Cash on Delivery", value: "COD" },
                                    { label: "Online Payment", value: "online" },
                                    { label: "Card Payment", value: "card" },
                                    { label: "Bank Transfer", value: "bank" },
                                    { label: "Mobile Wallet", value: "wallet" },
                                ]}
                                value={orderData.payment.method}
                                onChange={(val) =>
                                    setOrderData({
                                        ...orderData,
                                        payment: {
                                            ...orderData.payment,
                                            method: val,
                                        },
                                    })
                                }
                                className="w-full max-w-none"
                            />
                            {orderData.payment.method !== "COD" && (
                                <label className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={orderData.payment.ispaid}
                                        onChange={(e) =>
                                            setOrderData({
                                                ...orderData,
                                                payment: {
                                                    ...orderData.payment,
                                                    ispaid: e.target.checked,
                                                },
                                            })
                                        }
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        Payment received
                                    </span>
                                </label>
                            )}
                        </section>

                        {/* Shipping & Fees Section */}
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-200">
                                <Receipt size={16} className="text-blue-600" />
                                Shipping & Fees
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">
                                        Tax Amount
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={orderData.taxAmount}
                                        onChange={(e) =>
                                            setOrderData({
                                                ...orderData,
                                                taxAmount: Number(e.target.value),
                                            })
                                        }
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-700">
                                        Shipping Fee
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={orderData.shippingFee}
                                        onChange={(e) =>
                                            setOrderData({
                                                ...orderData,
                                                shippingFee: Number(e.target.value),
                                            })
                                        }
                                        className="w-full"
                                    />
                                </div>
                            </div>
                            <Select
                                options={[
                                    { label: "Standard Shipping", value: "standard" },
                                    { label: "Express Shipping", value: "express" },
                                    { label: "Store Pickup", value: "pickup" },
                                ]}
                                value={orderData.shippingMethod}
                                onChange={(val) =>
                                    setOrderData({
                                        ...orderData,
                                        shippingMethod: val,
                                    })
                                }
                                className="w-full max-w-none"
                            />

                            {/* Order Summary */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span>Items Subtotal</span>
                                    <span className="font-medium">Rs {itemsSubtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span>Tax</span>
                                    <span className="font-medium">Rs {taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span>Shipping</span>
                                    <span className="font-medium">Rs {shippingFee.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                                    <span>Grand Total</span>
                                    <span>Rs {grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </section>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={orderLoading}
                            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {orderLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Creating order...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Create Order
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default AddOrderPage;