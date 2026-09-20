import {VaccineBrand} from '../models/vaccineBrand.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';


const createBrand = asyncHandler(async (req, res) => {
    const { vaccineName, brandName, manufacturer, price, inventory } = req.body;
    const doctorId = req.doctor?._id; // Auth middleware se doctor ki ID

    // 1. Strong Validation: Check if required fields are missing or empty strings
    if (
        !vaccineName?.trim() ||
        !brandName?.trim() ||
        price === undefined ||
        price === '' ||
        inventory === undefined ||
        inventory === ''
    ) {
        throw new ApiError(400, 'Please provide all required fields: vaccineName, brandName, price, and inventory.');
    }

    // 2. Data Type & Range Validation
    const parsedPrice = Number(price);
    const parsedInventory = Number(inventory);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new ApiError(400, 'Price must be a valid positive number.');
    }

    if (isNaN(parsedInventory) || parsedInventory < 0) {
        throw new ApiError(400, 'Inventory must be a valid positive integer.');
    }

    // 3. Business Logic: Check if exact same vaccineName, brandName, and manufacturer already exist for this doctor
    const existingBrand = await VaccineBrand.findOne({
        doctorId,
        vaccineName: { $regex: new RegExp(`^${vaccineName.trim()}$`, 'i') },
        brandName: { $regex: new RegExp(`^${brandName.trim()}$`, 'i') },
        manufacturer: { $regex: new RegExp(`^${manufacturer ? manufacturer.trim() : 'N/A'}$`, 'i') }
    }).lean();

    if (existingBrand) {
        throw new ApiError(
            409, 
            `A brand with the name "${brandName.trim()}" under vaccine "${vaccineName.trim()}" from this manufacturer already exists in your inventory.`
        );
    }

    // 4. Create and Save New Brand Document
    const newBrand = await VaccineBrand.create({
        vaccineName: vaccineName.trim(),
        brandName: brandName.trim(),
        manufacturer: manufacturer?.trim() || 'N/A',
        price: parsedPrice,
        inventory: parsedInventory,
        doctorId
    });

    // 5. Success Response using ApiResponse helper
    return res.status(201).json(
        new ApiResponse(201, newBrand, 'Vaccine brand created successfully.')
    );
});


const getBrands = asyncHandler(async (req, res) => {
    const doctorId = req.doctor?._id; // Login doctor ki ID
    const { vaccineName } = req.query; // Optional filter (jaise ?vaccineName=BCG)

    const query = { doctorId };
    if (vaccineName) {
        query.vaccineName = vaccineName.trim();
    }

    // Database se data fetch karna (.lean() se speed fast ho jati hai)
    const brands = await VaccineBrand.find(query).sort({ createdAt: -1 }).lean();

    return res.status(200).json(
        new ApiResponse(200, brands, 'Vaccine brands fetched successfully.')
    );
});


const updateBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const doctorId = req.doctor?._id;
    const { vaccineName, brandName, manufacturer, price, inventory } = req.body;

    // 1. Find and ensure strict ownership (Security)
    const brand = await VaccineBrand.findOne({ _id: id, doctorId }).lean();
    if (!brand) {
        throw new ApiError(404, 'Vaccine brand not found or you are not authorized to update it.');
    }

    // 2. Prepare update data object securely
    const updateData = {};

    if (vaccineName !== undefined) {
        if (!vaccineName.trim()) throw new ApiError(400, 'Vaccine name cannot be empty.');
        updateData.vaccineName = vaccineName.trim();
    }

    if (brandName !== undefined) {
        if (!brandName.trim()) throw new ApiError(400, 'Brand name cannot be empty.');
        updateData.brandName = brandName.trim();
    }

    if (manufacturer !== undefined) {
        updateData.manufacturer = manufacturer.trim() || 'N/A';
    }

    if (price !== undefined) {
        const parsedPrice = Number(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            throw new ApiError(400, 'Price must be a valid positive number.');
        }
        updateData.price = parsedPrice;
    }

    if (inventory !== undefined) {
        const parsedInventory = Number(inventory);
        if (isNaN(parsedInventory) || parsedInventory < 0) {
            throw new ApiError(400, 'Inventory must be a valid positive integer.');
        }
        updateData.inventory = parsedInventory;
    }

    // 3. Optional Business Logic: Check duplicate if core fields are being modified
    const targetVaccineName = updateData.vaccineName || brand.vaccineName;
    const targetBrandName = updateData.brandName || brand.brandName;
    const targetManufacturer = updateData.manufacturer || brand.manufacturer;

    const duplicateCheck = await VaccineBrand.findOne({
        doctorId,
        _id: { $ne: id }, // Apne aap ko chor kar baqi records check karein
        vaccineName: { $regex: new RegExp(`^${targetVaccineName}$`, 'i') },
        brandName: { $regex: new RegExp(`^${targetBrandName}$`, 'i') },
        manufacturer: { $regex: new RegExp(`^${targetManufacturer}$`, 'i') }
    }).lean();

    if (duplicateCheck) {
        throw new ApiError(409, 'Another brand with the exact same combination already exists in your inventory.');
    }

    // 4. Perform Update Operation
    const updatedBrand = await VaccineBrand.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    ).lean();

    return res.status(200).json(
        new ApiResponse(200, updatedBrand, 'Vaccine brand updated successfully.')
    );
});


const deleteBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const doctorId = req.doctor?._id;

    // Find and delete ensuring strict doctor ownership
    const deletedBrand = await VaccineBrand.findOneAndDelete({ _id: id, doctorId }).lean();

    if (!deletedBrand) {
        throw new ApiError(404, 'Vaccine brand not found or you are not authorized to delete it.');
    }

    return res.status(200).json(
        new ApiResponse(200, null, 'Vaccine brand deleted successfully.')
    );
});

export {
    createBrand,
    getBrands,
    updateBrand,
    deleteBrand
};