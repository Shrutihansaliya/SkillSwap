// pages/Materials.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { FaUpload } from "react-icons/fa";

const Materials = ({ selectedSwap, user, reloadSignal }) => {
  const [materials, setMaterials] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchMaterials = async () => {
    try {
      const res = await axios.get(`/api/materials/${selectedSwap._id}`);
      if (res.data.success) setMaterials(res.data.materials || []);
    } catch (err) {
      console.error("fetchMaterials err", err);
    }
  };

  useEffect(() => {
    if (selectedSwap) fetchMaterials();
    // re-fetch when parent increments reloadSignal
  }, [selectedSwap, reloadSignal]);

  const handleUpload = async (file) => {
    if (!file) return;
    const allowedExtensions = [
      "pdf",
      "txt",
      "doc",
      "docx",
      "ppt",
      "pptx",
      "xls",
      "xlsx",
      "csv",
    ];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      alert("❌ Invalid file type!");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("⚠️ Max size 10 MB");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user._id);

      const res = await axios.post(
        `/api/materials/${selectedSwap._id}/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) =>
            setUploadProgress(Math.round((e.loaded * 100) / e.total)),
        }
      );

      if (res.data.success) {
        alert("✅ Upload OK");
        fetchMaterials();
        setUploadProgress(100);
        setTimeout(() => {
          setUploadProgress(0);
          setIsUploading(false);
        }, 1100);
      } else {
        setIsUploading(false);
        alert(res.data.message || "Upload failed");
      }
    } catch (err) {
      console.error("upload err", err);
      setIsUploading(false);
      alert(err.response?.data?.message || "Upload failed");
    }
  };

  const handleDownload = async (mat) => {
    try {
      const res = await axios.get(`/api/materials/download/${mat._id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", mat.FileURL.split("/").pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download file. Please try again.");
    }
  };

  const handleDelete = async (mat) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      const res = await axios.delete(`/api/materials/${mat._id}`, {
        data: { userId: user._id },
      });
      alert(res.data.message || "Deleted successfully");
      fetchMaterials();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Failed to delete file.");
    }
  };

  return (
    <div className="mt-10">
      <h4 className="text-2xl font-bold text-[#B87C4C] mb-6 flex items-center gap-2">
        <FaUpload className="text-[#B87C4C]" /> Uploaded Materials
      </h4>

      {/* Upload section */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <label className="cursor-pointer inline-flex items-center gap-2 bg-gradient-to-r from-[#B87C4C] to-[#8E5C32] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition">
          <FaUpload />
          Choose file
          <input
            type="file"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files[0])}
          />
        </label>

        {isUploading && (
          <div className="flex items-center gap-3">
            <div className="w-48 relative bg-[#CBBFAE]/60 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-[#B87C4C] to-[#8E5C32]"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs text-gray-700 font-medium">
              {uploadProgress}%
            </span>
          </div>
        )}
      </div>

      {materials.length === 0 ? (
        <p className="text-gray-500 text-center italic bg-[#F7F4EA] border border-[#A8BBA3]/60 rounded-2xl py-4">
          No materials uploaded yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Your uploads */}
          <div className="bg-[#F7F4EA]/95 rounded-3xl shadow-md border border-[#A8BBA3]/70 p-6">
            <h5 className="text-[#B87C4C] font-semibold text-lg mb-4">
              Your Uploaded Materials
            </h5>
            {materials.filter((m) => m.UserId._id === user._id).length === 0 ? (
              <p className="text-gray-500 text-sm">
                You haven’t uploaded anything yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {materials
                  .filter((mat) => mat.UserId._id === user._id)
                  .map((mat) => (
                    <li
                      key={mat._id}
                      className="flex justify-between items-center p-3 rounded-xl shadow-sm border border-[#CBBFAE] bg-white/90"
                    >
                      <div>
                        <a
                          href={`/api/materials/stream/${mat._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#B87C4C] font-medium hover:underline break-all"
                        >
                          {mat.FileURL.split("/").pop()}
                        </a>
                        <p className="text-xs text-gray-500 mt-1">
                          Uploaded on{" "}
                          {new Date(mat.UploadedAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 text-xs sm:text-sm">
                        <button
                          onClick={() => handleDownload(mat)}
                          className="text-[#31513A] hover:text-[#15341E] font-semibold"
                        >
                          ⬇️ Download
                        </button>
                        <button
                          onClick={() => handleDelete(mat)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Partner uploads */}
          <div className="bg-[#F7F4EA]/95 rounded-3xl shadow-md border border-[#A8BBA3]/70 p-6">
            <h5 className="text-[#31513A] font-semibold text-lg mb-4">
              Partner Uploaded Materials
            </h5>

            {materials.filter((m) => m.UserId._id !== user._id).length === 0 ? (
              <p className="text-gray-500 text-sm">
                Your partner hasn’t uploaded anything yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {materials
                  .filter((mat) => mat.UserId._id !== user._id)
                  .map((mat) => (
                    <li
                      key={mat._id}
                      className="p-3 rounded-xl shadow-sm border border-[#CBBFAE] bg-white/90"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <a
                            href={`/api/materials/stream/${mat._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#31513A] font-medium hover:underline break-all"
                          >
                            {mat.FileURL.split("/").pop()}
                          </a>
                          <p className="text-xs text-gray-500 mt-1">
                            Uploaded by{" "}
                            <span className="font-medium text-[#8E5C32]">
                              {mat.UserId.Username}
                            </span>{" "}
                            on {new Date(mat.UploadedAt).toLocaleString()}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDownload(mat)}
                          className="text-[#31513A] hover:text-[#15341E] text-xs sm:text-sm font-semibold"
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;
