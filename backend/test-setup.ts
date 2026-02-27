jest.mock('@prisma/adapter-pg', () => {
    return {
        PrismaPg: class { }
    };
}, { virtual: true });
