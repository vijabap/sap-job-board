// importJobs.js
import fetch from "node-fetch";
import Parser from "rss-parser"; // npm install rss-parser
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const parser = new Parser();

// Job RSS sources
const JOB_SOURCES = [
  "https://www.indeed.com/rss?q=SAP&l=Canada",
  "https://www.indeed.com/rss?q=SAP&l=USA",
  "https://www.indeed.com/rss?q=SAP&l=United+States",
  "https://www.indeed.com/rss?q=SAP&l=Remote"
];

// Helper: Check if job is within last 48 hours
function isRecent(pubDate) {
  const jobDate = new Date(pubDate);
  const now = new Date();
  const diffHours = (now - jobDate) / 36e5; // ms to hours
  return diffHours <= 48;
}

export async function importJobs() {
  for (const url of JOB_SOURCES) {
    console.log("Fetching jobs from:", url);

    try {
      const feed = await parser.parseURL(url);

      for (const item of feed.items) {
        // Filter: Only SAP jobs & recent
        if (!item.title.toLowerCase().includes("sap")) continue;
        if (!isRecent(item.pubDate)) continue;

        // Extract details
        const job = {
          title: item.title,
          company: item.creator || item.author || "",
          location: item.contentSnippet || "", // RSS may not have structured location
          link: item.link,
          description: item.content || "",
          created_at: new Date().toISOString()
        };

        // Insert into Supabase (avoid duplicates by title + link)
        const { data: existing } = await supabase
          .from("jobs")
          .select("id")
          .eq("title", job.title)
          .eq("link", job.link);

        if (!existing.length) {
          const { error } = await supabase.from("jobs").insert([job]);
          if (error) console.error("Insert error:", error);
          else console.log("Job added:", job.title);
        } else {
          console.log("Job already exists:", job.title);
        }
      }
    } catch (err) {
      console.error("Error fetching/parsing:", err);
    }
  }
}

// If run directly
if (require.main === module) {
  importJobs().catch(err => console.error(err));
}
