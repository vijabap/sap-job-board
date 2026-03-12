// importJobs.js
const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");

// Pull from environment variables set in GitHub Actions
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: Missing SUPABASE_URL or SUPABASE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Replace these with your actual SAP job APIs
const JOB_SOURCES = [
https://www.indeed.com/rss?q=SAP&l=Canada,
  https://www.indeed.com/rss?q=SAP&l=United+States,
  https://www.indeed.com/rss?q=SAP&l=Remote
];

async function importJobs() {
  try {
    for (const url of JOB_SOURCES) {
      let jobs = [];
      try {
        const response = await fetch(url);
        jobs = await response.json();
      } catch (err) {
        console.error(`Failed to fetch jobs from ${url}:`, err);
        continue;
      }

      for (const job of jobs) {
        try {
          // Only SAP jobs
          if (!/SAP/i.test(job.title)) continue;

          // Only last 48 hours
          const postedDate = new Date(job.posted_at || job.date_posted || new Date());
          const now = new Date();
          const diffHours = (now - postedDate) / (1000 * 60 * 60);
          if (diffHours > 48) continue;

          // Upsert job into Supabase
          const { error } = await supabase
            .from("jobs")
            .upsert([{
              id: job.id,
              title: job.title,
              company: job.company || "",
              location: job.location || "",
              salary: job.salary || "",
              description: job.description || "",
              link: job.link || ""
            }], { onConflict: ["id"] });

          if (error) console.error("Supabase insert error:", error);

        } catch (err) {
          console.error("Error processing job:", job, err);
        }
      }
    }
    console.log("✅ Job import completed successfully.");
  } catch (err) {
    console.error("Unexpected error:", err);
    process.exit(1);
  }
}

// Run immediately
importJobs().catch(err => {
  console.error("ImportJobs failed:", err);
  process.exit(1);
});
