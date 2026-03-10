const cron = require("node-cron")
const { exec } = require("child_process")

console.log("Job scheduler started")

cron.schedule("0 */6 * * *", () => {

  console.log("Running SAP job importer...")

  exec("node importJobs.js", (error, stdout, stderr) => {

    if(error){
      console.log("Error:", error)
      return
    }

    console.log(stdout)

  })

})