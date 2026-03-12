import fetch from "node-fetch"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://ppgzcywiodxuuxysbnzl.supabase.co"
const supabaseKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZ3pjeXdpb2R4dXV4eXNibnpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDk0MDYsImV4cCI6MjA4ODQ4NTQwNn0.pebMyucQZKd3q3ypyeAxeG1ZP34OnXJwI0NVgp63jbI

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
