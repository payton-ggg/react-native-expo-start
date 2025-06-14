import express from "express";
import cors from "cors";
import dotend from "dotenv";
import { sql } from "./config/db.js";

dotend.config();

const app = express();

async function initDB() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS transactions(
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      category VARCHAR(255) NOT NULL,
      created_at DATE NOT NULL DEFAULT CURRENT_DATE
    )`;

    console.log("Database connected");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

initDB().then(() => {
  app.listen(5001, () => {
    console.log("Server is running on port locahost:5000");
  });
});
