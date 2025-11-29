// src/components/Chat.jsx
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Picker from "emoji-picker-react";
import { FaSmile } from "react-icons/fa";

const Tick = ({ status }) => {
  if (status === "Sent") {
    return (
      <svg className="inline-block ml-2" width="14" height="14" viewBox="0 0 24 24">
        <path d="M1 13l4 4L23 3" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  } else if (status === "Delivered") {
    return (
      <svg className="inline-block ml-2" width="14" height="14" viewBox="0 0 24 24">
        <path d="M1 13l4 4L23 3" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 13l4 4L26 3" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="inline-block ml-2" width="14" height="14" viewBox="0 0 24 24">
      <path d="M1 13l4 4L23 3" fill="none" stroke="#1c59bbff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 13l4 4L26 3" fill="none" stroke="#1c5ab6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const Chat = ({ selectedSwap, user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef(null);

  // fetch messages and polling
  useEffect(() => {
    let interval;
    const fetchMessages = async () => {
      if (!selectedSwap) return;
      try {
        const res = await axios.get(
          `/api/chat/${selectedSwap._id}?userId=${user._id}`
        );
        if (res.data.success) setMessages(res.data.messages || []);
      } catch (err) {
        console.error("chat fetch err", err);
      }
    };

    if (selectedSwap) {
      fetchMessages();
      // mark read
      axios.put("/api/chat/read", { swapId: selectedSwap._id, userId: user._id }).catch(() => {});
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedSwap, user._id]);

  // auto scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const receiverId = selectedSwap.Sender._id === user._id ? selectedSwap.Receiver._id : selectedSwap.Sender._id;
      const res = await axios.post("/api/chat", {
        swapId: selectedSwap._id,
        senderId: user._id,
        receiverId,
        message: newMessage,
      });
      if (res.data.success && res.data.message) {
        setMessages((p) => [...p, res.data.message]);
        setNewMessage("");
        setShowEmojiPicker(false);
      }
    } catch (err) {
      console.error("sendMessage err", err);
    }
  };

  const onEmojiClick = (emojiData) => setNewMessage((p) => p + emojiData.emoji);

  return (
    <div className="mt-10 flex w-full mx-auto flex-col h-[500px] bg-white/70 backdrop-blur-md shadow-xl overflow-hidden rounded-3xl border border-green-100 transition-all max-w-4xl">
      <div className="bg-gradient-to-r from-green-400 to-green-500 text-white px-5 py-3 flex items-center justify-between rounded-t-3xl shadow-md">
        <span className="font-semibold text-lg tracking-wide">
          Chat with {selectedSwap.Sender._id === user._id ? selectedSwap.Receiver.Username : selectedSwap.Sender.Username}
        </span>
        <button onClick={onClose} className="text-white font-bold text-2xl hover:rotate-90 transition-transform duration-300">
          ×
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-green-50 via-white to-blue-50" ref={scrollRef}>
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 italic mt-20">No messages yet — start the conversation 💬</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.Sender?._id === user._id || msg.SenderId === user._id;
            const status = msg.Status || "Sent";
            return (
              <div key={msg._id} className={`flex mb-3 ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`relative max-w-xs md:max-w-sm break-words px-4 py-2 rounded-2xl shadow-sm transition-all ${isMine ? "bg-gradient-to-r from-green-400 to-green-500 text-white rounded-br-none" : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"}`}>
                  <div className="flex items-end gap-2">
                    <div>{msg.Message}</div>
                    {isMine && <div className="flex items-end"><Tick status={status} /></div>}
                  </div>
                  <div className={`text-[10px] mt-1 ${isMine ? "text-green-100" : "text-gray-400"} text-right`}>
                    {new Date(msg.SentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="relative flex items-center gap-2 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-t border-green-100">
        <button onClick={() => setShowEmojiPicker((p) => !p)} className="text-2xl text-gray-600 hover:text-green-600">
          <FaSmile />
        </button>

        {showEmojiPicker && (
          <div className="absolute bottom-[calc(100%+10px)] left-4 z-50 drop-shadow-xl">
            <Picker onEmojiClick={onEmojiClick} />
          </div>
        )}

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-full border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button onClick={sendMessage} className="bg-gradient-to-r from-green-400 to-green-500 text-white px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all font-semibold">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
