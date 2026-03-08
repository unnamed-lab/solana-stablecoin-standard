import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchTokenData, fetchAllTokens } from './api';

vi.mock('axios');

describe('TUI API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchTokenData', () => {
        it('should fetch data for a specific mint', async () => {
            const mockData = { name: 'Test Token', symbol: 'TST' };
            vi.mocked(axios.get).mockResolvedValue({ data: mockData });

            const data = await fetchTokenData('mint123');

            expect(data).toEqual(mockData);
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/tokens/mint123'));
        });

        it('should handle API errors', async () => {
            vi.mocked(axios.get).mockRejectedValue(new Error('API Error'));

            await expect(fetchTokenData('mint123')).rejects.toThrow('API Error');
        });
    });

    describe('fetchAllTokens', () => {
        it('should fetch list of all tokens', async () => {
            const mockTokens = [{ mint: '1' }, { mint: '2' }];
            vi.mocked(axios.get).mockResolvedValue({ data: mockTokens });

            const tokens = await fetchAllTokens();

            expect(tokens).toEqual(mockTokens);
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/tokens'));
        });
    });
});
