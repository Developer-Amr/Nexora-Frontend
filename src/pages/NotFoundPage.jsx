import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function NotFoundPage() {
  useBodyClass('notFound');
  usePageTitle('Not Found');

  return (
    <>
      <Navbar />
      <main className="not-found-page d-flex align-items-center justify-content-center text-center">
        <div className="container py-5">
          <h1 className="display-4 fw-bold">404</h1>
          <p className="lead text-muted">This page does not exist.</p>
          <Link className="btn start-btn px-4 py-2" to="/">Back to Home</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
