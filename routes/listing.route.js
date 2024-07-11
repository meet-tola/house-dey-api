import express from "express"

const router = express.Router()

router.get("/test", (req, res) => {
    console.log("router yo");
})

router.post("/test", (req, res) => {
    console.log("router yo");
})

router.put("/test", (req, res) => {
    console.log("router yo");
})

router.delete("/test", (req, res) => {
    console.log("router yo");
})

export default router