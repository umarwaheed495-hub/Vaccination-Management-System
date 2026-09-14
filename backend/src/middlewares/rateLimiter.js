import rateLimit from "express-rate-limit";

// Global rate limiter configuration
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes ka time window
  max: 100, // Har IP address se 15 minute mein maximum 100 requests allow hongi
  standardHeaders: true, // Draft-6 RateLimit headers Return karega (`RateLimit-*`)
  legacyHeaders: false, // `X-RateLimit-*` headers disable karega
  message: {
    status: 429,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});

// Strict Limiter for sensitive routes (e.g., Auth/Login/OTP)
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 Minutes
  max: 5, // 15 Minute mein sirf 5 attempts allow honge
  message: {
    status: 429,
    message: "Too many login/signup attempts. Please try again after 5 minutes.", // 👈 (Optional) Message update
  },
});