"use client";
import { useEffect, useRef, useState } from "react";
import { Signature } from "viem";
import { useSignTypedData } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { create } from "ipfs-http-client";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  width: 100%;
`;

const Form = styled.form`
  background: #228B22;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 12px;
  border-radius: 4px;
  border: 2px solid #ddd;
  &:focus {
    border-color: #0056b3;
    outline: none;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  color: black;
  background-color: #48bb78;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #36a167;
  }
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const StyledLabel = styled.label`
  font-size: 16px;
  color: #333;
`;

export const IPFSSign = ({ address }) => {
  const [signature, setSignature] = useState<Signature | null>(null);
  const [cid, setCid] = useState("");
  const [hashMessage, setHashMessageString] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const APIKEY = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;
  const SECRET = process.env.NEXT_PUBLIC_INFURA_SECRET;
  const auth = "Basic " + btoa(`${APIKEY}:${SECRET}`);
  const client = create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
      authorization: auth,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      console.log(file);
      setIsFileUploaded(false);
      setIsSigned(false);
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // This will prevent the form from submitting traditionally and refreshing the page.
    
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
  
    const reader = new FileReader();
    reader.onloadend = async () => {
      const content = Buffer.from(reader.result as ArrayBuffer);
      const added = await client.add(content);
      setCid(added.path);
      setIsFileUploaded(true);
      alert('File uploaded and CID set!');
    };
    reader.readAsArrayBuffer(file);
  };
  

  const { data: contractInfo } = useDeployedContractInfo("Profiles");

  const domain = {
    name: "TokenProfile",
    version: "1",
    chainId: 84532,
    verifyingContract: contractInfo?.address,
  };

  const types = {
    Message: [
      { name: "_ipfsHash", type: "string" },
      { name: "_contract", type: "address" },
    ],
  };

  useEffect(() => {
  const timestamp_string = Date.now().toString();
  const hashMessage = `${cid}${timestamp_string}`;
  setHashMessageString(hashMessage);
  }, [cid]);

  const message = {
    _ipfsHash: hashMessage,
    _contract: address,
  };

  const { data, isError, isLoading, isSuccess, signTypedData } = useSignTypedData({
    domain,
    types,
    message,
    primaryType: "Message",
  });


  // Method to interact with the contract
  const {
    writeAsync: setIpfsHash,
    isLoading: setIpfsHashLoading,
    isSuccess: isSetIpfsHashSuccess,
    isError: isSetIpfsHashError,
  } = useScaffoldContractWrite({
    contractName: "Profiles",
    functionName: "setIpfsHash",
    args: [cid, hashMessage, address, data]
  });

  const {
    writeAsync: setDescriptionForAddress,
    isLoading: setDescriptionLoading,
    isSuccess: setDescriptionSuccess,
    isError: setDescriptionError,
  } = useScaffoldContractWrite({
    contractName: "Profiles",
    functionName: "setDescription",
    args: [hashMessage, address, data, description]
  });

   // Effect to trigger setIpfsHash after successful signing

  useEffect(() => {
    if (isSuccess) {
      setIsSigned(true);
      setSignature(data);
    }
  }, [data, isSuccess]);

  return (
    <Container>
    <Form>
      <StyledLabel>Profile Image IPFS Hash</StyledLabel>
      <Input
        type="text"
        value={cid}
        onChange={(e) => setCid(e.target.value)}
        placeholder="Enter IPFS CID or choose file to upload"
      />
      <Button type="button" onClick={() => inputFileRef.current?.click()} disabled={isFileUploaded}>Choose File</Button>
      <input
        type="file"
        ref={inputFileRef}
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />
      <Button type="button" onClick={handleSubmit} disabled={!file || isFileUploaded}>Upload to IPFS</Button>
      <Button type="button" disabled={!isFileUploaded || isLoading || isSigned} onClick={() => signTypedData()}>
        Sign and Submit
      </Button>
      <Button type="button" disabled={!isSigned || setIpfsHashLoading} onClick={() => setIpfsHash()}>
        Set Profile Image
      </Button>
      {isError && <div>Error signing message</div>}
      {isSetIpfsHashError && <div>Error setting IPFS hash.</div>}
      <StyledLabel>Description</StyledLabel>
      <Input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter description (max 255 characters)"
        maxLength={255}
      />
      <Button type="button" disabled={!isSigned || setDescriptionLoading} onClick={() => setDescriptionForAddress()}>
        Set Description
      </Button>
    </Form>
  </Container>
  );
};

export default IPFSSign;
