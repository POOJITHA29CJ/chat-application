import React from 'react';
import Sidebarcontacts from  "../components/Sidebarcontacts";
import Chat from "../components/Chat";
const Home = () => {
  return (
    <div className="chatWrapper"> {/* NEW OUTER WRAPPER */}
      <div className='home'>
        <div className='container'>
          <Sidebarcontacts />
          <Chat />
        </div>
      </div>
    </div>
  )
}

export default Home;
