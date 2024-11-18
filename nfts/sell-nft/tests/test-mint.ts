import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { SellNft } from "../target/types/sell_nft";

describe("sell-nft", () => {
    const testTitle = "Galahad NFT!";
    const testSymbol = "G";
    const testNftUri =
        "https://raw.githubusercontent.com/Coding-and-Crypto/Rust-Solana-Tutorial/refs/heads/master/nfts/mint-nft/assets/example.json";

    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    const wallet = provider.wallet as anchor.Wallet;
    anchor.setProvider(provider);

    const program = anchor.workspace.MintNft as anchor.Program<SellNft>;

    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );

    it("Mint!", async () => {
        // Derive the mint address and the associated token account address
        const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
        const tokenAddress = await anchor.utils.token.associatedAddress({
            mint: mintKeypair.publicKey,
            owner: wallet.publicKey,
        });
        console.log(`New token: ${mintKeypair.publicKey}`);

        // Derive the metadata and master edition addresses
        const metadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        console.log("Metadata Initialized");
        const masterEditionAddress = anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from("metadata"),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintKeypair.publicKey.toBuffer(),
                Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
        )[0];
        console.log("Master Edition Metadata Initialized");

        // Create a new transaction
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
            units: 400000, // Set a higher compute unit limit
        });
        // Transact with the "mint" function in our on-chain program
        const tx = new Transaction().add(
            modifyComputeUnits, // First add the Calculate Budget directive
            await program.methods
                .mint("Test NFT", "TEST", "https://example.com/nft")
                .accounts({
                    masterEdition: masterEditionAddress,
                    metadata: metadataAddress,
                    mint: mintKeypair.publicKey,
                    tokenAccount: tokenAddress,
                    mintAuthority: wallet.publicKey,
                    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                })
                .instruction()
        );

        // 发送交易
        const signature = await provider.sendAndConfirm(tx, [mintKeypair]);
        console.log("Success! Signature:", signature);
    });
});
