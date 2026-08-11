const { z } = require('zod');

const cartSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1)
});

module.exports = {
    cartSchema
};
