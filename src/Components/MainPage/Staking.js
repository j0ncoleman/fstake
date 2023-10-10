import React, { useState, useEffect } from "react";
import {
  useAccount,
  usePrepareContractWrite,
  useContractWrite,
  useContractEvent,
} from "wagmi";
import { Div, Input, Button, Image, Text } from "atomize";
// import chaind from "./chaind.png";
import "./fadeIn.css"; // Import the CSS file for the animation
import abi from "./abi.json";
import Web3 from "web3";
import luminaBg from "./lumina.jpeg";
import luminaLogo from "./ghostlogo.jpg";
import bluediamond from "./ghost.jpg";
import { parseUnits } from "viem";

export const Staking = ({ connected }) => {
  const [blurAmount, setBlurAmount] = useState(10);
  const [tvl, setTvl] = useState();
  const [apy, setApy] = useState();
  const [lockLength, setLockLength] = useState(7);
  const [yourStake, setYourStake] = useState();
  const [symbol, setSymbol] = useState("GHOST");
  const [unlockDate, setUnlockDate] = useState();
  const [userUnlockDate, setUserUnlockDate] = useState();
  const [userUnlockUnix, setUserUnlockUnix] = useState();

  const [stakeAmount, setStakeAmount] = useState(1);
  const [stakeAmountInWei, setStakeAmountInWei] = useState(1);
  const [tokenRewards, setTokenRewards] = useState();
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [dailyRewards, setDailyRewards] = useState();
  const [smallDailyRewards, setSmallDailyRewards] = useState();
  const [stakingToken, setStakingToken] = useState(
    "0x343ed91Ea4199F301A1239d33EE914669beF995E"
  );
  const [isWithdrawn, setIsWithdrawn] = useState(false);
  const [tokenAddress, setTokenAddress] = useState(
    "0x7234051E6EA3589dc0e301931aCe2D6Fd8250e63"
  );

  const tokenABI = require("./tokenAbi.json");

  const blurStyle = {
    filter: `blur(${blurAmount}px)`, // Apply the dynamic blur effect
    transition: "filter 1s ease-in",
  };

  const { address, isConnected } = useAccount();
  console.log("Is user connected?: ", isConnected);

  const { config: approvalConfig } = usePrepareContractWrite({
    address: tokenAddress,
    abi: tokenABI,
    args: [stakingToken, stakeAmountInWei],
    functionName: "approve",
    onSuccess(data) {
      console.log("Success", data);
    },
    onError(error) {
      console.log("Error", error);
    },
  });
  const { write: approvalFunction } = useContractWrite(approvalConfig);

  useEffect(() => {
    convertToWei();
    console.log("Stake Amount", stakeAmount);
  }, [stakeAmount, isConnected]);

  async function convertToWei() {
    if (stakeAmount > 0) {
      const userStake = parseUnits(stakeAmount.toString(), tokenDecimals);
      await setStakeAmountInWei(userStake);
    }
    if (stakeAmount === 0) {
      await setStakeAmountInWei(1);
    }
  }
  console.log("Stake Amount In Wei", stakeAmountInWei);

  const { config: stakeConfig } = usePrepareContractWrite({
    address: stakingToken,
    abi: abi,
    args: [stakeAmountInWei],
    functionName: "deposit",
    onSuccess(data) {
      console.log("Success", data);
    },
    onError(error) {
      console.log("Error", error);
    },
  });
  const { write: stakeFunction } = useContractWrite(stakeConfig);

  const { config: emergencyConfig } = usePrepareContractWrite({
    address: stakingToken,
    abi: abi,
    functionName: "emergencyWithdraw",
    onSuccess(data) {
      console.log("Success", data);
    },
    onError(error) {
      console.log("Error", error);
    },
  });
  const { write: emergencyFunction } = useContractWrite(emergencyConfig);

  const { config: withdrawConfig } = usePrepareContractWrite({
    address: stakingToken,
    abi: abi,
    functionName: "withdraw",
    onSuccess(data) {
      console.log("Success", data);
    },
    onError(error) {
      console.log("Error", error);
    },
  });
  const { write: withdrawFunction } = useContractWrite(withdrawConfig);

  useEffect(() => {
    if (isConnected === true) {
      setBlurAmount(0);
    } else if (isConnected === false) {
      setBlurAmount(10);
    }
  });

  const bscNodeUrl = "https://eth.llamarpc.com/";
  const web3 = new Web3(bscNodeUrl);
  const tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
  const stakingContract = new web3.eth.Contract(abi, stakingToken);
  async function fetchTokenDecimals() {
    try {
      const fetchedDecimals = await tokenContract.methods.decimals().call();
      setTokenDecimals(fetchedDecimals);
      console.log("DECIMALS", tokenDecimals);
    } catch (error) {
      console.error("Error fetching token decimals:", error);
    }
  }
  async function fetchAmountAtAddress(userAddress) {
    try {
      const userInfo = await stakingContract.methods
        .userInfo(userAddress)
        .call();
      const pendingReward = await stakingContract.methods
        .pendingReward(userAddress)
        .call();
      const amount = await userInfo.amount;
      const userRewards = await userInfo.rewardDebt;
      const amountFromWei = (await amount) / Math.pow(10, tokenDecimals);
      const userRewardsFromWei = userRewards / Math.pow(10, tokenDecimals);
      const pendingRewardsFromWei = pendingReward / Math.pow(10, tokenDecimals);
      setYourStake(parseInt(amountFromWei));
      setTokenRewards(parseInt(userRewardsFromWei + pendingRewardsFromWei));
    } catch (error) {
      console.error("Error fetching amount:", error);
      return null;
    }
  }

  async function fetchDailyRewards(userAddress) {
    try {
      const userInfo = await stakingContract.methods
        .userInfo(userAddress)
        .call();
      const amount = await userInfo.amount;
      const amountFromWei = (await amount) / Math.pow(10, tokenDecimals);
      const fetchedApy = await stakingContract.methods.apy().call();
      const userDailyRewards = (await (amountFromWei * fetchedApy)) / 100 / 365;
      const formattedDailyRewards = userDailyRewards.toString().slice(0, 14);
      const smallFormattedDailyRewards = userDailyRewards
        .toString()
        .slice(0, 8);
      setDailyRewards(formattedDailyRewards);
      setSmallDailyRewards(smallFormattedDailyRewards);
    } catch (error) {
      console.error("Error fetching amount:", error);
      return null;
    }
  }

  async function fetchContractInfo() {
    try {
      const fetchedApy = await stakingContract.methods.apy().call();
      setApy(fetchedApy);
      const lockDuration = await stakingContract.methods.lockDuration().call();
      const totalStaked = await stakingContract.methods.totalStaked().call();
      const userUnlockTime = await stakingContract.methods
        .holderUnlockTime(await address)
        .call();
      setUserUnlockUnix(userUnlockTime);
      const secondsPerDay = 24 * 60 * 60; // Number of seconds in a day
      const lockLengthInDays = Math.floor(
        parseInt(lockDuration) / secondsPerDay
      );
      setLockLength(lockLengthInDays);
      const currentTimestamp = Date.now();
      const resultTimestamp =
        parseInt(currentTimestamp) + parseInt(lockDuration * 1000);
      const resultDate = new Date(resultTimestamp);
      const userTokenUnlock = new Date(parseInt(userUnlockTime) * 1000);
      const formattedDate = resultDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const formattedDate2 = userTokenUnlock.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const totalValueLocked = await parseInt(
        totalStaked / Math.pow(10, tokenDecimals)
      );

      console.log("LOCK DATE", lockDuration);
      console.log("TVL", totalValueLocked);
      console.log("DATE", resultDate);
      console.log("YOUR TOKENS WILL BE UNLOCKED AT: ", formattedDate2);
      setUserUnlockDate(formattedDate2.toString());
      setUnlockDate(formattedDate.toString());
      setTvl(totalValueLocked);
    } catch (error) {
      console.error("ERROR FETCHING INFO:", error);
    }
  }

  const [pageSize, setPageSize] = useState("");

  const updatePageSize = () => {
    if (window.innerWidth <= 768) {
      setPageSize("small");
    } else if (window.innerWidth <= 1200) {
      setPageSize("medium");
    } else {
      setPageSize("large");
    }
  };

  useEffect(() => {
    updatePageSize();

    const resizeHandler = () => {
      updatePageSize();
    };

    window.addEventListener("resize", resizeHandler);

    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  useContractEvent({
    address: stakingToken,
    abi: abi,
    eventName: "Deposit",
    listener(DepositEvent) {
      console.log("DEPOSIT EVENT: ", DepositEvent[0].args);
      if (DepositEvent[0].args.user === address) {
        fetchAmountAtAddress(address);
        fetchDailyRewards(address);
        fetchContractInfo();
      }
    },
  });

  const handleWithdraw = async () => {
    try {
      const txHash = await stakingContract.methods.withdraw().send({
        from: address,
      });

      console.log("Withdraw transaction hash:", txHash);
      setIsWithdrawn(true);
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
    }
  };

  useEffect(() => {
    // Fetch token decimals when the component is mounted

    fetchTokenDecimals();
    fetchAmountAtAddress(address).then((amount) => {
      console.log(`Amount at address ${address}: ${amount}`);
    });
    fetchDailyRewards(address).then((amount) => {
      console.log(`Amount at address ${address}: ${amount}`);
    });
    fetchContractInfo();
  }, [isConnected, address]);

  return (
    <Div w="100vw" h="100vh" d="flex" align="center" justify="center">
      {!isConnected && (
        <Div
          className="fade-in-text"
          pos="fixed"
          d="flex"
          textColor="white"
          textSize={{ xl: "40px", xs: "20px" }}
          textWeight="bold"
          style={{ zIndex: "1" }}
          justify="center"
          align="center">
          Please Connect Your Wallet.
        </Div>
      )}

      <Div
        className="fade-in-text"
        pos="fixed"
        textColor="black"
        right="0"
        bottom="0"
        d="flex"
        p="0.25rem"
        m="1rem"
        textSize="10px"
        style={{ zIndex: "1" }}>
        <Div
          m={{ x: "0.25rem" }}
          tag="a"
          href="https://t.me/ghosttradererc/">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            fill="white"
            viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z" />
          </svg>
        </Div>
        <Div m={{ x: "0.25rem" }} tag="a" href="https://x.com/ghosttradererc/">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            fill="white"
            viewBox="0 0 16 16">
            <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
          </svg>
        </Div>
        <Div m={{ x: "0.25rem" }} tag="a" href="https://ghosttrader.tech/">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            fill="white"
            viewBox="0 0 16 16">
            <path
              fillRule="evenodd"
              d="M16 8a8.001 8.001 0 0 1-7.022 7.94l1.902-7.098a2.995 2.995 0 0 0 .05-1.492A2.977 2.977 0 0 0 10.237 6h5.511A8 8 0 0 1 16 8ZM0 8a8 8 0 0 0 7.927 8l1.426-5.321a2.978 2.978 0 0 1-.723.255 2.979 2.979 0 0 1-1.743-.147 2.986 2.986 0 0 1-1.043-.7L.633 4.876A7.975 7.975 0 0 0 0 8Zm5.004-.167L1.108 3.936A8.003 8.003 0 0 1 15.418 5H8.066a2.979 2.979 0 0 0-1.252.243 2.987 2.987 0 0 0-1.81 2.59ZM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
            />
          </svg>
        </Div>
      </Div>
      <Div
        className="fade-in-text"
        pos="fixed"
        textColor="black"
        left="0"
        top="0"
        rounded="10px"
        m="1rem"
        textSize="10px"
        style={{ zIndex: "1" }}>
        <Image
          src={luminaLogo}
          rounded="50%"
          alt="defi apes"
          w={{ xl: "200px", xs: "100px" }}
        />
      </Div>
      <Div
        w="100vw"
        h="100vh"
        // bg="linear-gradient(to bottom right, #87CEEB, #ff7370)"
        bg="#080808"
        bgImg={bluediamond}
        bgPos="top"
        bgSize="cover"
        style={blurStyle}
        d="flex"
        align="center"
        justify="center">
        <Div
          w={{ xl: "40rem", xs: "90vw" }}
          h="90vh"
          maxH="700px"
          bg="#1c1c1e"
          style={{ border: "1px solid #505050", boxShadow: "0 0 30px #505050" }}
          rounded="30px"
          shadow="5"
          textColor="white"
          d="flex"
          // p="0.5rem"
          flexDir="column"
          align="center">
          <Div
            w="100%"
            h="5rem"
            d="flex"
            align="center"
            justify="center"
            textSize="26px"
            textWeight="bold">
            Staking
          </Div>
          <hr></hr>
          <Div
            w="90%"
            h="3rem"
            d="flex"
            align="center"
            justify="center"
            textSize={{
              xl: "22px",
              lg: "22px",
              md: "22px",
              sm: "22px",
              xs: "18px",
            }}
            textWeight="bold">
            <Div w="50%" textAlign="left" textColor="#606060">
              Stake ${symbol}
            </Div>
            <Div w="50%" textAlign="right" textColor="gray900">
              Earn ${symbol}
            </Div>
          </Div>
          <Div
            w="90%"
            h="3rem"
            d="flex"
            align="center"
            justify="center"
            textSize={{
              xl: "22px",
              lg: "22px",
              md: "22px",
              sm: "22px",
              xs: "18px",
            }}
            textWeight="bold">
            <Div w="50%" textAlign="left">
              APY
            </Div>
            <Div w="50%" textAlign="right">
              {apy}%
            </Div>
          </Div>
          <Div
            w="90%"
            h="3rem"
            d="flex"
            align="center"
            justify="center"
            textSize={{
              xl: "22px",
              lg: "22px",
              md: "22px",
              sm: "22px",
              xs: "18px",
            }}
            textWeight="bold">
            <Div w="50%" textAlign="left">
              Amount Staked
            </Div>
            <Div w="50%" textAlign="right">
              {yourStake} {symbol}
            </Div>
          </Div>
          <Div
            w="90%"
            h="3rem"
            d="flex"
            align="center"
            justify="center"
            textSize={{
              xl: "22px",
              lg: "22px",
              md: "22px",
              sm: "22px",
              xs: "18px",
            }}
            textWeight="bold">
            <Div w="50%" textAlign="left">
              Lock Length
            </Div>
            <Div w="50%" textAlign="right">
              {lockLength} Days
            </Div>
          </Div>
          <Div
            w="90%"
            h="3rem"
            d="flex"
            align="center"
            justify="center"
            textSize={{
              xl: "22px",
              lg: "22px",
              md: "22px",
              sm: "22px",
              xs: "18px",
            }}
            textWeight="bold">
            <Div w="50%" textAlign="left">
              Unlock Date
            </Div>
            <Div w="50%" textAlign="right">
              {yourStake > 0 ? userUnlockDate : unlockDate}
            </Div>
          </Div>
          <Div
            w="90%"
            h="3rem"
            d="flex"
            align="center"
            justify="center"
            textSize={{
              xl: "22px",
              lg: "22px",
              md: "22px",
              sm: "22px",
              xs: "18px",
            }}
            textWeight="bold">
            <Div w="50%" textAlign="left">
              TVL
            </Div>
            <Div w="50%" textAlign="right">
              {tvl}
            </Div>
          </Div>
          <Div
            w="90%"
            textSize={{
              xl: "22px",
              lg: "22px",
              md: "22px",
              sm: "22px",
              xs: "18px",
            }}
            textWeight="bold">
            <Input
              type="number"
              w="100%"
              placeholder="Stake Amount"
              onChange={(e) => setStakeAmount(e.target.value)}
              value={stakeAmount}
              style={{ border: "1px solid #909090" }}
              textWeight="bold"
              textSize="18px"
              bg="none"
              textAlign="left"
              textColor="white"
              h="4rem"
            />
          </Div>

          <Div
            w="90%"
            d="flex"
            align="center"
            justify="center"
            m={{ t: "1rem" }}>
            <Button
              w="24%"
              rounded="10px"
              textWeight="bold"
              bg="#3a3a3c"
              shadow="5"
              m={{ x: "0.25rem" }}
              textSize="10px"
              textColor="white"
              p="0"
              hoverBg="#505050"
              onClick={() => approvalFunction()}>
              Approve
            </Button>
            <Button
              w="24%"
              rounded="10px"
              textWeight="bold"
              bg="#3a3a3c"
              m={{ x: "0.25rem" }}
              textSize="10px"
              textColor="white"
              hoverBg="#505050"
              p="0"
              onClick={() => stakeFunction()}>
              Stake
            </Button>
            <Button
              w="24%"
              rounded="10px"
              textWeight="bold"
              shadow="5"
              m={{ x: "0.25rem" }}
              textSize="10px"
              textColor="white"
              p="0"
              hoverBg="#505050"
              disabled={
                userUnlockUnix > parseInt(Date.now() / 1000) || yourStake === 0
              }
              onClick={() => withdrawFunction()}
              bg="#3a3a3c"
              css={
                yourStake > 0
                  ? "background-color: green !important; cursor: not-allowed;"
                  : ""
              }>
              Unstake All
            </Button>
            <Button
              w="24%"
              rounded="10px"
              textWeight="bold"
              bg="#3a3a3c"
              shadow="5"
              m={{ x: "0.25rem" }}
              textSize="10px"
              textColor="white"
              p="0"
              hoverBg="#505050"
              disabled={yourStake === 0}
              onClick={() => emergencyFunction()}>
              Emergency Withdrawal
            </Button>
          </Div>
          <Div textColor="gray900" textSize="12px" m={{ y: "10px" }}>
            <i>Early Withdrawal Fee: 15%</i>
          </Div>
          <Div
            w="90%"
            d="flex"
            bg="#3a3a3c"
            h="6rem"
            rounded="15px"
            align="center"
            justify="center"
            textSize="20px"
            textWeight="bold"
            flexDir="column">
            Rewards: {tokenRewards}
            <Button
              bg="#ffffg9"
              m={{ t: "0.5rem" }}
              shadow="5"
              textColor="black"
              w="10rem"
              textWeight="bold"
              hoverBg="#505050"
              disabled={
                userUnlockUnix > parseInt(Date.now() / 1000) || yourStake === 0
              }
              style={{
                boxShadow: "0 0 15px gray",
              }}
              onClick={() => withdrawFunction()}>
              Claim
            </Button>
          </Div>
          <Div
            w="90%"
            h="4rem"
            d="flex"
            align="center"
            justify="center"
            textSize={{
              xl: "22px",
              lg: "22px",
              md: "22px",
              sm: "22px",
              xs: "18px",
            }}
            textWeight="bold">
            <Div w="50%" textAlign="left">
              Your Rewards
            </Div>
            <Div w="50%" textAlign="right" textColor="green">
              {pageSize === "small" ? smallDailyRewards : dailyRewards}
              /Day
            </Div>
          </Div>
        </Div>
      </Div>
    </Div>
  );
};
