mod tests {
    use starknet::class_hash::ClassHash;

    use starknet::ContractAddress;
    use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};

    use contracts::upgradable::{
        UpgradeableContract_V0, IUpgradeableContractDispatcher, IUpgradeableContractDispatcherTrait,
        UpgradeableContract_V1,
    };

    use core::num::traits::Zero;


    fn deploy_v0() -> (IUpgradeableContractDispatcher, ContractAddress, ClassHash) {
        //  First declare the contract
        let contract = declare("UpgradeableContract_V0").unwrap();
        let contract_class = contract.contract_class();

        let (contract_address, _) = contract_class.deploy(@array![]).unwrap();

        (
            IUpgradeableContractDispatcher { contract_address },
            contract_address,
            UpgradeableContract_V0::TEST_CLASS_HASH.try_into().unwrap(),
        )
    }

    //  deploy v1 contract
    fn deploy_v1() -> (IUpgradeableContractDispatcher, ContractAddress, ClassHash) {
        //  First declare the contract
        let contract = declare("UpgradeableContract_V1").unwrap();
        let contract_class = contract.contract_class();

        let (contract_address, _) = contract_class.deploy(@array![]).unwrap();
        (
            IUpgradeableContractDispatcher { contract_address },
            contract_address,
            UpgradeableContract_V1::TEST_CLASS_HASH.try_into().unwrap(),
        )
    }


    #[test]
    fn test_deploy_v0() {
        deploy_v0();
    }

    #[test]
    fn test_deploy_v1() {
        deploy_v1();
    }

    #[test]
    fn test_version_from_v0() {
        let (dispatcher, _, _) = deploy_v0();
        assert(dispatcher.version() == 0, 'incorrect version');
    }

    #[test]
    #[should_panic(expected: 'Class hash cannot be zero')]
    fn test_upgrade_when_classhash_is_zero() {
        let (dispatcher_v0, _, _) = deploy_v0();
        dispatcher_v0.upgrade(Zero::zero());
    }
}

