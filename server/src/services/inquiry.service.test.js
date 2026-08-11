const prisma = require('../db');
const inquiryService = require('./inquiry.service');

jest.mock('../db', () => ({
    inquiry: {
        create: jest.fn()
    }
}));

describe('Inquiry Service Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createInquiry', () => {
        it('お問い合わせが正常に作成されること', async () => {
            prisma.inquiry.create.mockResolvedValue({ id: 'i1', email: 'test@example.com', message: 'Hello' });
            
            const result = await inquiryService.createInquiry('test@example.com', 'Hello');
            
            expect(prisma.inquiry.create).toHaveBeenCalledWith({
                data: { email: 'test@example.com', message: 'Hello' }
            });
            expect(result.id).toBe('i1');
        });
    });
});
