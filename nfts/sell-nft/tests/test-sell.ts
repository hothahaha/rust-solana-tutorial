import * as anchor from "@coral-xyz/anchor";
import { createKeypairFromFile } from "./util";
import { SellNft } from "../target/types/sell_nft";

describe("sell-nft", async () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    const wallet = provider.wallet as anchor.Wallet;
    anchor.setProvider(provider);
    const program = anchor.workspace.SellNft as anchor.Program<SellNft>;
    it("Sell!", async () => {
        // Testing constants
        const saleAmount = 1 * anchor.web3.LAMPORTS_PER_SOL;
        const mint: anchor.web3.PublicKey = new anchor.web3.PublicKey(
            "6zfTGdVXQiwKor8reZN1jeBTnYAim82anG83FjaDyvXH"
        );
        const buyer: anchor.web3.Keypair = await createKeypairFromFile(
            __dirname + "/keypairs/buyer1.json"
        );
        console.log(`Buyer public key: ${buyer.publicKey}`);

        // Derive the associated token account address for owner & buyer
        const ownerTokenAddress = anchor.utils.token.associatedAddress({
            mint: mint,
            owner: wallet.publicKey,
        });
        const buyerTokenAddress = anchor.utils.token.associatedAddress({
            mint: mint,
            owner: buyer.publicKey,
        });

        console.log(`Request to sell NFT: ${mint} for ${saleAmount} lamports.`);
        console.log(`Owner's Token Address: ${ownerTokenAddress}`);
        console.log(`Buyer's Token Address: ${buyerTokenAddress}`);

        // Transact with the "sell" function in our on-chain program

        await program.methods
            .sell(new anchor.BN(saleAmount))
            .accounts({
                mint: mint,
                ownerTokenAccount: ownerTokenAddress,
                ownerAuthority: wallet.publicKey,
                buyerTokenAccount: buyerTokenAddress,
                buyerAuthority: buyer.publicKey,
            })
            .signers([buyer])
            .rpc();
    });
});
