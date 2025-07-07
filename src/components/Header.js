import React from 'react';

function Header({ user, onSignOut }) {
  return (
    <header className="app-header">
      <h1>I WANT ABS 🏋️</h1>
      {user && (
        <button onClick={onSignOut} className="sign-out-button">
          Sign Out
        </button>
      )}
    </header>
  );
}

export default Header;
