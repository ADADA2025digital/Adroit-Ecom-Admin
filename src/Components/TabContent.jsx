import React from "react";
import { Tab, Table } from "react-bootstrap";

const TabContent = ({
  tab,
  viewType,
  reportDetails,
  formatCurrency,
  formatDateToMMDDYYYY,
}) => {
  if (!reportDetails) {
    return null;
  }

  const renderTable = (title, headers, data, renderRow) => (
    <div className="mb-3">
      <h6>{title}</h6>
      <div className="table-responsive">
        <Table className="table custom-data-table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item, index) => renderRow(item, index))
            ) : (
              <tr>
                <td colSpan={headers.length}>No data available</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );

  const renderReportInfo = () => (
    <div className="mb-3">
      <h6>{`${
        tab.charAt(0).toUpperCase() + tab.slice(1)
      } Report Information`}</h6>
      <p>
        <strong>Printed By:</strong> {reportDetails.printedBy}
      </p>
      <p>
        <strong>Report Start Date:</strong>{" "}
        {formatDateToMMDDYYYY(
          reportDetails.reportStartDate || reportDetails.date
        )}
      </p>
      <p>
        <strong>Report End Date:</strong>{" "}
        {formatDateToMMDDYYYY(
          reportDetails.reportEndDate || reportDetails.date
        )}
      </p>
      <p>
        <strong>Report Generated at:</strong>{" "}
        {formatDateToMMDDYYYY(reportDetails.reportGeneratedAt)}
      </p>
    </div>
  );

  const renderOrderAndSalesTab = () => (
    <>
      {renderReportInfo()}
      {renderTable(
        `${tab.charAt(0).toUpperCase() + tab.slice(1)} Summary`,
        viewType === "daily"
          ? ["Order Type", "Sales", "Orders"]
          : ["Staff", "Sales", "Debit"],
        [
          {
            type: "Online Orders",
            sales:
              viewType === "daily"
                ? reportDetails.summary?.total_sales || 0
                : reportDetails.salesSummary?.onlineOrders?.sales || 0,
            orders:
              viewType === "daily"
                ? reportDetails.summary?.total_orders || 0
                : reportDetails.salesSummary?.onlineOrders?.creditDebit || 0,
          },
          {
            type: "Total",
            sales:
              viewType === "daily"
                ? reportDetails.summary?.total_sales || 0
                : reportDetails.salesSummary?.total?.sales || 0,
            orders:
              viewType === "daily"
                ? reportDetails.summary?.total_orders || 0
                : reportDetails.salesSummary?.total?.creditDebit || 0,
          },
        ],
        (item, index) => (
          <tr key={index}>
            <td>
              <strong>{item.type}</strong>
            </td>
            <td>
          {formatCurrency(item.sales)}
            </td>
            <td>
            
                {viewType === "daily"
                  ? item.orders
                  : formatCurrency(item.orders)}
            
            </td>
          </tr>
        )
      )}
      {viewType !== "daily" &&
        reportDetails.revenueByOrderType &&
        renderTable(
          "Revenue",
          ["Order Type", "Sales"],
          reportDetails.revenueByOrderType,
          (item, index) => (
            <tr key={index}>
              <td>
                {item.order_type}</td>
              <td>{formatCurrency(item.sales)}</td>
            </tr>
          )
        )}
      {renderTable(
        "Top Selling Items",
        ["Items", "Quantity", "Revenue"],
        viewType === "daily"
          ? reportDetails.top_products
          : reportDetails.topSellingItems || [],
        (item, index) => (
          <tr key={index}>
            <td>{viewType === "daily" ? item.product_name : item.item}</td>
            <td>{viewType === "daily" ? item.quantity_sold : item.quantity}</td>
            <td>{formatCurrency(item.revenue)}</td>
          </tr>
        )
      )}
      {renderTable(
        "Customers",
        ["", "Count"],
        [
          {
            type: "New customer",
            count:
              viewType === "daily"
                ? reportDetails.summary?.unique_customers || 0
                : reportDetails.customerStats?.newCustomers || 0,
          },
          {
            type: "Existing customer",
            count:
              viewType === "daily"
                ? 0
                : reportDetails.customerStats?.existingCustomers || 0,
          },
        ],
        (item, index) => (
          <tr key={index}>
            <td>{item.type}</td>
            <td>{item.count}</td>
          </tr>
        )
      )}
      {renderTable(
        "Payment Summary",
        viewType === "daily"
          ? ["Payment Type", "Order Count", "Sales"]
          : ["Payment Type", "Sales", "Refund", "Remains"],
        viewType === "daily"
          ? reportDetails.payment_methods
          : reportDetails.paymentSummary || [],
        (item, index) => (
          <tr key={index}>
            <td>
              {viewType === "daily" ? item.payment_method : item.payment_type}
            </td>
            <td>
              {viewType === "daily"
                ? item.order_count
                : formatCurrency(item.sales)}
            </td>
            {viewType !== "daily" && <td>{formatCurrency(item.refund)}</td>}
            {viewType !== "daily" && <td>{formatCurrency(item.remains)}</td>}
            {viewType === "daily" && (
              <td>{formatCurrency(item.total_amount)}</td>
            )}
          </tr>
        )
      )}
      {viewType !== "daily" &&
        tab === "sales" &&
        reportDetails.categorySales &&
        renderTable(
          "Category Sales",
          ["Category", "Total", "Percentage", "Revenue"],
          reportDetails.categorySales,
          (item, index) => (
            <tr key={index}>
              <td>{item.category}</td>
              <td>{item.total}</td>
              <td>{item.percentage}%</td>
              <td>{formatCurrency(item.revenue)}</td>
            </tr>
          )
        )}
    </>
  );

  const renderCustomerTab = () => (
    <>
      {renderReportInfo()}
      {renderTable(
        "Customers",
        ["", "Count"],
        [
          {
            type: "New customer",
            count:
              viewType === "daily"
                ? reportDetails.summary?.unique_customers || 0
                : reportDetails.customerDetails?.newCustomers || 0,
          },
          {
            type: "Existing customer",
            count:
              viewType === "daily"
                ? 0
                : reportDetails.customerDetails?.existingCustomers || 0,
          },
          {
            type: "Total customer",
            count:
              viewType === "daily"
                ? reportDetails.summary?.unique_customers || 0
                : reportDetails.customerDetails?.totalCustomers ||
                  reportDetails.customerDetails?.newCustomers ||
                  0,
          },
        ],
        (item, index) => (
          <tr key={index}>
            <td>{item.type}</td>
            <td>{item.count}</td>
          </tr>
        )
      )}
    </>
  );

  const renderRefundedTab = () => (
    <>
      {renderReportInfo()}
      {renderTable(
        "Refunded Summary",
        viewType === "daily"
          ? ["No of Refunds", "Total"]
          : ["No of Refunds", "Total", "Percentage"],
        [
          {
            numberOfRefunds:
              viewType === "daily"
                ? 0
                : reportDetails.refundSummary?.numberOfRefunds || 0,
            totalRefunded:
              viewType === "daily"
                ? 0
                : reportDetails.refundSummary?.totalRefunded || 0,
            percentage:
              viewType === "daily"
                ? 0
                : reportDetails.refundSummary?.percentage || 0,
          },
        ],
        (item, index) => (
          <tr key={index}>
            <td>{item.numberOfRefunds}</td>
            <td>{formatCurrency(item.totalRefunded)}</td>
            {viewType !== "daily" && <td>{item.percentage}%</td>}
          </tr>
        )
      )}
      {viewType !== "daily" &&
        reportDetails.refundsByReason &&
        renderTable(
          "Refunds by Reason",
          ["Reason", "Count", "Amount"],
          reportDetails.refundsByReason,
          (item, index) => (
            <tr key={index}>
              <td>{item.reason}</td>
              <td>{item.count}</td>
              <td>{formatCurrency(item.amount)}</td>
            </tr>
          )
        )}
    </>
  );

  const renderProductTab = () => (
    <>
      {renderReportInfo()}
      {viewType !== "daily" &&
        reportDetails.productSummary &&
        renderTable(
          "Product Summary",
          ["Category", "No of product"],
          reportDetails.productSummary,
          (item, index) => (
            <tr key={index}>
              <td>{item.category}</td>
              <td>{item.product_count}</td>
            </tr>
          )
        )}
      {renderTable(
        "Top Selling Products",
        viewType === "daily"
          ? ["Product Name", "Sold", "Revenue"]
          : ["Product Name", "Sold", "Remaining", "Revenue"],
        viewType === "daily"
          ? reportDetails.top_products
          : reportDetails.topSellingProducts || [],
        (item, index) => (
          <tr key={index}>
            <td>
              {viewType === "daily" ? item.product_name : item.product_name}
            </td>
            <td>{viewType === "daily" ? item.quantity_sold : item.sold}</td>
            {viewType !== "daily" && <td>{item.remaining}</td>}
            <td>{formatCurrency(item.revenue)}</td>
          </tr>
        )
      )}
      {viewType !== "daily" &&
        reportDetails.topSellingCategories &&
        renderTable(
          "Top Selling Categories",
          ["Category", "Sold", "Remaining", "Revenue"],
          reportDetails.topSellingCategories,
          (item, index) => (
            <tr key={index}>
              <td>{item.category}</td>
              <td>{item.sold}</td>
              <td>{item.remaining}</td>
              <td>{formatCurrency(item.revenue)}</td>
            </tr>
          )
        )}
    </>
  );

  return (
    <Tab.Pane eventKey={tab}>
      {tab === "order" || tab === "sales"
        ? renderOrderAndSalesTab()
        : tab === "customer"
        ? renderCustomerTab()
        : tab === "refunded"
        ? renderRefundedTab()
        : tab === "product"
        ? renderProductTab()
        : null}
    </Tab.Pane>
  );
};

export default TabContent;
