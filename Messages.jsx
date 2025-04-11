import { doc, onSnapshot, getDoc } from "firebase/firestore";
import React, { useContext, useEffect, useState, useCallback } from "react";
import { UserContext } from "../context/UserContext";
import { db } from "../firebase";
import Message from "./Message";
import { AuthContext } from "../context/AuthContext";

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [translatedTexts, setTranslatedTexts] = useState({});
  const { data } = useContext(UserContext);
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", data.chatId), (docSnap) => {
      if (docSnap.exists()) {
        const chatData = docSnap.data();
        setMessages(chatData.messages || []);
      }
    });

    return () => {
      unSub();
    };
  }, [data.chatId]);

  const getRecipientPreferredLanguage = async (recipientId) => {
    try {
      const userDocRef = doc(db, "users", recipientId);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists() ? userDoc.data().preferredLanguage : null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  const sendTranslationRequest = useCallback(async (text, preferredLanguage, id) => {
    try {
      const response = await fetch("http://localhost:4000/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, preferredLanguage }),
      });

      const data = await response.json();
      if (response.ok) {
        setTranslatedTexts((prev) => ({
          ...prev,
          [id]: data.output,
        }));
      } else {
        console.error("Translation error:", data.error);
      }
    } catch (error) {
      console.error("Error sending translation request:", error);
    }
  }, []);

  useEffect(() => {
    const translateIncomingMessages = async () => {
      const recipientId = data.user.uid;
      const preferredLanguage = await getRecipientPreferredLanguage(recipientId);

      messages.forEach((msg) => {
        if (msg.senderId === currentUser.uid) return; // Sender shouldn't see translation
        if (translatedTexts[msg.id] || !msg.text) return; // Already translated or no text

        sendTranslationRequest(msg.text, preferredLanguage, msg.id);
      });
    };

    if (messages.length > 0) {
      translateIncomingMessages();
    }
  }, [messages, sendTranslationRequest, translatedTexts, currentUser.uid, data.user.uid]);

  return (
    <div className="messages">
      {messages.map((m) => (
        <Message message={m} key={m.id} translatedText={translatedTexts[m.id]} />
      ))}
    </div>
  );
};

export default Messages;
