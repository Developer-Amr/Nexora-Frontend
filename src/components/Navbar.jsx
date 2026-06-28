import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { logoutLikeLegacyFrontend } from '../utils/storage.js';
import { useAuthState } from '../hooks/useAuthState.js';


const BASE = import.meta.env.BASE_URL;

function navClass({ isActive }) {
  return `nav-link text-white fs-5 p-0 m-2 ${isActive ? 'active' : ''}`;
}

export default function Navbar({ transparentOnTop = false }) {
  const { isAuthenticated } = useAuthState();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(!transparentOnTop);

  useEffect(() => {
    if (!transparentOnTop) {
      setScrolled(true);
      return undefined;
    }

    const handleScroll = () => {
      const headerHeight = document.querySelector('header')?.offsetHeight || window.innerHeight;
      const navHeight = document.querySelector('nav')?.offsetHeight || 72;
      setScrolled(window.scrollY > headerHeight - navHeight / 2);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparentOnTop]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navStyle = useMemo(() => ({
    backgroundColor: transparentOnTop && !scrolled && !isOpen ? 'transparent' : 'var(--primary)',
  }), [transparentOnTop, scrolled, isOpen]);

  const handleLogout = () => {
    logoutLikeLegacyFrontend();
    navigate('/');
  };

  return (
    <nav className="navbar hiddenNav navbar-expand-lg position-fixed top-0 w-100 z-3" style={navStyle}>
      <div className="container d-flex justify-content-between">
        <h1 className="mb-0">
          <Link className="navbar-brand text-white fst-italic fs-2 me-0" to="/">
          <img src={`${import.meta.env.BASE_URL}assets/images/nexora-logo.png`} alt="Nexora Logo" width={"220px"}/></Link>
        </h1>
        <button
          className="navbar-toggler text-white bg-white"
          type="button"
          aria-controls="navbarSupportedContent"
          aria-expanded={isOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsOpen((value) => !value)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse me-5 pe-5 ${isOpen ? 'show' : ''}`} id="navbarSupportedContent">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item"><NavLink className={navClass} to="/" end>Home</NavLink></li>
            <li className="nav-item"><NavLink className={navClass} to="/exams">Exams</NavLink></li>
            <li className="nav-item"><NavLink className={navClass} to="/about">About Us</NavLink></li>
          </ul>
        </div>
        <div className="d-flex justify-content-center align-items-center gap-1">
          {isAuthenticated ? (
            <>
              <Link className="text-decoration-none text-white px-2" to="/profile" aria-label="Profile">
                <i className="fa-regular profileIcon fa-circle-user fs-4 mt-1" />
              </Link>
              <button className="btn text-white logoutBtn px-3" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link className="text-decoration-none" to="/login">
              <button className="btn text-white loginBtn">Doctor Login</button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
