import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// --- REPLACE WITH YOUR SUPABASE URL & SERVICE KEY ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Example job sources (replace with real SAP job APIs or feeds)
const JOB_SOURCES = [
  https://www.indeed.com/rss?q=SAP&l=Canada,
  https://www.indeed.com/rss?q=SAP&l=United+States,
  https://www.indeed.com/rss?q=SAP&l=Remote
];

async function importJobs() {
  for (const url of JOB_SOURCES) {
    try {
      const response = await fetch(url);
      const jobs = await response.json();

      for (const job of jobs) {
        // Filter: Only SAP jobs
        if (!/SAP/i.test(job.title)) continue;

        // Filter: Only last 48 hours
        const postedDate = new Date(job.posted_at);
        const now = new Date();
        const diffHours = (now - postedDate) / (1000 * 60 * 60);
        if (diffHours > 48) continue;

        // Insert into Supabase (ignore duplicates by job id or link)
        const { error } = await supabase
          .from("jobs")
          .upsert([{
            id: job.id, // or generate unique id if not provided
            title: job.title,
            company: job.company,
            location: job.location,
            salary: job.salary || "",
            description: job.description || "",
            link: job.link
          }], { onConflict: ["id"] });

        if (error) console.error("Insert error:", error);
      }
    } catch (err) {
      console.error("Fetch error for", url, err);
    }
  }
  console.log("Job import completed.");
}

// Run immediately if executed directly
if (require.main === module) {
  importJobs().catch(console.error);
}

export { importJobs };
