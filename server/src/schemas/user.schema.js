const { z } = require('zod');

const updateProfileSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    password: z.string().min(8).optional().or(z.literal('')),
    securityQuestion: z.string().optional(),
    securityAnswer: z.string().optional().or(z.literal(''))
});

module.exports = {
    updateProfileSchema
};
