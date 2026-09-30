import { ApiPrimaryAddress } from 'farcaster-client-data';
import { FC, useMemo } from 'react';

type AddressProps = {
  address: ApiPrimaryAddress;
};

const Address: FC<AddressProps> = ({ address }) => {
  const explorerUrl = useMemo(() => {
    if (address.protocol === 'ethereum') {
      return `https://etherscan.io/address/${address.address}`;
    }
    if (address.protocol === 'solana') {
      return `https://solscan.io/address/${address.address}`;
    }
    return '#';
  }, [address.protocol, address.address]);

  return (
    <li>
      <a href={explorerUrl} rel="nofollow">
        {address.address}
      </a>
    </li>
  );
};

Address.displayName = 'Address';

type AddressListProps = {
  addresses: ApiPrimaryAddress[];
};

const AddressList: FC<AddressListProps> = ({ addresses }) => {
  return (
    <ul>
      {addresses.map((address) => (
        <Address key={address.address} address={address} />
      ))}
    </ul>
  );
};

AddressList.displayName = 'AddressList';

export { AddressList };
