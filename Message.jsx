import React, { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import { Volume2 } from "lucide-react";

const Message = ({ message, translatedText }) => {
  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(UserContext);
  const ref = useRef();

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  const isOwner = message.senderId === currentUser.uid;

  const formatTime = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : timestamp?.toDate?.();
    if (!date) return "";
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${hours % 12 || 12}:${minutes} ${ampm}`;
  };

  const speak = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const isTamil = /[\u0B80-\u0BFF]/.test(text);
      utterance.lang = isTamil ? "ta-IN" : "en-US";
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) => v.lang === utterance.lang);
      if (matchedVoice) utterance.voice = matchedVoice;
      else if (isTamil) alert("Tamil voice not available in your browser/system.");
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech Synthesis not supported in this browser.");
    }
  };

  return (
    <div ref={ref} className={`message ${isOwner ? "owner" : ""}`}>
      <div className="messageInfo">
        <img
          src={isOwner ? currentUser.photoURL : data.user.photoURL}
          alt="User avatar"
        />
      </div>

      <div className="messageContent">
        <div className="bubble">
          {!isOwner && translatedText ? (
            <p>{translatedText}</p>
          ) : (
            <p>{message.text}</p>
          )}
        </div>

        {/* Timestamp below the bubble */}
        <div className="timestamp">{formatTime(message.date)}</div>

        {message.img && <img src={message.img} alt="Sent content" className="message-image" />}

        {/* Speaker icon outside bubble */}
        {!isOwner && translatedText && (
          <button onClick={() => speak(translatedText)} className="speakButton">
            <Volume2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Message;
