import "../styles/global.css"; // for footer styles

function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} Lexora. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
