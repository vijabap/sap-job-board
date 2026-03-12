// importJobs.js
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// Use environment variables for security
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// --- CONFIG ---
const JOB_SOURCES = [
  "https://www.indeed.com/rss?q=SAP&l=United+States",
  "https://www.indeed.com/rss?q=SAP&l=Canada",
  "https://www.indeed.com/rss?q=SAP&l=Remote",
  "https://www.juju.com/jobs-q-sap-l-canada.rss",
  "https://www.juju.com/jobs-q-sap-l-united-states.rss",
  "https://www.juju.com/jobs-q-sap-l-remote.rss"
];

// Fetch jobs from API
async function fetchJobs() {
  let allJobs = [];

  for (const url of JOB_SOURCES) {
    const res = await fetch(url);
    const data = await res.json();
    allJobs = allJobs.concat(data.jobs);
  }

  // Filter for SAP jobs and last 48 hours
  const now = Date.now();
  const twoDaysAgo = now - 48 * 60 * 60 * 1000;

  return allJobs.filter(job => 
    job.title.toLowerCase().includes("sap") &&
    new Date(job.posted_at).getTime() > twoDaysAgo
  );
}

// Insert jobs into Supabase
async function insertJobs(jobs) {
  for (const job of jobs) {
    // Skip duplicates based on unique job link
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("link", job.link)
      .limit(1)
      .single()
      .catch(() => ({ data: null }));

    if (existing) continue;

    await supabase
      .from("jobs")
      .insert([
        {
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary || "",
          link: job.link,
          description: job.description || ""
        }
      ])
      .catch(err => console.error("Error inserting job:", err));
  }
}

export async function importJobs() {
  console.log("Fetching jobs...");
  const jobs = await fetchJobs();
  console.log(`Found ${jobs.length} SAP jobs`);

  await insertJobs(jobs);
  console.log("Job import complete!");
}

// If run directly with Node
if (import.meta.url === `file://${process.argv[1]}`) {
  importJobs();
}
