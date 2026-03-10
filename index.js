const express = require("express");
const cron = require("node-cron");
const { importJobs } = require("./importJobs");
const app = express();

// Schedule job import to run every 6 hours
cron.schedule("0 */6 * * *", () => {
  console.log("Running scheduled job import...");
  importJobs().catch(err => console.error("Error in scheduled import:", err));
});

app.use(express.static(".")); // serve website files

app.listen(3000, () => {
  console.log("Server running");
});