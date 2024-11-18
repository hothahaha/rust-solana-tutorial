use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct MathStuffSquare {
    pub square: u32,
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let account_iter = &mut accounts.iter();
    let account = next_account_info(account_iter)?;
    if account.owner != program_id {
        msg!("Account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    msg!("Debug output:");
    msg!("Account ID: {}", account.key);
    msg!("Executable?: {}", account.executable);
    msg!("Lamports: {}", account.lamports());
    msg!("Debug output complete.");

    msg!("Squaring value...");

    let mut math_stuff: MathStuffSquare = MathStuffSquare::try_from_slice(&account.data.borrow())?;
    math_stuff.square = math_stuff.square * math_stuff.square;
    math_stuff.serialize(&mut &mut account.data.borrow_mut()[..])?;

    msg!("Current square is now: {}", math_stuff.square);

    Ok(())
}
