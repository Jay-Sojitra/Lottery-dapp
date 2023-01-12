import Head from 'next/head'
import Web3 from 'web3'
import lotteryContract from '../blockchain/lottery'
import styles from '../styles/Home.module.css'
import 'bulma/css/bulma.css'
import { useEffect, useState } from 'react'

export default function Home() {

  const [web3, setWeb3] = useState()
  const [address, setAddress] = useState()
  const [lcContract, setLcContract] = useState();
  const [lotteryPot, setLotteryPot] = useState();
  const [lotteryPlayers, setPlayers] = useState([]);
  const [error, setError] = useState();
  const [lotteryHistory, setLotteryHistory] = useState([]);
  const [lotteryId, setLotteryId] = useState();
  const [owner, setOwner] = useState();
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    updateState()
    updateHistory()
  }, [lcContract])

  const updateState = () => {
    if (lcContract) getPot()
    if (lcContract) getPlayers()
    // if (lcContract) getLotteryId()
  }
  const updateHistory = () => {
    if (lcContract) getLotteryId()
  }

  const getPot = async () => {
    const pot = await lcContract.methods.getBalance().call();

    setLotteryPot(web3.utils.fromWei(pot, 'ether'));
  }
  const getPlayers = async () => {
    const players = await lcContract.methods.getPlayers().call();
    setPlayers(players);
  }

  const enterLotteryHandler = async () => {
    setError('')
    setSuccessMsg('')
    try {
      await lcContract.methods.enter().send({
        from: address,
        value: 15000000000000000,
        gas: 300000,
        gasPrice: null

      })
      updateState()
    }
    catch (err) {
      console.error(err);
      setError(err);
    }
  }

  const getHistory = async (id) => {
    setLotteryHistory([])

    for (let i = parseInt(id); i > 0; i--) {
      console.log(i);
      const winnerAddress = await lcContract.methods.lotteryHistory(i).call();
      const historyObj = {}
      historyObj.id = i
      historyObj.address = winnerAddress
      setLotteryHistory(lotteryHistory => [...lotteryHistory, historyObj])
    }
  }

  const getLotteryId = async () => {
    const lotteryId = await lcContract.methods.lotteryId().call();
    setLotteryId(lotteryId);
    console.log('id:', lotteryId);
    await getHistory(lotteryId);
    if (lotteryHistory != null) {
      console.log('lotteryHistory', JSON.stringify(lotteryHistory));
    }
  }

  const PickWinnerHandler = async () => {
    setError('')
    // setSuccessMsg('')
    console.log(`address from pick winner :: ${address}`)
    const owner = await lcContract.methods.owner().call();
    setOwner(owner);
    console.log('owner:', owner);
    try {
      await lcContract.methods.pickWinner().send({
        from: address,
        gas: 300000,
        gasPrice: null
        // from: address,
        // gasLimit: 500000,
        // value: 1500000000000000,
        // gas: 300000,
        // gasPrice: null
        // from: address,
        // gas: 300000,
        // value :0,
        // // gasPrice: web3.utils.toHex('35000000000'),
        // gasPrice: null,
        // // gasLimit: web3.utils.toHex('3000000'),

      })
      console.log('try block:')
    } catch (err) {
      console.log('catch block:')
      setError(err.message)
    }
  }
  const payWinnerHandler = async () => {
    setError('')
    setSuccessMsg('')
    try {
      await lcContract.methods.payWinner().send({
        from: address,
        gas: 300000,
        gasPrice: null
      })
      console.log(`lottery id :: ${lotteryId}`)
      const winnerAddress = await lcContract.methods.lotteryHistory(lotteryId).call()
      setSuccessMsg(`The winner is ${winnerAddress}`)
      updateState()
      updateHistory()
    } catch (err) {
      setError(err.message)
    }
  }

  const connectWalletHandler = async () => {
    setError('');
    setSuccessMsg('')
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {

      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' })

        const web3 = new Web3(window.ethereum);
        setWeb3(web3);

        const accounts = await web3.eth.getAccounts()
        setAddress(accounts[0]);

        console.log('hello');
        const lc = lotteryContract(web3);
        setLcContract(lc);

        window.ethereum.on('accountsChanged', async () => {
          const accounts = await web3.eth.getAccounts();
          setAddress(accounts[0]);
        })

      }
      catch (err) {
        setError(err.message);
      }
    }
    else {
      setError('Please connect metamask')
    }
  }
  return (
    <div>
      <Head>
        <title>Ether Lottery</title>
        <meta name="description" content="An ethereum Lottery dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <nav className='navbar mt-4 mb-4'>
          <div className='container'>
            <div className='navbar-brand'>
              <h1>Ether Lottery</h1>
            </div>
            <div className='navbar-end'>

              {address ? (
                <button
                  type="button"
                  className='button is-link'
                >
                  {address.slice(0, 6) + '...' + address.slice(38, 42)}
                </button>
              ) : (
                <button
                  type="button"
                  className='button is-link'
                  onClick={connectWalletHandler}
                >
                  Connect Wallet
                </button>
              )}
            </div>

          </div>
        </nav>
        <div className='container'>
          <section className='mt-5'>
            <div className='columns'>
              <div className='column is-two-thirds'>
                <section className='mt-5'>
                  <p>Enter the lottery by sending by 0.1ether</p>
                  <button onClick={enterLotteryHandler} className='button is-link is-large is-light mt-3'>Play Now</button>
                </section>
                <section className="mt-6">
                  <p><b>Admin only:</b> Pick winner</p>
                  <button onClick={PickWinnerHandler} className="button is-primary is-large is-light mt-3">Pick Winner</button>
                </section>
                <section className="mt-6">
                  <p><b>Admin only:</b> Pay winner</p>
                  <button onClick={payWinnerHandler} className="button is-success is-large is-light mt-3">Pay Winner</button>
                </section>
                <section>
                  <div className='container mt-6 has-text-danger'>
                    <p>{error}</p>
                  </div>
                </section>
                <section>
                  <div className="container has-text-success mt-6">
                    <p>{successMsg}</p>
                  </div>
                </section>
              </div>
              <div className={`${styles.lotteryinfo}column is-one-third`}>
                <section className='mt-5'>
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Lottery History</h2>
                        {
                          (lotteryHistory && lotteryHistory.length > 0) && lotteryHistory.map(item => {
                            if (lotteryId != item.id) {
                              return <div className="history-entry mt-3">
                                <div>Lottery #{item.id}:</div>
                                <div>
                                  <a href={`https://etherscan.io/address/${item.address}`} target='_blank'>
                                    {item.address}
                                  </a>
                                </div>
                              </div>
                            }
                          })

                        }

                      </div>
                    </div>
                  </div>
                </section>
                <section className='mt-5'>
                  <div className="card">
                    <div className="card-content">
                      <div className="content">

                        <h2>Player ({lotteryPlayers.length})</h2>
                        <ul>
                          {
                            (lotteryPlayers && lotteryPlayers.length > 0) && lotteryPlayers.map((player) => {
                              return <li>
                                <a href={`https://etherscan.io/address/${player}`} target='_blank'>
                                  {player}
                                </a>
                              </li>
                            })
                          }

                        </ul>
                      </div>

                    </div>
                  </div>
                </section>
                <section className='mt-5'>
                  <div className="card">
                    <div className="card-content">
                      <div className="content">
                        <h2>Pot</h2>
                        <p>{lotteryPot} Eth</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>

        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2022 Jay Sojitra</p>
      </footer>
    </div>
  )
}
