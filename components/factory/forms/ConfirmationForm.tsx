import { cosmos, osmosis } from '@manifest-network/manifestjs';
import {
  MsgCreateDenom,
  MsgSetDenomMetadata,
} from '@manifest-network/manifestjs/dist/codegen/osmosis/tokenfactory/v1beta1/tx';
import { useQueryClient } from '@tanstack/react-query';
import { Any } from 'cosmjs-types/google/protobuf/any';
import Image from 'next/image';
import React, { useState } from 'react';

import { SignModal } from '@/components/react';
import env from '@/config/env';
import { TokenFormData } from '@/helpers/formReducer';
import { useFeeEstimation } from '@/hooks/useFeeEstimation';
import { useTx } from '@/hooks/useTx';

export default function ConfirmationForm({
  nextStep,
  prevStep,
  formData,
  address,
}: Readonly<{
  nextStep: () => void;
  prevStep: () => void;
  formData: TokenFormData;
  address: string;
}>) {
  const { tx, isSigning } = useTx(env.chain);
  const { estimateFee } = useFeeEstimation(env.chain);
  const { setDenomMetadata, createDenom } =
    osmosis.tokenfactory.v1beta1.MessageComposer.withTypeUrl;
  const { submitProposal } = cosmos.group.v1.MessageComposer.withTypeUrl;
  const queryClient = useQueryClient();
  const [imageError, setImageError] = useState(false);

  const effectiveAddress =
    formData.isGroup && formData.groupPolicyAddress ? formData.groupPolicyAddress : address;

  const getDenomInfo = (subdenom: string) => {
    const prefixedSubdenom = 'u' + subdenom;
    const symbol = (subdenom.startsWith('u') ? subdenom.slice(1) : subdenom).toUpperCase();
    const fullDenom = `factory/${effectiveAddress}/${prefixedSubdenom}`;
    return { prefixedSubdenom, symbol, fullDenom };
  };

  const { prefixedSubdenom, symbol, fullDenom } = getDenomInfo(formData.subdenom);

  const handleConfirm = async () => {
    const createAsGroup = async () => {
      const msg = submitProposal({
        groupPolicyAddress: formData.groupPolicyAddress || '',
        messages: [
          Any.fromPartial({
            typeUrl: MsgCreateDenom.typeUrl,
            value: MsgCreateDenom.encode(
              createDenom({
                sender: formData.groupPolicyAddress || '',
                subdenom: prefixedSubdenom,
              }).value
            ).finish(),
          }),
          Any.fromPartial({
            typeUrl: MsgSetDenomMetadata.typeUrl,
            value: MsgSetDenomMetadata.encode(
              setDenomMetadata({
                sender: formData.groupPolicyAddress || '',
                metadata: {
                  description: formData.description,
                  denomUnits: [
                    {
                      denom: fullDenom,
                      exponent: 0,
                      aliases: [formData.display],
                    },
                    {
                      denom: formData.display,
                      exponent: 6,
                      aliases: [fullDenom],
                    },
                  ],
                  base: fullDenom,
                  display: formData.display,
                  name: formData.name,
                  symbol: formData.display,
                  uri: formData.uri,
                  uriHash: formData.uriHash,
                },
              }).value
            ).finish(),
          }),
        ],
        metadata: '',
        proposers: [address],
        title: `Create ${formData.display} denom and set metadata`,
        summary: `This proposal create the ${formData.display} denom and set its metadata`,
        exec: 0,
      });

      await tx([msg], {
        fee: () => estimateFee(address, [msg]),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['allMetadatas'] });
          queryClient.invalidateQueries({ queryKey: ['metadata'] });
          queryClient.invalidateQueries({ queryKey: ['denoms'] });
          queryClient.invalidateQueries({ queryKey: ['balances'] });
          queryClient.invalidateQueries({ queryKey: ['totalSupply'] });
          nextStep();
        },
        returnError: true,
      });
    };

    const createAsUser = async () => {
      // First, create the denom
      const createDenomMsg = createDenom({
        sender: address,
        subdenom: prefixedSubdenom,
      });

      // If createDenom is successful, proceed with setDenomMetadata
      const setMetadataMsg = setDenomMetadata({
        sender: address,
        metadata: {
          description: formData.description,
          denomUnits: [
            {
              denom: fullDenom,
              exponent: 0,
              aliases: [symbol],
            },
            {
              denom: formData.display,
              exponent: 6,
              aliases: [fullDenom],
            },
          ],
          base: fullDenom,
          display: formData.display,
          name: formData.name,
          symbol: formData.display,
          uri: formData.uri,
          uriHash: formData.uriHash,
        },
      });

      await tx([createDenomMsg, setMetadataMsg], {
        fee: () => estimateFee(address, [createDenomMsg, setMetadataMsg]),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['allMetadatas'] });
          queryClient.invalidateQueries({ queryKey: ['metadata'] });
          queryClient.invalidateQueries({ queryKey: ['denoms'] });
          queryClient.invalidateQueries({ queryKey: ['balances'] });
          queryClient.invalidateQueries({ queryKey: ['totalSupply'] });

          nextStep();
        },
        returnError: true,
      });
    };

    try {
      formData.isGroup ? await createAsGroup() : await createAsUser();
    } catch (error) {
      console.error('Error during transaction setup:', error);
    }
  };

  return (
    <section>
      <div className="w-full dark:bg-[#FFFFFF0F] bg-[#FFFFFFCC] p-[24px] rounded-[24px]">
        <div className="flex justify-center p-4 rounded-[8px] mb-6 w-full dark:bg-[#FAFAFA1F] bg-[#A087FF1F] items-center gap-4">
          {formData.uri && !imageError && (
            <Image
              src={formData.uri}
              alt={`${formData.name} logo`}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          )}
          <h1 className="text-xl text-primary font-bold">{formData.name}</h1>
        </div>

        <div className="space-y-6">
          {/* Token Information */}
          <div>
            <h2 className="text-xl font-semibold mb-4 ">Token Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-base-300 p-4 rounded-[12px]">
                <label className="text-sm text-gray-500 dark:text-gray-400">Ticker</label>
                <div className="">{formData.symbol || formData.display}</div>
              </div>
              <div className="bg-base-300 p-4 rounded-[12px]">
                <label className="text-sm text-gray-500 dark:text-gray-400">Logo</label>
                <div className="flex items-center gap-2">
                  {formData.uri && !imageError ? (
                    <div className="flex items-center gap-2">
                      <Image
                        src={formData.uri}
                        alt={`${formData.name} logo`}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={() => setImageError(true)}
                        onLoad={() => setImageError(false)}
                      />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        ✓ Valid image
                      </span>
                    </div>
                  ) : formData.uri && imageError ? (
                    <span className="text-sm text-red-600 dark:text-red-400">
                      ✗ Invalid image URL
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      No logo provided
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 bg-base-300 p-4 rounded-[12px]">
              <label className="text-sm text-gray-500 dark:text-gray-400">Description</label>
              <div className="break-words" title={formData.description}>
                {formData.description}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-6  mt-6 mx-auto w-full">
        <button
          onClick={prevStep}
          className="btn btn-neutral dark:text-white text-black w-[calc(50%-12px)]"
          disabled={isSigning}
        >
          Back: Token Metadata
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSigning}
          className="w-[calc(50%-12px)] btn px-5 py-2.5 sm:py-3.5 btn-gradient text-white disabled:text-black"
        >
          {isSigning ? (
            <span className="loading loading-dots loading-sm"></span>
          ) : (
            'Sign Transaction'
          )}
        </button>
      </div>

      <SignModal />
    </section>
  );
}
