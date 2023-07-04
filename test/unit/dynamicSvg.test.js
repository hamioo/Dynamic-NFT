const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

const {
    highSVGimageUri,
    highTokenUri,
    lowSVGImageuri,
    lowTokenUri,
} = require("./dynamicSvg-test-helper")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Dynamic SVG NFT Unit Tests", function () {
          let dynamicSvgNft, deployer, mockV3Aggregator

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["mocks", "dynamicsvg"])
              dynamicSvgNft = await ethers.getContract("DynamicSvgNft")
              mockV3Aggregator = await ethers.getContract("MockV3Aggregator")
          })

          describe("constructor", () => {
              it("sets starting values correctly", async function () {
                  const lowSVG = await dynamicSvgNft.getLowSVG()
                  const highSVG = await dynamicSvgNft.getHighSVG()
                  const priceFeed = await dynamicSvgNft.getPriceFeed()
                  const ab = await mockV3Aggregator.getAddress()
                  assert.equal(lowSVG, lowSVGImageuri)
                  assert.equal(highSVG, highSVGimageUri)
                  assert.equal(priceFeed, ab)
              })
          })

          describe("mintNft", () => {
              it("emits an event and creates the NFT", async function () {
                  const highValue = ethers.parseEther("1") // 1 dollar per ether
                  await expect(dynamicSvgNft.mintNft(highValue)).to.emit(
                      dynamicSvgNft,
                      "CreatedNFT"
                  )
                  const tokenCounter = await dynamicSvgNft.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "1")
                  const tokenURI = await dynamicSvgNft.tokenURI(0)
                  assert.equal(tokenURI, highTokenUri)
              })
              it("shifts the token uri to lower when the price doesn't surpass the highvalue", async function () {
                  const highValue = ethers.parseEther("100000000") // $100,000,000 dollar per ether. Maybe in the distant future this test will fail...
                  const txResponse = await dynamicSvgNft.mintNft(highValue)
                  await txResponse.wait(1)
                  const tokenURI = await dynamicSvgNft.tokenURI(0)
                  assert.equal(tokenURI, lowTokenUri)
              })
          })
      })
