import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";

const COLORS = [
    "#2563eb",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#6366f1",
];

const DashboardCharts = ({ stats }) => {
    if (!stats) return null;

    const { dailySales, categoryStats, orderStatusStats } = stats;

    // Formatting daily sales for the chart
    const revenueData =
        dailySales?.map((item) => ({
            date: new Date(item._id).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
            }),
            revenue: item.total,
        })) || [];

    const categoryData =
        categoryStats?.map((item) => ({
            name: item.name,
            sales: item.totalSold,
            products: item.count,
        })) || [];

    const statusData =
        orderStatusStats?.map((item) => ({
            name:
                item._id.charAt(0).toUpperCase() +
                item._id.slice(1).toLowerCase(),
            value: item.count,
        })) || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Revenue Area Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-6">
                    Revenue Trends (Last 30 Days)
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient
                                    id="colorRev"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#2563eb"
                                        stopOpacity={0.1}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#2563eb"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e5e7eb"
                            />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "#6b7280",
                                    fontSize: 12,
                                    fontWeight: 500,
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "#6b7280",
                                    fontSize: 12,
                                    fontWeight: 500,
                                }}
                                tickFormatter={(value) => `Rs ${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1f2937",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    boxShadow:
                                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                itemStyle={{
                                    color: "#fff",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                }}
                                labelStyle={{
                                    color: "#9ca3af",
                                    fontSize: "12px",
                                    fontWeight: 500,
                                    marginBottom: "4px",
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#2563eb"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRev)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Performance Bar Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-6">
                    Category Performance
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e5e7eb"
                            />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "#6b7280",
                                    fontSize: 12,
                                    fontWeight: 500,
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "#6b7280",
                                    fontSize: 12,
                                    fontWeight: 500,
                                }}
                            />
                            <Tooltip
                                cursor={{ fill: "#f9fafb" }}
                                contentStyle={{
                                    backgroundColor: "#1f2937",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    boxShadow:
                                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                itemStyle={{
                                    color: "#fff",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                }}
                            />
                            <Bar
                                dataKey="sales"
                                fill="#2563eb"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Order Status Pie Chart */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-6">
                    Order Status Breakdown
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1f2937",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#fff",
                                    boxShadow:
                                        "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                itemStyle={{
                                    color: "#fff",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                    {statusData.map((entry, index) => (
                        <div
                            key={entry.name}
                            className="flex items-center gap-2"
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor:
                                        COLORS[index % COLORS.length],
                                }}
                            />
                            <span className="text-xs font-medium text-gray-600">
                                {entry.name} ({entry.value})
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-5">
                <div className="bg-gray-900 p-6 rounded-lg flex flex-col justify-center">
                    <span className="text-xs font-medium text-gray-400 mb-2">
                        Avg Order Value
                    </span>
                    <h4 className="text-2xl font-bold text-white">
                        Rs{" "}
                        {stats?.totalOrders > 0
                            ? (stats?.totalSales / stats?.totalOrders)
                                  .toFixed(0)
                                  .toLocaleString()
                            : 0}
                    </h4>
                </div>
                <div className="bg-blue-600 p-6 rounded-lg flex flex-col justify-center shadow-sm">
                    <span className="text-xs font-medium text-blue-100 mb-2">
                        Total Inventory
                    </span>
                    <h4 className="text-2xl font-bold text-white">
                        {stats?.totalProducts} Units
                    </h4>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
