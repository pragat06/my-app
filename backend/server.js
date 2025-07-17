// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 Connect to MongoDB
mongoose.connect("mongodb+srv://pragatchari06:LRmzbYUjkpif0nhc@cluster0.ghbszlz.mongodb.net/Web3", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 📦 Wallet Schema

 const walletSchema = new mongoose.Schema({
  username: String,  // ✅ new field
  address: String,
  privateKey: String,
  mnemonic: String,
});

;

const Wallet = mongoose.model("Wallet", walletSchema);

// 📨 POST: Save wallet

  app.post("/api/wallet", async (req, res) => {
  const { username, address, privateKey, mnemonic } = req.body;

  const newWallet = new Wallet({ username, address, privateKey, mnemonic });
  await newWallet.save();

  res.json({ message: "Wallet saved!" });
});


// 📤 GET: Fetch latest wallet
app.get("/api/wallet", async (req, res) => {
  const latestWallet = await Wallet.findOne().sort({ _id: -1 });
  res.json(latestWallet);
});
// 📤 GET: Fetch wallets by username
app.get("/api/wallet/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const userWallets = await Wallet.find({ username }).sort({ _id: -1 });

    if (userWallets.length === 0) {
      return res.status(404).json({ message: "No wallets found for this user" });
    }

    res.json(userWallets);
  } catch (error) {
    res.status(500).json({ message: "Error fetching wallets", error });
  }
});

// 🟢 Start server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

// mongodb+srv://pragatchari06:LRmzbYUjkpif0nhc@cluster0.ghbszlz.mongodb.net/
// pragatchari06
// LRmzbYUjkpif0nhc