import Image from 'next/image';
import Link from 'next/link';

import { TruncatedAddressWithCopy } from '@/components/react/addressCopy';
import { TokenFormData } from '@/helpers';

export default function Success({
  formData,
  address,
}: Readonly<{
  formData: TokenFormData;
  address: string;
}>) {
  const effectiveAddress =
    formData.isGroup && formData.groupPolicyAddress ? formData.groupPolicyAddress : address;
  const fullDenom = `factory/${effectiveAddress}/${formData.subdenom}`;

  return (
    <section className="lg:max-h-[90vh] max-h-screen lg:mt-1 mt-12 flex items-center justify-center">
      <div className="max-w-2xl mx-auto bg-base-300 shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-4">Success!</h1>
        {formData.isGroup ? (
          <>
            <p className="text-lg mb-2 text-pretty">
              Your token creation proposal was successfully created.
            </p>
            <p className="text-md text-content-muted mb-6 text-pretty">
              You can now vote on the proposal to create the token.
            </p>
          </>
        ) : (
          <>
            <p className="text-lg mb-2 text-pretty">
              Your token was successfully created and the metadata was set.
            </p>
            <p className="text-md text-content-muted mb-6 text-pretty">
              You can now mint, burn, or change the admin of your tokens and send them to other
              wallets.
            </p>
          </>
        )}

        <div className="text-md text-content-muted mb-6 text-pretty">
          The full denom of your token is:{' '}
          <span className="font-semibold">
            <TruncatedAddressWithCopy address={fullDenom} />
          </span>
        </div>
        <div className="border-t border-line pt-4">
          <h2 className="text-2xl font-semibold mb-4">Token Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-light text-content-muted">NAME</h3>
              <div className="flex flex-row items-center gap-2 justify-start">
                {formData.uri && (
                  <Image
                    src={formData.uri}
                    alt={formData.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <p className="text-lg font-medium">{formData.name}</p>
              </div>
            </div>
            <div>
              <h3 className="text-md font-light text-content-muted">TICKER</h3>
              <p className="text-lg font-medium">{formData.display}</p>
            </div>
            <div className="col-span-1 md:col-span-2 max-h-28 overflow-y-auto">
              <h3 className="text-md font-light text-content-muted">DESCRIPTION</h3>
              <p className="text-lg font-medium">{formData.description}</p>
            </div>
            {formData.uri && (
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-md font-light text-content-muted">Logo URL</h3>
                <p className="text-lg font-medium truncate">{formData.uri}</p>
              </div>
            )}
          </div>
          <div className="mt-6">
            <div className="w-full justify-between items-center">
              {formData.isGroup ? (
                <Link
                  href={`/groups?policyAddress=${formData.groupPolicyAddress}&tab=proposals`}
                  legacyBehavior
                >
                  <button className="btn btn-md btn-secondary w-full">
                    Back to Group Proposals
                  </button>
                </Link>
              ) : (
                <Link href={'/factory'} legacyBehavior>
                  <button className="btn btn-md btn-secondary w-full">Back to Factory</button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
