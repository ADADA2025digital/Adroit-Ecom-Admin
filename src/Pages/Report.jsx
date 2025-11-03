import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Container,
  Form,
  Dropdown,
  Nav,
  Tab,
  Spinner,
  Alert,
} from 'react-bootstrap';
import $ from 'jquery';
import 'datatables.net-dt/css/dataTables.dataTables.min.css';
import 'datatables.net-responsive-dt';
import 'datatables.net';
import { ToastContainer, toast } from 'react-toastify';
import ButtonGlobal from '../Components/Button';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as XLSX from 'xlsx';
import Cookies from 'js-cookie';
import TabContent from '../Components/TabContent';

const Report = () => {
  const [viewType, setViewType] = useState('monthly');
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterValue, setFilterValue] = useState({
    type: 'all',
    selectedDate: '',
    startDate: '',
    endDate: '',
  });
  const [reportsData, setReportsData] = useState([]);
  const [reportDetails, setReportDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [availableFilters, setAvailableFilters] = useState({
    months: [],
    years: [],
    dates: [],
  });
  const [activeTab, setActiveTab] = useState('order');
  const [error, setError] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const tableRef = useRef(null);
  const dataTableRef = useRef(null);
  const dropdownRef = useRef();
  const isInitializedRef = useRef(false);

  // Get token from cookies
  const getToken = () => {
    const token = Cookies.get('auth_token') || Cookies.get('token');
    return token;
  };

  useEffect(() => {
    if (validateDateRange()) {
      console.log('Component mounted, fetching reports and filters');
      fetchFilters();
      fetchReports(false);
    }
  }, [viewType, filterValue]);

  useEffect(() => {
    if (selectedReport && reportsData.length > 0) {
      const reportExists = reportsData.some((report) =>
        viewType === 'monthly'
          ? report.month === selectedReport.month
          : viewType === 'yearly'
          ? report.year === selectedReport.year
          : report.date === selectedReport.date
      );

      if (!reportExists) {
        console.log('Selected report no longer exists, resetting selection');
        setSelectedReport(null);
        setReportDetails(null);
      } else if (reportsData.length === 1) {
        console.log('Only one report, auto-selecting it');
        handleRowClick(reportsData[0]);
      }
    } else if (reportsData.length === 1) {
      console.log('Only one report, auto-selecting it');
      handleRowClick(reportsData[0]);
    }
  }, [reportsData]);

  useEffect(() => {
    const initDataTable = () => {
      if (
        tableRef.current &&
        reportsData.length > 0 &&
        !isInitializedRef.current
      ) {
        console.log(
          'Initializing DataTable with',
          reportsData.length,
          'records'
        );

        if ($.fn.DataTable.isDataTable(tableRef.current)) {
          console.log('Destroying existing DataTable instance');
          $(tableRef.current).DataTable().destroy();
          $(tableRef.current).empty();
        }

        try {
          dataTableRef.current = $(tableRef.current).DataTable({
            responsive: true,
            pageLength: 10,
            lengthMenu: [10, 25, 50, 100],
            data: reportsData,
            columns: [
              {
                data: null,
                render: function (data, type, row, meta) {
                  return meta.row + 1;
                },
                title: 'S.No',
              },
              {
                data:
                  viewType === 'monthly'
                    ? 'month'
                    : viewType === 'yearly'
                    ? 'year'
                    : 'date',
                title:
                  viewType === 'monthly'
                    ? 'Month'
                    : viewType === 'yearly'
                    ? 'Year'
                    : 'Date',
                render: function (data, type, row) {
                  if (viewType === 'daily' && type === 'display') {
                    return formatDateToMMDDYYYY(data);
                  }
                  return data;
                },
              },
              {
                data: 'reportGeneratedAt',
                title: 'Report Generated at',
                render: function (data) {
                  return formatDateToMMDDYYYY(data);
                },
              },
              ...(viewType !== 'yearly'
                ? [
                    { data: 'totalOrders', title: 'Total Orders' },
                    {
                      data: 'totalSales',
                      title: 'Total Sales',
                      render: function (data) {
                        return formatCurrency(data);
                      },
                    },
                  ]
                : []),
            ],
            createdRow: function (row, data, dataIndex) {
              $(row).css('cursor', 'pointer');
              $(row).on('click', function () {
                handleRowClick(data);
              });

              if (
                (selectedReport &&
                  ((viewType === 'monthly' &&
                    selectedReport.month === data.month) ||
                    (viewType === 'yearly' &&
                      selectedReport.year === data.year) ||
                    (viewType === 'daily' &&
                      selectedReport.date === data.date))) ||
                (viewType === 'daily' &&
                  filterValue.type === 'range' &&
                  !selectedReport)
              ) {
                $(row).addClass('table-active');
              }
            },
          });

          console.log('DataTable initialized successfully');
          isInitializedRef.current = true;
        } catch (error) {
          console.error('Error initializing DataTable:', error);
          toast.error('Error displaying table data');
        }
      }
    };

    const timer = setTimeout(initDataTable, 100);

    return () => {
      clearTimeout(timer);
      if (dataTableRef.current) {
        console.log('Cleaning up DataTable instance');
        try {
          dataTableRef.current.destroy();
        } catch (e) {
          console.log('Error destroying DataTable:', e);
        }
        dataTableRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [reportsData, viewType, filterValue, selectedReport]);

  const validateDateRange = () => {
    if (
      filterValue.type === 'range' &&
      filterValue.startDate &&
      filterValue.endDate
    ) {
      if (new Date(filterValue.endDate) < new Date(filterValue.startDate)) {
        toast.error('End date cannot be before start date');
        return false;
      }
    }
    return true;
  };

  const fetchFilters = async () => {
    console.log('Fetching filters for viewType:', viewType);
    try {
      const token = getToken();
      if (!token) {
        console.error('Authentication token not found');
        toast.error('Authentication token not found');
        return;
      }

      const response = await fetch(
        'https://shop.adroitalarm.com.au/api/reports/filters',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Filters fetched successfully:', data);
        setAvailableFilters({
          months: data.months || [],
          years: data.years || [],
          dates: data.dates || [],
        });
      } else {
        console.error(
          'Failed to fetch filter options, status:',
          response.status
        );
        toast.error('Failed to fetch filter options');
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
      toast.error('Error fetching filter options');
    }
  };

  const fetchReports = async (isRefresh = false) => {
    console.log(
      'Fetching reports for viewType:',
      viewType,
      'filter:',
      filterValue
    );
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const token = getToken();
      if (!token) {
        console.error('Authentication token not found');
        toast.error('Authentication token not found');
        return;
      }

      let endpoint = '';
      let params = {};

      if (viewType === 'monthly') {
        endpoint = `/reports/monthly${
          filterValue.type !== 'all'
            ? `?month=${filterValue.selectedDate.split('-')[1]}&year=${
                filterValue.selectedDate.split('-')[0]
              }`
            : ''
        }`;
      } else if (viewType === 'yearly') {
        endpoint = `/reports/yearly${
          filterValue.type !== 'all' ? `?year=${filterValue.selectedDate}` : ''
        }`;
      } else if (viewType === 'daily') {
        if (filterValue.type === 'range') {
          endpoint = '/reports/by-date';
          params = {
            start_date: filterValue.startDate,
            end_date: filterValue.endDate,
          };
        } else {
          endpoint = '/reports/daily';
          if (filterValue.selectedDate) {
            params = { date: filterValue.selectedDate };
          } else {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            endpoint = '/reports/by-date';
            params = {
              start_date: startDate.toISOString().split('T')[0],
              end_date: endDate,
            };
          }
        }
      }

      console.log('API endpoint:', endpoint, 'Params:', params);

      let response;
      if (viewType === 'daily') {
        const queryString = new URLSearchParams(params).toString();
        response = await fetch(
          `https://shop.adroitalarm.com.au/api${endpoint}${
            queryString ? `?${queryString}` : ''
          }`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        response = await fetch(
          `https://shop.adroitalarm.com.au/api${endpoint}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (response.ok) {
        const data = await response.json();
        console.log(
          'Reports fetched successfully:',
          data.data?.length || 0,
          'records'
        );
        let formattedData = [];

        if (viewType === 'daily' && filterValue.type === 'range') {
          const aggregatedData = await aggregateRangeData(data.data);
          if (aggregatedData) {
            formattedData = [
              {
                id: 1,
                date: `${filterValue.startDate} to ${filterValue.endDate}`,
                reportGeneratedAt: aggregatedData.reportGeneratedAt,
                printedBy: aggregatedData.printedBy || 'System',
                totalOrders: aggregatedData.summary.total_orders,
                totalSales: parseFloat(aggregatedData.summary.total_sales),
              },
            ];
            setReportDetails(aggregatedData);
            setSelectedReport(null);
          }
        } else if (viewType === 'daily' && filterValue.selectedDate) {
          formattedData = [
            {
              id: 1,
              date: data.data.date,
              reportGeneratedAt: data.data.report_generated_at,
              printedBy: data.data.printedBy || 'System',
              totalOrders: data.data.summary.total_orders,
              totalSales: parseFloat(data.data.summary.total_sales),
            },
          ];
          setReportDetails({
            ...data.data,
            reportStartDate: data.data.date,
            reportEndDate: data.data.date,
            printedBy: data.data.printedBy || 'System',
            reportGeneratedAt: data.data.report_generated_at,
          });
          setSelectedReport(formattedData[0]);
        } else {
          formattedData = data.data.map((item) => ({
            ...item,
            totalSales: parseFloat(
              item.totalSales || item.summary?.total_sales || 0
            ),
            totalOrders: item.totalOrders || item.summary?.total_orders || 0,
          }));
        }

        setReportsData(formattedData);
        setError(null);
        setLastRefreshTime(new Date());
      } else {
        console.error('Failed to fetch reports, status:', response.status);
        setReportsData([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Error fetching reports');
      setReportsData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const aggregateRangeData = async (reports) => {
    if (!reports || reports.length === 0) {
      console.warn('No reports available for aggregation');
      return null;
    }

    const token = getToken();
    if (!token) {
      console.error('Authentication token not found');
      toast.error('Authentication token not found');
      return null;
    }

    const detailedReports = await Promise.all(
      reports.map(async (report) => {
        try {
          const response = await fetch(
            `https://shop.adroitalarm.com.au/api/reports/daily?date=${report.date}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
          return response.ok ? (await response.json()).data : null;
        } catch (error) {
          console.error(`Error fetching details for ${report.date}:`, error);
          return null;
        }
      })
    ).then((results) => results.filter((r) => r !== null));

    if (detailedReports.length === 0) {
      console.warn('No valid detailed reports for aggregation');
      return null;
    }

    const summary = detailedReports.reduce(
      (acc, report) => ({
        total_orders: acc.total_orders + report.summary.total_orders,
        total_sales: (
          parseFloat(acc.total_sales) + parseFloat(report.summary.total_sales)
        ).toFixed(2),
        unique_customers:
          acc.unique_customers + (report.summary.unique_customers || 0),
        average_order_value: (
          (parseFloat(acc.total_sales) +
            parseFloat(report.summary.total_sales)) /
          (acc.total_orders + report.summary.total_orders || 1)
        ).toFixed(2),
      }),
      {
        total_orders: 0,
        total_sales: '0.00',
        unique_customers: 0,
        average_order_value: '0.00',
      }
    );

    const topProductsMap = new Map();
    detailedReports.forEach((report) => {
      (report.top_products || []).forEach((product) => {
        const existing = topProductsMap.get(product.product_name) || {
          product_name: product.product_name,
          quantity_sold: 0,
          revenue: 0,
        };
        topProductsMap.set(product.product_name, {
          product_name: product.product_name,
          quantity_sold:
            parseInt(existing.quantity_sold) + parseInt(product.quantity_sold),
          revenue: (
            parseFloat(existing.revenue) + parseFloat(product.revenue)
          ).toFixed(2),
        });
      });
    });
    const top_products = Array.from(topProductsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const paymentMethodsMap = new Map();
    detailedReports.forEach((report) => {
      (report.payment_methods || []).forEach((method) => {
        const existing = paymentMethodsMap.get(method.payment_method) || {
          payment_method: method.payment_method,
          order_count: 0,
          total_amount: 0,
        };
        paymentMethodsMap.set(method.payment_method, {
          payment_method: method.payment_method,
          order_count: existing.order_count + method.order_count,
          total_amount: (
            parseFloat(existing.total_amount) + parseFloat(method.total_amount)
          ).toFixed(2),
        });
      });
    });
    const payment_methods = Array.from(paymentMethodsMap.values());

    const lastReport =
      detailedReports[detailedReports.length - 1] || reports[0];
    return {
      date: formatDateRange(
        reports[reports.length - 1].date,
        reports[0].date
      ),
      reportStartDate: reports[reports.length - 1].date,
      reportEndDate: reports[0].date,
      reportGeneratedAt: lastReport.report_generated_at || new Date().toISOString(),
      printedBy: lastReport.printedBy || 'System',
      summary,
      top_products,
      payment_methods,
      orders_by_hour: [],
    };
  };

  const fetchReportDetails = async (report, tab = 'order') => {
    console.log('Fetching report details for:', report, 'tab:', tab);
    setDetailLoading(true);
    setError(null);
    try {
      const token = getToken();
      if (!token) {
        console.error('Authentication token not found');
        toast.error('Authentication token not found');
        setDetailLoading(false);
        return;
      }

      let response;
      if (viewType === 'daily' && filterValue.type === 'range') {
        setActiveTab(tab);
        return;
      } else if (viewType === 'daily') {
        response = await fetch(
          `https://shop.adroitalarm.com.au/api/reports/daily?date=${report.date}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        const period = viewType === 'monthly' ? report.month : report.year;
        response = await fetch(
          `https://shop.adroitalarm.com.au/api/reports/details?type=${viewType}&period=${encodeURIComponent(
            period
          )}&tab=${tab}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Report details fetched successfully for tab:', tab);
        setReportDetails({
          ...data.data,
          reportStartDate: data.data.date || data.data.reportStartDate,
          reportEndDate: data.data.date || data.data.reportEndDate,
          printedBy: data.data.printedBy || 'System',
          reportGeneratedAt: data.data.report_generated_at || data.data.reportGeneratedAt,
        });
        setSelectedReport(report);
        setActiveTab(tab);
      } else {
        console.error(
          'Failed to fetch report details, status:',
          response.status
        );
        setError(
          `The "${tab}" tab data is not available for this report period.`
        );
        setReportDetails(null);
      }
    } catch (error) {
      console.error('Error fetching report details:', error);
      setError(error.message || 'Error fetching report details.');
      setReportDetails(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRowClick = async (report) => {
    console.log('Row clicked:', report);
    setSelectedReport(report);
    if (viewType === 'daily' && filterValue.type === 'range') {
      setActiveTab('order');
    } else {
      await fetchReportDetails(report);
    }
  };

  const handleTabChange = (tab) => {
    console.log('Tab changed to:', tab);
    if (selectedReport) {
      setActiveTab(tab);
      fetchReportDetails(selectedReport, tab);
    } else if (viewType === 'daily' && filterValue.type === 'range') {
      setActiveTab(tab);
    }
  };

  const handleRefresh = () => {
    fetchReports(true);
  };

  const exportToExcel = async () => {
    console.log('Exporting to Excel for active tab:', activeTab);
    try {
      if (
        !selectedReport &&
        !(viewType === 'daily' && filterValue.type === 'range')
      ) {
        toast.error('Please select a report or date range');
        return;
      }

      const activeTabContent = document.querySelector(`.tab-pane.active`);
      if (!activeTabContent) {
        toast.error('No data available to export');
        return;
      }

      const tables = activeTabContent.querySelectorAll('table');
      if (tables.length === 0) {
        toast.error('No table data found to export');
        return;
      }

      const workbook = XLSX.utils.book_new();
      tables.forEach((table, index) => {
        const tableTitleElement = table.previousElementSibling;
        let tableTitle = `${activeTab}_table_${index + 1}`;
        if (tableTitleElement && tableTitleElement.tagName === 'H6') {
          tableTitle = tableTitleElement.textContent
            .replace(/\s+/g, '_')
            .toLowerCase();
        }
        const worksheet = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          tableTitle.substring(0, 30)
        );
      });

      const period =
        viewType === 'monthly'
          ? selectedReport?.month
          : viewType === 'yearly'
          ? selectedReport?.year
          : formatDateRange(filterValue.startDate, filterValue.endDate)
              .replace(/\s+/g, '_')
              .replace(/\//g, '-');

      const fileName = `${viewType}_${activeTab}_report_${period}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success(
        `${
          activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
        } report exported successfully`
      );
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Error exporting report');
    }
  };

  const formatDateToMMDDYYYY = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '';

    const formattedStart = formatDateToMMDDYYYY(startDate);
    const formattedEnd = formatDateToMMDDYYYY(endDate);

    return `${formattedStart} to ${formattedEnd}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  const handlePrint = () => {
    if (
      !selectedReport &&
      !(viewType === 'daily' && filterValue.type === 'range')
    ) {
      toast.info('Please select a report or date range to print');
      return;
    }

    const activeTabContent = document.querySelector(`.tab-pane.active`);
    if (!activeTabContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Report - ${
            activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
          }</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .section-title { margin-top: 25px; margin-bottom: 10px; font-weight: bold; }
            .report-header { margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            @media print {
              body { margin: 0; padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h2>${
              viewType === 'monthly'
                ? 'Monthly'
                : viewType === 'yearly'
                ? 'Yearly'
                : 'Daily'
            } Sales Report - ${
              activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
            }</h2>
            <p><strong>${
              viewType === 'monthly'
                ? 'Month'
                : viewType === 'yearly'
                ? 'Year'
                : 'Period'
            }:</strong> ${
              viewType === 'monthly'
                ? selectedReport?.month
                : viewType === 'yearly'
                ? selectedReport?.year
                : formatDateRange(filterValue.startDate, filterValue.endDate)
            }</p>
            <p><strong>Generated At:</strong> ${formatDateToMMDDYYYY(
              reportDetails?.reportGeneratedAt
            )}</p>
          </div>
          ${activeTabContent.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  const renderReportDetails = () => {
    if (error) {
      return (
        <Alert variant="warning" className="mt-3">
          {error}
        </Alert>
      );
    }

    if (!reportDetails) {
      return null;
    }

    return (
      <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link className="tab-title" eventKey="order">
              Order
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className="tab-title" eventKey="sales">
              Sales
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className="tab-title" eventKey="customer">
              Customer
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className="tab-title" eventKey="refunded">
              Refunded
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link className="tab-title" eventKey="product">
              Product
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <TabContent
            tab="order"
            viewType={viewType}
            reportDetails={reportDetails}
            formatCurrency={formatCurrency}
            formatDateToMMDDYYYY={formatDateToMMDDYYYY}
          />
          <TabContent
            tab="sales"
            viewType={viewType}
            reportDetails={reportDetails}
            formatCurrency={formatCurrency}
            formatDateToMMDDYYYY={formatDateToMMDDYYYY}
          />
          <TabContent
            tab="customer"
            viewType={viewType}
            reportDetails={reportDetails}
            formatCurrency={formatCurrency}
            formatDateToMMDDYYYY={formatDateToMMDDYYYY}
          />
          <TabContent
            tab="refunded"
            viewType={viewType}
            reportDetails={reportDetails}
            formatCurrency={formatCurrency}
            formatDateToMMDDYYYY={formatDateToMMDDYYYY}
          />
          <TabContent
            tab="product"
            viewType={viewType}
            reportDetails={reportDetails}
            formatCurrency={formatCurrency}
            formatDateToMMDDYYYY={formatDateToMMDDYYYY}
          />
        </Tab.Content>
      </Tab.Container>
    );
  };

  return (
    <Container fluid className="p-4">
      <ToastContainer />
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center bg-transparent">
           <h4 className="H4-heading fw-bold">Report</h4>

          <div className="d-flex align-items-center gap-3 flex-lg-row flex-column text-nowrap">
            {lastRefreshTime && (
              <p className="pt-3 mb-0 text-center text-lg-end">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </p>
            )}
            <div className="d-flex align-items-center justify-content-center">
              <ButtonGlobal
                onClick={handleRefresh}
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                disabled={refreshing}
                style={{
                  opacity: refreshing ? 0.7 : 1,
                }}
              >
                <i
                  className={`bi bi-arrow-clockwise ${
                    refreshing ? 'spin' : ''
                  }`}
                />
              </ButtonGlobal>
            </div>
            <Dropdown ref={dropdownRef}>
              <Dropdown.Toggle
                variant="outline-secondary"
                id="view-type-dropdown"
                className="w-100 w-lg-auto"
              >
                {viewType === 'monthly'
                  ? 'Monthly View'
                  : viewType === 'yearly'
                  ? 'Yearly View'
                  : 'Daily View'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  onClick={() => {
                    console.log('View type changed to: monthly');
                    setViewType('monthly');
                    setFilterValue({
                      type: 'all',
                      selectedDate: '',
                      startDate: '',
                      endDate: '',
                    });
                    setSelectedReport(null);
                    setReportDetails(null);
                    if (dropdownRef.current) {
                      const toggle =
                        dropdownRef.current.querySelector('.dropdown-toggle');
                      if (toggle) toggle.click();
                    }
                  }}
                >
                  Monthly
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    console.log('View type changed to: yearly');
                    setViewType('yearly');
                    setFilterValue({
                      type: 'all',
                      selectedDate: '',
                      startDate: '',
                      endDate: '',
                    });
                    setSelectedReport(null);
                    setReportDetails(null);
                    if (dropdownRef.current) {
                      const toggle =
                        dropdownRef.current.querySelector('.dropdown-toggle');
                      if (toggle) toggle.click();
                    }
                  }}
                >
                  Yearly
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => {
                    console.log('View type changed to: daily');
                    setViewType('daily');
                    setFilterValue({
                      type: 'all',
                      selectedDate: '',
                      startDate: '',
                      endDate: '',
                    });
                    setSelectedReport(null);
                    setReportDetails(null);
                    if (dropdownRef.current) {
                      const toggle =
                        dropdownRef.current.querySelector('.dropdown-toggle');
                      if (toggle) toggle.click();
                    }
                  }}
                >
                  Daily
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <ButtonGlobal
              onClick={exportToExcel}
              className="btn button-global w-100 w-lg-auto"
              disabled={
                !selectedReport &&
                !(viewType === 'daily' && filterValue.type === 'range')
              }
              text={`Export ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} to Excel`}
            />
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex">
                  {viewType === 'daily' ? (
                    <>
                      <Form.Select
                        style={{ width: '150px', marginRight: '10px' }}
                        value={filterValue.type}
                        onChange={(e) => {
                          console.log(
                            'Filter type changed to:',
                            e.target.value
                          );
                          setFilterValue({
                            type: e.target.value,
                            selectedDate: '',
                            startDate: '',
                            endDate: '',
                          });
                          setSelectedReport(null);
                          setReportDetails(null);
                        }}
                      >
                        <option value="all">All Dates</option>
                        <option value="range">Date Range</option>
                      </Form.Select>
                      {filterValue.type === 'all' && (
                        <div className="d-flex align-items-center">
                          <Form.Control
                            type="date"
                            style={{ width: '150px', marginRight: '10px' }}
                            value={filterValue.selectedDate}
                            onChange={(e) => {
                              console.log(
                                'Selected date changed to:',
                                e.target.value
                              );
                              setFilterValue({
                                ...filterValue,
                                selectedDate: e.target.value,
                              });
                              setSelectedReport(null);
                              setReportDetails(null);
                            }}
                          />
                          {filterValue.selectedDate && (
                            <ButtonGlobal
                              onClick={() => {
                                console.log('Clearing selected date');
                                setFilterValue({
                                  ...filterValue,
                                  selectedDate: '',
                                });
                                setSelectedReport(null);
                                setReportDetails(null);
                              }}
                              className="btn button-global"
                              style={{ marginRight: '10px' }}
                              text="Clear"
                            />
                          )}
                        </div>
                      )}
                      {filterValue.type === 'range' && (
                        <>
                          <Form.Control
                            type="date"
                            style={{ width: '150px', marginRight: '10px' }}
                            value={filterValue.startDate}
                            onChange={(e) => {
                              setFilterValue({
                                ...filterValue,
                                startDate: e.target.value,
                              });
                              setSelectedReport(null);
                              setReportDetails(null);
                            }}
                            placeholder="Start Date"
                          />
                          <Form.Control
                            type="date"
                            style={{ width: '150px' }}
                            value={filterValue.endDate}
                            onChange={(e) => {
                              setFilterValue({
                                ...filterValue,
                                endDate: e.target.value,
                              });
                              setSelectedReport(null);
                              setReportDetails(null);
                            }}
                            placeholder="End Date"
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <Form.Select
                      style={{ width: '150px', marginRight: '10px' }}
                      value={
                        filterValue.type === 'all'
                          ? 'all'
                          : filterValue.selectedDate
                      }
                      onChange={(e) => {
                        console.log('Filter value changed to:', e.target.value);
                        setFilterValue({
                          type: e.target.value === 'all' ? 'all' : 'single',
                          selectedDate:
                            e.target.value === 'all' ? '' : e.target.value,
                          startDate: '',
                          endDate: '',
                        });
                        setSelectedReport(null);
                        setReportDetails(null);
                      }}
                    >
                      <option value="all">
                        All {viewType === 'monthly' ? 'Months' : 'Years'}
                      </option>
                      {viewType === 'monthly'
                        ? availableFilters.months.map((month) => (
                            <option
                              key={month.value}
                              value={`${new Date().getFullYear()}-${month.value}`}
                            >
                              {month.label}
                            </option>
                          ))
                        : availableFilters.years.map((year) => (
                            <option key={year.value} value={year.value}>
                              {year.label}
                            </option>
                          ))}
                    </Form.Select>
                  )}
                </div>
              </div>

              <div className="table-responsive">
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : (
                  <table
                    ref={tableRef}
                    className="table table-striped table-hover custom-data-table"
                  >
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>
                          {viewType === 'monthly'
                            ? 'Month'
                            : viewType === 'yearly'
                            ? 'Year'
                            : 'Date'}
                        </th>
                        <th>Report Generated at</th>
                        {viewType !== 'yearly' && <th>Total Orders</th>}
                        {viewType !== 'yearly' && <th>Total Sales</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {reportsData.map((item, index) => (
                        <tr
                          key={index}
                          onClick={() => handleRowClick(item)}
                          style={{ cursor: 'pointer' }}
                          className={
                            (selectedReport &&
                              ((viewType === 'monthly' &&
                                selectedReport.month === item.month) ||
                                (viewType === 'yearly' &&
                                  selectedReport.year === item.year) ||
                                (viewType === 'daily' &&
                                  selectedReport.date === item.date))) ||
                            (viewType === 'daily' &&
                              filterValue.type === 'range' &&
                              !selectedReport)
                              ? 'table-active'
                              : ''
                          }
                        >
                          <td>{index + 1}</td>
                          <td>
                            {viewType === 'monthly'
                              ? item.month
                              : viewType === 'yearly'
                              ? item.year
                              : item.date}
                          </td>
                          <td>{item.reportGeneratedAt}</td>
                          {viewType !== 'yearly' && <td>{item.totalOrders}</td>}
                          {viewType !== 'yearly' && (
                            <td>{formatCurrency(item.totalSales)}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Col>

            <Col md={6}>
              {detailLoading ? (
                <Card>
                  <Card.Body className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">
                        Loading details...
                      </span>
                    </Spinner>
                  </Card.Body>
                </Card>
              ) : selectedReport ||
                (viewType === 'daily' && filterValue.type === 'range') ? (
                <Card id="report-details">
                  <Card.Header className="bg-transparent border-0">
                    <h6 className="mb-0">
                      Report Details -{' '}
                      {viewType === 'monthly'
                        ? selectedReport?.month
                        : viewType === 'yearly'
                        ? selectedReport?.year
                        : formatDateRange(
                            reportDetails?.reportStartDate || filterValue.startDate,
                            reportDetails?.reportEndDate || filterValue.endDate
                          )}
                    </h6>
                  </Card.Header>
                  <Card.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {renderReportDetails()}
                  </Card.Body>
                  <Card.Footer>
                    <div className="d-flex justify-content-end">
                      <ButtonGlobal
                        className="btn button-global"
                        onClick={handlePrint}
                        text="Print Report"
                      />
                    </div>
                  </Card.Footer>
                </Card>
              ) : (
                <Card>
                  <Card.Body className="text-center">
                    <h6>Select a report from the list to view details</h6>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Report;