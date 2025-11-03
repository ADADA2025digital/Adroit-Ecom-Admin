import React, { useState, useEffect } from "react";
import axios from "../config/axiosConfig";
import ButtonGlobal from "../Components/Button";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";
import {
  FiShoppingCart,
  FiUsers,
  FiXCircle,
  FiDollarSign,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import Cookies from "js-cookie";

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip ">
        <p className="label">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            style={{
              color: entry.color,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              margin: "4px 0",
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                backgroundColor: entry.color,
                display: "inline-block",
              }}
            ></span>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Summary Card Component
const SummaryCard = ({ title, value, change, icon, color }) => {
  const IconComponent = icon;

  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <div>
          <p className="summary-card-title">{title}</p>
          <h3 className="summary-card-value">{value}</h3>
        </div>
        <div
          className="summary-card-icon"
          style={{
            backgroundColor: color + "20",
          }}
        >
          <IconComponent style={{ color, fontSize: "30px" }} />
        </div>
      </div>

      {change && (
        <div className="summary-card-change">
          <span
            style={{
              color: change.value > 0 ? "var(--green)" : "var(--red)",
            }}
          >
            {change.value > 0 ? "↑" : "↓"} {Math.abs(change.value)}%
            <span>{change.period}</span>
          </span>
        </div>
      )}
    </div>
  );
};

