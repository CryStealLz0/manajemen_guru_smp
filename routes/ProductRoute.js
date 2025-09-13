import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/Products.js';
import { verifyUser } from '../middleware/AuthUser.js';

const router = express.Router();

router.get('/Products', verifyUser, getProducts);
router.get('/Products/:id', verifyUser, getProductById);
router.post('/Products', verifyUser, createProduct);
router.patch('/Products/:id', verifyUser, updateProduct);
router.delete('/Products/:id', verifyUser, deleteProduct);

export default router;
