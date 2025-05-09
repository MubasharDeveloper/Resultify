import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faBars,
  faTimes,
  faTachometerAlt,
  faLock,
  faMobileAlt,
  faFileExport,
  faBell,
  faChartPie,
  faMapMarkerAlt,
  faPhone,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import {
  faFacebookF,
  faTwitter,
  faLinkedinIn,
  faInstagram
} from '@fortawesome/free-brands-svg-icons';
import { useAuth } from "../../context/AuthContext";
import './index.css';
import { Link, NavLink, useLocation } from "react-router-dom";

const ResultifyLandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('home');
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Section detection for active link
      const sections = ['home', 'features', 'how-it-works', 'testimonials', 'contact'];
      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveLink(section);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Initialize fade-in animations
    const fadeElements = document.querySelectorAll('.fade-in');

    const fadeInOnScroll = () => {
      fadeElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        if (elementTop < windowHeight - 100) {
          element.classList.add('active');
        }
      });
    };

    window.addEventListener('load', fadeInOnScroll);
    window.addEventListener('scroll', fadeInOnScroll);

    return () => {
      window.removeEventListener('load', fadeInOnScroll);
      window.removeEventListener('scroll', fadeInOnScroll);
    };
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };

  const features = [
    {
      icon: faTachometerAlt,
      title: 'Real-time Analytics',
      description: 'Get instant insights with our powerful analytics dashboard that tracks student performance in real-time.'
    },
    {
      icon: faLock,
      title: 'Secure Platform',
      description: 'Bank-level security ensures your data is always protected with encryption and regular backups.'
    },
    {
      icon: faMobileAlt,
      title: 'Mobile Friendly',
      description: 'Access results and analytics from any device, anywhere with our fully responsive design.'
    },
    {
      icon: faFileExport,
      title: 'Easy Export',
      description: 'Export results in multiple formats (PDF, Excel, CSV) with just a few clicks.'
    },
    {
      icon: faBell,
      title: 'Automated Alerts',
      description: 'Set up custom notifications for students, parents, and staff when results are published.'
    },
    {
      icon: faChartPie,
      title: 'Detailed Reports',
      description: 'Generate comprehensive reports with visualizations to track performance trends over time.'
    }
  ];

  const steps = [
    {
      number: 1,
      title: 'Create Your Account',
      description: 'Sign up for a free account and set up your institution profile. It takes less than 5 minutes.'
    },
    {
      number: 2,
      title: 'Import Student Data',
      description: 'Upload your existing student records or add them manually through our intuitive interface.'
    },
    {
      number: 3,
      title: 'Enter Results',
      description: 'Input student results either individually or through our bulk upload feature to save time.'
    },
    {
      number: 4,
      title: 'Publish & Share',
      description: 'With one click, publish results and share access with students and parents through secure portals.'
    }
  ];

  const testimonials = [
    {
      quote: "Resultify has transformed how we manage student results. What used to take days now takes hours, and the analytics help us identify at-risk students early.",
      name: "Sarah Johnson",
      role: "Principal, Greenfield High School",
      image: "https://randomuser.me/api/portraits/women/45.jpg"
    },
    {
      quote: "The mobile access feature is a game-changer. Parents can now check their children's results instantly without waiting for report cards.",
      name: "Michael Chen",
      role: "IT Director, Riverside College",
      image: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      quote: "We've reduced administrative workload by 60% since implementing Resultify. The automated reports save us countless hours each semester.",
      name: "Amina Diallo",
      role: "Registrar, Westside University",
      image: "https://randomuser.me/api/portraits/women/68.jpg"
    }
  ];

  return (
    <div className="resultify-landing-page">
      {/* Header */}
      <header id="header" className={scrolled ? 'scrolled' : ''}>
        <Link to={'/'} className="logo" onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}>
          <img
            src='assets/images/logo.png'
            alt='site logo'
            className='light-logo'
            style={{ width: 165 }}
          />
        </Link>
        <div className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <FontAwesomeIcon icon={mobileMenuOpen ? faTimes : faBars} />
        </div>
        <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <li>
            <Link
              to="#features"
              className={activeLink === 'features' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}
            >
              Features
            </Link>
          </li>
          <li>
            <Link
              to="#how-it-works"
              className={activeLink === 'how-it-works' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}
            >
              How It Works
            </Link>
          </li>
          <li>
            <Link
              to="#testimonials"
              className={activeLink === 'testimonials' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}
            >
              Testimonials
            </Link>
          </li>
          <li>
            <Link
              to="#contact"
              className={activeLink === 'contact' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
            >
              Contact
            </Link>
          </li>
          <li>
            {user ?
              <Link to={user.rootLink}  className="cta-button hover-none">
                Dashboard
                {console.log('dashboard: ',user)}
              </Link>
              :
              <Link to="/sign-in" className="cta-button hover-none">
                Login
              </Link>
            }
          </li>
        </ul>
      </header>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <h1 className="fade-in">Transform Your <span>Result Management</span> System</h1>
          <p className="fade-in delay-1">Resultify provides an all-in-one solution for educational institutions to manage, analyze, and publish student results efficiently and securely.</p>
          <div className="hero-buttons fade-in delay-2">
            <Link to="#" onClick={(e) => e.preventDefault()} className="secondary-button">Check Result</Link>
          </div>
        </div>
        <div className="hero-image fade-in delay-3">
          <img src='assets/images/dashboard-1.png' alt="Result Management Dashboard" />
        </div>
        <div className="hero-bg"></div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-title fade-in">
          <h2>Powerful Features</h2>
          <p>Resultify comes packed with everything you need to streamline your result management process</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className={`feature-card fade-in ${index % 2 === 0 ? 'delay-1' : 'delay-2'}`} key={index}>
              <div className="feature-icon">
                <FontAwesomeIcon icon={feature.icon} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-title fade-in">
          <h2>How It Works</h2>
          <p>Getting started with Resultify is simple and straightforward</p>
        </div>
        <div className="steps">
          {steps.map((step, index) => (
            <div className={`step fade-in delay-${index}`} key={index}>
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials" id="testimonials">
        <div className="section-title fade-in">
          <h2>What Our Clients Say</h2>
          <p>Trusted by educational institutions worldwide</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div className={`testimonial-card fade-in delay-${index}`} key={index}>
              <div className="testimonial-content">
                "{testimonial.quote}"
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <img src={testimonial.image} alt={testimonial.name} />
                </div>
                <div className="author-info">
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta fade-in">
        <h2>Ready to Transform Your Result Management?</h2>
        <p>Join thousands of educational institutions using Resultify to streamline their processes and improve student outcomes.</p>
        <Link to="#" className="cta-button btn-free-trial" onClick={(e) => e.preventDefault()}>Start Your Free Trial</Link>
      </section>

      {/* Footer */}
      <footer id="contact">
        <div className="footer-content">
          <div className="footer-column fade-in">
            <h3>About Resultify</h3>
            <p>Resultify is a comprehensive result management system designed to help educational institutions manage student performance data efficiently.</p>
            <div className="social-links">
              <Link to="#"><FontAwesomeIcon icon={faFacebookF} /></Link>
              <Link to="#"><FontAwesomeIcon icon={faTwitter} /></Link>
              <Link to="#"><FontAwesomeIcon icon={faLinkedinIn} /></Link>
              <Link to="#"><FontAwesomeIcon icon={faInstagram} /></Link>
            </div>
          </div>
          <div className="footer-column fade-in delay-1">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</Link></li>
              <li><Link to="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>How It Works</Link></li>
              <li><Link to="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>Testimonials</Link></li>
              <li><Link to="#" onClick={(e) => e.preventDefault()}>Pricing</Link></li>
              <li><Link to="#" onClick={(e) => e.preventDefault()}>Blog</Link></li>
            </ul>
          </div>
          <div className="footer-column fade-in delay-2">
            <h3>Support</h3>
            <ul className="footer-links">
              <li><Link to="#" onClick={(e) => e.preventDefault()}>Help Center</Link></li>
              <li><Link to="#" onClick={(e) => e.preventDefault()}>Documentation</Link></li>
              <li><Link to="#" onClick={(e) => e.preventDefault()}>API Reference</Link></li>
              <li><Link to="#" onClick={(e) => e.preventDefault()}>Community</Link></li>
              <li><Link to="#" onClick={(e) => e.preventDefault()}>Contact Us</Link></li>
            </ul>
          </div>
          <div className="footer-column fade-in delay-3">
            <h3>Contact Info</h3>
            <p><FontAwesomeIcon icon={faMapMarkerAlt} /> Nishatabad, Faisalabad</p>
            <p><FontAwesomeIcon icon={faPhone} /> +92 304 6321166</p>
            <p><FontAwesomeIcon icon={faEnvelope} /> mubashardev0203@gmail.com</p>
          </div>
        </div>
        <div className="footer-bottom fade-in">
          <p>&copy; 2025 Resultify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ResultifyLandingPage;