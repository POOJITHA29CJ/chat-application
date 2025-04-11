import React, { useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserContext } from '../context/UserContext';

const Inpunttext = () => {
  const [chats, setChats] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const { dispatch } = useContext(UserContext);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = onSnapshot(doc(db, 'userChats', currentUser.uid), (doc) => {
      if (doc.exists()) {
        console.log('📥 Fetched userChats data:', doc.data()); // ✅ log full userChats
        setChats(doc.data());
      } else {
        setChats([]);
      }
    });

    return () => unsub();
  }, [currentUser?.uid]);

  const handleSelect = (user) => {
    if (user) {
      dispatch({ type: 'CHANGE_USER', payload: user });
    }
  };

  return (
    <div className="chats">
      {chats &&
        Object.entries(chats)
          .sort((a, b) => b[1]?.date - a[1]?.date)
          .map(([chatId, chat]) => {
            console.log('🔍 Chat ID:', chatId);
            console.log('📨 Chat Data:', chat);

            return (
              <div
                className="userChat"
                key={chatId}
                onClick={() => handleSelect(chat?.userInfo)}
              >
                {chat?.userInfo?.photoURL ? (
                  <img src={chat.userInfo.photoURL} alt="User Avatar" />
                ) : (
                  <img src="/default-avatar.png" alt="Default Avatar" />
                )}

                <div className="userChatInfo">
                  <span>{chat?.userInfo?.displayName || 'Unknown User'}</span>
                  <p>{chat?.lastMessage?.text || 'No messages yet'}</p>
                </div>
              </div>
            );
          })}
    </div>
  );
};

export default Inpunttext;
