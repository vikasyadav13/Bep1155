const {expect} = require("chai");

describe("Token Testing", function(){
    let Token;
    let hardhatToken;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function(){
        Token = await ethers.getContractFactory("LiaizonToken");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        hardhatToken = await Token.deploy();
    });

    describe("Deployment", function(){
        
        it("Should set the right owner", async function(){
            expect (await hardhatToken.owner()).to.equal(owner.address);
        });

        it("Should set the right minter", async function(){
            expect (await hardhatToken.minter()).to.equal(owner.address);
        });

        it("Should set the right totalSupply", async function(){
            expect (await hardhatToken.totalSupply()).to.equal(10000000);
        });

        it("Should set the right circulatingSupply", async function(){
            expect (await hardhatToken.circulatingSupply()).to.equal(0);
        });

        it("Should set the right name", async function(){
            expect (await hardhatToken.name()).to.equal("Liaizon Token");
        });

        it("Should set the right symbol", async function(){
            expect (await hardhatToken.symbol()).to.equal("Liaizon");
        });

        it("Should set the right decimals", async function(){
            expect (await hardhatToken.decimals()).to.equal(18);
        });

        it("Should not assign any of the total supply to the owner", async function(){
            const ownerBalance = await hardhatToken.balanceOf(owner.address);
            expect (ownerBalance).to.equal(0);
        })
    });


    describe("Change Owner and Minter", function(){
        
        it("Should change the owner", async function(){
            expect (await hardhatToken.owner()).to.equal(owner.address);
            await expect(hardhatToken.connect(addr1).changeOwner(addr1.address)).to.be.reverted;

            await hardhatToken.changeOwner(addr1.address);
            expect (await hardhatToken.owner()).to.equal(addr1.address);
        });

        it("Should change the minter", async function(){
            expect (await hardhatToken.owner()).to.equal(owner.address);
            await expect(hardhatToken.connect(addr1).changeMinter(addr1.address)).to.be.reverted;

            await hardhatToken.changeMinter(addr1.address);
            expect (await hardhatToken.minter()).to.equal(addr1.address);
        });
    });

    describe("Minting and burning", function(){
        it("Minting from owner to addr1", async function(){
            await hardhatToken.mint(addr1.address, 10);
            expect (await hardhatToken.balanceOf(addr1.address)).to.equal(10);
            expect (await hardhatToken.circulatingSupply()).to.equal(10);
        });

        it("Burning from owner to addr1", async function(){
            await hardhatToken.mint(addr1.address, 10);
            expect (await hardhatToken.balanceOf(addr1.address)).to.equal(10);
            expect (await hardhatToken.circulatingSupply()).to.equal(10);

            await hardhatToken.burn(addr1.address, 5);
            expect (await hardhatToken.balanceOf(addr1.address)).to.equal(5);
            expect (await hardhatToken.circulatingSupply()).to.equal(5);
        });

        it("Minting from addr1 to addr2", async function(){
            await expect(hardhatToken.connect(addr1).mint(addr1.address, 10)).to.be.reverted;
            await expect(hardhatToken.connect(addr1).mint(addr2.address, 10)).to.be.reverted;
        });

        it("Burning from addr1 to addr2", async function(){
            await hardhatToken.mint(addr1.address, 10);
            expect (await hardhatToken.balanceOf(addr1.address)).to.equal(10);
            expect (await hardhatToken.circulatingSupply()).to.equal(10);

            await hardhatToken.mint(addr2.address, 20);
            expect (await hardhatToken.balanceOf(addr2.address)).to.equal(20);
            expect (await hardhatToken.circulatingSupply()).to.equal(30);

            await expect(hardhatToken.connect(addr1).burn(addr1.address, 10)).to.be.reverted;
            await expect(hardhatToken.connect(addr1).burn(addr2.address, 10)).to.be.reverted;
        });
    });

    describe("Should Transfer Token between accounts", function(){

        it("Normal transfer from owner", async function(){
            await hardhatToken.mint(owner.address, 10);
            await hardhatToken.transfer(addr1.address, 10);
            expect (await hardhatToken.balanceOf(addr1.address)).to.equal(10);
        });

        it("Normal transfer from addr1 to addr2", async function(){
            await hardhatToken.mint(owner.address, 10);
            await hardhatToken.transfer(addr1.address, 10);
            await hardhatToken.connect(addr1).transfer(addr2.address, 5);
            expect (await hardhatToken.balanceOf(addr2.address)).to.equal(5);
        });

        it("Should not transfer without enough balance", async function(){
            await expect(hardhatToken.connect(addr1).transfer(addr2.address, 20)).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });

        it("Approval transfer from addr1 to addr2", async function(){
            await hardhatToken.mint(addr1.address, 100);
            await hardhatToken.connect(addr1).approve(addr2.address, 50);
            expect (await hardhatToken.allowance(addr1.address, addr2.address)).to.equal(50);
            await hardhatToken.connect(addr2).transferFrom(addr1.address, addr2.address, 40);
            expect (await hardhatToken.allowance(addr1.address, addr2.address)).to.equal(10);
            await expect(hardhatToken.connect(addr2).transferFrom(addr1.address, owner.address, 20)).to.be.reverted;
        });
    });


    describe("Change of fee params", function(){

        it("Change params within limit", async function(){
            await hardhatToken.setParams(10,50);
            expect (await hardhatToken.basisPointsRate()).to.equal(10);
            expect (await hardhatToken.maximumFee()).to.equal(50);
        });

        it("Change params outside of limit", async function(){
            await expect( hardhatToken.setParams(25,80)).to.be.reverted;
            await expect( hardhatToken.setParams(15,200)).to.be.reverted;
        });

        it("Should cut the fees amount from owner", async function(){
            await hardhatToken.setParams(10,50);
            await hardhatToken.mint(owner.address, 100);
            await hardhatToken.transfer(addr1.address, 100);
            expect (await hardhatToken.balanceOf(owner.address)).to.equal(10);
            expect (await hardhatToken.balanceOf(addr1.address)).to.equal(90);
        });

        it("Should cut the fees amount from others", async function(){
            await hardhatToken.setParams(10,50);
            await hardhatToken.mint(addr1.address, 5000);
            await hardhatToken.connect(addr1).transfer(addr2.address, 1000);
            expect (await hardhatToken.balanceOf(addr2.address)).to.equal(950);
            expect (await hardhatToken.balanceOf(owner.address)).to.equal(50);
            expect (await hardhatToken.balanceOf(addr1.address)).to.equal(4000);
        });

        it("Should cut the fees amount when using transferFrom", async function(){
            await hardhatToken.setParams(10,50);
            await hardhatToken.mint(addr1.address, 5000);
            await hardhatToken.connect(addr1).approve(addr2.address, 2000);
            await hardhatToken.connect(addr2).transferFrom(addr1.address, addr2.address, 1000);
            expect (await hardhatToken.balanceOf(addr2.address)).to.equal(950);
            expect (await hardhatToken.balanceOf(owner.address)).to.equal(50);
            expect (await hardhatToken.balanceOf(addr1.address)).to.equal(4000);

        });
    })

    describe("Blacklisting", function(){

        it("Add to a blacklist", async function(){
            await expect(hardhatToken.connect(addr1).addBlackList(owner.address)).to.be.reverted;

            await hardhatToken.addBlackList(addr1.address);
            expect (await hardhatToken.getBlackListStatus(addr1.address)).to.equal(true);

            await hardhatToken.mint(addr1.address, 10);
            await expect(hardhatToken.connect(addr1).transfer(addr2.address, 5)).to.be.reverted;

            await hardhatToken.connect(addr1).approve(addr2.address, 5);
            await expect(hardhatToken.connect(addr2).transferFrom(addr1.address, owner.address, 5)).to.be.reverted;
        });


        it("Remove from a blacklist", async function(){
            await hardhatToken.addBlackList(addr1.address);
            expect (await hardhatToken.getBlackListStatus(addr1.address)).to.equal(true);

            await expect(hardhatToken.connect(addr1).removeBlackList(addr1.address)).to.be.reverted;
            await hardhatToken.removeBlackList(addr1.address)


            await hardhatToken.mint(addr1.address, 10);
            await hardhatToken.connect(addr1).transfer(addr2.address, 5);

            await hardhatToken.connect(addr1).approve(addr2.address, 5);
            await hardhatToken.connect(addr2).transferFrom(addr1.address, owner.address, 5);
        });


        it("Destroy blackfunds", async function(){
            await hardhatToken.addBlackList(addr1.address);
            
            await hardhatToken.mint(addr1.address, 100);
            expect (await hardhatToken.balanceOf(addr1.address)).to.equal(100);
            expect (await hardhatToken.circulatingSupply()).to.equal(100);

            await hardhatToken.mint(addr2.address, 300);

            await hardhatToken.destroyBlackFunds(addr1.address);
            expect (await hardhatToken.balanceOf(addr1.address)).to.equal(0);
            expect (await hardhatToken.circulatingSupply()).to.equal(300);

        });

    });

})