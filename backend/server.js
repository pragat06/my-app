// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

// --- Define constants and the Ethers provider ---
const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// --- ABI and signature needed to understand token transfers ---
const erc20ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function transfer(address, uint256)",
];
const ERC20_TRANSFER_SIGNATURE = "0xa9059cbb";


// --- Connect to MongoDB ---
mongoose.connect("mongodb+srv://pragatchari06:LRmzbYUjkpif0nhc@cluster0.ghbszlz.mongodb.net/Web3", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// --- Wallet Schema ---
const walletSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: String,
  privateKey: String,
  mnemonic: String,
});
const Wallet = mongoose.model("Wallet", walletSchema);


// --- POST: Save wallet ---
app.post("/api/wallet", async (req, res) => {
  try {
    const { username, password, address, privateKey, mnemonic } = req.body;
    const existingUser = await Wallet.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newWallet = new Wallet({
      username,
      password: hashedPassword,
      address,
      privateKey,
      mnemonic,
    });
    await newWallet.save();
    res.status(201).json({ message: "Wallet created and saved successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


// --- POST: Fetch latest wallet ---
app.post("/api/wallet/fetch", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await Wallet.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    const userWallets = await Wallet.find({ username });
    const walletsToSend = userWallets.map(w => ({
        username: w.username,
        address: w.address,
        privateKey: w.privateKey,
        mnemonic: w.mnemonic
    }));
    res.json(walletsToSend);
  } catch (error) {
    res.status(500).json({ message: "Error fetching wallets", error });
  }
});


/*
================================================================================
  ✅ UPGRADED & ROBUST ENDPOINT: This version will not crash ✅
================================================================================
*/
app.post("/api/verify-tx", async (req, res) => {
  const { txHash, adminWalletAddress } = req.body;

  if (!txHash || !adminWalletAddress) {
    return res.status(400).json({ isValid: false, message: "Error: Missing parameters." });
  }

  try {
    const tx = await provider.getTransaction(txHash);

    if (!tx) {
      return res.status(404).json({ isValid: false, message: "Transaction hash not found." });
    }

    const isFromAdmin = tx.from.toLowerCase() === adminWalletAddress.toLowerCase();
    
    let txDetails = {};

    // --- LOGIC TO DIFFERENTIATE TRANSACTION TYPE ---

    if (tx.value > 0) {
      txDetails = {
        from: tx.from,
        to: tx.to,
        amount: ethers.formatEther(tx.value),
        tokenSymbol: "BNB",
      };
    } 
    else if (tx.data && tx.data.startsWith(ERC20_TRANSFER_SIGNATURE)) {
      // ✅ --- ADDED A an inner try/catch block to prevent the server from ever crashing --- ✅
      try {
        const iface = new ethers.Interface(erc20ABI);
        const decodedData = iface.parseTransaction({ data: tx.data });

        if (decodedData && decodedData.name === "transfer") {
          const tokenContract = new ethers.Contract(tx.to, erc20ABI, provider);
          
          const [tokenSymbol, tokenDecimals] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.decimals()
          ]).catch(() => ['Unknown Token', 18]);

          txDetails = {
            from: tx.from,
            to: decodedData.args[0],
            amount: ethers.formatUnits(decodedData.args[1], tokenDecimals),
            tokenSymbol: tokenSymbol,
          };
        } else {
          // If decoding succeeds but it's not a transfer function, treat as a complex interaction
          throw new Error("Decoded but not a simple transfer function.");
        }
      } catch (innerError) {
        // If any part of the token parsing fails, we fall back gracefully here
        console.error("Could not parse as ERC20 transfer, falling back:", innerError.message);
        txDetails = {
          from: tx.from,
          to: tx.to,
          amount: "N/A",
          tokenSymbol: "Complex Interaction",
        };
      }
    }
    else {
      txDetails = {
        from: tx.from,
        to: tx.to,
        amount: "N/A",
        tokenSymbol: "Contract Interaction",
      };
    }
    
    res.json({
      isValid: isFromAdmin,
      message: isFromAdmin 
        ? "✅ SUCCESS: Transaction was sent from the specified admin wallet." 
        : "❌ FAILED: This transaction was NOT sent by the specified admin wallet.",
      details: txDetails,
    });

  } catch (error) {
    console.error("Main verification handler error:", error);
    res.status(500).json({
      isValid: false,
      message: "An internal server error occurred during verification.",
    });
  }
});


// --- Start server ---
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
  console.log("Robust verification endpoint is live at POST /api/verify-tx");
});