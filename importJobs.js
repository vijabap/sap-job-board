const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { createClient } = require("@supabase/supabase-js")

const SUPABASE_URL = "https://ppgzcywiodxuuxysbnzl.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZ3pjeXdpb2R4dXV4eXNibnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDk0MDYsImV4cCI6MjA4ODQ4NTQwNn0.pebMyucQZKd3q3ypyeAxeG1ZP34OnXJwI0NVgp63jbI"

const APP_ID = "e83ceaab"
const APP_KEY = "47986b777fc5b5b7f267cf3432f90815"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const SAP_SEARCHES = [
  "SAP ABAP",
  "SAP FICO",
  "SAP HANA",
  "SAP SD",
  "SAP MM",
  "SAP BASIS",
  "SAP BTP",
  "SAP SECURITY",
  "SAP SUCCESSFACTORS",
  "SAP PP",
  "SAP QM",
  "SAP IBP",
  "SAP CRM",
  "SAP PM",
  "SAP PS",
  "SAP CO",
  "SAP CS",
  "SAP TM",
  "SAP HR",
  "SAP SCM",
  "SAP PLM",
  "SAP MDG",
  "SAP GRC",
  "SAP GTS"
]

const LOCATIONS = [
  "USA",
  "Canada",
  "Remote"
]

async function clearOldJobs(){
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - 48)

  await supabase
    .from("jobs")
    .delete()
    .lt("created_at", cutoff.toISOString())

  console.log("Old jobs removed")
}

async function importJobs(){
  await clearOldJobs()

  for(const search of SAP_SEARCHES){
    for(const location of LOCATIONS){
      for(let page = 1; page <= 3; page++){
        const query = encodeURIComponent(search)
        const where = encodeURIComponent(location)

        const url = `https://api.adzuna.com/v1/api/jobs/us/search/${page}?app_id=${APP_ID}&app_key=${APP_KEY}&what=${query}&where=${where}&results_per_page=20`

        try {
          const response = await fetch(url)
          const data = await response.json()

          if(!data.results) continue

          for(const job of data.results){
            const jobDate = new Date(job.created)
            const now = new Date()
            const hours = (now - jobDate) / (1000 * 60 * 60)

            if(hours > 48){
              continue
            }

            const jobData = {
              title: job.title,
              company: job.company.display_name,
              location: job.location.display_name,
              salary: job.salary_max ? "$" + job.salary_max : "Not specified",
              link: job.redirect_url,
              created_at: new Date()
            }

            const { data: existing, error } = await supabase
              .from("jobs")
              .select("id")
              .eq("title", jobData.title)
              .eq("company", jobData.company)

            if(error) {
              console.error("Error checking existing job:", error)
              continue
            }

            if(!existing || existing.length === 0){
              await supabase
                .from("jobs")
                .insert([jobData])
              console.log("Added:", jobData.title)
            }
          }
        } catch (error) {
          console.error(`Error fetching ${search} in ${location}:`, error)
        }
      }
    }
  }
  console.log("Import finished")
}

module.exports = { importJobs };

if (require.main === module) {
  importJobs();
}
