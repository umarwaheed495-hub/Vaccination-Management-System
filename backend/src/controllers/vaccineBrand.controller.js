import {VaccineBrand} from '../models/vaccineBrand.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const MAX_PAGE = 10000; // keeps "skip" far below what MongoDB accepts

// Only the fields the brands pages show or edit (smaller response, less data read)
const BRAND_FIELDS = 'vaccineName brandName manufacturer price inventory';

const parsePositiveInt = (value, fallback, fieldName, max) => {
    if (value === undefined) return fallback;

    if (typeof value !== 'string' || !/^\d+$/.test(value) || Number(value) < 1) {
        throw new ApiError(400, `"${fieldName}" must be a positive whole number.`);
    }
    if (max !== undefined && Number(value) > max) {
        throw new ApiError(400, `"${fieldName}" cannot be greater than ${max}.`);
    }
    return Number(value);
};


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


// GET /api/v1/vaccine-brands?page=1&limit=10[&vaccineName=BCG]
// Always paginated: newest first, at most MAX_LIMIT brands per response.
const getBrands = asyncHandler(async (req, res) => {
    const doctorId = req.doctor?._id; // Login doctor ki ID
    const { vaccineName } = req.query; // Optional filter (jaise ?vaccineName=BCG)

    const page = parsePositiveInt(req.query.page, 1, 'page', MAX_PAGE);
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT, 'limit'), MAX_LIMIT);

    const filter = { doctorId };
    if (vaccineName !== undefined) {
        if (typeof vaccineName !== 'string') {
            throw new ApiError(400, '"vaccineName" must be text.');
        }
        if (vaccineName.trim()) filter.vaccineName = vaccineName.trim();
    }

    const brands = await VaccineBrand.find(filter)
        .select(BRAND_FIELDS)
        .sort({ createdAt: -1, _id: -1 }) // _id keeps the order stable when two brands share a createdAt
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    // A page that is not full already tells us the total, so the count query is skipped in the usual case
    // (the last page). It only runs for a full page, or for an empty page after page 1.
    const isShortPage = brands.length < limit && (page === 1 || brands.length > 0);
    const total = isShortPage
        ? (page - 1) * limit + brands.length
        : await VaccineBrand.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                brands,
                pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }
            },
            'Vaccine brands fetched successfully.'
        )
    );
});

// GET /api/v1/vaccine-brands/:id - one brand (used by the Edit page, so it no longer downloads the whole list)
const getBrandById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!/^[a-f\d]{24}$/i.test(String(id))) {
        throw new ApiError(400, 'Invalid brand id.');
    }

    const brand = await VaccineBrand.findOne({ _id: id, doctorId: req.doctor?._id })
        .select(BRAND_FIELDS)
        .lean();

    if (!brand) {
        throw new ApiError(404, 'Vaccine brand not found.');
    }

    return res.status(200).json(new ApiResponse(200, brand, 'Vaccine brand fetched successfully.'));
});

// GET /api/v1/vaccine-brands/prices - brandName + price of every brand (used to show prices on the
// patient vaccination card). Not paginated on purpose: the card needs all of them, but only 2 fields each.
const getBrandPrices = asyncHandler(async (req, res) => {
    const prices = await VaccineBrand.find({ doctorId: req.doctor?._id })
        .select('brandName price -_id')
        .lean();

    return res.status(200).json(new ApiResponse(200, prices, 'Vaccine brand prices fetched successfully.'));
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
    getBrandById,
    getBrandPrices,
    updateBrand,
    deleteBrand
};