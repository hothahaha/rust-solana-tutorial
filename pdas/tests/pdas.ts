import * as anchor from "@coral-xyz/anchor";
import { Pdas } from "../target/types/pdas";

function shortKey(key: anchor.web3.PublicKey) {
    return key.toString().substring(0, 8);
}

describe("pdas", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Pdas as anchor.Program<Pdas>;

    async function generateKeypair() {
        let keypair = anchor.web3.Keypair.generate();
        await provider.connection.requestAirdrop(
            keypair.publicKey,
            anchor.web3.LAMPORTS_PER_SOL * 2
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return keypair;
    }

    async function derivePda(pubkey: anchor.web3.PublicKey, color: string) {
        let [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
            [pubkey.toBuffer(), Buffer.from("_"), Buffer.from(color)],
            program.programId
        );
        return pda;
    }

    async function createLedger(
        pda: anchor.web3.PublicKey,
        wallet: anchor.web3.Keypair,
        color: string
    ) {
        await program.methods
            .createLedger(color)
            .accounts({ wallet: wallet.publicKey, ledgerAccount: pda })
            .signers([wallet])
            .rpc();
    }

    async function modifyLedger(color: string, newBalance: number, wallet: anchor.web3.Keypair) {
        console.log("------------------------------------------------------------------");
        let data: any;
        let pda = await derivePda(wallet.publicKey, color);

        console.log(`Checking if account ${shortKey(pda)} exists for color: ${color}...`);
        try {
            data = await program.account.ledger.fetch(pda);
            console.log("It does!");
        } catch (error) {
            console.log("It does not exist! Creating...");
            await createLedger(pda, wallet, color);
            data = await program.account.ledger.fetch(pda);
        }

        console.log("Success.");
        console.log("Data:");
        console.log(`     Color: ${data.color}      Balance: ${data.balance}`);
        console.log(`Modify balance of ${data.color} from ${data.balance} to ${newBalance}`);

        await program.methods
            .modifyLedger(newBalance)
            .accounts({ wallet: wallet.publicKey, ledgerAccount: pda })
            .signers([wallet])
            .rpc();

        data = await program.account.ledger.fetch(pda);
        console.log("New Data:");
        console.log(`     Color: ${data.color}      Balance: ${data.balance}`);
        console.log(`Success.`);
    }

    it("Is initialized!", async () => {
        const testKeypair1 = await generateKeypair();
        await modifyLedger("red", 2, testKeypair1);
        await modifyLedger("red", 5, testKeypair1);
        await modifyLedger("blue", 10, testKeypair1);

        const testKeypair2 = await generateKeypair();
        await modifyLedger("red", 3, testKeypair2);
        await modifyLedger("purple", 12, testKeypair2);
    });
});
