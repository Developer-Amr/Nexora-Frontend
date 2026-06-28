import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const BASE = import.meta.env.BASE_URL;

const leaders = [
  {
    name: 'Amir Essam',
    role: 'Ai Engineer',
    image: `${BASE}assets/images/amir_essam.jpg`,
    linkedin: 'https://www.linkedin.com/in/amir-essam-4a687731b',
    github: 'https://github.com/amiressam777'
  },
  {
    name: 'Ahmed Farrag',
    role: 'Ai Engineer',
    image: `${BASE}assets/images/ahmed_farrag.jpg`,
    linkedin: 'https://www.linkedin.com/in/ahmed-farrag-9785842a9',
    github: 'https://github.com/Ahmed-Elsayed1712'
  },
  {
    name: 'Ahmed Sayed',
    role: 'Ai Engineer',
    image: `${BASE}assets/images/ahmed_sayed.jpg`,
    linkedin: 'https://www.linkedin.com/in/ahmed-abdelfattah-',
    github: 'https://github.com/Ahmed9975'
  },
  {
    name: 'Amr Mahmoud',
    role: 'Frontend Developer',
    image: `${BASE}assets/images/amr_mahmoud.jpg`,
    linkedin: 'https://www.linkedin.com/in/amr-mahmoud-dev',
    github: 'https://github.com/Developer-Amr'
  },
  {
    name: 'Mohamed Said',
    role: 'Backend Developer',
    image: `${BASE}assets/images/mohamed_said.jpg`,
    linkedin: 'https://www.linkedin.com/in/mohamed-said-49833831a',
    github: 'https://github.com/mohamedsaid225'
  }
];

const goals = [
  { icon: 'fas fa-chart-line', color: 'primary', title: 'High Quality', text: 'Providing world-class digital exam infrastructure.' },
  { icon: 'fas fa-microchip', color: 'success', title: 'Smart Analytics', text: 'Providing deep insights into student performance.' },
  { icon: 'fas fa-users', color: 'warning', title: 'Global Access', text: 'Supporting students from all geographical locations.' },
  { icon: 'fas fa-infinity', color: 'danger', title: 'Sustainability', text: 'Reducing paper waste through total digital transformation.' },
];

function formatCounter(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M+`;
  if (value >= 1000) return `${Math.floor(value / 1000)}K+`;
  if (value % 1 !== 0) return `${value.toFixed(1)}%`;
  return `${Math.floor(value)}+`;
}

function Counter({ target }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let current = 0;
    let frame = 0;
    const totalFrames = 120;
    const interval = window.setInterval(() => {
      frame += 1;
      current = Math.min(target, target * (frame / totalFrames));
      setValue(current);
      if (frame >= totalFrames) window.clearInterval(interval);
    }, 10);
    return () => window.clearInterval(interval);
  }, [target]);

  return <h2 className="text-center display-6 fw-bolder counter">{formatCounter(value)}</h2>;
}

export default function AboutPage() {
  useBodyClass('aboutUs');
  usePageTitle('About Us');

  return (
    <>
      <Navbar />
      <main className="about-page">
        <section className="our-story my-5 pb-4">
          <div className="container">
            <div className="row align-items-center g-5">
              <div className="col-md-6">
                <h5 className="text-uppercase fw-bold">Our Story</h5>
                <h2 className="display-5 fw-bold mb-4">We Build The Future of Education</h2>
                <p className="lead">Founded in 2024, our platform was created to bridge the gap between traditional testing and modern digital convenience.</p>
                <p>We provide a secure, scalable, and user-friendly environment for both universities and students to manage academic assessments with total integrity and ease.</p>
                <div className="row mt-4 mt-md-5">
                  <div className="col-sm-6 mb-3">
                    <div className="d-flex align-items-center mb-3"><i className="fa-solid fa-circle-check text-primary me-2 fs-5" /><span className="fw-bold">Secure Testing</span></div>
                    <div className="d-flex align-items-center"><i className="fa-solid fa-circle-check text-primary me-2 fs-5" /><span className="fw-bold">Real-time Analytics</span></div>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex align-items-center mb-3"><i className="fa-solid fa-circle-check text-primary me-2 fs-5" /><span className="fw-bold">24/7 Support</span></div>
                    <div className="d-flex align-items-center"><i className="fa-solid fa-circle-check text-primary me-2 fs-5" /><span className="fw-bold">Easy Integration</span></div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <img src={`${import.meta.env.BASE_URL}assets/images/about.avif`} alt="Students Working" className="img-fluid rounded-4 shadow-lg" />
              </div>
            </div>
          </div>
        </section>

        <section className="stats my-5">
          <div className="container py-5 my-5">
            <div className="row g-4">
              <div className="col-md-3 col-sm-6 stat-item"><Counter target={5000} /><p className="mb-0 opacity-75 text-center">Active Students</p></div>
              <div className="col-md-3 col-sm-6 stat-item"><Counter target={20} /><p className="mb-0 opacity-75 text-center">Verified Faculties</p></div>
              <div className="col-md-3 col-sm-6 stat-item"><Counter target={10000} /><p className="mb-0 opacity-75 text-center">Exams Taken</p></div>
              <div className="col-md-3 col-sm-6 stat-item"><Counter target={99.9} /><p className="mb-0 opacity-75 text-center">Grading Accuracy</p></div>
            </div>
          </div>
        </section>

        <section className="our-leadership my-5 py-5">
          <div className="container">
            <div className="text-center mb-4 fw-bold">
              <h5 className="text-uppercase fw-bold mb-0">Meet</h5>
              <h2 className="display-5 fw-bold">Our Leadership</h2>
            </div>
            <div className="row g-4">
              {leaders.map((leader) => (
                <div className="col" key={leader.name}>
                  <div className="card team-card p-4 shadow-sm border-0 text-center h-100">
                    <img src={leader.image} className="team-img" alt={leader.name} />
                    <h5 className="fw-bold mb-1">{leader.name}</h5>
                    <p className="mb-3">{leader.role}</p>
                    <div className="social-links">
                      <a className="text-black" href={leader.linkedin}><i className="fa-brands fa-linkedin fs-5 mx-1" /></a>
                      <a className="text-black" href={leader.github}><i className="fa-brands fa-github fs-5 mx-1" /></a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="our-strategic my-5 pb-5">
          <div className="container">
            <div className="text-center mb-4">
              <h6 className="text-uppercase fw-bold mb-0">Future Map</h6>
              <h2 className="display-5 fw-bold">Our Strategic Goals</h2>
            </div>
            <div className="row g-4">
              {goals.map((goal) => (
                <div className="col-md-6 col-lg-3 text-center" key={goal.title}>
                  <div className={`p-4 bg-white shadow-sm rounded-4 h-100 border-bottom border-${goal.color} border-4`}>
                    <i className={`${goal.icon} mb-3 fs-1 text-${goal.color}`} />
                    <h5 className="fw-bold">{goal.title}</h5>
                    <p className="small text-muted mb-0">{goal.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
