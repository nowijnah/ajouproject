import React from 'react';

const styles = {
  footer: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderTop: '1px solid #ddd',
    textAlign: 'center',
    marginTop: 'auto'  // flex 레이아웃에서 footer를 하단으로 밀어냄
  }
};

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <p>© 2024 아주대학교. All rights reserved.</p>
    </footer>
  );
}