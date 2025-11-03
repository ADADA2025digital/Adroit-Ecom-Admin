import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import "./Assets/Styles/Style.css";
import $ from 'jquery';
window.$ = window.jQuery = $;
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BasicInputs from "./Pages/BasicInputs";
import FormValidation from "./Pages/FormValidation";
import DataTable from "./Pages/Datatable";
import UserAccount from "./Pages/UserAccount";
import Dashboard from "./Pages/Dashboard";
import Category from "./Pages/Product/Category";
import ProtectedRoute from "./Components/ProtectedRoute";
import AddProduct from "./Pages/Product/AddProduct";
import ProductList from "./Pages/Product/ProductList";
import ProductDetail from "./Pages/Product/ProductDetail";
import OrderList from "./Pages/Orders/OrderList";
import Login from "./Pages/Login";
import RootLayout from "./layout";
import ForgetPassword from "./Pages/ForgetPassword";
import OrderDetail from "./Pages/Orders/OrderDetail";
import Invoice from "./Pages/Sales/Invoice";
import Refund from "./Pages/Sales/Refund";
import Transaction from "./Pages/Sales/Transaction";
import UserList from "./Pages/Users/UserList";
import ResetPassword from "./Pages/ResetPassword";
import Report from "./Pages/Report";
import Unauthorized from "./Pages/Unauthorized.jsx";
import Review from "./Pages/Review.jsx"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgetpassword" element={<ForgetPassword />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route
          element={
            <ProtectedRoute requiredRole={1}>
              <RootLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/category" element={<Category />} />
          <Route path="/addproduct" element={<AddProduct />} />
          <Route path="/productlist" element={<ProductList />} />
          <Route path="/productdetail/:slug" element={<ProductDetail />} />
          <Route path="/orderlist" element={<OrderList />} />
          <Route path="/userlist" element={<UserList />} />
          <Route path="/basicinputs" element={<BasicInputs />} />
          <Route path="/validation" element={<FormValidation />} />
          <Route path="/datatable" element={<DataTable />} />
          <Route path="/useraccount" element={<UserAccount />} />
          <Route path="/orderdetails/:id" element={<OrderDetail />} />
          {/* <Route path="/orders/:id/invoice" element={<Invoice />} /> */}
          <Route path="/invoice/:orderId" element={<Invoice />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/transaction" element={<Transaction />} />
          <Route path="/report" element={<Report />} />
          <Route path="/review" element={<Review/>}/>
        </Route>
        {/* Catch all route - serves index.html for all routes */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;