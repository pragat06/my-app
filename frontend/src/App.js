/* App.jsx */
import React, { useState } from "react";
import { ethers } from "ethers";

/* ---------------  ABI & CONSTANTS  --------------- */
const erc20ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function decimals() view returns (uint8)",
];
const USDT_ADDRESS = "0x787a697324dba4ab965c58cd33c13ff5eea6295f";
const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545";

/* ---------------  MAIN COMPONENT  --------------- */
export default function App() {
  /* ----------  Hooks  ---------- */
  const [username, setUsername] = useState("");
  const [walletData, setWalletData] = useState([]);
  const [bnbBalances, setBnbBalances] = useState({});
  const [usdtBalances, setUsdtBalances] = useState({});
  const [receiverAddress, setReceiverAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const provider = new ethers.JsonRpcProvider(RPC_URL);

  /* ----------  Handlers  ---------- */
  const generateAndSaveWallet = async () => {
    if (!username) return alert("Enter a username first!");
    const wallet = ethers.Wallet.createRandom();
    const newWallet = {
      username,
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase,
    };
    const res = await fetch("http://localhost:5000/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWallet),
    });
    const result = await res.json();
    alert(result.message);
  };

  const fetchWallets = async () => {
    if (!username) return alert("Enter a username first!");
    const res = await fetch(`http://localhost:5000/api/wallet/${username}`);
    const data = await res.json();
    setWalletData(data);
  };

  const getBNBBalance = async (address) => {
    try {
      const balance = await provider.getBalance(address);
      setBnbBalances((p) => ({ ...p, [address]: ethers.formatEther(balance) }));
    } catch {
      setBnbBalances((p) => ({ ...p, [address]: "Error" }));
    }
  };

  const getTokenBalance = async (address, tokenAddress, setState) => {
    try {
      const contract = new ethers.Contract(tokenAddress, erc20ABI, provider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
      ]);
      const formatted = ethers.formatUnits(balance, decimals);
      setState((p) => ({ ...p, [address]: formatted }));
    } catch {
      setState((p) => ({ ...p, [address]: "Error" }));
    }
  };

  const sendBNB = async (pk) => {
    if (!receiverAddress || !amount) return alert("Enter address and amount");
    setIsSending(true);
    try {
      const wallet = new ethers.Wallet(pk, provider);
      const tx = await wallet.sendTransaction({
        to: receiverAddress,
        value: ethers.parseEther(amount),
      });
      await tx.wait();
      setSuccessMessage(tx.hash);
      setTimeout(() => setSuccessMessage(""), 5000); // Hide after 5 seconds
      getBNBBalance(wallet.address);
    } catch (e) {
      alert("BNB Tx failed: " + e.message);
    } finally {
      setIsSending(false);
    }
  };

  const sendToken = async (pk, tokenAddress) => {
    if (!receiverAddress || !amount) return alert("Enter address and amount");
    setIsSending(true);
    try {
      const wallet = new ethers.Wallet(pk, provider);
      const contract = new ethers.Contract(tokenAddress, erc20ABI, wallet);
      const decimals = await contract.decimals();
      const tx = await contract.transfer(
        receiverAddress,
        ethers.parseUnits(amount, decimals)
      );
      await tx.wait();
      setSuccessMessage(tx.hash);
      setTimeout(() => setSuccessMessage(""), 5000); // Hide after 5 seconds
      getTokenBalance(wallet.address, tokenAddress, setUsdtBalances);
    } catch (e) {
      alert("Token Tx failed: " + e.message);
    } finally {
      setIsSending(false);
    }
  };

  /* ----------  Render  ---------- */
  return (
    <div className="app">
      {successMessage && (
        <div className="toast">
          ✅ Transaction confirmed!{" "}
          <a
            href={`https://testnet.bscscan.com/tx/${successMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {successMessage.slice(0, 10)}…{successMessage.slice(-6)}
          </a>
        </div>
      )}

      <h1 className="title">🌐 Web3 Wallet (BNB & USDT – BSC Testnet)</h1>

      <div className="controls">
        {/* ✅ UPDATED: USERNAME INPUT */}
        <div className="input-wrapper">
          <input
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
          />
          {username.length > 0 && (
            <button onClick={() => setUsername("")} className="btn-clear">
              ×
            </button>
          )}
        </div>
        <button onClick={generateAndSaveWallet} className="btn primary">
          Generate Wallet
        </button>
        <button onClick={fetchWallets} className="btn secondary">
          Fetch My Wallets
        </button>
      </div>

      {walletData.length > 0 && (
        <div className="wallet-grid">
          <h3>Wallets for: {username}</h3>
          {walletData.map((w, i) => (
            <div key={i} className="wallet-card">
              <p>
                <span>Address:</span> {w.address}
              </p>
              <p>
                <span>Private Key:</span> {w.privateKey}
              </p>

              <div className="balance-row">
                <button
                  onClick={() => getBNBBalance(w.address)}
                  className="btn ghost"
                >
                  BNB Balance
                </button>
                <span>{bnbBalances[w.address] ?? "—"} BNB</span>
              </div>

              <div className="balance-row">
                <button
                  onClick={() =>
                    getTokenBalance(w.address, USDT_ADDRESS, setUsdtBalances)
                  }
                  className="btn ghost"
                >
                  USDT Balance
                </button>
                <span>{usdtBalances[w.address] ?? "—"} USDT</span>
              </div>

              <hr />

              <h4>Transfer</h4>
              {/* ✅ UPDATED: RECEIVER ADDRESS INPUT */}
              <div className="input-wrapper full">
                <input
                  placeholder="Receiver Address"
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  className="input full"
                />
                {receiverAddress.length > 0 && (
                  <button onClick={() => setReceiverAddress("")} className="btn-clear">
                    ×
                  </button>
                )}
              </div>
              {/* ✅ UPDATED: AMOUNT INPUT */}
              <div className="input-wrapper half">
                <input
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input half"
                />
                {amount.length > 0 && (
                  <button onClick={() => setAmount("")} className="btn-clear">
                    ×
                  </button>
                )}
              </div>
              <div className="action-btns">
                <button
                  onClick={() => sendBNB(w.privateKey)}
                  disabled={isSending}
                  className="btn accent"
                >
                  {isSending ? "Sending…" : "Send BNB"}
                </button>
                <button
                  onClick={() => sendToken(w.privateKey, USDT_ADDRESS)}
                  disabled={isSending}
                  className="btn accent"
                >
                  {isSending ? "Sending…" : "Send USDT"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{css}</style>
    </div>
  );
}

/* ---------------  CSS  --------------- */
const css = `
:root {
  --bg: #0f0f13;
  --surface: rgba(255,255,255,.05);
  --border: rgba(255,255,255,.08);
  --accent: #00f5a0;
  --primary: #1e90ff;
  --text: #f1f1f1;
  --radius: 16px;
  --font: "Inter", system-ui, sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text); font-family: var(--font); }

.app { min-height: 100vh; padding: 2rem; }

.title { text-align: center; margin-bottom: 2rem; font-size: 2rem; }

/* Toast */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: #000;
  padding: 14px 24px;
  border-radius: var(--radius);
  font-weight: 600;
  z-index: 1000;
  animation: slideDown .4s ease;
}
@keyframes slideDown {
  from { transform: translate(-50%, -100%); opacity: 0; }
  to   { transform: translate(-50%, 0);   opacity: 1; }
}
.toast a { color: #000; text-decoration: underline; }

/* Controls */
.controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

/* ✅ NEW: Input Wrapper for clear button */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.input-wrapper.full { width: 100%; margin-bottom: .5rem; }
.input-wrapper.half { width: 50%; }

.input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: .85rem 1.2rem;
  color: var(--text);
  font-size: 1rem;
  width: 100%; /* Make input take full width of its wrapper */
  padding-right: 2.5rem; /* ✅ ADDED: Make space for clear button */
}
/* This removes the now-redundant width settings */
.input.full, .input.half { width: 100%; } 


.btn {
  cursor: pointer;
  border: none;
  border-radius: var(--radius);
  padding: .85rem 1.4rem;
  font-size: 1rem;
  font-weight: 600;
  transition: .3s;
}

/* ✅ NEW: Clear Button Style */
.btn-clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #888;
  font-size: 1.5rem;
  font-weight: 400;
  cursor: pointer;
  padding: 0 .5rem;
  line-height: 1;
}

.btn.primary   { background: var(--primary); color: #fff; }
.btn.secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
.btn.accent    { background: var(--accent); color: #000; }
.btn.ghost     { background: transparent; color: var(--text); border: 1px solid var(--border); }
.btn:hover     { filter: brightness(1.15); }

/* Wallet Grid */
.wallet-grid {
  display: grid;
  gap: 2rem;
  max-width: 720px;
  margin: 0 auto;
}
.wallet-grid h3 { text-align: center; margin-bottom: 1rem; }

.wallet-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  backdrop-filter: blur(12px);
}
.wallet-card p { margin-bottom: .5rem; overflow-wrap: break-word; }
.wallet-card hr { border: none; border-top: 1px solid var(--border); margin: 1.2rem 0; }

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: .8rem;
}

.action-btns {
  display: flex;
  gap: .5rem;
  flex-wrap: wrap;
}
`;