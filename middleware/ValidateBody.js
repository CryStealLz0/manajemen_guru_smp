// middleware/validateBody.js
export function validateBody(zodSchema) {
    return (req, res, next) => {
        const parsed = zodSchema.safeParse(req.body);
        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;
            return res
                .status(422)
                .json({
                    ok: false,
                    msg: 'Validasi gagal',
                    errors: fieldErrors,
                });
        }
        // simpan hasil parse yang sudah "bersih"
        req.validated = parsed.data;
        next();
    };
}
