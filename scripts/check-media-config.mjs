const mode = (process.env.MEDIA_STORAGE || "local").toLowerCase();
if (mode === "local") {
  console.log("MEDIA_STORAGE=local — development only. Files will be written to public/uploads/.");
  process.exit(0);
}
const required = ["S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "MEDIA_PUBLIC_URL"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing S3 media settings: ${missing.join(", ")}`);
  process.exit(1);
}
console.log("S3-compatible media configuration has all required variables.");
