import fetch from "node-fetch"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://ppgzcywiodxuuxysbnzl.supabase.co"
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_KEY)

const supabase = createClient(supabaseUrl, supabaseKey)

export async function importJobs(){

const url =
"https://remotive.com/api/remote-jobs?search=SAP"

const response = await fetch(url)

const jobs = await response.json()

for(const job of jobs.jobs){

const title = job.title || ""

if(!title.toLowerCase().includes("sap")) continue

await supabase
.from("jobs")
.insert({
title: job.title,
company: job.company_name,
location: job.candidate_required_location,
salary: job.salary || "",
link: job.url
})

}

console.log("Jobs imported")

}

importJobs()
