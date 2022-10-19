require('dotenv').config();
const Web3 = require('web3');
const FlContract = require('./build/contracts/Flashloan.json');
const pancakeAbi = require('./abis/pancakeAbi.json');
const apeAbi = require('./abis/apeAbi.json');
// the address of the borrowed token -BUSD(StableCoin) BSC Mainnet
const tokenAddress = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';

const pancakeRouterAddr = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const apeswapRouterAddr = '0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7';
const BUSDAddr = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
const WBNBAddr = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

const web3 = new Web3(
    new Web3.providers.WebsocketProvider(process.env.URL)
  );

const { address: admin } = web3.eth.accounts.wallet.add(process.env.PRIV_KEY);


/*const flashLoanContract = new web3.eth.Contract(
    FlContract.abi,
    FlContract.networks[networkId].address
  );*/

const pancakeSwap = new web3.eth.Contract(
  pancakeAbi,
  pancakeRouterAddr
);

const apeSwap = new web3.eth.Contract(
  apeAbi,
  apeswapRouterAddr
);

const DIRECTION = {
  PANCAKE_TO_APE: 0,
  APE_TO_PANCAKE: 1
};

const ONE_WEI = web3.utils.toBN(web3.utils.toWei('1'));

const AMOUNT_BUSD_WEI = web3.utils.toBN(web3.utils.toWei('20000'));

const init = async () => {
  web3.eth.subscribe('newBlockHeaders')
    .on('data', async block => {
      console.log(`New block received. Block # ${block.number}`);
      const amountsWBNB = await Promise.all([
        // amount of WBNB for BUSD on pancake
        pancakeSwap.methods.getAmountsOut(AMOUNT_BUSD_WEI,[BUSDAddr,WBNBAddr]).call(),
        // amount of WBNB for BUSD on apeswap
        apeSwap.methods.getAmountsOut(AMOUNT_BUSD_WEI,[BUSDAddr,WBNBAddr]).call()

      ])

    

      const WBNBfromPancake = web3.utils.fromWei(amountsWBNB[0][1].toString(),'ether')
      console.log(`WBNBfromPancake:${WBNBfromPancake}`) 
      
      const WBNBfromApeswap = web3.utils.fromWei(amountsWBNB[1][1].toString(),'ether')
      console.log(`WBNBfromApeswap:${WBNBfromApeswap}`)
      
      const amountsBUSD = await Promise.all([
        //Amount of BUSD in exchange of WBNB on pancake
        pancakeSwap.methods.getAmountsOut(web3.utils.toBN(web3.utils.toWei(WBNBfromApeswap)),[WBNBAddr,BUSDAddr]).call(),
        //Amount of BUSD in exchange of WBNB on apeswap
        apeSwap.methods.getAmountsOut(web3.utils.toBN(web3.utils.toWei(WBNBfromPancake)),[WBNBAddr,BUSDAddr]).call()                                                                                                                      
        
      ]);

      const BUSDfromPancake = web3.utils.fromWei(amountsBUSD[0][1].toString(),'ether')
      console.log(`BUSDfromPancake:${BUSDfromPancake}`) 
      
      const BUSDfromApeswap = web3.utils.fromWei(amountsBUSD[1][1].toString(),'ether')
      console.log(`BUSDfromApeswap:${BUSDfromApeswap}`)

      console.log(`Arbitrage from pancake to Ape
                   BUSD input:${web3.utils.fromWei(AMOUNT_BUSD_WEI.toString(),'ether')} 
                   BUSD output:${BUSDfromApeswap}`)
      
      console.log(`Arbitrage from Ape to Pancake
                   BUSD input:${web3.utils.fromWei(AMOUNT_BUSD_WEI.toString(),'ether')} 
                   BUSD output:${BUSDfromPancake}`)

      
    })
    .on('error', error => {
      console.log(error);
    });
  }

init();