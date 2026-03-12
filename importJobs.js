const Parser = require("rss-parser");
const { createClient } = require("@supabase/supabase-js");

const parser = new Parser();

// Read GitHub secrets
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// RSS job sources
const JOB_SOURCES = [
  "https://www.indeed.com/rss?q=SAP&l=Canada",
  "https://www.indeed.com/rss?q=SAP&l=United+States",
  "https://www.indeed.com/rss?q=SAP&l=Remote"
];

async function fetchJobs() {
  let jobs = [];

  for (const url of JOB_SOURCES) {
    try {
      const feed = await parser.parseURL(url);

      feed.items.forEach(item => {
        jobs.push({
          title: item.title || "",
          company: item.creator || "Unknown",
          location: "",
          salary: "",
          link: item.link || "",
          description: item.contentSnippet || ""
        });
      });

    } catch (err) {
      console.log("Feed error:", err.message);
    }
  }

  return jobs;
}

async function insertJobs(jobs) {
  for (const job of jobs) {

    if (!job.link) continue;

    // check duplicates
    const { data } = await supabase
      .from("jobs")
      .select("id")
      .eq("link", job.link)
      .limit(1);

    if (data && data.length > 0) continue;

    const { error } = await supabase
      .from("jobs")
      .insert([job]);

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
