import { z } from 'zod';

export const CreateUserSchema = z.object({
    full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
    username: z
        .string()
        .regex(
            /^[a-zA-Z0-9._-]{3,32}$/,
            'Username 3–32, huruf/angka/titik/underscore/dash',
        ),
    phone: z.string().optional().or(z.literal('')),
    nip: z.string().optional().or(z.literal('')),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    role_id: z.coerce
        .number({ invalid_type_error: 'Role wajib dipilih' })
        .refine(Number.isFinite, { message: 'Role wajib dipilih' })
        .int()
        .positive('Role wajib dipilih'),
    status: z.string().optional(),
});

export const UpdateUserSchema = z
    .object({
        full_name: z.string().optional(),
        username: z.string().optional(),
        phone: z.string().optional(),
        nip: z.string().optional(),
        password: z.string().optional(),
        confPassword: z.string().optional(),
        role_id: z.coerce.number().optional(),
        status: z.string().optional(),
    })
    .refine((d) => !d.password || d.password === d.confPassword, {
        message: 'Konfirmasi tidak cocok',
        path: ['confPassword'],
    });
