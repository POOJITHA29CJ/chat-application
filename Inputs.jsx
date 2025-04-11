import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import {
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { v4 as uuid } from "uuid";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { AiFillAudio } from "react-icons/ai";
import { FaFileUpload } from "react-icons/fa";
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const Input = () => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(UserContext);

  const extractTextFromImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:2000/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.text();
      return result.trim();
    } catch (error) {
      console.error("OCR error:", error);
      return "";
    }
  };

  const translateText = async (text, targetLang) => {
    try {
      const response = await fetch("http://localhost:4000/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang }),
      });
      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error("Translation error:", error);
      return text;
    }
  };

  const getRecipientLanguage = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", data.user.uid));
      return userDoc.exists() ? userDoc.data().preferredLanguage : null;
    } catch (err) {
      console.error("Error fetching recipient language:", err);
      return null;
    }
  };

  const handleVoiceInput = () => {
    if (!recognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setText((prev) => prev + " " + speechResult);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
  };

  const handleSend = async (extract = false) => {
    if (isSending) return;
    setIsSending(true);

    let messageText = text;
    let imageUrl = null;

    try {
      if (img) {
        if (extract) {
          messageText = await extractTextFromImage(img);
          const lang = await getRecipientLanguage();
          if (lang) messageText = await translateText(messageText, lang);
        }

        const storageRef = ref(storage, uuid());
        const uploadTask = uploadBytesResumable(storageRef, img);

        uploadTask.on(
          "state_changed",
          null,
          (error) => {
            console.error("Image upload failed:", error);
            setIsSending(false);
          },
          async () => {
            imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
            await sendMessage(messageText, imageUrl);
          }
        );
      } else {
        const lang = await getRecipientLanguage();
        if (lang) messageText = await translateText(messageText, lang);
        await sendMessage(messageText, null);
      }
    } catch (err) {
      console.error("Error in handleSend:", err);
      setIsSending(false);
    }
  };

  const sendMessage = async (textMsg, imageUrl) => {
    const newMessage = {
      id: uuid(),
      text: textMsg,
      senderId: currentUser.uid,
      date: Timestamp.now(),
      img: imageUrl || null,
    };

    await updateDoc(doc(db, "chats", data.chatId), {
      messages: arrayUnion(newMessage),
    });

    const lastMsg = {
      [data.chatId + ".lastMessage"]: { text: textMsg },
      [data.chatId + ".date"]: serverTimestamp(),
    };

    await updateDoc(doc(db, "userChats", currentUser.uid), lastMsg);
    await updateDoc(doc(db, "userChats", data.user.uid), lastMsg);

    setText("");
    setImg(null);
    setShowModal(false);
    setIsSending(false);
  };

  return (
    <div className="input">
      <input
        type="text"
        placeholder="Type a Message"
        onChange={(e) => setText(e.target.value)}
        value={text}
      />
      <div className="send">
        <AiFillAudio
          className={`mic-icon ${isListening ? "listening" : ""}`}
          onClick={handleVoiceInput}
        />

        <input
          type="file"
          style={{ display: "none" }}
          id="file"
          accept="image/*"
          onChange={(e) => {
            setImg(e.target.files[0]);
            setShowModal(true);
          }}
        />
        <label htmlFor="file">
          <FaFileUpload className="upload-icon" />
        </label>

        <button onClick={() => handleSend(false)} disabled={isSending}>
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <p>Extract and translate text from the uploaded image?</p>
            <button onClick={() => handleSend(true)} disabled={isSending}>
              Yes
            </button>
            <button onClick={() => handleSend(false)} disabled={isSending}>
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Input;
