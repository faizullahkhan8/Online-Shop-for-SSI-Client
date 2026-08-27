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
    "#4d8d3a", // primary
    "#1e4d28", // primary-dark
    "#a6d56c", // accent
    "#f59e0b", // amber
    "#ef4444", // red
    "#6366f1", // indigo
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Area Chart */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-transparent hover:border-primary-light shadow-sm hover:shadow-xl hover:shadow-primary-pale/40 transition-all duration-300 group">
                <h3 className="text-xl font-display text-gray-900 mb-6 group-hover:text-primary transition-colors">
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
                                        stopColor="#4d8d3a"
                                        stopOpacity={0.1}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#4d8d3a"
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
                                stroke="#4d8d3a"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRev)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Performance Bar Chart */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-transparent hover:border-primary-light shadow-sm hover:shadow-xl hover:shadow-primary-pale/40 transition-all duration-300 group">
                <h3 className="text-xl font-display text-gray-900 mb-6 group-hover:text-primary transition-colors">
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
                                fill="#4d8d3a"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Order Status Pie Chart */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border-2 border-transparent hover:border-primary-light shadow-sm hover:shadow-xl hover:shadow-primary-pale/40 transition-all duration-300 group">
                <h3 className="text-xl font-display text-gray-900 mb-6 group-hover:text-primary transition-colors">
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
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-900 p-6 md:p-8 rounded-3xl flex flex-col justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                        Avg Order Value
                    </span>
                    <h4 className="text-3xl font-black text-white">
                        Rs{" "}
                        {stats?.totalOrders > 0
                            ? (stats?.totalSales / stats?.totalOrders)
                                  .toFixed(0)
                                  .toLocaleString()
                            : 0}
                    </h4>
                </div>
                <div className="bg-primary p-6 md:p-8 rounded-3xl flex flex-col justify-center shadow-lg hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300">
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary-light mb-2">
                        Total Inventory
                    </span>
                    <h4 className="text-3xl font-black text-white">
                        {stats?.totalProducts} Units
                    </h4>
                </div>
            </div>
        </div>
    );
};

export default DashboardCharts;
