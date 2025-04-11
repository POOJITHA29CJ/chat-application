import React, { useContext } from 'react';

import Messages from './Messages';
import Input from "../components/Inputs";
import { UserContext } from '../context/UserContext';


const Chat = () => {

  const {data} = useContext(UserContext);
  return (
   
  <div className="chat">
    <div className="chatInfo">
  <div className="userProfile">
    <img
      src={data.user?.photoURL || '/default-avatar.png'} // fallback if no photo
      alt="User Avatar"
      className="userAvatar"
    />
    <span className="userName">{data.user?.displayName || 'User'}</span>
  </div>
</div>
    <Messages />
    <Input />
  </div>

  )
}

export default Chat
