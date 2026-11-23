import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  buckets: {
    "public-assets": { access: "public_read" },
  },
});
