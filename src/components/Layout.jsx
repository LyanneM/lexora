import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Outlet /> {/* 👈 this will render the page content */}
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
