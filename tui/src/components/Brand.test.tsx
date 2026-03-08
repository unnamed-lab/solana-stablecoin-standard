import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import Brand from './Brand';

describe('Brand Component', () => {
    it('renders the Superteam logo and brand text', () => {
        const { lastFrame } = render(<Brand />);
        const frame = lastFrame();

        expect(frame).toContain('SOLANA');
        expect(frame).toContain('SUPERTEAM');
        expect(frame).toContain('Stablecoin Standard');
    });
});
