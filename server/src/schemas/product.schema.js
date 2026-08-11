const { z } = require('zod');

const productSchema = z.object({
    name: z.string().min(1),
    description: z.string(),
    price: z.number().int().min(0),
    stock: z.number().int().min(0),
    imageUrl: z.string().optional().nullable(),
});

const productUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().int().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    imageUrl: z.string().optional().nullable(),
});

const reviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500),
});

module.exports = {
    productSchema,
    productUpdateSchema,
    reviewSchema
};
