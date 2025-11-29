// pages/AddCity.jsx
import { useState, useEffect } from "react";
import axios from "axios";

const AddCity = () => {
  const [cities, setCities] = useState([]);
  const [cityName, setCityName] = useState("");
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  const API_URL = "http://localhost:4000/api/city";

  // Fetch all cities
  const fetchCities = async () => {
    try {
      const res = await axios.get(API_URL);
      setCities(res.data);
      setMessage("");
    } catch (err) {
      console.error("Error fetching cities:", err.response?.data || err.message);
      setMessage("Error fetching cities: " + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // Add or Update City
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cityName.trim()) return alert("City name is required");

    try {
      if (editId) {
        const res = await axios.put(`${API_URL}/${editId}`, { cityName });
        setMessage("City updated successfully");

        // Update local state without refetching
        setCities((prev) =>
          prev.map((c) => (c._id === editId ? { ...c, cityName } : c))
        );
      } else {
        const res = await axios.post(API_URL, { cityName });
        setMessage("City added successfully");
        setCities((prev) => [...prev, res.data.city]);
      }

      setCityName("");
      setEditId(null);
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      setMessage(err.response?.data?.message || "Something went wrong");
    }
  };

  // Edit city
  const handleEdit = (city) => {
    setCityName(city.cityName);
    setEditId(city._id);
  };

  // Toggle Active/Inactive
  const handleToggle = async (city) => {
    try {
      const res = await axios.put(`${API_URL}/toggle/${city._id}`);
      const updatedCity = res.data.city;

      setCities((prev) =>
        prev.map((c) =>
          c._id === updatedCity._id ? { ...c, status: updatedCity.status } : c
        )
      );
    } catch (err) {
      console.error("Error toggling city:", err.response?.data || err.message);
      setMessage(err.response?.data?.message || "Something went wrong");
    }
  };

  const activeCities = cities.filter((c) => c.status === "Active");
  const inactiveCities = cities.filter((c) => c.status === "Inactive");

  // Allow only letters and spaces
  const handleCityNameChange = (e) => {
    const value = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(value)) {
      setCityName(value);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Manage Cities</h2>

      {message && <p className="mb-3 text-green-600">{message}</p>}

      <form onSubmit={handleSubmit} className="mb-6 flex gap-3">
        <input
          type="text"
          placeholder="Enter city name"
          value={cityName}
          onChange={handleCityNameChange} // validation here
          className="border p-2 rounded w-64"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editId ? "Update City" : "Add City"}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-6">
        {/* Active Cities */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Active Cities</h3>
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">City Name</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeCities.length > 0 ? (
                activeCities.map((city) => (
                  <tr key={city._id}>
                    <td className="border p-2">{city.cityName}</td>
                    <td className="border p-2">
  <div className="flex items-center gap-2">

    {/* EDIT BUTTON */}
    <button
      onClick={() => handleEdit(city)}
      className="flex items-center gap-1 bg-green-100 text-green-800 px-4 py-1.5 rounded-xl border border-green-300 hover:bg-green-200 transition"
    >
      ✏ Edit
    </button>

    {/* DEACTIVATE BUTTON */}
    <button
      onClick={() => handleToggle(city)}
      className="flex items-center gap-1 bg-[#2F3A4A] text-white px-4 py-1.5 hover:bg-[#1e2733] transition"
    >
      Deactivate
    </button>

  </div>
</td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="text-center p-2">
                    No active cities found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Inactive Cities */}
        <div>
          <h3 className="text-xl font-semibold mb-2">Inactive Cities</h3>
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">City Name</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inactiveCities.length > 0 ? (
                inactiveCities.map((city) => (
                  <tr key={city._id}>
                    <td className="border p-2">{city.cityName}</td>
                    <td className="border p-2">
  <button
    onClick={() => handleToggle(city)}
    className="flex items-center gap-1 bg-green-600 text-white px-4 py-1.5 hover:bg-green-700 transition"
  >
  Activate
  </button>
</td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="text-center p-2">
                    No inactive cities found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AddCity;
