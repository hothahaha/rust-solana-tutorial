use crate::calculator::CalculatorInstructions;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};
mod calculator;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Calculator {
    pub value: u32,
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

    msg!("Adding 1 to sum...");

    let mut calc = Calculator::try_from_slice(&account.data.borrow())?;
    let calculator_instructions = CalculatorInstructions::try_from_slice(&instruction_data)?;
    calc.value = calculator_instructions.evaluate(calc.value);

    calc.serialize(&mut &mut account.data.borrow_mut()[..])?;
    msg!("Value is now: {}", calc.value);

    Ok(())
}
