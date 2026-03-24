import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Adzuna APIs
const ADZUNA_URL_US = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_APP_KEY}&what=SAP&where=USA`;

const ADZUNA_URL_CA = `https://api.adzuna.com/v1/api/jobs/ca/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_APP_KEY}&what=SAP&where=Canada`;

// Remotive API
const REMOTIVE_URL = "https://remotive.com/api/remote-jobs";

// SAP keywords (balanced filtering)
const KEYWORDS = [
  "sap", "fico", "abap", "hana", "mm", "sd",
  "bw", "basis", "successfactors", "ariba"
];

// Clean HTML
function cleanHTML(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").substring(0, 1000);
}

// SAP filter (ONLY defined once)
function isSAPJob(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return KEYWORDS.some(k => t.includes(k));
}

async function importJobs() {
  try {
    console.log("🚀 Starting job import...");

    // 1️⃣ Delete ALL old jobs (simplest + reliable)
    await supabase
      .from("jobs")
      .delete()
      .neq("id", "0");

    console.log("🧹 Old jobs deleted");

    let allJobs = [];

    // 2️⃣ Fetch Adzuna (US + Canada)
    for (const url of [ADZUNA_URL_US, ADZUNA_URL_CA]) {
      try {
        const res = await fetch(url);
        const data = await res.json();

        const jobs = data.results || [];
        console.log("Adzuna raw jobs:", jobs.length);

        const formatted = jobs
          .filter(job =>
            isSAPJob(job.title + " " + job.description)
          )
          .map(job => ({
            id: "adzuna-" + job.id,
            title: job.title,
            company: job.company?.display_name || "",
            location: job.location?.display_name || "",
            salary: job.salary_min
              ? `$${job.salary_min} - $${job.salary_max}`
              : "",
            description: cleanHTML(job.description),
            link: job.redirect_url || "",
            created_at: new Date().toISOString()
          }));

        console.log("Adzuna filtered:", formatted.length);
        allJobs.push(...formatted);

      } catch (err) {
        console.error("❌ Adzuna error:", err);
      }
    }

    // 3️⃣ Fetch Remotive
    try {
      const res = await fetch(REMOTIVE_URL);
      const data = await res.json();

      const jobs = data.jobs || [];
      console.log("Remotive raw jobs:", jobs.length);

      const formatted = jobs
        .filter(job =>
          isSAPJob(job.title + " " + job.description)
        )
        .map(job => ({
          id: "remotive-" + job.id,
          title: job.title,
          company: job.company_name,
          location: job.candidate_required_location,
          salary: job.salary || "",
          description: cleanHTML(job.description),
          link: job.url || "",
          created_at: new Date().toISOString()
        }));

      console.log("Remotive filtered:", formatted.length);
      allJobs.push(...formatted);

    } catch (err) {
      console.error("❌ Remotive error:", err);
    }

    // 4️⃣ Remove duplicates (title + company)
    const uniqueJobs = Array.from(
      new Map(allJobs.map(job => [`${job.title}-${job.company}`, job])).values()
    );

    console.log("✅ Total unique jobs:", uniqueJobs.length);

    // 5️⃣ Insert into Supabase
    for (const job of uniqueJobs) {

      const { error } = await supabase
        .from("jobs")
        .insert(job);

      if (error) {
        console.error("❌ Insert error:", error.message);
      } else {
        console.log("✅ Inserted:", job.title);
      }

    }

    console.log("🎉 Job import completed successfully");

  } catch (err) {
    console.error("❌ Import failed:", err);
    process.exit(1);
  }
}

// Run script
importJobs();
