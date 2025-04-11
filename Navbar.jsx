import React, { useContext } from 'react';
import {signOut} from "firebase/auth";
import { auth } from '../firebase';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const {currentUser} = useContext(AuthContext)
  return (
    <div className="navbar">
      <div className="profile">
        <img src={currentUser.photoURL} alt="profile" />
        <div className="userinfo">
          <span className="username">{currentUser.displayName}</span>
          <span className="status">Online</span>
        </div>
      </div>

      <button className="logout" onClick={() => signOut(auth)}>
        Logout
      </button>
    </div>
  )
}

export default Navbar
