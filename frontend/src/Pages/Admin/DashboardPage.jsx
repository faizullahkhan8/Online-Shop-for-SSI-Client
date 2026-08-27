import { useState } from "react";
import { useDashboardStats } from "../../api/hooks/dashboard.api";
import {
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    TrendingUp,
    ArrowUpRight,
    Loader2,
    AlertCircle,
    Calendar,
    ChevronDown,
} from "lucide-react";
import DashboardCharts from "../../Components/Admin/DashboardCharts";
import InventoryAlerts from "../../Components/Admin/InventoryAlerts";
import {
    getDateRangeFromPreset,
    formatDateRange,
    formatDateForInput,
} from "../../utils/dateHelpers";
import Select from "../../UI/Select";
import Input from "../../UI/Input";
import Button from "../../UI/Button";

const DATE_PRESETS = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last 30 Days", value: "last30days" },
    { label: "This Month", value: "thismonth" },
    { label: "Last Month", value: "lastmonth" },
    { label: "Custom Range", value: "custom" },
];

const DashboardHome = () => {
    const [datePreset, setDatePreset] = useState("today");
    const [dateRange, setDateRange] = useState(() =>
        getDateRangeFromPreset("last30days"),
    );
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [customDates, setCustomDates] = useState({
        start: formatDateForInput(new Date()),
        end: formatDateForInput(new Date()),
    });

    const { stats, loading, error } = useDashboardStats({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
    });

    const handlePresetChange = (value) => {
        setDatePreset(value);

        if (value === "custom") {
            setShowCustomPicker(true);
        } else {
            setShowCustomPicker(false);
            const newRange = getDateRangeFromPreset(value);
            setDateRange(newRange);
        }
    };

    const applyCustomRange = () => {
        const startDate = new Date(customDates.start);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(customDates.end);
        endDate.setHours(23, 59, 59, 999);

        setDateRange({ startDate, endDate });
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-gray-400">
                <Loader2
                    className="animate-spin mb-4 text-blue-600"
                    size={32}
                />
                <p className="text-sm font-medium text-gray-500">
                    Loading dashboard...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-red-400">
                <AlertCircle className="mb-4" size={32} />
                <p className="text-sm font-semibold text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <header
                className={`flex flex-col justify-between gap-4 ${showCustomPicker ? "flex-col" : "flex-row"}`}
            >
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Dashboard Overview
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Welcome back, Admin!
                    </p>
                </div>

                {/* Date Range Selector */}
                <div className="flex flex-col gap-3 w-max">
                    <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 w-[350px]">
                            <Calendar size={16} className="text-gray-500" />
                            <span className="text-xs font-medium text-gray-600">
                                {formatDateRange(
                                    dateRange.startDate,
                                    dateRange.endDate,
                                )}
                            </span>
                        </div>

                        <Select
                            value={datePreset}
                            onChange={handlePresetChange}
                            options={DATE_PRESETS}
                            className="min-w-[140px]"
                        />
                    </div>

                    {/* Custom Date Picker */}
                    {showCustomPicker && (
                        <div className="flex gap-2 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <Input
                                type="date"
                                value={customDates.start}
                                onChange={(e) =>
                                    setCustomDates({
                                        ...customDates,
                                        start: e.target.value,
                                    })
                                }
                                className="text-sm"
                            />
                            <span className="text-gray-400 text-sm">to</span>
                            <Input
                                type="date"
                                value={customDates.end}
                                onChange={(e) =>
                                    setCustomDates({
                                        ...customDates,
                                        end: e.target.value,
                                    })
                                }
                                className="text-sm"
                            />
                            <Button
                                onClick={applyCustomRange}
                                className="whitespace-nowrap"
                            >
                                Apply
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    label="Total Revenue"
                    value={`Rs ${stats?.totalSales?.toLocaleString() ?? 0}`}
                    icon={<DollarSign size={20} />}
                    trend="+12.5%"
                    color="primary"
                />
                <StatCard
                    label="Orders"
                    value={stats?.totalOrders ?? 0}
                    icon={<ShoppingCart size={20} />}
                    trend="+5.2%"
                    color="gray"
                />
                <StatCard
                    label="Inventory"
                    value={stats?.totalProducts ?? 0}
                    icon={<Package size={20} />}
                    trend="Stable"
                    color="gray"
                />
                <StatCard
                    label="Active Users"
                    value={stats?.totalUsers ?? 0}
                    icon={<Users size={20} />}
                    trend="+2.1%"
                    color="gray"
                />
            </div>

            {/* Inventory Alerts */}
            <InventoryAlerts inventory={stats?.inventory} />

            {/* Charts */}
            <DashboardCharts stats={stats} />
        </div>
    );
};

const StatCard = ({ label, value, icon, trend, color }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-5">
            <div
                className={`p-2.5 rounded-lg ${
                    color === "primary"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
                }`}
            >
                {icon}
            </div>
            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                <span className="text-xs font-semibold">{trend}</span>
                <ArrowUpRight size={12} />
            </div>
        </div>
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
    </div>
);

export default DashboardHome;
