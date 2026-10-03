const PAYMENT_REFERENCE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{5,99}$/;

const normalizePaymentReference = (value) => {
    if (typeof value !== 'string') return null;

    const reference = value.trim().toUpperCase();
    if (!PAYMENT_REFERENCE_PATTERN.test(reference)) return null;

    return reference;
};

module.exports = { normalizePaymentReference };
