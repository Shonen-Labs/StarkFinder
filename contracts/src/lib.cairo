```json
{
  "filename": "registry.cairo",
  "language": "cairo",
  "contract_type": "Registry",
  "description": "A simple key-value registry contract with admin-controlled writes",
  "permissions": {
    "admin": ["set_value", "remove_value"],
    "public": ["get_value"]
  },
  "code": "#[starknet::interface]\ntrait IRegistry<T> {\n    fn set_value(ref self: T, key: felt252, value: felt252);\n    fn remove_value(ref self: T, key: felt252);\n    fn get_value(self: @T, key: felt252) -> felt252;\n}\n\n#[starknet::contract]\nmod registry {\n    use starknet::ContractAddress;\n    use starknet::get_caller_address;\n\n    #[storage]\n    struct Storage {\n        values: LegacyMap::<felt252, felt252>,\n        admin: ContractAddress\n    }\n\n    #[event]\n    #[derive(Drop, starknet::Event)]\n    enum Event {\n        ValueSet: ValueSet,\n        ValueRemoved: ValueRemoved\n    }\n\n    #[derive(Drop, starknet::Event)]\n    struct ValueSet {\n        key: felt252,\n        value: felt252\n    }\n\n    #[derive(Drop, starknet::Event)]\n    struct ValueRemoved {\n        key: felt252\n    }\n\n    #[constructor]\n    fn constructor(ref self: ContractState, admin: ContractAddress) {\n        self.admin.write(admin);\n    }\n\n    #[abi(embed_v0)]\n    impl RegistryImpl of super::IRegistry<ContractState> {\n        fn set_value(ref self: ContractState, key: felt252, value: felt252) {\n            assert(get_caller_address() == self.admin.read(), \"Caller is not admin\");\n            self.values.write(key, value);\n            self.emit(Event::ValueSet(ValueSet { key, value }));\n        }\n\n        fn remove_value(ref self: ContractState, key: felt252) {\n            assert(get_caller_address() == self.admin.read(), \"Caller is not admin\");\n            self.values.write(key, 0);\n            self.emit(Event::ValueRemoved(ValueRemoved { key }));\n        }\n\n        fn get_value(self: @ContractState, key: felt252) -> felt252 {\n            self.values.read(key)\n        }\n    }\n}"
}
```