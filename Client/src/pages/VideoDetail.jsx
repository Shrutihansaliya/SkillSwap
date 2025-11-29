// pages/VideoDetail.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import { toast } from "react-toastify"; // ✅ added

const API_BASE = "http://localhost:4000";

export default function VideoDetail({ swapId, user, reload }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/videos/${swapId}`);
      if (res.data.success) {
        setVideos(res.data.videos || []);
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
      toast.error("Failed to load videos"); // ✅
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [swapId, reload]);

  // Delete Video Function
  const deleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      const res = await axios({
        method: "delete",
        url: `${API_BASE}/api/videos/${videoId}`,
        data: { userId: user._id },
        headers: { "Content-Type": "application/json" },
      });

      if (res.data.success) {
        toast.success("Video deleted successfully!"); // ✅
        setVideos((prev) => prev.filter((v) => v._id !== videoId));
      } else {
        toast.error(res.data.message || "Delete failed"); // ✅
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete failed!"); // ✅
    }
  };

  if (loading)
    return (
      <p className="text-center text-indigo-500 font-medium mt-4">
        Loading videos...
      </p>
    );

  if (videos.length === 0)
    return (
      <p className="text-center text-gray-500 italic mt-4">
        No videos uploaded yet.
      </p>
    );

  const myId = String(user?._id);
  const myVideos = videos.filter((v) => String(v.userId) === myId);
  const partnerVideos = videos.filter((v) => String(v.userId) !== myId);

  return (
    <div className="bg-white/40 backdrop-blur-xl p-8 rounded-3xl shadow-lg">
      <h2 className="text-2xl font-bold mb-8 text-indigo-800 tracking-wide">
        🎥 Uploaded Videos
      </h2>

      {/* ------------- YOUR VIDEOS ------------- */}
      <h3 className="text-xl font-semibold text-blue-700 mb-4">
        📌 Your Videos
      </h3>

      {myVideos.length === 0 ? (
        <p className="text-gray-500 text-sm mb-10">
          You haven't uploaded any videos.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {myVideos.map((video) => (
            <div
              key={video._id}
              className="bg-white/70 backdrop-blur-md p-5 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <video
                controls
                className="w-full rounded-xl border border-gray-100 shadow-md mb-3"
              >
                <source
                  src={`http://localhost:4000/${video.fileUrl}`}
                  type="video/mp4"
                />
              </video>

              <p className="text-sm text-gray-700 mb-2">
                <strong>Description:</strong>{" "}
                <span className="text-gray-600">
                  {video.description || "—"}
                </span>
              </p>

              {/* UPDATED DATE + DELETE BUTTON ROW */}
              <p className="text-xs text-gray-500 mb-4 flex items-center justify-between">
                <span>
                  Uploaded on{" "}
                  <strong>
                    {new Date(video.createdAt).toLocaleDateString()} •{" "}
                    {new Date(video.createdAt).toLocaleTimeString()}
                  </strong>
                </span>

                {/* Small Dustbin Button Right */}
                <button
                  onClick={() => deleteVideo(video._id)}
                  className="px-2 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white shadow ml-3 flex items-center gap-1"
                >
                  <FaTrash className="text-[10px]" />
                  <span className="text-[11px] font-medium">Delete</span>
                </button>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ------------- PARTNER VIDEOS ------------- */}
      <h3 className="text-xl font-semibold text-purple-700 mb-4">
        🤝 Partner's Videos
      </h3>

      {partnerVideos.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Your partner has not uploaded any videos.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {partnerVideos.map((video) => (
            <div
              key={video._id}
              className="bg-white/70 backdrop-blur-md p-5 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300"
            >
              <video
                controls
                className="w-full rounded-xl border border-gray-100 shadow-md mb-3"
              >
                <source
                  src={`http://localhost:4000/${video.fileUrl}`}
                  type="video/mp4"
                />
              </video>

              <p className="text-sm text-gray-700 mb-2">
                <strong>Description:</strong>{" "}
                <span className="text-gray-600">
                  {video.description || "—"}
                </span>
              </p>

              <p className="text-xs text-gray-500">
                Uploaded on{" "}
                <strong>
                  {new Date(video.createdAt).toLocaleDateString()} •{" "}
                  {new Date(video.createdAt).toLocaleTimeString()}
                </strong>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
