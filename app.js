const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const database = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const questionRoutes = require("./routes/questionRoutes");
const answerRoutes = require("./routes/answerRoutes");
const notesRoutes = require("./routes/notesRoutes");

const PORT = process.env.PORT || 4000;
database.connect();
const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/resource", resourceRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answer", answerRoutes);
app.use("/api/notes", notesRoutes);


app.get("/",(req,res)=>{
    return res.json({
        success:true,
        message:"Your server is running up and running..."
    })
})

app.listen(PORT,()=>{
    console.log(`This server is running at : ${PORT} `)
})

