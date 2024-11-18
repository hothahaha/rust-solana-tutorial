import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import fs from "mz/fs";
import path from "path";

const PROGRAM_KEYPAIR_PATH = path.join(
    path.resolve(__dirname, "../../dist/program"),
    "hello_solana-keypair.json"
);

async function main() {
    console.log("Launching client...");
    /*
  Connect to Solana local node
  */
    let connection = new Connection("http://localhost:8899", "confirmed");

    /* 
  Get our program's public key
  */
    const secretKeyString = await fs.readFile(PROGRAM_KEYPAIR_PATH, {
        encoding: "utf8",
    });
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    const programKeypair = Keypair.fromSecretKey(secretKey);
    let programId: PublicKey = programKeypair.publicKey;

    /*
  Generate a account (keypair) to transact with our program
  */
    const triggerKeypair = Keypair.generate();
    const airdropRequest = await connection.requestAirdrop(
        triggerKeypair.publicKey,
        1 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(airdropRequest);

    /*
    Conduct a transaction with our program
    */
    console.log("Pinging program...", programId.toBase58());
    const transaction = new Transaction().add(
        new TransactionInstruction({
            keys: [{pubkey: triggerKeypair.publicKey, isSigner: true, isWritable: true}],
            programId: programId,
            data: Buffer.alloc(0),
        })
    );

    const txHash = await sendAndConfirmTransaction(connection, transaction, [triggerKeypair]);
    console.log("Transaction sent:", txHash);
}

main().then(
    () => process.exit(),
    (err) => {
        console.error(err);
        process.exit(1);
    }
);
