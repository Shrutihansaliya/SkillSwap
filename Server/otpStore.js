// Simple in-memory OTP store
// Format: { "email@example.com": { otp: "123456", expires: 1715000000000 } }

const otpStore = new Map();
export default otpStore;
