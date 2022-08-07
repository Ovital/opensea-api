import { Button, Typography, AppBar, Toolbar } from "@mui/material";
import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnect from "@walletconnect/web3-provider";
import { useRef, useState } from "react";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import { Box } from "@mui/system";
import { AccountBalanceWallet } from "@mui/icons-material"
import Image from 'next/image'

import usdcABI from "../helpers/usdcABI.json";
import Container from "../components/container";
import Nfts from "./nfts";

import Link from "next/link";

const getProviderOptions = () => {
  const infuraId = process.env.NEXT_PUBLIC_INFURA_KEY;
  const providerOptions = {
    walletconnect: {
      package: WalletConnect,
      options: {
        infuraId,
      },
    },
    coinbasewallet: {
      package: CoinbaseWalletSDK,
      options: {
        appName: "Web3Modal Example App",
        infuraId,
      },
    },
  };
  return providerOptions;
};

function initWeb3(provider) {
  const web3 = new Web3(provider);

  web3.eth.extend({
    methods: [
      {
        name: "chainId",
        call: "eth_chainId",
        outputFormatter: web3.utils.hexToNumber,
      },
    ],
  });

  return web3;
}

export default function Home() {
  let web3Modal = useRef(null);

  const [web3, setWeb3] = useState(null);
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState({ chainId: "", networkId: "" });
  const [balances, setBalances] = useState({ eth: 0, usdc: 0 });
  

  async function handleConnect() {    
    web3Modal = new Web3Modal({
      network: "mainnet",
      cacheProvider: true,
      providerOptions: getProviderOptions(),
    });
    const clear = await web3Modal.clearCachedProvider();   
    const provider = await web3Modal.connect();
    
    await subscribeProvider(provider);
    await provider.enable();
    const web3 = initWeb3(provider);

    const accounts = await web3.eth.getAccounts();
    const address = accounts[0];
    const chainid = provider.networkVersion    

    const USDContractInstance = await new web3.eth.Contract(
      usdcABI,
      "0x0882477e7895bdC5cea7cB1552ed914aB157Fe56" // USDC proxy cotract address
    );

    const eth = await web3.eth.getBalance(address);    
    let usdc = 0;
    if (chainid == 1)
    {
      usdc = await USDContractInstance.methods.balanceOf(address).call();     //  this shows error when network is not ethereum       
    }

    setBalances({ eth, usdc });
    console.log(balances)
    setAddress(address);
  }

  const handleDisonnect = async () => {
    setAddress(null);
  }

  async function subscribeProvider(provider) {
    if (!provider.on) return;

    provider.on("close", () => resetApp());
    provider.on("accountChanged", async (accounts) => setAddress(accounts[0]));    
  }

  async function resetApp() {
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      await web3.currentProvider.close();
    }
    await this.web3Modal.clearCachedProvider();
    setWeb3(null);
    setAddress("");
  }

  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="fixed" sx={{ p: 1 }} className="bg-dark">
          <div className="flex justify-between">

            <Toolbar variant="dense">              
              <Typography variant="h6" className="cl-primary" component="div">
                NFT Search
              </Typography>
            </Toolbar>

            {!address && (
              <div className="flex flex-row items-center">
                <Button
                  sx={{
                    color: "#ffd11a",
                    borderColor: "#ffd11a",
                    "&:hover": {
                      color: "white",
                      backgroundColor: "#ffd11a",
                      borderColor: "#ffd11a"
                    }
                  }}
                  variant="outlined"
                  startIcon={<AccountBalanceWallet />}
                  onClick={handleConnect}
                >
                  Connect
                </Button>
              </div>
            )}

            {!!address && (
              <div className="flex flex-row items-center">
                <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noreferrer"   className="hover-address mr-2">{address.substr(0, 7)}...{address.slice(-4)}</a>

                <Button
                  sx={{
                    color: "#ffd11a",
                    borderColor: "#ffd11a",
                    "&:hover": {
                      color: "white",
                      backgroundColor: "#ffd11a",
                      borderColor: "#ffd11a"
                    }
                  }}
                  variant="outlined"
                  startIcon={<AccountBalanceWallet />}
                  onClick={handleDisonnect}
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </AppBar>
      </Box>

      {!!address && (
        <div className="mt-4 flex justify-between">
          <div className="flex items-center balance-card l-card rounded-r-full">
            <div  className="w-4 h-4 rounded-full ring-1 mr-2">
              <div style={{width: '100%', height: '100%', position: 'relative'}}>
                <Image      
                  layout="fill"
                  src="/usd-coin-usdc-logo.svg"
                />
              </div>
            </div>
            <span>
              {balances.usdc} <strong>USDC</strong>
            </span>
          </div>

          <div className="flex items-center balance-card r-card rounded-l-full">
            <span>
              {balances.eth} <strong>ETH</strong>
            </span>
            <div  className="w-4 h-4 rounded-full ring-1 ml-2">
              <div style={{width: '100%', height: '100%', position: 'relative'}}>
                <Image
                  layout = "fill"
                  src="/ethereum-eth-logo.svg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {!!address && (
        <Nfts />
      )}
    </div>
  );
}
