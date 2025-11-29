// pages/Meet.jsx
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { FaVideo, FaPhoneSlash } from "react-icons/fa";

const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:4000";
const SOCKET_URL = API_BASE;

const Meet = ({ swapId, swap, currentUser, otherUserId, onCallEnded, onClose }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  const [inCall, setInCall] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // helper: stop all tracks
  const stopStream = (stream) => {
    if (!stream) return;
    stream.getTracks().forEach((t) => t.stop());
  };

  const cleanupMedia = () => {
    stopStream(localStreamRef.current);
    localStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      stopStream(remoteVideoRef.current.srcObject);
      remoteVideoRef.current.srcObject = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  const createPeerConnection = () => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          roomId: swapId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const ensureLocalStream = async () => {
    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }
    return localStreamRef.current;
  };

  // Socket.io setup
  useEffect(() => {
    if (!swapId || !currentUser?._id) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.emit("join-room", { roomId: swapId, userId: currentUser._id });

    socket.on("user-joined", ({ userId }) => {
      console.log("👥 User joined room:", userId);
    });

    socket.on("offer", async ({ offer }) => {
      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        await ensureLocalStream();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer", { roomId: swapId, answer: pc.localDescription });
        setInCall(true);
      } catch (err) {
        console.error("Error handling offer:", err);
        setErrorMsg("Error receiving call");
      }
    });

    socket.on("answer", async ({ answer }) => {
      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        const pc = createPeerConnection();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error adding ice candidate:", err);
      }
    });

    socket.on("user-left", () => {
      console.log("👋 Peer left room");
      // peer cut kare to apde pan clean up kari deiye
      endCall(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-room", {
          roomId: swapId,
          userId: currentUser._id,
        });
        socketRef.current.disconnect();
      }
      cleanupMedia();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapId, currentUser?._id]);

  const startCall = async () => {
    if (!swapId || !currentUser?._id || !otherUserId) {
      setErrorMsg("Missing swap or user information for call.");
      return;
    }
    if (inCall || connecting) return;

    try {
      setConnecting(true);
      setErrorMsg("");

      // 1️⃣ backend ma call record create
      const res = await axios.post(
        `${API_BASE}/api/calls/start`,
        {
          swapId,
          callerId: currentUser._id,
          receiverId: otherUserId,
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data.call?._id) {
        setCurrentCallId(res.data.call._id);
      }

      // 2️⃣ local media
      await ensureLocalStream();

      // 3️⃣ WebRTC offer
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit("offer", {
        roomId: swapId,
        offer: pc.localDescription,
      });

      setInCall(true);
    } catch (err) {
      console.error("startCall error:", err);
      const msg =
        err?.response?.data?.message || err.message || "Failed to start call";
      setErrorMsg(msg);
      alert(msg);
      cleanupMedia();
    } finally {
      setConnecting(false);
    }
  };

  const endCall = async (manual = true) => {
    try {
      if (currentCallId) {
        await axios.put(
          `${API_BASE}/api/calls/end/${currentCallId}`,
          { status: manual ? "completed" : "cancelled" },
          { withCredentials: true }
        );
      }
    } catch (err) {
      console.error("endCall error:", err?.response?.data || err);
    } finally {
      setCurrentCallId(null);
      setInCall(false);
      cleanupMedia();
      onCallEnded && onCallEnded();
    }
  };

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-lg p-4 border border-blue-100">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
          <FaVideo /> Live Video Call
        </h4>
        <button
          onClick={() => {
            if (inCall) {
              if (window.confirm("End call and close panel?")) {
                endCall(true);
              }
            }
            onClose && onClose();
          }}
          className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
        >
          Close
        </button>
      </div>

      {swap && (
        <p className="text-xs text-gray-500 mb-2">
          {swap.Sender?.Username} ↔ {swap.Receiver?.Username}
        </p>
      )}

      {errorMsg && (
        <p className="text-xs text-red-500 mb-2">⚠ {errorMsg}</p>
      )}

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 bg-black rounded-xl overflow-hidden min-h-[180px] flex items-center justify-center">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!localStreamRef.current && (
            <span className="text-xs text-white/60 absolute">
              Your camera preview
            </span>
          )}
        </div>
        <div className="flex-1 bg-black rounded-xl overflow-hidden min-h-[180px] flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!remoteVideoRef.current?.srcObject && (
            <span className="text-xs text-white/60 absolute">
              Waiting for partner...
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={startCall}
          disabled={inCall || connecting}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-medium shadow-md ${
            inCall || connecting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          <FaVideo />
          {connecting ? "Connecting..." : inCall ? "In Call" : "Start Call"}
        </button>

        <button
          onClick={() => endCall(true)}
          disabled={!inCall}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-medium shadow-md ${
            inCall
              ? "bg-red-500 hover:bg-red-600"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          <FaPhoneSlash />
          End Call
        </button>
      </div>
      <p className="text-[11px] text-gray-400 text-center mt-2">
        Make sure camera & microphone permissions are allowed in your browser.
      </p>
    </div>
  );
};

export default Meet;
