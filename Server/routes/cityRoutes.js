import express from "express";
import { getCities, addCity, updateCity, deleteCity, toggleCityStatus } from "../controllers/cityController.js";

const router = express.Router();

router.get("/", getCities);
router.post("/", addCity);
router.put("/:id", updateCity);            // Updates cityName
router.put("/toggle/:id", toggleCityStatus); // Toggles status
router.delete("/:id", deleteCity);

export default router;
