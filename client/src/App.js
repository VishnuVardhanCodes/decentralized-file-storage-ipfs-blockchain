import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import { WalletProvider } from "./context/WalletContext";
import NavigationBar from "./components/Navbar";
import Footer from "./components/Footer";
import NetworkWarning from "./components/NetworkWarning";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import MyFiles from "./pages/MyFiles";
import FileDetails from "./pages/FileDetails";
import VerifyFile from "./pages/VerifyFile";
import NotFound from "./pages/NotFound";

import "./styles/App.css";

function App() {
  return (
    <NotificationProvider>
      <WalletProvider>
        <Router>
          <div className="app-container">
            <NavigationBar />
            <NetworkWarning />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/my-files" element={<MyFiles />} />
                <Route path="/file/:id" element={<FileDetails />} />
                <Route path="/verify" element={<VerifyFile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </WalletProvider>
    </NotificationProvider>
  );
}

export default App;
