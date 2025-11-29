// pages/Admin/CertificateVerify.jsx
import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:4000/api/verify-certificate";

export default function CertificateVerify() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await axios.get(API);
    setData(res.data.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStatus = async (id, status) => {
    await axios.put(`${API}/${status}/${id}`);
    loadData();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Certificate Verification</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">User</th>
            <th className="p-2 border">Skill</th>
            <th className="p-2 border">Source</th>
            <th className="p-2 border">Certificate</th>
            {/* <th className="p-2 border">Date</th> */}
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item._id} className="border">
              <td className="p-2 border">
                <div className="font-semibold">{item.Username}</div>
                <div className="text-sm text-gray-500">{item.Email}</div>
              </td>

              <td className="p-2 border">{item.SkillName}</td>
              <td className="p-2 border">{item.Source || "N/A"}</td>

              <td className="p-2 border">
                {item.CertificateURL ? (
                 <a
  href={`http://localhost:4000${item.CertificateURL}`}
  target="_blank"
  rel="noreferrer"
  className="text-blue-600 underline"
>
  View Certificate
</a>

                ) : (
                  "No File"
                )}
              </td>

              {/* <td className="p-2 border">
                {new Date(item.AddedDate).toLocaleDateString()}
              </td> */}

              <td className="p-2 border font-semibold">
                {item.CertificateStatus}
              </td>

              <td className="p-2 border flex gap-2">
                <button
                  onClick={() => updateStatus(item._id, "approve")}
                  className="px-3 py-1 bg-green-500 text-white rounded"
                >
                  Approve
                </button>

                <button
                  onClick={() => updateStatus(item._id, "reject")}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
