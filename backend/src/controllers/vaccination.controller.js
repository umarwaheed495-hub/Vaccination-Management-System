import { Vaccination } from "../models/vaccination.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// 1. Get all vaccinations for a specific doctor
const getVaccinations = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;

    if (!doctorId) {
        throw new ApiError(400, "Doctor ID is required");
    }

    const vaccinations = await Vaccination.find({ doctorId });

    if (!vaccinations || vaccinations.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "No vaccinations found for this doctor"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, vaccinations, "Vaccinations fetched successfully"));
});

// 2. Add a new vaccination (Synchronized with recommendedAge)
const addVaccination = asyncHandler(async (req, res) => {
    const { doctorId, name, recommendedAge } = req.body;

    if (!doctorId || !name || !recommendedAge) {
        throw new ApiError(400, "All essential fields (doctorId, name, recommendedAge) are required");
    }

    const newVaccination = await Vaccination.create({
        doctorId,
        name,
        recommendedAge
    });

    return res
        .status(201)
        .json(new ApiResponse(201, newVaccination, "Vaccination added successfully"));
});

// 3. Update an existing vaccination (Synchronized with recommendedAge)
const updateVaccination = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, recommendedAge } = req.body;

    const updatedVaccination = await Vaccination.findByIdAndUpdate(
        id,
        {
            $set: {
                name,
                recommendedAge
            }
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    );

    if (!updatedVaccination) {
        throw new ApiError(404, "Vaccination not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVaccination, "Vaccination updated successfully"));
});

// 4. Delete a vaccination
const deleteVaccination = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedVaccination = await Vaccination.findByIdAndDelete(id);

    if (!deletedVaccination) {
        throw new ApiError(404, "Vaccination not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Vaccination deleted successfully"));
});

export {
    getVaccinations,
    addVaccination,
    updateVaccination,
    deleteVaccination
};