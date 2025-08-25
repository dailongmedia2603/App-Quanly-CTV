"use client";

import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import EmailContentForm from "./pages/EmailMarketing/EmailContentForm";
import ToastProvider from "./components/ToastProvider";

function App() {
  return (
    <Router>
      <ToastProvider />
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm p-4">
          <nav className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              My App
            </Link>
            <div className="space-x-4">
              <Link to="/email-marketing/create-content" className="text-blue-600 hover:underline">
                Tạo Nội Dung Email
              </Link>
              {/* Add other navigation links here */}
            </div>
          </nav>
        </header>
        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/email-marketing/create-content" element={<EmailContentForm />} />
            {/* Add other routes here */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;