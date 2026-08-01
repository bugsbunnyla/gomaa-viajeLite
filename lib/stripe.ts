import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const getStripePublishableKey = () => process.env.STRIPE_PUBLISHABLE_KEY!;
