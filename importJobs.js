import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// FREE working API (no blocking)
const API_URL = "https://remotive.com/api/remote-jobs";

async function importJobs() {
  try {
    console.log("Fetching jobs...");

    const res = await fetch(API_URL);
    const data = await res.json();

    const jobs = data.jobs;

    // 1️⃣ Delete jobs older than 48 hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    await supabase
      .from("jobs")
      .delete()
      .lt("created_at", cutoff);

    console.log("Old jobs deleted");

    // 2️⃣ Filter SAP jobs + US/Canada/Remote
  const filteredJobs = jobs.filter(job =>
  job.title.toLowerCase().includes("sap") ||
  job.description.toLowerCase().includes("sap")
);

    console.log(`Filtered ${filteredJobs.length} SAP jobs`);
    console.log(filteredJobs.slice(0, 3));

    // 3️⃣ Insert into Supabase
    for (const job of filteredJobs) {
      const { error } = await supabase
        .from("jobs")
        .upsert({
          id: job.id.toString(),
          title: job.title,
          company: job.company_name,
          location: job.candidate_required_location,
          salary: job.salary || "",
          description: job.description,
          link: job.url,
          created_at: new Date().toISOString()
        });

      if (error) console.error("Insert error:", error);
    }

    console.log("✅ Jobs imported successfully");

  } catch (err) {
    console.error("❌ Import failed:", err);
    process.exit(1);
  }
}

importJobs();
