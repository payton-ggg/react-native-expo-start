import express from "express";
import cors from "cors";
import dotend from "dotenv";
import { initDB, sql } from "./config/db.js";
import rateLimit from "express-rate-limit";
import voteLimiter from "./middleware/voteLimiter.js";

dotend.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/api/transactions/:user_id", voteLimiter, async (req, res) => {
  try {
    const { user_id } = req.params;

    const transactions = await sql`
        SELECT * FROM transactions
        WHERE user_id = ${user_id}
        ORDER BY created_at DESC
      `;

    res.json(transactions);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.post("/api/transactions", voteLimiter, async (req, res) => {
  try {
    const { title, amount, category, user_id } = req.body;

    if (!title || amount === undefined || !category || !user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const transaction = await sql`
        INSERT INTO transactions (user_id, title, category,amount ) 
        VALUES (${user_id}, ${title}, ${category}, ${amount})
        RETURNING *
      `;
    console.log(transaction);
    res.status(201).json(transaction[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.delete("/api/transactions/:id", voteLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction id" });
    }

    const transaction = await sql`
        DELETE FROM transactions
        WHERE id = ${id}
        RETURNING *
      `;

    if (transaction.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(transaction[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

app.get("/api/transactions/summary/:user_id", voteLimiter, async(req, res) => {
  try {
    const { user_id } = req.params;

    const balanceResult = await sql`
      SELECT COALESCE(SUM(amount), 0) AS balance FROM transactions WHERE user_id = ${user_id}`;

    const incomeResult = await sql`
    SELECT COALESCE(SUM(amount), 0) AS income FROM transactions WHERE user_id = ${user_id} AND amount > 0`;

    const expenseResult = await sql`
    SELECT COALESCE(SUM(amount), 0) AS expense FROM transactions WHERE user_id = ${user_id} AND amount < 0`;

    res.status(200).json({
      balance: balanceResult[0].balance,
      income: incomeResult[0].income,
      expense: expenseResult[0].expense
    })
} catch (error) {
    console.log(error);
    res.status(500).json({ message: "Getting summary failed" });
  }
})

initDB().then(() => {
  app.listen(5001, () => {
    console.log("Server is running on port http://localhost:5001");
  });
});
