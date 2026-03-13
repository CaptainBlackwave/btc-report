'use client';

export function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <svg className="btc-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" stroke="#f7931a" strokeWidth="2"/>
            <path d="M16 6v2M16 24v2M16 8.5c-2.5 0-4.5 1.5-4.5 4s2 4.5 4.5 4.5 4.5 1.5 4.5 4-2 4.5-4.5 4.5" stroke="#f7931a" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 12h2l1 4 2-6 2 4 1-2h3" stroke="#f7931a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1>
            <span className="dump">DUMP</span>
            <span className="btc">BTC</span>
          </h1>
        </div>
        <p className="tagline">AI-Powered Bitcoin Prediction</p>
      </div>
    </header>
  );
}
