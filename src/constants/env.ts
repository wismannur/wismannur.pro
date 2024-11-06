export const env = {
  isProduction: process.env.NODE_ENV === "production",
  baseUrl: process.env.NEXT_DEPLOYMENT_BASE_URL,
  personalEmail: process.env.NEXT_PUBLIC_PERSONAL_EMAIL,
  umami: {
    scriptUrl: process.env.NEXT_DEPLOYMENT_UMAMI_SCRIPT_URL,
    websiteId: process.env.NEXT_DEPLOYMENT_UMAMI_WEBSITE_ID,
  },
};
