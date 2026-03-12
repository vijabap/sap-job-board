import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser();

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// SAP job RSS feeds
const JOB_SOURCES = [
  "https://www.indeed.com/rss?q=SAP&l=Canada",
  "https://www.indeed.com/rss?q=SAP&l=United+States",
  "https://www.indeed.com/rss?q=SAP&l=Remote"
];

async function fetchJobs() {

  let jobs = [];

  for (const url of JOB_SOURCES) {

    const feed = await parser.parseURL(url);

    for (const item of feed.items) {

      jobs.push({
        title: item.title || "",
        company: item.creator || "Unknown",
        location: "",
        salary: "",
        link: item.link || "",
        description: item.contentSnippet || ""
      });

    }
  }

  return jobs;
}

async function insertJobs(jobs) {

  for (const job of jobs) {

    if (!job.link) continue;

    // prevent duplicates
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("link", job.link)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { error } = await supabase
      .from("jobs")
      .insert([
        {
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          link: job.link,
          description: job.description
        }
      ]);

    if (error) {
      console.log("Insert error:", error.message);
    } else {
      console.log("Inserted:", job.title);
    }

  }

}

async function run() {

  console.log("Fetching SAP jobs...");

  const jobs = await fetchJobs();

  console.log(`Found ${jobs.length} jobs`);

  await insertJobs(jobs);

  console.log("Import finished");

}

run();
