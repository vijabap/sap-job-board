import Parser from "rss-parser";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// Supabase credentials from GitHub secrets
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const JOB_SOURCES = [
  "https://www.indeed.com/rss?q=SAP&l=USA",
  "https://www.indeed.com/rss?q=SAP&l=United+States",
  "https://www.indeed.com/rss?q=SAP&l=Canada",
  "https://www.indeed.com/rss?q=SAP&l=Remote"
];

const parser = new Parser();

export async function importJobs() {
  try {
    for (const feedUrl of JOB_SOURCES) {
      const feed = await parser.parseURL(feedUrl);
      for (const item of feed.items) {

        // Optional: filter out old jobs, e.g., last 48 hours
        const pubDate = new Date(item.pubDate);
        const now = new Date();
        const hoursDiff = (now - pubDate) / (1000 * 60 * 60);
        if (hoursDiff > 48) continue;

        const job = {
          title: item.title,
          company: item.creator || "N/A",
          location: item.categories ? item.categories.join(", ") : "N/A",
          description: item.contentSnippet || "",
          link: item.link,
          salary: "", // can fill if available
          created_at: new Date().toISOString()
        };

        // Insert into Supabase
        const { error } = await supabase
          .from("jobs")
          .upsert(job, { onConflict: ["title", "company", "link"] });

        if (error) console.error("Supabase insert error:", error);
      }
    }
    console.log("SAP Jobs import completed successfully!");
  } catch (err) {
    console.error("Error importing SAP jobs:", err);
    throw err;
  }
}

// Run immediately if called directly
if (process.argv[1].endsWith("importJobs.js")) {
  importJobs();
}
