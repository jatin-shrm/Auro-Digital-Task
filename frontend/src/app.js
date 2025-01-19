import React from "react";
import "./styles/app.css";
import Withdraw from "./components/withdraw";
import Deposit from "./components/deposit";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";

function App() {
  return (
    <Router>
      <MainPage />
      <Routes>
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/deposit" element={<Deposit />} />
      </Routes>
    </Router>
  );
}

function MainPage() {
  const location = useLocation();

  if (location.pathname !== "/") {
    return null;
  }

  return (
    <div className="main-page">
      <div className="button-container">
        <Link to="/withdraw" className="main-button">
          Withdraw
        </Link>
        <Link to="/deposit" className="main-button">
          Deposit
        </Link>
      </div>
    </div>
  );
}

export default App;
