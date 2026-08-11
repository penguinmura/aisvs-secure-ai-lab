const { z } = require('zod');

const inquirySchema = z.object({
    email: z.string().email(),
    message: z.string().min(1).max(1000)
});

module.exports = {
    inquirySchema
};
