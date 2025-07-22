import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Icon } from "@iconify/react/dist/iconify.js";
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
      icon: 'brand-speedtest',
      title: 'Real-time Performance Insights',
      description: 'Track your progress instantly with real-time analytics. Identify strengths and areas for improvement without waiting for semester-end reports.'
    },
    {
      icon: 'cloud-lock-open',
      title: 'Secure & Private',
      description: 'Your results are protected with enterprise-level security and can only be accessed by you and your institution — no data leaks, ever.'
    },
    {
      icon: 'device-mobile-check',
      title: 'Mobile Access',
      description: 'Check your results from any device — whether you\'re at home, at school, or on the go.'
    },
    {
      icon: 'cloud-down',
      title: 'Instant Result Downloads',
      description: 'Download your results instantly in PDF, Excel, or CSV format for easy sharing with family, teachers, or for scholarship applications.'
    },
    {
      icon: 'bell-plus',
      title: 'Personalized Alerts',
      description: 'Receive timely notifications when new results are published, or when academic thresholds are crossed.'
    },
    {
      icon: 'chart-pie',
      title: 'Visual Performance Reports',
      description: 'See how your performance evolves over time through visual dashboards that help you stay motivated and goal-oriented.'
    }
  ];
  const steps = [
    {
      number: 1,
      title: 'Create Your Profile',
      description: 'Sign up quickly and verify your student identity — takes less than 2 minutes.'
    },
    {
      number: 2,
      title: 'Get Connected',
      description: 'Your profile syncs with your school to automatically fetch your latest academic data.'
    },
    {
      number: 3,
      title: 'View & Track Results',
      description: 'Instantly access detailed results and track your semester-wise performance.'
    },
    {
      number: 4,
      title: 'Download & Share',
      description: 'Share your progress with family or apply for internships and scholarships using official result exports.'
    }
  ];

  const testimonials = [
    {
      quote: "I used to stress for days waiting for my report card — now I check my results online and get instant feedback on my performance.",
      name: "Ayesha N.",
      role: "BSCS Student",
      image: "https://randomuser.me/api/portraits/women/45.jpg"
    },
    {
      quote: "Resultify helped me identify where I was falling behind. I used the analytics to focus better and improve my GPA last semester.",
      name: "Ali R.",
      role: "BBA Student",
      image: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      quote: "The mobile result access is a life-saver! My parents love seeing my grades right when they're out.",
      name: "Zara M.",
      role: "B.Ed Student",
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
              <Link to={user.rootLink} className="cta-button hover-none d-flex align-items-center gap-1 justify-content-center">
                <Icon icon='tabler:brand-tabler' stroke='1px' className='fs-22' />
                Dashboard
                {console.log('dashboard: ', user)}
              </Link>
              :
              <Link to="/sign-in" className="cta-button hover-none d-flex align-items-center gap-1 justify-content-center">
                <Icon icon='tabler:login-2' className='fs-22' />
                Login
              </Link>
            }
          </li>
        </ul>
      </header>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <h1 className="fade-in">Transform Your <span>Academic Journey</span> with Smarter System</h1>
          <p className="fade-in delay-1">Resultify empowers students by providing instant, secure access to their academic performance — anytime, anywhere.</p>
          <div className="hero-buttons fade-in delay-2">
            <Link to="/check-result" className="secondary-button"><Icon icon='tabler:school' className='fs-28' /> Check Your Result</Link>
          </div>
        </div>
        <div className="hero-image fade-in delay-3">
          <img src='assets/images/dashboard.svg' alt="Result Management Dashboard" />
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
                <Icon icon={`tabler:${feature.icon}`} className='fs-42' />
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
          <h2>What Our Students Say</h2>
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
        <h2>Ready to Take Control of Your Academic Progress?</h2>
        <p>Join thousands of students using Resultify to stay informed, motivated, and ahead in their academic goals</p>
        <Link to="/check-result" className="cta-button btn-free-trial"><Icon icon='tabler:school' className='fs-28' /> Check Your Result</Link>
      </section>

      {/* Footer */}
      <footer id="contact">
        <div className="footer-content">
          <div className="footer-column fade-in">
            <h3>About Resultify</h3>
            <p>Resultify is designed to empower students and institutions by simplifying result management, improving access, and enhancing academic outcomes.</p>
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
            <p><Icon icon='tabler:map-pin' className='fs-25' /> Nishatabad, Faisalabad</p>
            <p><Icon icon='tabler:phone-call' className='fs-25' /> +92 304 6321166</p>
            <p><Icon icon='tabler:mail' className='fs-25' /> mubashardev0203@gmail.com</p>
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