// Loading Skeleton Component
const SkeletonLoader = () => {
  return (
    <div className="dashboard-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div
          className="skeleton-loader"
          style={{ width: "200px", height: "32px" }}
        ></div>
        <div
          className="skeleton-loader"
          style={{ width: "120px", height: "40px" }}
        ></div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="row">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="col-md-3 col-sm-6 mb-3">
            <div className="skeleton-card">
              <div className="skeleton-loader skeleton-title"></div>
              <div className="skeleton-loader skeleton-value"></div>
              <div className="skeleton-loader skeleton-change"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="row">
        {[1, 2].map((item) => (
          <div key={item} className="col-lg-6 col-md-12 mb-4">
            <div className="chart-card skeleton-chart">
              <div className="skeleton-loader skeleton-chart-title"></div>
              <div className="skeleton-loader skeleton-chart-content"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tables Skeleton */}
      <div className="row">
        {[1, 2].map((item) => (
          <div key={item} className="col-lg-6 col-md-12 mb-4">
            <div className="chart-card">
              <div className="skeleton-loader skeleton-table"></div>
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="skeleton-table-row">
                  <div className="skeleton-table-cell skeleton-table-cell-1"></div>
                  <div className="skeleton-table-cell skeleton-table-cell-2"></div>
                  <div className="skeleton-table-cell skeleton-table-cell-3"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get token from cookies
  const getToken = () => {
    return Cookies.get('auth_token') || Cookies.get('token');
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Fetch dashboard summary
      const summaryResponse = await axios.get("/dashboard/summary", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
     
      const dashboardData = summaryResponse.data.data;
      setDashboardData(dashboardData);

      // Prepare revenue data for chart
      if (dashboardData.revenue?.by_day) {
        const revenueChartData = dashboardData.revenue.by_day.map(item => ({
          date: item.date,
          revenue: item.revenue || 0
        }));
        setRevenueData(revenueChartData);
      }

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError("Failed to fetch dashboard data. Please try again.");
      setLoading(false);
      setRefreshing(false);
      console.error("Error fetching dashboard data:", err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !refreshing) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="dashboard-error d-flex justify-content-center align-items-center vh-100 flex-column">
        <FiAlertCircle
          style={{
            fontSize: "48px",
            color: "var(--red)",
            marginBottom: "16px",
          }}
        />
        <p>{error}</p>
        <ButtonGlobal
          onClick={fetchDashboardData}
          className="d-flex align-items-center gap-2 mt-3"
        >
          <FiRefreshCw /> Try Again
        </ButtonGlobal>
      </div>
    );
  }

  // Prepare data for charts
  const orderStatusData =
    dashboardData?.orders?.by_status?.map((status) => ({
      name: status.orderstatus,
      value: status.count,
    })) || [];

  const COLORS = [
    "#7a70ba",
    "#968aefff",
    "#7e73ddff",
    "#9d94e2ff",
    "#504882ff",
  ];

  return (
    <div className="dashboard-container">
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
        <div>
          <h1 className="H4-heading fw-bold">Dashboard Overview</h1>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ButtonGlobal
            onClick={handleRefresh}
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
            disabled={refreshing}
            style={{
              opacity: refreshing ? 0.7 : 1,
            }}
          >
            <i
              className={`bi bi-arrow-clockwise ${refreshing ? "spin" : ""}`}
            />
          </ButtonGlobal>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-3">
          <SummaryCard
            title="Total Sales"
            value={`$${
              dashboardData?.sales?.total_sales?.toLocaleString() || "0"
            }`}
            icon={FiDollarSign}
            color="var(--green)"
          />
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <SummaryCard
            title="Total Orders"
            value={dashboardData?.orders?.total_orders || "0"}
            icon={FiShoppingCart}
            color="var(--blue)"
          />
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <SummaryCard
            title="Total Customers"
            value={dashboardData?.customers?.total_customers || "0"}
            icon={FiUsers}
            color="var(--yellow)"
          />
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <SummaryCard
            title="Cancellation Rate"
            value={`${dashboardData?.cancellations?.cancellation_rate || "0"}%`}
            icon={FiXCircle}
            color="var(--red)"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="row mb-4">
        {/* Revenue Chart - Replaced Sales Trend */}
        <div className="col-xl-6 col-lg-12 mb-4">
          <div className="chart-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Revenue Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-color)"
                />
                <XAxis dataKey="date" stroke="var(--text-secondary)" />
                <YAxis
                  stroke="var(--text-secondary)"
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="revenue" 
                  fill="var(--theme-color)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div className="col-xl-6 col-lg-12 mb-4">
          <div className="chart-card">
            <h3>Order Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    window.innerWidth < 768
                      ? ""
                      : `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={window.innerWidth < 768 ? 80 : 100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="horizontal"
                  align="center"
                  wrapperStyle={{
                    paddingLeft: window.innerWidth < 768 ? "0" : "20px",
                    fontSize: "12px",
                    color: "var(--font-color)",
                    marginTop: window.innerWidth < 768 ? "20px" : "0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity and Top Products */}
      <div className="row mb-4">
        {/* Recent Activity */}
        <div className="col-xl-6 col-lg-12 mb-4">
          <div className="chart-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Recent Orders</h3>
              <p>Last 5 orders</p>
            </div>
            <div className="table-responsive">
              <table className="table dashboard-table">
                <thead>
                  <tr>
                    <th className="bg-transparent">Order ID</th>
                    <th className="bg-transparent">Customer</th>
                    <th className="bg-transparent">Amount</th>
                    <th className="bg-transparent">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.recent_activity?.recent_orders
                    ?.slice(0, 5)
                    .map((order, index) => (
                      <tr key={index}>
                        <td className="table-bold bg-transparent">
                          {order.order_id}
                        </td>
                        <td className="bg-transparent">
                          {order.customer_name}
                        </td>
                        <td className="table-bold bg-transparent">
                          ${order.total}
                        </td>
                        <td className="bg-transparent">
                          <span
                            className={`status-badge  ${
                              order.status === "cancelled"
                                ? "status-cancelled"
                                : order.status === "processing"
                                ? "status-processing"
                                : "status-completed"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="col-xl-6 col-lg-12 mb-4">
          <div className="chart-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3>Top Selling Products</h3>
              <p>By revenue</p>
            </div>
            <div className="table-responsive">
              <table className="table dashboard-table">
                <thead>
                  <tr>
                    <th className="bg-transparent">Product</th>
                    <th className="bg-transparent">Units Sold</th>
                    <th className="bg-transparent">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.products?.top_selling?.map(
                    (product, index) => (
                      <tr key={index}>
                        <td className="table-bold bg-transparent">
                          {product.productname}
                        </td>
                        <td className="bg-transparent">{product.total_sold}</td>
                        <td className=" bg-transparent">
                          ${product.total_revenue}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        <p>
          Data updated automatically. Last refresh:{" "}
          {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;