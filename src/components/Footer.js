import React from 'react';

const InstagramIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    width="24" 
    height="24" 
    style={{ 
      fill: 'none', 
      stroke: 'currentColor', 
      strokeWidth: 2,
      transition: 'transform 0.3s ease',
    }}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    width="24" 
    height="24" 
    style={{ 
      fill: 'none', 
      stroke: 'currentColor', 
      strokeWidth: 2,
      transition: 'transform 0.3s ease',
    }}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
  </svg>
);

const FacebookIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    width="24" 
    height="24" 
    style={{ 
      fill: 'none', 
      stroke: 'currentColor', 
      strokeWidth: 2,
      transition: 'transform 0.3s ease',
    }}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const Footer = ({ 
  organization = "아주대학교",
  logoUrl = "/logo.png",
  logoAlt = "Organization Logo",
  address = "16499 경기도 수원시 월드컵로 206",
  phone = "031-219-2114",
  copyright = "Copyright © 2024 아주대학교. All rights reserved.",
  // 나중에 필요한 걸로 수정하기
  navigationLinks = [
    { label: "About", href: "https://mportal.ajou.ac.kr/main.do" },
    { label: "Services", href: "#" },
    { label: "Contact", href: "#" }
  ],
  socialLinks = {
    facebook: "https://www.facebook.com/ajouuniversity/?locale=ko_KR",
    youtube: "https://www.youtube.com/@-ajouuniversity4682",
    instagram: "https://www.instagram.com/ajou_university/"
  }
}) => {
  const styles = {
    footer: {
      width: '100%',
      backgroundColor: '#f8f9fa',
      color: '#333',
      fontFamily: 'Arial, sans-serif'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 20px'
    },
    nav: {
      borderBottom: '1px solid #eee',
      padding: '15px 0'
    },
    navList: {
      display: 'flex',
      gap: '30px',
      listStyle: 'none',
      margin: 0,
      padding: 0
    },
    navLink: {
      color: '#666',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'color 0.3s ease'
    },
    mainContent: {
      display: 'flex',
      alignItems: 'center',
      padding: '30px 0',
      gap: '40px'
    },
    logo: {
      height: '50px',
      width: 'auto'
    },
    infoContainer: {
      flex: 1,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    addressBlock: {
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#666'
    },
    phone: {
      marginTop: '5px',
      fontWeight: '500'
    },
    socialLinks: {
      display: 'flex',
      gap: '15px'
    },
    socialLink: {
      color: '#666',
      transition: 'color 0.3s ease, transform 0.3s ease',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    copyright: {
      borderTop: '1px solid #eee',
      padding: '15px 0',
      fontSize: '14px',
      color: '#666'
    }
  };

  const handleSocialHover = (e, enter) => {
    e.currentTarget.style.color = enter ? '#007bff' : '#666';
    e.currentTarget.style.transform = enter ? 'translateY(-2px)' : 'translateY(0)';
  };

  return (
    // 어바웃, 서비스, 컨텍 부분
    <footer style={styles.footer}>
      <div style={styles.container}>
        <nav style={styles.nav}>
          <ul style={styles.navList}>
            {navigationLinks.map((link, index) => (
              <li key={index}>
                <a 
                  href={link.href} 
                  style={styles.navLink}
                  onMouseOver={(e) => e.target.style.color = '#007bff'}
                  onMouseOut={(e) => e.target.style.color = '#666'}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 중간 부분 */}
        <div style={styles.mainContent}>
          <img src={logoUrl} alt={logoAlt} style={styles.logo} />
          
          <div style={styles.infoContainer}>
            <div style={styles.addressBlock}>
              <div>{address}</div>
              <div style={styles.phone}>T. {phone}</div>
            </div>

            <div style={styles.socialLinks}>
              <a 
                href={socialLinks.instagram} 
                style={styles.socialLink}
                onMouseOver={(e) => handleSocialHover(e, true)}
                onMouseOut={(e) => handleSocialHover(e, false)}
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a 
                href={socialLinks.youtube} 
                style={styles.socialLink}
                onMouseOver={(e) => handleSocialHover(e, true)}
                onMouseOut={(e) => handleSocialHover(e, false)}
                aria-label="Youtube"
              >
                <YoutubeIcon />
              </a>
              <a 
                href={socialLinks.facebook} 
                style={styles.socialLink}
                onMouseOver={(e) => handleSocialHover(e, true)}
                onMouseOut={(e) => handleSocialHover(e, false)}
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>
        </div>

        <div style={styles.copyright}>
          {copyright}
        </div>
      </div>
    </footer>
  );
};

export default Footer;