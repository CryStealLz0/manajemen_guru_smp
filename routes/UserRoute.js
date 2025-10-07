// routes/UserRoute.js
import express from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from '../controllers/Users.js';
import {
    requireAuth,
    requireRole,
    ensureActiveUser,
    requireSelfOrRole,
} from '../middleware/Middleware.js';
import { validateBody } from '../middleware/ValidateBody.js';

import {
    CreateUserSchema,
    UpdateUserSchema,
} from '../validators/userSchemas.js';

const router = express.Router();

router.get(
    '/',
    requireAuth,
    ensureActiveUser,
    requireRole(['admin']),
    getUsers,
);

router.get(
    '/:id',
    requireAuth,
    ensureActiveUser,
    requireSelfOrRole('id', ['admin']),
    getUserById,
);

router.post(
    '/',
    requireAuth,
    ensureActiveUser,
    requireRole(['admin']),
    validateBody(CreateUserSchema),
    createUser, // controller masih cek async: role exist, unique, dll.
);

router.put(
    '/:id',
    requireAuth,
    ensureActiveUser,
    requireSelfOrRole('id', ['admin']),
    validateBody(UpdateUserSchema),
    updateUser,
);

router.delete(
    '/:id',
    requireAuth,
    ensureActiveUser,
    requireRole(['admin']),
    deleteUser,
);

export default router;
