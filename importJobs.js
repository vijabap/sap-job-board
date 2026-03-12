import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// --- REPLACE THESE WITH YOUR SUPABASE PROJECT INFO ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- REPLACE THIS WITH YOUR SAP JOB FEED / API URLS ---
const JOB_SOURCES = [
  https://www.indeed.com/rss?q=SAP&l=Canada,
  https://www.indeed.com/rss?q=SAP&l=United+States,
  https://www.indeed.com/rss?q=SAP&l=Remote
];

export async function importJobs() {
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  for (const url of JOB_SOURCES) {
    const res = await fetch(url);
    const text = await res.text();

    // simple RSS parsing (you can improve with rss-parser library)
    const items = text.match(/<item>([\s\S]*?)<\/item>/gi) || [];

    for (const itemRaw of items) {
      const titleMatch = itemRaw.match(/<title>(.*?)<\/title>/i);
      const linkMatch = itemRaw.match(/<link>(.*?)<\/link>/i);
      const dateMatch = itemRaw.match(/<pubDate>(.*?)<\/pubDate>/i);
      const descMatch = itemRaw.match(/<description>(.*?)<\/description>/i);

      const pubDate = dateMatch ? new Date(dateMatch[1]) : now;
      if (pubDate < twoDaysAgo) continue; // skip old jobs

      const job = {
        title: titleMatch ? titleMatch[1] : "No Title",
        company: "SAP",  // or parse company if available
        location: "US/Canada/Remote", // parse if available
        salary: "",       // parse if available
        link: linkMatch ? linkMatch[1] : "",
        description: descMatch ? descMatch[1] : "",
        created_at: pubDate.toISOString()
      };

      // Insert into Supabase
      const { error } = await supabase.from("jobs").insert([job]);
      if (error) console.error("Error inserting job:", error);
    }
  }

  // Optional: delete old jobs >72 hours
  await supabase
    .from("jobs")
    .delete()
    .lt("created_at", new Date(Date.now() - 72*60*60*1000).toISOString());

  console.log("SAP jobs import completed!");
}
