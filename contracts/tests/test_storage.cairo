use starknet::{ContractAddress};
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, cheat_caller_address, CheatSpan};
use contracts::SimpleStorage::{ISimpleStorageDispatcher, ISimpleStorageDispatcherTrait};


fn OWNER() -> ContractAddress {
    'OWNER'.try_into().unwrap()
}

fn deploy_simple_storage() -> ContractAddress {
    let contract = declare("SimpleStorage").unwrap().contract_class();
    let mut constructor_calldata = array![];
    let owner: ContractAddress = OWNER().try_into().unwrap();
    owner.serialize(ref constructor_calldata);
    let (contract_address, _) = contract.deploy(@constructor_calldata).unwrap();
    contract_address
}

#[cfg(test)]
fn test_set_get() {
    let storage = deploy_simple_storage();

    let storage_dispatcher = ISimpleStorageDispatcher { contract_address: storage };

    // Set value
    cheat_caller_address(storage, OWNER(), CheatSpan::TargetCalls(1));
    storage_dispatcher.set(42);

    // Get value
    let value = storage_dispatcher.get();

    assert(value == 42, 'Set or Get failed');
}

#[cfg(test)]
fn test_increment_decrement() {
    let storage = deploy_simple_storage();

    let storage_dispatcher = ISimpleStorageDispatcher { contract_address: storage };

    // Increment value
    cheat_caller_address(storage, OWNER(), CheatSpan::TargetCalls(1));
    storage_dispatcher.increment(10);

    let value = storage_dispatcher.get();
    assert(value == 10, 'Increment failed');

    // Decrement value
    cheat_caller_address(storage, OWNER(), CheatSpan::TargetCalls(1));
    storage_dispatcher.decrement(5);

    let value = storage_dispatcher.get();
    assert(value == 5, 'Decrement failed');
}


#[cfg(test)]
fn test_constructor_initialization() {
    let storage = deploy_simple_storage();
    let storage_dispatcher = ISimpleStorageDispatcher { contract_address: storage };

    let value = storage_dispatcher.get();
    assert(value == 0, 'Initial value should be 0');
}
