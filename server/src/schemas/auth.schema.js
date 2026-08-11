const { z } = require('zod');

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
    address: z.string().optional(),
    securityQuestion: z.string().optional(),
    securityAnswer: z.string().optional()
});

module.exports = {
    registerSchema
};
