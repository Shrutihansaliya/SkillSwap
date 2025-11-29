import City from "../models/City.js";

// Get all cities
export const getCities = async (req, res) => {
  try {
    const cities = await City.find();
    res.status(200).json(cities);
  } catch (err) {
    console.error("Get Cities Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Add new city
export const addCity = async (req, res) => {
  try {
    console.log("AddCity Request Body:", req.body);
    const { cityName } = req.body;

    if (!cityName) return res.status(400).json({ message: "City name is required" });

    const existing = await City.findOne({ cityName });
    if (existing) return res.status(400).json({ message: "City already exists" });

    const city = new City({ cityName });
    await city.save();

    console.log("City added successfully:", city);
    res.status(201).json({ message: "City added successfully", city });
  } catch (err) {
    console.error("Add City Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update city
export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { cityName } = req.body;

    if (!cityName) return res.status(400).json({ message: "City name is required" });

    const city = await City.findByIdAndUpdate(id, { cityName }, { new: true });

    if (!city) return res.status(404).json({ message: "City not found" });

    console.log("City updated successfully:", city);
    res.status(200).json({ message: "City updated successfully", city });
  } catch (err) {
    console.error("Update City Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete city
export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await City.findByIdAndDelete(id);
    if (!city) return res.status(404).json({ message: "City not found" });

    console.log("City deleted successfully:", city);
    res.status(200).json({ message: "City deleted successfully" });
  } catch (err) {
    console.error("Delete City Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Toggle status Active/Inactive
export const toggleCityStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await City.findById(id);
    if (!city) return res.status(404).json({ message: "City not found" });

    city.status = city.status === "Active" ? "Inactive" : "Active";
    await city.save();

    console.log("City status toggled:", city.cityName, city.status);
    res.status(200).json({ message: "City status updated successfully", city });
  } catch (err) {
    console.error("Toggle City Status Error:", err);
    res.status(500).json({ message: err.message });
  }
};
