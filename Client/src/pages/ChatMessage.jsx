import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Picker from "emoji-picker-react";
import { FaCheck, FaCheckDouble } from "react-icons/fa";

const ChatMessage = () => {
  const { swapId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/api/chat/${swapId}?userId=${user._id}`
        );
        if (res.data.success) setMessages(res.data.messages);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [swapId]);

  // Mark as Read when user views the chat
  useEffect(() => {
    const markRead = async () => {
      try {
        await axios.put("http://localhost:4000/api/chat/read", {
          swapId,
          userId: user._id,
        });
      } catch (err) {
        console.error(err);
      }
    };
    markRead();
  }, [swapId]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const lastMsg = messages[0];
      const receiverId =
        lastMsg?.SenderId?._id === user._id
          ? lastMsg?.ReceiverId?._id
          : lastMsg?.SenderId?._id;

      const res = await axios.post("http://localhost:4000/api/chat", {
        swapId,
        senderId: user._id,
        receiverId,
        message: newMessage,
      });

      setMessages([...messages, res.data.message]);
      setNewMessage("");
      setShowEmoji(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Add emoji
  const onEmojiClick = (emojiObject) => {
    setNewMessage((prev) => prev + emojiObject.emoji);
  };

  const renderStatusIcon = (status) => {
    if (status === "Sent")
      return <FaCheck className="text-gray-400 ml-1 inline-block" />;
    if (status === "Delivered")
      return <FaCheckDouble className="text-gray-400 ml-1 inline-block" />;
    if (status === "Read")
      return <FaCheckDouble className="text-blue-500 ml-1 inline-block" />;
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-100">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-4 font-semibold flex items-center justify-between">
        Chat
        <button
          onClick={() => window.history.back()}
          className="text-white font-bold"
        >
          Back
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`flex ${
              msg.SenderId._id === user._id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                msg.SenderId._id === user._id
                  ? "bg-green-500 text-white rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              } shadow`}
            >
              <div className="text-sm font-semibold mb-1">
                {msg.SenderId.Username}
              </div>
              <div>{msg.Message}</div>
              <div className="text-xs text-gray-200 mt-1 text-right flex items-center justify-end">
                {new Date(msg.SentAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {msg.SenderId._id === user._id && renderStatusIcon(msg.Status)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-2 bg-gray-200 flex items-center space-x-2 relative">
        {showEmoji && (
          <div className="absolute bottom-16 left-2 z-10">
            <Picker onEmojiClick={onEmojiClick} />
          </div>
        )}
        <button onClick={() => setShowEmoji(!showEmoji)} className="text-2xl">
          😊
        </button>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 px-4 py-2 rounded-full border focus:outline-none"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatMessage;
