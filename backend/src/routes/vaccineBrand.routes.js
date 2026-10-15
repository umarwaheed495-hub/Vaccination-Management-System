import express from 'express';
import { 
    createBrand, 
    getBrands, 
    getBrandById,
    getBrandPrices,
    updateBrand, 
    deleteBrand 
} from '../controllers/vaccineBrand.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 🔒 Saari routes par pehle token verification lazmi hogi
router.use(verifyJWT);

// 🛡️ RBAC: Sirf 'doctor' aur 'admin' roles hi in routes ko access kar sakenge
router.route('/')
    .post(authorizeRoles('doctor', 'admin'), createBrand)
    .get(authorizeRoles('doctor', 'admin'), getBrands);

// Must stay above '/:id', otherwise "prices" would be read as a brand id
router.route('/prices')
    .get(authorizeRoles('doctor', 'admin'), getBrandPrices);

router.route('/:id')
    .get(authorizeRoles('doctor', 'admin'), getBrandById)
    .patch(authorizeRoles('doctor', 'admin'), updateBrand)
    .delete(authorizeRoles('doctor', 'admin'), deleteBrand);

export default router;